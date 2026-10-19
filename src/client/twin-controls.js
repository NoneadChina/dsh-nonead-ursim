/**
 * src/client/twin-controls.js — 面板控制轨的骨架与状态机。
 *
 * ## 分工（为什么单独一个文件）
 * `twin-panel.js` 已经背了画布、HUD、I/O、仿真开关、模型、主题、截图七件事；两条控制轨
 * （左轨点动 + 速度倍率 / 右轨位姿 + 关节）是**另一个职责**。放在这里才能被单独测试，
 * `twin-panel.js` 只负责三件事：
 *   ① 把 `stage`（三栏 grid）插进布局，把画布夹在两条轨中间；
 *   ② 把最新快照喂给 `mountLeftRail` / `mountRightRail` 返回的 `sync(snapshot)`；
 *   ③ 用 `deps.send(body)` 把控件产生的命令交回宿主（body 就是 `/twin/jog` 路由的 body）。
 *
 * 本模块**零 Node 依赖**（浏览器 bundle 直接打包）：只用注入进来的 `doc`，不 import `node:*`，
 * 也不碰 three.js、不发请求。
 *
 * ## 样式分工：静态在 `TWIN_CSS`，动态只有列宽
 * 本仓库的面板样式走 `styles.js` 的 `<style>` 字符串注入（Ruling 28：客户端产物只有单文件，
 * shell 不加载任何 `.css`）。既有测试钉死了两条不变量：**整个文档恰好一份 `<style>`**、
 * 且它 `textContent === TWIN_CSS` ⇒ 控制轨**不**注入第二份样式：`.ursim-twin-stage`、
 * `.ursim-twin-rail*` 的静态规则全部住在 `TWIN_CSS` 里。
 * 真正取决于运行状态的只剩**列宽**：`stage.style.gridTemplateColumns` 由 `stageColumns()`
 * 拼出（唯一拼法，面板只负责写入）。收起态本身落在 `data-collapsed` 属性上，正文显隐、
 * 轨宽、把手尺寸都由 CSS 消费这个属性 —— 这里不再写 `style.*`。
 *
 * ## 容错底线
 * 无 DOM / `storage` 不可用（隐私模式下 `localStorage.getItem` 会抛 SecurityError）时
 * **不得抛错**：读失败当作"没有存储"（默认展开），写失败静默丢弃 —— 收起交互仍然能用，
 * 只是不跨会话保持。
 */

import { activeStrings } from './strings.js'

/**
 * 左轨控件的文案表（标签 / 禁用原因 / 错误行）。
 *
 * 模块级只取一次：面板是长期驻留的，运行期不换语言；与 `twin-panel.js` 用的是同一个
 * `activeStrings()`，所以两边的语言一定一致。
 */
const S = activeStrings()

/** 侧轨宽度（px）—— 与 `stageColumns()` 同一份真源。 */
export const RAIL_W_LEFT = 128
export const RAIL_W_RIGHT = 176
/** 收起后的列宽（px）：只留一个把手。 */
export const RAIL_W_COLLAPSED = 24
/** 中列最小宽度（px）：低于它 3D 就失去可读性。 */
export const RAIL_MIN_STAGE = 280
/** localStorage 键：记住两条轨的收起状态。 */
export const RAIL_STATE_KEY = 'dsh-nonead-ursim.rails'

/**
 * 某一侧在某状态下应有的宽度（px）。
 *
 * @param {'left'|'right'} side 哪条轨
 * @param {boolean} collapsed 是否收起
 * @returns {number}
 */
export function railWidth(side, collapsed) {
  if (collapsed === true) return RAIL_W_COLLAPSED
  return side === 'right' ? RAIL_W_RIGHT : RAIL_W_LEFT
}

/**
 * 拼出三栏 grid 的 `grid-template-columns`（**唯一**拼法，面板与测试都读它）。
 *
 * @param {{left?: boolean, right?: boolean}} state 两条轨是否收起
 * @returns {string}
 */
export function stageColumns(state) {
  const left = railWidth('left', state?.left === true)
  const right = railWidth('right', state?.right === true)
  return `${left}px minmax(${RAIL_MIN_STAGE}px, 1fr) ${right}px`
}

