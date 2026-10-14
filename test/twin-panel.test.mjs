/**
 * test/twin-panel.test.mjs — Task 8：大视图面板（模型 + TCP gizmo + 轨迹 + 数值面板）的单测。
 *
 * ## 为什么能测（Ruling 29）
 * 面板把**全部外部副作用**都做成了注入点：`sceneFactory` / `modelLoader` / `raf` / `caf` / `now`，
 * 文档从 `container.ownerDocument` 取。于是 Node 下：
 *   - 假场景记录 `add`/`remove`，不需要 WebGL；
 *   - 假 raf 手动 `flush()` 推帧，不需要 `requestAnimationFrame`；
 *   - 假时钟控制 `now()`，插值/节流都变成确定性可断言；
 *   - 最小假 DOM（本仓库没装 jsdom/happy-dom，也**不允许为了测试装依赖**）提供
 *     `createElement/appendChild/removeChild/setAttribute/textContent` 这一小撮面板真正用到的 API。
 *
 * 轨迹/姿态断言用 `fk.js` 的独立参考实现现算，不猜浮点常数。
 *
 * 运行：node --test test/twin-panel.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  mountTwinPanel,
  resolveKinematics,
  formatJoints,
  formatTcp,
  describeDisconnected,
  formatDetail,
  overLimitJoints,
  describeSafetyMode,
  describeRobotMode,
  describeProgramState,
  isSafetyHazard,
  formatSpeedScaling,
  VIEW_BUTTONS,
  STATUS_SAFETY_HINT,
  TRAJECTORY_CAPACITY,
  HUD_INTERVAL_MS,
  TCP_AXES_SIZE,
  DEFAULT_KINEMATICS_KEY,
  renderDelayMs,
  RENDER_DELAY_MIN_MS,
  RENDER_DELAY_MAX_MS,
  describeFeedHealth,
  FEED_STALE_MS,
  FEED_RECONNECT_MS,
  FEED_STALE_PREFIX,
  FEED_RETRYING_TEXT,
  MODEL_RETRY_MS,
REACH_VIEW_RADIUS,
} from '../src/client/twin-panel.js'
import { fkChain } from '../src/client/robot/fk.js'
import { reachRadiusFromKinematics } from '../src/client/robot/overlays.js'
import { lerpJoints } from '../src/client/robot/interpolate.js'
import { Group } from 'three'
import { TWIN_CSS, TWIN_STYLE_ID, injectStyles } from '../src/client/styles.js'

/* ------------------------------------------------------------------ *
 * 最小假 DOM
 * ------------------------------------------------------------------ */

/** 建一个假元素：只实现面板真正用到的 DOM 面。 */
function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parentNode: null,
    attributes: Object.create(null),
    style: {},
    className: '',
    id: '',
    _text: '',
    listeners: Object.create(null),
    get firstChild() {
      return this.children[0] ?? null
    },
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child)
      this.children.push(child)
      child.parentNode = this
      return child
    },
    removeChild(child) {
      const i = this.children.indexOf(child)
      if (i >= 0) this.children.splice(i, 1)
      child.parentNode = null
      return child
    },
    remove() {
      this.parentNode?.removeChild(this)
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value)
    },
    getAttribute(name) {
      return name in this.attributes ? this.attributes[name] : null
    },
    hasAttribute(name) {
      return name in this.attributes
    },
    addEventListener(type, fn) {
      ;(this.listeners[type] ??= []).push(fn)
    },
    removeEventListener(type, fn) {
      const list = this.listeners[type] ?? []
      const i = list.indexOf(fn)
      if (i >= 0) list.splice(i, 1)
    },
    get textContent() {
      return this._text
    },
    set textContent(v) {
      this._text = v === null || v === undefined ? '' : String(v)
    },
  }
  return el
}

/** 深度优先收集匹配元素。 */
function findAll(root, pred, out = []) {
  if (!root || typeof root !== 'object') return out
  if (pred(root)) out.push(root)
  for (const child of root.children ?? []) findAll(child, pred, out)
  return out
}

/** 按 `data-*` 属性找元素（面板用它标注各部件）。 */
const byAttr = (root, attr) => findAll(root, (e) => e.hasAttribute?.(attr) === true)

/** 假文档 + 假 window（记录 resize 监听，便于断言"不留监听器"）。 */
function makeDoc() {
  const doc = {
    created: [],
    head: null,
    defaultView: null,
    createElement(tag) {
      const el = makeEl(tag)
      doc.created.push(el)
      return el
    },
    getElementById(id) {
      return findAll(doc.head, (e) => e.id === id)[0] ?? null
    },
  }
  doc.head = makeEl('head')
  doc.head.ownerDocument = doc
  const win = {
    resizeListeners: [],
    addEventListener(type, fn) {
      win.resizeListeners.push({ type, fn })
    },
    removeEventListener(type, fn) {
      const i = win.resizeListeners.findIndex((l) => l.type === type && l.fn === fn)
      if (i >= 0) win.resizeListeners.splice(i, 1)
    },
    /** 触发某类已注册的监听（`visibilitychange` 用；`resize` 也可）。 */
    dispatch(type) {
      for (const l of [...win.resizeListeners]) if (l.type === type) l.fn()
    },
  }
  doc.defaultView = win
  return doc
}

function makeContainer(doc) {
  const el = makeEl('div')
  el.ownerDocument = doc
  el.clientWidth = 800
  el.clientHeight = 600
  return el
}

/* ------------------------------------------------------------------ *
 * 假协作者
 * ------------------------------------------------------------------ */

/** 假场景：记录 add/remove/render/resize/dispose/fitTo/setViewPreset。 */
function makeFakeScene(canvas) {
  const added = []
  const removed = []
  let renders = 0
  let resizes = 0
  let disposals = 0
  const fitCalls = []
  /** 每次 `fitTo` 收到的选项：可达范围图层靠 `minRadius` 做"同一把尺子"，所以要能断言到它。 */
  const fitOptions = []
  const presetCalls = []
  return {
    canvas,
    fitCalls,
    fitOptions,
    presetCalls,
    fitTo(object, options) {
      fitCalls.push(object)
      fitOptions.push(options)
      return true
    },
    setViewPreset(name) {
      presetCalls.push(name)
      return true
    },
    onCameraChange() {},
    scene: {
      added,
      removed,
      /**
       * 真正的 three.js 场景有 `children` 数组（面板的"换型号要清空原有机器人"兜底清扫
       * `removeStrayRobots` 就靠它）。假场景也必须忠实提供，否则那条兜底在测试里永远走不到。
       */
      children: added,
      add(o) {
        added.push(o)
        return this
      },
      remove(o) {
        removed.push(o)
        const i = added.indexOf(o)
        if (i >= 0) added.splice(i, 1)
        return this
      },
    },
    render() {
      renders++
    },
    resize() {
      resizes++
    },
    dispose() {
      disposals++
    },
    get renders() {
      return renders
    },
    get resizes() {
      return resizes
    },
    get disposals() {
      return disposals
    },
  }
}

function makeSceneFactory() {
  const created = []
  const factory = (canvas) => {
    const s = makeFakeScene(canvas)
    created.push(s)
    return s
  }
  factory.created = created
  return factory
}

/** 假模型加载器：每次调用返回一个全新的假 handle（记录 applyFK 与 dispose）。 */
function makeModelLoader({ usedFallback = false } = {}) {
  const calls = []
  const handles = []
  const loader = async (modelId) => {
    calls.push(modelId)
    let applyFKCount = 0
    let disposed = 0
    let lastResult = null
    const h = {
      root: { isFakeRoot: true, name: `root:${modelId}` },
      groups: Array.from({ length: 7 }, (_, i) => ({ name: `assemble_${i}` })),
      usedFallback,
      applied: [],
      applyFK(result) {
        applyFKCount++
        lastResult = result
        h.applied.push(result)
      },
      dispose() {
        disposed++
      },
      get applyFKCount() {
        return applyFKCount
      },
      get disposed() {
        return disposed
      },
      get lastResult() {
        return lastResult
      },
    }
    handles.push(h)
    return h
  }
  loader.calls = calls
  loader.handles = handles
  return loader
}

/**
 * 能长出**幽灵臂**的模型加载器：`createGhostArm` 靠 `handle.root.clone(true)` 造叠加层，
 * 所以假 root 必须是**真实的 three 对象树**（否则幽灵臂创建失败、测试就断言不到它）。
 */
function makeGhostableModelLoader() {
  const handles = []
  const loader = async (modelId) => {
    const root = new Group()
    root.name = `root:${modelId}`
    for (const n of ['base', 'shoulder', 'upperarm', 'forearm', 'wrist1', 'wrist2', 'wrist3']) {
      const g = new Group()
      g.name = n
      root.add(g)
    }
    const h = {
      root,
      groups: Array.from({ length: 7 }, () => new Group()),
      usedFallback: false,
      applyFK() {},
      dispose() {},
    }
    handles.push(h)
    return h
  }
  loader.handles = handles
  return loader
}

/** 假状态源：只提供面板需要的 `getSnapshot`（外加 subscribe，供"不留监听器"检查）。 */
function makeFakeState(initial = {}) {
  let snap = { connected: false, model: '', q: [], tcp: [], ts: 0, error: null, ...initial }
  const listeners = new Set()
  let health = { status: 'open', frames: 1, frameErrors: 0, stale: 0, mode: 'stream' }
  const retries = []
  const ipCalls = []
  return {
    getSnapshot: () => snap,
    subscribe(l) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    set(next) {
      snap = { ...snap, ...next }
    },
    /** 仿真开关会把数据源切到仿真地址（真机地址则切回自动解析），这里记录它。 */
    setIp(next) {
      ipCalls.push(next)
      snap = { ...snap, ip: next === '' || next === null || next === undefined ? null : next }
    },
    ipCalls,
    /** 数据通道健康度（0.6.6）：面板据此显示"重连中 / 停滞"。 */
    getStreamHealth: () => ({ ...health }),
    setHealth(next) {
      health = { ...health, ...next }
    },
    /** 自愈入口：面板在停滞过久/回到前台时会调它（记录 force 参数）。 */
    retryNow(force = false) {
      retries.push(force === true)
      return true
    },
    retries,
    listenerCount: () => listeners.size,
  }
}

/**
 * 假时钟 + 假 raf/caf。
 * `caf` **故意不从队列里删除**：模拟"浏览器已经把这一帧排好队、取消来得太晚"，
 * 从而真正验证面板内部的 `disposed` 守卫（而不是靠假实现掩盖掉）。
 */
function makeClock() {
  const queue = new Map()
  const cancelled = []
  let nextId = 1
  let time = 0
  return {
    raf(cb) {
      const id = nextId++
      queue.set(id, cb)
      return id
    },
    caf(id) {
      cancelled.push(id)
    },
    /** 推进 dt 毫秒，并执行"本批次"已排队的帧回调。 */
    flush(dt = 0) {
      time += dt
      const batch = [...queue.values()]
      queue.clear()
      for (const cb of batch) cb(time)
    },
    now: () => time,
    queue,
    cancelled,
  }
}

/** 等模型加载那几跳微任务落地（loader 是 async）。 */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * 假请求实现（离线仿真开关专用）。
 *
 * 记录每一次调用（含 method/body），让"默认不发写请求 / 打开后只发一次 POST / 失败要回滚"
 * 这些行为可以被逐条断言。`status` 决定 GET 返回什么、`postResult` 决定 POST 的结果。
 */
function makeFakeRequest({ active = false, model = 'ur5e', models = ['ur3', 'ur5e', 'ur10e'],
  postResult = { ok: true }, rejectWith = null, motionMode = 'sim', realRobots = [],
  capabilities = null, io = null, registers = null } = {}) {
  const calls = []
  const impl = async (url, init = {}) => {
    const method = init.method ?? 'GET'
    calls.push({ url, method, body: init.body ?? null, headers: init.headers ?? null, keepalive: init.keepalive ?? null })
    if (rejectWith !== null) throw rejectWith instanceof Error ? rejectWith : new Error(String(rejectWith))
    const payload = method === 'POST'
      ? { ...postResult, active: postResult.ok === true && active !== true ? true : active }
      // `motion_mode` / `real_robots` / `capabilities` 是 0.1.8 给界面加的三样：模式指示（P0）、
      // 能力清单（P2）—— 真机模式与白名单是**配置**，能力清单来自宿主 `sim_status` 的透传。
      : { ok: true, active, model, model_id: model, preset: 'zero', speed_scaling: 1, models,
          motion_mode: motionMode, real_robots: realRobots, capabilities,
          // I/O 与寄存器（0.1.9）：与宿主 twin/state 的加分字段同名，供"展开才读"的断言注入。
          io, registers }
    return { json: async () => payload }
  }
  impl.calls = calls
  impl.posts = () => calls.filter((c) => c.method === 'POST')
  return impl
}

