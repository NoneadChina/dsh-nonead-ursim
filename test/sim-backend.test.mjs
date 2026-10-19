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
    """像 main() 那样把结果/异常收敛成**协议信封**（成功仍原样返回 handler 的 payload）。

    sim_dispatch 只把带 SIM_ 前缀的异常转成错误结果；参数类异常（ValueError ⇒ BADARG）会照常
    抛出 —— main() 在协议层接住它们，探针也必须接住，否则断言 code 就会变成"探针崩了"。
    失败一律补上 ok: False：main() 的失败信封就是 ok/data/error/code 四件套，探针据此能同时
    钉住"拒绝"与"不是假装成功"。
    """
    try:
        data = ur_worker.route_op(op, params)
    except Exception as exc:
        return {"error": str(exc), "code": ur_worker._error_code_for(exc), "ok": False}
    if isinstance(data, dict) and "error" in data:
        return {"error": data["error"], "code": data.get("code", "HUGE"),
                "ok": False, "data": data.get("data")}
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

# ── 5d. jog_rotate：绕指定轴**增量**旋转 TCP（面板方向盘的 rotate 模式）─────────
#
# 关键不变量是"只改姿态、不改位置"：本 op 是**绕 TCP 的姿态重定向**（不搬位置），位置一动就
# 说明轴系或乘法搞错了（工具系必须右乘、基座系必须左乘）。比对用 get_target_values —— 它给的是
# target_q 的正解，运动走完后就是实际位姿，且是**位姿**读数（不是只有关节角）。
#
# 姿态一律走**矩阵**：(rx,ry,rz) 是轴角，同一姿态有等价表示（轴取反、角 2π−θ），本用例执行到
# 这一步时 |rotvec| 就在 π 附近 —— 逐分量比较会得出"转错了"的假象。
def target_pose():
    return ur_worker.route_op("get_target_values", {"ip": IP})["data"]["target_tcp_pose"]

# 轴映射**硬写在测试里**：绝不从被测实现借 _JOG_ROTATE_AXES。借用的话，把被测映射改成
# {rx:2, ry:1, rz:0}，测试会跟着用错映射，两条用例仍然全绿（实测 matrix_err 2e-14）——
# 等于自己证自己。rx ⇒ [δ,0,0]、ry ⇒ [0,δ,0]、rz ⇒ [0,0,δ] 是这份契约的一部分。
JOG_AXES = {"rx": 0, "ry": 1, "rz": 2}

def jog_delta(axis, delta_rad):
    v = [0.0, 0.0, 0.0]
    v[JOG_AXES[axis]] = delta_rad
    return v

def rel_axis_offset(rel, axis):
    """相对旋转 R_rel 的轴与单位轴 e_axis 的夹角（弧度）—— **测试侧独立**算。

    只取反对称部分 (R−Rᵀ)/2 = sinθ·[k]× 再归一化；**不借用**被测 _matrix_to_rotvec
    （那个函数有自己的 π 分支，拿它来验轴映射等于让被测实现给自己打分）。
    方向取绝对值：δ 为负时轴自然是 −e_i，"绕哪条轴"与符号无关。
    """
    v = [float(rel[2][1] - rel[1][2]), float(rel[0][2] - rel[2][0]),
         float(rel[1][0] - rel[0][1])]
    n = math.sqrt(sum(x * x for x in v))
    if n < 1e-12:
        return None  # θ≈0/π：反对称部分退化，轴没有定义
    return math.acos(min(1.0, abs(v[axis] / n)))

def jog(axis, delta_rad, frame):
    return dispatch("jog_rotate", {"ip": IP, "axis": axis, "delta_rad": delta_rad,
                                   "frame": frame, "_timeout_ms": 60000})

def jog_effect(axis, delta_rad, frame):
    before = target_pose()
    reply = jog(axis, delta_rad, frame)
    after = target_pose()
    data = reply.get("data") or {}
    info = data.get("jog_rotate") or {}
    from_pose, target = info.get("from_pose"), info.get("target_pose")
    composed, axis_offset = None, None
    if target:
        r_from = ur_worker._rotvec_to_matrix(from_pose[3:6])
        r_delta = ur_worker._rotvec_to_matrix(jog_delta(axis, delta_rad))
        r_target = ur_worker._rotvec_to_matrix(target[3:6])
        # 工具系右乘 R_from·R_δ、基座系左乘 R_δ·R_from —— 用**矩阵等价**判合成对不对，
        # 绝不逐分量比 δ（严格合成下三个分量会一起变）。
        composed = (r_from.dot(r_delta) if frame == "tool" else r_delta.dot(r_from))
        # 独立断言：把"相对旋转"单独拎出来看轴。
        #   工具系：R_fromᵀ·R_target = R_δ（在**工具系**基下表达）；
        #   基座系：R_target·R_fromᵀ = R_δ（在**基座系**基下表达）。
        # 两种情形的旋转轴都必须是所选坐标系的单位轴 e_i —— 轴映射写错时这里必红。
        rel = r_from.T.dot(r_target) if frame == "tool" else r_target.dot(r_from.T)
        axis_offset = rel_axis_offset(rel, JOG_AXES[axis])
    return {"code": reply.get("code"), "ok": data.get("ok"),
            "d_pos": max(abs(after[i] - before[i]) for i in range(3)),
            # from→target 的旋转夹角必须恰好是 |δ|：合成后的**相对**旋转就是 R_axis(δ)
            # （工具系的 R_from·R_δ·R_fromᵀ 是它的共轭，夹角不变）。from→after 是"真的转到了"。
            "angle_target": (ur_worker._rotation_angle_between(from_pose[3:6], target[3:6])
                             if target else None),
            "angle_after": (ur_worker._rotation_angle_between(from_pose[3:6], after[3:6])
                            if target else None),
            "matrix_err": (float(max(abs(float(x)) for x in (composed - r_target).flatten()))
                           if target else None),
            "axis_offset": axis_offset,
            "target_err": (ur_worker._rotation_angle_between(target[3:6], after[3:6])
                           if target else None),
            "jog": info}

