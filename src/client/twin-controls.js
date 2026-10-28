/**
 * src/client/twin-controls.js — 面板控制轨的骨架与状态机。
 *
 * ## 分工（为什么单独一个文件）
 * `twin-panel.js` 已经背了画布、HUD、I/O、仿真开关、模型、主题、截图七件事；控制轨
 * （2026-10-20 起合并为**单条右轨**：只读读数 + 位姿输入 + 坐标系 + 点动盘/步长 + 六关节）
 * 是**另一个职责**。放在这里才能被单独测试，`twin-panel.js` 只负责三件事：
 *   ① 把 `stage`（两栏 grid：3D + 控制轨）插进布局；
 *   ② 把最新快照喂给 `mountRightRail` 返回的 `sync(snapshot)`；
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

import { liveStrings } from './strings.js'

/** 当前语言的文案表（模块级：`JOG_SPECS` 的标签在建表时就要用到；`liveStrings()` 每次取值按当前 `<html lang>` 解析）。 */
const S = liveStrings()

/**
 * 控制轨宽度（px）—— 与 `stageColumns()` 同一份真源。
 *
 * 2026-10-20 起面板只有**一条**控制轨（原来左/右两条，用户要求合并到右侧），宽度 500 是按
 * 附件布局反推出来的，不是随手定的：
 *   - 位姿行 = 3 列输入（每列 26 px 标签 + 输入框） + 10 px 间隙 + 150 px「坐标系」竖排分段；
 *   - 点动行 = 两个 3×3 方向盘（各约 265 px）+ 10 px 间隙 + 136 px 步长列（两档竖排）；
 *   - 关节行 = 40 名称 + ◀ + 滑块 + ▶ + 70 数值。
 * 改这个常量时，`styles.js` 里对应的格宽/内边距**必须一起重算**（否则会溢出或留白）。
 */
export const RAIL_W = 500
/** 收起后的列宽（px）：只留一个把手。 */
export const RAIL_W_COLLAPSED = 24
/** 舞台（3D）列最小宽度（px）：低于它 3D 就失去可读性。 */
export const RAIL_MIN_STAGE = 280
/**
 * localStorage 键：记住控制轨的收起状态。
 *
 * 键名沿用两轨时代的名字（`{left,right}`）；现在只认 `right`，旧数据里的 `left` 被忽略 ——
 * 这样升级后不会因为键名变化把用户的"收起"偏好重置成展开。
 */
export const RAIL_STATE_KEY = 'dsh-nonead-ursim.rails'

/**
 * 控制轨在某状态下应有的宽度（px）。
 *
 * @param {boolean} collapsed 是否收起
 * @returns {number}
 */
export function railWidth(collapsed) {
  return collapsed === true ? RAIL_W_COLLAPSED : RAIL_W
}

/**
 * 拼出两栏 grid 的 `grid-template-columns`（**唯一**拼法，面板与测试都读它）。
 *
 * 顺序是"舞台 + 控制轨"：3D 视图在左、控制轨在右（与旧的三栏时代一致，只是少了左轨）。
 *
 * @param {{right?: boolean}} state 控制轨是否收起
 * @returns {string}
 */
export function stageColumns(state) {
  return `minmax(${RAIL_MIN_STAGE}px, 1fr) ${railWidth(state?.right === true)}px`
}

/**
 * 读控制轨的收起状态（**容错解析，永不抛错**）。
 *
 * 任何一步失败（没有 storage、隐私模式抛错、值不是合法 JSON、字段类型不对）都退回
 * "展开"—— 这是唯一不会让控件消失的安全默认值。
 *
 * @param {{getItem?: Function}|null|undefined} storage `localStorage`（或假实现）
 * @returns {{right: boolean}}
 */
export function readRailState(storage) {
  const fallback = { right: false }
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
  // 只认布尔 `true`：字符串 "true" / 1 之类都不算，避免手改过的存储把控制轨收起来。
  return { right: parsed.right === true }
}

/**
 * 写控制轨的收起状态（**写失败静默**）。
 *
 * @param {{setItem?: Function}|null|undefined} storage
 * @param {{right?: boolean}} state
 * @returns {{right: boolean}|null} 真正写下去的状态；写失败返回 null
 */
export function writeRailState(storage, state) {
  const next = { right: state?.right === true }
  try {
    storage?.setItem?.(RAIL_STATE_KEY, JSON.stringify(next))
    return next
  } catch {
    return null
  }
}

/**
 * 建控制轨（把手 + 空 body），并把初始收起状态从 storage 恢复。
 *
 * 结构样式**不在这里写**：`.ursim-twin-rail` / `.ursim-twin-rail-toggle` / `.ursim-twin-rail-body`
 * 三条规则住在 `styles.js` 的 `TWIN_CSS` 里（见文件头）。本函数只建 DOM、挂 `data-*`、管状态。
 *
 * @param {Document} doc 文档（测试注入假 document）
 * @param {{getItem?: Function,setItem?: Function}|null} storage localStorage 或假实现
 * @param {{onChange?: (collapsed: boolean) => void}} [options]
 *   `onChange` 只在**用户点击**之后触发（初始恢复不触发）：面板据此重算 grid 列宽并重量画布。
 * @returns {{
 *   rail: HTMLElement, toggle: HTMLElement, body: HTMLElement,
 *   setCollapsed: (collapsed: boolean, options?: {persist?: boolean}) => boolean,
 *   isCollapsed: () => boolean,
 * }}
 */
export function buildRail(doc, storage, options = {}) {
  const onChange = typeof options.onChange === 'function' ? options.onChange : null

  const rail = doc.createElement('div')
  rail.className = 'ursim-twin-rail'
  rail.setAttribute('data-ursim-twin-rail', 'right')

  const toggle = doc.createElement('button')
  toggle.setAttribute('type', 'button')
  toggle.className = 'ursim-twin-rail-toggle'
  toggle.setAttribute('data-ursim-twin-rail-toggle', 'right')

  const body = doc.createElement('div')
  body.className = 'ursim-twin-rail-body'
  body.setAttribute('data-ursim-twin-rail-body', 'right')

  rail.appendChild(toggle)
  rail.appendChild(body)

  let collapsed = false

  /** 把收起状态同步到三处：`data-collapsed`（CSS 据此收正文）、`aria-expanded`、把手文案。 */
  function syncChrome() {
    rail.setAttribute('data-collapsed', collapsed ? 'true' : 'false')
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    // 箭头指向"点下去会发生什么"：展开时朝右（收起），收起后朝左（展开）。
    toggle.textContent = collapsed ? '‹' : '›'
    const hint = collapsed ? '展开控制轨' : '收起控制轨'
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
    if (opts.persist !== false) writeRailState(storage, { right: collapsed })
    onChange?.(collapsed)
    return collapsed
  }

  toggle.addEventListener('click', () => {
    setCollapsed(!collapsed)
  })

  // 初始状态来自存储（读失败 = 展开），恢复过程**不**触发 onChange：面板此时会自己算一次列宽。
  collapsed = readRailState(storage).right === true
  syncChrome()

  return {
    rail,
    toggle,
    body,
    setCollapsed,
    isCollapsed: () => collapsed,
  }
}

/** 建一个空 body（占位）：控件由 `mountRightRail` 填，不改骨架。 */
function makeBody(doc, deps) {
  const body = doc?.createElement?.('div') ?? null
  if (!body) return null
  body.className = 'ursim-twin-rail-body'
  body.setAttribute('data-ursim-twin-rail-body', 'right')
  // 供控件读取：命令出口与最新快照。
  body.__deps = deps ?? {}
  return body
}

/**
 * 运动命令的**全局闸门**：点动盘与位姿/关节输入共用同一把锁。
 *
 * 合并成一条轨之后，两类控件在同一屏上、都属于"让机械臂动"的命令，而宿主 `/twin/jog` 一次
 * 只该执行一条运动：以前左右两轨各有一个 `busy` 标志，用户一只手按住点动盘、另一只手拖关节
 * 滑块时，两条命令会同时下发。这里把它收成一个持有者模型（相当于互斥量）：
 *   - `tryAcquire(owner)` 成功才允许发命令，失败表示"别人正在动"，调用方按忙处理；
 *   - `subscribe(fn)` 让"锁的持有状态变了"成为唯一的重绘信号（两边的按钮态、body 状态都靠它）。
 *
 * @returns {{
 *   tryAcquire: (owner: string) => boolean,
 *   release: (owner: string) => void,
 *   isHeld: () => boolean,
 *   subscribe: (fn: (held: boolean) => void) => () => void,
 * }}
 */
