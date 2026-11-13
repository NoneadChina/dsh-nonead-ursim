/**
 * src/client/sidebar-native.js — 用宿主**官方席位**把数字孪生挂进右侧栏。
 *
 * ## 为什么不再靠 DOM 注入
 * 早期版本的注释写着「DSH 的右 dock 没有向外部插件开放注册插槽」，于是入口卡片是靠
 * `right-dock-entry.js` 克隆原生卡片节点插进 `[data-sidebar-right-guide]` 的。那条路在
 * 0.2.2-rc.2 上**结构性失效**：
 *
 * - `@deepseek-ai/dsh-client-ui-sidebar-right` 从 0.2.1 起就公开了两阶段注册
 *   （`ctx.sidebarRightTabs.register(...)` 声明类型 + `ctx.slots.register({ name: 'sidebar.right.pane.tab', key })`
 *   提供正文），引导页的入口框是**注册表**的投影 —— `tab-registry.ts` 的 `refresh()` 把
 *   `guide` 摊平成 `guideEntries` 再 `notifySubscribers`；
 * - 而 `dsh-better-sidebar`（本机 profile 装的是 0.32.1）默认**接管**引导页
 *   （`ctx.slots.inject('sidebar.right.tab.guide', ...)`，偏好项 `guideTakeover`），它的卡片
 *   同样只来自 `registry.guide()`。克隆出来的 DOM 不在 React 树里，下一次重渲染就被抹掉。
 *
 * 所以"看不到插件卡片"的根因不是样式或锚点，而是**我们从未在注册表里登记过**。本模块改成
 * 走同一条公开路径：登记类型（含 `guide` 入口）→ 登记正文 → 由宿主自己渲染卡片与页。
 *
 * ## 这个模块刻意保持"薄"
 * - 只用 `react` 的 `createElement` / `useRef` 两个 API，不引 JSX、不引其它运行时；
 * - `react` 由调用方注入（`index.js` 用 `require('react')` 取宿主的实例），测试里换成假实现；
 * - 面板挂载经 `mountPanel` 注入，测试可替换，不拉 3D 运行时。
 *
 * ## 失败必须安静地退回旧路径
 * 老宿主（0.2.0 / 0.2.1-alpha）没有 `sidebarRightTabs` 服务，cordis 也可能没有
 * `ctx.inject`。这些情况一律返回 `undefined`，由调用方继续用 `mountRightDockEntry`；
 * 若 `ctx.inject` 的回调**最终**解析出"服务不存在"，也会调 `onUnavailable` 让调用方补上
 * DOM 入口 —— 那条路不能靠猜，必须由真实解析结果驱动。
 */

import { activeStrings } from './strings.js'
import { createTabIcon } from './tab-icon.js'

/** 注册表里的**类型 id**：宿主建议用包名，它同时是两个 keyed 席位的 key。 */
export const TAB_ID = 'dsh-nonead-ursim'

/** 打开时用的类型判别符（引导页卡片的 `data-sidebar-right-guide-entry` 就是它）。 */
export const TAB_KIND = 'ursim-twin'

/** 引导页里的排序位（越大越靠后）；原生三张卡是 10/20/30 量级。 */
export const TAB_ORDER = 60

/** 正文根节点的标记，供端到端验收与 GUI 侧排查用。 */
export const TAB_ATTR = 'data-dsh-ursim-twin-tab'

/**
 * 正文根节点样式：撑满 pane、纵向 flex、裁掉溢出。
 *
 * 颜色走宿主的语义变量（`--dsw-alias-bg-base`），拿不到时退回本仓库面板用的深色底
 * —— 与 `right-dock-entry.js` 的 `OVERLAY_STYLE` 同源，视觉上无跳变。
 */
const PANE_STYLE = {
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  width: '100%',
  height: '100%',
  minWidth: '0',
  minHeight: '0',
  overflow: 'hidden',
  background: 'var(--dsw-alias-bg-base, #0d1117)',
}

const message = (error) => (error instanceof Error ? error.message : String(error))

/** 卡片标题：每次取值都按当前宿主语言解析（切语言不需要重新注册）。 */
const titleOf = () => activeStrings().dockLabel

/** 卡片描述：同上。 */
const descriptionOf = () => activeStrings().dockDescription

/**
 * 取宿主提供的 React 实例。
 *
 * bundle 是 `format:'cjs'` 的工厂（`factory: (require) => { ... }`），`require` 是工厂实参；
 * 构建时 `--external:react` 保证这次调用**不被内联**，运行期解析到 shell 已经装载的那一份。
 * 宿主没提供 `require`（Node 测试、非 shell 环境）或没有 `react` 时返回 `undefined`。
 *
 * @returns {object|undefined}
 */