out["jog_rotate_tool"] = jog_effect("rz", 0.1, "tool")
out["jog_rotate_base"] = jog_effect("rx", 0.05, "base")
# 大增量：δ=0.6 超过 ur_sim.MAX_IK_STEP_RAD（0.5 rad）。仿真对纯旋转只做一次逆解，不拆段
# 就会被判成"构型分支跳变"并回 SIM_UNREACHABLE，而同样的 movel 真机能执行 —— 拆段后必须
# 成功，且总旋转角仍≈0.6（每段从上一段的**实际**位姿续算，误差不累加）。
out["jog_rotate_large"] = jog_effect("rz", 0.6, "tool")

# BADARG 回归：未知轴 / 平移轴名 / 缺 delta / NaN / 0 / 未知 frame —— 一律当场拒绝，
# 既不"尽力而为"挑一条轴，也不把 0 当成"转了 0 度"当成功返回。
def jog_bad(params):
    reply = dispatch("jog_rotate", dict({"ip": IP, "_timeout_ms": 60000}, **params))
    return {"code": reply.get("code"), "ok": reply.get("ok")}

out["jog_rotate_badargs"] = {
    "unknown_axis": jog_bad({"axis": "nope", "delta_rad": 0.1, "frame": "tool"}),
    "translation_axis": jog_bad({"axis": "x", "delta_rad": 0.1, "frame": "tool"}),
    "missing_delta": jog_bad({"axis": "rz", "frame": "tool"}),
    "nan_delta": jog_bad({"axis": "rz", "delta_rad": float("nan"), "frame": "tool"}),
    "zero_delta": jog_bad({"axis": "rz", "delta_rad": 0.0, "frame": "tool"}),
    "world_frame": jog_bad({"axis": "rz", "delta_rad": 0.1, "frame": "world"}),
}

# _matrix_to_rotvec 是 _rotvec_to_matrix 的逆。θ≈π 时反对称部分退化（sinθ→0），是整个转换里
# 唯一需要单独定轴的分支 —— 必须用往返把它钉死，否则"看起来能转"的实现在 π 附近会翻向。
# 先探测函数是否存在：缺它时探针仍要出结果，好让断言说清是"没实现"而不是"探针崩了"。
#
# 用例的取舍：
#   · pi_mixed：轴分量**带负号**（[-0.6, 0.8, 0]·π）。π 分支靠 m[i,j] 的**符号**解出其余维，
#     只取对角/只取绝对值、丢掉交叉项的假实现会在这一条翻向（全正的三条反而是它的舒适区）。
#   · band / band_tilted：π−θ 落在 (1e-6, 4e-6) —— 旧的 scale = θ/(2 sinθ) 在这个窄带里把
#     acos 的绝对误差放大 1/sinθ，往返矩阵误差到 1.7e-4（超出本用例自称的 1e-6）。改法：
#     反对称向量归一化后乘 θ，不再除以 sinθ。
_reverse = getattr(ur_worker, "_matrix_to_rotvec", None)
if _reverse is None:
    out["rotvec_roundtrip"] = None
else:
    out["rotvec_roundtrip"] = {}
    for _label, _rv in (("zero", [0.0, 0.0, 0.0]),
                        ("small", [0.02, -0.03, 0.05]),
                        ("generic", [0.6, -1.1, 2.0]),
                        ("near_pi", [0.0, 0.0, math.pi - 1e-9]),
                        ("pi", [0.0, 0.0, math.pi]),
                        ("pi_tilted", [math.pi * 0.6, math.pi * 0.8, 0.0]),
                        ("pi_mixed", [-math.pi * 0.6, math.pi * 0.8, 0.0]),
                        ("band", [0.0, 0.0, math.pi - 2e-6]),
                        ("band_tilted", [math.pi * 0.6 - 2e-6, math.pi * 0.8 - 2e-6, 0.0])):
        _m = ur_worker._rotvec_to_matrix(_rv)
        _back = _reverse(_m)
        out["rotvec_roundtrip"][_label] = {
            "angle": ur_worker._rotation_angle_between(_rv, _back),
            "matrix": float(max(abs(float(x)) for x in (ur_worker._rotvec_to_matrix(_back) - _m).flatten())),
        }

# ── 5e. set_speed_scaling：运行中调速 —— 仿真**原地改**，绝不重建 ──────────────
#
# 这个 op 存在的唯一理由：面板滑块要在**不重建仿真**的前提下改倍率。VirtualRobot 的构造会把
# q 重置成起始位姿，所以"位姿与关节角逐值不变"才是核心断言 —— 只看"读回 0.5"抓不到重建
# （重建完再设一次倍率，读回照样是 0.5，但机械臂已经跳回去了）。

