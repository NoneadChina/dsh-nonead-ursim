/**
 * test/push-epoch.test.mjs — 主动推送遥测里的**连接代次**（`lib/worker.js` 的 `_onPush`）。
 *
 * ## 为什么单开一个文件
 * 仿真的"同一个 IP 换了一台别的型号"必须被看见，而宿主判断这件事只靠一个信号：
 * **推送遥测里带的连接代次**（Python 侧 `ROBOT_CONN_SEQ` + 第几个子进程）。
 * 这条链路的另一端（`lib/twin-routes.js` 拿代次去判断型号缓存作不作数）由
 * `test/twin-routes.test.mjs` 覆盖；这里只用**进程内**方式钉住"推送行 → 缓存条目"这一段。
 *
 * ## 为什么不 spawn Python
 * `test/worker.test.mjs` 要真起一个假 worker 子进程，而当前沙箱对 `spawn` + 管道 stdio
 * 报 `EPERM`（见该文件头）。这里直接调 `_onLine()` 喂协议行：`_onPush` 是纯函数式的
 * 缓存写入，不需要子进程就能验证 —— 于是这段覆盖在**没有 Python 的机器上也跑得起来**。
 *
 * 运行：node --test test/push-epoch.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { UrWorker } from '../lib/worker.js'

const IP = '1.2.3.4'
const Q = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
const TCP = [0, 0, 0.5, 0, 0, 0]

/** 构造一个 worker 实例：构造函数不 spawn，任何字段都还没动。 */
function makeWorker() {
  // 刻意不传任何解释器/目录选项：本文件**不启动**子进程（当前沙箱对 `spawn` + 管道 stdio
  // 报 EPERM），只喂协议行。`scripts/check-test-manifest.mjs` 按"是否出现 pythonBin"判断
  // 一个用例需不需要 Python —— 这里不留那个关键字，它就会正确地被算成 Node 侧用例。
  return new UrWorker({})
}

/** 喂一条**没有 id** 的推送协议行（真实 worker 的 `_twin_push_loop` 长这样）。 */
function feedPush(worker, { ip = IP, ts = 111, conn, q = Q, tcp = TCP } = {}) {
  const line = { push: 'telemetry', ip, ts, data: { q, tcp } }
  if (conn !== undefined) line.conn = conn
  worker._onLine(JSON.stringify(line))
}

test('推送行里的 conn 被缓存成 {conn, epoch}，并计入推送计数', () => {
  const worker = makeWorker()
  worker.respawnCount = 3 // 第 3 个子进程（真实场景里每次 spawn 都会 +1）
  feedPush(worker, { conn: 7 })

  const telemetry = worker.latestTelemetry(IP)
  assert.ok(telemetry, '推送必须写入缓存')
  assert.equal(telemetry.conn, 7, 'Python 侧的连接代次要原样带下来')
  assert.equal(telemetry.epoch, '3:7', '宿主看到的是「第几个子进程:连接代次」')
  assert.deepEqual(telemetry.q, Q)
  assert.deepEqual(telemetry.tcp, TCP)
  assert.equal(telemetry.ts, 111)
  assert.ok(worker.stats().pushed >= 1)
  assert.equal(worker.stats().unknownResponses, 0, '没有 id 的推送不得被记成无法匹配的响应')
})

test('★ worker 重启后代次不得撞车（同一个 conn 值属于不同的机器人会话）', () => {
  const worker = makeWorker()
  worker.respawnCount = 1
  feedPush(worker, { conn: 1 })
  const first = worker.latestTelemetry(IP).epoch

  // 同一个 IP、同一个进程内计数（新进程又是从 1 开始），但已经是**另一个**子进程了。
  worker.respawnCount = 2
  feedPush(worker, { conn: 1 })
  const second = worker.latestTelemetry(IP).epoch

  assert.equal(first, '1:1')
  assert.equal(second, '2:1')
  assert.notEqual(first, second, '★ 不同子进程的同号连接必须给出不同代次，否则宿主会以为连接没变')
})

test('旧版 worker（推送行不带 conn）⇒ conn=null / epoch=undefined（宿主退回按 TTL 判断）', () => {
  const worker = makeWorker()
  feedPush(worker, {})
  const telemetry = worker.latestTelemetry(IP)
  assert.equal(telemetry.conn, null)
  assert.equal(telemetry.epoch, undefined, '拿不到代次时必须明确"不知道"，不能编一个出来')
  // 关键：仍然要正常写缓存（位姿照用），只是型号缓存改用时间窗兜底。
  assert.deepEqual(telemetry.q, Q)
})

test('半个姿态的推送仍然被丢弃：既不覆盖好读数，也不写入代次', () => {
  const worker = makeWorker()
  feedPush(worker, { ts: 111, conn: 5 })
  assert.equal(worker.latestTelemetry(IP).conn, 5)

  feedPush(worker, { ts: 222, conn: 9, q: [1, 2] }) // 关节角不足 6 维
  const after = worker.latestTelemetry(IP)
  assert.equal(after.ts, 111, '不完整的推送不得覆盖上一笔好读数')
  assert.equal(after.conn, 5, '被丢弃的推送不得污染代次')
})

test('dispose() 连同代次一起清空（不给已死会话留"连接没变"的假证据）', () => {
  const worker = makeWorker()
  worker.respawnCount = 1
  feedPush(worker, { conn: 4 })
  assert.ok(worker.latestTelemetry(IP))
  worker.dispose()
  assert.equal(worker.latestTelemetry(IP), undefined)
})
