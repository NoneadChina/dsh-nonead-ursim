// test/sidebar-native.test.mjs
//
// 回归测试：客户端半必须走宿主**官方席位**把「NoneadURSim」登记进右侧栏，而不是继续靠
// `right-dock-entry.js` 克隆 DOM 卡片。
//
// 背景（真实故障）：用户报"看不到插件卡片"。根因不是样式或锚点，而是我们从未登记过
// `sidebarRightTabs` —— 引导页的入口框是注册表 `guide()` 的投影（`tab-registry.ts` 的
// `refresh()`），而 profile 里装的 `dsh-better-sidebar` 默认接管引导页、卡片同样只来自注册表。
// DOM 克隆节点不在 React 树里，下一次重渲染就被抹掉，所以旧路径在 0.2.2-rc.2 上结构性失效。
//
// 这些用例锁住四件事：
//   1. 登记的类型形状（id / kind / priority / keepMounted / guide 入口）；
//   2. 正文走 `sidebar.right.pane.tab` 的 keyed 登记，且 key 与类型 id 一致；
//   3. 释放顺序（先撤槽位再撤类型，最后撤注入席位）；
//   4. 宿主不支持时不抛错、返回 undefined，并回调 `onUnavailable` 让调用方补 DOM 入口。
//
// 运行：node --test test/sidebar-native.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  TAB_ATTR,
  TAB_ID,
  TAB_KIND,
  TAB_ORDER,
  createTabComponent,
  hostReact,
  registerSidebarTab,
} from '../src/client/sidebar-native.js'
import {
  ARM_SEGMENTS,
  ICON_VIEW_BOX,
  WRIST_RADIUS,
  createTabIcon,
} from '../src/client/tab-icon.js'

/** 静默 logger：断言只看被登记的东西，不看日志。 */
const quiet = { info() {}, warn() {} }

/**
 * 假 React：只实现本模块用到的两个 API。
 *
 * `useRef` 必须在多次渲染之间返回**同一个** ref 对象（真实 React 的 hooks 语义），
 * 否则"ref 回调稳定"这条断言会被假实现自己破坏。
 */
function createFakeReact() {
  const refs = []
  let cursor = 0
  return {
    useRef(initial) {
      if (refs[cursor] === undefined) refs[cursor] = { current: initial }
      return refs[cursor++]
    },
    createElement(type, props, ...children) {
      // 与 React 一致：children 归到 props.children 上（图标用第三实参传形状列表）。
      const element = {
        type,
        props: children.length === 0
          ? props
          : { ...props, children: children.length === 1 ? children[0] : children },
      }
      cursor = 0
      return element
    },
  }
}

/** 造一套"宿主服务都在"的假 cordis 上下文，并记录调用顺序。 */
function createFakeHost({ tabs = true, slots = true, calls = [] } = {}) {
  const service = {
    tabs: {
      register(definition) {
        calls.push({ op: 'tabs.register', definition })
        return () => calls.push({ op: 'tabs.dispose' })
      },
    },
    slots: {
      inject(name, callback) {
        calls.push({ op: 'slots.inject', name })
        callback()
        return () => calls.push({ op: 'slots.inject.dispose', name })
      },
      register(options, component) {
        calls.push({ op: 'slots.register', options, component })
        return () => calls.push({ op: 'slots.register.dispose', key: options.key })
      },
    },
  }

  const ctx = {
    inject(names, callback) {
      calls.push({ op: 'ctx.inject', names: [...names] })
      const injected = {
        get(name) {
          if (name === 'sidebarRightTabs') return tabs ? service.tabs : undefined
          if (name === 'slots') return slots ? service.slots : undefined
          return undefined
        },
      }
      const undo = callback(injected)
      return () => {
        calls.push({ op: 'ctx.inject.dispose' })
        undo?.()
      }
    },
  }

  return { ctx, calls, service }
}

test('hostReact() 在没有工厂 require 的环境里返回 undefined', () => {
  // node --test 以 ESM 跑，`require` 不存在 —— 这条同时证明"取不到 React"不会抛。
  assert.equal(hostReact(), undefined)
})