def sim_state():
    q = ur_worker.route_op("get_joint_pose", {"ip": IP})["data"]["joint_positions"]
    pose = ur_worker.route_op("get_tcp_pose", {"ip": IP})["data"]["tcp_pose"]
    return [float(x) for x in q], [float(x) for x in pose]

def set_scaling(fraction):
    params = {"ip": IP}
    if fraction is not None:
        params["fraction"] = fraction
    return dispatch("set_speed_scaling", params)

q_before, pose_before = sim_state()
instance_before = id(ur_worker.SIMS[IP])
apply_reply = set_scaling(0.5)
q_after, pose_after = sim_state()
apply_data = apply_reply.get("data") or {}
out["set_scaling"] = {
    "code": apply_reply.get("code"),
    "message": apply_reply.get("message"),
    "ok": apply_data.get("ok"),
    "fraction": apply_data.get("fraction"),
    "requested": apply_data.get("requested"),
    "actual": apply_data.get("actual"),
    "read_back": dispatch("get_speed_scaling", {"ip": IP})["data"]["speed_scaling"],
    "q_before": q_before,
    "q_after": q_after,
    "pose_before": pose_before,
    "pose_after": pose_after,
    # 同一个 VirtualRobot 实例：换了实例就说明被重建了（哪怕数值碰巧一样）
    "same_instance": id(ur_worker.SIMS[IP]) == instance_before,
}

# 越界：0.0001 → 0.01（下界），9 → 1.0（上界）；requested 必须原样回显客户端给的值。
low_reply = set_scaling(0.0001)
low_data = low_reply.get("data") or {}
low_read = dispatch("get_speed_scaling", {"ip": IP})["data"]["speed_scaling"]
high_reply = set_scaling(9)
high_data = high_reply.get("data") or {}
high_read = dispatch("get_speed_scaling", {"ip": IP})["data"]["speed_scaling"]
out["set_scaling_clamp"] = {
    "low": {"code": low_reply.get("code"), "fraction": low_data.get("fraction"),
            "requested": low_data.get("requested"), "read_back": low_read},
    "high": {"code": high_reply.get("code"), "fraction": high_data.get("fraction"),
             "requested": high_data.get("requested"), "read_back": high_read},
}

# 非法参数：缺失 / NaN / Infinity / 非数值 —— 一律 BADARG，绝不"猜一个倍率"继续跑。
out["set_scaling_badargs"] = {
    "missing": set_scaling(None).get("code"),
    "nan": set_scaling(float("nan")).get("code"),
    "inf": set_scaling(float("inf")).get("code"),
    "text": set_scaling("fast").get("code"),
}

# ── 5f. 速度流（speedl / stopl / 看门狗）：长按连续点动的后端 ─────────────────
#
# 时间一律**显式传入**（不 sleep）：speedl 用真实时钟锚定（它没有 now 参数），随后用
# anchor + Δ 推进 vr.advance(now=...)，于是位移可以按 v·Δt 精确断言。
# 这里直接驱动 SIMS[IP] 这个 VirtualRobot —— 与推送线程 / 读回走的是**同一个**
# advance()，而测试要的"连续两帧"正是它。
VX = 0.08
vr = ur_worker.SIMS[IP]
speedl = dispatch("speedl", {"ip": IP, "xd": [VX, 0.0, 0.0, 0.0, 0.0, 0.0],
                             "frame": "base", "ttl_ms": 1000})
anchor = vr._last_advance_at
p0 = ur_sim.tcp_pose(vr.model, list(vr.q))
vr.advance(now=anchor)            # 首帧：Δt=0，绝不能跳
p_first = ur_sim.tcp_pose(vr.model, vr.q)
vr.advance(now=anchor + 0.05)     # Δt=0.05
p_mid = ur_sim.tcp_pose(vr.model, vr.q)
vr.advance(now=anchor + 0.10)     # Δt=0.05
p_end = ur_sim.tcp_pose(vr.model, vr.q)
out["speedl"] = {
    "code": speedl.get("code"),
    "ok": (speedl.get("data") or {}).get("ok"),
    "twist": (speedl.get("data") or {}).get("twist"),
    "frame": (speedl.get("data") or {}).get("frame"),
    "ttl_ms": (speedl.get("data") or {}).get("ttl_ms"),
    "first_step": math.dist(p_first[:3], p0[:3]),
    "dx": p_end[0] - p0[0],
    "dyz": max(abs(p_end[1] - p0[1]), abs(p_end[2] - p0[2])),
    "expected": VX * 0.10,
    "monotonic": (p_first[0] >= p0[0] - 1e-12
                  and p_mid[0] > p_first[0] and p_end[0] > p_mid[0]),
    "q_len": len(vr.q),
}