export function hostReact() {
  try {
    if (typeof require !== 'function') return undefined
    const loaded = require('react')
    return loaded && typeof loaded.createElement === 'function' ? loaded : undefined
  } catch {
    return undefined
  }
}

/**
 * 造一个 pane 正文组件。
 *
 * 用 `useRef` 把 ref 回调固定住：ref 若每次渲染都是新函数，React 会先以 `null` 调用旧的
 * （→ 释放 WebGL）再以节点调用新的（→ 重建 WebGL），切一次语言就闪一次。回调只在
 * 「挂上 / 卸下」两个时刻真正做事。
 *
 * @param {object} react 宿主 React（或测试替身）
 * @param {object} deps `{ state, mountPanel, logger }`
 * @returns {(props?: object) => object} React 组件
 */
export function createTabComponent(react, deps) {
  const { state, mountPanel, logger } = deps
  return function UrsimTwinTabBody() {
    const holder = react.useRef(null)
    if (holder.current === null) {
      let panel
      holder.current = (node) => {
        if (!node) {
          try {
            panel?.dispose?.()
          } catch (error) {
            logger?.warn?.(`[ursim-twin] 右侧栏面板卸载失败：${message(error)}`)
          }
          panel = undefined
          return
        }
        try {
          panel = mountPanel(node, state)
        } catch (error) {
          panel = undefined
          logger?.warn?.(`[ursim-twin] 右侧栏面板挂载失败：${message(error)}`)
        }
      }
    }
    return react.createElement('div', { [TAB_ATTR]: 'true', style: PANE_STYLE, ref: holder.current })
  }
}

/** 从 cordis 的注入上下文里取服务：`get()` 是可选查询，不注入也不会抛。 */
function serviceOf(injected, name) {
  if (!injected) return undefined
  try {
    const found = typeof injected.get === 'function' ? injected.get(name) : injected[name]
    return found === undefined ? undefined : found
  } catch {
    return undefined
  }
}

/**
 * 把「数字孪生」登记成右侧栏的一个 tab 类型。
 *
 * @param {object} deps
 * @param {object} deps.ctx cordis 上下文（需要 `inject`）
 * @param {object} deps.state 孪生状态（唯一的轮询链，由 `index.js` 建）
 * @param {(container: object, state: object) => ({ dispose?: () => void }|undefined)} [deps.mountPanel] 面板挂载器
 * @param {object} [deps.logger] 宿主 logger（`info` / `warn`）
 * @param {object} [deps.react] 宿主 React；缺省走 `hostReact()`
 * @param {() => void} [deps.onUnavailable] 服务真的不存在时的回调（调用方据此补 DOM 入口）
 * @returns {{ id: string, kind: string, dispose: () => void }|undefined} 登记句柄；宿主不支持时 undefined
 */
