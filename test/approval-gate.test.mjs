/**
 * test/approval-gate.test.mjs — 运动审批门禁的**行为**测试（不是声明测试）。
 *
 * ## 为什么必须有这个文件
 * 门禁是语言模型与一台真机械臂之间唯一的那道人工确认。此前没有任何测试真正**驱动**过它：
 * 唯一的引用是 `tool-frame-moves.test.mjs` 里对 `APPROVAL_OPS` *声明*的一行正则，因此把
 * `lib/index.js` 里 `execute()` 的门禁语句整段删掉，21 个测试文件依然全绿 —— 一次静默的
 * 安全回归可以完全不被察觉。
 *
 * 本文件用真实的 `apply()` + 真实的 `defineTool`（只桩掉 peer）驱动，并断言四件事：
 *   1. **开启门禁时**（`requireApprovalForMotion: true`）：受门禁的 op 批准前**绝不**到达
 *      worker；批准后才放行。
 *   2. 拒绝 / 未组合审批服务 / 无 agent ⇒ 三种情况都**失败关闭**（fail-closed），且不下发。
 *   3. 门禁只在**显式** `true` 时生效：产品默认（`requireApprovalForMotion: false`，0.2.3 起）
 *      与显式 `false` 都不过门禁。`harness()` 因此默认注入 `requireApprovalForMotion: true`，
 *      让本文件其余用例测的始终是"门禁开启"的行为；"缺省不门禁"由文末那条用例单独钉住。
 *   4. **回归守卫**：模型多传一个 `op` 字段无法把调用改派到别的 op。
 *      `lib/worker.js` 拼载荷时是 `{ id, op, _timeout_ms, ...params }`，`params` 展开在最后，
 *      而门禁判定用的是闭包里的 `op` —— 于是"未受门禁的工具 + 多传 op=power_off"曾经能
 *      绕过全部 38 个受门禁指令（host-audit H-1）。现在线上参数按工具声明白名单过滤。
 *
 * 运行：node test/approval-gate.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// 只桩掉两个 peer 依赖；worker.js 是本地文件，真实加载。
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
      // 必须既能链式调用（`z.object({...}).default(...)`）又能**被调用**（`z.string()`），
      // 否则真实的 `mod.apply()` 会在解析 Config 时抛错并被它自己的 try/catch 吞掉 ——
      // 表现是"一个工具都没注册"，而不是失败得清楚。
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

/**
 * 驱动真实的 apply()，拿到注册的 tool 定义，并把 worker 换成记录器。
 *
 * ⚠️ 顺序很重要：`apply()` 会**当场**新建 `UrWorker` 并在闭包里捕获它，所以必须在调用
 * `apply()` **之前**替换 `UrWorker.prototype.call` —— 否则记录器接不上，测试会对着一个真去
 * spawn 子进程的 worker 断言（表现为"没有调用记录"，而不是失败得清楚）。
 */