# 停止：stopl 之后继续推进，位置必须**完全不再变化**
stopl = dispatch("stopl", {"ip": IP})
p_stop = ur_sim.tcp_pose(vr.model, list(vr.q))
vr.advance(now=anchor + 0.20)
p_after_stop = ur_sim.tcp_pose(vr.model, vr.q)
vr.advance(now=anchor + 0.40)
p_after_stop2 = ur_sim.tcp_pose(vr.model, vr.q)
out["stopl"] = {
    "code": stopl.get("code"),
    "stopped": (stopl.get("data") or {}).get("stopped"),
    "drift": math.dist(p_after_stop[:3], p_stop[:3]),
    "drift_later": math.dist(p_after_stop2[:3], p_after_stop[:3]),
    "twist": list(vr._twist),
    "active": vr.twist_state(now=anchor + 0.40)["active"],
}

# 看门狗：ttl_ms=200 → 截止时刻之后没有任何新指令，速度必须自己归零。
VY = 0.06
watch = dispatch("speedl", {"ip": IP, "xd": [0.0, VY, 0.0, 0.0, 0.0, 0.0],
                            "ttl_ms": 200})
anchor2 = vr._last_advance_at
p_w0 = ur_sim.tcp_pose(vr.model, list(vr.q))
vr.advance(now=anchor2 + 0.10)    # 仍在看门狗内 → 走
p_w1 = ur_sim.tcp_pose(vr.model, vr.q)
vr.advance(now=anchor2 + 0.30)    # 已过截止（0.2s）→ 自动归零
p_w2 = ur_sim.tcp_pose(vr.model, vr.q)
vr.advance(now=anchor2 + 0.50)    # 继续推进也不能再动
p_w3 = ur_sim.tcp_pose(vr.model, vr.q)
out["watchdog"] = {
    "ttl_ms": (watch.get("data") or {}).get("ttl_ms"),
    "moved_inside": math.dist(p_w1[:3], p_w0[:3]),
    "moved_after": math.dist(p_w2[:3], p_w1[:3]),
    "moved_later": math.dist(p_w3[:3], p_w2[:3]),
    "twist": list(vr._twist),
    "active": vr.twist_state(now=anchor2 + 0.50)["active"],
}

# 不可达方向：目标位姿跳出去 100 m ⇒ 逆解必失败。要求**不抛异常**、关节角保持、
# twist 清零，并留下"被拒"证据（status / twist_state 里能看出来）。
vr.set_twist([1000.0, 0.0, 0.0, 0.0, 0.0, 0.0], frame="base", ttl_s=1.0,
             now=anchor2 + 1.0)
q_before = list(vr.q)
pose_before = ur_sim.tcp_pose(vr.model, q_before)
raised = None
try:
    vr.advance(now=anchor2 + 1.1)
except Exception as _exc:  # noqa: BLE001 —— 这里就是要证明它不抛
    raised = repr(_exc)
pose_after = ur_sim.tcp_pose(vr.model, vr.q)
state = vr.twist_state(now=anchor2 + 1.2)
_status = ur_worker.sim_dispatch("status", {"ip": IP}) or {}
status_twist = (_status.get("data") or {}).get("twist") or {}
out["twist_unreachable"] = {
    "raised": raised,
    "moved": math.dist(pose_after[:3], pose_before[:3]),
    "joints_same": max(abs(vr.q[i] - q_before[i]) for i in range(6)),
    "twist": list(vr._twist),
    "rejected": state["rejected"],
    "active": state["active"],
    "status_rejected": status_twist.get("rejected"),
    "status_reason": status_twist.get("reject_reason"),
}

# 工具系：速度沿**工具 x 轴**。upright 位姿下工具 x = 基座 +y，所以"误把 frame 当
# base"会得到 +x 位移 —— 两种坐标系的位移方向正交，这条用例能真正分辨它们。
vr.set_twist([0.04, 0.0, 0.0, 0.0, 0.0, 0.0], frame="tool", ttl_s=1.0,
             now=anchor2 + 2.0)
p_t0 = ur_sim.tcp_pose(vr.model, list(vr.q))
vr.advance(now=anchor2 + 2.1)
p_t1 = ur_sim.tcp_pose(vr.model, vr.q)
_R = ur_sim.matrix_from_axis_angle(0.0, 0.0, 0.0, p_t0[3], p_t0[4], p_t0[5])
_tool_x = [_R[0], _R[1], _R[2]]
_actual = [p_t1[i] - p_t0[i] for i in range(3)]
_expected = [0.04 * 0.1 * _tool_x[i] for i in range(3)]
# 若 frame 被误当成 base，位移会是 [0.004, 0, 0]；把它与工具系期望的差当成"分辨力"。
_base_expected = [0.04 * 0.1, 0.0, 0.0]
out["twist_tool_frame"] = {
    "actual": _actual,
    "expected": _expected,
    "base_expected": _base_expected,
    "err": math.dist(_actual, _expected),
    "discrimination": math.dist(_expected, _base_expected),
    "tool_x": _tool_x,
}
vr.stop_twist()

# 全零 twist 等价于 stop（协议允许全零，但必须按停止处理）
_zero = ur_sim.VirtualRobot("127.0.0.1", "ur5e", preset="upright")
p_z_start = ur_sim.tcp_pose(_zero.model, _zero.q)
_zero.set_twist([0.1, 0.0, 0.0, 0.0, 0.0, 0.0], frame="base", ttl_s=1.0, now=3000.0)
_zero.advance(now=3000.1)
p_z0 = ur_sim.tcp_pose(_zero.model, _zero.q)
_zero.set_twist([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], frame="base", ttl_s=1.0, now=3000.2)
_zero.advance(now=3000.3)
p_z1 = ur_sim.tcp_pose(_zero.model, _zero.q)
out["twist_zero"] = {
    "moved_before": math.dist(p_z0[:3], p_z_start[:3]),
    "moved_after": math.dist(p_z1[:3], p_z0[:3]),
    "twist": list(_zero._twist),
    "active": _zero.twist_state(now=3000.3)["active"],
}