/**
 * 读两条轨的收起状态（**容错解析，永不抛错**）。
 *
 * 任何一步失败（没有 storage、隐私模式抛错、值不是合法 JSON、字段类型不对）都退回
 * "两条都展开"—— 这是唯一不会让控件消失的安全默认值。
 *
 * @param {{getItem?: Function}|null|undefined} storage `localStorage`（或假实现）
 * @returns {{left: boolean, right: boolean}}
 */
export function readRailState(storage) {
  const fallback = { left: false, right: false }
  let raw = null
  try {
    raw = storage?.getItem?.(RAIL_STATE_KEY) ?? null
  } catch {
    return fallback
  }
  if (typeof raw !== 'string' || raw === '') return fallback
  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fallback
  }
  if (!parsed || typeof parsed !== 'object') return fallback
  // 只认布尔 `true`：字符串 "true" / 1 之类都不算，避免手改过的存储把两侧全收起来。
  return { left: parsed.left === true, right: parsed.right === true }
}

/**
 * 写两条轨的收起状态（**写失败静默**）。
 *
 * @param {{setItem?: Function}|null|undefined} storage
 * @param {{left?: boolean, right?: boolean}} state
 * @returns {{left: boolean, right: boolean}|null} 真正写下去的状态；写失败返回 null
 */
export function writeRailState(storage, state) {
  const next = { left: state?.left === true, right: state?.right === true }
  try {
    storage?.setItem?.(RAIL_STATE_KEY, JSON.stringify(next))
    return next
  } catch {
    return null
  }
}

/**
 * 建一侧的轨（把手 + 空 body），并把初始收起状态从 storage 恢复。
 *
 * 结构样式**不在这里写**：`.ursim-twin-rail` / `.ursim-twin-rail-toggle` / `.ursim-twin-rail-body`
 * 三条规则住在 `styles.js` 的 `TWIN_CSS` 里（见文件头）。本函数只建 DOM、挂 `data-*`、管状态。
 *
 * @param {Document} doc 文档（测试注入假 document）
 * @param {'left'|'right'} side 哪一侧
 * @param {{getItem?: Function,setItem?: Function}|null} storage localStorage 或假实现
 * @param {{onChange?: (side: 'left'|'right', collapsed: boolean) => void}} [options]
 *   `onChange` 只在**用户点击**之后触发（初始恢复不触发）：面板据此重算 grid 列宽并重量画布。
 * @returns {{
 *   rail: HTMLElement, toggle: HTMLElement, body: HTMLElement,
 *   setCollapsed: (collapsed: boolean, options?: {persist?: boolean}) => boolean,
 *   isCollapsed: () => boolean,
 * }}
 */
export function buildRail(doc, side, storage, options = {}) {
  const which = side === 'right' ? 'right' : 'left'
  const onChange = typeof options.onChange === 'function' ? options.onChange : null
  const sideLabel = which === 'left' ? '左侧' : '右侧'

  const rail = doc.createElement('div')
  rail.className = 'ursim-twin-rail'
  rail.setAttribute('data-ursim-twin-rail', which)

  const toggle = doc.createElement('button')
  toggle.setAttribute('type', 'button')
  toggle.className = 'ursim-twin-rail-toggle'
  toggle.setAttribute('data-ursim-twin-rail-toggle', which)

  const body = doc.createElement('div')
  body.className = 'ursim-twin-rail-body'
  body.setAttribute('data-ursim-twin-rail-body', which)

  rail.appendChild(toggle)
  rail.appendChild(body)

  let collapsed = false

  /** 把收起状态同步到三处：`data-collapsed`（CSS 据此收正文）、`aria-expanded`、把手文案。 */
  function syncChrome() {
    rail.setAttribute('data-collapsed', collapsed ? 'true' : 'false')
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    // 箭头指向"点下去会发生什么"：左轨展开时朝左（收起），收起后朝右（展开）。
    const arrow = which === 'left'
      ? (collapsed ? '›' : '‹')
      : (collapsed ? '‹' : '›')
    toggle.textContent = arrow
    const hint = `${collapsed ? '展开' : '收起'}${sideLabel}控制轨`
    toggle.setAttribute('title', hint)
    toggle.setAttribute('aria-label', hint)
  }

  /**
   * 设收起状态。
   *
   * @param {boolean} next
   * @param {{persist?: boolean}} [opts] `persist:false` 只改界面不回写存储（内部/测试用）
   * @returns {boolean} 设完之后的状态
   */
  function setCollapsed(next, opts = {}) {
    const want = next === true
    if (want === collapsed) return collapsed
    collapsed = want
    syncChrome()
    if (opts.persist !== false) {
      // 每次都以存储里的现值为底再改自己这一侧：两条轨各自写、互不覆盖。
      const saved = readRailState(storage)
      saved[which] = collapsed
      writeRailState(storage, saved)
    }
    onChange?.(which, collapsed)
    return collapsed
  }

  toggle.addEventListener('click', () => {
    setCollapsed(!collapsed)
  })

  // 初始状态来自存储（读失败 = 展开），恢复过程**不**触发 onChange：面板此时会自己算一次列宽。
  collapsed = readRailState(storage)[which] === true
  syncChrome()

  return {
    rail,
    toggle,
    body,
    setCollapsed,
    isCollapsed: () => collapsed,
  }
}