/** 组装一个可直接推帧的面板。 */
function boot({ initial = {}, usedFallback = false, request = null, modelLoader = null, autoSim = false } = {}) {
  const doc = makeDoc()
  const container = makeContainer(doc)
  const state = makeFakeState(initial)
  const sceneFactory = makeSceneFactory()
  const loader = modelLoader ?? makeModelLoader({ usedFallback })
  const clock = makeClock()
  const fakeRequest = request ?? makeFakeRequest()
  const panel = mountTwinPanel({
    container,
    state,
    sceneFactory,
    modelLoader: loader,
    raf: clock.raf,
    caf: clock.caf,
    now: clock.now,
    request: fakeRequest,
    // 默认**关掉**"打开面板即进仿真"：那套默认行为会在挂载时发一次 POST 并把状态行改成
    // "离线仿真 · …"，会把下面几十条与仿真无关的断言全部带偏。传 `null` = 不传这个选项，
    // 用来钉住"面板自己的默认值确实是 true"。
    ...(autoSim === null ? {} : { autoSim }),
  })
  return { doc, container, state, sceneFactory, modelLoader: loader, clock, panel, request: fakeRequest }
}

const statusEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-status')[0]
const errorEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-error')[0]
const jointsEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-joints')[0]
const tcpEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-tcp')[0]
const panelRoot = (ctx) => byAttr(ctx.container, 'data-ursim-twin-panel')[0]
const sceneOf = (ctx) => ctx.sceneFactory.created[0]?.scene ?? null
/** 轨迹 Line：注意 `AxesHelper`（LineSegments）同样带 `isLine`，必须排除线段类。 */
const lineOf = (ctx) =>
  sceneOf(ctx)?.added.find((o) => o.isLine === true && o.isLineSegments !== true) ?? null

const Q0 = [Math.PI / 2, 0, 0, 0, 0, 0]
const TCP0 = [0.1, 0.2, 0.3, 0.01, 0.02, 0.03]

/** 16 元素矩阵逐元素比较（避嫌浮点字面量：差值容差而非硬编码数字）。 */
function tool0Equals(a, b, eps = 1e-9) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 16) return false
  for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > eps) return false
  return true
}

function assertClose(actual, expected, label, eps = 1e-9) {
  assert.ok(tool0Equals(actual, expected, eps), `${label}（实际 ${JSON.stringify(actual)}）`)
}

/* ------------------------------------------------------------------ *
 * 用例 1：挂载后的 DOM + 未连接不渲染空 3D + 样式走 <style> 字符串
 * ------------------------------------------------------------------ */

test('挂载后容器内出现 canvas 与状态元素；未连接不建场景；样式以 <style> 字符串注入', () => {
  const ctx = boot()

  assert.equal(ctx.container.children.length, 1, '容器内应只有一个面板根元素')
  assert.equal(findAll(ctx.container, (e) => e.tagName === 'CANVAS').length, 1, '必须有 canvas')
  assert.equal(byAttr(ctx.container, 'data-ursim-twin-status').length, 1, '必须有状态元素')
  assert.match(statusEl(ctx).textContent, /未连接/, '未连接时必须显示中文状态文案')
  assert.equal(statusEl(ctx).tagName, 'DIV')

  // "不渲染空 3D"：一个空的 WebGL 场景都不该建、更不该 render。
  assert.equal(ctx.sceneFactory.created.length, 0, '未连接不得创建场景')

  // Ruling 28：样式是 <style> + textContent（不是 .css 文件，shell 不会加载那种产物）。
  const styles = findAll(ctx.doc.head, (e) => e.tagName === 'STYLE')
  assert.equal(styles.length, 1, '样式应恰好注入一份')
  assert.equal(styles[0].id, TWIN_STYLE_ID)
  assert.equal(styles[0].textContent, TWIN_CSS)
  assert.ok(TWIN_CSS.includes('.ursim-twin-panel'), 'CSS 文本必须真的含面板规则')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 2：connected:false —— 文案 + 不加载模型 + 不渲染
 * ------------------------------------------------------------------ */

test('快照 connected:false 时显示「未连接」且不加载模型、不渲染', async () => {
  const ctx = boot({ initial: { connected: false, model: 'UR3', q: Q0, tcp: TCP0, ts: 1 } })

  ctx.clock.flush()
  ctx.clock.flush()
  await tick()

  assert.match(statusEl(ctx).textContent, /未连接机器人/)
  assert.equal(ctx.modelLoader.calls.length, 0, '未连接不得调用 modelLoader')
  assert.equal(ctx.sceneFactory.created.length, 0, '未连接不得创建场景')
  assert.equal(panelRoot(ctx).getAttribute('data-ursim-twin-connected'), 'false')

  // 恢复连接后自动显示模型并创建场景
  ctx.state.set({ connected: true, ts: 2 })
  ctx.clock.flush()
  await tick()
  assert.equal(ctx.modelLoader.calls.length, 1, '恢复连接后必须自动加载模型')
  assert.equal(ctx.sceneFactory.created.length, 1)
  assert.equal(panelRoot(ctx).getAttribute('data-ursim-twin-connected'), 'true')
  assert.match(statusEl(ctx).textContent, /已连接/)

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 3：connected:true —— 正确型号 + 只 add root + 每帧 applyFK
 * ------------------------------------------------------------------ */

test('connected:true 时以正确型号调用 modelLoader、只 add handle.root，且数据推进时摆姿态', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush()
  await tick()

  assert.deepEqual(ctx.modelLoader.calls, ['UR3'], '必须按快照里的型号加载')
  const h = ctx.modelLoader.handles[0]
  const scene = sceneOf(ctx)
  assert.ok(scene, '连接后必须创建场景')
  assert.ok(scene.added.includes(h.root), '必须 scene.add(handle.root)')
  // Task 7 的 assemble() 已把 7 个装配组挂回 root；再手动 add groups[0] 会把它摘出 root。
  assert.ok(!scene.added.includes(h.groups[0]), '不得再手动 add groups[0]')

  // 有数据在推进时必须摆姿态（插值窗口内逐帧更新）；数据静止并收敛到测量值之后**不得**再
  // 反复重算 —— 这是「静止降频」的契约（旧写法每帧无条件 applyFK，60 Hz 全跑）。
  for (let i = 1; i <= 5; i++) ctx.clock.flush(16)
  assert.ok(h.applyFKCount >= 2, `数据推进期间必须摆姿态（实得 ${h.applyFKCount}）`)
  const settled = h.applyFKCount
  for (let i = 0; i < 20; i++) ctx.clock.flush(16)
  assert.equal(
    h.applyFKCount,
    settled,
    `数据静止后不得再重算姿态（静止 20 帧后又算了 ${h.applyFKCount - settled} 次）`,
  )

  // 姿态正确性：单采样（无 prev）时插值退化为样本本身，应与独立算出的 FK 逐元素一致。
  const expected = fkChain(resolveKinematics('ur3'), Q0).tool0
  for (let i = 0; i < 16; i++) {
    assert.ok(
      Math.abs(h.lastResult.tool0[i] - expected[i]) < 1e-12,
      `tool0[${i}] 实际 ${h.lastResult.tool0[i]} ≠ 期望 ${expected[i]}`,
    )
  }
  assert.equal(h.lastResult.links.length, 6, 'fkChain 的 links 长度恒为 6')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 4：型号变化 → 重建模型 + dispose 旧的
 * ------------------------------------------------------------------ */

test('型号 UR3 → UR5E 时重新加载模型，旧模型被摘出场景并 dispose', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush()
  await tick()
  const h1 = ctx.modelLoader.handles[0]
  const scene = sceneOf(ctx)
  assert.ok(scene.added.includes(h1.root))

  ctx.state.set({ model: 'UR5E', ts: 1100 })
  ctx.clock.flush()
  await tick()

  assert.deepEqual(ctx.modelLoader.calls, ['UR3', 'UR5E'], '型号变化必须重新调用 modelLoader')
  assert.equal(h1.disposed, 1, '旧模型必须被 dispose')
  assert.ok(scene.removed.includes(h1.root), '旧模型必须被摘出场景')
  const h2 = ctx.modelLoader.handles[1]
  assert.ok(scene.added.includes(h2.root), '新模型必须入场景')
  assert.equal(ctx.sceneFactory.created.length, 1, '换型号不得重建场景本身')

  // 新模型的姿态用新型号的运动学链（ur5e）
  ctx.clock.flush(16)
  const expected = fkChain(resolveKinematics('ur5e'), Q0).tool0
  assert.ok(Math.abs(h2.lastResult.tool0[12] - expected[12]) < 1e-12, '换型号后必须用新运动学链')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 4b：换型号时那一帧没有合法 q —— 新模型必须立刻摆到最近一次已知姿态
 *
 * 回归：实机报障"仿真跑起来后机械臂非正常折叠"。根因是面板把**装配完成但还没写 FK** 的
 * 模型原样展示：7 个网格各自留在自己的连杆坐标系里叠在基座原点（两根长管并排、法兰盘落在
 * 基座旁、TCP gizmo 停在原点）。换型号恰好常发生在数据面抖动的时刻（仿真重启 / worker
 * 重挂载 ⇒ 状态路由返回 `q: []`），若新模型不立刻摆姿态，画面就会永久停在那个堆叠态。
 * ------------------------------------------------------------------ */

test('换型号时该帧没有合法 q：新模型立刻摆到最近一次已知姿态，不得留在装配态', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16) // 模型就绪后的**第一帧**才会写姿态
  const h1 = ctx.modelLoader.handles[0]
  assert.ok(h1.applyFKCount >= 1, '第一台模型必须先被摆上姿态')

  // 型号变了，但这一帧的 q 不完整（仿真被换掉 / worker 重挂载后的真实形态）。
  ctx.state.set({ model: 'UR5E', q: [], ts: 1100 })
  ctx.clock.flush()
  await tick()

  const h2 = ctx.modelLoader.handles[1]
  assert.ok(h2, '型号变化必须重新加载模型')
  assert.ok(h2.applyFKCount >= 1, '新模型必须在装载后立刻摆到最近一次已知姿态，而不是留在装配态')
  const expected = fkChain(resolveKinematics('ur5e'), Q0).tool0
  for (let i = 0; i < 16; i++) {
    assert.ok(
      Math.abs(h2.lastResult.tool0[i] - expected[i]) < 1e-12,
      `换型号后必须用新运动学链摆到上次姿态：tool0[${i}] ${h2.lastResult.tool0[i]} ≠ ${expected[i]}`,
    )
  }
  assert.equal(h2.root.visible, true, '已摆上姿态的新模型必须可见')

  ctx.panel.dispose()
})

test('首次加载时还没有合法 q：模型先藏起来，收到第一帧姿态后才显示', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: [], tcp: [], ts: 1000 } })

  ctx.clock.flush()
  await tick()
  const h = ctx.modelLoader.handles[0]
  assert.equal(h.applyFKCount, 0, '没有 q 时不得凭空摆姿态')
  assert.equal(h.root.visible, false, '未摆姿态的装配态（连杆叠在基座）绝不能被展示出来')

  ctx.state.set({ q: Q0, ts: 1200 })
  ctx.clock.flush(16)
  assert.ok(h.applyFKCount >= 1, '收到第一帧 q 后必须摆姿态')
  assert.equal(h.root.visible, true, '摆上姿态后必须显示')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 5：轨迹 —— 逐帧增长、不超容量、不重建 geometry
 * ------------------------------------------------------------------ */

test('轨迹逐帧增长但不超过预分配容量，且始终复用同一个 BufferGeometry', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: [0, 0, 0, 0, 0, 0], ts: 0 } })

  ctx.clock.flush()
  await tick()

  const line = lineOf(ctx)
  assert.ok(line, '轨迹 Line 必须已入场景')
  assert.equal(line.type, 'Line', '轨迹必须是 Line（不是 LineSegments）')
  const geometry = line.geometry
  const attr = geometry.getAttribute('position')
  assert.equal(attr.count, TRAJECTORY_CAPACITY, 'position 必须按容量预分配')
  assert.equal(attr.array.length, TRAJECTORY_CAPACITY * 3)

  const startTs = 1000
  const frames = TRAJECTORY_CAPACITY + 120 // 喂超过容量的帧数
  for (let i = 0; i < frames; i++) {
    ctx.state.set({ tcp: [(i + 1) / 1000, 0, 0, 0, 0, 0], ts: startTs + i * 10 })
    ctx.clock.flush(16)
    assert.equal(line.geometry, geometry, 'geometry 不得被重建')
  }

  const count = geometry.drawRange.count
  assert.equal(count, TRAJECTORY_CAPACITY, `喂 ${frames} 帧后 drawRange.count 必须钳到容量`)
  // 不越界：写入点全部落在预分配数组内
  for (let i = 0; i < TRAJECTORY_CAPACITY; i++) {
    const x = attr.array[i * 3]
    assert.ok(Number.isFinite(x), `positions[${i}] 必须是有限数（未越界写入）`)
    assert.ok(x > 0, '轨迹点应来自被喂入的 tcp 样本')
  }
  assert.ok(attr.array.length === TRAJECTORY_CAPACITY * 3, '数组长度不得增长')

  // 淘汰策略：把 ts 拉远到超过 maxAge → 老样本被淘汰、点数回落
  ctx.state.set({ tcp: [9, 9, 9, 0, 0, 0], ts: startTs + 10 * frames + 120_000 })
  ctx.clock.flush(16)
  assert.ok(geometry.drawRange.count < TRAJECTORY_CAPACITY, '超龄样本必须被淘汰')
  assert.ok(geometry.drawRange.count >= 1)

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 6：dispose —— caf / 清容器 / 已排队帧不再 applyFK / 幂等
 * ------------------------------------------------------------------ */

