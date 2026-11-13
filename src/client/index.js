/**
 * src/client/index.js — 客户端半的装配入口。
 *
 * 装配顺序（**唯一** `state`，全客户端只此一条轮询链）：
 *   1. `createTwinState({ ip })` → `start()`（Task 6：轮询 host 只读状态路由 + 失败退避）
 *   2. **优先**走宿主官方席位（`./sidebar-native.js`）：`ctx.sidebarRightTabs.register(...)`
 *      登记 tab 类型并带一个 `guide` 入口，`ctx.slots` 登记正文，大视图在正文里挂载。
 *      引导页的卡片由注册表投影而来，因此宿主（含 `dsh-better-sidebar` 的接管版引导页）
 *      会自己把「NoneadURSim」画出来 —— 这是 0.2.1+ 的正确路径。
 *   3. 宿主没有 `sidebarRightTabs`（0.2.0 / 0.2.1-alpha 等老版本）时，退回
 *      `mountRightDockEntry(...)` 的 DOM 注入：把入口卡片克隆进右栏引导列，点击时在
 *      右栏覆盖层里 `mountTwinPanel`。这条路径只为兼容保留，不再新增逻辑。
 *
 * `apply(ctx, config)` 返回清理函数：dispose 所有挂载 + `state.stop()`（`ctx.effect` 语义）。
 * 调试标记 `globalThis.__URSIM_TWIN__` 在 Task 1 就已约定并保留（`loaded`/`at` 字段不许改），
 * 这里额外挂上 `ip` / `state` / 入口句柄，便于 GUI 侧排查。
 *
 * IP 来源（Ruling 35）：**默认不指定**，由 host 依据其连接注册表解析到"当前已连接的那一个机器人"
 * —— 浏览器半不该猜机器人地址（曾默认 `192.168.1.199`，与真实机器人 `192.168.2.201` 不符，
 * 会导致数字仿真永远显示"未连接"）。仅在需要覆盖时才提供：
 * `globalThis.__URSIM_TWIN_IP__`（调试/验收）→ `apply(ctx, config)` 的第二实参 `config.ip` / `config.robotIp`。
 *
 * 配置只能取自 `apply` 的第二实参：cordis 的上下文代理对未 `inject` 的属性读取会直接抛
 * `cannot get property "..." without inject`（读 `ctx.config` 即属此类）。`apply` 抛出的异常
 * 会让该 entry 的 fiber 落为 FAILED，渲染侧只会报「1 plugin(s) 未激活」而拿不到原因。
 */

import { createTwinState } from './state.js'
import { mountRightDockEntry } from './right-dock-entry.js'
import { mountTwinPanel } from './twin-panel.js'
import { registerSidebarTab } from './sidebar-native.js'

export const name = 'ur-digital-twin-client'

/** 保留的仿真地址（与 `lib/index.js` 的 `SIM_IP`、python 侧 `SIM_IP` 同一语义）。 */
export const SIM_IP = '127.0.0.1'

/**
 * 目标机器人地址：**恒为保留的仿真地址**。
 *
 * 本插件只操作离线仿真机器人、**不存在任何真机通道**，所以显式配置
 * （`__URSIM_TWIN_IP__` / `config.ip` / `config.robotIp`）不再能把客户端指向真机 ——
 * 两个参数保留只是为了不破坏签名与既有配置文件。宿主侧的仿真路由同样忽略 `?ip=`。
 *
 * @param {object} [_config] 插件配置（已不再影响目标地址）
 * @param {object} [_globalScope] 全局作用域（已不再影响目标地址）
 */
export function resolveRobotIp(_config, _globalScope = globalThis) {
  return SIM_IP
}

/**
 * 宿主是否提供了官方右侧栏注册表。
 *
 * `ctx.get(...)` 是 cordis 的**可选**服务查询（不注入也能调），因此这里可以同步判断；
 * 老宿主（没有该服务）返回 `false`，装配就退回 DOM 注入。`get` 缺失、或读取抛错
 * 一律按"没有"处理 —— 这条函数不允许成为装配失败点。
 *
 * @param {object} ctx cordis 上下文
 * @returns {boolean}
 */