/** 建一个空 body（占位）：后续任务只在这里填控件，不改骨架。 */
function makeBody(doc, which, deps) {
  const body = doc?.createElement?.('div') ?? null
  if (!body) return null
  body.className = 'ursim-twin-rail-body'
  body.setAttribute('data-ursim-twin-rail-body', which)
  // 供后续任务的控件读取：命令出口与最新快照。
  body.__deps = deps ?? {}
  return body
}

/* ------------------------------------------------------------------ *
 * 左轨控件（点动 + 步长 + 参考系 + 回零 + 速度倍率）
 *
 * 这一层的职责边界：**只把一次点击整形为宿主 `/twin/jog` 的 body**，不自己发请求、
 * 不读运动学、不做乐观更新（下一帧状态才是唯一真源）。命令出口与快照都是注入的：
 *   - `deps.send(body)`  —— 返回 Promise 时按"完成/失败"解禁，返回其它值时视为同步完成；
 *   - `deps.getSnapshot()` —— 本模块不用它（面板每帧调 `sync(snapshot)` 更直接）；
 *   - `deps.setTimeout` / `deps.clearTimeout` —— 长按重复的定时器（单测注入假时钟）。
 * 没有 `send`（或它抛错）时控件保持禁用，**绝不吞掉异常**：错误写到控件区的错误行上。
 * ------------------------------------------------------------------ */

/** 按住多久后开始连续点动（毫秒）。 */
export const JOG_HOLD_DELAY_MS = 250
/** 连续点动的间隔（毫秒）。 */
export const JOG_REPEAT_INTERVAL_MS = 200
/** 位置步长档位（毫米）。 */
export const JOG_STEPS_MM = Object.freeze([1, 5, 10])
/** 姿态步长档位（度）。 */
export const JOG_STEPS_DEG = Object.freeze([1, 2, 5])
/** 默认步长：位置 5 mm、姿态 1°（保守起步，误触的位移最小）。 */
export const JOG_DEFAULT_STEP_MM = 5
export const JOG_DEFAULT_STEP_DEG = 1
/** 速度倍率滑块的上下限（百分比）—— 面板这一层的产品约束（设计 §4 / §10）。 */
export const SPEED_MIN_PERCENT = 10
export const SPEED_MAX_PERCENT = 100
export const SPEED_DEFAULT_PERCENT = 100

/**
 * 把滑块的百分比夹到 10%–100%（整数）。
 *
 * @param {number|string} value
 * @returns {number}
 */
export function clampSpeedPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return SPEED_DEFAULT_PERCENT
  return Math.min(SPEED_MAX_PERCENT, Math.max(SPEED_MIN_PERCENT, Math.round(n)))
}

/**
 * 位置点动命令 body（**直接**是宿主 `/twin/jog` 的路由 body）。
 *
 * @param {'x'|'y'|'z'} axis 基座轴名（参考系由 `frame` 决定）
 * @param {number} distance 米，带符号
 * @param {'tool'|'base'} frame 参考系
 * @returns {{mode: 'cartesian', axis: string, distance: number, frame: 'tool'|'base'}}
 */