# 续命语义：面板每 ~100ms 发一条 velocity，而推送线程 20Hz 调 advance()。若"续命"时
# 直接改锚点，两条指令之间那段时间就会丢 —— 按住不放会**越走越慢**（修前实测 1s 只走了
# 请求速度的 64%）。这里用显式 now 构造一次续命，断言那段时间被补上。
_cont = ur_sim.VirtualRobot("127.0.0.1", "ur5e", preset="upright")
_cont.set_twist([0.05, 0.0, 0.0, 0.0, 0.0, 0.0], frame="base", ttl_s=0.4, now=4000.0)
_cont.advance(now=4000.05)
_p_c0 = ur_sim.tcp_pose(_cont.model, _cont.q)
_cont.set_twist([0.05, 0.0, 0.0, 0.0, 0.0, 0.0], frame="base", ttl_s=0.4, now=4000.10)
_p_c1 = ur_sim.tcp_pose(_cont.model, _cont.q)
_cont.stop_twist()
out["twist_renew"] = {
    "dx": _p_c1[0] - _p_c0[0],
    "expected": 0.05 * 0.05,
}

# op 层的 ttl_ms：缺省 400、越界钳到 100 / 2000（**钳位**而不是报错）
def speedl_ttl(extra):
    params = {"ip": IP, "xd": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]}
    params.update(extra)
    return (dispatch("speedl", params).get("data") or {}).get("ttl_ms")

out["speedl_ttl"] = {
    "default": speedl_ttl({}),
    "low": speedl_ttl({"ttl_ms": 0}),
    "high": speedl_ttl({"ttl_ms": 99999}),
}
out["speedl_badargs"] = {
    "bad_frame": dispatch("speedl", {"ip": IP, "xd": [0.0] * 6,
                                     "frame": "world"}).get("code"),
    "short": dispatch("speedl", {"ip": IP, "xd": [0.0] * 5}).get("code"),
    "nan": dispatch("speedl", {"ip": IP,
                               "xd": [float("nan")] + [0.0] * 5}).get("code"),
}

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

// ── jog_rotate：绕轴增量旋转（面板方向盘的 rotate 模式）────────────────────────
//
// 语义：**严格旋转合成**，两个坐标系同一套数学、只差乘法顺序：
//   · `frame='tool'` 绕**工具自身**轴 ⇒ 右乘 `R_target = R_current · R_δ`；
//   · `frame='base'` 绕**基座**轴   ⇒ 左乘 `R_target = R_δ · R_current`（δ 的 rx/ry/rz
//     分别对应基座 x/y/z 轴）。
// 本 op 是**绕 TCP 的姿态重定向**：只改姿态、不搬位置（若真绕基座原点转，位置会动；这里刻意
// 不搬 —— 面板点动方向盘要的是"原地改朝向"）。因此位置必须保持不变。
// 姿态一律用**矩阵等价**判定：严格合成下 rx/ry/rz 三个分量会一起变，且 |rotvec| 在 π 附近时
// 轴角有等价表示，逐分量比较既会误报也会漏报。

test('★ jog_rotate：绕工具 Z 轴 = R_from·R_δ（右乘），且 TCP 位置不变', () => {
  const r = out.jog_rotate_tool
  assert.ok(!r.code, `jog_rotate(frame=tool) 不该报错：${r.code}`)
  assert.equal(r.ok, true)
  assert.equal(r.jog.axis, 'rz', '回包必须如实给出这次旋转的轴（便于核对/审计）')
  assert.equal(r.jog.frame, 'tool')
  assert.ok(Math.abs(r.jog.delta_rad - 0.1) < 1e-12, `delta_rad 必须原样回报，实测 ${r.jog.delta_rad}`)
  assert.equal(r.jog.from_pose.length, 6)
  assert.equal(r.jog.target_pose.length, 6)
  assert.ok(r.d_pos < 1e-6, `绕工具系轴改姿态后 TCP 位置必须不变，实测位移 ${r.d_pos}`)
  // ★ 独立断言：R_fromᵀ·R_target 就是 R_δ（工具系基），其旋转轴必须落在**工具系单位轴 e_z**
  // 上。轴映射写错（rx/rz 互换）时这里必红 —— 不依赖被测的 _JOG_ROTATE_AXES 或 _matrix_to_rotvec。
  // （先判 not null：rel_axis_offset 在轴退化时回 null，而 JS 里 null < 1e-6 会静默为 true。）
  assert.ok(r.axis_offset !== null && r.axis_offset < 1e-6,
    `相对旋转的轴必须落在工具系 e_z 上，实测与 e_z 的夹角 ${r.axis_offset} rad`)
  assert.ok(r.matrix_err < 1e-6,
    `工具系必须右乘 R_from·R_δ ≈ R_target，实测矩阵最大偏差 ${r.matrix_err}`)
  assert.ok(Math.abs(r.angle_target - 0.1) < 1e-9,
    `from→target 的旋转夹角必须恰好是 δ=0.1，实测 ${r.angle_target}`)
  assert.ok(r.target_err < 1e-3, `运动必须到达 jog_rotate 回报的目标姿态，夹角 ${r.target_err}`)
  assert.ok(Math.abs(r.angle_after - 0.1) < 1e-3,
    `实际姿态相对起点必须真的转了 0.1 rad，实测 ${r.angle_after}`)
})

