/**
 * src/client/index.js — 客户端半的装配入口。
 *
 * 装配顺序（**唯一** `state`，全客户端只此一条轮询链）：
 *   1. `createTwinState({ ip })` → `start()`（Task 6：轮询 host 只读状态路由 + 失败退避）
 *   2. `mountRightDockEntry(...)`：把「NoneadURSim」入口卡片注入**右栏**「开始」面板的引导列
 *      （位置在「工作区文件 / 新建终端 / 浏览器」三张卡片**下面**），并负责自愈与激活状态
 *   3. 大视图 `mountTwinPanel`（Task 8）由入口在**点击展开时**才挂进右栏的覆盖层，
 *      收起/离开面板时 dispose —— 不做无谓的 WebGL 初始化
 *
 * 呈现位置的历史：本插件原先把入口行注入**左栏**、大视图覆盖**中栏**，并在左栏入口行下面
 * 挂一个缩略 3D 插槽。现在改为**只在右栏**呈现（入口在三张引导卡片下面、3D 显示在右侧栏），
 * 因此左栏入口 + 中栏大视图（原 `sidebar-entry.js`）与缩略图（原 `thumbnail.js`）
 * **已随本次改版删除**，中栏的 `dsh-panel-activate` 协调协议也随之不再使用。
 * 仍在用的变更自愈 hub 已独立为 `./mutation-hub.js`。
 *
 * `apply(ctx, config)` 返回清理函数：dispose 所有挂载 + `state.stop()`（`ctx.effect` 语义）。
 * 调试标记 `globalThis.__URSIM_TWIN__` 在 Task 1 就已约定并保留（`loaded`/`at` 字段不许改），
 * 这里额外挂上 `ip` / `state` / 入口句柄，便于 GUI 侧排查。
 *
 * IP 来源（Ruling 35）：**默认不指定**，由 host 依据其连接注册表解析到"当前已连接的那一个机器人"
 * —— 浏览器半不该猜机器人地址（曾默认 `192.168.1.199`，与真实机器人 `192.168.2.201` 不符，
 * 会导致数字孪生永远显示"未连接"）。仅在需要覆盖时才提供：
 * `globalThis.__URSIM_TWIN_IP__`（调试/验收）→ `apply(ctx, config)` 的第二实参 `config.ip` / `config.robotIp`。
 *
 * 配置只能取自 `apply` 的第二实参：cordis 的上下文代理对未 `inject` 的属性读取会直接抛
 * `cannot get property "..." without inject`（读 `ctx.config` 即属此类）。`apply` 抛出的异常
 * 会让该 entry 的 fiber 落为 FAILED，渲染侧只会报「1 plugin(s) 未激活」而拿不到原因。
 */

import { createTwinState } from './state.js'
import { mountRightDockEntry } from './right-dock-entry.js'
import { mountTwinPanel } from './twin-panel.js'

export const name = 'ur-digital-twin-client'

/** 保留的仿真地址（与 `lib/index.js` 的 `SIM_IP`、python 侧 `SIM_IP` 同一语义）。 */
export const SIM_IP = '127.0.0.1'

/**
 * 目标机器人地址：**恒为保留的仿真地址**。
 *
 * 本插件只操作离线仿真机器人、**不存在任何真机通道**，所以显式配置
 * （`__URSIM_TWIN_IP__` / `config.ip` / `config.robotIp`）不再能把客户端指向真机 ——
 * 两个参数保留只是为了不破坏签名与既有配置文件。宿主侧的孪生路由同样忽略 `?ip=`。
 *
 * @param {object} [_config] 插件配置（已不再影响目标地址）
 * @param {object} [_globalScope] 全局作用域（已不再影响目标地址）
 */
export function resolveRobotIp(_config, _globalScope = globalThis) {
  return SIM_IP
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
    error: null,
  }
  globalThis.__URSIM_TWIN__ = info

  ctx.logger?.info?.('[ursim-twin] client half loaded')

  let entryHandle

  try {
    state.start()

    entryHandle = mountRightDockEntry({
      doc,
      onToggle: (active) => {
        info.active = active
      },
      mountPanel: (container) => mountTwinPanel({ container, state }),
    })

    info.entry = entryHandle
    ctx.logger?.info?.(`[ursim-twin] mounted (ip=${ip}, surface=right-dock)`)
  } catch (error) {
    // 客户端半装配失败不得拖垮 shell：如实记录到调试标记，清理函数照常返回。
    info.error = error instanceof Error ? error.message : String(error)
    ctx.logger?.warn?.(`[ursim-twin] 客户端装配失败：${info.error}`)
  }

  return () => {
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
    entryHandle = undefined
    delete globalThis.__URSIM_TWIN__
  }
}