export function cartesianJog(axis, distance, frame) {
  return { mode: 'cartesian', axis, distance, frame: frame === 'base' ? 'base' : 'tool' }
}

/**
 * 姿态点动命令 body：角度在这里换算成弧度（宿主只认 `deltaRad`）。
 *
 * @param {'rx'|'ry'|'rz'} axis
 * @param {number} deltaDeg 度，带符号
 * @param {'tool'|'base'} frame
 * @returns {{mode: 'rotate', axis: string, deltaRad: number, frame: 'tool'|'base'}}
 */
export function rotateJog(axis, deltaDeg, frame) {
  return {
    mode: 'rotate',
    axis,
    deltaRad: (deltaDeg * Math.PI) / 180,
    frame: frame === 'base' ? 'base' : 'tool',
  }
}

/**
 * 速度倍率命令 body：面板层先把百分比夹到 10%–100%，再交给宿主。
 *
 * @param {number|string} percent
 * @returns {{mode: 'speed', fraction: number}}
 */
export function speedCommand(percent) {
  return { mode: 'speed', fraction: clampSpeedPercent(percent) / 100 }
}

/** 每个点动按钮的命令语义（`sign` 决定方向；`mode` 决定这是哪种命令）。 */
const JOG_SPECS = Object.freeze({
  'cartesian-x-plus': { mode: 'cartesian', axis: 'x', sign: 1, label: 'X+' },
  'cartesian-x-minus': { mode: 'cartesian', axis: 'x', sign: -1, label: 'X−' },
  'cartesian-y-plus': { mode: 'cartesian', axis: 'y', sign: 1, label: 'Y+' },
  'cartesian-y-minus': { mode: 'cartesian', axis: 'y', sign: -1, label: 'Y−' },
  'cartesian-z-plus': { mode: 'cartesian', axis: 'z', sign: 1, label: 'Z+' },
  'cartesian-z-minus': { mode: 'cartesian', axis: 'z', sign: -1, label: 'Z−' },
  'rotate-rx-plus': { mode: 'rotate', axis: 'rx', sign: 1, label: 'RX+' },
  'rotate-rx-minus': { mode: 'rotate', axis: 'rx', sign: -1, label: 'RX−' },
  'rotate-ry-plus': { mode: 'rotate', axis: 'ry', sign: 1, label: 'RY+' },
  'rotate-ry-minus': { mode: 'rotate', axis: 'ry', sign: -1, label: 'RY−' },
  'rotate-rz-plus': { mode: 'rotate', axis: 'rz', sign: 1, label: 'RZ+' },
  'rotate-rz-minus': { mode: 'rotate', axis: 'rz', sign: -1, label: 'RZ−' },
  home: { mode: 'home', label: S.controlsHome, title: S.controlsHomeTitle },
})

/** 建元素并顺手写 class / 一个 `data-*`（本模块所有控件共用的最小构造器）。 */
function makeEl(doc, tag, className, attr, value) {
  const el = doc.createElement(tag)
  if (className) el.className = className
  if (attr) el.setAttribute(attr, value === undefined ? '' : String(value))
  return el
}

/** 建按钮（`type=button`，避免落在 `<form>` 里时变成提交按钮）。 */
function makeButton(doc, className, label, attr, value) {
  const button = makeEl(doc, 'button', className, attr, value)
  button.setAttribute('type', 'button')
  button.textContent = label
  return button
}

/**
 * 建分段控件（步长 / 参考系）。
 *
 * 选中态走 `aria-pressed`（不是 class）：读屏软件能读出来，样式也能只靠一个属性选择器。
 *
 * @returns {{wrap: HTMLElement, buttons: Array<{button: HTMLElement, value: string}>, setActive: (value: string) => void}}
 */
function makeSegment(doc, label, attr, options, initial, onPick) {
  const wrap = makeEl(doc, 'div', 'ursim-twin-ctl-seg')
  wrap.setAttribute('role', 'group')
  wrap.setAttribute('aria-label', label)
  const buttons = []
  let active = initial
  const setActive = (next) => {
    active = next
    for (const entry of buttons) {
      entry.button.setAttribute('aria-pressed', entry.value === active ? 'true' : 'false')
    }
  }
  for (const option of options) {
    const button = makeButton(doc, 'ursim-twin-ctl-seg-button', option.text, attr, option.value)
    button.addEventListener('click', () => {
      if (button.disabled === true) return
      setActive(option.value)
      onPick?.(option.value)
    })
    wrap.appendChild(button)
    buttons.push({ button, value: option.value })
  }
  setActive(active)
  return { wrap, buttons, setActive }
}

