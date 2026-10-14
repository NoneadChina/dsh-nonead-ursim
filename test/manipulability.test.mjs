/**
 * test/manipulability.test.mjs — 奇异点/可操作度提示（0.1.11，路线图 C1）的行为测试。
 *
 * ## 为什么必须有这个文件
 *
 * 这一模块**曾经写错过两次**，两次都是"看起来对、测试也绿"的那种错：
 *   1. 用**位置**雅可比（3×6）的最小奇异值 —— 它对 UR 的腕部奇异**完全不敏感**（实测
 *      `|q5|` 从 0.5° 变到 90°，σ_min/臂展 只从 0.2766 变到 0.2413）。腕部退化发生在
 *      **角速度行**里，位置行不含这个信息。
 *   2. 取关节轴时用了 `links[i-1]` —— 而 UR 的固定变换里带 `roll = 90°`，丢掉它会让相邻轴
 *      "看起来共线"，雅可比整列退化、`det J` 恒为 0（标定曲线全零才暴露）。
 * 所以这里的断言盯的是**物理性质**，不是"函数返回了个数"：
 *   · `q5 = 0` 时必须**恰好**奇异（det = 0）；
 *   · 可操作度随 `|q5|` 单调上升，且**跨型号一致**（归一化成立的证据）；
 *   · 三档判定（ok / near / at）在固定位姿上的语义；
 *   · 离限位余量（含超限给负值）与它引发的提示。
 *
 * 运行：node --test test/manipulability.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { fkChain } from '../src/client/robot/fk.js'
import {
  MANIP_AT,
  MANIP_NEAR,
  WRIST_AT_DEG,
  WRIST_NEAR_DEG,
  det6,
  geometricJacobian,
  limitMarginDeg,
  manipulability,
  singularityHint,
} from '../src/client/robot/manipulability.js'

const KIN = JSON.parse(readFileSync(new URL('../assets/kinematics.json', import.meta.url), 'utf8'))
const { ur5e, ur10e } = KIN

const DEG = Math.PI / 180
const reachOf = (kin) => {
  let max = 0
  for (const q of [[0, 0, 0, 0, 0, 0], [0, -Math.PI / 2, Math.PI / 2, 0, 0, 0], [Math.PI / 2, -Math.PI / 3, Math.PI / 3, 0, 0, 0]]) {
    const m = fkChain(kin, q)?.tool0
    if (m) max = Math.max(max, Math.hypot(m[12], m[13], m[14]))
  }
  return max
}
const REACH = { ur5e: reachOf(ur5e), ur10e: reachOf(ur10e) }
const withWrist = (base, deg) => {
  const q = base.slice()
  q[4] = deg * DEG
  return q
}
const BASE = [0, -Math.PI / 3, Math.PI / 3, -Math.PI / 4, 0, 0]

test('det6：单位阵为 1、重复行（奇异）为 0、交换行变号', () => {
  const I = [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]]
  assert.equal(det6(I), 1)
  const dup = I.map((row, i) => (i === 3 ? I[2].slice() : row))
  assert.equal(det6(dup), 0, '重复行 ⇒ 奇异')
  const swapped = I.slice()
  const tmp = swapped[0]
  swapped[0] = swapped[1]
  swapped[1] = tmp
  assert.equal(det6(swapped), -1, '交换两行必须变号（部分主元的符号处理）')
  assert.equal(det6(null), null)
  assert.equal(det6([[1]]), null, '不是 6×6 就不猜')
})

test('★ geometricJacobian：角速度行是单位关节轴（z 轴），位置行随位姿变化', () => {
  const jac = geometricJacobian(ur5e, BASE)
  assert.ok(jac, '必须拿到雅可比')
  assert.equal(jac.length, 6)
  for (let i = 0; i < 6; i += 1) {
    const norm = Math.hypot(jac[3][i], jac[4][i], jac[5][i])
    assert.ok(Math.abs(norm - 1) < 1e-9, `第 ${i} 列的角速度部分必须是单位 z 轴（实际 ${norm}）`)
  }
  // 位置行在普通位姿下不该全零（否则就是当年那个"取了 links[i-1] 的退化"重现）
  const posNorm = Math.hypot(...jac.slice(0, 3).flat())
  assert.ok(posNorm > 0.1, `位置行不该退化（实际 ${posNorm}）`)
})

test('★★ q5 = 0 恰好奇异；可操作度随 |q5| 单调上升', () => {
  const zero = manipulability(ur5e, withWrist(BASE, 0), REACH.ur5e)
  assert.ok(Math.abs(zero) < 1e-9, `腕角 0 ⇒ 恰好奇异（det 应为 0，实际 ${zero}）`)
  let previous = -1
  for (const deg of [0.5, 1, 2, 3, 5, 8, 15, 30]) {
    const value = manipulability(ur5e, withWrist(BASE, deg), REACH.ur5e)
    assert.ok(value > previous, `腕角 ${deg}° 的可操作度必须比前一档大（${value} vs ${previous}）`)
    previous = value
  }
  // 与标定脚本实测的曲线一致（留 15% 余量，避免浮点/端口差异让断言变脆）
  const at3 = manipulability(ur5e, withWrist(BASE, 3), REACH.ur5e)
  assert.ok(Math.abs(at3 - 0.0083) < 0.0015, `腕角 3° 的可操作度应在 0.0083 附近（实际 ${at3}）`)
})

test('★ 归一化成立：同一组关节角下，不同型号的可操作度几乎相同', () => {
  // 这是"除以臂展³"这个归一化到底对不对的直接检验 —— 若哪天有人把 reach 去掉，这条会红。
  for (const deg of [1, 3, 8, 45]) {
    const a = manipulability(ur5e, withWrist(BASE, deg), REACH.ur5e)
    const b = manipulability(ur10e, withWrist(BASE, deg), REACH.ur10e)
    const rel = Math.abs(a - b) / Math.max(a, b)
    assert.ok(rel < 0.05, `腕角 ${deg}° 时两型号应基本一致（ur5e ${a} vs ur10e ${b}，相对差 ${rel}）`)
  }
})

test('★ 三档判定：腕角判据 + 可操作度判据 + 贴限位', () => {
  const ok = singularityHint({ kin: ur5e, joints: withWrist(BASE, 90), limits: ur5e.jointLimits, reach: REACH.ur5e })
  assert.equal(ok.level, 'ok')
  assert.ok(Math.abs(ok.wristDeg - 90) < 1e-9)

  const near = singularityHint({ kin: ur5e, joints: withWrist(BASE, 5), limits: ur5e.jointLimits, reach: REACH.ur5e })
  assert.equal(near.level, 'near', `腕角 5° 应判 near（阈值 ${WRIST_NEAR_DEG}°）`)
  assert.ok(near.reasons.includes('wrist'))

  const at = singularityHint({ kin: ur5e, joints: withWrist(BASE, 1), limits: ur5e.jointLimits, reach: REACH.ur5e })
  assert.equal(at.level, 'at', `腕角 1° 应判 at（阈值 ${WRIST_AT_DEG}°）`)
  assert.ok(at.manip < MANIP_NEAR, '腕角 1° 的可操作度也应低于 near 阈值（两条判据互相印证）')

  // 腕角很好、但贴限位：仍要提示，且 reasons 里必须说明是限位而不是奇异点
  const limits = ur5e.jointLimits.map((l) => l.slice())
  const q = withWrist(BASE, 90).slice()
  q[1] = limits[1][0] + 2 * DEG // 距下限 2°
  const nearLimit = singularityHint({ kin: ur5e, joints: q, limits, reach: REACH.ur5e })
  assert.equal(nearLimit.level, 'near')
  assert.ok(nearLimit.reasons.includes('limit'))
  assert.ok(!nearLimit.reasons.includes('wrist'), '腕角 90° 不该被判成腕部奇异')
  assert.ok(Math.abs(nearLimit.limitDeg - 2) < 1e-6)

  // 超限：余量为负 ⇒ at
  q[1] = limits[1][0] - 5 * DEG
  const beyond = singularityHint({ kin: ur5e, joints: q, limits, reach: REACH.ur5e })
  assert.equal(beyond.level, 'at')
  assert.ok(beyond.limitDeg < 0)
})

test('limitMarginDeg：取六轴里最紧的那个；无限位信息给 null', () => {
  const limits = [[-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1]]
  const m = limitMarginDeg([0, 0, 0, 0, 0, 0.9], limits)
  assert.equal(m.joint, 5)
  assert.ok(Math.abs(m.deg - (1 - 0.9) * (180 / Math.PI)) < 1e-9)
  assert.equal(limitMarginDeg([0, 0, 0, 0, 0, 0], null), null)
  assert.equal(limitMarginDeg(null, limits), null)
})

test('导出的阈值必须与文档/标定一致（防止有人改成"永不触发"或"永远告警"）', () => {
  assert.equal(MANIP_AT, 0.001)
  assert.equal(MANIP_NEAR, 0.004)
  assert.equal(WRIST_AT_DEG, 3)
  assert.equal(WRIST_NEAR_DEG, 8)
})