test('dispose() 停循环（caf）、清空容器、已排队帧不再 applyFK，且重复调用不抛错', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)
  const h = ctx.modelLoader.handles[0]
  const sceneHandle = ctx.sceneFactory.created[0]
  const appliedBefore = h.applyFKCount
  assert.ok(appliedBefore > 0, 'dispose 前必须已 applyFK')
  const rendersBefore = sceneHandle.renders
  assert.ok(rendersBefore > 0, '连接期间必须调用场景 render')

  const pendingId = [...ctx.clock.queue.keys()].at(-1)
  assert.equal(typeof pendingId, 'number', '必须已排好下一帧')

  ctx.panel.dispose()

  assert.ok(ctx.clock.cancelled.includes(pendingId), '必须用注入的 caf 取消已排的帧')
  assert.equal(ctx.container.children.length, 0, '容器必须被清空')
  assert.equal(h.disposed, 1, '模型必须被 dispose')
  assert.equal(sceneHandle.disposals, 1, '场景必须被 dispose')
  assert.equal(ctx.doc.defaultView.resizeListeners.length, 0, '不得留下 resize 监听')
  assert.equal(ctx.state.listenerCount(), 0, '不得留下 state 订阅')

  // 假 caf 故意不删队列 ⇒ 这一帧仍会被调用；面板必须靠自身守卫不再 applyFK。
  ctx.clock.flush(16)
  assert.equal(h.applyFKCount, appliedBefore, 'dispose 后不得再 applyFK')
  assert.equal(sceneHandle.renders, rendersBefore, 'dispose 后不得再 render')

  // 共享样式是资源、不随面板卸载移除（另一个实例可能还在用）
  assert.equal(findAll(ctx.doc.head, (e) => e.tagName === 'STYLE').length, 1)

  assert.doesNotThrow(() => ctx.panel.dispose(), '重复 dispose 必须安全')
  assert.doesNotThrow(() => ctx.panel.dispose())
  assert.equal(ctx.clock.cancelled.length, 1, '重复 dispose 不得重复 caf')
})

/* ------------------------------------------------------------------ *
 * 用例 7：数值面板 —— 度 + 节流 ~10 Hz
 * ------------------------------------------------------------------ */

test('数值面板显示「度」并节流到 ~10 Hz（不每帧写 DOM）', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush() // t=0：首帧就应写一次
  await tick()

  const joints = jointsEl(ctx)
  const tcp = tcpEl(ctx)
  assert.equal(joints.textContent, formatJoints(Q0))
  assert.equal(tcp.textContent, formatTcp(TCP0))
  assert.ok(joints.textContent.includes('J1 90.0'), 'π/2 rad 必须显示为 90.0 度')
  assert.ok(joints.textContent.includes('°'))
  assert.ok(tcp.textContent.includes('x 0.1000'), 'TCP 位置按米显示')

  // 之后 9 帧（每帧 +10 ms，累计 90 ms）都不得改写 DOM
  for (let i = 1; i <= 9; i++) {
    joints.textContent = 'SENTINEL'
    ctx.clock.flush(10)
    assert.equal(joints.textContent, 'SENTINEL', `第 ${i} 帧（t=${i * 10}ms）不应写 DOM`)
  }
  // 第 10 帧累计到 100 ms → 再写一次
  joints.textContent = 'SENTINEL'
  ctx.clock.flush(10)
  assert.equal(joints.textContent, formatJoints(Q0), `t=100ms 必须刷新（节流间隔 ${HUD_INTERVAL_MS}ms）`)
  assert.equal(HUD_INTERVAL_MS, 100)

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 8：TCP gizmo —— AxesHelper(0.08) 且矩阵等于 tool0
 * ------------------------------------------------------------------ */

test('TCP gizmo 是带标签的 Group（内层 AxesHelper 基准 0.08），其矩阵等于该帧的 tool0', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)

  const gizmo = sceneOf(ctx).added.find((o) => o.name === 'ursim-twin-tcp-axes')
  assert.ok(gizmo, '场景里必须有 ursim-twin-tcp-axes（清单第 6 条）')
  assert.equal(gizmo.type, 'Group', '外层必须是 Group —— 它承接 tool0 矩阵，尺度交给内层')
  assert.equal(TCP_AXES_SIZE, 0.08)

  const axes = gizmo.userData.axes
  assert.ok(axes, 'Group 必须挂出内部 AxesHelper（userData.axes）')
  // AxesHelper 的几何是「原点 → size」的三段轴 ⇒ 顶点坐标最大绝对值即构造参数。
  const pos = axes.geometry.getAttribute('position')
  let maxAbs = 0
  for (const v of pos.array) maxAbs = Math.max(maxAbs, Math.abs(v))
  assert.ok(
    Math.abs(maxAbs - 0.08) < 1e-6,
    `AxesHelper 基准尺寸必须是 0.08（实测顶点最大坐标 ${maxAbs}）`,
  )

  const expected = fkChain(resolveKinematics('ur3'), Q0).tool0
  for (let i = 0; i < 16; i++) {
    assert.ok(
      Math.abs(gizmo.matrix.elements[i] - expected[i]) < 1e-12,
      `gizmo 矩阵[${i}] 实际 ${gizmo.matrix.elements[i]} ≠ tool0 ${expected[i]}`,
    )
  }

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 9：时间轴锚定（偏差 D1）—— epoch 域的快照 ts + performance.now 域的 now
 *
 * 注：本用例在 fix round 1 之后按"渲染滞后一个采样周期"重述了时间轴
 * （渲染时刻 = now - 一个采样周期）。锚定的作用因此表现为：
 * **渲染时刻能正确落在样本的 epoch 时间轴上**；若不做锚定（直接用 performance.now 减 epoch ts），
 * alpha 会恒为 0 ⇒ 无论时间怎么推进都停在 fk(A)。
 * ------------------------------------------------------------------ */

test('宿主 ts 为 epoch 毫秒时仍平滑跟随：alpha 随时间推进，而不是恒被钳到 0', async () => {
  const EPOCH = 1_700_000_000_000 // host 侧 ts: Date.now()（lib/twin-routes.js）
  const A = [0, 0, 0, 0, 0, 0]
  const B = [Math.PI / 2, 0, 0, 0, 0, 0]
  const kin = resolveKinematics('ur3')
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: A, tcp: TCP0, ts: EPOCH } })

  ctx.clock.flush() // t=0：锚定 + 首个采样 A（映射到本地 ts=0）
  await tick()
  ctx.clock.flush(16) // t=16：仍是采样 A
  const h = ctx.modelLoader.handles[0]
  assertClose(h.applied.at(-1).tool0, fkChain(kin, A).tool0, '单采样阶段必须就是样本本身')

  // 第二个采样：host ts 只前进 100 ms（epoch 域）
  ctx.state.set({ q: B, ts: EPOCH + 100 })
  ctx.clock.flush(16) // t=32 ⇒ 渲染时刻 = 32 - 100 = -68 ⇒ alpha=0（仍在滞后窗口内）
  assertClose(h.applied.at(-1).tool0, fkChain(kin, A).tool0, '滞后窗口内呈现的是 prev（A）')

  // 时间推进到"渲染时刻进入样本窗口"：t=116 ⇒ 渲染时刻 16 ⇒ alpha=16/100
  ctx.clock.flush(84)
  const mid = h.applied.at(-1).tool0
  assertClose(mid, fkChain(kin, lerpJoints(A, B, 16 / 100)).tool0, 't=116ms 应为 16% 插值')
  assert.ok(
    !tool0Equals(mid, fkChain(kin, A).tool0),
    'epoch ts 下不得冻结在上一采样（少了时钟锚定就会恒等于 fk(A)）',
  )
  assert.ok(!tool0Equals(mid, fkChain(kin, B).tool0), '尚未越过窗口，不应已经等于 fk(B)')

  // 渲染时刻越过样本窗口 → 收敛到新采样
  ctx.clock.flush(100) // t=216 ⇒ 渲染时刻 116 ≥ 100
  assertClose(h.applied.at(-1).tool0, fkChain(kin, B).tool0, '超过采样窗口后必须收敛到最新采样')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 10：未知型号不崩 + 回退文案
 * ------------------------------------------------------------------ */

test('未知型号不抛错：仍按该型号加载并 applyFK，错误行为空；回退时文案有提示', async () => {
  const ctx = boot({
    initial: { connected: true, model: 'UR99', q: Q0, tcp: TCP0, ts: 1000 },
    usedFallback: true,
  })

  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)

  assert.deepEqual(ctx.modelLoader.calls, ['UR99'], '型号原样交给 modelLoader（大小写由 loader 处理）')
  assert.ok(ctx.modelLoader.handles[0].applyFKCount >= 1, '未知型号也必须能摆姿态（退回默认链）')
  assert.equal(errorEl(ctx).textContent, '', '不得留下渲染异常')
  assert.match(statusEl(ctx).textContent, /近似几何体/, '回退时必须给出提示文案')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用例 10：纯函数 —— 运动学解析 / 文本格式化 / 样式幂等
 * ------------------------------------------------------------------ */

test('resolveKinematics：大小写不敏感，未知/空型号退回默认链且不抛错', () => {
  assert.equal(resolveKinematics('UR5E'), resolveKinematics('ur5e'))
  assert.equal(resolveKinematics('UR5E').links.length, 6)
  assert.equal(resolveKinematics('ur99'), resolveKinematics(DEFAULT_KINEMATICS_KEY))
  assert.equal(resolveKinematics(''), resolveKinematics(DEFAULT_KINEMATICS_KEY))
  assert.equal(resolveKinematics(null), resolveKinematics(DEFAULT_KINEMATICS_KEY))
  assert.equal(resolveKinematics(undefined), resolveKinematics(DEFAULT_KINEMATICS_KEY))
  assert.equal(resolveKinematics('ur3').links[0].z, 0.1519, 'UR3 shoulder.z 应与官方一致')
})

test('formatJoints/formatTcp：弧度转度、缺值显示 --、不抛错', () => {
  assert.equal(
    formatJoints([Math.PI, -Math.PI / 2, 0, 0, 0, 0]),
    '关节角 (°)  J1 180.0  J2 -90.0  J3 0.0  J4 0.0  J5 0.0  J6 0.0',
  )
  assert.equal(formatJoints([]), '关节角 (°)  J1 --  J2 --  J3 --  J4 --  J5 --  J6 --')
  assert.equal(
    formatTcp([0.1, 0.2, 0.3, 0.01, 0.02, 0.03]),
    'TCP(米/轴角弧度)  x 0.1000  y 0.2000  z 0.3000  rx 0.010  ry 0.020  rz 0.030',
  )
  assert.ok(formatTcp(null).includes('x --'))
  assert.equal(formatJoints(undefined).includes('--'), true)
  // 姿态必须标明是轴角旋转向量：写成 rx/ry/rz 会被当成 RPY 读，从而得出错误朝向。
  assert.match(formatTcp([0, 0, 0, 0, 0, 0]), /轴角/)
})

test('describeDisconnected：不同失败码必须给出不同的人话（不要都渲染成"未连接"）', () => {
  assert.match(describeDisconnected('no_robot', 'no robot connected'), /ursim_connect/)
  assert.match(describeDisconnected('robot_not_connected', 'robot 1.2.3.4 is not connected'), /1\.2\.3\.4/)
  const ambiguous = describeDisconnected('ambiguous_robot', '要指定', ['1.1.1.1', '2.2.2.2'])
  assert.match(ambiguous, /多台/)
  assert.match(ambiguous, /1\.1\.1\.1/)
  assert.match(describeDisconnected('worker_unavailable', 'UR worker unavailable'), /ursim_ping/)
  assert.match(describeDisconnected('robot_error', '超时'), /超时/)
  // 未知码不得吞掉 reason
  assert.match(describeDisconnected(undefined, '自定义原因'), /自定义原因/)
})

test('未连接时状态行显示 host 的具体原因，而不是一句固定的「未连接机器人」', () => {
  const ctx = boot({ initial: { connected: false, code: 'worker_unavailable', error: 'UR worker unavailable' } })
  ctx.clock.flush()
  assert.match(statusEl(ctx).textContent, /UR 控制进程不可用/)
  assert.match(statusEl(ctx).textContent, /ursim_ping/)
  assert.doesNotMatch(statusEl(ctx).textContent, /^未连接机器人$/)
  ctx.panel.dispose()
})

test('host 报 degraded（q 不完整）时状态行如实提示，而不是继续显示"已连接"', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  assert.match(statusEl(ctx).textContent, /已连接/)

  ctx.state.set({ connected: true, model: 'UR3', q: [], tcp: [], ts: 2000, degraded: true })
  ctx.clock.flush(20)
  assert.match(statusEl(ctx).textContent, /未返回完整的关节角/)
  ctx.panel.dispose()
})