/**
 * 左轨内容：TCP 位置 / TCP 方向 点动盘、步长、参考系、回零、速度倍率。
 *
 * 交互（设计 §6）：
 *   - 按下立即发一步；按住 `JOG_HOLD_DELAY_MS` 后每 `JOG_REPEAT_INTERVAL_MS` 重复一步；
 *   - 松开（`pointerup` / `pointerleave` / `pointercancel`）即停，定时器在 `dispose()` 清掉；
 *   - **同一时刻只允许一条命令在飞**（串行）：在途时所有点动按钮置灰、后续点击丢弃；
 *   - 速度滑块 `input` 只改本地百分比文字，`change`（松手）才下发一条 `speed`；
 *   - 快照 `connected !== true` / `feedStale === true` / `simulated !== true` ⇒ 全部控件禁用，
 *     并在左轨顶部写出一行原因（文案来自 `strings.js`）。
 *
 * @param {Document} doc
 * @param {HTMLElement} body 侧轨的 body 容器
 * @param {{send?: Function, getSnapshot?: Function, setTimeout?: Function, clearTimeout?: Function}} [deps]
 * @returns {{sync: (snapshot?: object) => void, dispose: () => void, body: HTMLElement|null, deps: object}}
 */
export function mountLeftRail(doc, body, deps = {}) {
  const host = body ?? makeBody(doc, 'left', deps)
  if (!host) {
    return { body: null, deps, sync() {}, dispose() {} }
  }
  host.setAttribute('data-ursim-twin-rail-body', 'left')
  const merged = { ...(host.__deps ?? {}), ...deps }
  host.__deps = merged

  const send = typeof merged.send === 'function' ? merged.send : null
  const setT = typeof merged.setTimeout === 'function' ? merged.setTimeout : globalThis.setTimeout
  const clearT = typeof merged.clearTimeout === 'function' ? merged.clearTimeout : globalThis.clearTimeout

  /* ---------------- 可变状态 ---------------- */
  let disposed = false
  let stepMm = JOG_DEFAULT_STEP_MM
  let stepDeg = JOG_DEFAULT_STEP_DEG
  let frame = 'tool'
  let speedPercent = SPEED_DEFAULT_PERCENT
  /** 整块控件是否可用（连接 + 仿真 + 数据在流动）。 */
  let available = false
  /** 是否有命令在飞（串行：同一时刻只允许一条）。 */
  let busy = false
  let repeatTimer = null
  let lastReason = null
  let lastRenderKey = null

  /** 卸载时要摘掉的 DOM 监听（元素会被移出文档，但显式解绑更干净）。 */
  const bindings = []
  const bind = (target, type, handler) => {
    target.addEventListener(type, handler)
    bindings.push(() => target.removeEventListener?.(type, handler))
  }

  /* ---------------- DOM ---------------- */
  const note = makeEl(doc, 'div', 'ursim-twin-ctl-note', 'data-ursim-ctl-note')
  host.appendChild(note)
  const error = makeEl(doc, 'div', 'ursim-twin-ctl-error', 'data-ursim-ctl-error')
  host.appendChild(error)

  const jogButtons = []
  const segmentButtons = []

  /* ---- TCP 位置 ---- */
  const posSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'position')
  const posLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  posLabel.textContent = S.controlsTcpPosition
  posSection.appendChild(posLabel)

  const posPad = makeEl(doc, 'div', 'ursim-twin-ctl-pad', 'data-ursim-ctl-pad', 'position')
  posSection.appendChild(posPad)
  /*
   * 3×3 方向盘：上 = Y+、左 = X−、右 = X+、下 = Y−、中心 = 回零（设计 §4）。
   * 空格子也占位（`<span aria-hidden>`），否则网格会塌成一行三个按钮。
   */
  for (const key of [
    null,
    'cartesian-y-plus',
    null,
    'cartesian-x-minus',
    'home',
    'cartesian-x-plus',
    null,
    'cartesian-y-minus',
    null,
  ]) {
    if (key === null) {
      const blank = makeEl(doc, 'span', 'ursim-twin-ctl-cell')
      blank.setAttribute('aria-hidden', 'true')
      posPad.appendChild(blank)
      continue
    }
    posPad.appendChild(makeJogButton(key))
  }

  const zRow = makeEl(doc, 'div', 'ursim-twin-ctl-row', 'data-ursim-ctl-row', 'z')
  zRow.appendChild(makeJogButton('cartesian-z-plus'))
  zRow.appendChild(makeJogButton('cartesian-z-minus'))
  posSection.appendChild(zRow)

  const stepMmSeg = makeSegment(
    doc,
    S.controlsStepMm,
    'data-ursim-step-mm',
    JOG_STEPS_MM.map((value) => ({ value: String(value), text: String(value) })),
    String(stepMm),
    (next) => { stepMm = Number(next) },
  )
  stepMmSeg.wrap.setAttribute('data-ursim-ctl-seg', 'step-mm')
  segmentButtons.push(...stepMmSeg.buttons.map((entry) => entry.button))
  posSection.appendChild(stepMmSeg.wrap)

  const stepDegSeg = makeSegment(
    doc,
    S.controlsStepDeg,
    'data-ursim-step-deg',
    JOG_STEPS_DEG.map((value) => ({ value: String(value), text: `${value}°` })),
    String(stepDeg),
    (next) => { stepDeg = Number(next) },
  )
  stepDegSeg.wrap.setAttribute('data-ursim-ctl-seg', 'step-deg')
  segmentButtons.push(...stepDegSeg.buttons.map((entry) => entry.button))
  posSection.appendChild(stepDegSeg.wrap)

  const frameSeg = makeSegment(
    doc,
    S.controlsFrame,
    'data-ursim-frame',
    [
      { value: 'tool', text: S.controlsFrameTool },
      { value: 'base', text: S.controlsFrameBase },
    ],
    frame,
    (next) => { frame = next },
  )
  frameSeg.wrap.setAttribute('data-ursim-ctl-seg', 'frame')
  segmentButtons.push(...frameSeg.buttons.map((entry) => entry.button))
  posSection.appendChild(frameSeg.wrap)

  host.appendChild(posSection)

  /* ---- TCP 方向 ---- */
  const rotSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'orientation')
  const rotLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  rotLabel.textContent = S.controlsTcpOrientation
  rotSection.appendChild(rotLabel)

  const rotPad = makeEl(doc, 'div', 'ursim-twin-ctl-pad', 'data-ursim-ctl-pad', 'orientation')
  rotSection.appendChild(rotPad)
  // 上 = RX+、左 = RY−、右 = RY+、下 = RX−、中心留空。
  for (const key of [
    null,
    'rotate-rx-plus',
    null,
    'rotate-ry-minus',
    null,
    'rotate-ry-plus',
    null,
    'rotate-rx-minus',
    null,
  ]) {
    if (key === null) {
      const blank = makeEl(doc, 'span', 'ursim-twin-ctl-cell')
      blank.setAttribute('aria-hidden', 'true')
      rotPad.appendChild(blank)
      continue
    }
    rotPad.appendChild(makeJogButton(key))
  }

  const rzRow = makeEl(doc, 'div', 'ursim-twin-ctl-row', 'data-ursim-ctl-row', 'rz')
  rzRow.appendChild(makeJogButton('rotate-rz-plus'))
  rzRow.appendChild(makeJogButton('rotate-rz-minus'))
  rotSection.appendChild(rzRow)

  host.appendChild(rotSection)

  /* ---- 速度倍率（运行中）---- */
  const speedSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'speed')
  const speedLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  speedLabel.textContent = S.controlsSpeed
  speedSection.appendChild(speedLabel)

  const speedRow = makeEl(doc, 'div', 'ursim-twin-ctl-speed', 'data-ursim-ctl-row', 'speed')
  const slider = doc.createElement('input')
  slider.setAttribute('type', 'range')
  slider.setAttribute('data-ursim-speed', '')
  slider.className = 'ursim-twin-ctl-range'
  slider.setAttribute('aria-label', S.controlsSpeed)
  slider.setAttribute('title', S.controlsSpeedTitle)
  // 真假 DOM 都写：属性是样式/可访问性的真源，property 是测试与自定义宿主读的那一面
  // （测试里的假 DOM 不会把 `min` attribute 反射成 property）。
  slider.setAttribute('min', String(SPEED_MIN_PERCENT))
  slider.setAttribute('max', String(SPEED_MAX_PERCENT))
  slider.setAttribute('step', '1')
  slider.min = String(SPEED_MIN_PERCENT)
  slider.max = String(SPEED_MAX_PERCENT)
  slider.step = '1'
  slider.value = String(speedPercent)
  const percentEl = makeEl(doc, 'span', 'ursim-twin-ctl-percent', 'data-ursim-speed-value')
  percentEl.textContent = S.controlsSpeedValue(speedPercent)
  speedRow.appendChild(slider)
  speedRow.appendChild(percentEl)
  speedSection.appendChild(speedRow)
  host.appendChild(speedSection)

  bind(slider, 'input', () => {
    // 拖动只改本地文字：**不下发**（设计 §6.7：松手才生效）。
    speedPercent = clampSpeedPercent(slider.value)
    percentEl.textContent = S.controlsSpeedValue(speedPercent)
  })
  bind(slider, 'change', () => {
    speedPercent = clampSpeedPercent(slider.value)
    slider.value = String(speedPercent)
    percentEl.textContent = S.controlsSpeedValue(speedPercent)
    if (!available || busy) return
    error.textContent = ''
    runCommand(speedCommand(speedPercent))
  })

  /* ---------------- 行为 ---------------- */

  /**
   * 建一个点动按钮并绑定按下/松开。
   *
   * 只认 pointer 事件：`click` 会在"按住拖出按钮再松手"时也触发，于是一次拖拽可能
   * 多走一步；pointerdown 的语义与"按住"完全一致。
   */
  function makeJogButton(key) {
    const spec = JOG_SPECS[key]
    const button = makeButton(doc, 'ursim-twin-ctl-button', spec?.label ?? key, 'data-ursim-jog', key)
    if (spec?.title) button.setAttribute('title', spec.title)
    button.disabled = true
    bind(button, 'pointerdown', (event) => {
      // 阻止按住时选中文本/触发拖拽手势；假 DOM 的事件参数可能不存在。
      event?.preventDefault?.()
      onPress(key)
    })
    bind(button, 'pointerup', stopRepeat)
    bind(button, 'pointerleave', stopRepeat)
    bind(button, 'pointercancel', stopRepeat)
    jogButtons.push({ button })
    return button
  }

  /** 由按钮 key + 当前步长/参考系拼出命令 body（每次现算，绝不复用旧值）。 */
  function bodyFor(key) {
    const spec = JOG_SPECS[key]
    if (!spec) return null
    if (spec.mode === 'home') return { mode: 'home' }
    if (spec.mode === 'cartesian') {
      return cartesianJog(spec.axis, (stepMm * spec.sign) / 1000, frame)
    }
    return rotateJog(spec.axis, stepDeg * spec.sign, frame)
  }

  /** 按下：立即走一步，然后开始长按重复（回零只走一步）。 */
  function onPress(key) {
    if (disposed || !available || busy || send === null) return
    error.textContent = ''
    if (!runCommand(bodyFor(key))) return
    if (JOG_SPECS[key]?.mode !== 'home') startRepeat(key)
  }

  /**
   * 发一条命令（串行）。
   *
   * `send` 返回 Promise 时在它落定后解禁；返回其它值（如单测里的记录器）视为同步完成 ——
   * 否则长按重复在假时钟下会被上一条"永远在飞"卡死。
   *
   * @returns {boolean} 是否真的发出去（在途/没有出口时为 false）
   */
  function runCommand(payload) {
    if (!payload || send === null || busy) return false
    busy = true
    renderAvailability()
    let result
    try {
      result = send(payload)
    } catch (e) {
      finish(e)
      return false
    }
    if (result !== null && typeof result?.then === 'function') {
      result.then(() => finish(null), (e) => finish(e))
    } else {
      finish(null)
    }
    return true
  }

  /** 一条命令落定：解禁；失败时把原因写到错误行（**不**抛到事件回调外）。 */
  function finish(err) {
    busy = false
    if (disposed) return
    if (err) {
      error.textContent = S.controlsCommandFailed(err instanceof Error ? err.message : String(err))
    }
    renderAvailability()
  }

  /** 按住 250 ms 后，每 200 ms 重复一步；在途时这一步跳过，但节拍继续。 */
  function startRepeat(key) {
    stopRepeat()
    const repeat = () => {
      if (disposed) return
      if (available && !busy) {
        error.textContent = ''
        runCommand(bodyFor(key))
      }
      repeatTimer = setT(repeat, JOG_REPEAT_INTERVAL_MS)
    }
    repeatTimer = setT(repeat, JOG_HOLD_DELAY_MS)
  }

  /** 松开/卸载：清掉重复定时器（幂等）。 */
  function stopRepeat() {
    if (repeatTimer === null) return
    if (typeof clearT === 'function') clearT(repeatTimer)
    repeatTimer = null
  }

  /** 只有"可用性/在途"变化时才写 DOM —— 每帧（60 Hz）重写 disabled 是浪费。 */
  function renderAvailability() {
    const key = `${available ? '1' : '0'}${busy ? '1' : '0'}`
    if (key === lastRenderKey) return
    lastRenderKey = key
    const controlsDisabled = !available || busy
    for (const entry of jogButtons) entry.button.disabled = controlsDisabled
    slider.disabled = controlsDisabled
    for (const button of segmentButtons) button.disabled = !available
    host.setAttribute('data-ursim-ctl-state', !available ? 'disabled' : (busy ? 'busy' : 'ready'))
  }

  /** 本帧为什么不可用（空串 = 可用）。 */
  function unavailableReason(snapshot) {
    if (send === null) return S.controlsDisabledDisconnected
    if (snapshot?.connected !== true) return S.controlsDisabledDisconnected
    if (snapshot?.feedStale === true) return S.controlsDisabledStale
    if (snapshot?.simulated !== true) return S.controlsDisabledSimOnly
    return ''
  }

  /**
   * 每帧喂最新快照：只更新"可用性 + 原因行"，从不回写用户正在操作的步长/滑块
   * （那会把手指还按着的控件抢回去）。
   */
  function sync(snapshot) {
    if (disposed) return
    const reason = unavailableReason(snapshot)
    const nextAvailable = reason === ''
    if (nextAvailable !== available) {
      available = nextAvailable
      if (!available) stopRepeat()
      renderAvailability()
    }
    if (reason !== lastReason) {
      lastReason = reason
      note.textContent = reason
    }
  }

  /** 卸载：清定时器 + 摘监听（幂等）。 */
  function dispose() {
    if (disposed) return
    disposed = true
    stopRepeat()
    for (const off of bindings) {
      try {
        off()
      } catch {
        /* 元素可能已被宿主移除：解绑失败不影响卸载 */
      }
    }
    bindings.length = 0
  }

  // 初始一律禁用：第一帧快照到达前不可能知道连没连上/是不是仿真。
  renderAvailability()

  return { body: host, deps: merged, sync, dispose }
}

/**
 * 右轨内容（位姿数值 + 六关节滑块）—— **本任务只放空 body**。
 *
 * 后续任务在这里填：X/Y/Z(mm) + RX/RY/RZ(rad) 输入框、6 行关节（名称 + ◀ + 滑块 + ▶ + 数值）。
 * 约定同左轨：命令走 `deps.send(body)`，状态走 `sync(snapshot)`。
 *
 * @param {Document} doc
 * @param {HTMLElement} body 侧轨的 body 容器
 * @param {{send?: Function, getSnapshot?: Function}} [deps]
 * @returns {{sync: (snapshot?: object) => void, body: HTMLElement|null, deps: object}}
 */
export function mountRightRail(doc, body, deps = {}) {
  const host = body ?? makeBody(doc, 'right', deps)
  if (host) {
    host.setAttribute('data-ursim-twin-rail-body', 'right')
    host.__deps = { ...(host.__deps ?? {}), ...deps }
  }
  return {
    body: host,
    deps,
    /** 骨架阶段是空操作；后续任务在此做"按最新快照回显/禁用"。 */
    sync() {},
  }
}
