/**
 * src/client/robot/manipulability.js — 奇异点与可操作度提示（0.1.11，路线图 C1）。
 *
 * ## 为什么要它
 *
 * 仿真画面能告诉你"它现在在哪"，但**不告诉你"这个位姿是不是快不能动了"**：UR 的腕部奇异点
 * （第 5 关节 ≈ 0，手腕 4/6 轴共线）在画面上和普通位姿长得一模一样，而到了那里逆解会发散、
 * 笛卡尔指令会突然要求关节高速旋转。真机操作员凭经验避开它，仿真用户没有这个经验 —— 面板
 * 替他算出来。
 *
 * ## ⚠️ 一个必须记住的坑：位置雅可比看不见腕部奇异点
 *
 * 起初这里用的是"**位置**雅可比（3×6）的最小奇异值"，然后拿真数据标定 —— 曲线显示它几乎
 * 不随腕角变化（`|q5|` 从 0.5° 到 90°，σ_min/臂展 只从 0.2766 变到 0.2413）：
 * **UR 的腕部奇异是姿态退化**（丢掉一个转动自由度），退化发生在**角速度行**里，位置行根本
 * 不含这个信息。所以改用完整的几何雅可比（3 行位置 + 3 行角速度）与 `|det J|`（Yoshikawa
 * 可操作度；6×6 方阵时 `sqrt(det(J Jᵀ)) = |det J|`）。曲线随后在 `q5 → 0` 处如预期塌陷。
 *
 * ## 两条判据（都不需要动力学）
 *
 * 1. **腕部角度**：`|q4|`（0 基下标，即第 5 关节）趋 0 就是腕部奇异点 —— UR 手册上的经典判据。
 * 2. **可操作度**：`|det J| / 臂展³`（无量纲；位置行带米、角速度行无量纲 ⇒ 行列式是米³）。
 *    阈值由 `scripts/calibrate-manipulability.mjs` 在 14 个型号上实测取样得出（见常量注释）。
 * 3. 另外报告**离限位还差多少度**（贴边同样意味着"这个方向快没空间了"），但它**不是**奇异点。
 *
 * ⚠️ 明确**不做**的事：不判避障、不判关节速度/力矩可行性、不给轨迹规划建议。只回答"当前
 * 位姿离奇异点有多近"，多一步都不声称。
 *
 * 依赖纪律：本模块进浏览器 bundle，只 import `./fk.js`（零依赖共享模块）。
 */

import { fkChain } from './fk.js'

/** 腕部角度判据：低于它算"已到奇异点"（度）。 */
export const WRIST_AT_DEG = 3
/** 腕部角度判据：低于它算"接近奇异点"（度）。 */
export const WRIST_NEAR_DEG = 8
/**
 * 归一化可操作度（`|det J| / 臂展³`）的下限。**实测标定，不是拍脑袋**：
 * `node scripts/calibrate-manipulability.mjs` 在 14 个型号 × 4000 个限位内位姿上取样，
 * 并扫了 `q5` 从 0° 到 90° 的塌陷曲线（曲线近似线性且**跨型号一致**，说明归一化成立）：
 *
 *   · 腕角 1° → 0.0027    2° → 0.0055    3° → 0.0082    8° → 0.0219    90° → 0.158
 *   · 普通限位内位姿：中位数 0.038；0.001 命中 3.4%、0.002 命中 5.9%、0.004 命中 10.4%
 *
 * 据此取 `at = 0.001`（≈ 普通位姿的 3%，即"真的贴在奇异面上"）与 `near = 0.004`（≈10%）。
 * 刻意比"腕角 8° 等价"（0.022）严得多：**腕角判据才是 UR 那条可操作的线**，可操作度是
 * 兜住非腕部退化（肩/肘）的网 —— 网张得太开就会让"近奇异"变成常态，警告也就不值钱了。
 */
export const MANIP_AT = 0.001
export const MANIP_NEAR = 0.004
/** 离关节限位多近算"贴边"（度）。 */
export const LIMIT_MARGIN_DEG = 5

const DEG = 180 / Math.PI

/** 从列主序 4×4 里取第 3 列（z 轴）与第 4 列（位置）。 */
const zAxisOf = (m) => [m[8], m[9], m[10]]
const posOf = (m) => [m[12], m[13], m[14]]

/**
 * 几何雅可比（6×6）：位置行 = `z_{i-1} × (p_end − p_{i-1})`，角速度行 = `z_{i-1}`。
 *
 * 用**解析式**而不是数值微分：`fkChain` 已经把每个关节的累积变换交出来了，
 * 关节 i 的转动轴就是 `links[i]` 的 z 轴 —— 因为链上是 `t · 固定变换(i) · rotZ(q_i)`，
 * 而 `rotZ` 不改变 z 轴、也不改变原点位置 ⇒ `links[i]` 的 z 与原点恰好就是关节 i 的轴线。
 *
 * ⚠️ **别取 `links[i-1]`**：UR 的固定变换里有 `roll = 90°` 这种**带旋转**的项，丢掉它会让
 * 相邻关节轴"看起来共线"，雅可比整列退化、`det J` 恒为 0 —— 本轮就是这样被测出来的
 * （标定曲线全零，才回头发现取错了帧）。
 *
 * @returns {number[][]|null} 6 行 × 6 列（行 0-2 位置，行 3-5 角速度）
 */