test('轨迹只在"新采样"时入队：同一 ts 被读多帧不得把缓冲灌满重复点', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })

  // 同一份快照（同一个 ts）推 30 帧：真样本只有 1 个。
  ctx.clock.flush()
  await tick()
  for (let i = 0; i < 29; i++) ctx.clock.flush(16)

  const line = lineOf(ctx)
  const drawn = line.geometry.drawRange.count
  assert.equal(drawn, 1,
    `同一个 ts 必须只入队一次（实测画出 ${drawn} 个点）—— 以前每帧都压一次，600 点容量只装得下约 100 个真样本`)

  // 换一个 ts → 才应该再多一个点。
  ctx.state.set({ connected: true, model: 'UR3', q: Q0, tcp: [0.2, 0.2, 0.3, 0, 0, 0], ts: 2000 })
  ctx.clock.flush(16)
  assert.equal(line.geometry.drawRange.count, 2, '新采样必须入队')
  ctx.panel.dispose()
})

test('数值面板显示的是测量样本（不是插值中间态），且带 title 便于读被截断的关节', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const joints = jointsEl(ctx)
  assert.equal(joints.textContent, formatJoints(Q0), 'HUD 关节行必须是控制器报出的那一笔')
  assert.equal(joints.getAttribute('title'), joints.textContent, '必须给出完整文本的 title')

  // 新采样到达后，HUD 显示的应是**新样本**而不是上一笔与它之间的插值。
  const Q1 = [0, Math.PI / 4, 0, 0, 0, 0]
  ctx.state.set({ connected: true, model: 'UR3', q: Q1, tcp: TCP0, ts: 1100 })
  ctx.clock.flush(16)
  ctx.clock.flush(HUD_INTERVAL_MS)
  assert.equal(joints.textContent, formatJoints(Q1), 'HUD 必须跟到最新测量值')
  ctx.panel.dispose()
})

test('WebGL 不可用时降级为纯数值模式：不抛未处理异常、状态行说明原因、循环继续跑', async () => {
  const doc = makeDoc()
  const container = makeContainer(doc)
  const state = makeFakeState({ connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 })
  const clock = makeClock()
  const throwingSceneFactory = () => { throw new Error('no WebGL context available') }

  const panel = mountTwinPanel({
    container,
    state,
    sceneFactory: throwingSceneFactory,
    modelLoader: makeModelLoader({}),
    raf: clock.raf,
    caf: clock.caf,
    now: clock.now,
  })

  clock.flush()
  // 场景是在模型加载完成后才创建的（懒创建），所以要让 async 的 loadModel 跑完。
  await tick()
  clock.flush(16)
  const status = byAttr(container, 'data-ursim-twin-status')[0]
  // 以前这个异常会变成未处理的 promise rejection：状态行永远停在「正在加载模型…」，
  // 画布一片空白，且没有任何错误提示。
  assert.match(status.textContent, /不支持 WebGL/, `实测：${status.textContent}`)
  // 循环必须还活着（数值通道继续更新）。
  const joints = byAttr(container, 'data-ursim-twin-joints')[0]
  assert.equal(joints.textContent, formatJoints(Q0), '纯数值模式下数值仍必须更新')
  panel.dispose()
})

test('dispose 会断开 ResizeObserver（侧栏宽度变化必须有监听，且不能泄漏）', () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  const observers = ctx.doc.defaultView.__observers
  // 假 DOM 里可能没有 ResizeObserver 实现：此时退回 window.resize + 每帧重试，也算通过。
  if (Array.isArray(observers) && observers.length > 0) {
    assert.equal(observers[0].disconnected, false)
    ctx.panel.dispose()
    assert.equal(observers[0].disconnected, true, 'dispose 必须 disconnect')
  } else {
    ctx.panel.dispose()
  }
})

test('injectStyles 幂等：重复调用复用同一个 <style>，无 DOM 时返回 null 而不抛错', () => {
  const doc = makeDoc()
  const a = injectStyles(doc)
  const b = injectStyles(doc)
  assert.equal(a, b, '第二次调用必须复用同一个元素')
  assert.equal(findAll(doc.head, (e) => e.tagName === 'STYLE').length, 1, '不得重复注入')
  assert.equal(a.id, TWIN_STYLE_ID)
  assert.equal(a.textContent, TWIN_CSS)
  assert.equal(a.getAttribute('data-dsh-ursim-twin-style'), '')
  assert.equal(injectStyles(null), null, '没有 DOM 时必须安全返回 null')
  assert.equal(injectStyles({}), null)
})

/* ================================================================== *
 * fix round 1（控制器裁决 U2）：渲染滞后一个采样周期
 *
 * 设计意图：客户端要做的是**插值**平滑，而不是"显示最新采样"。
 * 最新样本的到达时刻 ≈ 它的产生时刻 ⇒ 不滞后时 alpha 恒被钳到 1，
 * 只有 ~10 Hz 阶梯、等于没有插值。滞后"一个采样周期"后，渲染时刻恰好
 * 落在最近两个样本的时间窗内 ⇒ alpha ∈ (0,1)。
 * 滞后量用**宿主 ts 的差值**自校准（不需要知道轮询间隔），并有上限兜底。
 *
 * 时序约定：假时钟每帧 +16 ms，host 样本按测试给定的间隔到达；
 * host ts 用 epoch 量级（与 lib/twin-routes.js 的 `ts: Date.now()` 一致），
 * 面板的时钟锚定把 host 时间轴平移到本地 `now()` 轴上（偏差 D1）。
 * ================================================================== */

const EPOCH = 1_700_000_000_000
const A0 = [0, 0, 0, 0, 0, 0]
const B0 = [Math.PI / 2, 0, 0, 0, 0, 0]
const KIN3 = resolveKinematics('ur3')
const fkOf = (q) => fkChain(KIN3, q).tool0
const lastFk = (ctx) => ctx.modelLoader.handles[0].applied.at(-1).tool0

/** 与 `twin-panel.js` 导出的 `RENDER_DELAY_MAX_MS` 必须一致（下面有交叉断言）。 */
const RENDER_DELAY_CAP_EXPECTED = 400

/** 连接中 + 模型已就绪 + 时钟锚定在本地 t=0、已吃下样本 A0 的上下文。 */
async function bootConnectedSampleA() {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: A0, tcp: TCP0, ts: EPOCH } })
  ctx.clock.flush() // t=0：锚定（host EPOCH → 本地 0）并吃下样本 A0
  await tick() // 模型就绪，之后每一帧都会 applyFK
  return ctx
}

test('fix round 1：渲染滞后一个采样周期 —— 插值位置严格落在两端之间（不得钳到端点）', async () => {
  const ctx = await bootConnectedSampleA()

  // 采样未变（prev 仍为空）⇒ 不插值，就是 A 本身
  ctx.clock.flush(100) // t=100
  assertClose(lastFk(ctx), fkOf(A0), '单样本阶段必须就是样本本身')

  // host 在 t=100 出了第二个样本（ts 前进 100 ms）
  ctx.state.set({ q: B0, ts: EPOCH + 100 })
  ctx.clock.flush(16) // t=116 ⇒ 滞后 100 ms ⇒ 渲染时刻 16 ms ⇒ alpha=0.16
  const pose = lastFk(ctx)
  assert.ok(!tool0Equals(pose, fkOf(B0)), '不得钳到最新端点 fk(B)：无滞后的实现会恒等于 fk(B)')
  assert.ok(!tool0Equals(pose, fkOf(A0)), '也不得仍停在 fk(A)')
  assertClose(pose, fkOf(lerpJoints(A0, B0, 16 / 100)), '渲染时刻 = now - 100 ms ⇒ alpha=0.16')

  // 帧继续推进 ⇒ alpha 在样本窗口内单调推进；越过一个采样周期后到达最新样本
  ctx.clock.flush(16) // t=132 ⇒ alpha=0.32
  assertClose(lastFk(ctx), fkOf(lerpJoints(A0, B0, 32 / 100)), 't=132 ms ⇒ alpha=0.32')
  for (let i = 0; i < 5; i++) ctx.clock.flush(16) // t=212 ≥ 100+100
  assertClose(lastFk(ctx), fkOf(B0), '越过采样间隔后必须收敛到最新样本')

  ctx.panel.dispose()
})

test('fix round 1：滞后量由宿主 ts 的采样间隔自校准（间隔不同 ⇒ alpha 不同）', async () => {
  /** 采样间隔 spanMs：新样本到达后 16 ms 的那一帧，渲染时刻应为 16 ms ⇒ alpha=16/spanMs。 */
  const poseAfterNewSample = async (spanMs) => {
    const ctx = await bootConnectedSampleA()
    ctx.clock.flush(spanMs) // 采样未变，时间推进一整个采样间隔
    ctx.state.set({ q: B0, ts: EPOCH + spanMs })
    ctx.clock.flush(16)
    const pose = lastFk(ctx)
    ctx.panel.dispose()
    return pose
  }

  const p100 = await poseAfterNewSample(100)
  const p200 = await poseAfterNewSample(200)

  assertClose(p100, fkOf(lerpJoints(A0, B0, 16 / 100)), '间隔 100 ms ⇒ alpha=0.16')
  assertClose(p200, fkOf(lerpJoints(A0, B0, 16 / 200)), '间隔 200 ms ⇒ alpha=0.08（滞后量随间隔变）')
  assert.ok(!tool0Equals(p100, p200), '同一组样本在不同采样间隔下必须得到不同的插值位置')
})

test('fix round 1：滞后上限生效（超长间隔不卡在很久以前）', async () => {
  const ctx = await bootConnectedSampleA()

  ctx.clock.flush(5000) // host 卡顿/丢帧：间隔 5000 ms
  ctx.state.set({ q: B0, ts: EPOCH + 5000 })
  ctx.clock.flush(16) // t=5016 ⇒ 原始间隔 5000 ms，滞后必须被钳到上限
  const pose = lastFk(ctx)
  const cappedRenderTime = 5016 - RENDER_DELAY_CAP_EXPECTED
  assertClose(
    pose,
    fkOf(lerpJoints(A0, B0, cappedRenderTime / 5000)),
    `滞后必须被钳到上限 ${RENDER_DELAY_CAP_EXPECTED} ms`,
  )
  assert.ok(!tool0Equals(pose, fkOf(A0)), '不得"卡在很久以前"（滞后不能随间隔无限增长）')

  ctx.panel.dispose()
})

test('fix round 1：只有单个样本时不插值（行为不变）', async () => {
  const ctx = await bootConnectedSampleA()

  // 长时间无新样本：prev 始终为空 ⇒ 呈现的必须精确等于 fk(A0)（不插值、不 NaN）。
  // ⚠️ "静止后不再重算"是 ① 的契约，所以这里只断言**结果**，不要求每帧都算一次。
  for (const dt of [16, 16, 500, 5000]) {
    ctx.clock.flush(dt)
    assertClose(lastFk(ctx), fkOf(A0), `单样本阶段（+${dt}ms）必须就是样本本身`)
  }
  assert.ok(ctx.modelLoader.handles[0].applyFKCount >= 1, '至少要摆过一次姿态')

  ctx.panel.dispose()
})

test('fix round 1：renderDelayMs 纯函数 —— 自校准为采样间隔，并有上下限钳制', () => {
  // 测试里引用的上限必须与实现导出的常量一致
  assert.equal(RENDER_DELAY_MAX_MS, RENDER_DELAY_CAP_EXPECTED)
  assert.equal(RENDER_DELAY_MIN_MS, 0)

  assert.equal(renderDelayMs({ q: [], ts: 1000 }, { q: [], ts: 1100 }), 100, '间隔 100ms ⇒ 滞后 100ms')
  assert.equal(renderDelayMs({ q: [], ts: 1000 }, { q: [], ts: 1200 }), 200, '间隔 200ms ⇒ 滞后 200ms')
  assert.equal(renderDelayMs({ q: [], ts: 0 }, { q: [], ts: 5000 }), RENDER_DELAY_MAX_MS, '超长间隔钳到上限')
  assert.equal(renderDelayMs({ q: [], ts: 100 }, { q: [], ts: 100 }), RENDER_DELAY_MIN_MS, '零间隔 ⇒ 不滞后')
  assert.equal(renderDelayMs({ q: [], ts: 200 }, { q: [], ts: 100 }), RENDER_DELAY_MIN_MS, '时间倒退 ⇒ 不滞后')
  assert.equal(renderDelayMs(undefined, { q: [], ts: 1 }), RENDER_DELAY_MIN_MS, '缺样本 ⇒ 不滞后（不返回 NaN）')
  assert.equal(renderDelayMs({ q: [], ts: 1 }, undefined), RENDER_DELAY_MIN_MS)
  assert.equal(Number.isFinite(renderDelayMs({ q: [], ts: NaN }, { q: [], ts: NaN })), true)
})

/* ------------------------------------------------------------------ *
 * 关节限位（kinematics.json 里一直躺着、从没被用过的数据）+ 身份行
 * ------------------------------------------------------------------ */