async function harness({ config = {}, approvalOutcome = 'allowed-once', approvalService = 'present', replies = {}, stats = null, gateEnabled = true } = {}) {
  const mod = await import('../lib/index.js')
  const { UrWorker } = await import('../lib/worker.js')
  const registered = new Map()
  const calls = []
  const approvalRequests = []
  const effects = []

  /*
   * 子进程代次可注入：仿真的自愈靠它判断"子进程是不是被换过"（见 lib/index.js 的
   * installSimSelfHealing）。`stats` 是可变对象（`{ respawn: 0 }`），测试直接改它来模拟
   * "子进程被替换、内存里的虚拟机器人丢了"。
   */
  if (stats !== null) {
    // ⚠️ 必须是**匿名**函数：写成 `function stats()` 会让函数自身的名字遮蔽外层的 `stats`
    // 变量，于是 `stats.respawn` 恒为 undefined —— 表现是"测试通过不了但看不出为什么"。
    UrWorker.prototype.stats = function () {
      return { respawnCount: stats.respawn, running: true, disposed: false, pid: 1234 }
    }
  }

  UrWorker.prototype.call = async function call(op, params) {
    calls.push({ op, params })
    // `replies` 让个别 op 回一个**真实的信封形状**（例如 sim_start 必须回 `active:true`，
    // 宿主才会把保留地址登记成"正在运行的仿真"）。
    if (typeof replies[op] === 'function') return replies[op](params)
    if (replies[op] !== undefined) return replies[op]
    return { message: `stub:${op}`, data: { op, params } }
  }

  const approval =
    approvalService === 'missing'
      ? undefined
      : {
          async request(req) {
            approvalRequests.push(req)
            // 允许传函数：用于测试"审批进行中载荷被改动"这类时序场景（M-1）。
            if (typeof approvalOutcome === 'function') return approvalOutcome(req)
            if (approvalOutcome instanceof Error) throw approvalOutcome
            return approvalOutcome
          },
        }

  const ctx = {
    logger: { info() {}, warn() {}, error() {} },
    // 捕获 disposer：`ctx.effect(() => () => …)` 的清理函数必须能被测试拿到 —— 宿主在卸载时
    // 只 await **返回 thenable 的那些**，所以"清理有没有被 return"本身就是要断言的行为。
    effect: (fn) => {
      effects.push(fn)
      return () => {}
    },
    get: (name) => (name === 'approval' ? approval : undefined),
    inject: () => () => {},
    tools: { register: (tool) => registered.set(tool.name, tool) },
  }
  /*
   * ⚠️ `persistSimState: false` 是**必须的测试隔离**：0.1.10 起宿主会把"应该有一台什么仿真"
   * 落盘到 `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`。测试若让它落到本机真实
   * 数据目录，会造成两个后果：① 弄脏开发者的真实配置；② 从那一刻起**每一次** apply() 都读到
   * "上次仿真还开着"并自动发起一次 sim_start，于是所有断言录音里都多出一条 sim_start（本轮实测
   * 15 条用例一起变红，根因就是这个）。调用方仍可用显式配置覆盖它。
   *
   * ⚠️ `gateEnabled`（默认 `true`）由 harness 注入 `requireApprovalForMotion: true`。产品默认自
   * 0.2.3 起是 `false`（运动免人工确认），若不注入，本文件里那些"门禁开启时才成立"的用例会一个
   * 个退化成"命令照常下发"，测的就不再是它们声称要测的东西。`config` 展开在最后，调用方仍可
   * 显式覆盖（例如那两条专门测 `false` 的用例）。
   */
  mod.apply(ctx, { persistSimState: false, ...(gateEnabled ? { requireApprovalForMotion: true } : {}), ...config })

  return { registered, calls, approvalRequests, effects }
}

const AGENT = { id: 'agent-1' }
const exec = { agent: AGENT, signal: undefined }

/**
 * 离线仿真的回包（`sim_start` 必须回 `active:true` 才算开起来）。
 *
 * 这里给出真实信封形状：`worker.call()` resolve 的是信封里的 `data`，而 op 自己返回
 * `{message, data}` —— 所以载荷在再下一层（见 lib/twin-routes.js 的同类注释）。
 */
const SIM_REPLIES = {
  sim_start: (params) => ({
    message: `stub:sim_start(${params.model})`,
    data: { simulated: true, active: true, ip: '127.0.0.1', model: 'UR5e', model_id: params.model },
  }),
  sim_stop: { message: 'stub:sim_stop', data: { simulated: false, active: false, ip: '127.0.0.1' } },
}

test('受门禁的 op：批准前绝不下发；批准后才下发', async () => {
  const { registered, calls, approvalRequests } = await harness({ approvalOutcome: 'denied' })
  const movej = registered.get('ursim_movej')
  assert.ok(movej, '未注册 ursim_movej')

  await assert.rejects(
    () => movej.execute({ ip: '1.2.3.4', q: [0, 0, 0, 0, 0, 0] }, exec),
    /未获人工批准/,
    '被拒绝时必须抛错（fail-closed）',
  )
  assert.equal(calls.length, 0, '被拒绝的指令绝不能到达 worker')

  const ok = await harness({ approvalOutcome: 'allowed-once' })
  const movej2 = ok.registered.get('ursim_movej')
  await movej2.execute({ ip: '1.2.3.4', q: [0, 0, 0, 0, 0, 0] }, exec)
  assert.deepEqual(ok.calls.map((c) => c.op), ['movej'], '批准后必须下发到 worker')
  assert.equal(ok.approvalRequests.length, 1, '必须恰好请求一次人工确认')
  assert.equal(ok.approvalRequests[0].toolName, 'ursim_movej')
})

test('★ M-1：send_script 的审批理由必须给出全文规模与载荷指纹（不再只看前 240 字符）', async () => {
  const script = 'def dance():\n  movej([0, 0, 0, 0, 0, 0], a=1.2, v=0.25)\n  sleep(0.05)\nend\n'
  const { registered, calls, approvalRequests } = await harness({ approvalOutcome: 'allowed-once' })
  await registered.get('ursim_send_script').execute({ ip: '1.2.3.4', script }, exec)

  const reason = approvalRequests[0]?.reason ?? ''
  assert.match(reason, /4 行/, `审批理由必须给出行数（编辑器口径），实测：${reason}`)
  assert.match(reason, /字节/, `审批理由必须给出字节数，实测：${reason}`)
  assert.match(reason, /载荷 [0-9a-f]{16}/, `审批理由必须给出载荷指纹，实测：${reason}`)
  assert.ok(!reason.includes('sleep(0.05)') || reason.length < 400, '长脚本不得只靠截断示意')
  assert.deepEqual(calls.map((c) => c.op), ['send_script'], '批准后照常下发')
})

