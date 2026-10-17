/**
 * test/sim-backend.test.mjs — 离线仿真后端（`python/ur_sim.py` + `ur_worker.py` 的仿真 op）契约。
 *
 * ## 为什么需要它
 * 仿真最大的风险不是"跑不起来"，而是**跑起来但与真机不是同一回事**，而界面上看不出来：
 *   - 正解必须与客户端 `src/client/robot/fk.js` **逐元素一致**，否则读回的 TCP 与仿真画出来的
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

# ── 5b. run_sequence：整条序列一次成型、段间不停顿；draw 的 v/a/t 透传 ──────────
vr = ur_worker.SIMS[IP]

def dispatch(op, params):
    """像 main() 那样把异常映射成错误码。

    sim_dispatch 只把带 SIM_ 前缀的异常转成错误结果；参数类异常（ValueError ⇒ BADARG）会照常
    抛出 —— main() 在协议层接住它们，探针也必须接住，否则断言 code 就会变成"探针崩了"。
    """
    try:
        data = ur_worker.route_op(op, params)
    except Exception as exc:
        return {"error": str(exc), "code": ur_worker._error_code_for(exc)}
    return data or {}

def planned_s():
    """整条轨迹的**规划时长**（_plan 写下的时间表之和，秒）。

    ⚠️ _segment_s 的首元素是 _plan 留下的 _MIN_SEGMENT_S 地板，_sample 不用它（它按
    _segment_s[1:] 累计），所以这里也只累加 [1:]。
    """
    return sum(vr._segment_s[1:])

# 两段等权（各自让同一个关节走 0.4 rad）⇒ 交界落在整条路径的正中间（u=0.5），
# 而 smoothstep 的导数在 u=0.5 正是峰值。于是"交界处仍有余速"可以被量化成比值。
q_ref = [float(x) for x in vr.advance()]
SEQ = [{"type": "joint", "q": [q_ref[0] + 0.4, q_ref[1], q_ref[2], q_ref[3], q_ref[4], q_ref[5] + 0.2]},
       {"type": "joint", "q": [q_ref[0] + 0.8, q_ref[1], q_ref[2], q_ref[3], q_ref[4], q_ref[5] + 0.4]}]
plans_before = vr.move_count
seq_reply = dispatch("run_sequence", {"ip": IP, "segments": SEQ, "_timeout_ms": 60000})
seq_planned = planned_s()
cross_t = vr._segment_s[1]
before_q = vr._sample(cross_t - 0.002)
after_q = vr._sample(cross_t + 0.002)
cross_speed = max(abs(after_q[j] - before_q[j]) for j in range(6)) / 0.004
peak_speed = 0.0
step_s = max(seq_planned, 1e-6) / 400.0
prev_q = vr._sample(0.0)
for k in range(1, 401):
    cur_q = vr._sample(step_s * k)
    peak_speed = max(peak_speed, max(abs(cur_q[j] - prev_q[j]) for j in range(6)) / step_s)
    prev_q = cur_q
out["seq"] = {
    "ok": (seq_reply.get("data") or {}).get("ok"),
    "code": seq_reply.get("code"),
    # 一次成型：整条序列只调用一次 _plan（move_count 每次 _plan 加一）
    "plans": vr.move_count - plans_before,
    # 折线 = 起点 + 每段一个航点
    "waypoints": len(vr._waypoints),
    "segments": (seq_reply.get("data") or {}).get("segment_count"),
    "note": (seq_reply.get("data") or {}).get("sim_note"),
    # 段界处速度 / 全程峰值速度：各自起停会趋近 0，连续折线在等权交界处就是峰值
    "cross_speed": cross_speed,
    "peak_speed": peak_speed,
}

# 给定 t：整段时长就是 t（_plan 的 t 语义；总时长另加 0.05 的 _MIN_SEGMENT_S 地板）
t_reply = dispatch("run_sequence", {"ip": IP, "segments": SEQ, "t": 0.4, "_timeout_ms": 60000})
out["seq_t_via_worker"] = {"code": t_reply.get("code"), "planned": round(planned_s(), 9)}

vr.run_sequence(SEQ, 0.25, 1.2, now=1000.0, total_s=0.4)
out["seq_t_direct"] = {
    "planned": round(planned_s(), 9),
    "steady_before": vr.is_steady(now=1000.0 + 0.4),
    "steady_after": vr.is_steady(now=1000.0 + 0.4 + 0.05 + 1e-6),
}
vr.run_sequence(SEQ, 0.25, 1.2, now=2000.0, total_s=1.5)
out["seq_t_long"] = {"planned": round(planned_s(), 9), "steady_at_half": vr.is_steady(now=2000.75)}

# joint 段 + cartesian 段混合：整条仍只排一次；cartesian 段要**落在给定位姿上**
mix_target = list(tcp())
mix_target[0] = mix_target[0] + 0.03
mix_reply = dispatch("run_sequence", {"ip": IP, "_timeout_ms": 60000, "segments": [
    {"type": "joint", "q": SEQ[0]["q"]},
    {"type": "cartesian", "pose": mix_target}]})
final_tcp = ur_sim.tcp_pose(vr.model, vr.target_q())
out["seq_mixed"] = {
    "code": mix_reply.get("code"),
    "waypoints": len(vr._waypoints),
    "pos_err": max(abs(final_tcp[i] - mix_target[i]) for i in range(3)),
}

# cartesian 段不可达 ⇒ **整条序列失败**（不跳过那一段、也不留下一段走了一半的轨迹）
bad_reply = dispatch("run_sequence", {"ip": IP, "_timeout_ms": 60000, "segments": [
    {"type": "joint", "q": SEQ[0]["q"]},
    {"type": "cartesian", "pose": [5.0, 5.0, 5.0, 0.0, 0.0, 0.0]}]})
out["seq_unreachable"] = {
    "code": bad_reply.get("code"),
    "message": bad_reply.get("error"),
    "waypoints": len(vr._waypoints),
}

# 参数校验：一律当场拒绝（BADARG），绝不"尽力而为"地丢掉某一段
bad_codes = {}
for label, segments in (
    ("empty", []),
    ("missing", None),
    ("not_a_list", "nope"),
    ("bad_type", [{"type": "movej", "q": [0.0] * 6}]),
    ("joint_short", [{"type": "joint", "q": [0.0] * 5}]),
    ("cartesian_no_pose", [{"type": "cartesian"}]),
    ("not_an_object", [42]),
):
    params = {"ip": IP, "_timeout_ms": 60000}
    if segments is not None:
        params["segments"] = segments
    bad_codes[label] = dispatch("run_sequence", params).get("code")
out["seq_badargs"] = bad_codes

# ── 5c. 逆解连续性门（P1-2）：多起点能解出，但解与上一航点跳变过大 ⇒ 必须拒绝 ──
# 样例是**确定性构造**的：目标 = 远构型 q_far 的正解矩阵；以 upright 作种子做局部逆解
# 不收敛，而多起点兜底会返回与 upright 差 1.757 rad 的解（腕部/构型分支跳变）。对 1 cm
# 的相邻航点来说，那是真机绝对走不出来的折线 —— 仿真必须报 SIM_UNREACHABLE，而不是把它
# 画成一条平滑轨迹再回"已到达目标"。
_GATE_MODEL = "ur12e"
_GATE_SEED = ur_sim.preset_joints("upright", _GATE_MODEL)
_GATE_LIMITS = ur_sim.joint_limits(_GATE_MODEL)
_Q_FAR = [-0.9160696228675558, -1.81558429559259, 0.7848592598072397,
          -2.2233313093287776, 0.18658642239478374, -0.6984176320545552]
_GATE_TARGET = ur_sim.fk(_GATE_MODEL, _Q_FAR)

_local_sol = ur_sim.ik(_GATE_MODEL, _GATE_TARGET, _GATE_SEED, limits=_GATE_LIMITS)
_ungated = ur_sim.ik_reachable(_GATE_MODEL, _GATE_TARGET, [_GATE_SEED], limits=_GATE_LIMITS)
_gated = ur_sim.ik_reachable(_GATE_MODEL, _GATE_TARGET, [_GATE_SEED], limits=_GATE_LIMITS,
                             max_step=ur_sim.MAX_IK_STEP_RAD)

# 同一条约束也要落实在 movel 上：目标位姿经 pose 往返再交给 move_cartesian。
_gate_vr = ur_sim.VirtualRobot("127.0.0.1", _GATE_MODEL, preset="upright")
_gate_pose = ur_sim.tcp_pose(_GATE_MODEL, _Q_FAR)
_gate_code, _gate_msg = None, ""
try:
    # step_m 远大于位移 ⇒ 只产生一个细分点（= 目标点本身），精确复现"局部不收敛/跳变大"。
    _gate_vr.move_cartesian([_gate_pose], 0.25, 1.2, step_m=10.0)
except Exception as _exc:
    _gate_code, _gate_msg = getattr(_exc, "code", None), str(_exc)

# 对照：正常的 1 cm 直线运动仍必须可解（连续性门不得把正常轨迹染红）。
_ok_vr = ur_sim.VirtualRobot("127.0.0.1", _GATE_MODEL, preset="upright")
_ok_start = ur_sim.tcp_pose(_GATE_MODEL, _ok_vr.advance())
_ok_code = None
try:
    _ok_vr.move_cartesian([[_ok_start[0] + 0.01, _ok_start[1], _ok_start[2],
                            _ok_start[3], _ok_start[4], _ok_start[5]]], 0.25, 1.2)
except Exception as _exc2:
    _ok_code = getattr(_exc2, "code", None)

out["ik_gate"] = {
    "local_ik_solved": _local_sol is not None,
    "ungated_solved": _ungated is not None,
    "ungated_jump": round(ur_sim._max_joint_step(_ungated, _GATE_SEED), 6) if _ungated else None,
    "gated_solved": _gated is not None,
    "move_code": _gate_code,
    "message_mentions_discontinuous": ("不连续" in _gate_msg),
    "message_mentions_max_step": ("0.5" in _gate_msg),
    "normal_move_code": _ok_code,
}

# draw 的 v/a/t：不传时必须与**加参数之前写死的 a=1.0 / v=0.25** 完全一致
sq_origin = list(tcp())

def draw_square(extra):
    reply = dispatch("draw_square", dict({"ip": IP, "origin": sq_origin, "border": 0.04,
                                          "_timeout_ms": 60000}, **extra))
    return {"code": reply.get("code"), "ok": (reply.get("data") or {}).get("ok"),
            "planned": round(planned_s(), 9)}

out["draw_vat"] = {
    # 先空跑一次：它从"上一段运动的终点"出发，之后几次都从同一条起点（origin）出发，
    # 于是"不传 v/a"与"显式给从前那一对"的比较不会掺进起点差异。它本身不参与比较。
    "warmup": draw_square({}),
    "default": draw_square({}),
    "explicit_old": draw_square({"v": 0.25, "a": 1.0}),
    "slow_v": draw_square({"v": 0.05}),
    "fast_v": draw_square({"v": 5.0}),
    "fast_v_a12": draw_square({"v": 5.0, "a": 1.2}),
    "soft_a": draw_square({"a": 0.05}),
    "t": draw_square({"t": 0.3}),
}

# 四个绘图工具都要接受 v/a/t 并把 t 透传成整条轨迹的时长
def draw_call(op, params):
    reply = dispatch(op, dict({"ip": IP, "_timeout_ms": 60000, "v": 0.4, "a": 0.8, "t": 0.25}, **params))
    return {"code": reply.get("code"), "ok": (reply.get("data") or {}).get("ok"),
            "planned": round(planned_s(), 9)}

pose_now = list(tcp())
out["draw_vat_tools"] = {
    "circle": draw_call("draw_circle", {"center": pose_now, "r": 0.04}),
    "square": draw_call("draw_square", {"origin": pose_now, "border": 0.04}),
    "rectangle": draw_call("draw_rectangle", {"origin": pose_now, "width": 0.04, "height": 0.03}),
    "star": draw_call("draw_star", {"center": pose_now, "side": 0.04}),
}
out["caps_motion"] = ur_worker.sim_capabilities()["motion"]

# ── 6. 仿真推送：仿真帧必须带 simulated 与 conn ───────────────────────────────
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

test('★ run_sequence：整条序列一次成型、段间不停顿，且 t 就是整段时长', () => {
  assert.ok(!out.seq.code, `run_sequence 不该报错：${out.seq.code}`)
  assert.equal(out.seq.ok, true)
  assert.equal(out.seq.segments, 2, '回包必须如实给出段数（segment_count）')
  // ① **一次成型**：整条序列只调用一次 _plan（逐段实现会是 2 次）
  assert.equal(out.seq.plans, 1, '整条序列必须只排一次时间表（逐段调用会各自起停）')
  // ② 折线 = 起点 + 每段一个航点
  assert.equal(out.seq.waypoints, 3, '两段 joint ⇒ 折线应是 起点 + 2 个航点')
  // ③ **段间不停顿**：等权交界落在路径正中（smoothstep 的导数峰值处），速度应接近全程峰值；
  //    若每段各自起停，交界处速度会趋近 0（比值 ≈0.01）。
  const ratio = out.seq.cross_speed / out.seq.peak_speed
  assert.ok(
    ratio > 0.5,
    `段界处必须仍有余速（实测 ${out.seq.cross_speed} / 峰值 ${out.seq.peak_speed} = ${ratio}）—— ` +
      '各自起停会在这里停下',
  )
  assert.match(out.seq.note, /不停顿/, '回包必须说明段间不停顿')

  // ④ t 就是整段时长：worker 透传（planned == t），且直接驱动 ur_sim 时"到底走多久"也由 t 定
  assert.ok(!out.seq_t_via_worker.code, `带 t 的调用不该报错：${out.seq_t_via_worker.code}`)
  assert.ok(Math.abs(out.seq_t_via_worker.planned - 0.4) < 1e-9,
    `worker 必须把 t 透传成 total_s，实测规划时长 ${out.seq_t_via_worker.planned}`)
  assert.ok(Math.abs(out.seq_t_direct.planned - 0.4) < 1e-9)
  // _plan 的总时长 = 规划时长 + 0.05s 的 _MIN_SEGMENT_S 地板（_sample 不用那个地板，is_steady 用）
  assert.equal(out.seq_t_direct.steady_before, false, 't=0.4 时 0.4s 处还没走完')
  assert.equal(out.seq_t_direct.steady_after, true, 't=0.4 时 0.45s 处必须已经走完')
  assert.ok(Math.abs(out.seq_t_long.planned - 1.5) < 1e-9)
  assert.equal(out.seq_t_long.steady_at_half, false, 't=1.5 时 0.75s 处不该走完（t 真的在起作用）')

  // ⑤ joint + cartesian 混合：仍只排一次，cartesian 段必须**落在给定位姿上**
  assert.ok(!out.seq_mixed.code, `混合序列不该报错：${out.seq_mixed.code}`)
  assert.ok(out.seq_mixed.waypoints >= 4, `cartesian 段必须按 1 cm 细分，实测航点 ${out.seq_mixed.waypoints}`)
  assert.ok(out.seq_mixed.pos_err < 1e-3,
    `cartesian 段的终点必须落在给定位姿上，偏差 ${out.seq_mixed.pos_err}`)

  // ⑥ 不可达的 cartesian 段 ⇒ 整条序列失败，且**一步都不走**（不跳过那一段继续）
  assert.equal(out.seq_unreachable.code, 'SIM_UNREACHABLE')
  assert.match(String(out.seq_unreachable.message), /第 2 段/,
    '报错必须指出是第几段（否则调用方不知道该改哪儿）')
  assert.equal(out.seq_unreachable.waypoints, out.seq_mixed.waypoints,
    '整条失败不得留下半条新轨迹（_plan 不该被调用）')

  // ⑦ 畸形 segments 一律当场拒绝
  for (const [label, code] of Object.entries(out.seq_badargs)) {
    assert.equal(code, 'BADARG', `segments=${label} 必须报 BADARG，实际 ${code}`)
  }
})

test('★ draw_* 的 v/a/t：不传时与从前写死的 a=1.0 / v=0.25 完全一致，给了就生效', () => {
  const d = out.draw_vat
  for (const key of Object.keys(d)) {
    assert.ok(!d[key].code, `draw_square(${key}) 不该报错：${d[key].code}`)
    assert.equal(d[key].ok, true)
  }
  // 向后兼容的判据（两问）：
  //  ① **v**：不传 v/a 与显式给出 (0.25, 1.0) 必须得到同一条时间表。两次调用都从 origin 出发，
  //     但每条腿的逆解以上一点为种子，种子链上 ~1e-4 的差异会让"规划时长"在小数点后第 5~6 位
  //     抖动 ⇒ 这里用相对容差，而不是逐位相等（v 若从 0.25 变成别的值，差异是百分之几十）。
  //  ② **a**：默认必须是 **1.0**，而不是 movel 手册的 1.2。v 很大时轨迹由加速度项定长
  //     （2·sqrt(travel/a)），两者比值恰好是 sqrt(1.2) = 1.0954 —— 1 % 容差足够分辨。
  // ⚠️ 每条腿的逆解以上一点为种子，种子链上的微小差异会让"规划时长"在小数点后第 5~6 位抖动
  //     （实测 ~1e-5 相对差），所以这里用相对容差而不是逐位相等；紧跟着一条"容差有分辨力"的
  //     校验 —— v 真的变了，差异是百分之几十，1e-3 的容差不可能把它放过去。
  const rel = (x, y) => Math.abs(x - y) / y
  assert.ok(rel(d.slow_v.planned, d.default.planned) > 0.1,
    '前提校验：v 从 0.25 降到 0.05 的差异必须远大于 1e-3 的抖动（否则下面的容差没有分辨力）')
  assert.ok(rel(d.default.planned, d.explicit_old.planned) < 1e-3,
    `不传 v/a 必须等价于从前的 v=0.25 / a=1.0，实测 ${d.default.planned} vs ${d.explicit_old.planned}`)
  const accelRatio = d.fast_v.planned / d.fast_v_a12.planned
  assert.ok(Math.abs(accelRatio - Math.sqrt(1.2)) < 0.01,
    `默认加速度必须是 1.0（不是 movel 的 1.2）：实测比值 ${accelRatio}，应为 ${Math.sqrt(1.2)}`)
  assert.ok(d.slow_v.planned > d.default.planned, 'v 变小 ⇒ 轨迹变长')
  assert.ok(d.fast_v.planned < d.default.planned, 'v 变大 ⇒ 轨迹变短（下限由加速度项决定）')
  assert.ok(d.soft_a.planned > d.default.planned, 'a 变小 ⇒ 轨迹变长')
  assert.ok(Math.abs(d.t.planned - 0.3) < 1e-9, `t=0.3 时整条轨迹的时长必须是 0.3，实测 ${d.t.planned}`)

  // 四个绘图工具都要接受 v/a/t，并把 t 用成整条轨迹的时长
  for (const [name, row] of Object.entries(out.draw_vat_tools)) {
    assert.ok(!row.code, `${name} 必须接受 v/a/t：${row.code}`)
    assert.equal(row.ok, true, `${name} 必须走到位`)
    assert.ok(Math.abs(row.planned - 0.25) < 1e-9,
      `${name} 的 t=0.25 必须成为整条轨迹的时长，实测 ${row.planned}`)
  }
})

test('★ run_sequence 在仿真的能力清单里（面板据此显示"能做"）', () => {
  assert.ok(out.caps_motion.includes('ursim_run_sequence'),
    `仿真能力清单必须包含 ursim_run_sequence：${out.caps_motion.join(', ')}`)
})

// ── P1-2：逆解连续性门 ─────────────────────────────────────────────────────
//
// 多起点兜底能解出"离上一航点很远"的解（腕部翻半圈 / 换一只"手"）。对 movel 的 1 cm
// 细分点来说，那就是真机绝对走不出来的折线，而旧实现画出来还回"已到达目标"。
// 这里钉住：① 局部不收敛、多起点能解出，但跳变 > 0.5 rad ⇒ 拒绝（SIM_UNREACHABLE）；
// ② 错误文案必须说清"多起点解与上一航点不连续"并给出阈值；③ 正常 1 cm 轨迹不受影响。

test('★ P1-2：多起点解出但与上一航点跳变过大 ⇒ SIM_UNREACHABLE（不再画出真机走不了的折线）', () => {
  const g = out.ik_gate
  assert.equal(g.local_ik_solved, false,
    '样例的前提：以 upright 为种子做局部逆解必须不收敛（否则这条用例测不到兜底路径）')
  assert.equal(g.ungated_solved, true,
    '样例的前提：多起点（不带门）确实能解出 —— 证明拒绝的原因是"不连续"而不是"解不出"')
  assert.ok(g.ungated_jump > 0.5,
    `多起点解与上一航点的跳变必须远大于门限 0.5 rad（实测 ${g.ungated_jump} rad）`)
  assert.equal(g.gated_solved, false, '★ 连续门必须拒绝这个跳变解')
  assert.equal(g.move_code, 'SIM_UNREACHABLE', 'movel 必须报 SIM_UNREACHABLE')
  assert.equal(g.message_mentions_discontinuous, true,
    '★ 错误文案必须说清"多起点解与上一航点不连续"（否则用户以为目标真的不可达）')
  assert.equal(g.message_mentions_max_step, true, '错误文案应给出跳变阈值（0.5 rad）')
  assert.equal(g.normal_move_code, null,
    '★ 正常的 1 cm 直线运动不得被连续性门误伤（可达轨迹仍必须能走）')
})

test('★ 仿真帧走的是与真机同一条推送通道，并自带 simulated / conn 标记', () => {
  assert.ok(out.push, '推送线程必须真的在推仿真帧')
  assert.equal(out.push.push, 'telemetry')
  assert.equal(out.push.ip, '127.0.0.1')
  assert.equal(out.push.simulated, true, '仿真帧必须带 simulated（仿真据此打水印）')
  assert.equal(typeof out.push.conn, 'number', '必须带连接代次（宿主据此判断型号缓存作不作数）')
  assert.equal(out.push.data.q.length, 6)
  assert.equal(out.push.id, undefined, '推送行不能有 id')
})

test('关闭仿真：幂等且随即退出仿真路径（之后走真机路径）', () => {
  assert.equal(out.stop_active, false)
  assert.equal(out.after_stop, true, '关闭后指向该地址的指令必须回到真机路径（此处会报未连接）')
})