export function hasNativeSidebar(ctx) {
  if (!ctx || typeof ctx.get !== 'function') return false
  try {
    return ctx.get('sidebarRightTabs') !== undefined
  } catch {
    return false
  }
}

/**
 * 挂载客户端半。
 *
 * @param {object} ctx cordis 上下文（只用到可选的 `logger`）
 * @param {object} [config] 插件配置（cordis 作为第二实参传入；`config.ip` / `config.robotIp` 可覆盖 IP）
 * @returns {() => void} 清理函数（`ctx.effect` 语义：dispose 所有挂载并停止轮询）
 */
export function apply(ctx, config) {
  const doc = globalThis.document
  const ip = resolveRobotIp(config)
  /*
   * SSE 实时流（清单第 20 条）：**默认启用**。
   *
   * host 侧的 `/twin/stream` 复用与轮询完全相同的读取逻辑，并自带 detail 慢节拍，
   * 所以切过来不会丢任何字段。`state.js` 保证两套数据源互斥 —— 开了流就不轮询。
   */
  const state = createTwinState({ ip, stream: true })

  /** 调试标记：Task 1 的验收依赖 `loaded` / `at` 两个字段，不要删。 */
  const info = {
    loaded: true,
    at: Date.now(),
    ip,
    state,
    entry: undefined,
    /** `'sidebar-right-tab'`（官方席位）或 `'right-dock-dom'`（老宿主兼容）。 */
    mode: undefined,
    /** 装配那一刻 `ctx.get('sidebarRightTabs')` 是否可见（仅诊断用）。 */
    nativeVisible: false,
    error: null,
  }
  globalThis.__URSIM_TWIN__ = info

  ctx.logger?.info?.('[ursim-twin] client half loaded')

  let entryHandle
  let tabHandle

  /**
   * 退回 DOM 入口（老宿主兼容路径）。幂等：`registerSidebarTab` 的 `onUnavailable`
   * 可能在装配之后才回调，而时序上又可能紧跟在那次同步调用后面 —— 重复挂会得到两张卡。
   */
  const mountDom = () => {
    if (entryHandle !== undefined) return entryHandle
    entryHandle = mountRightDockEntry({
      doc,
      onToggle: (active) => {
        info.active = active
      },
      mountPanel: (container) => mountTwinPanel({ container, state }),
    })
    info.mode = 'right-dock-dom'
    info.entry = entryHandle
    return entryHandle
  }

  try {
    state.start()

    /*
     * 官方席位优先：有 `ctx.inject` 就走注册表（服务何时可用由 cordis 注入等待，
     * 不靠 `ctx.get` 的**时序**做判断 —— 那样会在服务晚到一帧时误判成"不支持"）。
     * 登记句柄为 `undefined`（缺 react / 缺 state）或注入最终解析不到服务时，退回 DOM。
     */
    if (typeof ctx.inject === 'function') {
      tabHandle = registerSidebarTab({
        ctx,
        state,
        logger: ctx.logger,
        mountPanel: (container) => mountTwinPanel({ container, state }),
        onUnavailable: mountDom,
      })
      if (tabHandle !== undefined) {
        info.mode = 'sidebar-right-tab'
        info.entry = tabHandle
      }
    }

    if (tabHandle === undefined) mountDom()

    // 诊断标记：装配瞬间注册表服务是否已可见（`false` 但仍是 native 模式 = 宿主排在后面加载）。
    info.nativeVisible = hasNativeSidebar(ctx)

    ctx.logger?.info?.(`[ursim-twin] mounted (ip=${ip}, surface=${info.mode})`)
  } catch (error) {
    // 客户端半装配失败不得拖垮 shell：如实记录到调试标记，清理函数照常返回。
    info.error = error instanceof Error ? error.message : String(error)
    ctx.logger?.warn?.(`[ursim-twin] 客户端装配失败：${info.error}`)
  }

  return () => {
    try {
      tabHandle?.dispose?.()
    } catch {
      /* 忽略 */
    }
    try {
      entryHandle?.dispose?.()
    } catch {
      /* 忽略 */
    }
    try {
      state.stop()
    } catch {
      /* 忽略 */
    }
    tabHandle = undefined
    entryHandle = undefined
    delete globalThis.__URSIM_TWIN__
  }
}
