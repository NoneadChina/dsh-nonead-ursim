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
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
 */
async function drive({ config = {}, replies = {} } = {}) {
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
  mod.apply(
    {
      logger: { info() {}, warn() {}, error() {} },
      effect: () => () => {},
      get: () => undefined,
      inject: () => () => {},
      tools: { register: (tool) => registered.set(tool.name, tool) },
    },
    { persistSimState: true, ...config },
  )
  await settle()
  return { calls, registered }
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
