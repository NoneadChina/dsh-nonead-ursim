/**
 * `src/client/theme.js` 的单测 —— 面板跟随 DSH 桌面端主题的判定与订阅。
 *
 * 这个模块的输入全部来自 document（`body[data-ds-dark-theme]`、宿主注入的 `--dsw-*` token）
 * 与 window（`getComputedStyle` / `matchMedia` / `MutationObserver`），所以用**假 DOM** 就能
 * 把三条判定分支与订阅/退订全部钉住 —— 不需要真实浏览器。
 *
 * 为什么值得单独测：判错主题的表现是"外壳是浅色、面板还是深色"这种**静默不一致**，
 * 而最容易犯的错恰恰是"没有该属性就退回 prefers-color-scheme"（浅色主题 + 深色系统会判反）。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DARK_THEME_ATTRIBUTE,
  HOST_TOKEN_PROBE,
  resolveTheme,
  watchTheme,
} from '../src/client/theme.js'

/** 最小假 body：只支持 `hasAttribute`，外加一个测试用的开关。 */
function fakeBody(attributes = []) {
  const set = new Set(attributes)
  return {
    hasAttribute: (name) => set.has(name),
    __toggle(name, on) {
      if (on) set.add(name)
      else set.delete(name)
    },
  }
}

/**
 * 最小假 window。
 *
 * @param {{tokens?: string|undefined, mediaDark?: boolean, Observer?: Function}} [options]
 *   `tokens` 为 `undefined` 表示"宿主 token 层不存在"（`getComputedStyle` 都没有）。
 */
function fakeWindow({ tokens, mediaDark = false, Observer } = {}) {
  const mediaListeners = []
  return {
    MutationObserver: Observer,
    getComputedStyle: tokens === undefined
      ? undefined
      : () => ({ getPropertyValue: (name) => (name === HOST_TOKEN_PROBE ? tokens : '') }),
    matchMedia: () => ({
      matches: mediaDark,
      addEventListener: (type, listener) => mediaListeners.push(listener),
      removeEventListener: () => {},
    }),
    __mediaListeners: mediaListeners,
  }
}

/** 最小假 MutationObserver：记录 observe 的目标/过滤条件，并允许测试手动触发。 */
class FakeObserver {
  static instances = []

  constructor(callback) {
    this.callback = callback
    this.disconnected = false
    FakeObserver.instances.push(this)
  }

  observe(target, options) {
    this.target = target
    this.options = options
  }

  disconnect() {
    this.disconnected = true
  }

  trigger() {
    this.callback()
  }
}

test('resolveTheme：body 上有 data-ds-dark-theme 即为深色（宿主权威信号）', () => {
  const document = { body: fakeBody([DARK_THEME_ATTRIBUTE]), documentElement: {} }
  // 即便 token 层算不出值、系统偏好是浅色，也以该属性为准。
  assert.equal(resolveTheme({ document, window: fakeWindow({ mediaDark: false }) }), 'dark')
})

test('resolveTheme：有宿主 token 层但无该属性 ⇒ 浅色（不退回系统偏好）', () => {
  // 这是最容易判反的一种：浅色主题 + 深色系统。宿主的 token 有值就说明主题已挂载，
  // 此时"没有该属性"就是浅色，不能用 prefers-color-scheme 覆盖。
  const document = { body: fakeBody(), documentElement: {} }
  assert.equal(
    resolveTheme({ document, window: fakeWindow({ tokens: '#ffffff', mediaDark: true }) }),
    'light',
  )
})

test('resolveTheme：既无属性也无宿主 token 层 ⇒ 退回系统偏好；都没有则浅色', () => {
  const document = { body: fakeBody(), documentElement: {} }
  assert.equal(resolveTheme({ document, window: fakeWindow({ mediaDark: true }) }), 'dark')
  assert.equal(resolveTheme({ document, window: fakeWindow({ mediaDark: false }) }), 'light')
  // 没有 document（Node/SSR）也不能抛错，按浅色收尾。
  assert.equal(resolveTheme({ document: undefined, window: fakeWindow({ mediaDark: true }) }), 'dark')
  assert.equal(resolveTheme({ document: undefined, window: {} }), 'light')
})

test('watchTheme：属性翻转时回调新主题，退订后不再收到通知', () => {
  FakeObserver.instances = []
  const body = fakeBody()
  const win = fakeWindow({ tokens: '#ffffff', Observer: FakeObserver })
  const seen = []
  const stop = watchTheme((theme) => seen.push(theme), {
    document: { body, documentElement: {} },
    window: win,
  })

  const observer = FakeObserver.instances[0]
  assert.ok(observer, '有 MutationObserver 时必须观察 body 属性')
  assert.deepEqual(observer.options?.attributeFilter, [DARK_THEME_ATTRIBUTE], '只关心主题属性')
  assert.equal(seen.length, 0, '订阅本身不得立刻回调')

  body.__toggle(DARK_THEME_ATTRIBUTE, true)
  observer.trigger()
  assert.deepEqual(seen, ['dark'])

  body.__toggle(DARK_THEME_ATTRIBUTE, false)
  observer.trigger()
  assert.deepEqual(seen, ['dark', 'light'])

  stop()
  assert.equal(observer.disconnected, true, '退订必须断开观察者')
  body.__toggle(DARK_THEME_ATTRIBUTE, true)
  // 断开了就不再收到通知；即便有人手动触发，回调也不该再被调用到已退订的订阅者之外。
  assert.equal(seen.length, 2)
})

test('watchTheme：无 MutationObserver 时仍监听 prefers-color-scheme，且退订幂等', () => {
  const win = fakeWindow({ mediaDark: true })
  const seen = []
  const stop = watchTheme((theme) => seen.push(theme), {
    document: { body: fakeBody(), documentElement: {} },
    window: win,
  })
  assert.equal(win.__mediaListeners.length, 1, '媒体查询变化必须被监听')
  win.__mediaListeners[0]()
  assert.deepEqual(seen, ['dark'])
  assert.doesNotThrow(() => {
    stop()
    stop()
  }, '退订必须幂等（dispose 可能被调用两次）')
})

test('watchTheme：没有 DOM 时不抛错，返回一个可调用的退订函数', () => {
  const stop = watchTheme(() => {
    throw new Error('不该被调用')
  }, { document: undefined, window: {} })
  assert.equal(typeof stop, 'function')
  assert.doesNotThrow(() => stop())
})