test('★ jog_rotate：绕基座 X 轴 = R_δ·R_from（左乘），相对旋转轴落在基座 e_x 上', () => {
  const r = out.jog_rotate_base
  assert.ok(!r.code, `jog_rotate(frame=base) 不该报错：${r.code}`)
  assert.equal(r.ok, true)
  assert.equal(r.jog.frame, 'base')
  assert.ok(r.d_pos < 1e-6, `绕基座系轴改姿态后 TCP 位置必须不变，实测位移 ${r.d_pos}`)
  // ★ 独立断言：基座系左乘时 R_target·R_fromᵀ = R_δ（基座系基），旋转轴必须是基座 e_x。
  // 这条与下面那条 matrix_err 相互独立：它只看"绕的是哪条轴"，不看矩阵是否整体相等。
  assert.ok(r.axis_offset !== null && r.axis_offset < 1e-6,
    `相对旋转的轴必须落在基座 e_x 上，实测与 e_x 的夹角 ${r.axis_offset} rad`)
  assert.ok(r.matrix_err < 1e-6,
    `基座系必须左乘 R_δ·R_from ≈ R_target，实测矩阵最大偏差 ${r.matrix_err}`)
  assert.ok(Math.abs(r.angle_target - 0.05) < 1e-9,
    `from→target 的旋转夹角必须恰好是 δ=0.05，实测 ${r.angle_target}`)
  assert.ok(r.target_err < 1e-3, `运动必须到达 jog_rotate 回报的目标姿态，夹角 ${r.target_err}`)
  assert.ok(Math.abs(r.angle_after - 0.05) < 1e-3,
    `实际姿态相对起点必须真的转了 0.05 rad，实测 ${r.angle_after}`)
})

test('★ jog_rotate：δ=0.6 的大增量在仿真里必须成功（拆段绕过 MAX_IK_STEP_RAD），总转角仍≈0.6', () => {
  // 为什么单列一条：仿真对"纯旋转 movel"只做一次逆解，δ=0.6 的关节跳变超过
  // ur_sim.MAX_IK_STEP_RAD=0.5，会被判成"收敛到另一个构型分支"而回 SIM_UNREACHABLE；
  // 而同样的 movel 真机能执行。实现把 |δ| 按 ≤0.4 rad 拆段、每段从上一段的实际位姿续算。
  const r = out.jog_rotate_large
  assert.ok(!r.code, `δ=0.6 不该报错（拆段后应成功）：${r.code}`)
  assert.equal(r.ok, true)
  assert.equal(r.jog.axis, 'rz')
  assert.ok(Math.abs(r.jog.delta_rad - 0.6) < 1e-12, 'delta_rad 必须原样回报 0.6')
  assert.ok(r.jog.segments >= 2, `0.6 rad 必须拆成多段（每段 ≤0.4），实测 ${r.jog.segments} 段`)
  assert.ok(r.d_pos < 1e-6, `大增量旋转同样不得搬动 TCP 位置，实测位移 ${r.d_pos}`)
  // 总旋转角：from→target（报告的目标）与 from→after（真的转到了）都必须≈0.6。
  assert.ok(Math.abs(r.angle_target - 0.6) < 1e-3,
    `from→target 的总旋转角必须≈0.6，实测 ${r.angle_target}`)
  assert.ok(Math.abs(r.angle_after - 0.6) < 1e-3,
    `实际总旋转角必须≈0.6（夹角差 < 1e-3），实测 ${r.angle_after}`)
  assert.ok(r.target_err < 1e-3, `运动必须到达回报的目标姿态，夹角 ${r.target_err}`)
  // 矩阵等价（容差 1e-4 而不是 1e-6）：每段都从**实际**位姿续算，逐段 IK 的舍入会留下
  // 1e-6 量级的合成偏差（实测 ~4.6e-6）—— 那是"不累积误差"换来的代价，不是轴/顺序错误。
  assert.ok(r.matrix_err < 1e-4,
    `拆段后的合成仍必须等价于 R_from·R_δ，实测矩阵最大偏差 ${r.matrix_err}`)
})

test('★ jog_rotate：未知轴 / 平移轴名 / 缺 delta / NaN / 0 / 未知 frame 一律 BADARG（ok:false）', () => {
  const rows = Object.entries(out.jog_rotate_badargs)
  assert.equal(rows.length, 6, '六个非法输入必须逐个覆盖')
  for (const [label, r] of rows) {
    assert.equal(r.ok, false, `${label} 的失败信封必须是 ok:false（不能假装成功）`)
    assert.equal(r.code, 'BADARG', `${label} 必须报 BADARG，实际 ${r.code}`)
  }
})