test('★ M-1：审批通过后载荷若被改动，一律不得下发（载荷指纹绑定）', async () => {
  // `sanitizeArgs()` 是浅拷贝 ⇒ 嵌套数组与调用方共享引用，审批窗口里**真的能**被改掉。
  // 真机上把 `task_frame` 改一格，力控压向的方向就变了 —— 这正是这条绑定要拦的。
  const taskFrame = [0, 0, 0, 0, 0, 0]
  const args = {
    ip: '1.2.3.4',
    task_frame: taskFrame,
    selection_vector: [0, 0, 1, 0, 0, 0],
    wrench: [0, 0, -10, 0, 0, 0],
  }
  const { registered, calls } = await harness({
    approvalOutcome: () => {
      taskFrame[2] = 999 // 审批进行中偷改载荷
      return 'allowed-once'
    },
  })
  await assert.rejects(
    () => registered.get('ursim_force_mode').execute(args, exec),
    /载荷在审批期间发生了变化/,
    '指纹不符必须拦住（否则等于批准了一个人没看过的载荷）',
  )
  assert.equal(calls.length, 0, '被改动的载荷绝不能到达 worker')
})

test('未受门禁的只读 op 不请求确认，且照常下发', async () => {
  const { registered, calls, approvalRequests } = await harness()
  await registered.get('ursim_get_tcp_pose').execute({ ip: '1.2.3.4' }, exec)
  assert.equal(approvalRequests.length, 0, '只读指令不该打扰人')
  assert.deepEqual(calls.map((c) => c.op), ['get_tcp_pose'])
})

test('fail-closed：无审批服务 / 无 agent / 审批抛异常，三种都不下发', async () => {
  // 1) 没有审批服务
  {
    const { registered, calls } = await harness({ approvalService: 'missing' })
    await assert.rejects(
      () => registered.get('ursim_power_off').execute({ ip: '1.2.3.4' }, exec),
      /未组合审批服务/,
    )
    assert.equal(calls.length, 0)
  }
  // 2) 有服务但这次调用没有 agent（无法路由到会话审批）
  {
    const { registered, calls } = await harness()
    await assert.rejects(
      () => registered.get('ursim_power_off').execute({ ip: '1.2.3.4' }, { signal: undefined }),
      /无 agent/,
    )
    assert.equal(calls.length, 0)
  }
  // 3) 审批服务自己抛异常 —— 绝不能被当成"默许"
  {
    const { registered, calls } = await harness({ approvalOutcome: new Error('backend down') })
    await assert.rejects(() => registered.get('ursim_power_off').execute({ ip: '1.2.3.4' }, exec), /backend down/)
    assert.equal(calls.length, 0, '审批服务异常时绝不能下发')
  }
  // 4) 非 allowed-once 的任何返回值都算未批准。
  //    注意：这里**不能**用 `undefined` 来代表"审批方没给结论" —— harness 的默认参数会在
  //    `undefined` 时回落到 'allowed-once'（JS 默认参数的语义），那样断言测的是别的东西。
  //    用 `null`（审批服务返回了空值），并且下面单独测一次"服务根本不返回值"。
  for (const outcome of ['denied', 'timeout', 'allowed-always', null, false, 0, '']) {
    const { registered, calls } = await harness({ approvalOutcome: outcome })
    await assert.rejects(
      () => registered.get('ursim_brake_release').execute({ ip: '1.2.3.4' }, exec),
      /未获人工批准/,
      `outcome=${String(outcome)} 必须被视为未批准`,
    )
    assert.equal(calls.length, 0)
  }
  // 5) 审批通道存在但**什么都不返回**（真实世界里的"没人应答"）
  {
    const mod = await import('../lib/index.js')
    const { UrWorker } = await import('../lib/worker.js')
    const calls = []
    UrWorker.prototype.call = async function (op, params) {
      calls.push({ op, params })
      return { message: 'stub', data: {} }
    }
    const registered = new Map()
    mod.apply(
      {
        logger: { info() {}, warn() {}, error() {} },
        effect: () => () => {},
        get: (n) => (n === 'approval' ? { async request() {} } : undefined),
        inject: () => () => {},
        tools: { register: (t) => registered.set(t.name, t) },
      },
      // 同 helper 里的理由：测试不得写本机真实的仿真态文件。
      // ⚠️ 门禁必须**显式**开启：产品默认自 0.2.3 起是 `false`，而"审批通道存在却什么都不返回"
      //    这条路径只在门禁开启时才存在（与 harness 注入 `requireApprovalForMotion: true` 同理）。
      { persistSimState: false, requireApprovalForMotion: true },
    )
    await assert.rejects(
      () => registered.get('ursim_brake_release').execute({ ip: '1.2.3.4' }, exec),
      /未获人工批准/,
    )
    assert.equal(calls.length, 0, '审批无应答时绝不能下发')
  }
})

