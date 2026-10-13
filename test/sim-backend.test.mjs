/**
 * test/sim-backend.test.mjs — 离线仿真后端（`python/ur_sim.py` + `ur_worker.py` 的仿真 op）契约。
 *
 * ## 为什么需要它
 * 仿真最大的风险不是"跑不起来"，而是**跑起来但与真机不是同一回事**，而界面上看不出来：
 *   - 正解必须与客户端 `src/client/robot/fk.js` **逐元素一致**，否则读回的 TCP 与孪生画出来的
 *     位置对不上（HUD 一套数、画面另一套数）；
 *   - 圆的几何必须与真机那条 URScript 同源（同一份途经点计算），否则"仿真里画了个圆"与
 *     "真机上画了个圆"会是两个不同的圆；
 *   - 不支持的指令必须**明确拒绝**，绝不能给一个看起来成功的结果。
 *
 * 所以这个文件做三件事：① 用 fk.js 的参考值逐元素核对 python 正解；② 跑真实运动并校验
 * 几何（画圆回到起点、沿轴位移等于给定距离）；③ 钉住"支持的做、不支持的明确拒"。
 *
 * 运行：node --test test/sim-backend.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fkChain } from '../src/client/robot/fk.js'

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url))
const kinematics = JSON.parse(readFileSync(fileURLToPath(new URL('../assets/kinematics.json', import.meta.url)), 'utf8'))

// ⚠️ 本段是嵌在 JS 模板字符串里的 Python：注释里绝不能出现反引号（会截断模板串）。
const HARNESS = `
import json, math, os, sys, tempfile, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(os.environ["UR_CE_LOG_DIR"], "sim.log"), 4096)
sys.stdout = ur_worker._LOG

IP = ur_worker.SIM_IP
out = {}

# ── 1. 正解表：14 个型号 × 3 组姿态，交给 JS 侧用 fk.js 逐元素核对 ──────────────
POSES = [[0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
         [0.3, -1.1, 1.2, -0.7, -1.4, 0.9],
         [1.0, 0.5, -0.8, 2.2, 1.1, -2.4]]
fk_table = []
import ur_sim
for model_id in ur_sim.model_ids():
    for q in POSES:
        fk_table.append({"id": model_id, "q": q, "matrix": ur_sim.fk(model_id, q)})
out["fk"] = fk_table

# ── 2. 保留地址守卫：仿真地址绝不能被当真机去连 ────────────────────────────────
try:
    ur_worker.ensure_connected(IP)
    out["guard"] = "FAILED"
except Exception as exc:
    out["guard"] = getattr(exc, "code", None)

# ── 3. 启停与参数校验 ─────────────────────────────────────────────────────────
out["unknown_model"] = ur_worker.op_sim_start({"model": "ur99"}).get("code")
out["wrong_ip"] = ur_worker.op_sim_start({"model": "ur5e", "ip": "192.168.1.5"}).get("code")
out["bad_preset"] = ur_worker.op_sim_start({"model": "ur5e", "preset": "nope"}).get("code")
started = ur_worker.op_sim_start({"model": "ur5e", "preset": "upright", "speed_scaling": 1.0})
out["started"] = {"active": started["data"]["active"], "model": started["data"]["model"],
                  "preset": started["data"]["preset"], "ip": started["data"]["ip"]}
out["models"] = ur_worker.op_sim_status({})["data"]["models"]

# ── 4. 读回与"无仿真语义"的边界 ──────────────────────────────────────────────
read = ur_worker.sim_dispatch("get_joint_pose", {"ip": IP})
out["read_q"] = read["data"]["joint_positions"]
out["read_simulated"] = read["data"]["simulated"]
out["model_op"] = ur_worker.sim_dispatch("get_robot_model", {"ip": IP})["data"]
unsupported = {}
# ⚠️ 这张清单必须只放**真的没有仿真语义**的 op：B1 之后遥测有了估算实现（见
# test/sim-telemetry.test.mjs）、B3 之后 I/O 与寄存器有了内存态实现（见 test/sim-io.test.mjs），
# 把它们列在这里会拿到真数据或 BADARG，而不是 SIM_UNSUPPORTED。
for op in ("force_mode", "get_safety_status", "load_program", "send_script",
           "set_payload", "set_tool_voltage", "speedj", "get_conveyor"):
    reply = ur_worker.sim_dispatch(op, {"ip": IP})
    unsupported[op] = reply.get("code")
out["unsupported"] = unsupported
out["passthrough_other_ip"] = ur_worker.sim_dispatch("get_joint_pose", {"ip": "1.2.3.4"}) is None

# ── 5. 运动：沿轴位移必须等于给定距离；画圆必须回到起点 ────────────────────────
def tcp():
    return ur_worker.sim_dispatch("get_tcp_pose", {"ip": IP})["data"]["tcp_pose"]

before = tcp()
move_z = ur_worker.sim_dispatch("move_z", {"ip": IP, "distance": -0.05, "_timeout_ms": 30000})
after = tcp()
out["move_z"] = {"ok": move_z["data"]["ok"],
                 "dz": after[2] - before[2],
                 "dxy": max(abs(after[0] - before[0]), abs(after[1] - before[1])),
                 "drot": max(abs(after[i] - before[i]) for i in range(3, 6))}

circle_start = tcp()
radius = 0.04
circle = ur_worker.sim_dispatch("draw_circle", {
    "ip": IP, "center": list(circle_start), "r": radius, "_timeout_ms": 60000})
circle_end = tcp()
wp0 = circle["data"]["waypoints"][0]
out["circle"] = {
    "ok": circle["data"]["ok"],
    "steps": circle["data"]["steps"],
    # 圆的几何：起点在圆上、终点回到圆的起始点（wp0 = 圆心 + r·u），姿态不变。
    "radius_err": abs(math.dist(circle_end[:3], circle_start[:3]) - radius),
    "closure_err": max(abs(circle_end[i] - wp0[i]) for i in range(6)),
    "rot_drift": max(abs(circle_end[i] - circle_start[i]) for i in range(3, 6)),
}

# 关节限位：越限必须拒绝（不能悄悄钳到边界）
limit = ur_sim.joint_limits("ur5e")[2]
out["joint_limit"] = ur_worker.sim_dispatch("movej", {"ip": IP, "q": [0.0, 0.0, 99.0, 0.0, 0.0, 0.0]})["code"]

# ── 6. 孪生推送：仿真帧必须带 simulated 与 conn ───────────────────────────────
captured = []
ur_worker._write_protocol_line = lambda body: captured.append(body)
ur_worker.TWIN_PUSH_INTERVAL_S = 0.01
import threading, time
threading.Thread(target=ur_worker._twin_push_loop, daemon=True).start()
deadline = time.time() + 5.0
while time.time() < deadline and len(captured) < 1:
    time.sleep(0.02)
out["push"] = json.loads(captured[0]) if captured else None

out["stop_active"] = ur_worker.op_sim_stop({})["data"]["active"]
out["after_stop"] = ur_worker.sim_dispatch("get_joint_pose", {"ip": IP}) is None

ur_worker._PROTOCOL_OUT.write(json.dumps(out, ensure_ascii=False) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`

// Python 侧的日志目录：沙箱里 %TEMP% 对 python 不可写，所以落在工作区的**已忽略**目录里
// （`scripts/.tmp-*` 在 .gitignore 里；正常机器上 python 自己的 tempfile 也能用，但统一更省事）。
const logDir = process.env.UR_SIM_LOG_DIR ?? fileURLToPath(new URL('../scripts/.tmp-sim-log/', import.meta.url))
mkdirSync(logDir, { recursive: true })
const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
  encoding: 'utf8',
  timeout: 300000,
  env: { ...process.env, PYTHONPATH: pythonDir, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', UR_CE_LOG_DIR: logDir },
})
assert.equal(child.status, 0, `探针失败：${child.stderr}`)
const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'))
assert.ok(line, `未拿到 JSON：${JSON.stringify(child.stdout)}`)
const out = JSON.parse(line)

test('★ python 正解与客户端 fk.js 逐元素一致（否则读回的 TCP 与画面就对不上）', () => {
  assert.equal(out.fk.length, Object.keys(kinematics).length * 3)
  let worst = 0
  for (const row of out.fk) {
    const reference = fkChain(kinematics[row.id], row.q).tool0
    for (let i = 0; i < 16; i++) worst = Math.max(worst, Math.abs(reference[i] - row.matrix[i]))
  }
  assert.ok(worst < 1e-9, `两边正解最大偏差 ${worst}（必须逐元素一致）`)
})

test('★ 保留地址是"碰不到真机"的结构性保证：连它一律拒绝', () => {
  assert.equal(out.guard, 'CONNECT_FAILED', '127.0.0.1 绝不能被当作真机连接')
  assert.equal(out.wrong_ip, 'SIM_BADARG', '仿真只能开在保留地址上')
  assert.equal(out.unknown_model, 'SIM_UNKNOWN_MODEL', '未知型号必须报错并给出可用清单')
  assert.equal(out.bad_preset, 'SIM_BADARG', '未知起始姿态必须报错')
  assert.equal(out.started.active, true)
  assert.equal(out.started.model, 'UR5e', '型号要按真机的写法回报（UR5e 而不是 ur5e）')
  assert.equal(out.started.ip, '127.0.0.1')
  assert.ok(out.models.length >= 14, `型号清单必须来自运动学表，实际 ${out.models.length}`)
})

test('★ 读回可用，且不支持的指令一律明确回报（绝不给假的成功）', () => {
  assert.equal(out.read_q.length, 6)
  assert.equal(out.read_simulated, true, '仿真读回必须自带 simulated 标记')
  assert.equal(out.model_op.simulated, true)
  assert.equal(out.model_op.remote_control, true)
  const codes = Object.entries(out.unsupported)
  assert.ok(codes.length >= 8)
  for (const [op, code] of codes) {
    assert.equal(code, 'SIM_UNSUPPORTED', `${op} 必须明确回报"无仿真语义"，实际 ${code}`)
  }
  assert.equal(out.passthrough_other_ip, true, '非仿真地址必须原样走真机路径（不能被拦截）')
})

test('★ 运动是运动学级的真实位移：沿轴位移等于给定距离、姿态不变、画圆闭合', () => {
  assert.equal(out.move_z.ok, true)
  assert.ok(Math.abs(out.move_z.dz - (-0.05)) < 1e-6, `沿 z 位移应等于 -0.05，实际 ${out.move_z.dz}`)
  assert.ok(out.move_z.dxy < 1e-6, '沿基座 z 移动不得带来 x/y 漂移')
  assert.ok(out.move_z.drot < 1e-6, '沿基座轴平移必须保持姿态不变')

  assert.equal(out.circle.ok, true)
  assert.ok(out.circle.steps >= 16, `圆至少要细分 16 步，实际 ${out.circle.steps}`)
  // 终点必须落在圆上（离圆心 = 半径）并且**回到圆的起始点**（= 圆心 + r·u）。
  assert.ok(out.circle.radius_err < 1e-6, `终点必须落在半径为 r 的圆上，偏差 ${out.circle.radius_err}`)
  assert.ok(out.circle.closure_err < 1e-6, `画一整圈必须回到起点，偏差 ${out.circle.closure_err}`)
  assert.ok(out.circle.rot_drift < 1e-6, `画圆过程中姿态必须保持（真机那条 URScript 的四个点姿态相同），漂移 ${out.circle.rot_drift}`)

  assert.equal(out.joint_limit, 'SIM_JOINT_LIMIT', '越限目标必须拒绝，不能悄悄钳到边界')
})

test('★ 仿真帧走的是与真机同一条推送通道，并自带 simulated / conn 标记', () => {
  assert.ok(out.push, '推送线程必须真的在推仿真帧')
  assert.equal(out.push.push, 'telemetry')
  assert.equal(out.push.ip, '127.0.0.1')
  assert.equal(out.push.simulated, true, '仿真帧必须带 simulated（孪生据此打水印）')
  assert.equal(typeof out.push.conn, 'number', '必须带连接代次（宿主据此判断型号缓存作不作数）')
  assert.equal(out.push.data.q.length, 6)
  assert.equal(out.push.id, undefined, '推送行不能有 id')
})

test('关闭仿真：幂等且随即退出仿真路径（之后走真机路径）', () => {
  assert.equal(out.stop_active, false)
  assert.equal(out.after_stop, true, '关闭后指向该地址的指令必须回到真机路径（此处会报未连接）')
})
