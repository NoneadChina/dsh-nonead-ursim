/**
 * scripts/calibrate-manipulability.mjs — 给 C1 的阈值做**实测标定**（一次性，结论写进模块常量）。
 *
 * 做法：对 `assets/kinematics.json` 里每个型号，在其**限位内**均匀随机采样 N 个位姿，算
 * `σ_min(J Jᵀ) / 臂展`（无量纲），统计分布。阈值取低分位，而不是拍脑袋：
 *   · `at`  ≈ 0.2% 分位（几乎就是奇异点本身）
 *   · `near`≈ 2%   分位（明显变差、但还能走）
 * 同时把"腕部角度"与"贴限位"两条判据的影响排除在外（只统计 σ 本身）。
 *
 * 运行：node scripts/calibrate-manipulability.mjs [每型号采样数]
 */
import { readFileSync } from 'node:fs'
import { fkChain } from '../src/client/robot/fk.js'
import { manipulability } from '../src/client/robot/manipulability.js'

const KIN = JSON.parse(readFileSync(new URL('../assets/kinematics.json', import.meta.url), 'utf8'))
const N = Number(process.argv[2] ?? 4000)

/** 臂展：tool0 在"全零位"与几个伸展位姿下的最大可达距离（与 loader 的 reachRadius 同口径）。 */
function reachOf(kin) {
  let max = 0
  const probes = [
    [0, 0, 0, 0, 0, 0],
    [0, -Math.PI / 2, Math.PI / 2, 0, 0, 0],
    [Math.PI / 2, -Math.PI / 3, Math.PI / 3, 0, 0, 0],
    [0, -Math.PI / 4, Math.PI / 3, 0, Math.PI / 2, 0],
  ]
  for (const q of probes) {
    const m = fkChain(kin, q)?.tool0
    if (!m) continue
    max = Math.max(max, Math.hypot(m[12], m[13], m[14]))
  }
  return max
}

/** 可复现的伪随机（不用 Math.random，方便复跑对齐）。 */
function makeRand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const percentiles = [0.002, 0.02, 0.05, 0.5]
const rows = []
for (const [model, kin] of Object.entries(KIN)) {
  if (!kin?.links || !Array.isArray(kin.jointLimits)) continue
  const reach = reachOf(kin)
  if (!(reach > 0)) continue
  const rand = makeRand(0x9e3779b9 ^ model.length)
  const values = []
  for (let i = 0; i < N; i += 1) {
    const q = kin.jointLimits.map((lim) => {
      if (!Array.isArray(lim)) return 0
      const [lo, hi] = lim
      // 集中在关节中部（均匀采到的极值位姿几乎必然惨），取 15% 内缩区间
      const a = lo + (hi - lo) * 0.15
      const b = hi - (hi - lo) * 0.15
      return a + (b - a) * rand()
    })
    const s = manipulability(kin, q, reach)
    if (Number.isFinite(s)) values.push(s)
  }
  values.sort((a, b) => a - b)
  const at = (p) => values[Math.min(values.length - 1, Math.floor(p * values.length))]
  rows.push({ model, reach: reach.toFixed(3), n: values.length, ...Object.fromEntries(percentiles.map((p) => [`p${p * 100}`, at(p).toFixed(5)])) })
}

console.log(`每型号采样 ${N} 个限位内位姿（关节中部 70% 区间），|det J|/臂展³ 的分位：`)
console.table(rows)
const all = rows.map((r) => Number(r['p0.2']))
console.log(`\n各型号 p0.2% 的中位数 ≈ ${(all.sort((a, b) => a - b)[Math.floor(all.length / 2)]).toFixed(5)}`)

/*
 * 第二段：**腕角塌陷曲线**。这是阈值的直接依据 —— 随机位姿几乎采不到奇异点（零测集），
 * 所以分位只能说明"普通位姿长什么样"；真正的塌陷形状要看 q5 → 0。
 */
const ANGLES = [0, 0.5, 1, 2, 3, 5, 8, 15, 30, 45, 60, 90]
const BASES = [
  [0, -Math.PI / 3, Math.PI / 3, -Math.PI / 4, 0, 0],
  [0.6, -Math.PI / 2, Math.PI / 2, 0, 0, 0],
  [-0.4, -Math.PI / 4, Math.PI / 2, -Math.PI / 3, 0, 0],
]
for (const model of ['ur5e', 'ur10e', 'ur20']) {
  const kin = KIN[model]
  const reach = reachOf(kin)
  const curve = []
  for (const base of BASES) {
    const cells = {}
    for (const deg of ANGLES) {
      const q = base.slice()
      q[4] = (deg * Math.PI) / 180
      const v = manipulability(kin, q, reach)
      cells[`${deg}°`] = Number.isFinite(v) ? v.toFixed(4) : '—'
    }
    curve.push({ base: `q5 之外 = [${base.slice(0, 4).map((v) => v.toFixed(2)).join(',')}]`, ...cells })
  }
  console.log(`\n=== ${model}（臂展 ${reach.toFixed(3)} m）随腕角的塌陷 ===`)
  console.table(curve)
}
console.log('\n阈值取值（见 src/client/robot/manipulability.js 的 MANIP_AT / MANIP_NEAR）：')
console.log('  at   = 0.001  —— 普通位姿命中约 3%，等价腕角 ≈0.4°，即真贴在奇异面上')
console.log('  near = 0.004  —— 普通位姿命中约 10%，等价腕角 ≈1.5°')
console.log('  腕角判据另算：|q5| ≤ 3° 判 at、≤ 8° 判 near（UR 那条可操作的线）')