test('overLimitJoints：只标出真正超限的关节，且绝不因畸形输入抛错', () => {
  // J3 的限位是 null（UR 的某个腕关节常常不限位），必须被跳过而不是当成 0。
  const limits = [[-1, 1], [-1, 1], null, [-1, 1], [-1, 1], [-1, 1]]

  assert.deepEqual(overLimitJoints([0, 0, 0, 0, 0, 0], limits), [], '全在限位内')
  assert.deepEqual(overLimitJoints([0, 1.5, 0, 0, 0, 0], limits), [2], 'J2 超上限')
  assert.deepEqual(overLimitJoints([-2, 0, 0, 0, 0, 2], limits), [1, 6], '两端各一个')
  assert.deepEqual(overLimitJoints([1, -1, 0, 0, 0, 0], limits), [], '恰好等于限位不算超限')
  assert.deepEqual(overLimitJoints([0, 0, 999, 0, 0, 0], limits), [], 'null 限位的关节不参与判定')

  // 畸形输入一律静默跳过：一块坏掉的限位表不该让整行 HUD 停更。
  assert.deepEqual(overLimitJoints(null, limits), [])
  assert.deepEqual(overLimitJoints([0, 0, 0, 0, 0, 0], null), [])
  assert.deepEqual(overLimitJoints([0, Number.NaN, 0, 0, 0, 0], limits), [])
  assert.deepEqual(overLimitJoints([0, 0], [[-1, 1], [-1, 1]]), [], '长度不齐只比对公共部分')
  assert.deepEqual(overLimitJoints([0, 0, 0, 0, 0, 0], [[1, -1], 0, null, 'x', [], [-1, 1]]), [],
    '非法限位条目跳过')
})

test('★ ① 静止降频：数据没变时不再每帧重算姿态（旧写法 60 Hz 全跑）', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16) // 首帧：吃下采样并摆姿态

  const handle = ctx.modelLoader.handles[0]
  assert.ok(handle.applyFKCount >= 1, '首帧必须摆过一次姿态')

  // 越过插值窗口后再数：此刻数据没有任何变化，姿态结果与上一帧逐位相同。
  ctx.clock.flush(300)
  const baseline = handle.applyFKCount
  for (let i = 0; i < 62; i += 1) ctx.clock.flush(16) // ≈1 秒的 60 Hz 帧

  const extra = handle.applyFKCount - baseline
  assert.ok(
    extra <= 3,
    `静止 1 秒内只应在数据/窗口变化时重算姿态，实际重算了 ${extra} 次（旧写法约 62 次）`,
  )
  ctx.panel.dispose()
})

test('未超限时关节行与 formatJoints 逐字一致（不引入任何后缀），并标记 overlimit=false', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)

  const joints = jointsEl(ctx)
  assert.equal(joints.textContent, formatJoints(Q0))
  assert.equal(joints.getAttribute('data-ursim-twin-overlimit'), 'false')
  ctx.panel.dispose()
})

test('★ 关节超出该型号限位时必须标出来（回归：限位表曾取自 fkChain 不存在的字段 ⇒ 提示恒不生效）', async () => {
  // 限位表来自 kinematics.json（`resolveKinematics()` 的返回值）。旧写法把它写成
  // `fkResult?.jointLimits`，而 `fkChain()` 的返回结构恒为 `{links, tool0}` —— 于是传入
  // `undefined`，`overLimitJoints` 第一行就返回空数组：这个提示 100% 不生效，测试却是绿的。
  const kin = resolveKinematics('ur3')
  const beyond = [...Q0]
  beyond[1] = kin.jointLimits[1][1] + 0.5 // J2 越过上限

  const ctx = boot({ initial: { connected: true, model: 'UR3', q: beyond, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)

  const joints = jointsEl(ctx)
  assert.equal(
    joints.getAttribute('data-ursim-twin-overlimit'),
    'true',
    'J2 超限必须标记（旧写法传 fkChain 不存在的 jointLimits ⇒ 恒为 false）',
  )
  assert.notEqual(joints.textContent, formatJoints(beyond), '超限时关节行必须带上提示后缀')
  ctx.panel.dispose()
})

test('身份行把机型与 IP 显示成可见文本（IP 以前只落在属性上）', async () => {
  const ctx = boot({
    initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000, ip: '192.168.2.201' },
  })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(120) // 越过 HUD 的 ~10 Hz 节流

  const identity = byAttr(ctx.container, 'data-ursim-twin-identity')[0]
  assert.ok(identity.textContent.includes('UR5E'), identity.textContent)
  assert.ok(identity.textContent.includes('192.168.2.201'), 'IP 必须是可见文本，不只是属性')
  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 0.6.3：消费 detail=1（dashboard 侧状态）—— 安全模式与速度倍率
 * ------------------------------------------------------------------ */

test('detail 文案：状态串翻成人话，未知值原样露出而不吞掉', () => {
  assert.equal(describeSafetyMode('NORMAL'), '正常')
  assert.equal(describeSafetyMode('PROTECTIVE_STOP'), '保护性停止')
  assert.equal(describeRobotMode('IDLE'), '空闲')
  assert.equal(describeProgramState('PLAYING'), '运行中')
  assert.equal(describeSafetyMode('<查询失败>'), '查询失败')
  assert.equal(describeSafetyMode(''), '--')
  assert.equal(describeSafetyMode(undefined), '--')
  // 固件新增模式：必须原样显示 —— 不能因为不认识就渲染成空白，那等于假装正常。
  assert.equal(describeSafetyMode('BRAND_NEW_MODE'), 'BRAND_NEW_MODE')
})

test('isSafetyHazard：只有 NORMAL/REDUCED 算正常，未知值宁可多提醒一次', () => {
  assert.equal(isSafetyHazard('NORMAL'), false)
  assert.equal(isSafetyHazard('reduced'), false, '大小写不敏感')
  assert.equal(isSafetyHazard('PROTECTIVE_STOP'), true)
  assert.equal(isSafetyHazard('BRAND_NEW_MODE'), true, '不认识的模式按异常处理')
  assert.equal(isSafetyHazard(''), false, '空值＝不可用，不算异常')
  assert.equal(isSafetyHazard(undefined), false, '没有 detail 时不得谎报异常')
})

test('formatSpeedScaling / formatDetail：拼出 HUD 行，缺字段不编造', () => {
  assert.equal(formatSpeedScaling(1), 'x1.00')
  assert.equal(formatSpeedScaling(0.25), 'x0.25')
  assert.equal(formatSpeedScaling(undefined), '--')

  const full = formatDetail({
    safety_mode: 'NORMAL',
    robot_mode: 'RUNNING',
    program_state: 'PLAYING',
    speed_scaling: 0.5,
    joint_temperatures: [40, 41, 42, 43, 44, 45],
    robot_voltage: 48.12,
    robot_current: 3.456,
  })
  assert.ok(full.status.includes('安全 正常'), full.status)
  assert.ok(full.status.includes('模式 运行中'), full.status)
  assert.ok(full.status.includes('速度 x0.50'), full.status)
  assert.equal(full.hazard, false)
  assert.ok(full.temps.includes('J1 40'), full.temps)
  assert.ok(full.power.includes('48.1 V'), full.power)

  assert.equal(formatDetail({ safety_mode: 'PROTECTIVE_STOP' }).hazard, true)
  for (const empty of [null, undefined, {}]) {
    const out = formatDetail(empty)
    assert.equal(out.hazard, false)
    assert.equal(typeof out.status, 'string')
  }
  assert.match(formatDetail({ error: 'dashboard 掉线' }).status, /查询失败/)
})

test('detail 到达后 HUD 显示安全模式与速度倍率；保护性停止压过「已连接 · 型号」', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  ctx.state.set({
    detail: {
      safety_mode: 'NORMAL',
      robot_mode: 'IDLE',
      program_state: 'STOPPED',
      speed_scaling: 0.75,
      joint_temperatures: [40, 41, 42, 43, 44, 45],
    },
    ts: 1100,
  })
  ctx.clock.flush(120)
  const detailEl = byAttr(ctx.container, 'data-ursim-twin-detail')[0]
  assert.ok(detailEl.textContent.includes('安全 正常'), detailEl.textContent)
  assert.ok(detailEl.textContent.includes('速度 x0.75'), detailEl.textContent)
  assert.equal(
    byAttr(ctx.container, 'data-ursim-twin-panel')[0].getAttribute('data-ursim-twin-hazard'),
    'false',
  )

  // 保护性停止：状态行必须让位给安全提示 —— 机器人停着而界面写着「已连接」是最危险的一种假象。
  ctx.state.set({
    detail: { safety_mode: 'PROTECTIVE_STOP', robot_mode: 'IDLE', program_state: 'STOPPED', speed_scaling: 0 },
    ts: 1200,
  })
  ctx.clock.flush(120)
  const status = statusEl(ctx)
  assert.ok(status.textContent.includes('保护性停止'), status.textContent)
  assert.ok(status.textContent.includes(STATUS_SAFETY_HINT), status.textContent)
  assert.equal(
    byAttr(ctx.container, 'data-ursim-twin-panel')[0].getAttribute('data-ursim-twin-hazard'),
    'true',
  )
  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 0.6.3：视角工具栏（重置视角 / 视图预设）
 * ------------------------------------------------------------------ */

test('工具栏渲染全部视角按钮；点预设只转方向、点重置按当前模型重新取景', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const buttons = byAttr(ctx.container, 'data-ursim-twin-view-button')
  assert.deepEqual(
    buttons.map((b) => b.getAttribute('data-ursim-twin-view-button')),
    VIEW_BUTTONS.map((b) => b.key),
    '按钮集合与顺序必须与 VIEW_BUTTONS 一致',
  )

  const sceneHandle = ctx.sceneFactory.created[0]
  const h = ctx.modelLoader.handles[0]
  // 模型就绪即按包围盒取景 —— "换个大臂就贴脸"就是在这一步修掉的。
  assert.equal(sceneHandle.fitCalls.length, 1, '模型就绪必须调用一次 fitTo')
  assert.equal(sceneHandle.fitCalls[0], h.root, 'fitTo 必须收到模型根节点')

  buttons.find((b) => b.getAttribute('data-ursim-twin-view-button') === 'front').listeners.click[0]()
  assert.deepEqual(sceneHandle.presetCalls, ['front'], '前视按钮必须转成 front 方向')

  buttons.find((b) => b.getAttribute('data-ursim-twin-view-button') === 'reset').listeners.click[0]()
  assert.equal(sceneHandle.fitCalls.length, 2, '重置视角必须重新 fitTo')
  ctx.panel.dispose()
})

test('未连接时工具栏隐藏，且点击不抛错（场景还没建）', async () => {
  const ctx = boot({ initial: { connected: false } })
  ctx.clock.flush()
  assert.equal(byAttr(ctx.container, 'data-ursim-twin-toolbar')[0].style.display, 'none', '未连接不得显示工具栏')
  const buttons = byAttr(ctx.container, 'data-ursim-twin-view-button')
  assert.ok(buttons.length > 0, '按钮节点应当已经建好')
  assert.doesNotThrow(() => buttons.forEach((b) => b.listeners.click[0]()))
  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 0.6.3：按需渲染 + 后台暂停
 * ------------------------------------------------------------------ */

test('按需渲染：静止（无新采样、插值窗口已过）时不再出帧', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)
  const sceneHandle = ctx.sceneFactory.created[0]
  assert.ok(sceneHandle.renders > 0, '首帧必须渲染')

  // 快照 ts 不变 ⇒ 没有新采样；插值窗口（含 64 ms 余量）走完后不该再有 render。
  ctx.clock.flush(500)
  const afterIdle = sceneHandle.renders
  ctx.clock.flush(500)
  assert.equal(sceneHandle.renders, afterIdle, '静止期间不得继续出帧（以前每帧无条件渲染）')
  ctx.panel.dispose()
})

test('后台标签彻底停帧、回前台继续；dispose 必须摘掉 visibilitychange 监听', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)
  const sceneHandle = ctx.sceneFactory.created[0]
  const before = sceneHandle.renders
  assert.ok(before > 0)

  const pendingBeforeHide = [...ctx.clock.queue.keys()].at(-1)
  assert.equal(typeof pendingBeforeHide, 'number', '必须已排好下一帧')

  ctx.doc.hidden = true
  ctx.doc.defaultView.dispatch('visibilitychange')
  assert.ok(ctx.clock.cancelled.includes(pendingBeforeHide), '后台必须取消已排队的那一帧')

  ctx.clock.flush(1000)
  assert.equal(ctx.clock.queue.size, 0, '后台不得再续帧')
  assert.equal(sceneHandle.renders, before, '后台不得再渲染')

  ctx.doc.hidden = false
  ctx.doc.defaultView.dispatch('visibilitychange')
  assert.equal(ctx.clock.queue.size, 1, '回到前台必须重新排队一帧')
  ctx.clock.flush(16)
  assert.ok(sceneHandle.renders > before, '回到前台后必须继续渲染')

  ctx.panel.dispose()
  assert.equal(ctx.doc.defaultView.resizeListeners.length, 0, 'dispose 不得留下任何监听（含 visibilitychange）')
})

test('待审批的运动目标在 HUD 上显示摘要；没有审批时该行为空', async () => {
  const ctx = boot({
    initial: {
      connected: true,
      model: 'UR3',
      q: Q0,
      tcp: TCP0,
      ts: 1000,
      pendingMotion: {
        tool: 'ursim_movej',
        kind: 'joints',
        q: Q0,
        summary: '关节运动：J1 0.0°  J2 -90.0°',
      },
    },
  })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(120) // 越过 HUD 的 ~10 Hz 节流

  const pending = byAttr(ctx.container, 'data-ursim-twin-pending')[0]
  assert.ok(pending, '必须有待审批行')
  assert.match(pending.textContent, /待审批/, pending.textContent)
  assert.match(pending.textContent, /关节运动/, '摘要必须被显示出来')
  ctx.panel.dispose()
})

test('可访问性（清单第 16 条）：canvas 可被描述与聚焦，HUD 是 aria-live 读数区', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const canvas = byAttr(ctx.container, 'data-ursim-twin-canvas')[0]
  assert.equal(canvas.getAttribute('role'), 'img', 'canvas 对读屏软件不可见，必须给 role')
  assert.ok(canvas.getAttribute('aria-label'), 'canvas 必须有可读的描述')
  assert.equal(
    canvas.getAttribute('tabindex'),
    '0',
    'canvas 必须可聚焦 —— 不可聚焦的话注册了键盘处理也收不到事件',
  )

  const hud = byAttr(ctx.container, 'data-ursim-twin-hud')[0]
  assert.equal(hud.getAttribute('aria-live'), 'polite', '读数变化必须被播报')
  assert.equal(hud.getAttribute('role'), 'status')

  // 图层开关（第 9 条加的）必须带 aria-pressed，否则读屏软件读不出开关状态。
  const toggle = byAttr(ctx.container, 'data-ursim-twin-layer-reach')[0]
  assert.ok(toggle, '图层开关必须存在')
  assert.equal(toggle.getAttribute('aria-pressed'), 'false')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 数据通道看门狗（0.6.6）
 *
 * 现场问题：机器人运动时 Python worker 被运动指令占住，仿真的读排队 ⇒ 宿主**一个事件都不发**
 * ⇒ 画面停在最后一帧、界面上没有任何提示。用户只能看到"仿真不动了"，而最危险的是他无从分辨
 * "机器人停了"与"数据停了"。所以：停滞必须**被看见**，并且面板要能自己推一把。
 * ------------------------------------------------------------------ */

test('describeFeedHealth：通道正常时不出声；停滞/重连/不支持都给出可读文案', () => {
  // 正常：什么都不显示（不占界面）
  assert.equal(describeFeedHealth({ status: 'open', connected: true, ageMs: 100 }), '')
  assert.equal(describeFeedHealth({ status: 'idle', connected: false, ageMs: 0 }), '')

  // 停滞：给出"停了多久"与诊断计数
  const stalled = describeFeedHealth({
    status: 'open', connected: true, ageMs: 4200, frames: 12, frameErrors: 3,
  })
  assert.ok(stalled.startsWith(FEED_STALE_PREFIX), stalled)
  assert.match(stalled, /4\.2s/)
  assert.match(stalled, /12 帧/)
  assert.match(stalled, /失败 3 帧/)

  // 宿主自报停滞（feedStale）时也算，哪怕树里的 ageMs 还没到阈值
  assert.ok(
    describeFeedHealth({ status: 'open', connected: true, feedStale: true, ageMs: 0 })
      .startsWith(FEED_STALE_PREFIX),
  )

  // 正在重连：优先级高于"停滞"（此时用户最需要知道它在自愈）
  assert.ok(
    describeFeedHealth({ status: 'retrying', connected: true, ageMs: 60000 }).startsWith(FEED_RETRYING_TEXT),
  )
  assert.ok(describeFeedHealth({ status: 'connecting', connected: false }).startsWith(FEED_RETRYING_TEXT))
  assert.match(describeFeedHealth({ status: 'unsupported' }), /EventSource/)

  // 未连接时"数据停滞"已由状态行表达，不要重复刷屏
  assert.equal(describeFeedHealth({ status: 'open', connected: false, feedStale: true, ageMs: 9000 }), '')
})

test('数据停滞：面板写出提示行；停滞过久后**强制重建**通道', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const feed = () => byAttr(ctx.container, 'data-ursim-twin-feed')[0]
  assert.ok(feed(), '必须有数据通道提示行')
  assert.equal(feed().style.display, 'none', '通道正常时这一行不占位')
  assert.equal(feed().textContent, '')

  // 采样不再推进（ts 不变）但时钟继续走 ⇒ 达到停滞阈值
  ctx.clock.flush(FEED_STALE_MS + 500)
  assert.equal(feed().style.display, '', '★ 停滞必须被显示出来（不能再静默冻屏）')
  assert.ok(feed().textContent.startsWith(FEED_STALE_PREFIX), feed().textContent)
  assert.equal(feed().getAttribute('data-ursim-twin-feed-state'), 'stale')

  // 停滞超过 FEED_RECONNECT_MS ⇒ 面板强制重建通道（退避定时器可能已被浏览器节流）
  assert.deepEqual(ctx.state.retries, [], '还没到强制重建的时长，不该乱拆连接')
  ctx.clock.flush(FEED_RECONNECT_MS)
  assert.deepEqual(ctx.state.retries, [true], '★ 停滞过久必须强制重建（force=true）')
  ctx.clock.flush(FEED_RECONNECT_MS)
  assert.equal(ctx.state.retries.length, 2, '强制重建要被节流（不能每帧都拆）')

  // 新采样到达 ⇒ 提示行消失、状态回到正常
  ctx.state.set({ ts: 2000, q: Q0, tcp: TCP0 })
  ctx.clock.flush(HUD_INTERVAL_MS + 20)
  assert.equal(feed().textContent, '', '收到新采样后必须清掉停滞提示')
  assert.equal(feed().style.display, 'none')
  ctx.panel.dispose()
})

test('重连中：面板如实显示"数据通道重连中…"（而不是留着冻住的画面不说）', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.state.setHealth({ status: 'retrying', frames: 5, frameErrors: 2 })
  ctx.clock.flush()
  await tick()

  const feed = byAttr(ctx.container, 'data-ursim-twin-feed')[0]
  assert.ok(feed.textContent.startsWith(FEED_RETRYING_TEXT), feed.textContent)
  assert.equal(feed.getAttribute('data-ursim-twin-feed-state'), 'retrying')
  assert.match(feed.textContent, /5 帧/)

  // 恢复后自己消失
  ctx.state.setHealth({ status: 'open' })
  ctx.clock.flush()
  assert.equal(feed.textContent, '')
  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 换机器人：型号同步（0.7.0）
 *
 * 场景：仿真正显示 UR3，同一个 IP 上换成了 UR5e（宿主按连接代次发现并给出新型号）。
 * 要求：① 立刻能从状态行看出"在换"；② 网格真的换掉；③ **上一台的运动记忆必须丢掉**
 * —— 插值对与轨迹属于那台机器人，留着会让新臂从旧姿态滑过去、并在两个 TCP 之间画出
 * 一条从未发生过的直线。
 * ------------------------------------------------------------------ */

test('换型号：状态行先显示「切换型号」，网格换掉后清空跨型号的轨迹', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: [0.01, 0, 0, 0, 0, 0], ts: 1000 } })

  // 先攒出 4 个轨迹点（旧机器人）
  ctx.clock.flush()
  await tick()
  for (let i = 1; i <= 3; i++) {
    ctx.state.set({ tcp: [(i + 1) / 100, 0, 0, 0, 0, 0], ts: 1000 + i * 10 })
    ctx.clock.flush(16)
  }
  const line = lineOf(ctx)
  assert.ok(line, '轨迹 Line 必须存在')
  assert.equal(line.geometry.drawRange.count, 4, '先攒够 4 个采样点（跨型号断言的前提）')

  // 同一个 IP 上报了另一个型号（真实场景：机器人被换了一台）
  ctx.state.set({ model: 'UR5E', tcp: [0.99, 0, 0, 0, 0, 0], ts: 1100 })
  ctx.clock.flush()
  assert.match(statusEl(ctx).textContent, /切换型号 ur5e/, '异步加载期间必须说出"在换型号"')
  await tick()
  ctx.clock.flush() // 换装完成后再推一帧

  assert.deepEqual(ctx.modelLoader.calls, ['UR3', 'UR5E'], '型号变化必须重新加载')
  assert.equal(
    line.geometry.drawRange.count,
    1,
    '★ 换型号必须丢掉旧机器人的轨迹点（否则会画出两台机器人之间的假直线）',
  )
  const attr = line.geometry.getAttribute('position')
  // 注意 Float32 的精度：0.99 存进去是 0.9900000095…，容差不能按 double 取。
  assert.ok(Math.abs(attr.array[0] - 0.99) < 1e-5, '轨迹的第一个点必须来自**换装后**的采样')

  // 状态行回到"已连接 · 新型号"，不再停留在切换中
  ctx.clock.flush(HUD_INTERVAL_MS + 20)
  assert.match(statusEl(ctx).textContent, /已连接 · ur5e/)

  // 同一个型号保持不变时不得反复加载（代次没变 ⇒ 宿主也不会再报变化）
  for (let i = 0; i < 10; i++) ctx.clock.flush(16)
  assert.deepEqual(ctx.modelLoader.calls, ['UR3', 'UR5E'])

  ctx.panel.dispose()
})