test('显式 requireApprovalForMotion=false 覆盖时真正放行（不再请求确认）', async () => {
  const { registered, calls, approvalRequests } = await harness({
    config: { requireApprovalForMotion: false },
    approvalOutcome: 'denied',
  })
  await registered.get('ursim_power_off').execute({ ip: '1.2.3.4' }, exec)
  assert.equal(approvalRequests.length, 0, '显式关闭后不应再问')
  assert.deepEqual(calls.map((c) => c.op), ['power_off'])
})

/* ------------------------------------------------------------------ *
 * 离线仿真不弹人工确认（0.7.0）
 *
 * 仿真里没有可伤人的动作，弹窗只会让人以为"要动真机了"。豁免必须**同时**满足两个条件：
 * 目标是保留的回环地址，且宿主确实登记着一台正在运行的仿真 —— 二者缺一就必须照旧弹窗。
 * 这是安全门禁唯一的例外，所以三个方向（仿真放行 / 真机仍拦 / 没开仿真仍拦）都要钉住。
 * ------------------------------------------------------------------ */

test('★ 离线仿真目标不弹人工确认；真机 IP 与"没开仿真"的回环地址仍然必须弹', async () => {
  const { registered, calls, approvalRequests } = await harness({
    approvalOutcome: 'denied',
    replies: SIM_REPLIES,
  })

  // ① 还没开仿真：对保留地址的运动指令仍必须走人工确认（fail-closed ⇒ 被拒且不下发）
  await assert.rejects(
    () => registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0, 0, 0, 0, 0, 0] }, exec),
    /未获人工批准/,
    '仿真没开时，回环地址也不能免审批',
  )
  assert.equal(calls.length, 0, '被拒的指令绝不能到达 worker')
  assert.equal(approvalRequests.length, 1, '这一次必须真的问过（上一条断言的前提）')

  // ② 开仿真（sim_start 本身只读配置，不受门禁）
  await registered.get('ursim_sim_start').execute({ model: 'ur5e' }, exec)
  assert.equal(approvalRequests.length, 1, '开启仿真不该再弹审批')
  assert.deepEqual(calls.map((c) => c.op), ['sim_start'])

  // ③ 仿真目标：放行，且**一次审批都不问**
  await registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0, 0, 0, 0, 0, 0] }, exec)
  assert.equal(approvalRequests.length, 1, '★ 仿真目标不得弹人工确认')
  assert.deepEqual(calls.map((c) => c.op), ['sim_start', 'movej'])
  assert.equal(calls[1].params.ip, '127.0.0.1')

  // ③b 带首尾空白的回环地址：宿主必须**先归一化再判定**。旧写法是严格相等，于是 `" 127.0.0.1 "`
  //     被判成"真机目标"去弹审批（approval=never 的会话里表现为"命令被拒"，极易误诊成 worker
  //     故障），而 Python 侧却会 trim 后按仿真执行 —— 两侧口径不一致。
  await registered.get('ursim_movej').execute({ ip: ' 127.0.0.1 ', q: [0, 0, 0, 0, 0, 0] }, exec)
  assert.equal(approvalRequests.length, 1, '★ 带空白的回环地址同样不得弹人工确认')
  assert.equal(calls.at(-1).params.ip, '127.0.0.1', 'ip 必须归一化（trim）后再下发')

  // ④ 同一时刻对**真机** IP 的运动指令：照旧必须弹（本例 outcome=denied ⇒ 被拒）
  await assert.rejects(
    () => registered.get('ursim_movej').execute({ ip: '192.168.1.77', q: [0, 0, 0, 0, 0, 0] }, exec),
    /未获人工批准/,
    '★ 真机 IP 的审批绝不能因为仿真开着而被跳过',
  )
  assert.equal(approvalRequests.length, 2, '真机那次必须恰好再问一次')
  assert.equal(calls.length, 3, '被拒的真机指令不得下发')

  // ⑤ 关掉仿真后，回环地址重新受门禁
  await registered.get('ursim_sim_stop').execute({}, exec)
  await assert.rejects(
    () => registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0, 0, 0, 0, 0, 0] }, exec),
    /未获人工批准/,
    '仿真关掉后，回环地址必须重新受门禁',
  )
  // 计数说明：① 与 ④、⑤ 共三次（① 未开仿真、④ 真机、⑤ 关掉仿真后）；②③③b 都不该问。
  assert.equal(approvalRequests.length, 3)
})

