/**
 * test/sim-motion-smooth.test.mjs — movel 的插补必须**平滑、不跳帧**（用户 2026-10-12 裁定）。
 *
 * ## 钉住的是什么
 * movel 的诚实做法是「沿 Cartesian 直线每 `step_m` 取一个细分点、逐点逆解」——0.5 m 就是 50 多个
 * 途经点。但**时间**不能再按段各自启停：逐段 smoothstep 等于每 1 cm 减速到零又重新加速，一次
 * movel 变成几十次微小的加/减速（视觉上一顿一顿），孪生每帧拿到的关节角速度也忽大忽小、
 * 插值后像在跳帧。正确做法是**整条折线共用一条时间剖面**：时间 → 全局进度 → smoothstep →
 * 沿折线的位置 → 段内逐关节插值。
 *
 * 所以这里两半都测：
 *   ① **结构**：`_sample` 用的是全局 smoothstep（而不是段内），时长由 `_travel_duration` 按
 *      **整段行程**算出来；
 *   ② **行为**：按 20 Hz（孪生的推送节拍）采样整条 movel，验证"只有首尾在加减速、巡航段速度
 *      基本恒定、相邻帧速度不突跳、终点精确到位"。
 *
 * 运行：node --test test/sim-motion-smooth.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url))
const simSource = readFileSync(join(pythonDir, 'ur_sim.py'), 'utf8').replace(/\r\n/g, '\n')

test('结构：整条折线共用一条时间剖面（不是逐段 smoothstep）', () => {
  const sampleBody = /def _sample\(self, elapsed\):[\s\S]*?\n    def /.exec(simSource)?.[0] ?? ''
  assert.ok(sampleBody, '未找到 _sample')
  assert.match(
    sampleBody,
    /remaining = \(u \* u \* \(3\.0 - 2\.0 \* u\)\) \* path_s/,
    '★ _sample 必须先按**全局**进度取 smoothstep，再映射到折线上（逐段 smoothstep 就是那个"一顿一顿"的成因）',
  )
  assert.match(sampleBody, /path_s = sum\(self\._segment_s\[1:\]\)/, '全局进度要按整条折线的总时长取')

  const planBody = /def _plan\(self, waypoints[\s\S]*?\n    def /.exec(simSource)?.[0] ?? ''
  assert.ok(planBody, '未找到 _plan')
  assert.match(planBody, /_travel_duration\(travel,/, '★ 总时长必须由**整段行程**算，而不是逐段时长相加')
  assert.match(planBody, /travel = sum\(weights\)/, '行程 = 各段位移之和')
  assert.match(planBody, /total \* \(w \/ travel\)/, '各段名义时长要按位移比例分配（关节速度一致）')

  assert.ok(
    !/_segment_duration\(/.test(simSource),
    '逐段时长的旧接口必须已被 _travel_duration 取代（否则很容易又走回逐段启停）',
  )
})

/** 在真 Python 里跑一条 movel，按 20 Hz 采样，把统计量打成一行 JSON。 */
const HARNESS = `
import json, ur_sim

sim = ur_sim.VirtualRobot('127.0.0.1', 'ur12e', preset='upright')
TARGET = [-0.6914, -0.1742, 0.1768, 2.2214, 2.2214, 0.0]
sim.move_cartesian([TARGET], v=0.25, a=1.2)
path_s = sum(sim._segment_s[1:])

DT = 0.05  # 孪生推送是 20 Hz
frames = int(sim._total_s / DT) + 2
speeds = []
prev = None
for k in range(frames):
    q = sim._sample(k * DT)
    if prev is not None:
        speeds.append(max(abs(q[i] - prev[i]) for i in range(6)) / DT)
    prev = q

mid = speeds[len(speeds) // 2 - 5: len(speeds) // 2 + 5]
print(json.dumps({
    'segments': len(sim._segment_s) - 1,
    'total_s': sim._total_s,
    'frames': len(speeds),
    'near_zero': sum(1 for s in speeds if s < 0.02),
    'first': speeds[0],
    'last': speeds[-1],
    'cruise_min': min(mid),
    'cruise_max': max(mid),
    'max_step': max(abs(speeds[i + 1] - speeds[i]) for i in range(len(speeds) - 1)),
    'tcp': ur_sim.tcp_pose('ur12e', sim._sample(path_s)),
    'target': TARGET,
}))
`

test('行为：20 Hz 采样下 movel 全程平滑（只有首尾加减速、巡航匀速、不突跳、精确到位）', () => {
  const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env, PYTHONPATH: pythonDir, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' },
  })
  assert.equal(child.status, 0, `探针失败：${child.stderr}`)
  const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'))
  assert.ok(line, `未拿到 JSON 结果：${JSON.stringify(child.stdout)}`)
  const got = JSON.parse(line)

  // 直线仍被细分（TCP 真的走直线，而不是关节插值拉出的弧线）
  assert.ok(got.segments >= 20, `直线段必须细分（实测 ${got.segments} 段）`)

  // ★ 核心：全程度接近静止的帧只能是**首尾两次斜坡**
  //   （逐段 smoothstep 的旧实现会在每个细分点归零 —— 50 多段就是 50 多帧"站住"）
  assert.ok(
    got.near_zero <= 6,
    `★ 近似静止帧过多（${got.near_zero}/${got.frames}）—— 说明又回到了"每段各自启停"，动起来会一顿一顿`,
  )

  // 起停都在零速：平滑起步、平滑停止（不是瞬间满速/瞬间停）
  assert.ok(got.first < 0.05, `起步必须从静止加速（实测首帧 ${got.first}）`)
  assert.ok(got.last < 0.05, `停止必须减到静止（实测末帧 ${got.last}）`)

  // 巡航段速度基本恒定（同一关节速度跑完全程）
  const spread = (got.cruise_max - got.cruise_min) / ((got.cruise_max + got.cruise_min) / 2)
  assert.ok(spread < 0.1, `巡航段速度必须恒定（实测极差 ${(spread * 100).toFixed(1)}%）`)

  // 相邻帧速度不突跳 —— 这就是"不跳帧"在数值上的样子
  assert.ok(got.max_step < 0.05, `相邻帧速度突跳过大（${got.max_step} rad/s per 50 ms）`)

  // 总时长按整段行程算，不再是逐段时长相加（旧算法这一条 movel 约 9 s）
  assert.ok(got.total_s < 6, `总时长不合理（${got.total_s.toFixed(2)}s）—— 像是又按逐段计时了`)

  // 终点必须精确落在目标位姿上
  for (let i = 0; i < 6; i += 1) {
    assert.ok(
      Math.abs(got.tcp[i] - got.target[i]) < 1e-3,
      `第 ${i} 个分量没到位：${got.tcp[i]} vs ${got.target[i]}`,
    )
  }
})
