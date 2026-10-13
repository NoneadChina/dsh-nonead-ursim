/**
 * test/conn-epoch.test.mjs — 仿真"换了一台机器人就换模型"的 **Python 半**。
 *
 * ## 这条链要修的是什么
 * 型号在一台机器人的连接存续期间不变，所以宿主按 IP 缓存它是对的；但**同一个 IP 换一台
 * 别的型号**时它必然变。worker 侧唯一可靠的信号是"连接对象换了新的"，于是：
 *
 *   1. `_twin_push_snapshot` 必须**在 RTDE 会话死掉时停止推送**。`_rtde_field` 读的是
 *      `model.dataDir` 里**最后一笔**值，它在掉线后依然在 —— 继续推等于用当下的时间戳发
 *      掉线前的读数：仿真看起来一切正常却冻住，而且因为推送"一直新鲜"，宿主永远不会回退到
 *      显式读（**只有显式读会重连、从而发现换了一台机器人**）。
 *   2. `ensure_connected` 每新建一条连接就把 `ROBOT_CONN_SEQ[ip]` **+1** 并**只增不减**
 *      （清零会让新旧代次撞车，那恰好会在我要修的场景里失效）。
 *   3. 推送行必须带上这个代次（`conn`），宿主据此判断被缓存的型号还作不作数。
 *
 * 宿主那一半（拿代次要重读型号）由 `test/twin-routes.test.mjs` 覆盖；推送行 → 缓存条目的
 * 解析由 `test/push-epoch.test.mjs`（纯 Node，无需 Python）覆盖。
 *
 * 运行：node --test test/conn-epoch.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url))

// ⚠️ 本段是嵌在 JS 模板字符串里的 Python：**注释里绝不能出现反引号**，否则会截断模板串。
const HARNESS = `
import json, os, sys, tempfile, threading, time, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(tempfile.mkdtemp(prefix="ur-ce-"), "t.log"), 4096)
sys.stdout = ur_worker._LOG

IP = "9.9.9.9"
out = {}


class FakeRTDE:
    def __init__(self, running):
        self._running = running

    def isRunning(self):
        return self._running


class FakeConnector:
    def __init__(self, running):
        self.RTDE = FakeRTDE(running)

    def close(self):
        pass


class FakeModel:
    def __init__(self):
        self.dataDir = {"actual_q": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
                        "actual_TCP_pose": [0.0, 0.0, 0.5, 0.0, 0.0, 0.0]}


class FakeRobot:
    def __init__(self, running):
        self.robotConnector = FakeConnector(running)


# ── 1. 存活门：会话死了就一帧都不推 ────────────────────────────────────────
ur_worker.ROBOTS[IP] = FakeRobot(False)
ur_worker.ROBOT_MODELS[IP] = FakeModel()
out["dead"] = ur_worker._twin_push_snapshot(IP)
ur_worker.ROBOTS[IP] = FakeRobot(True)
out["live"] = ur_worker._twin_push_snapshot(IP)
out["missing"] = ur_worker._twin_push_snapshot("8.8.8.8")

# ── 2. 连接代次：每次新建连接 +1，健康连接不加，断开也不清零 ────────────────
def fake_connect(ip):
    return FakeRobot(True), FakeModel()


ur_worker._connect_or_exit = fake_connect
run = []
for _ in range(3):
    ur_worker.ROBOTS.pop(IP, None)
    ur_worker.ROBOT_MODELS.pop(IP, None)
    ur_worker.ensure_connected(IP)
    run.append(ur_worker.ROBOT_CONN_SEQ.get(IP))
out["seq_run"] = run

before = ur_worker.ROBOT_CONN_SEQ[IP]
ur_worker.ensure_connected(IP)
out["seq_stable"] = ur_worker.ROBOT_CONN_SEQ[IP] == before

ur_worker.op_disconnect({"ip": IP})
out["seq_after_disconnect"] = ur_worker.ROBOT_CONN_SEQ.get(IP)

# ── 3. 推送行里真的带了 conn（截获协议写，不真的往 stdout 写）───────────────
# 刻意**不还原** _write_protocol_line：还原之后那条线程会继续往 stdout 写真实的推送行，
# 而它们同样以 "{" 开头，会把下面那行 JSON 结果挤到后面去（读到推流而不是结果）。
captured = []
ur_worker._write_protocol_line = lambda body: captured.append(body)
ur_worker.TWIN_PUSH_INTERVAL_S = 0.01
ur_worker.ROBOTS[IP] = FakeRobot(True)
ur_worker.ROBOT_MODELS[IP] = FakeModel()
threading.Thread(target=ur_worker._twin_push_loop, daemon=True).start()
deadline = time.time() + 5.0
while time.time() < deadline and len(captured) < 2:
    time.sleep(0.02)
out["push_lines"] = captured[:2]

ur_worker._PROTOCOL_OUT.write(json.dumps(out, ensure_ascii=False) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`

const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
  encoding: 'utf8',
  timeout: 180000,
  env: { ...process.env, PYTHONPATH: pythonDir, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' },
})
assert.equal(child.status, 0, `探针失败：${child.stderr}`)
const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'))
assert.ok(line, `未拿到 JSON：${JSON.stringify(child.stdout)}`)
const out = JSON.parse(line)

test('★ RTDE 会话不在跑时一帧都不推（绝不用旧缓存冒充实时读数）', () => {
  assert.equal(out.dead, null, '掉线的会话必须闭嘴，否则仿真会"看起来正常却冻住"');
  assert.deepEqual(
    out.live,
    { q: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6], tcp: [0, 0, 0.5, 0, 0, 0] },
    '会话健康时必须照常推（这是仿真在运动期间仍出数的唯一通道）',
  );
  assert.equal(out.missing, null, '没有这台机器人时返回 None 而不是抛错');
});

test('★ 连接代次每次新建连接 +1，健康连接不 +1，断开也不清零', () => {
  assert.deepEqual(out.seq_run, [1, 2, 3], '三次新建连接必须是严格递增的三个不同代次');
  assert.equal(out.seq_stable, true, '连接健康时不得 +1（否则宿主每帧都会去重读型号）');
  assert.equal(
    out.seq_after_disconnect,
    3,
    '★ 断开不得清零：清零会让下一轮的 1 与上一轮的 1 撞车，宿主就会以为"连接没变"',
  );
});

test('★ 推送行携带 conn（宿主据此判断被缓存的型号还作不作数）', () => {
  assert.equal(out.push_lines.length, 2, '推送线程必须真的在推');
  for (const body of out.push_lines) {
    const msg = JSON.parse(body);
    assert.equal(msg.push, 'telemetry');
    assert.equal(msg.ip, '9.9.9.9');
    assert.equal(msg.conn, out.seq_after_disconnect, '推送行必须带上当前连接代次');
    assert.equal(msg.id, undefined, '推送行不能有 id（那是与响应区分的唯一标志）');
    assert.equal(msg.data.q.length, 6);
  }
});