test('★ _matrix_to_rotvec 与 _rotvec_to_matrix 互逆（含 θ≈π 的退化分支）', () => {
  assert.ok(out.rotvec_roundtrip, '必须实现 _matrix_to_rotvec（矩阵 → 轴角）')
  for (const [label, row] of Object.entries(out.rotvec_roundtrip)) {
    assert.ok(row.angle < 1e-6, `${label}：往返后姿态夹角 ${row.angle} rad（必须回到同一个姿态）`)
    assert.ok(row.matrix < 1e-6, `${label}：往返后矩阵最大偏差 ${row.matrix}`)
  }
})

// ── set_speed_scaling：运行中调速（仿真原地改，不重建）──────────────────────
//
// 这个 op 存在的唯一理由就是「**不重建**」：面板拖动速度滑块时，机械臂不能跳回起始位姿。
// 所以断言分两层：
//   ① 值：读回 == 0.5；越界被钳到 0.01 / 1.0（客户端原始值原样回显在 requested）；
//   ② 位姿与关节角逐值不变，且 SIMS[IP] 还是**同一个对象**。
// 只断言读回是抓不到重建的 —— 重建之后再设一次倍率，读回照样是 0.5，而机械臂已经回去了。

test('★ set_speed_scaling：改倍率后读回 0.5，且位姿/关节角逐值不变、仿真对象没被重建', () => {
  const s = out.set_scaling
  assert.ok(!s.code, `set_speed_scaling 不该报错：${s.code}`)
  assert.equal(s.ok, true)
  assert.equal(s.fraction, 0.5, '回包必须给出钳位后的 fraction（实际生效值）')
  assert.equal(s.requested, 0.5, 'requested 是客户端原始值')
  assert.equal(s.actual, 0.5, '仿真里 actual 就是当前生效值（没有真机那种"静止读 0"的折扣）')
  assert.equal(s.read_back, 0.5, '随后 get_speed_scaling 必须读回 0.5（钳位值真的生效）')
  assert.deepEqual(s.q_after, s.q_before, '★ 关节角必须逐值不变（变了就说明仿真被重建/被挪动）')
  assert.deepEqual(s.pose_after, s.pose_before, '★ TCP 位姿必须逐值不变')
  assert.equal(s.same_instance, true, '★ 必须是同一个 VirtualRobot 实例（换实例就是重建）')
  assert.match(String(s.message), /没有重建/, '回包必须说清这是"原地改倍率、没有重建"')
})

test('★ set_speed_scaling：越界钳到 0.01–1.0，requested 回显原始值', () => {
  const c = out.set_scaling_clamp
  assert.ok(!c.low.code, `fraction=0.0001 不该报错：${c.low.code}`)
  assert.equal(c.low.fraction, 0.01, '低于下限（0.0001）必须钳到 0.01')
  assert.equal(c.low.requested, 0.0001, '★ requested 必须原样回显客户端给的值（面板要显示"0.01%→1%"）')
  assert.equal(c.low.read_back, 0.01, '钳位后的值必须真的生效，而不是只改回包')

  assert.ok(!c.high.code, `fraction=9 不该报错：${c.high.code}`)
  assert.equal(c.high.fraction, 1, '高于上限（9）必须钳到 1.0')
  assert.equal(c.high.requested, 9)
  assert.equal(c.high.read_back, 1, '钳位后的值必须真的生效')
})

test('★ set_speed_scaling：缺失 / NaN / Infinity / 非数值一律 BADARG（绝不猜一个倍率）', () => {
  for (const [label, code] of Object.entries(out.set_scaling_badargs)) {
    assert.equal(code, 'BADARG', `fraction=${label} 必须报 BADARG，实际 ${code}`)
  }
})

// ── 速度流（speedl / stopl / 看门狗）──────────────────────────────────────
//
// 面板「按住点动键」的连续运动走的是**速度流**（speedl 语义）：前端每 ~100 ms 发一条
// velocity，后端只更新 twist，逐帧积分发生在 `advance()` 里（推送线程 20 Hz 读它）。
// 所以这里钉住四件事：
//   ① 位移 ≈ v·Δt，且沿给定方向单调前进（首帧 Δt=0，不许跳）；
//   ② stopl 之后位置完全不再变化；
//   ③ 看门狗：到截止时间没有新指令 ⇒ 速度自动归零（浏览器崩溃时的安全底线）；
//   ④ 不可达方向不抛错：保持关节角、清掉 twist，并在返回信息里留下"被拒"证据。

test('★ speedl：连续两次 advance 沿给定方向单调前进，位移 ≈ v·Δt（显式 now，不 sleep）', () => {
  const s = out.speedl
  assert.ok(!s.code, `speedl 不该报错：${s.code}`)
  assert.equal(s.ok, true)
  // 回包必须如实给出速度流三件套（面板据此画状态、调试据此核对）
  assert.deepEqual(s.twist, [0.08, 0, 0, 0, 0, 0])
  assert.equal(s.frame, 'base')
  assert.equal(s.ttl_ms, 1000)
  // ★ 首帧 Δt=0：收到指令的瞬间不能跳一步（否则按住的第一下会"闪"一下）
  assert.equal(s.first_step, 0, '★ 首次 advance 的 dt 必须是 0（速度流不能一上来就跳）')
  assert.equal(s.monotonic, true, '沿 +x 的连续两次推进必须单调前进')
  assert.ok(Math.abs(s.dx - s.expected) <= s.expected * 0.2,
    `位移必须 ≈ v·Δt=0.008 m（容差 20%），实测 ${s.dx}`)
  // 纯基座 x 平移：y/z 不得有明显漂移（逆解舍入允许 ~1e-4）
  assert.ok(s.dyz < 1e-3, `沿 +x 的速度流不得带来 y/z 漂移，实测 ${s.dyz}`)
  assert.equal(s.q_len, 6)
})