test('换型号后插值对清空：第一帧就用新型号运动学链的当前姿态，不做跨型号插值', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()
  // 再喂两帧攒出插值对（prev/cur）：第一帧仍只有单样本（不插值），第二帧起才有 prev
  const Q1 = [Math.PI / 3, 0.1, -0.2, 0.3, -0.4, 0.5]
  ctx.clock.flush(16)
  ctx.state.set({ q: Q1, ts: 1010 })
  ctx.clock.flush(16)
  assert.ok(ctx.modelLoader.handles[0].applyFKCount >= 2, '换型号前必须已经有旧机器人的姿态与插值对')

  // 换型号（关节角也来自新机器人）
  const Q2 = [0, -Math.PI / 2, 0, 0, 0, 0]
  ctx.state.set({ model: 'UR10E', q: Q2, ts: 1020 })
  ctx.clock.flush()
  await tick()
  ctx.clock.flush(16)

  const h2 = ctx.modelLoader.handles[1]
  assert.equal(ctx.modelLoader.calls[1], 'UR10E')
  // 换装后的**第一帧**必须是新链上的当前姿态本身（若插值对被沿用，这里会是旧样本的插值结果）
  const expected = fkChain(resolveKinematics('ur10e'), Q2).tool0
  assertClose(h2.applied[0].tool0, expected, '换型号后第一帧必须是新型号当前姿态（无跨型号插值）')

  ctx.panel.dispose()
})

test('型号加载失败：按 MODEL_RETRY_MS 节流重试，换成另一个型号则立刻重试', async () => {  const doc = makeDoc()
  const container = makeContainer(doc)
  const state = makeFakeState({ connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 })
  const sceneFactory = makeSceneFactory()
  const clock = makeClock()
  const calls = []
  const ok = makeModelLoader()
  const loader = async (modelId, deps) => {
    calls.push(modelId)
    if (String(modelId).toLowerCase() === 'ur5e') throw new Error('网格暂时取不到')
    return ok(modelId, deps)
  }
  const panel = mountTwinPanel({
    container,
    state,
    sceneFactory,
    modelLoader: loader,
    raf: clock.raf,
    caf: clock.caf,
    now: clock.now,
  })

  clock.flush()
  await tick()
  assert.deepEqual(calls, ['UR3'])

  // 换型号 → 加载失败：状态行必须说出来，而且**不能**就此认命
  state.set({ model: 'UR5E', ts: 1100 })
  clock.flush()
  await tick()
  assert.deepEqual(calls, ['UR3', 'UR5E'])
  assert.match(statusEl({ container }).textContent, /模型加载失败/)
  assert.match(statusEl({ container }).textContent, /重试/)

  // 未到重试间隔：不得每帧都重试
  for (let i = 0; i < 30; i++) clock.flush(16)
  await tick()
  assert.deepEqual(calls, ['UR3', 'UR5E'], '重试必须被节流，否则每帧都在打网格服务')

  // 到点：重试一次
  clock.flush(MODEL_RETRY_MS + 1)
  await tick()
  assert.deepEqual(calls, ['UR3', 'UR5E', 'UR5E'], '★ 到点必须重试，否则永远停在上一台机器人的网格上')

  // 换成**另一个**型号：属于新情况，不受上一个型号的重试节流影响
  state.set({ model: 'UR10E', ts: 1200 })
  clock.flush()
  await tick()
  assert.equal(calls.at(-1), 'UR10E', '另一个型号必须立刻加载，不能等上一个型号的重试窗口')

  panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 离线仿真开关（0.7.0）
 *
 * 面板默认**保持原样**（只读镜像真机）：一个写请求都不发。打开后由 AI 驱动虚拟机器人，
 * 而"这是仿真"必须一眼可见（角标 + 状态行 + 截图水印），因为它动起来与真机一模一样。
 * ------------------------------------------------------------------ */

const simToggleEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-toggle')[0]
const simBadgeEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-badge')[0]
const simModelEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-model')[0]
const simPresetEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-preset')[0]
const simErrorEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-error')[0]
const simBarEl = (ctx) => byAttr(ctx.container, 'data-ursim-twin-sim-bar')[0]

test('★ 打开面板即主动进仿真：默认就是 POST 一次 UR12e / 全零位 / 倍率 100%', async () => {
  // `autoSim: null` = **不传**该选项 ⇒ 用面板自己的默认值（true）。
  const ctx = boot({ initial: { connected: false, ts: 0 }, autoSim: null })
  ctx.clock.flush()
  await tick()
  await tick()

  assert.ok(simToggleEl(ctx), '必须有仿真开关')
  const posts = ctx.request.posts()
  assert.equal(posts.length, 1, '★ 打开面板必须恰好发一次 POST（就是这台默认仿真）')
  assert.equal(posts[0].url, '/nonead-ursim/twin/sim')
  assert.match(String(posts[0].headers['content-type']), /application\/json/)
  assert.deepEqual(
    JSON.parse(posts[0].body),
    { enabled: true, model: 'ur12e', preset: 'upright', speed_scaling: 1 },
    '★ 默认型号必须是 UR12e，起始姿态竖直收拢、倍率 100%',
  )
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1'], '数据源必须切到保留的仿真地址')
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'true', '开关要显示为"已开"')

  ctx.panel.dispose()
})

test('★ 真机连着也照样进仿真（不因连接态跳过）', async () => {
  const ctx = boot({
    initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 },
    autoSim: true,
  })
  ctx.clock.flush()
  await tick()
  await tick()

  assert.equal(ctx.request.posts().length, 1, '真机在线同样要开这台仿真')
  assert.equal(JSON.parse(ctx.request.posts()[0].body).model, 'ur12e')
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1'])
  ctx.panel.dispose()
})

