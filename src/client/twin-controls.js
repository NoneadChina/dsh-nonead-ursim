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
  // 供后续任务的控件读取：命令出口与最新快照。本任务**只用不填**。
  body.__deps = deps ?? {}
  return body
}

/**
 * 左轨内容（点动 + 速度倍率）—— **本任务只放空 body**。
 *
 * 后续任务在这里填：回零 / XY 方向盘 / Z± / 步长 / TCP 方向 / 速度倍率滑块。
 * 命令通过 `deps.send(body)` 交出去（body 即 `/twin/jog` 的路由 body），
 * 状态通过返回的 `sync(snapshot)` 喂进来。
 *
 * @param {Document} doc
 * @param {HTMLElement} body 侧轨的 body 容器
 * @param {{send?: Function, getSnapshot?: Function}} [deps]
 * @returns {{sync: (snapshot?: object) => void, body: HTMLElement|null, deps: object}}
 */
export function mountLeftRail(doc, body, deps = {}) {
  const host = body ?? makeBody(doc, 'left', deps)
  if (host) {
    host.setAttribute('data-ursim-twin-rail-body', 'left')
    host.__deps = { ...(host.__deps ?? {}), ...deps }
  }
  return {
    body: host,
    deps,
    /** 骨架阶段是空操作；后续任务在此做"按最新快照回显/禁用"。 */
    sync() {},
  }
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