test('★ stopl：停掉速度流后继续 advance，位置不再变化', () => {
  const s = out.stopl
  assert.ok(!s.code, `stopl 不该报错：${s.code}`)
  assert.equal(s.stopped, true)
  assert.equal(s.drift, 0, '★ stopl 之后推进一帧，位置必须完全不动')
  assert.equal(s.drift_later, 0, '★ 再推进一帧也不能动（没有"残余速度"）')
  assert.deepEqual(s.twist, [0, 0, 0, 0, 0, 0], 'stopl 必须把 twist 清零')
  assert.equal(s.active, false)
})

test('★ 看门狗：ttl 到点没有新指令 ⇒ 速度自动归零（浏览器崩溃时必须自己停）', () => {
  const w = out.watchdog
  assert.equal(w.ttl_ms, 200, 'ttl_ms 必须原样回显')
  // 截止前：Δt=0.1、v=0.06 ⇒ 0.006 m
  assert.ok(Math.abs(w.moved_inside - 0.006) <= 0.006 * 0.2,
    `看门狗内必须照常运动（≈0.006 m），实测 ${w.moved_inside}`)
  // 截止后：时间和位置都不许再动
  assert.equal(w.moved_after, 0, '★ 过了看门狗截止时间必须自动归零（不再位移）')
  assert.equal(w.moved_later, 0, '★ 之后继续推进也不能动')
  assert.deepEqual(w.twist, [0, 0, 0, 0, 0, 0], '看门狗到点必须把 twist 清零')
  assert.equal(w.active, false)
})

test('★ 速度流不可达：不抛异常、关节角保持、twist 清零，且 status 能看出被拒', () => {
  const u = out.twist_unreachable
  assert.equal(u.raised, null, '★ 不可达速度不得抛异常（面板会一直按住不放）')
  assert.equal(u.moved, 0, '被拒时 TCP 必须停在原地')
  assert.ok(u.joints_same < 1e-12, `被拒时关节角必须逐值保持，实测最大变化 ${u.joints_same}`)
  assert.deepEqual(u.twist, [0, 0, 0, 0, 0, 0], '被拒后 twist 必须清零（不能反复重试到卡死）')
  assert.equal(u.active, false)
  assert.equal(u.rejected, true, 'twist_state 必须记录"被逆解拒绝过"')
  assert.equal(u.status_rejected, true, '★ status 也要带出来（否则调用方只看得到"不动了"）')
  assert.match(String(u.status_reason), /不可达|不连续/, '被拒原因必须说清楚')
})

test('★ 工具系速度流：位移沿工具轴，而不是基座轴', () => {
  const t = out.twist_tool_frame
  assert.ok(t.err < 1e-3, `位移必须 ≈ 0.04·0.1·工具 x 轴，实测误差 ${t.err}`)
  // 前提校验：当前位姿下"工具 x"与"基座 x"必须明显不同，否则这条用例分辨不出两个坐标系。
  assert.ok(t.discrimination > 1e-3,
    `前提：工具系与基座系的期望位移必须可区分（实测差 ${t.discrimination}）`)
  // 实际位移必须贴近工具系期望，而不是基座系期望。
  assert.ok(t.err < t.discrimination / 2,
    '工具系 +x 位移必须更接近工具轴而不是基座 +x（frame 若被当成 base 就会落在基座 +x）')
})

test('★ 全零 twist 等价于 stop：之后的 advance 不再位移', () => {
  const z = out.twist_zero
  assert.ok(z.moved_before > 1e-4, '前提：先发一条非零速度流，它必须真的走了一点')
  assert.equal(z.moved_after, 0, '★ 全零 twist 必须按 stop 处理')
  assert.deepEqual(z.twist, [0, 0, 0, 0, 0, 0])
  assert.equal(z.active, false)
})

test('★ 续命的 velocity：两条指令之间那段时间必须补上（否则按住不放会越走越慢）', () => {
  const r = out.twist_renew
  assert.ok(Math.abs(r.dx - r.expected) <= r.expected * 0.2,
    `续命时应把上一条 twist 的 0.05s 补上（≈0.0025 m），实测 ${r.dx}`)
})

test('★ speedl 的 ttl_ms：缺省 400，越界钳到 100 / 2000（钳位而不是拒绝）', () => {
  assert.equal(out.speedl_ttl.default, 400)
  assert.equal(out.speedl_ttl.low, 100, 'ttl_ms=0 必须钳到下限 100（看门狗是安全底线，不能因此失败）')
  assert.equal(out.speedl_ttl.high, 2000, 'ttl_ms=99999 必须钳到上限 2000')
})

test('★ speedl 的非法参数（frame / 维度 / NaN）一律 BADARG', () => {
  for (const [label, code] of Object.entries(out.speedl_badargs)) {
    assert.equal(code, 'BADARG', `speedl ${label} 必须报 BADARG，实际 ${code}`)
  }
})