test('★ 已经在仿真中：沿用那一台，绝不按默认型号重建', async () => {
  // 宿主自报 active=true —— AI 用 `ursim_sim_start` 开的、或另一个窗口开的。
  const request = makeFakeRequest({ active: true, model: 'ur20', models: ['ur12e', 'ur20'] })
  const ctx = boot({
    initial: { connected: true, model: 'UR20', q: Q0, tcp: TCP0, ts: 1000, simulated: true },
    request,
    autoSim: true,
  })
  ctx.clock.flush()
  await tick()
  await tick()

  assert.equal(ctx.request.posts().length, 0, '★ 已经开着仿真就不许再 POST —— 重建会把位姿推回起始位')
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1'], '但数据源仍要指向那台虚拟机器人')
  assert.equal(simModelEl(ctx).value, 'ur20', '选择项要显示宿主正在用的型号，而不是 UR12e')
  ctx.panel.dispose()
})

test('★ 收起面板即停仿真，并把数据源切回"按宿主解析"', async () => {
  const ctx = boot({ initial: { connected: false, ts: 0 }, autoSim: true })
  ctx.clock.flush()
  await tick()
  await tick()
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1'])

  ctx.panel.dispose()
  await tick()

  const last = ctx.request.posts().at(-1)
  assert.equal(last.method, 'POST')
  assert.deepEqual(JSON.parse(last.body), { enabled: false }, '★ 收起面板必须关掉仿真')
  assert.equal(
    last.keepalive,
    true,
    '★ 卸载路径的写请求必须带 keepalive：普通 fetch 会在页面卸载时被 abort，仿真于是在宿主里继续跑',
  )
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1', ''], '数据源必须切回自动解析')
})

test('未连接时仿真开关行仍然可见，且自动进入失败的原因写在界面上', async () => {
  const request = makeFakeRequest({ postResult: { ok: false, error: '离线仿真不可用：无法导入 ur_sim' } })
  const ctx = boot({ initial: { connected: false, ts: 0 }, request, autoSim: true })
  ctx.clock.flush()
  await tick()
  await tick()

  assert.notEqual(simBarEl(ctx).style.display, 'none', '★ 未连接时也必须能看到这一行（那是唯一的出口）')
  assert.match(simErrorEl(ctx).textContent, /无法导入 ur_sim/, '失败原因要说出来')
  assert.deepEqual(ctx.state.ipCalls, [], '失败时绝不能把数据源切走')
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'false', '失败后开关要回到"关"')

  ctx.panel.dispose()
})

test('autoSim:false（注入点）：退回"只读一次宿主状态、不发 POST"的老行为', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  assert.deepEqual(
    ctx.request.calls.map((c) => c.method),
    ['GET'],
    '关掉自动进仿真后，挂载只读一次仿真状态，绝不发 POST',
  )
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'false')
  assert.deepEqual(ctx.state.ipCalls, [], '没开仿真就不该动数据源')

  ctx.panel.dispose()
})

test('★ 打开开关：POST 一次（型号 + 起始姿态 + 倍率），成功后把数据源切到仿真地址', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  // 选一个型号（用户操作下拉），再点开关
  simModelEl(ctx).value = 'ur10e'
  simModelEl(ctx).listeners.change[0]()
  simToggleEl(ctx).listeners.click[0]()
  await tick()

  const posts = ctx.request.posts()
  assert.equal(posts.length, 1, '★ 打开开关必须恰好发一次 POST')
  assert.equal(posts[0].url, '/nonead-ursim/twin/sim')
  assert.match(String(posts[0].headers['content-type']), /application\/json/)
  const body = JSON.parse(posts[0].body)
  assert.equal(body.enabled, true)
  assert.equal(body.model, 'ur10e', '必须把用户选的型号交给宿主（决定网格与运动学）')
  assert.equal(body.preset, 'upright', '★ 换型号 = 换一台机器人：起始姿态必须是竖直收拢')
  assert.equal(body.speed_scaling, 1, '必须给出速度倍率')
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1'], '数据源必须切到保留的仿真地址')

  // 数据真到之前，开关已经显示为"关"（下一次点击是关闭），且按钮显示为按下态
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'true')

  ctx.panel.dispose()
})

test('★ 打开失败：不回切数据源、开关回滚、把失败原因写在界面上', async () => {
  const request = makeFakeRequest({ postResult: { ok: false, error: '未知型号 ur99' } })
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 }, request })
  ctx.clock.flush()
  await tick()

  simToggleEl(ctx).listeners.click[0]()
  await tick()

  assert.equal(ctx.request.posts().length, 1)
  assert.deepEqual(ctx.state.ipCalls, [], '失败时绝不能把数据源切走')
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'false', '开关必须回滚')
  assert.match(simErrorEl(ctx).textContent, /未知型号 ur99/, '失败原因要说出来')

  // 网络层直接抛错也要走同一条回滚路径
  const broken = makeFakeRequest({ rejectWith: new Error('worker 挂了') })
  const ctx2 = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 }, request: broken })
  ctx2.clock.flush()
  await tick()
  simToggleEl(ctx2).listeners.click[0]()
  await tick()
  assert.equal(simToggleEl(ctx2).getAttribute('aria-pressed'), 'false')
  assert.match(simErrorEl(ctx2).textContent, /worker 挂了/)
  assert.deepEqual(ctx2.state.ipCalls, [])

  ctx.panel.dispose()
  ctx2.panel.dispose()
})

test('★ 水印以**数据**为准：AI 用工具开的仿真（本地没点过开关）同样显示角标与状态行', async () => {
  const ctx = boot({
    initial: { connected: true, model: 'UR20', q: Q0, tcp: TCP0, ts: 1000, simulated: true },
  })
  ctx.clock.flush()
  await tick()

  assert.equal(panelRoot(ctx).getAttribute('data-ursim-twin-sim'), 'true', 'root 上要有仿真标记（供样式/测试）')
  assert.notEqual(simBadgeEl(ctx).style.display, 'none', '★ 仿真角标必须显示')
  assert.equal(simBadgeEl(ctx).getAttribute('data-ursim-twin-mode'), 'sim', '仿真态写进 data 属性（供样式）')
  assert.match(simBadgeEl(ctx).textContent, /仿真/)
  assert.match(statusEl(ctx).textContent, /离线仿真 · UR20/, '状态行必须写明这是仿真')
  assert.equal(simToggleEl(ctx).getAttribute('aria-pressed'), 'true', '开关要跟着数据走')
  // 这一帧是真机（simulated 变 false）⇒ 仿真标记与水印文案必须撤掉，不能留着误导读的人。
  // 但**角标不隐藏**（0.1.8 起它是三态模式指示）：此时显示「未连接」——"没有角标"读起来就是
  // "安全"，而"仿真没开"并不等于"什么都不会被驱动"（真机模式下就可能是真机）。
  ctx.state.set({ simulated: false, ts: 1100 })
  ctx.clock.flush()
  assert.equal(panelRoot(ctx).getAttribute('data-ursim-twin-sim'), 'false')
  const idle = simBadgeEl(ctx)
  assert.notEqual(idle.style.display, 'none', '★ 角标不再隐藏：没有角标 ≠ 安全')
  assert.equal(idle.getAttribute('data-ursim-twin-mode'), 'idle')
  assert.match(idle.textContent, /未连接/)
  assert.match(statusEl(ctx).textContent, /已连接 · ur20/)

  ctx.panel.dispose()
})

test('★ P0：模式角标三态 —— 真机模式红色常显（含白名单），白名单为空必须明说', async () => {
  // ① 真机模式 + 白名单：**未连接**时也必须常显（这正是"没有角标 ≠ 安全"要修的）
  const request = makeFakeRequest({
    active: false,
    motionMode: 'real',
    realRobots: ['192.168.1.10', '192.168.1.11'],
  })
  const ctx = boot({ initial: { connected: false, ts: 0 }, request, autoSim: false })
  ctx.clock.flush()
  await tick()
  await tick()
  const badge = simBadgeEl(ctx)
  assert.ok(badge, '必须有模式角标')
  assert.equal(badge.getAttribute('data-ursim-twin-mode'), 'real')
  assert.notEqual(badge.style.display, 'none', '★ 真机模式下角标必须常显')
  assert.match(badge.textContent, /真机模式/)
  assert.match(badge.textContent, /192\.168\.1\.10/, '★ 必须写出允许的 IP')
  assert.match(badge.textContent, /192\.168\.1\.11/)
  ctx.panel.dispose()

  // ② 真机模式 + 白名单为空：明说"全部拒绝"，不能让人以为"没限制"
  const empty = makeFakeRequest({ motionMode: 'real', realRobots: [] })
  const ctx2 = boot({ initial: { connected: false, ts: 0 }, request: empty, autoSim: false })
  ctx2.clock.flush()
  await tick()
  await tick()
  assert.equal(simBadgeEl(ctx2).getAttribute('data-ursim-twin-mode'), 'real')
  assert.match(simBadgeEl(ctx2).textContent, /白名单为空/)
  ctx2.panel.dispose()
})

test('★ P1：遥测行的「估算」标注与补上的两行读数（关节电流 / TCP 速度）', () => {
  const rows = formatDetail({
    safety_mode: 'NORMAL',
    robot_mode: 'IDLE',
    program_state: 'STOPPED',
    speed_scaling: 1,
    joint_temperatures: [30, 31, 32, 33, 34, 35],
    robot_voltage: 48,
    robot_current: 1.25,
    joint_currents: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6],
    tcp_speed: [0.01, 0.02, 0.02, 0, 0, 0],
    telemetry_estimated: true,
  })
  assert.match(rows.temps, /估算/, '★ 估算值必须标注出来')
  assert.match(rows.power, /估算/)
  assert.match(rows.currents, /电流/, '★ 关节电流行必须补上')
  assert.match(rows.currents, /估算/)
  assert.match(rows.tcpSpeed, /TCP 速度/, '★ TCP 速度行必须补上')
  assert.match(rows.tcpSpeed, /0\.030/, '线速度模长 = hypot(0.01,0.02,0.02) ≈ 0.030')

  // 真机读数（没有 telemetry_estimated）不得被标成估算；拿不到的字段给空串，不编数字
  const plain = formatDetail({ safety_mode: 'NORMAL', joint_temperatures: [30, 31, 32, 33, 34, 35] })
  assert.doesNotMatch(plain.temps, /估算/, '真机读数不是估算')
  assert.equal(plain.currents, '', '没有 joint_currents 就给空串')
  assert.equal(plain.tcpSpeed, '', '没有 tcp_speed 就给空串')
})

