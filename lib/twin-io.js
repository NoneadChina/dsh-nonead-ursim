/**
 * lib/twin-io.js — 面板 I/O 写请求的**校验与整形**（0.1.13，方案 P1）。
 *
 * ## 为什么单独成一个模块
 *
 * 面板的写请求是**外部输入**：它来自浏览器，可能被别的页面伪造（虽然有信任围栏），也可能只是
 * 面板自己的 bug。把"什么算合法请求"抽成纯函数有两个好处：① 可以**单测**（路由本身要挂 webServer
 * 才能测，成本高）；② 路由那一层只剩"调用它、把错误翻成 400"，薄到不需要额外测试。
 *
 * ## 三条纪律（都来自设计文档）
 *
 * 1. **白名单枚举**：只认 `digital_out` / `analog_out` 两种，别的一律拒 —— 面板不该有能力调任意 op。
 * 2. **参数自己校验，不信调用方**：`n` 是整数且在 0-15、`value` 类型随 kind 而定（布尔 / 有限数）；
 *    数字域用 `Number.isFinite` 而不是 `typeof === 'number'`（`NaN` 也是 number）。
 * 3. **只写仿真**：本模块只负责整形，**"目标是不是离线仿真"由路由判定**（它才知道 `simIps` 的状态）
 *    —— 但这里把 `ip` 固定成 `SIM_IP`（来自 `lib/sim-ip.js` 的唯一真源），从整形阶段就不给
 *    真机目标留位置。
 *
 * 依赖纪律：本模块只被 `lib/index.js` 使用（不进浏览器 bundle）。
 */

/** 面板允许写的 I/O 种类 → worker op 的白名单。 */
export const IO_WRITE_OPS = Object.freeze({
  digital_out: 'set_digital_out',
  analog_out: 'set_analog_out',
})

// 回环地址来自唯一真源模块（0.1.14）：从前这里独立写死一份，改一处就会静默漂移。
import { SIM_IP } from './sim-ip.js'

/**
 * 校验一个面板 I/O 写请求。
 *
 * @param {object} body 请求体（可能来自任何地方，所以逐字段当不可信输入处理）
 * @returns {{ok: true, op: string, params: object} | {ok: false, error: string}}
 */
export function parseIoWrite(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'I/O 写请求必须是 JSON 对象' }
  }
  const kind = typeof body.kind === 'string' ? body.kind : ''
  const op = IO_WRITE_OPS[kind]
  if (op === undefined) {
    return { ok: false, error: `未知的 I/O 类型 ${kind === '' ? '(缺 kind)' : kind}；只支持 digital_out / analog_out` }
  }
  // ⚠️ 只接受 number 或**非空**数字字符串。两个都踩过：`Number('')` 与 `Number(null)` 都是 0，
  // 于是"没传端口"会被悄悄解读成"写 0 号端口"——写入型接口最不该有的宽松点。
  const rawN = body.n
  if (typeof rawN !== 'number' && !(typeof rawN === 'string' && rawN.trim() !== '')) {
    return { ok: false, error: 'n 必须是 0-15 的整数（标准输出 0-7 / 可配置输出 8-15）' }
  }
  const n = Number(rawN)
  if (!Number.isInteger(n) || n < 0 || n > 15) {
    return { ok: false, error: 'n 必须是 0-15 的整数（标准输出 0-7 / 可配置输出 8-15）' }
  }
  if (kind === 'digital_out') {
    if (typeof body.value !== 'boolean') {
      return { ok: false, error: 'digital_out 的 value 必须是布尔值（true/false）' }
    }
    return { ok: true, op, params: { ip: SIM_IP, n, value: body.value } }
  }
  // analog_out：按工程单位收值，域由 full_scale 决定（电压 10 / 电流 20）
  // 同上：`Number(null)` / `Number('')` 是 0，不能拿它当"用户想写 0 伏"。
  const rawValue = body.value
  if (typeof rawValue !== 'number' && !(typeof rawValue === 'string' && rawValue.trim() !== '')) {
    return { ok: false, error: 'analog_out 的 value 必须是有限数（工程单位：伏特或毫安）' }
  }
  const value = Number(rawValue)
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'analog_out 的 value 必须是有限数（工程单位：伏特或毫安）' }
  }  const params = { ip: SIM_IP, n, value }
  if (body.full_scale !== undefined) {
    const full = Number(body.full_scale)
    if (full !== 10 && full !== 20) {
      return { ok: false, error: 'full_scale 只能是 10（电压域）或 20（电流域）' }
    }
    params.full_scale = full
  }
  if (value < 0 || value > (params.full_scale ?? 10)) {
    return { ok: false, error: `value 必须落在 0-${params.full_scale ?? 10}（工程单位）` }
  }
  return { ok: true, op, params }
}