export function geometricJacobian(kin, q) {
  if (kin == null || q == null || q.length < 6) return null
  const out = fkChain(kin, q)
  const tool = out?.tool0
  const links = out?.links
  if (!tool || !Array.isArray(links) || links.length < 6) return null
  const jac = [[], [], [], [], [], []]
  const end = posOf(tool)
  for (let i = 0; i < 6; i += 1) {
    const frame = links[i]
    const z = zAxisOf(frame)
    const p = posOf(frame)
    const rx = end[0] - p[0]
    const ry = end[1] - p[1]
    const rz = end[2] - p[2]
    // z × r
    jac[0][i] = z[1] * rz - z[2] * ry
    jac[1][i] = z[2] * rx - z[0] * rz
    jac[2][i] = z[0] * ry - z[1] * rx
    jac[3][i] = z[0]
    jac[4][i] = z[1]
    jac[5][i] = z[2]
  }
  return jac
}

/**
 * 6×6 行列式（带部分主元的高斯消元）。
 *
 * @returns {number|null} 奇异（主元退化）时返回 0
 */
export function det6(m) {
  if (!Array.isArray(m) || m.length !== 6) return null
  const a = m.map((row) => Array.from(row))
  let det = 1
  for (let col = 0; col < 6; col += 1) {
    let pivot = col
    for (let r = col + 1; r < 6; r += 1) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    }
    if (a[pivot][col] === 0) return 0
    if (pivot !== col) {
      const tmp = a[pivot]
      a[pivot] = a[col]
      a[col] = tmp
      det = -det
    }
    det *= a[col][col]
    for (let r = col + 1; r < 6; r += 1) {
      const factor = a[r][col] / a[col][col]
      if (factor === 0) continue
      for (let c = col; c < 6; c += 1) a[r][c] -= factor * a[col][c]
    }
  }
  return det
}

/**
 * 归一化可操作度 `|det J| / 臂展³`（无量纲）。
 *
 * @returns {number|null} 拿不到臂展时退回未归一化的 `|det J|`
 */
export function manipulability(kin, q, reach = null) {
  const jac = geometricJacobian(kin, q)
  if (jac === null) return null
  const det = det6(jac)
  if (det === null || !Number.isFinite(det)) return null
  const raw = Math.abs(det)
  if (!Number.isFinite(reach) || !(reach > 0)) return raw
  return raw / reach ** 3
}

/** 离限位还差多少度（取六轴里最紧的那一个）；没有限位信息就给 null。 */
export function limitMarginDeg(joints, limits) {
  if (joints == null || limits == null) return null
  let worst = Infinity
  let worstJoint = -1
  const count = Math.min(joints.length ?? 0, limits.length ?? 0)
  for (let i = 0; i < count; i += 1) {
    const limit = limits[i]
    const q = joints[i]
    if (limit == null || q == null || !Number.isFinite(q)) continue
    const [min, max] = limit
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue
    // 超限时给负数（离得越远越负），这样"最紧的关节"排序一致。
    const margin = q < min ? (q - min) * DEG : q > max ? (max - q) * DEG : Math.min(q - min, max - q) * DEG
    if (margin < worst) {
      worst = margin
      worstJoint = i
    }
  }
  return worstJoint < 0 ? null : { deg: worst, joint: worstJoint }
}

/**
 * 当前位姿的奇异点提示。
 *
 * @param {{kin: object, joints: ArrayLike<number>, limits?: ArrayLike<ArrayLike<number>|null>,
 *          reach?: number, manip?: number}} input
 * @returns {{level: 'ok'|'near'|'at', wristDeg: number, manip: number|null, limitDeg: number|null,
 *            limitJoint: number|null, reasons: string[]}|null}
 */
export function singularityHint({ kin, joints, limits = null, reach = null, manip = null } = {}) {
  if (kin == null || joints == null || joints.length < 6) return null
  const q = Array.from(joints).slice(0, 6)
  if (!q.every((v) => Number.isFinite(v))) return null
  const wristDeg = Math.abs(q[4]) * DEG
  const value = Number.isFinite(manip) ? manip : manipulability(kin, q, reach)
  const margin = limitMarginDeg(q, limits)
  const reasons = []
  let level = 'ok'
  const worse = (next) => {
    if (next === 'at' || level === 'at') level = 'at'
    else if (next === 'near' || level === 'near') level = 'near'
  }
  if (wristDeg <= WRIST_AT_DEG) {
    worse('at')
    reasons.push('wrist')
  } else if (wristDeg <= WRIST_NEAR_DEG) {
    worse('near')
    reasons.push('wrist')
  }
  if (value !== null && Number.isFinite(value)) {
    if (value <= MANIP_AT) {
      worse('at')
      reasons.push('manip')
    } else if (value <= MANIP_NEAR) {
      worse('near')
      reasons.push('manip')
    }
  }
  if (margin !== null && margin.deg <= LIMIT_MARGIN_DEG) {
    // 贴限位不是奇异点，但它同样意味着"这个方向快没空间了" —— 归入同一档提示（reasons 里区分）。
    worse(margin.deg < 0 ? 'at' : 'near')
    reasons.push('limit')
  }
  return {
    level,
    wristDeg,
    manip: value,
    limitDeg: margin === null ? null : margin.deg,
    limitJoint: margin === null ? null : margin.joint,
    reasons,
  }
}
