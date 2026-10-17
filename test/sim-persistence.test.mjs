/**
 * test/sim-persistence.test.mjs — 仿真态的**落盘与跨重启恢复**（0.1.10，路线图 E2）。
 *
 * ## 为什么必须有这个文件
 *
 * "仿真态"从前只活在宿主进程内存里（`simConfig`）：宿主一重启，那份"应该有一台什么仿真"的记忆
 * 就没了，自愈自然也就无从谈起 —— 表现是"上次明明开着，重启后一切从头开始，且没有任何说明"。
 * 现在它落盘。这份能力有两个容易悄悄退化的点，都必须由**行为**测试钉住：
 *   1. 形状与容错：坏 JSON / 版本不认识 / `enabled:false` / 没型号 —— 一律读成"没有记忆"，
 *      绝不能因此让插件启动失败或恢复出一台空型号的机器人。
 *   2. 接线：`apply()` 真的会读到它并按它恢复；`persistSimState:false` 时**连读都不读**。
 *      （就是这条接线在本轮第一次跑测试时暴露了真实缺陷：测试把状态写进了开发者本机的
 *      `~/.dsh`，随后每次 apply() 都多发一条 sim_start —— 所以测试**必须**隔离数据目录。）
 *
 * 运行：node --test test/sim-persistence.test.mjs
 */

import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { TWIN_SIM_PATH } from '../lib/twin-paths.js'
import {
  SIM_STATE_VERSION,
  dshHome,
  readSimState,
  simStatePath,
  writeSimState,
} from '../lib/sim-state.js'