test('★ 卸载：worker 的 disposer 必须**返回**清理 promise（否则 Python 子进程活过宿主）', async () => {
  const { effects } = await harness()
  assert.ok(effects.length >= 1, 'apply() 必须注册至少一个 effect（worker 生命周期）')

  const { UrWorker } = await import('../lib/worker.js')
  const originalDispose = UrWorker.prototype.dispose
  const originalShutdown = UrWorker.prototype.shutdown
  let disposed = 0
  UrWorker.prototype.shutdown = async () => true
  UrWorker.prototype.dispose = function dispose() {
    disposed += 1
    return originalDispose?.call?.(this)
  }
  try {
    const dispose = effects[0]() // ctx.effect(fn) → fn() 返回 disposer
    assert.equal(typeof dispose, 'function', 'effect 必须返回 disposer')
    const result = dispose() // 触发清理链（真实行为：先优雅关闭，再 dispose）
    assert.equal(
      typeof result?.then,
      'function',
      '★ disposer 必须返回 thenable —— cordis 的 runDisposable 只 await 有 then 的返回值，' +
        '返回 undefined 就等于"宿主不等清理"，子进程会握着排他的 RTDE 会话活过宿主',
    )
    await result
    assert.equal(disposed, 1, '清理链必须真的走到 dispose')
  } finally {
    UrWorker.prototype.dispose = originalDispose
    UrWorker.prototype.shutdown = originalShutdown
  }
})

test('★ A：真机模式 = IP 白名单 + 无审批豁免（H-2 结构性关闭）', async () => {
  const cfg = { motionMode: 'real', realRobotIps: '192.168.1.10' }
  const Q = [0, 0, 0, 0, 0, 0]

  // ① 白名单内：仍然必须人工确认 —— 真机模式下**没有**豁免（豁免只在 sim 模式存在）。
  const ok = await harness({ config: cfg, approvalOutcome: 'allowed-once' })
  await ok.registered.get('ursim_movej').execute({ ip: '192.168.1.10', q: Q }, exec)
  assert.equal(ok.approvalRequests.length, 1, '真机模式下即使目标在白名单里也必须人工确认')
  assert.deepEqual(ok.calls.map((c) => c.op), ['movej'], '批准后才下发')

  // ② 白名单外：**派发前**就拒绝 —— 连 worker 都不打扰，也不弹审批。
  const denied = await harness({ config: cfg, approvalOutcome: 'allowed-once' })
  await assert.rejects(
    () => denied.registered.get('ursim_movej').execute({ ip: '192.168.1.99', q: Q }, exec),
    /不在 realRobotIps 白名单里/,
  )
  assert.equal(denied.calls.length, 0, '白名单外的目标绝不下发')
  assert.equal(denied.approvalRequests.length, 0, '白名单检查先于审批')

  // ③ 真机模式下连保留回环地址都没有豁免（sim 模式下这一点恰好相反：开着仿真就跳过确认）。
  const simInReal = await harness({ config: cfg, approvalOutcome: 'denied', replies: SIM_REPLIES })
  await simInReal.registered.get('ursim_sim_start').execute({ model: 'ur5e' }, exec)
  await assert.rejects(
    () => simInReal.registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: Q }, exec),
    /未获人工批准/,
    '★ 真机模式下仿真目标同样要人工确认 —— 豁免只在 sim 模式存在，H-2 因此结构性关闭',
  )
})

test('离线仿真工具本身不受门禁，且参数按声明白名单转发', async () => {  const { registered, calls, approvalRequests } = await harness({ approvalOutcome: 'denied', replies: SIM_REPLIES })
  assert.ok(registered.get('ursim_sim_start'), '未注册 ursim_sim_start')
  assert.ok(registered.get('ursim_sim_stop'), '未注册 ursim_sim_stop')
  assert.ok(registered.get('ursim_sim_status'), '未注册 ursim_sim_status')

  await registered.get('ursim_sim_start').execute(
    { model: 'ur10e', preset: 'upright', speed_scaling: 0.5, op: 'power_off', id: 99 },
    exec,
  )
  assert.equal(approvalRequests.length, 0)
  assert.deepEqual(calls[0].params, { model: 'ur10e', preset: 'upright', speed_scaling: 0.5 },
    '仿真工具同样只转发自己声明的键（注入的 op/id 一律丢弃）')
})