test('正文组件：挂载一次、ref 稳定、卸载时释放面板', () => {
  const react = createFakeReact()
  const mounted = []
  const disposed = []
  const state = { id: 'state' }
  const Body = createTabComponent(react, {
    state,
    logger: quiet,
    mountPanel: (container, twinState) => {
      mounted.push([container, twinState])
      return { dispose: () => disposed.push(container) }
    },
  })

  const first = Body()
  assert.equal(first.type, 'div', '正文根节点必须是 div')
  assert.equal(first.props[TAB_ATTR], 'true', '正文根节点必须带可排查的标记属性')
  assert.equal(first.props.style.display, 'flex')
  assert.equal(first.props.style.overflow, 'hidden', '面板自己滚，外层不许溢出')
  assert.equal(typeof first.props.ref, 'function')

  const node = { id: 'pane-node' }
  first.props.ref(node)
  assert.deepEqual(mounted, [[node, state]], 'ref 回调应把容器与 state 交给挂载器')

  // 第二次渲染：ref 身份必须不变，否则 React 会先 null 再 node（WebGL 被重建）。
  const second = Body()
  assert.equal(second.props.ref, first.props.ref, 'ref 回调必须跨渲染稳定（useRef 固定）')
  assert.equal(mounted.length, 1, '重渲染不得重复挂载面板')

  second.props.ref(null)
  assert.deepEqual(disposed, [node], '卸载必须释放面板（WebGL 上下文不能泄漏）')
})

test('登记：类型 + guide 入口 + 正文槽位，key 与类型 id 一致', () => {
  const { ctx, calls } = createFakeHost()
  const handle = registerSidebarTab({
    ctx,
    state: {},
    logger: quiet,
    react: createFakeReact(),
    mountPanel: () => ({ dispose() {} }),
  })

  assert.ok(handle, '宿主服务齐备时必须返回登记句柄')
  assert.equal(handle.id, TAB_ID)
  assert.equal(handle.kind, TAB_KIND)

  const injected = calls.find((call) => call.op === 'ctx.inject')
  assert.deepEqual(injected.names, ['sidebarRightTabs', 'slots'], '两个服务都要注入')

  const registered = calls.find((call) => call.op === 'tabs.register')
  assert.ok(registered, '必须登记 tab 类型')
  const definition = registered.definition
  assert.equal(definition.id, TAB_ID, 'id 建议用包名，且是两个 keyed 席位的 key')
  assert.equal(definition.kind, TAB_KIND)
  assert.equal(definition.priority, 'extension', '第三方插件不该用 builtin 档')
  assert.equal(definition.keepMounted, true, '切页不重建 WebGL')
  assert.equal(definition.multiple, false, '只允许一个孪生页')

  // 标题/描述是 thunk：切语言时宿主重读即可，不需要重新登记。
  assert.equal(typeof definition.title, 'function')
  // 标题是「按当前宿主语言解析」的 thunk：无 document / __DSH_LOCALE__ 时落到默认语言 zh
  assert.equal(definition.title('whatever'), '拓德UR仿真器')
  assert.equal(definition.guide.length, 1, '引导页必须有一个入口框')
  const entry = definition.guide[0]
  assert.equal(entry.id, `${TAB_ID}:twin`)
  assert.equal(entry.order, TAB_ORDER)
  assert.equal(typeof entry.title, 'function')
  assert.equal(typeof entry.description, 'function')
  assert.ok(entry.description().length > 0, '描述必须非空，否则卡片只剩标题')
  assert.equal(typeof entry.icon, 'function', '引导卡片要带自定义图标（否则宿主退回通用立方体）')
  const icon = entry.icon({ size: 22 })
  assert.equal(icon.type, 'svg', '图标必须是 svg 元素')
  assert.equal(icon.props.viewBox, ICON_VIEW_BOX, '与宿主产品图标同栅格')
  assert.equal(icon.props.width, 22, '尺寸由宿主传入（有描述时 26，无描述 22）')
  assert.equal(icon.props.fill, 'none', '纯描边图标，不填色')
  const drawn = icon.props.children
  const paths = drawn.filter((node) => node.type === 'path')
  const circles = drawn.filter((node) => node.type === 'circle')
  assert.equal(paths.length, ARM_SEGMENTS.length, '一条臂就是这四段折线')
  assert.equal(circles.length, 1, '末端腕关节是一个实心圆点')
  assert.equal(circles[0].props.r, WRIST_RADIUS)
  assert.equal(circles[0].props.fill, 'currentColor', '圆点也走 currentColor，不被主题漏掉')
  assert.equal(drawn.length, ARM_SEGMENTS.length + 1, '线段 + 关节圆点就是全部形状')
  assert.ok(
    paths.every((node) => node.props.stroke === 'currentColor'),
    '全部描边走 currentColor，图标跟随主题变色',
  )

  const slotInject = calls.find((call) => call.op === 'slots.inject')
  assert.ok(slotInject, '正文槽位要等宿主声明后再登记')
  assert.equal(slotInject.name, 'sidebar.right.pane.tab')

  const slotRegister = calls.find((call) => call.op === 'slots.register')
  assert.ok(slotRegister, '必须登记正文')
  assert.equal(slotRegister.options.name, 'sidebar.right.pane.tab')
  assert.equal(slotRegister.options.key, TAB_ID, 'keyed 席位的 key 必须等于类型 id')
  assert.equal(typeof slotRegister.component, 'function')
})