// 只桩掉两个 peer 依赖（它们的真实实现不在本仓库）；worker.js 与 index.js 真实加载。
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@deepseek-ai/dsh-tools') return { url: 'stub:dsh-tools', shortCircuit: true }
    if (specifier === '@deepseek-ai/schemastery') return { url: 'stub:schemastery', shortCircuit: true }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url === 'stub:dsh-tools') {
      return { format: 'module', shortCircuit: true, source: 'export function defineTool(spec) { return spec }' }
    }
    if (url === 'stub:schemastery') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const chain = new Proxy(function () {}, {
            get: () => (...a) => chain,
            apply: () => chain,
            construct: () => chain,
          })
          const z = new Proxy({}, { get: () => chain, apply: () => chain })
          export default z
        `,
      }
    }
    return nextLoad(url, context)
  },
})

const dirs = []
after(async () => {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true })
})

async function tempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'ursim-sim-state-'))
  dirs.push(dir)
  return dir
}

/** 让"发起但不等待"的恢复有足够的机会跑完（它只 await 一个立刻 resolve 的 stub）。 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

/* ─────────────────────────── 形状与容错 ─────────────────────────── */

test('★ simStatePath：显式路径优先，否则落在 DSH 数据目录的插件子目录里', () => {
  assert.equal(simStatePath({ file: 'D:/tmp/x.json', env: {} }), 'D:/tmp/x.json')
  const viaEnv = simStatePath({ env: { DSH_HOME: 'D:/dshhome' } })
  assert.match(viaEnv, /dshhome[\\/]plugin-data[\\/]dsh-nonead-ursim[\\/]sim-state\.json$/)
  // 没给 DSH_HOME 就退回 ~/.dsh（与宿主其它数据同处）
  assert.equal(dshHome({}), join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh'))
  assert.match(simStatePath({ env: {} }), /\.dsh[\\/]plugin-data[\\/]dsh-nonead-ursim/)
})

test('★ 落盘-读回：只有 enabled:true 才算"有记忆"，且型号缺失一律 fail-closed', async () => {
  const dir = await tempDir()
  const file = join(dir, 'nested', 'sim-state.json')

  // ① 开着：读回来就是重启后该恢复的那台
  assert.equal(writeSimState(file, { enabled: true, model: 'ur12e', preset: 'upright', speed_scaling: 1 }), true)
  assert.deepEqual(readSimState(file), { model: 'ur12e', preset: 'upright', speed_scaling: 1 })
  const raw = JSON.parse(await readFile(file, 'utf8'))
  assert.equal(raw.version, SIM_STATE_VERSION, '必须写版本号，形状变了才能拒绝旧文件')
  assert.equal(existsSync(`${file}.tmp`), false, '★ 原子写不得留下 .tmp')

  // ② 明确关掉：读回来是 null（= 不要恢复），但文件里如实记着 false
  assert.equal(writeSimState(file, { enabled: false }), true)
  assert.equal(readSimState(file), null)
  assert.equal(JSON.parse(await readFile(file, 'utf8')).enabled, false)

  // ③ 要落盘"开着"却没型号 ⇒ 拒绝写（否则读回来是一台空型号机器人）
  assert.equal(writeSimState(file, { enabled: true }), false)
  assert.equal(writeSimState(file, { enabled: true, model: '   ' }), false)
})

test('★ 容错：文件不存在 / 坏 JSON / 版本不认识 / 形状不对 ⇒ 一律读成"没有记忆"', async () => {
  const dir = await tempDir()
  assert.equal(readSimState(join(dir, 'nope.json')), null, '没文件是常态，不报错也不算有记忆')

  const bad = join(dir, 'bad.json')
  await writeFile(bad, '{ 这不是 JSON', 'utf8')
  assert.equal(readSimState(bad), null)

  const oldVersion = join(dir, 'old.json')
  await writeFile(oldVersion, JSON.stringify({ version: 99, enabled: true, model: 'ur5e' }), 'utf8')
  assert.equal(readSimState(oldVersion), null)

  for (const shape of [[], 'x', 42, { version: SIM_STATE_VERSION, enabled: true }, { version: SIM_STATE_VERSION }]) {
    const f = join(dir, `shape-${Math.random().toString(16).slice(2)}.json`)
    await writeFile(f, JSON.stringify(shape), 'utf8')
    assert.equal(readSimState(f), null, `形状不对必须忽略：${JSON.stringify(shape)}`)
  }
})

/* ─────────────────────── 接线：apply() 真的会恢复 ─────────────────────── */

/**
 * 驱动真实的 `apply()`（只桩 worker 的 `call`），并把工具调用录下来。
 *
 * ⚠️ `simStateFile` 必须指向临时目录：落盘默认落在**开发者本机**的 `~/.dsh`，测试若用它，
 * 既会弄脏真实配置、又会让后续每次 apply() 都自动多发一条 sim_start。
 *
 * `mountRoutes:true` 时同步模拟 cordis 的 `ctx.inject(['webServer'], cb)` 装配（宿主侧路由是
 * 纯 `{status, headers, body}` 逻辑，可以直接用假 req/res 驱动），用于断言面板 I/O 写路由的
 * 409/200 —— 也就是宿主侧 `simIps` 登记到底有没有更新。
 */
async function drive({ config = {}, replies = {}, mountRoutes = false } = {}) {
  const { UrWorker } = await import('../lib/worker.js')
  const mod = await import('../lib/index.js')
  const calls = []
  UrWorker.prototype.stats = function stats() {
    return { respawnCount: 0, running: true, disposed: false, pid: 1234 }
  }
  UrWorker.prototype.call = async function call(op, params) {
    calls.push({ op, params })
    if (typeof replies[op] === 'function') return replies[op](params)
    return { message: `stub:${op}`, data: { op, params } }
  }
  const registered = new Map()
  const routes = new Map()
  const hostCtx = {
    logger: { info() {}, warn() {}, error() {} },
    effect: (fn) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    webServer: {
      register: (route) => {
        routes.set(route.path, route)
        return () => {}
      },
    },
  }
  mod.apply(
    {
      logger: { info() {}, warn() {}, error() {} },
      effect: () => () => {},
      get: () => undefined,
      inject: (_deps, callback) => {
        if (mountRoutes) callback(hostCtx)
        return () => {}
      },
      tools: { register: (tool) => registered.set(tool.name, tool) },
    },
    { persistSimState: true, ...config },
  )
  await settle()
  return { calls, registered, routes }
}

const simStarted = { sim_start: () => ({ message: 'stub', data: { active: true, model: 'ur12e' } }) }

test('★ 宿主重启后按落盘配置恢复仿真：恰好一次 sim_start，且参数就是上次那台', async () => {
  const dir = await tempDir()
  const file = join(dir, 'sim-state.json')
  writeSimState(file, { enabled: true, model: 'ur10e', preset: 'reach', speed_scaling: 0.5 })

  const { calls } = await drive({ config: { simStateFile: file }, replies: simStarted })
  assert.deepEqual(calls.map((c) => c.op), ['sim_start'], '★ 重启后必须按记忆把仿真拉起来')
  assert.deepEqual(calls[0].params, { model: 'ur10e', preset: 'reach', speed_scaling: 0.5 })
})

test('★ 用户明确关掉的仿真不得被重启复活；坏文件同样什么都不做', async () => {
  const dir = await tempDir()
  const off = join(dir, 'off.json')
  writeSimState(off, { enabled: false })
  const a = await drive({ config: { simStateFile: off }, replies: simStarted })
  assert.deepEqual(a.calls, [], '★ enabled:false ⇒ 一个仿真 op 都不发')

  const bad = join(dir, 'bad.json')
  await writeFile(bad, 'not json', 'utf8')
  const b = await drive({ config: { simStateFile: bad }, replies: simStarted })
  assert.deepEqual(b.calls, [], '坏文件按"没有记忆"处理')
})

test('★ persistSimState:false ⇒ 连读都不读（磁盘上有"开着"的记忆也不恢复）', async () => {
  const dir = await tempDir()
  const file = join(dir, 'sim-state.json')
  writeSimState(file, { enabled: true, model: 'ur12e' })
  const { calls } = await drive({ config: { persistSimState: false, simStateFile: file }, replies: simStarted })
  assert.deepEqual(calls, [], '关掉落盘就必须彻底不碰它')
})

test('★ 开关仿真会把意图写进文件：开着写 enabled:true（含型号），关掉写 enabled:false', async () => {
  const dir = await tempDir()
  const file = join(dir, 'sim-state.json')
  const { registered, calls } = await drive({
    config: { simStateFile: file },
    replies: {
      sim_start: (p) => ({ message: 'stub', data: { active: true, model: p.model } }),
      sim_stop: () => ({ message: 'stub', data: { active: false } }),
    },
  })
  assert.equal(calls.length, 0, '没有落盘记忆时不该自己开仿真')

  const exec = { agent: {} }
  await registered.get('ursim_sim_start').execute({ model: 'ur5e', preset: 'zero', speed_scaling: 1 }, exec)
  assert.deepEqual(readSimState(file), { model: 'ur5e', preset: 'zero', speed_scaling: 1 },
    '★ 开起来就要落盘，重启后才谈得上恢复')

  await registered.get('ursim_sim_stop').execute({}, exec)
  assert.equal(readSimState(file), null, '★ 关掉后不得再被恢复')
  assert.equal(JSON.parse(await readFile(file, 'utf8')).enabled, false)
})

/* ───────────── P0-4：connect / disconnect 也是仿真生命周期 ─────────────
 *
 * python 侧 `op_connect` 会**隐式开仿真**、`op_disconnect` 会**停仿真**（见 ur_worker.py）。
 * 宿主以前只在 sim_start/sim_stop 分支写 simIps / simConfig / 落盘，于是 connect 之后：
 * 仿真目标被误弹审批、面板 I/O 写回 409、子进程被换后自愈没有记忆可重建；disconnect 之后
 * 宿主以为仿真还在、python 已停。现在三条入口共用同一个登记口（`applySimLifecycle`）。
 */

/** 真实 `op_connect` 的形状：确保仿真在跑，然后返回 `sim_status` 那一份。 */
const CONNECT_REPLY = () => ({
  message: '已连接：离线仿真机器人（UR12E）在保留地址 127.0.0.1。',
  data: {
    simulated: true,
    active: true,
    connected: true,
    ip: '127.0.0.1',
    model: 'UR12E',
    model_id: 'ur12e',
    preset: 'upright',
    speed_scaling: 1,
  },
})

/** 真实 `op_disconnect` 的形状：停掉仿真。 */
const DISCONNECT_REPLY = () => ({
  message: '连接已断开：离线仿真已停止。',
  data: { simulated: false, active: false, ip: '127.0.0.1' },
})

test('★ P0-4：connect 的隐式开仿真必须落盘记忆；disconnect 必须落盘 enabled:false', async () => {
  const dir = await tempDir()
  const file = join(dir, 'sim-state.json')
  const { registered, calls } = await drive({
    config: { simStateFile: file },
    replies: { connect: CONNECT_REPLY, disconnect: DISCONNECT_REPLY },
  })
  assert.equal(calls.length, 0, '没有落盘记忆时不该自己开仿真')

  const exec = { agent: {} }
  await registered.get('ursim_connect').execute({}, exec)
  assert.deepEqual(
    readSimState(file),
    { model: 'ur12e', preset: 'upright', speed_scaling: 1 },
    '★ connect = 确保仿真在跑，必须与 sim_start 一样记住配置（否则子进程被换后无法按型号重建）',
  )

  await registered.get('ursim_disconnect').execute({}, exec)
  assert.equal(readSimState(file), null, '★ disconnect = 停仿真，重启后不得把它复活')
  assert.equal(JSON.parse(await readFile(file, 'utf8')).enabled, false)
})

test('★ P0-4：connect 之后面板 I/O 写不再 409（宿主 simIps 登记与 python 侧一致）', async () => {
  const dir = await tempDir()
  const file = join(dir, 'sim-state.json')
  const { registered, calls, routes } = await drive({
    config: { simStateFile: file },
    replies: { connect: CONNECT_REPLY },
    mountRoutes: true,
  })
  const route = routes.get(TWIN_SIM_PATH)
  assert.ok(route, '仿真开关写路由必须被挂载')

  /** 以浏览器同源写请求的形状驱动 POST 路由（信任围栏 + 4 KB 请求体 + JSON content-type 都满足）。 */
  const postIoWrite = async () => {
    const req = new EventEmitter()
    req.method = 'POST'
    req.url = TWIN_SIM_PATH
    req.headers = {
      host: '127.0.0.1:12460',
      origin: 'http://127.0.0.1:12460',
      'content-type': 'application/json',
    }
    let status = null
    let raw = ''
    const res = {
      writeHead: (code) => { status = code },
      end: (chunk) => { raw = chunk ?? '' },
    }
    const done = route.handler(req, res)
    setImmediate(() => {
      req.emit('data', Buffer.from(JSON.stringify({ io: { kind: 'digital_out', n: 0, value: true } })))
      req.emit('end')
    })
    await done
    return { status, body: JSON.parse(raw) }
  }

  // ① 还没 connect：仿真没在跑 ⇒ 409（既有行为，也是这条用例的对照）。
  const before = await postIoWrite()
  assert.equal(before.status, 409, '没有正在运行的仿真时面板 I/O 写必须被拒')
  assert.equal(before.body.code, 'SIM_NOT_RUNNING')

  // ② connect（python 会隐式开仿真）之后：宿主必须把保留地址登记成"正在运行的仿真"。
  await registered.get('ursim_connect').execute({}, { agent: {} })
  const after = await postIoWrite()
  assert.notEqual(
    after.status,
    409,
    '★ connect 之后面板 I/O 写不得再 409（宿主的 simIps 必须与 python 侧一致）',
  )
  assert.equal(after.status, 200)
  assert.equal(after.body.ok, true)
  assert.equal(calls.at(-1).op, 'set_digital_out', '写必须真的下发到 worker')
  assert.deepEqual(calls.at(-1).params, { ip: '127.0.0.1', n: 0, value: true })
})