test('★ P2：仿真能力清单进界面 —— 折叠块正文给"每项几项"，完整清单在 title', async () => {
  const capabilities = {
    read: ['ursim_get_joint_pose', 'ursim_get_tcp_pose'],
    motion: ['ursim_movej', 'ursim_movel', 'ursim_draw_circle'],
    io: ['ursim_set_digital_out'],
    telemetry: ['ursim_get_runtime_telemetry'],
    not_simulated: ['力控', '传送带'],
  }
  const request = makeFakeRequest({ capabilities })
  const ctx = boot({
    initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 },
    request,
    autoSim: false,
  })
  ctx.clock.flush()
  await tick()
  await tick()
  const box = byAttr(ctx.container, 'data-ursim-twin-sim-caps')[0]
  const body = byAttr(ctx.container, 'data-ursim-twin-sim-caps-body')[0]
  assert.ok(box && body, '必须有能力清单折叠块')
  assert.notEqual(box.style.display, 'none', '有数据时必须显示')
  assert.match(body.textContent, /运动 3 项/)
  assert.match(body.textContent, /不支持 2 类/)
  assert.match(String(body.getAttribute('title')), /ursim_movej/, '完整清单进 title（正文只给数量）')
  ctx.panel.dispose()
})

test('仿真运行中改型号：立刻按新型号重建（再 POST 一次，带新型号）', async () => {
  const ctx = boot({
    initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000, simulated: true },
  })
  ctx.clock.flush()
  await tick()
  assert.equal(simModelEl(ctx).value, 'ur5e', '选择项要跟着数据里的型号')

  simModelEl(ctx).value = 'ur10e'
  simModelEl(ctx).listeners.change[0]()
  await tick()
  const posts = ctx.request.posts()
  assert.equal(posts.length, 1, '改型号要重新开一次仿真')
  assert.equal(JSON.parse(posts[0].body).model, 'ur10e')

  // 关闭：POST enabled:false，并把数据源切回自动解析
  simToggleEl(ctx).listeners.click[0]()
  await tick()
  const last = ctx.request.posts().at(-1)
  assert.equal(JSON.parse(last.body).enabled, false)
  assert.deepEqual(ctx.state.ipCalls, ['127.0.0.1', ''], '关闭后必须切回自动解析')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 幽灵臂（目标姿态叠加层）
 *
 * 它是真臂的**同型号克隆** + 半透明材质，稳态下与真臂完全重合 —— 那种时候显示它没有任何
 * 信息量，却让用户以为"画面里多了一台机器人，而且关节组合不对"（实机报障）。所以规则是：
 * 只有目标与当前**明显不同**才显示，并且必须能被「目标姿态」图层开关彻底关掉。
 * ------------------------------------------------------------------ */

const ghostArmOf = (ctx) => {
  const scene = ctx.sceneFactory.created[0]?.scene
  return scene?.added?.find((o) => o?.name === 'ursim-twin-ghost-arm') ?? null
}
const ghostLayerButton = (ctx) => byAttr(ctx.container, 'data-ursim-twin-layer-ghost')[0]

test('★ 目标与当前重合时不显示幽灵臂；拉开差距才显示；可被图层开关关掉', async () => {
  const qCurrent = [0, -1.5708, 1.5708, -1.5708, -1.5708, 0]
  const qTarget = [0.6, -1.2, 1.3, -1.5, -1.2, 0.7]
  const ctx = boot({
    modelLoader: makeGhostableModelLoader(),
    initial: {
      connected: true, model: 'UR5E', q: qCurrent, tcp: TCP0, ts: 1000,
      detail: { target_q: qCurrent },
    },
  })
  ctx.clock.flush()
  await tick()

  const ghost = ghostArmOf(ctx)
  assert.ok(ghost, '幽灵臂应被创建并加入场景（真实 three 对象树 + 克隆）')
  assert.equal(
    ghost.visible, false,
    '★ 目标与当前重合时不得显示：两臂完全重叠，只会被误读成"多了一台机器人"',
  )

  // 目标明显偏离当前（运动/交融中）：这时它才在表达"目标 vs 实际"，应当显示
  ctx.state.set({ detail: { target_q: qTarget }, ts: 1100 })
  ctx.clock.flush()
  assert.equal(ghost.visible, true, '目标与当前明显不同时必须显示（这是它存在的理由）')

  const button = ghostLayerButton(ctx)
  assert.ok(button, '必须有「目标姿态」图层开关（幽灵臂太像真臂，用户要能关掉它）')
  button.listeners.click[0]()
  assert.equal(ghost.visible, false, '★ 关掉该图层后，即使目标有差异也不得显示')
  button.listeners.click[0]()
  assert.equal(ghost.visible, true, '再点一次应当恢复显示')

  // 目标回到与当前一致：立刻隐藏（不等下一帧的差值判断残留）
  ctx.state.set({ detail: { target_q: qCurrent }, ts: 1200 })
  ctx.clock.flush()
  assert.equal(ghost.visible, false)

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用户裁定（2026-10-12）：换型号 = 清空 3D 空间里原有的机器人
 *                        + 新载入的机器人从「竖直收拢」开始
 * ------------------------------------------------------------------ */

test('★ 换型号：起始姿态重置为「竖直收拢」，且姿态下拉同步过去', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  // 用户先把姿态改成「远端」（此时还没进仿真，只改本地配置）
  simPresetEl(ctx).value = 'reach'
  simPresetEl(ctx).listeners.change[0]()
  assert.equal(simPresetEl(ctx).value, 'reach')

  // 再换型号 —— 换的是一台**机器人**，姿态必须回到默认的竖直收拢
  simModelEl(ctx).value = 'ur10e'
  simModelEl(ctx).listeners.change[0]()
  assert.equal(
    simPresetEl(ctx).value,
    'upright',
    '★ 换型号后姿态下拉必须同步成竖直收拢，否则界面显示的姿态与仿真实际重建的姿态不一致',
  )

  // 进仿真：发出去的必须是「新机型 + 竖直收拢」
  simToggleEl(ctx).listeners.click[0]()
  await tick()
  const posts = ctx.request.posts()
  assert.equal(posts.length, 1, '必须恰好发一次 POST')
  const body = JSON.parse(posts[0].body)
  assert.equal(body.model, 'ur10e', '必须是用户新选的型号')
  assert.equal(body.preset, 'upright', '★ 换型号后的起始姿态必须是竖直收拢（不沿用上一台的姿态）')

  ctx.panel.dispose()
})

test('★ 换型号：场景里只剩一台本插件机器人（兜底清扫只摘自己的根节点）', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const scene = sceneOf(ctx)
  assert.ok(scene, '连接后必须有场景')
  const robotRoots = () => scene.children.filter((o) => o?.name === 'ursim-twin-robot')
  assert.equal(robotRoots().length, 1, '第一台机器人应当以一个具名根节点挂在场景里')

  // 制造两种"残骸"：一个同名的旧机器人根节点，一个别人的节点
  const stray = { name: 'ursim-twin-robot', children: [] }
  const alien = { name: 'ursim-someone-elses-node', children: [] }
  scene.add(stray)
  scene.add(alien)

  // 换型号 → 重新加载
  ctx.state.set({ model: 'UR5E', ts: 1100 })
  ctx.clock.flush()
  await tick()
  await tick()

  assert.equal(robotRoots().length, 1, '★ 场景里只能有**一台**本插件机器人（旧的那台必须已被清空）')
  assert.ok(!scene.children.includes(stray), '同名残骸必须被摘掉')
  assert.ok(scene.children.includes(alien), '兜底清扫只认自己的名字，不能碰别人的节点')

  ctx.panel.dispose()
})

/* ------------------------------------------------------------------ *
 * 用户裁定（2026-10-12）：不同型号的可达范围必须**看得出来不一样**
 * ------------------------------------------------------------------ */

test('★ 参考半径来自型号数据：最大那台（UR20≈2.17 m）的可达上界', () => {
  // 这条是"换任何型号可达范围都一样大"的回归守卫。早先 `linkLengthsFromKinematics` 只认
  // "7 个行主序 4×4 矩阵"，而 `assets/kinematics.json` 里其实是 **6 个 `{x,y,z,roll,pitch,yaw}`**
  // 相对变换 —— 它一直返回 null，于是 `reachSphere.scale.setScalar(reach)` 那行从没执行过，
  // 可达球永远停在**单位半径 1 m**，14 个型号画出来当然一模一样。
  assert.ok(
    REACH_VIEW_RADIUS > 2 && REACH_VIEW_RADIUS < 2.3,
    `参考半径应≈2.17 m，实测 ${REACH_VIEW_RADIUS}`,
  )
  const ur3 = reachRadiusFromKinematics(resolveKinematics('ur3')?.links)
  const ur20 = reachRadiusFromKinematics(resolveKinematics('ur20')?.links)
  assert.ok(Math.abs(ur3 - 0.804) < 0.01, `UR3 可达上界应≈0.804 m，实测 ${ur3}`)
  assert.ok(Math.abs(ur20 - REACH_VIEW_RADIUS) < 1e-9, '最大的型号就是参考半径本身')
  assert.ok(ur20 / ur3 > 2.5, '最大/最小型号的可达上界必须差 2.5 倍以上（否则"一样大"是真的）')
})

test('★ 打开「可达范围」图层 = 同一把尺子：按固定参考半径取景，关闭后回到型号自适应', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const scene = ctx.sceneFactory.created[0]
  const button = byAttr(ctx.container, 'data-ursim-twin-layer-reach')[0]
  assert.ok(button, '必须有「可达范围」图层开关')

  const before = scene.fitOptions.length
  button.listeners.click[0]()
  await tick()
  const opened = scene.fitOptions.slice(before)
  assert.equal(opened.length, 1, '切换该图层必须重新取景一次（否则看到的仍是被自适应放大过的球）')
  assert.equal(opened[0]?.minRadius, REACH_VIEW_RADIUS, '打开时必须传固定参考半径')

  button.listeners.click[0]()
  await tick()
  assert.equal(
    scene.fitOptions[scene.fitOptions.length - 1]?.minRadius,
    undefined,
    '关闭后必须回到按型号自适应取景',
  )

  ctx.panel.dispose()
})

test('★ 可达范围开关上写着该型号的上界：UR3 ≈0.80 m、UR20 ≈2.17 m', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR3', q: Q0, tcp: TCP0, ts: 1000 } })
  ctx.clock.flush()
  await tick()

  const button = () => byAttr(ctx.container, 'data-ursim-twin-layer-reach')[0]
  assert.match(String(button().textContent), /0\.80 m/, '开关上必须显示该型号的可达上界')

  ctx.state.set({ model: 'UR20', ts: 1100 })
  ctx.clock.flush()
  await tick()
  await tick()
  assert.match(String(button().textContent), /2\.17 m/, '换型号后这个数字必须跟着变')

  ctx.panel.dispose()
})

test('★ 0.1.9：I/O 折叠块按需读 —— 折叠着不发请求，展开才读且寄存器只读一次', async () => {
  const io = {
    digital_out: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
    digital_in: new Array(16).fill(false),
    analog_in: [0, 0],
    simulated: true,
    note: '仿真没有输入信号源',
  }
  const registers = { set: 'int', from: 0, values: [0, 1, 2, 3, 4, 5, 6, 7] }
  const request = makeFakeRequest({ io, registers })
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 }, request, autoSim: false })
  ctx.clock.flush()
  await tick()
  await tick()

  const box = byAttr(ctx.container, 'data-ursim-twin-io')[0]
  const body = byAttr(ctx.container, 'data-ursim-twin-io-body')[0]
  assert.ok(box && body, '必须有 I/O 与寄存器折叠块（0.1.9）')
  assert.equal(
    ctx.request.calls.filter((c) => String(c.url).includes('io=1')).length,
    0,
    '★ 折叠着不得发 I/O 请求（面板默认只读镜像真机，别让展开一次变成常态流量）',
  )

  box.open = true
  box.listeners.toggle[0]()
  await tick()
  await tick()
  await tick()
  const ioCalls = ctx.request.calls.filter((c) => String(c.url).includes('io=1'))
  assert.equal(ioCalls.length, 1, '展开后读一次 I/O')
  assert.match(body.textContent, /10000000 00000001/, '位串必须按 8 位一组渲染（std / config 两段）')
  assert.match(body.textContent, /仿真没有输入信号源/, '仿真下必须说明输入恒 0 的原因')
  const regCalls = ctx.request.calls.filter((c) => String(c.url).includes('reg='))
  assert.equal(regCalls.length, 3, '★ 寄存器只在展开那一刻读一次（int / double / bit 各一片）')
  assert.match(String(regCalls[0].url), /reg=int&from=0&count=8/)
  ctx.panel.dispose()
})

test('★ C1：HUD 里必须有奇异点/可操作度提示行，且按等级写 data 属性', async () => {
  const ctx = boot({ initial: { connected: true, model: 'UR5E', q: Q0, tcp: TCP0, ts: 1000 }, autoSim: false })
  ctx.clock.flush()
  await tick()
  const row = byAttr(ctx.container, 'data-ursim-twin-risk-row')[0]
  assert.ok(row, '★ 必须有奇异点提示行（0.1.11 起）')
  assert.match(row.textContent, /可操作度/, '提示行必须给出可操作度数值')
  assert.match(row.textContent, /腕/, '提示行必须给出腕角')
  assert.equal(['ok', 'near', 'at'].includes(row.getAttribute('data-ursim-twin-risk')), true,
    '风险等级必须落到 data 属性上（样式据此染色）')
  assert.ok(String(row.getAttribute('title')).length > 0, '判据要放在 title 里，便于解释"凭什么这么说"')
  ctx.panel.dispose()
})