test('回归守卫（H-1）：模型多传 op 字段无法把调用改派到别的 op', async () => {
  // 未受门禁的工具 + 注入 op=power_off。旧实现会把载荷拼成
  // { id, op:'get_tcp_pose', _timeout_ms, ...{op:'power_off'} } ⇒ worker 执行 power_off 且无人确认。
  //
  // 用 ursim_get_tcp_pose 而不是 ursim_ping：后者**没有声明任何参数**（`parameters: {}`），
  // 所以白名单按定义会把 ip 也丢掉，断言就说明不了"注入被挡住"。
  const { registered, calls, approvalRequests } = await harness()
  const tool = registered.get('ursim_get_tcp_pose')
  assert.ok(tool, '未注册 ursim_get_tcp_pose')

  await tool.execute({ ip: '1.2.3.4', op: 'power_off', id: 4242, _timeout_ms: 1 }, exec)

  assert.deepEqual(calls.map((c) => c.op), ['get_tcp_pose'], 'op 只能来自工具定义，不能被参数改写')
  assert.equal(approvalRequests.length, 0, 'get_tcp_pose 本身不受门禁')
  const sent = calls[0].params
  assert.equal(sent.op, undefined, '注入的 op 不得进入 worker 参数')
  assert.equal(sent.id, undefined, '注入的 id 不得进入 worker 参数')
  assert.equal(sent._timeout_ms, undefined, '注入的 _timeout_ms 不得进入 worker 参数')
  assert.deepEqual(Object.keys(sent), ['ip'], '线上参数只能是该工具声明的键')
  assert.equal(sent.ip, '1.2.3.4', '声明的参数必须原样保留')
})

test('声明了参数的只读工具同样只传它声明的键', async () => {
  const { registered, calls } = await harness()
  await registered.get('ursim_get_int_register').execute({ ip: '1.2.3.4', index: 3, op: 'shutdown' }, exec)
  assert.deepEqual(calls.map((c) => c.op), ['get_int_register'])
  assert.deepEqual(calls[0].params, { ip: '1.2.3.4', index: 3 })
})

/* ------------------------------------------------------------------ *
 * 仿真的自愈（0.7.0 实机发现的缺陷）
 *
 * `SIMS` 活在 Python 子进程内存里。子进程被替换后虚拟机器人就没了，而宿主的 `simIps`
 * 仍以为它在 —— 结果是"仿真开着、每条指令都报未连接"，且毫无提示。宿主现在记住配置，
 * 在把仿真指令交给 worker 之前确认它还在、丢了就重建。
 * ------------------------------------------------------------------ */