export function registerSidebarTab(deps = {}) {
  const { ctx, state, logger, onUnavailable } = deps
  const react = deps.react ?? hostReact()
  const mountPanel = deps.mountPanel

  if (!ctx || typeof ctx.inject !== 'function') return undefined
  if (!react || typeof react.createElement !== 'function' || typeof react.useRef !== 'function') {
    return undefined
  }
  // 挂载器由调用方注入（`index.js` 传 `mountTwinPanel`）：本模块**不**静态依赖 3D 运行时，
  // 否则任何只想知道"登记了什么"的测试/工具都得把整棵 three 树拉进来。
  if (typeof mountPanel !== 'function') {
    logger?.warn?.('[ursim-twin] 缺少 mountPanel，无法提供右侧栏正文')
    return undefined
  }
  if (!state) return undefined

  const component = createTabComponent(react, { state, mountPanel, logger })
  // 引导卡片的图标：宿主 `EntryBox` 用 `entry.icon ?? CubeGlyph` 渲染，尺寸 22（无描述）
  // 或 26（有描述）由宿主决定，这里只把 `size` 当入参用。
  const TabIcon = createTabIcon(react)

  /** 注入席位解析后得到的释放器（槽位登记是异步生效的）。 */
  let stopSeat
  let disposed = false
  /** 注入回调是否**已**跑过（cordis 在服务已就绪时同步回调）。 */
  let seatDone = false
  /** 注入回调是否真的把类型登记上了；`false` 表示宿主缺服务。 */
  let seatUsable = false

  const seat = ctx.inject(['sidebarRightTabs', 'slots'], (injected) => {
    if (disposed) return undefined
    const tabs = serviceOf(injected, 'sidebarRightTabs')
    const slots = serviceOf(injected, 'slots')
    if (!tabs || typeof tabs.register !== 'function') {
      // 解析到了注入上下文却没有服务：这是"宿主不支持"，不是"还没加载" —— 让调用方补 DOM 入口。
      seatDone = true
      seatUsable = false
      logger?.warn?.('[ursim-twin] 宿主没有 sidebarRightTabs 服务，退回 DOM 入口')
      onUnavailable?.()
      return undefined
    }
    if (!slots || typeof slots.inject !== 'function') {
      seatDone = true
      seatUsable = false
      logger?.warn?.('[ursim-twin] 宿主没有 slots 服务，退回 DOM 入口')
      onUnavailable?.()
      return undefined
    }

    const disposers = []
    /** 正文槽位的登记撤销器（独立一笔：槽位可能**晚于**装配才登记）。 */
    const slotDisposers = []
    const releaseOne = (dispose, what) => {
      try {
        dispose?.()
      } catch (error) {
        logger?.warn?.(`[ursim-twin] 右侧栏${what}释放失败：${message(error)}`)
      }
    }
    const disposeAll = () => {
      // 反序释放：先撤正文槽位，再撤类型（类型的撤除会让宿主立刻丢弃该 kind 的页）。
      for (const dispose of slotDisposers.splice(0).reverse()) releaseOne(dispose, '正文')
      for (const dispose of disposers.splice(0).reverse()) releaseOne(dispose, '登记')
    }

    try {
      disposers.push(
        tabs.register({
          id: TAB_ID,
          kind: TAB_KIND,
          // 同 kind 的 builtin 与 extension 可并存，extension 生效；本类型没有 builtin。
          priority: 'extension',
          // 切走再切回来不重建 WebGL 上下文；页关闭时才 dispose。
          keepMounted: true,
          // 同一时刻只允许一个孪生页：再次打开聚焦既有页，而不是并列两个 3D 视图。
          multiple: false,
          title: titleOf,
          guide: [
            {
              id: `${TAB_ID}:twin`,
              order: TAB_ORDER,
              title: titleOf,
              description: descriptionOf,
              // 实臂 + 虚线孪生臂（见 tab-icon.js）：不传时宿主会退回通用立方体图标。
              icon: TabIcon,
            },
          ],
        }),
      )
    } catch (error) {
      // 类型登记失败（同 id 重复）时什么都不该留下。
      logger?.warn?.(`[ursim-twin] 右侧栏类型登记失败：${message(error)}`)
      return undefined
    }

    try {
      // `slots.inject(key, cb)` 等该槽位被宿主**声明**之后才回调登记 —— pane 的槽位是在
      // 「第一次真的要渲染这个 kind」时才声明的，提前 `register` 会因"槽位未声明"抛错。
      // 槽位登记器自己那一笔要**单独**记账：它可能在装配之后很久才产生，而 `disposers`
      // 在那之前就可能已经被释放过一轮了。
      disposers.push(
        slots.inject('sidebar.right.pane.tab', () => {
          if (disposed) return undefined
          const undo = slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID }, component)
          slotDisposers.push(undo)
          // **不**把撤销器当回调返回值再交回去：宿主会把回调的返回值当成自己那一层
          // 的释放器，于是同一个槽位会被撤两次（幂等还好，不幂等就会抛"已释放"）。
          // 这里只留一条账，统一由 `disposeAll` 按反序撤。
          return undefined
        }),
      )
    } catch (error) {
      logger?.warn?.(`[ursim-twin] 右侧栏正文登记失败：${message(error)}`)
    }

    seatDone = true
    seatUsable = true
    stopSeat = disposeAll
    return disposeAll
  })

  // cordis 在服务已就绪时**同步**回调；那一轮里如果判定"宿主不支持"，就当作没登记成功，
  // 让调用方立刻走 DOM 入口（晚到的异步解析由 `onUnavailable` 另行通知）。
  if (seatDone && !seatUsable) return undefined

  return {
    id: TAB_ID,
    kind: TAB_KIND,
    dispose() {
      if (disposed) return
      disposed = true
      try {
        stopSeat?.()
      } catch {
        /* 已释放 */
      }
      try {
        seat?.()
      } catch {
        /* 已释放 */
      }
      stopSeat = undefined
    },
  }
}