test('释放顺序：先槽位、再类型、最后注入席位', () => {
  const { ctx, calls } = createFakeHost()
  const handle = registerSidebarTab({
    ctx,
    state: {},
    logger: quiet,
    react: createFakeReact(),
    mountPanel: () => ({ dispose() {} }),
  })

  const before = calls.length
  handle.dispose()
  handle.dispose() // 幂等：二次释放不得再调任何东西

  const tail = calls.slice(before).map((call) => call.op)
  assert.deepEqual(
    tail,
    ['slots.register.dispose', 'slots.inject.dispose', 'tabs.dispose', 'ctx.inject.dispose'],
    '类型撤除会让宿主立刻丢弃该 kind 的页，因此必须最后撤；注入席位收尾',
  )
})

test('宿主没有 sidebarRightTabs：不登记、不抛错、回调 onUnavailable', () => {
  const { ctx, calls } = createFakeHost({ tabs: false })
  let unavailable = 0
  const handle = registerSidebarTab({
    ctx,
    state: {},
    logger: quiet,
    react: createFakeReact(),
    mountPanel: () => ({ dispose() {} }),
    onUnavailable: () => {
      unavailable += 1
    },
  })

  assert.equal(handle, undefined, '没有注册表就没有可登记的句柄')
  assert.equal(unavailable, 1, '必须让调用方知道要退回 DOM 入口')
  assert.equal(
    calls.some((call) => call.op === 'tabs.register'),
    false,
    '服务缺失时不得登记半套东西',
  )
})

test('宿主没有 slots：同样退回，且不留下孤立的类型登记', () => {
  const { ctx, calls } = createFakeHost({ slots: false })
  let unavailable = 0
  const handle = registerSidebarTab({
    ctx,
    state: {},
    logger: quiet,
    react: createFakeReact(),
    mountPanel: () => ({ dispose() {} }),
    onUnavailable: () => {
      unavailable += 1
    },
  })

  assert.equal(handle, undefined)
  assert.equal(unavailable, 1)
  assert.equal(calls.some((call) => call.op === 'tabs.register'), false)
})

test('入口前置条件不满足时安静返回 undefined（不抛错）', () => {
  const react = createFakeReact()

  // cordis 没有 inject（极老的宿主）
  assert.equal(registerSidebarTab({ ctx: {}, state: {}, react, mountPanel: () => ({}) }), undefined)
  // 没有 React（宿主没提供基线模块）
  assert.equal(registerSidebarTab({ ctx: createFakeHost().ctx, state: {}, mountPanel: () => ({}) }), undefined)
  // 没有 state（装配顺序错了）
  assert.equal(
    registerSidebarTab({ ctx: createFakeHost().ctx, react, mountPanel: () => ({}) }),
    undefined,
  )
  // 没有挂载器：登记出来也是空白页，不如让调用方走 DOM 入口
  assert.equal(registerSidebarTab({ ctx: createFakeHost().ctx, state: {}, react }), undefined)
})

test('卡片图标：默认 22、可换尺寸、透传 className，且没有 React 时明确报错', () => {
  const Icon = createTabIcon(createFakeReact())
  // 宿主 `EntryBox` 只在有描述时传 26；缺省值按无描述那档取 22。
  assert.equal(Icon().props.width, 22)
  assert.equal(Icon({ size: 26 }).props.width, 26)
  assert.equal(Icon({ size: 26 }).props.height, 26)
  assert.equal(Icon({ className: 'ursim-glyph' }).props.className, 'ursim-glyph')
  assert.equal(Icon().props['aria-hidden'], 'true', '纯装饰图标对读屏器隐藏')
  // 图标必须用宿主 React 造：没有它就没有可渲染的元素，宁可明确失败而不是画个假的。
  assert.throws(() => createTabIcon(undefined), TypeError)
})