test('★ 子进程被替换后，宿主按记忆的配置自动重建仿真（而不是留下一片"未连接"）', async () => {
  const simState = { active: false, starts: [] }
  const stats = { respawn: 0 }
  const replies = {
    sim_start: (p) => {
      simState.starts.push({ model: p.model, preset: p.preset, speed_scaling: p.speed_scaling })
      simState.active = true
      return { message: 'ok', data: { simulated: true, active: true, ip: '127.0.0.1', model_id: p.model } }
    },
    sim_status: () => ({
      message: 'st',
      data: { simulated: simState.active, active: simState.active, ip: '127.0.0.1' },
    }),
    sim_stop: () => {
      simState.active = false
      return { message: 'stopped', data: { simulated: false, active: false, ip: '127.0.0.1' } }
    },
  }
  const { registered, calls, approvalRequests } = await harness({
    replies,
    stats,
    approvalOutcome: 'denied', // 仿真目标不该弹确认；一旦弹了就会因"拒绝"而失败
  })

  // ① 开仿真：记住配置（型号/起始姿态/速度倍率）
  await registered.get('ursim_sim_start').execute(
    { model: 'ur10e', preset: 'reach', speed_scaling: 0.5 }, exec,
  )
  assert.deepEqual(simState.starts, [{ model: 'ur10e', preset: 'reach', speed_scaling: 0.5 }])

  // ② 模拟"worker 子进程被替换"：代次 +1，仿真在子进程内存里没了
  stats.respawn = 1
  simState.active = false

  // ③ 一条打在仿真地址上的运动指令：必须先探测 → 重建 → 再下发
  await registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0, 0, 0, 0, 0, 0] }, exec)
  const ops = calls.map((c) => c.op)
  assert.ok(ops.includes('sim_status'), `必须探测一次，实际调用序列：${ops.join(' → ')}`)
  assert.deepEqual(
    ops,
    ['sim_start', 'sim_status', 'sim_start', 'movej'],
    `★ 顺序必须是：先探测（sim_status）→ 发现丢了就重建（sim_start）→ 才下发这条指令；实际 ${ops.join(' → ')}`,
  )
  assert.deepEqual(
    simState.starts[1],
    { model: 'ur10e', preset: 'reach', speed_scaling: 0.5 },
    '★ 重建必须沿用记忆里的配置，而不是拍一个默认型号',
  )
  assert.equal(approvalRequests.length, 0, '仿真目标的自愈与下发都不该弹人工确认')

  // ④ 代次没再变：短时间内继续运动**不再**反复探测（自愈不能变成每次调用都多一次往返）
  const before = calls.filter((c) => c.op === 'sim_status').length
  await registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0.1, 0, 0, 0, 0, 0] }, exec)
  await registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0.2, 0, 0, 0, 0, 0] }, exec)
  assert.equal(
    calls.filter((c) => c.op === 'sim_status').length, before,
    '代次未变且距上次确认很近时不得再探测（否则每条指令都多一次往返）',
  )

  // ⑤ 用户明确关掉仿真后：**不得**被自愈重新拉起来，而且回环地址重新受门禁
  await registered.get('ursim_sim_stop').execute({}, exec)
  stats.respawn = 2 // 再换一次子进程，制造"可能以为该重建"的最坏条件
  const startsBefore = simState.starts.length
  await assert.rejects(
    () => registered.get('ursim_movej').execute({ ip: '127.0.0.1', q: [0, 0, 0, 0, 0, 0] }, exec),
    /未获人工批准/,
    '关掉仿真后，回环地址必须重新走人工确认',
  )
  assert.equal(simState.starts.length, startsBefore, '★ 用户关掉的仿真不得被自愈复活')
})

test('★ 重建失败时绝不假装成功：仍然把这条指令如实交给 worker，由它给出诚实的拒绝', async () => {
  const stats = { respawn: 0 }
  let attempts = 0
  const { registered, calls, approvalRequests } = await harness({
    stats,
    replies: {
      // 第一次成功开启（登记 + 记住配置），之后每次重建都失败（例如 python 侧建不起来）
      sim_start: () => {
        attempts += 1
        const okFirst = attempts === 1
        return {
          message: okFirst ? 'ok' : '重建失败',
          data: okFirst
            ? { simulated: true, active: true, ip: '127.0.0.1', model_id: 'ur5e' }
            : { simulated: false, active: false, error: '重建失败' },
        }
      },
      sim_status: { message: 'st', data: { simulated: false, active: false, ip: '127.0.0.1' } },
      get_tcp_pose: { message: '拒绝：该地址没有正在运行的仿真', data: null },
    },
    approvalOutcome: 'denied',
  })

  await registered.get('ursim_sim_start').execute({ model: 'ur5e' }, exec)
  stats.respawn = 1 // 子进程被替换
  await registered.get('ursim_get_tcp_pose').execute({ ip: '127.0.0.1' }, exec)

  const ops = calls.map((c) => c.op)
  assert.deepEqual(
    ops, ['sim_start', 'sim_status', 'sim_start', 'get_tcp_pose'],
    `探测 → 尝试重建 → 无论重建成败都要把原指令交给 worker（由它如实拒绝）；实际 ${ops.join(' → ')}`,
  )
  assert.equal(attempts, 2, '必须真的尝试过一次重建')
  assert.equal(approvalRequests.length, 0, '仿真目标（豁免仍有效）不该弹确认；真正的安全由 worker 的保留地址守卫兜住')
})