export function createMotionLock() {
  let holder = null
  const listeners = new Set()
  const notify = () => {
    for (const fn of [...listeners]) {
      try {
        fn(holder !== null)
      } catch {
        /* 订阅者异常不得让别的控件发不出命令 */
      }
    }
  }
  return {
    tryAcquire(owner) {
      if (holder !== null) return false
      holder = owner
      notify()
      return true
    },
    release(owner) {
      if (holder !== owner) return
      holder = null
      notify()
    },
    isHeld: () => holder !== null,
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {}
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

/* ------------------------------------------------------------------ *
 * 点动控件（TCP 位置 / TCP 方向两个盘 + 步长 mm / ° 两档 + 参考系 + 回零）
 *
 * 这一层的职责边界：**只把一次点击整形为宿主 `/twin/jog` 的 body**，不自己发请求、
 * 不读运动学、不做乐观更新（下一帧状态才是唯一真源）。命令出口与快照都是注入的：
 *   - `deps.send(body)`  —— 返回 Promise 时按"完成/失败"解禁，返回其它值时视为同步完成；
 *   - `deps.setTimeout` / `deps.clearTimeout` —— 长按重复的定时器（单测注入假时钟）；
 *   - `deps.lock` —— 与位姿/关节共用的运动闸门（`createMotionLock()`）。
 * 没有 `send`（或它抛错）时控件保持禁用，**绝不吞掉异常**：错误交给 `deps.reportError`。
 * ------------------------------------------------------------------ */

/** 按住多久后从"一步"切换成速度流（毫秒）。 */
export const JOG_HOLD_DELAY_MS = 250
/**
 * 速度流的**重发间隔**（毫秒）。
 *
 * 它不是一个"运动步长"，而是喂服务器看门狗的节奏：宿主对 `{mode:'velocity'}` 的
 * `ttlMs` 是 400 ms —— 浏览器崩溃 / 切到后台时重发会停，服务器必须在 400 ms 后
 * 自己把速度归零。100 ms 留了 4 倍余量，运动也比 200 ms 一步的小 `movel` 平滑。
 */
export const JOG_VELOCITY_INTERVAL_MS = 100
/** 每条速度指令的存活时间（毫秒）：服务器超过这么久没收到新指令就把速度归零。 */
export const JOG_VELOCITY_TTL_MS = 400
/** 长按速度流的平移速度（m/s）：25 mm/s，**与步长档位无关**。 */
export const JOG_LINEAR_SPEED_MPS = 0.025
/** 长按速度流的旋转速度（°/s）：15 °/s，与角度步长档位**无关**。 */
export const JOG_ANGULAR_SPEED_DEG_S = 15
/** 15 °/s 对应的弧度值（`twist` 的旋转分量用 rad/s）。 */
export const JOG_ANGULAR_SPEED_RAD_S = (JOG_ANGULAR_SPEED_DEG_S * Math.PI) / 180
/** 位置步长档位（毫米）。 */
export const JOG_STEPS_MM = Object.freeze([1, 5, 10])
/** 姿态步长档位（度）。 */
export const JOG_STEPS_DEG = Object.freeze([1, 2, 5])
/** 默认步长：位置 **1 mm**、姿态 1°（用户要求位置默认取最小档；误触的位移最小）。 */
export const JOG_DEFAULT_STEP_MM = 1
export const JOG_DEFAULT_STEP_DEG = 1

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
  home: { mode: 'home', label: S.controlsHome },
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
    // 段选按钮也要有可读说明（"步长 5 mm" / "切换到基座系点动"），而不是只有一个数字。
    if (option.title) button.setAttribute('title', option.title)
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
 * 点动区内容：TCP 位置 / TCP 方向 点动盘、步长两档（mm / °）。
 *
 * 这一层的职责边界：**只把一次点击整形为宿主 `/twin/jog` 的 body**，不自己发请求、
 * 不读运动学、不做乐观更新（下一帧状态才是唯一真源）。命令出口与快照都是注入的：
 *   - `deps.send(body)`  —— 返回 Promise 时按"完成/失败"解禁，返回其它值时视为同步完成；
 *   - `deps.setTimeout` / `deps.clearTimeout` —— 长按重复的定时器（单测注入假时钟）；
 *   - `deps.lock` —— `createMotionLock()` 的实例：点动与位姿/关节输入共用一把闸门。
 * 没有 `send`（或它抛错）时控件保持禁用，**绝不吞掉异常**：错误写到控件区的错误行上。
 *
 * ## 交互（设计 §6，2026-10-19 改为"短按一步 / 长按速度流"）
 *   - **短按**：按下立即发**一步**（`cartesian` / `rotate`），松手补一条 `{mode:'stop'}`；
 *   - **长按**：按住 `JOG_HOLD_DELAY_MS` 后不再重复小步，切换成**速度流** ——
 *     发一条 `{mode:'velocity', twist, frame, ttlMs}`，此后每 `JOG_VELOCITY_INTERVAL_MS`
 *     重发一次（喂服务器看门狗，400 ms 不收就自动归零）；
 *   - **重发是覆盖式**：上一条还在飞就跳过这一拍，但**绝不停表**；
 *   - **回零不参与速度流**：它是绝对位形，按住重复没有意义 —— 仍然"点一次走一次"；
 *   - 按下时抓住指针（`setPointerCapture`），松开（`pointerup` / `pointerleave` /
 *     `pointercancel` / `lostpointercapture`）即停，**任何按住结束都发 `{mode:'stop'}`**；
 *     另外在窗口层面兜底 `blur` / `pointerup`（捕获阶段）/ `visibilitychange`；
 *   - 宿主节点写 `data-ursim-jog-mode="step"|"velocity"`（空闲/短按时为 `step`）；
 *   - **同一时刻只允许一条命令在飞**（串行，且与位姿/关节共用 `lock`）：在途时点动按钮
 *     **不设 `disabled`**（否则被按住的按钮收不到 `pointerup`，长按会被自己掐断），只写
 *     `aria-disabled="true"`；后续命令由 `runCommand` 的门丢弃；
 *     `{mode:'stop'}` 是**例外**：它不走闸门，松手必须能立刻打断在途的速度指令。
 *
 * 按钮文案一律带轴与方向（`X+` / `RX−` / `回零`…），`title` 里再写清"沿哪个参考系的哪根轴、
 * 走多少"—— 步长或参考系一变就重算，避免标题与真实命令对不上。
 *
 * @param {Document} doc
 * @param {{send?: Function, setTimeout?: Function, clearTimeout?: Function, lock?: object, host?: object, reportError?: Function}} [deps]
 * @returns {{
 *   row: HTMLElement|null,
 *   frameSeg: HTMLElement|null,
 *   sync: (snapshot?: object) => void,
 *   dispose: () => void,
 * }}
 *   `row` 是"两盘点动盘 + 步长列"的一行（由 `mountRightRail` 插进正文）；
 *   `frameSeg` 是参考系分段控件（工具系 / 基座系），由调用方放进「坐标系」那一列。
 */
export function createJogControls(doc, deps = {}) {
  const merged = { ...deps }
  const send = typeof merged.send === 'function' ? merged.send : null
  const setT = typeof merged.setTimeout === 'function' ? merged.setTimeout : globalThis.setTimeout
  const clearT = typeof merged.clearTimeout === 'function' ? merged.clearTimeout : globalThis.clearTimeout
  const lock = merged.lock ?? createMotionLock()
  /**
   * 面板级宿主节点：`data-ursim-jog-mode` 除了写在 `row`（CSS 用它切样式）之外，还要在面板
   * 正文上再写一份 —— 合并成单轨后，这个属性就是整块面板"现在是步进还是速度流"的状态位，
   * 外部（测试、将来的诊断面板）只看正文即可，不必知道内部 DOM 结构。
   */
  const host = merged.host ?? null

  /* ---------------- 可变状态 ---------------- */
  let disposed = false
  let stepMm = JOG_DEFAULT_STEP_MM
  let stepDeg = JOG_DEFAULT_STEP_DEG
  let frame = 'base'
  /** 整块控件是否可用（连接 + 仿真 + 数据在流动）。 */
  let available = false
  let repeatTimer = null
  /** 当前是否有一段"按住"仍在进行（松手时据此决定要不要补 stop）。 */
  let holding = false
  /** 当前按住的是哪个按钮（速度流据此现算 `twist`）。 */
  let heldKey = null
  /** `data-ursim-jog-mode` 的最近写入值：`step`（一步）或 `velocity`（速度流）。 */
  let lastMode = null
  /** 当前被按住的按钮抓住的指针（`lostpointercapture` / 松开时释放）。 */
  let heldPointer = null
  let lastRenderKey = null

  /** 卸载时要摘掉的 DOM 监听（元素会被移出文档，但显式解绑更干净）。 */
  const bindings = []
  const bind = (target, type, handler) => {
    target.addEventListener(type, handler)
    bindings.push(() => target.removeEventListener?.(type, handler))
  }
  /**
   * 窗口级监听（P0 安全兜底）。
   *
   * 按住点动只在**按钮**上挂了结束事件，而 `holding` 是速度流唯一的开关（见 `streamVelocity`）：
   * 鼠标按下后拖出浏览器窗口再松手，按钮收不到 `pointerup`（指针捕获只在同一文档内有效），
   * 切窗口/切标签页时同理。`holding` 就会永久为真 —— 速度流以 20 Hz 一直续发，机械臂一直动。
   * 所以除了按钮自身的事件，还要在窗口层面再兜一道：失焦、任何位置的松手、页面转后台，
   * 全部当作"用户已经松手"。
   *
   * 挂在 `doc.defaultView`（= window）而不是 `document`：`pointerup` 在捕获阶段经过 window，
   * 不依赖它是否冒泡到被按住的按钮；而宿主注入的假 DOM 也只为 window 提供 addEventListener。
   */
  const win = doc?.defaultView ?? null
  const windowBindings = []
  const bindWindow = (target, type, handler, options) => {
    if (!target || typeof target.addEventListener !== 'function') return
    target.addEventListener(type, handler, options)
    windowBindings.push(() => target.removeEventListener?.(type, handler, options))
  }

  /* ---------------- DOM ---------------- */
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

  /* ---- 步长：两档竖排（位置 mm / 姿态 °），与附件图右侧那两列一致 ---- */
  const stepSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'steps')
  const stepsInner = makeEl(doc, 'div', 'ursim-twin-ctl-steps')

  const mmCell = makeEl(doc, 'div', 'ursim-twin-ctl-stepcol')
  const mmTitle = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  mmTitle.textContent = S.controlsStepMm
  mmCell.appendChild(mmTitle)
  const stepMmSeg = makeSegment(
    doc,
    S.controlsStepMm,
    'data-ursim-step-mm',
    JOG_STEPS_MM.map((value) => ({
      value: String(value),
      text: String(value),
      title: S.controlsStepMmOptionTitle(value),
    })),
    String(stepMm),
    (next) => {
      stepMm = Number(next)
      refreshJogTitles()
    },
  )
  stepMmSeg.wrap.setAttribute('data-ursim-ctl-seg', 'step-mm')
  segmentButtons.push(...stepMmSeg.buttons.map((entry) => entry.button))
  mmCell.appendChild(stepMmSeg.wrap)
  stepsInner.appendChild(mmCell)

  const degCell = makeEl(doc, 'div', 'ursim-twin-ctl-stepcol')
  const degTitle = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  degTitle.textContent = S.controlsStepDeg
  degCell.appendChild(degTitle)
  const stepDegSeg = makeSegment(
    doc,
    S.controlsStepDeg,
    'data-ursim-step-deg',
    JOG_STEPS_DEG.map((value) => ({
      value: String(value),
      text: String(value),
      title: S.controlsStepDegOptionTitle(value),
    })),
    String(stepDeg),
    (next) => {
      stepDeg = Number(next)
      refreshJogTitles()
    },
  )
  stepDegSeg.wrap.setAttribute('data-ursim-ctl-seg', 'step-deg')
  segmentButtons.push(...stepDegSeg.buttons.map((entry) => entry.button))
  degCell.appendChild(stepDegSeg.wrap)
  stepsInner.appendChild(degCell)

  stepSection.appendChild(stepsInner)

  /* ---- 参考系（工具系 / 基座系）：不在这里定位，交给调用方放进「坐标系」列 ---- */
  const frameSeg = makeSegment(
    doc,
    S.controlsFrameTitle,
    'data-ursim-frame',
    [
      { value: 'tool', text: S.controlsFrameTool, title: S.controlsFrameOptionTitle(S.controlsFrameTool) },
      { value: 'base', text: S.controlsFrameBase, title: S.controlsFrameOptionTitle(S.controlsFrameBase) },
    ],
    frame,
    (next) => {
      frame = next
      refreshJogTitles()
    },
  )
  frameSeg.wrap.setAttribute('data-ursim-ctl-seg', 'frame')
  segmentButtons.push(...frameSeg.buttons.map((entry) => entry.button))

  /* ---- 点动行：位置盘 | 方向盘（步长两档不在这里排，交给调用方放进右侧列）---- */
  const row = makeEl(doc, 'div', 'ursim-twin-ctl-jog', 'data-ursim-ctl-row', 'jog')
  row.appendChild(posSection)
  row.appendChild(rotSection)

  /* ---------------- 行为 ---------------- */

  /**
   * 建一个点动按钮并绑定按下/松开。
   *
   * 只认 pointer 事件：`click` 会在"按住拖出按钮再松手"时也触发，于是一次拖拽可能
   * 多走一步；pointerdown 的语义与"按住"完全一致。
   *
   * `pointerdown` 里同时抓住指针：手指/鼠标轻微滑出按钮时事件仍回到这个按钮，
   * 长按不会因为边界判定丢事件而中断。`lostpointercapture` 与 `pointerup` /
   * `pointerleave` / `pointercancel` 并列，任何一种"按住结束"都停表。
   */
  function makeJogButton(key) {
    const spec = JOG_SPECS[key]
    const button = makeButton(doc, 'ursim-twin-ctl-button', spec?.label ?? key, 'data-ursim-jog', key)
    button.disabled = true
    bind(button, 'pointerdown', (event) => {
      // 阻止按住时选中文本/触发拖拽手势；假 DOM 的事件参数可能不存在。
      event?.preventDefault?.()
      // 先结束上一段长按（并释放它可能留下的捕获），再抓这一次的指针。
      // 上一段若已进入速度流，必须先补 stop：否则它会继续被喂到看门狗超时。
      if (endHold()) sendStop()
      try {
        button.setPointerCapture?.(event?.pointerId)
        heldPointer = { button, id: event?.pointerId }
      } catch {
        // 极端环境（不支持 pointer capture / pointerId 已失效）：退化为普通事件，
        // 长按仍可用，只是滑出按钮会丢事件。
        heldPointer = null
      }
      onPress(key)
    })
    bind(button, 'pointerup', stopRepeat)
    bind(button, 'pointerleave', stopRepeat)
    bind(button, 'pointercancel', stopRepeat)
    bind(button, 'lostpointercapture', stopRepeat)
    jogButtons.push({ button, key })
    return button
  }

  /**
   * 重写所有点动按钮的 `title`：说明"沿/绕哪个参考系的哪根轴、走多大一步"。
   *
   * 步长与参考系都是可变的，标题必须是**派生值**而不是建按钮时写死的常量 —— 否则界面上
   * 写着"5 mm"、实际下发 10 mm，操作员只能靠数点击次数猜。分段控件切换后调用一次即可。
   */
  function refreshJogTitles() {
    const frameName = frame === 'base' ? S.controlsFrameBase : S.controlsFrameTool
    for (const { button, key } of jogButtons) {
      const spec = JOG_SPECS[key]
      if (!spec) continue
      if (spec.mode === 'home') {
        button.setAttribute('title', S.controlsHomeTitle)
        continue
      }
      const axis = String(spec.axis).toUpperCase()
      button.setAttribute(
        'title',
        spec.mode === 'cartesian'
          ? S.controlsJogPositionTitle(frameName, axis, spec.sign, stepMm)
          : S.controlsJogRotateTitle(frameName, axis, spec.sign, stepDeg),
      )
    }
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

  /** 按下：立即走一步；非回零键随后进入"按住"状态（250 ms 后切速度流）。 */
  function onPress(key) {
    if (disposed || !available || send === null) return
    if (!runCommand(bodyFor(key))) return
    holding = true
    heldKey = key
    setJogMode('step')
    if (JOG_SPECS[key]?.mode !== 'home') startRepeat(key)
  }

  /**
   * 由按钮 key + 当前参考系拼出一条**速度指令**（长按用，与步长档位无关）。
   *
   * - 平移键：只在对应轴的分量上给 ±25 mm/s，其余 0；
   * - 旋转键：只在对应轴的分量上给 ±15 °/s（rad/s），其余 0；
   * - 回零：返回 `null` —— 绝对位形不参与速度流。
   */
  function velocityFor(key) {
    const spec = JOG_SPECS[key]
    if (!spec || spec.mode === 'home') return null
    const twist = [0, 0, 0, 0, 0, 0]
    if (spec.mode === 'cartesian') {
      const index = spec.axis === 'x' ? 0 : spec.axis === 'y' ? 1 : 2
      twist[index] = spec.sign * JOG_LINEAR_SPEED_MPS
    } else {
      const index = spec.axis === 'rx' ? 3 : spec.axis === 'ry' ? 4 : 5
      twist[index] = spec.sign * JOG_ANGULAR_SPEED_RAD_S
    }
    return {
      mode: 'velocity',
      twist,
      frame: frame === 'base' ? 'base' : 'tool',
      ttlMs: JOG_VELOCITY_TTL_MS,
    }
  }

  /**
   * 发一条命令（串行，与位姿/关节共用 `lock`）。
   *
   * `send` 返回 Promise 时在它落定后解禁；返回其它值（如单测里的记录器）视为同步完成 ——
   * 否则长按重复在假时钟下会被上一条"永远在飞"卡死。
   *
   * @returns {boolean} 是否真的发出去（别的控件正持有闸门 / 没有出口时为 false）
   */
  function runCommand(payload) {
    if (disposed || !payload || send === null || !available) return false
    if (!lock.tryAcquire('jog')) return false
    const settle = () => {
      lock.release('jog')
      if (!disposed) renderAvailability()
    }
    let result
    try {
      result = send(payload)
    } catch {
      settle()
      return false
    }
    if (result !== null && typeof result?.then === 'function') {
      result.then(settle, settle)
    } else {
      settle()
    }
    renderAvailability()
    return true
  }

  /** 按住 `JOG_HOLD_DELAY_MS` 后切速度流；此后每 `JOG_VELOCITY_INTERVAL_MS` 重发一次。 */
  function startRepeat(key) {
    heldKey = key
    // 只清定时器、不碰指针捕获：捕获是刚在 pointerdown 里为这次按住设置的。
    clearRepeatTimer()
    const begin = () => {
      repeatTimer = null
      if (disposed || !holding) return
      setJogMode('velocity')
      streamVelocity()
    }
    repeatTimer = setT(begin, JOG_HOLD_DELAY_MS)
  }

  /**
   * 速度流的一拍：发一条 velocity（忙就跳过这一拍），然后**无条件**排下一拍。
   *
   * 看门狗要的是固定节奏：绝不能因为一次 busy / 一次失败就停表 —— 停表等于松手，
   * 而用户并没有松手。后台标签页把定时器节流到 > 400 ms 时，服务器看门狗会先停住
   * 机械臂，这是刻意的失败方向。
   */
  function streamVelocity() {
    if (disposed || !holding) return
    const payload = velocityFor(heldKey)
    if (available && payload !== null) runCommand(payload)
    repeatTimer = setT(streamVelocity, JOG_VELOCITY_INTERVAL_MS)
  }

  /** 只清重复定时器（不释放指针捕获）。 */
  function clearRepeatTimer() {
    if (repeatTimer === null) return
    if (typeof clearT === 'function') clearT(repeatTimer)
    repeatTimer = null
  }

  /** 写 `data-ursim-jog-mode`（只在值变化时写，避免每拍碰 DOM）。 */
  function setJogMode(next) {
    if (next === lastMode) return
    lastMode = next
    row.setAttribute('data-ursim-jog-mode', next)
    if (host && host !== row) host.setAttribute('data-ursim-jog-mode', next)
  }

  /**
   * 结束"按住"但**不发** stop：清定时器 + 释放指针捕获 + 回到 `step`。
   *
   * `pointerdown` 用它收拾上一段按住（紧接着会发新命令，不需要额外的 stop）。
   *
   * @returns {boolean} 此前是否真的有一段按住（调用方据此决定要不要补 stop）
   */
  function endHold() {
    const wasHolding = holding
    holding = false
    heldKey = null
    clearRepeatTimer()
    const captured = heldPointer
    heldPointer = null
    if (captured) {
      try {
        if (captured.button.hasPointerCapture?.(captured.id) === true) {
          captured.button.releasePointerCapture(captured.id)
        }
      } catch {
        /* 极端环境：释放失败不影响停止长按 */
      }
    }
    setJogMode('step')
    return wasHolding
  }

  /**
   * 松手 / 移出 / 取消 / 捕获丢失 / 卸载：结束按住并补一条 `{mode:'stop'}`。
   *
   * - stop **不走闸门**：一条 velocity 还在飞时松手，也必须能把机械臂停下来；
   * - 只有"真的有过一段按住"才发：`pointerup` 之后浏览器补发的 `lostpointercapture`
   *   不会再补第二条 stop。
   */
  function stopRepeat() {
    if (!endHold()) return
    sendStop()
  }

  /**
   * 发停止指令（尽力而为，但**不再静默**）。
   *
   * 这是"松手之后让机械臂停下来"的那一条：丢掉它就只剩服务器 400 ms 看门狗兜底，而看门狗
   * 一旦失效，机械臂会带着最后一次速度继续动。失败原因交给面板的统一错误行
   * （`deps.reportError`），同时在宿主节点上留 `data-ursim-stop-failed` 供排查；
   * 没有上报出口时也不会把异常冒到事件回调外。
   */
  function sendStop() {
    if (send === null) return
    const onFail = (e) => {
      row.setAttribute('data-ursim-stop-failed', 'true')
      merged.reportError?.(S.controlsStopFailed(e instanceof Error ? e.message : String(e)))
    }
    let result
    try {
      result = send({ mode: 'stop' })
    } catch (e) {
      onFail(e)
      return
    }
    if (result !== null && typeof result?.then === 'function') {
      // stop 不参与闸门，也不让失败冒成 unhandledRejection。
      result.then(() => {
        row.removeAttribute?.('data-ursim-stop-failed')
      }, onFail)
    } else {
      row.removeAttribute?.('data-ursim-stop-failed')
    }
  }

  // 窗口级兜底的三条通道（见 `bindWindow` 的注释）。`blur` 覆盖"点了别的窗口"，
  // `pointerup` 捕获阶段覆盖"在窗口任何地方松手"，`visibilitychange` 覆盖"切到后台/最小化"。
  // 三者都只调用 `stopRepeat`：它自带去重（只有真的按住过才补 stop），重复触发无害。
  bindWindow(win, 'blur', () => stopRepeat())
  bindWindow(win, 'pointerup', () => stopRepeat(), true)
  bindWindow(win, 'visibilitychange', () => {
    if (doc?.visibilityState === 'hidden') stopRepeat()
  })

  /**
   * 只有"可用性/闸门持有者"变化时才写 DOM —— 每帧（60 Hz）重写 disabled 是浪费。
   *
   * `data-ursim-ctl-state` 由 `mountRightRail` 统一写到 body 上（整条轨一个状态）；
   * 这里只在点动行上写一份同样的值，方便单独调试只看点动区。
   */
  function renderAvailability() {
    const busy = lock.isHeld()
    const key = `${available ? '1' : '0'}${busy ? '1' : '0'}`
    if (key === lastRenderKey) return
    lastRenderKey = key
    for (const entry of jogButtons) {
      // 只有"能不能用"才落真 disabled。busy 绝不能设 disabled：被禁用的元素不再接收
      // 指针事件，浏览器会补一个 pointercancel，正在被按住的按钮当场丢长按定时器。
      // busy 只写 aria-disabled，按钮仍然收得到 pointerup。
      entry.button.disabled = !available
      entry.button.setAttribute('aria-disabled', busy ? 'true' : 'false')
    }
    for (const button of segmentButtons) button.disabled = !available
    row.setAttribute('data-ursim-ctl-state', !available ? 'disabled' : (busy ? 'busy' : 'ready'))
  }

  /** 这一帧是否可点动（连接 + 仿真 + 数据在流动 + 有命令出口）。 */
  function isAvailable(snapshot) {
    if (send === null) return false
    if (snapshot?.connected !== true) return false
    if (snapshot?.feedStale === true) return false
    if (snapshot?.simulated !== true) return false
    return true
  }

  /**
   * 每帧喂最新快照：只更新可用性（置灰/解禁），从不回写用户正在操作的步长
   * （那会把手指还按着的控件抢回去），也不写任何文字原因（原因行在 body 顶部）。
   */
  function sync(snapshot) {
    if (disposed) return
    const nextAvailable = isAvailable(snapshot)
    if (nextAvailable !== available) {
      available = nextAvailable
      if (!available) stopRepeat()
      renderAvailability()
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
    // 窗口监听同样必须摘干净：面板卸载后它们仍会触发（window 的生命周期比面板长），
    // 而 `stopRepeat` 在 disposed 之后也没有意义了。
    for (const off of windowBindings) {
      try {
        off()
      } catch {
        /* 同上：宿主可能已经把 window 换成新的，解绑失败不该阻断卸载 */
      }
    }
    windowBindings.length = 0
  }

  // 闸门持有者变化 = 按钮的 aria-disabled 与点动行状态要重画（另一类控件抢到了锁）。
  const offLock = lock.subscribe(() => renderAvailability())

  // 初始一律禁用：第一帧快照到达前不可能知道连没连上/是不是仿真。
  // 标题在建完按钮后统一派生一次（默认 5 mm / 1° / 工具系）。
  // 空闲态一律 `step`（速度流只在按住超过 250 ms 之后才出现）。
  setJogMode('step')
  refreshJogTitles()
  renderAvailability()

  return {
    row,
    steps: stepSection,
    frameSeg: frameSeg.wrap,
    sync,
    dispose() {
      offLock()
      dispose()
    },
  }
}

/** 右轨位姿输入的轴顺序（与宿主 `/twin/jog` body 里 `pose` 的下标一致）。 */
const POSE_AXES = Object.freeze(['x', 'y', 'z', 'rx', 'ry', 'rz'])
const POSE_INDEX = Object.freeze({ x: 0, y: 1, z: 2, rx: 3, ry: 4, rz: 5 })
/** 关节滑块的行程（度）：UR 的关节范围 ±360°。 */
const JOINT_MIN_DEG = -360
const JOINT_MAX_DEG = 360

/** 位置轴（mm↔m）还是姿态轴（rad）。 */
function isTranslationAxis(axis) {
  return axis === 'x' || axis === 'y' || axis === 'z'
}

/** 六维有限数向量（关节角 / TCP 都按这个口径收）。 */
function isVec6(value) {
  return Array.isArray(value) && value.length === 6 && value.every(Number.isFinite)
}

/** 把角度夹到滑块行程内（只用于滑块/回显，命令本身不做这个钳位）。 */
function clampJointDeg(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(JOINT_MAX_DEG, Math.max(JOINT_MIN_DEG, n))
}

/** 位姿输入框的显示格式：X/Y/Z 用 mm（1 位小数）、RX/RY/RZ 用 rad（3 位小数）。 */
function formatPoseValue(axis, value) {
  return isTranslationAxis(axis) ? (value * 1000).toFixed(1) : Number(value).toFixed(3)
}

/**
 * 位姿输入的严格数字格式：只接受十进制整数或小数（可带负号）。
 *
 * `Number()` 太宽：`0x10` → 16、`1e3` → 1000、`Infinity` → Infinity —— 这些都会被**静默**
 * 当成合法目标位姿下发（框里写着 `1e3`，机械臂去了 1000 mm）。工程输入框只该接受人真的会
 * 写的十进制数；指数/十六进制/空白一律按非法处理（回滚 + 标红 + 提示）。
 * 回填值走 `formatPoseValue`，恒为 ASCII 十进制，不会被这条正则误伤。
 */
const POSE_INPUT_RE = /^-?\d+(\.\d+)?$/

/**
 * 解析位姿输入。合法返回有限数，非法返回 `null`（调用方据此回滚并提示）。
 * @param {unknown} text
 * @returns {number|null}
 */
function parsePoseInput(text) {
  const raw = String(text ?? '').trim()
  if (raw === '' || !POSE_INPUT_RE.test(raw)) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/**
 * 只读摘要里的米制数值：保留 3 位小数，去掉无意义的尾零，负数用排版减号（与面板文案一致）。
 *
 * @param {number} value 米
 * @returns {string} 例如 `0` / `−0.058` / `1.485`
 */
function formatMeters(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return String(Number(n.toFixed(3))).replace(/^-/, '−')
}
/**
 * 控制轨内容（**唯一一条**，500 px）：只读摘要 + TCP 位姿数值输入 + 坐标系 + 点动盘/步长 + 六关节滑块。
 *
 * 2026-10-20 用户要求把原来的左轨（点动）整体并到右轨，位置按附件图自上而下：
 *   ① 只读读数行（`TCP: x, y, z m`）；
 *   ② `TCP 位姿` 六格输入（X/Y/Z mm 一行 + RX/RY/RZ rad 一行），右侧是 `坐标系` 竖排（工具系 / 基座系）；
 *   ③ `TCP 位置（mm）` 3×3 盘 + `Z+`/`Z−` 一行，中间是 `TCP 方向（°）` 3×3 盘 + `RZ+`/`RZ−` 一行，
 *      右侧是两列竖排步长（`步长 mm` 1/5/10、`步长 °` 1/2/5）；
 *   ④ `关节` 六行（机座 / 肩部 / 肘部 / 手腕1 / 手腕2 / 手腕3，每行 ◀ + 滑块 + ▶ + 角度）。
 * 文案与位置一一对应；控件尺寸按 500 px 轨重算（见 `styles.js` 的注释）。
 *
 * 交互（设计 §5 / §6）：
 *   - 关节滑块 `input` 只更新**本地数值与 FD 预览**（通过可选的 `deps.previewJoints(q)`），
 *     绝不发命令；`change`（松手）才下发一条 `{mode:'joint', q:[6 个弧度]}`；
 *     `q` 以**最新帧**的关节角为底，只改被操作的那一个；
 *   - 位姿输入回车/失焦下发 `{mode:'pose', pose:[6]}`，以最新帧 TCP 为底只改被编辑的分量；
 *     X/Y/Z 按 mm 收、除以 1000 转米，RX/RY/RZ 按 rad 收；
 *   - 拖动中的轴不被 `sync` 回填（否则滑块会从用户手指下被拽走）；
 *   - 命令失败（`ok !== true` 或抛错）→ 输入框/滑块回滚到最新帧值并标红，
 *     下一次**新帧**（`ts` 变化）后自动清除；
 *   - 点动与位姿/关节共用 `deps.lock`（`createMotionLock()`）：同一时刻只有一条命令在飞，
 *     点动按钮在忙时只写 `aria-disabled`（不设 disabled，否则被按住的按钮收不到 `pointerup`），
 *     位姿输入与关节控件则真 `disabled`；
 *   - 整块禁用时在 `data-ursim-ctl-note` 写出原因；`data-ursim-ctl-error` 承载命令失败原因；
 *     两者都挂到 `deps.noteHost` / `deps.errorHost`（0.3.6 起错误行、0.3.8 起提示行都放进 HUD 的
 *     身份行，与"机器人 <型号> · <IP>"同一行、和系统级错误行共存），缺省仍挂在轨内顶部；
 *   - 顶部另有一行**只读摘要**（`data-ursim-ctl-summary`，`TCP: x, y, z m`）：随快照更新，
 *     不是输入、不参与下发。
 *
 * @param {Document} doc
 * @param {HTMLElement} body 侧轨的 body 容器
 * @param {{
 *   send?: Function,
 *   getSnapshot?: Function,
 *   previewJoints?: (q: number[]|null) => void,
 *   lock?: object,
 *   reportError?: (message: string) => void,
 *   noteHost?: HTMLElement,
 *   errorHost?: HTMLElement,
 * }} [deps] `previewJoints` 是纯本地的 3D 预览钩子（不发命令、不改测量值）；
 *   传 `null` 表示结束预览。`lock` 缺省时自建一把（单测只挂这一块控件时用）。
 *   `noteHost` 是"整块禁用原因"提示行的宿主节点、`errorHost` 是错误行的宿主节点
 *   （两者缺省都 = 侧轨 body；面板把两个都指到 HUD 身份行里同一个槽位）。
 * @returns {{sync: (snapshot?: object) => void, dispose: () => void, body: HTMLElement|null, deps: object}}
 */
export function mountRightRail(doc, body, deps = {}) {
  const host = body ?? makeBody(doc, deps)
  if (!host) {
    return { body: null, deps, sync() {}, dispose() {} }
  }
  host.setAttribute('data-ursim-twin-rail-body', 'right')
  const merged = { ...(host.__deps ?? {}), ...deps }
  host.__deps = merged

  const send = typeof merged.send === 'function' ? merged.send : null
  const preview = typeof merged.previewJoints === 'function' ? merged.previewJoints : null
  const lock = merged.lock ?? createMotionLock()
  /*
   * 提示行与错误行的宿主：面板把两者都指到 HUD 的身份行（与"机器人 <型号> · <IP>"同一行），
   * 让"为什么整块不能操作 / 命令为什么没生效"紧挨着"我在操作哪台机器"。
   * 缺省仍挂在侧轨 body 顶部。
   * ⚠️ 只换挂载点、不换元素本身：节点仍带 `data-ursim-ctl-note` / `data-ursim-ctl-error`，
   *    写入路径与触发点一字未改；两者都有 `:empty { display: none }`，空着就不占位置。
   */
  const hostIsUsable = (node) => node && typeof node.appendChild === 'function'
  const noteHost = hostIsUsable(merged.noteHost) ? merged.noteHost : host
  const errorHost = hostIsUsable(merged.errorHost) ? merged.errorHost : host

  /* ---------------- 可变状态 ---------------- */
  let disposed = false
  /** 整块控件是否可用（连接 + 仿真 + 数据在流动）。 */
  let available = false
  /** 最新一帧的关节角 / TCP（命令的唯一基底 —— 绝不用缓存位姿算目标）。 */
  let latestQ = null
  let latestTcp = null
  let latestTs = null
  /** 标红时的帧时间戳：只有**新帧**（`ts` 变化）才清除红标，不给用户"一帧就消失"的假象。 */
  let invalidTs = null
  let lastReason = null
  let lastStateKey = null
  /** 正在拖动的关节下标（这些轴的滑块与数值不得被 sync 回填）。 */
  const dragging = new Set()
  /** 当前被标红的元素（下一次成功帧统一清除）。 */
  const invalidEls = new Set()

  /** 卸载时要摘掉的 DOM 监听。 */
  const bindings = []
  const bind = (target, type, handler) => {
    target.addEventListener(type, handler)
    bindings.push(() => target.removeEventListener?.(type, handler))
  }

  /* ---------------- DOM ---------------- */
  const note = makeEl(doc, 'div', 'ursim-twin-ctl-note', 'data-ursim-ctl-note')
  // 挂到 `noteHost`（面板传 HUD 身份行）：提示行与错误行共享同一个槽位。
  noteHost.appendChild(note)
  const error = makeEl(doc, 'div', 'ursim-twin-ctl-error', 'data-ursim-ctl-error')
  // 挂到 `errorHost`（面板传 HUD 身份行）而不是轨内顶部：用户要求错误行与身份同一行。
  errorHost.appendChild(error)

  /*
   * 只读摘要：把"机器人现在在哪"放在最上面一眼可见（附件图第一行）。
   * 它不是输入、不参与下发，只随快照更新 —— 位姿输入框仍各自承担编辑。
   */
  const summary = makeEl(doc, 'div', 'ursim-twin-ctl-summary', 'data-ursim-ctl-summary')
  summary.setAttribute('role', 'status')
  summary.setAttribute('title', S.controlsSummaryTitle)
  summary.textContent = ''
  host.appendChild(summary)

  const poseInputs = Object.create(null)
  const jointRows = []

  /* ---- ② 位姿段：TCP 位姿六格（X/Y/Z mm 一行、RX/RY/RZ rad 一行）---- */
  const poseSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'pose')
  const poseLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  poseLabel.textContent = S.controlsToolPosition
  poseLabel.setAttribute('title', S.controlsToolPositionTitle)
  poseSection.appendChild(poseLabel)

  const poseGrid = makeEl(doc, 'div', 'ursim-twin-ctl-pose', 'data-ursim-ctl-grid', 'pose')
  // 轴顺序就是 `POSE_AXES`：3 列网格下自动折成 X/Y/Z + RX/RY/RZ 两行。
  for (const axis of POSE_AXES) {
    const entry = {
      axis,
      index: POSE_INDEX[axis],
      input: null,
      editing: false,
      /** 最近一次**成功/已尝试**下发的字符串值：回车与失焦可能是同一次编辑，靠它去重。 */
      lastSent: null,
      /** 回车已经提交过：紧跟着的 change 不再重复提交（真浏览器里两者会成对出现）。 */
      skipChange: false,
    }
    const cell = makeEl(doc, 'div', 'ursim-twin-ctl-pose-cell', 'data-ursim-pose-cell', axis)
    const label = makeEl(doc, 'span', 'ursim-twin-ctl-pose-label')
    label.textContent = axis.toUpperCase()
    const input = doc.createElement('input')
    input.setAttribute('type', 'text')
    input.className = 'ursim-twin-ctl-pose-input'
    input.setAttribute('inputmode', 'decimal')
    input.setAttribute('data-ursim-pose', axis)
    input.setAttribute(
      'aria-label',
      `${axis.toUpperCase()} (${isTranslationAxis(axis) ? 'mm' : 'rad'})`,
    )
    input.setAttribute('title', S.controlsToolPositionTitle)
    input.setAttribute('placeholder', S.controlsNoPoseData)
    input.value = ''
    input.disabled = true
    entry.input = input
    poseInputs[axis] = entry
    cell.appendChild(label)
    cell.appendChild(input)
    poseGrid.appendChild(cell)

    bind(input, 'keydown', (event) => {
      if (event?.key !== 'Enter') return
      event?.preventDefault?.()
      // `commitPose` 的返回值表示这次编辑是否已被消费（已下发/去重/已给出可见错误）：
      // 只有真的消费了，紧随其后的 `change` 才是同一个编辑的第二次通知。
      entry.skipChange = commitPose(axis) !== false
    })
    bind(input, 'change', () => {
      // 回车已经发过这一条：紧跟的 change 是同一个编辑的第二次通知，丢弃。
      if (entry.skipChange) {
        entry.skipChange = false
        return
      }
      commitPose(axis)
    })
    bind(input, 'input', () => {
      entry.editing = true
      entry.lastSent = null
      entry.skipChange = false
      clearInvalidEl(input)
    })
    bind(input, 'focus', () => { entry.editing = true })
    bind(input, 'blur', () => { entry.editing = false })
  }
  poseSection.appendChild(poseGrid)

  /* ---- ③ 点动区：位置盘 | 方向盘（点动逻辑在 createJogControls 里）---- */
  const jog = createJogControls(doc, { ...merged, lock, host: body })

  /* ---- 坐标系：竖排两档（工具系 / 基座系），与附件图右侧一致 ---- */
  const frameCol = makeEl(doc, 'div', 'ursim-twin-ctl-frame', 'data-ursim-ctl-frame', 'frame')
  const frameLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  frameLabel.textContent = S.controlsFrameTitle
  frameCol.appendChild(frameLabel)
  if (jog.frameSeg) frameCol.appendChild(jog.frameSeg)

  /*
   * 主区两列（与附件图一致）：左＝位姿六格 + 两块方向盘，右＝坐标系 + 两档步长竖排。
   * 右列独立成列（而不是塞进各自的行里），才能在 500 px 里把「坐标系」与「步长」上下对齐
   * 成同一条竖带 —— 附件图里它们就是同一个右栏。
   */
  const main = makeEl(doc, 'div', 'ursim-twin-ctl-main')
  const primary = makeEl(doc, 'div', 'ursim-twin-ctl-primary')
  const side = makeEl(doc, 'div', 'ursim-twin-ctl-side')
  primary.appendChild(poseSection)
  if (jog.row) primary.appendChild(jog.row)
  side.appendChild(frameCol)
  if (jog.steps) side.appendChild(jog.steps)
  main.appendChild(primary)
  main.appendChild(side)
  host.appendChild(main)

  /* ---- ④ 关节：6 行（名称 40 + ◀ 26 + 滑块 + ▶ 26 + 数值 70，行高 30）---- */
  const jointSection = makeEl(doc, 'div', 'ursim-twin-ctl-section', 'data-ursim-ctl-section', 'joints')
  const jointLabel = makeEl(doc, 'div', 'ursim-twin-ctl-label')
  jointLabel.textContent = S.controlsJoints
  jointLabel.setAttribute('title', S.controlsJointsTitle)
  jointSection.appendChild(jointLabel)

  const JOINT_NAMES = [
    S.controlsJointBase,
    S.controlsJointShoulder,
    S.controlsJointElbow,
    S.controlsJointWrist1,
    S.controlsJointWrist2,
    S.controlsJointWrist3,
  ]
  for (let index = 0; index < 6; index += 1) {
    const row = makeEl(doc, 'div', 'ursim-twin-ctl-joint-row', 'data-ursim-joint-row', index)
    const name = makeEl(doc, 'span', 'ursim-twin-ctl-joint-name')
    name.textContent = JOINT_NAMES[index]
    name.setAttribute('title', JOINT_NAMES[index])

    const dec = makeButton(doc, 'ursim-twin-ctl-step', '◀', 'data-ursim-joint-dec', index)
    dec.setAttribute('aria-label', `${JOINT_NAMES[index]} −1°`)
    dec.setAttribute('title', S.controlsJointStepTitle(JOINT_NAMES[index], -1))

    const slider = doc.createElement('input')
    slider.setAttribute('type', 'range')
    slider.className = 'ursim-twin-ctl-joint-range'
    slider.setAttribute('data-ursim-joint', index)
    slider.setAttribute('aria-label', `${JOINT_NAMES[index]} (°)`)
    slider.setAttribute('title', S.controlsJointsTitle)
    // 关节行程 ±360°（UR 的关节范围）：属性与 property 都写，假 DOM 不会反射。
    slider.setAttribute('min', String(JOINT_MIN_DEG))
    slider.setAttribute('max', String(JOINT_MAX_DEG))
    slider.setAttribute('step', '1')
    slider.min = String(JOINT_MIN_DEG)
    slider.max = String(JOINT_MAX_DEG)
    slider.step = '1'
    slider.value = '0'
    slider.disabled = true

    const inc = makeButton(doc, 'ursim-twin-ctl-step', '▶', 'data-ursim-joint-inc', index)
    inc.setAttribute('aria-label', `${JOINT_NAMES[index]} +1°`)
    inc.setAttribute('title', S.controlsJointStepTitle(JOINT_NAMES[index], 1))

    const value = makeEl(doc, 'span', 'ursim-twin-ctl-joint-value', 'data-ursim-joint-value', index)
    value.textContent = ''

    row.appendChild(name)
    row.appendChild(dec)
    row.appendChild(slider)
    row.appendChild(inc)
    row.appendChild(value)
    jointSection.appendChild(row)
    jointRows[index] = { row, name, dec, slider, inc, value }

    bind(slider, 'input', () => {
      if (disposed) return
      const deg = Number(slider.value)
      if (!Number.isFinite(deg)) return
      dragging.add(index)
      clearInvalidEl(slider)
      // 拖动只改本地显示与 3D 预览：**不下发**（设计 §6.1）。
      value.textContent = S.controlsJointValue(deg)
      if (latestQ !== null && preview !== null) {
        const q = latestQ.slice()
        q[index] = (deg * Math.PI) / 180
        runPreview(q)
      }
    })
    bind(slider, 'change', () => {
      dragging.delete(index)
      if (disposed) return
      const deg = clampJointDeg(Number(slider.value))
      if (!available || lock.isHeld() || send === null || latestQ === null) {
        rollbackJoint(index)
        clearPreview()
        // 拒绝也要有说法（P2）：只把滑块弹回去而不解释，读起来就是"松手没反应"。
        error.textContent = rejectSubmitReason(
          latestQ === null ? S.controlsNoPoseData : S.controlsRejectedCommand,
        )
        return
      }
      const q = latestQ.slice()
      q[index] = (deg * Math.PI) / 180
      error.textContent = ''
      const sent = runCommand({ mode: 'joint', q }, {
        onFail: () => {
          rollbackJoint(index)
          markInvalid(slider)
        },
        onOk: () => { clearInvalidEl(slider) },
        // 命令落定前保持预览；落定后以**下一帧状态**为准。
        onSettled: clearPreview,
      })
      if (!sent) clearPreview()
    })
    bind(inc, 'click', () => stepJoint(index, 1))
    bind(dec, 'click', () => stepJoint(index, -1))
  }
  host.appendChild(jointSection)

  /* ---------------- 行为 ---------------- */

  /** 本地 FK 预览钩子：纯展示，绝不让钩子的异常冒到事件回调外。 */
  function runPreview(q) {
    if (preview === null) return
    try {
      preview(q)
    } catch {
      /* 预览失败不影响数值与后续命令 */
    }
  }

  /** 结束预览（松手/失败/卸载/禁用）：面板据下一帧恢复到实际姿态。 */
  function clearPreview() {
    if (preview === null) return
    try {
      preview(null)
    } catch {
      /* 同上：预览是可选能力 */
    }
  }

  /** 关节 ±：每次 1°，以最新帧为底只改这一轴。 */
  function stepJoint(index, direction) {
    if (disposed || !available || lock.isHeld() || send === null || latestQ === null) {
      // ± 按钮每次真下发 1°，被拒时**必须**有可见说法（P2）：否则连点几次都是"没反应"。
      if (!disposed) {
        error.textContent = rejectSubmitReason(
          latestQ === null ? S.controlsNoPoseData : S.controlsRejectedCommand,
        )
      }
      return
    }
    const row = jointRows[index]
    if (!row) return
    const q = latestQ.slice()
    q[index] += (direction * Math.PI) / 180
    error.textContent = ''
    runCommand({ mode: 'joint', q }, {
      onFail: () => markInvalid(row.slider),
    })
  }

  /** 提交被拒时的统一说法（P2）：闸门被占 = 已有一条命令在飞，其余按"本帧为什么不可用"给原因。 */
  function rejectSubmitReason(fallback) {
    if (lock.isHeld()) return S.controlsBusyRetry
    return lastReason !== null && lastReason !== '' ? lastReason : fallback
  }

  /**
   * 位姿输入提交（回车/失焦）：以最新帧 TCP 为底，只改被编辑的分量。
   *
   * X/Y/Z 按 mm 收、除以 1000；RX/RY/RZ 按 rad 收。同一字符串值不重复下发
   * （回车与 change 一次编辑只发一条）。
   *
   * @returns {boolean} 这次编辑是否已被"消费"（已下发 / 去重 / 已给出可见错误）。
   *   回车处理用它决定要不要吞掉紧随其后的 `change`。
   */
  function commitPose(axis) {
    const entry = poseInputs[axis]
    if (!entry) return false
    entry.editing = false
    const input = entry.input
    /*
     * 不可用 / 在途：**拒绝但必须说出来**。
     *
     * 不可用时直接 return —— 用户敲完回车（或失焦）什么都没发生：数值留在框里、机械臂不动、
     * 界面上也没有一个字。现在把拒绝原因写进错误行（输入框的值**不做**回滚，用户回车重试即可）。
     */
    if (disposed || !available || lock.isHeld() || send === null) {
      if (!disposed) {
        error.textContent = rejectSubmitReason(S.controlsRejectedCommand)
        markInvalid(input)
        // 拒绝之后**保留用户输入**：`sync` 的回填只跳过 `editing === true` 的输入框，所以这里
        // 必须把编辑态重新立起来，否则下一帧（最多 ~16 ms）就把刚敲的值换成最新帧值 ——
        // 用户只会看到"我按了回车，数字自己变回去了"，连重试的机会都没有。
        entry.editing = true
      }
      return true
    }

    const text = String(input.value ?? '').trim()
    // 严格十进制：`Number()` 会把 `0x10` 读成 16、`1e3` 读成 1000 并**静默**下发，
    // 操作员看到框里写的是 `1e3`、机械臂却跑到 1000 mm。这里只接受人真的会写的十进制数。
    const raw = parsePoseInput(text)
    if (raw === null) {
      rollbackPose(axis)
      markInvalid(input)
      error.textContent = S.controlsInvalidRollback
      return true
    }
    if (entry.lastSent === input.value) return true
    if (latestTcp === null) {
      error.textContent = S.controlsNoPoseData
      return true
    }

    const pose = latestTcp.slice()
    pose[entry.index] = isTranslationAxis(axis) ? raw / 1000 : raw
    error.textContent = ''
    const sent = runCommand({ mode: 'pose', pose }, {
      onFail: () => {
        rollbackPose(axis)
        markInvalid(input)
      },
      onOk: () => {
        entry.lastSent = input.value
        clearInvalidEl(input)
      },
    })
    // 极小概率的竞态：检查通过之后、下发之前另一个控件的命令进了在途。这条同样要可见。
    if (!sent) error.textContent = rejectSubmitReason(S.controlsRejectedCommand)
    return true
  }

  /**
   * 发一条命令（严格串行，闸门与点动共用）。
   *
   * `send` 返回 Promise 时等它落定；返回其它值时视为同步完成。`ok === false` 也算失败
   * （面板的 `sendJog` 会抛，但单测/自定义出口可能直接回一个失败信封）。
   *
   * @returns {boolean} 是否真的发出去
   */
  function runCommand(payload, handlers = {}) {
    if (disposed || !payload || send === null || !available) return false
    if (!lock.tryAcquire('rail')) return false
    const settle = (err) => {
      lock.release('rail')
      finish(err, handlers)
    }
    let result
    try {
      result = send(payload)
    } catch (e) {
      settle(e)
      return false
    }
    if (result !== null && typeof result?.then === 'function') {
      result.then(
        (value) => settle(rejectedError(value)),
        (e) => settle(e),
      )
    } else {
      settle(rejectedError(result))
    }
    renderAvailability()
    return true
  }

  /** 解析 `{ok:false}` 失败信封；成功/非信封值返回 null。 */
  function rejectedError(value) {
    if (value === null || typeof value !== 'object' || value.ok !== false) return null
    const reason = value.error === undefined || value.error === null ? '' : String(value.error)
    return new Error(reason === '' ? S.controlsRejectedCommand : reason)
  }

  /** 一条命令落定：解禁；失败时回滚 + 标红（**不**抛到事件回调外）。 */
  function finish(err, handlers) {
    if (disposed) return
    if (err) {
      error.textContent = S.controlsCommandFailed(err instanceof Error ? err.message : String(err))
      handlers?.onFail?.()
      invalidTs = latestTs
    } else {
      handlers?.onOk?.()
    }
    handlers?.onSettled?.()
    renderAvailability()
  }

  /** 失败回滚：输入框回到最新帧值（下一帧也会再回填一次，双保险）。 */
  function rollbackPose(axis) {
    const entry = poseInputs[axis]
    if (!entry) return
    entry.lastSent = null
    if (latestTcp !== null) {
      entry.input.value = formatPoseValue(axis, latestTcp[entry.index])
    }
  }

  /** 失败回滚：滑块与数值列回到最新帧的关节角。 */
  function rollbackJoint(index) {
    const row = jointRows[index]
    if (!row || latestQ === null) return
    const deg = (latestQ[index] * 180) / Math.PI
    row.slider.value = String(clampJointDeg(Math.round(deg)))
    row.value.textContent = S.controlsJointValue(deg)
  }

  /**
   * 标红一个控件。
   *
   * `invalidTs` 记下**当前帧**：`sync` 只在收到另一帧（`ts` 变化）时清除，避免标红在
   * 下一帧（同一个采样）就被抹掉，用户根本看不到。
   */
  function markInvalid(el) {
    if (!el) return
    el.setAttribute('data-ursim-invalid', 'true')
    el.setAttribute('aria-invalid', 'true')
    invalidEls.add(el)
    invalidTs = latestTs
  }

  /** 清掉单个控件的红标（用户重新编辑 / 该条命令成功）。 */
  function clearInvalidEl(el) {
    if (!el || !invalidEls.has(el)) return
    el.removeAttribute('data-ursim-invalid')
    el.removeAttribute('aria-invalid')
    invalidEls.delete(el)
  }

  /** 清掉全部红标（新帧到达）。 */
  function clearInvalid() {
    for (const el of [...invalidEls]) clearInvalidEl(el)
    invalidTs = null
  }

  /**
   * 只有"可用性/在途"变化时才写 DOM —— 每帧重写 disabled 是浪费。
   *
   * 整条轨只有一个 `data-ursim-ctl-state`（写在 body 上）：闸门被任一方持有时都是 `busy`，
   * 这样点动命令在飞时位姿输入也一起置灰 —— 视觉上不再出现"半边像是能用"的错觉。
   */
  function renderAvailability() {
    const busy = lock.isHeld()
    const key = `${available ? '1' : '0'}${busy ? '1' : '0'}`
    if (key === lastStateKey) return
    lastStateKey = key
    const disabled = !available || busy
    for (const axis of POSE_AXES) poseInputs[axis].input.disabled = disabled
    for (const row of jointRows) {
      row.slider.disabled = disabled
      row.inc.disabled = disabled
      row.dec.disabled = disabled
    }
    host.setAttribute(
      'data-ursim-ctl-state',
      !available ? 'disabled' : (busy ? 'busy' : 'ready'),
    )
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
   * 每帧喂最新快照：更新可用性/原因行、回填数值（**跳过正在拖动的滑块**），
   * 并在新帧到达后清掉失败红标。绝不发命令。
   */
  function sync(snapshot) {
    if (disposed) return
    jog.sync(snapshot)
    const reason = unavailableReason(snapshot)
    const nextAvailable = reason === ''
    if (nextAvailable !== available) {
      available = nextAvailable
      if (!available) {
        dragging.clear()
        clearPreview()
      }
      renderAvailability()
    }
    if (reason !== lastReason) {
      lastReason = reason
      note.textContent = reason
    }

    if (isVec6(snapshot?.q)) latestQ = snapshot.q.slice()
    if (isVec6(snapshot?.tcp)) {
      latestTcp = snapshot.tcp.slice()
      // 只读摘要跟着最新帧走：3 位小数足够看清"在哪"，也不至于每帧抖动位数。
      summary.textContent = S.controlsSummary(
        formatMeters(latestTcp[0]),
        formatMeters(latestTcp[1]),
        formatMeters(latestTcp[2]),
      )
    }
    const ts = Number.isFinite(snapshot?.ts) ? snapshot.ts : null
    if (ts !== null) latestTs = ts
    // 失败后的**下一帧**才清红标：同一个采样重复喂进来的那几帧不算。
    // 快照没有 ts 时无法区分"新帧"，下一次 sync 就清（总比永远红着好）。
    if (invalidEls.size > 0 && (invalidTs === null || (ts !== null && ts !== invalidTs))) {
      clearInvalid()
    }

    if (latestTcp !== null) {
      for (const axis of POSE_AXES) {
        const entry = poseInputs[axis]
        if (entry.editing) continue
        entry.input.value = formatPoseValue(axis, latestTcp[entry.index])
      }
    }
    if (latestQ !== null) {
      for (let index = 0; index < 6; index += 1) {
        if (dragging.has(index)) continue
        const row = jointRows[index]
        const deg = (latestQ[index] * 180) / Math.PI
        row.slider.value = String(clampJointDeg(Math.round(deg)))
        row.value.textContent = S.controlsJointValue(deg)
      }
    }
  }

  /** 卸载：结束预览 + 摘监听（幂等）。 */
  function dispose() {
    if (disposed) return
    disposed = true
    offLock()
    jog.dispose()
    clearPreview()
    dragging.clear()
    invalidEls.clear()
    lock.release('rail')
    for (const off of bindings) {
      try {
        off()
      } catch {
        /* 元素可能已被宿主移除：解绑失败不影响卸载 */
      }
    }
    bindings.length = 0
  }

  // 闸门持有者变化 = 位姿输入/关节控件与 body 状态要重画（点动盘抢到了锁）。
  const offLock = lock.subscribe(() => renderAvailability())

  // 初始一律禁用：第一帧快照到达前不可能知道连没连上/是不是仿真。
  renderAvailability()

  return { body: host, deps: merged, sync, dispose }
}
