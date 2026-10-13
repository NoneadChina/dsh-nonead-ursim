/**
 * src/client/theme.js — 面板跟随 DSH 桌面端选择的配色主题（浅色 / 深色 / 跟随系统）。
 *
 * ## 真源（已用 DSH 源码核实，不是猜的）
 * `@deepseek-ai/dsh-client-ui-theme` 把 `light`/`dark`/`system` 解析成一份 `ThemeSnapshot`，
 * `@deepseek-ai/dsh-client-ui-layout` 的呈现器再把它投影到 document：
 *   - `html { color-scheme }` —— 驱动原生控件（`<select>` 下拉等）；
 *   - **`body[data-ds-dark-theme]` 布尔属性** —— 深色时存在、浅色时移除
 *     （`toggleAttribute('data-ds-dark-theme', dark)`）；
 *   - body 上的 `--dsw-alias-*` 别名 token（第三方主题可通过 `ctx.theme` 覆盖它们）。
 * 页面里还有一段 body 引导脚本，在任何应用脚本之前就把该属性设好，所以首帧就是对的。
 *
 * ## 为什么 CSS 之外还需要这个模块
 * 面板的 DOM 配色完全可以交给 CSS（见 `styles.js` 的 token 层，`--dsw-*` 会自己翻转）。
 * 但 **WebGL 侧的基座网格线颜色读不到 CSS** —— 它烘在 `GridHelper` 的顶点色里，
 * 只能由 JS 判定当前主题后重刷（`scene.js` 的 `paintBaseGrid` / `applyTheme`）。
 * 这个模块就是那份判定的**唯一真源**，避免"CSS 说浅色、网格还是深色"。
 *
 * ## 判定顺序（为什么不是简单的 matchMedia）
 * 1. `body[data-ds-dark-theme]` 存在 ⇒ 深色。这是宿主的权威信号，`system` 偏好也已被它解析过。
 * 2. 该属性不存在、但 document 上有宿主的 token 层（`--dsw-alias-bg-base` 能算出值）⇒
 *    **浅色**。⚠️ 不能在这里退回 `matchMedia`：浅色主题 + 深色系统正是最常见的组合，
 *    退回系统偏好会得到一个与外壳相反的主题。属性"不存在"在有宿主时就是"浅色"。
 * 3. 两者都没有（独立预览页、单测的假 DOM）⇒ 退回 `prefers-color-scheme`，再没有就浅色。
 */

/** 宿主主题的布尔信号（与 `dsh-client-ui-theme` / `ui-layout` 保持一致）。 */
export const DARK_THEME_ATTRIBUTE = 'data-ds-dark-theme'

/** 用来判断"宿主主题层已挂载"的探针 token（设计系统定义在 `body` 上）。 */
export const HOST_TOKEN_PROBE = '--dsw-alias-bg-base'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

/** 系统偏好；环境没有 `matchMedia` 时按浅色处理。 */
function prefersDark(win) {
  try {
    return win?.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true
  } catch {
    return false
  }
}

/**
 * 宿主的设计 token 层是否已经挂到 document 上。
 *
 * 只读一次计算样式的自定义属性；取不到（无 `getComputedStyle`、假 DOM）即为否。
 */
function hasHostTokens(doc, win) {
  if (typeof win?.getComputedStyle !== 'function') return false
  for (const el of [doc?.body, doc?.documentElement]) {
    if (!el) continue
    try {
      const value = win.getComputedStyle(el)?.getPropertyValue?.(HOST_TOKEN_PROBE)
      if (typeof value === 'string' && value.trim() !== '') return true
    } catch {
      /* 取不到就试下一个宿主元素 */
    }
  }
  return false
}

/**
 * 当前主题。
 *
 * @param {{document?: Document, window?: object}} [options] 注入点（单测用；缺省取全局）
 * @returns {'light'|'dark'}
 */
export function resolveTheme(options = {}) {
  const doc = options.document ?? globalThis.document
  const win = options.window ?? globalThis
  if (doc?.body?.hasAttribute?.(DARK_THEME_ATTRIBUTE)) return THEME_DARK
  if (hasHostTokens(doc, win)) return THEME_LIGHT
  return prefersDark(win) ? THEME_DARK : THEME_LIGHT
}

/**
 * 订阅主题变化。
 *
 * 两个来源都要听：
 *   - `body[data-ds-dark-theme]` 的属性变化（主机侧切主题、跟随系统时系统切换）；
 *   - `prefers-color-scheme` 的媒体查询（只在没有宿主主题层时会生效，见 `resolveTheme`）。
 *
 * @param {(theme: 'light'|'dark') => void} onChange 主题变化回调（同步调用；异常被吞掉）
 * @param {{document?: Document, window?: object}} [options]
 * @returns {() => void} 取消订阅（幂等；环境不支持任何监听时返回空函数）
 */
export function watchTheme(onChange, options = {}) {
  const doc = options.document ?? globalThis.document
  const win = options.window ?? globalThis
  const disposers = []
  const notify = () => {
    let theme
    try {
      theme = resolveTheme({ document: doc, window: win })
    } catch {
      return
    }
    try {
      onChange?.(theme)
    } catch {
      /* 订阅者自身的问题不得影响其它监听 */
    }
  }

  const body = doc?.body
  const Observer = win?.MutationObserver ?? globalThis.MutationObserver
  if (body && typeof Observer === 'function') {
    const observer = new Observer(notify)
    observer.observe(body, { attributes: true, attributeFilter: [DARK_THEME_ATTRIBUTE] })
    disposers.push(() => observer.disconnect?.())
  }

  let query = null
  try {
    query = win?.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  } catch {
    query = null
  }
  if (query && typeof query.addEventListener === 'function') {
    query.addEventListener('change', notify)
    disposers.push(() => query.removeEventListener?.('change', notify))
  }

  return () => {
    while (disposers.length > 0) {
      const off = disposers.pop()
      try {
        off()
      } catch {
        /* 取消失败不应抛出 */
      }
    }
  }
}