test('产品默认免确认：schema 默认与代码兜底一致，裸 config 既不弹确认也照常下发', async () => {
  // 0.2.3 起产品默认 `requireApprovalForMotion: false` —— 运动免人工确认。门禁能力一行没删：
  // `APPROVAL_OPS` 与 `requestApproval()` 的判定、报错文案、fail-closed 全部照旧，只是**默认不
  // 启用**（显式设 `true` 的部署行为与从前逐字节一致，见本文件其余用例）。
  //
  // 这里用 `gateEnabled: false` + 空 config 走**真正的裸 config**（未经 schema 解析）：Config 的
  // `z.boolean().default(false)` 与 apply() 里的 `?? false` 兜底必须给出同一个答案，否则"没解析
  // schema"就成了一次静默的语义分叉 —— 凭空多出一次人工确认，或凭空少一道门。
  // `scripts/check-approval-gate.py` 的第三条检查钉的正是这三处（schema / 代码兜底 /
  // cordis.patch.yml）默认值一致。
  const { registered, calls, approvalRequests } = await harness({
    gateEnabled: false,
    config: {}, // 显式：requireApprovalForMotion 未给
  })
  await registered.get('ursim_power_off').execute({ ip: '1.2.3.4' }, exec)
  assert.equal(approvalRequests.length, 0, '缺省（未显式开启门禁）不得请求人工确认')
  assert.equal(calls.length, 1, '免确认不等于不下发：命令必须照常到达 worker')
  assert.equal(calls[0].op, 'power_off', '下发的必须正是被调用的那条指令')
})

test('回归守卫（H-1 的对称面）：受门禁的工具同样无法被改派成别的 op', async () => {
  const { registered, calls, approvalRequests } = await harness({ approvalOutcome: 'denied' })
  const movej = registered.get('ursim_movej')
  await assert.rejects(
    () => movej.execute({ ip: '1.2.3.4', q: [0, 0, 0, 0, 0, 0], op: 'get_tcp_pose' }, exec),
    /未获人工批准/,
    '即使注入 op 也必须先过 movej 的门禁',
  )
  assert.equal(calls.length, 0)
  assert.equal(approvalRequests.length, 1)
})

test('声明层守卫：APPROVAL_OPS 里每个名字都必须是真实存在的 op，且兄弟 op 不得一个门禁一个不门禁', async () => {
  const { registered } = await harness()
  const indexSource = (await import('node:fs')).readFileSync(
    new URL('../lib/index.js', import.meta.url),
    'utf8',
  )
  const block = /const APPROVAL_OPS = new Set\(\[(.*?)\]\);/s.exec(indexSource)?.[1] ?? ''
  const gated = new Set([...block.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]))
  assert.ok(gated.size > 0, '未能解析出 APPROVAL_OPS')

  // 1) 拼错的 op 名等于"该指令其实没被门禁" —— 必须抓到
  const pythonSource = (await import('node:fs')).readFileSync(
    new URL('../python/ur_worker.py', import.meta.url),
    'utf8',
  )
  const ops = new Set([...pythonSource.matchAll(/"([a-z_0-9]+)": op_/g)].map((m) => m[1]))
  const stale = [...gated].filter((name) => !ops.has(name))
  assert.deepEqual(stale, [], `APPROVAL_OPS 里有不存在的 op（门禁对它是空转）：${stale.join(', ')}`)

  // 2) 成对的 op 必须同时受门禁（set_payload 与 set_payload_inertia 都改负载并归零力传感器）
  for (const [a, b] of [
    ['set_payload', 'set_payload_inertia'],
    ['zero_ftsensor', 'set_payload'],
  ]) {
    assert.equal(
      gated.has(a),
      gated.has(b),
      `${a} 与 ${b} 副作用同类（都改变力/力矩测量基准），不得一个门禁一个不门禁`,
    )
  }

  // 3) 安全审计 H-1 补齐之后，这些"物理副作用家族"必须成组受门禁（回归线）：
  //    `set_tcp` 与 `motion_version` 都改"此后每一次运动"的参考/规划；
  //    工具法兰三件套改变同一对针脚的语义（TCI 打开还会禁用工具端模拟输入）；
  //    写 I/O 的两个 op 能致动夹爪/传送带/焊机等外设；`set_conveyor_tick` 是
  //    `conveyor_tracking` 的兄弟 op。
  for (const [a, b] of [
    ['set_tcp', 'motion_version'],
    ['set_tool_voltage', 'set_tool_output_mode'],
    ['set_tool_output_mode', 'tool_communication'],
    ['set_digital_out', 'set_analog_out'],
    ['set_conveyor_tick', 'conveyor_tracking'],
  ]) {
    assert.equal(
      gated.has(a),
      gated.has(b),
      `${a} 与 ${b} 副作用同类（持久改变物理行为或致动外设），不得一个门禁一个不门禁`,
    )
  }
  for (const op of [
    'set_tcp', 'set_tool_output_mode', 'set_tool_voltage', 'tool_communication',
    'set_digital_out', 'set_analog_out', 'set_conveyor_tick',
  ]) {
    assert.ok(gated.has(op), `${op} 会持久改变物理行为或致动外设，必须受人工审批`)
  }
})
