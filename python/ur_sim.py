"""
python/ur_sim.py — 运动学级离线仿真引擎（**没有任何网络/机器人调用**）。

© 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com

## 这个模块是什么

`ur_worker.py` 用它实现「离线仿真」：一个**虚拟机器人**，让 AI 在没有真机的情况下驱动数字
孪生里的模型动起来。它只做**运动学**：正解、逆解、关节/笛卡尔轨迹插值、位姿读回。

## 它明确**不是**什么（诚实边界，务必与 README 一致）

- 没有动力学：不做力矩、惯性、重力、碰撞检测、关节伺服误差。
- 没有控制器：安全状态、程序执行（.urp）、RTDE 遥测（温度/电流/电压/受力）、工具 I/O、
  寄存器、传送带**都不存在可模拟的语义** —— 那些指令一律由 `ur_worker.py` 明确回报
  「无仿真语义」，而不是给一个看起来能跑的结果。
- 时间参数是**近似**：`a`/`v` 只用来决定每段运动的时长（smoothstep 时间标度），
  不做真实控制器的梯形/jerk 限幅。

## 与孪生的一致性（硬约束）

孪生客户端用 `src/client/robot/fk.js` 从 `q` 正解出 TCP 与各连杆位姿。所以：

1. 仿真**只产出 `q`**，`tcp` 由本模块的正解算出 —— 读回的 TCP 与界面画出来的位置**必然一致**；
2. 本模块的正解必须与 `fk.js` **逐元素等价**（同一份 `assets/kinematics.json`、同一套链序：
   对每个 i 先施加连杆固定变换、再绕其局部 z 轴旋转 q[i]；矩阵列主序，平移在 [12][13][14]）；
3. `test/sim-backend.test.mjs` 用同一批关节角把两边的 TCP 逐元素比对，**漂了就红**
   （14 个型号 × 3 组姿态实测最大偏差 0）。

## 单位与约定

- 关节角：弧度；TCP 位姿：`[x, y, z, rx, ry, rz]`，位置单位米，姿态是 UR 的**旋转向量**
  （轴角，模长 = 弧度），**不是** RPY —— 这一点与真机 `get_actual_tcp_pose()` 的约定一致。
- 矩阵：4×4 **列主序** `list[16]`，`m[column * 4 + row]`。

本模块**零第三方依赖**（只用标准库），因此可以在没有 numpy/paramiko 的机器上被导入与单测。
"""

import json
import math
import os
import time

__all__ = [
    "load_kinematics",
    "model_ids",
    "canonical_model_name",
    "joint_limits",
    "fk",
    "fk_links",
    "tcp_pose",
    "pose_to_matrix",
    "matrix_to_pose",
    "ik",
    "PRESETS",
    "preset_joints",
    "VirtualRobot",
    "SimError",
]


class SimError(Exception):
    """仿真侧的**预期失败**（不可达/非法参数/未知型号）；调用方把它转成 err(...)。

    `code` 会原样进入协议错误，因此调用方（`ur_worker.py`）能给出稳定错误码。
    """

    def __init__(self, message, code="SIM_ERROR"):
        super().__init__(message)
        self.code = code


# ---------------------------------------------------------------------------
# 运动学表
# ---------------------------------------------------------------------------

_KIN_CACHE = None
_KIN_PATH = None


def kinematics_path():
    """`assets/kinematics.json` 的绝对路径（发布包里 assets 与 python 同级）。"""
    return os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "kinematics.json"))


def load_kinematics():
    """读一次并缓存 `assets/kinematics.json`；读不到时抛 `SimError`（附上找过的路径）。

    为什么缓存：孪生 20 Hz 推送每一帧都要正解，重复读盘是纯粹的浪费；文件在运行期不会变。
    """
    global _KIN_CACHE, _KIN_PATH
    if _KIN_CACHE is not None:
        return _KIN_CACHE
    path = kinematics_path()
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception as exc:  # 文件缺失/损坏都要给出**可读**的原因，而不是 KeyError
        raise SimError("读不到运动学表 %s：%s" % (path, exc), "SIM_ASSET_MISSING")
    if not isinstance(data, dict) or not data:
        raise SimError("运动学表 %s 不是有效的型号字典" % path, "SIM_ASSET_MISSING")
    _KIN_CACHE = data
    _KIN_PATH = path
    return data


def model_ids():
    """运动学表里可用的型号 id（小写，已排序）—— 也是仿真的合法 `model` 取值。"""
    return sorted(load_kinematics().keys())


def canonical_model_name(model_id):
    """`ur5e` → `UR5e`（与真机 dashboard 报的型号写法对齐）。

    孪生按 `snap.model` 小写化后取 GLB 与运动学，所以大小写不影响渲染；这个转换只为让
    数值面板与工具返回看起来像一台真机。
    """
    value = str(model_id or "").strip()
    if value == "":
        return ""
    lowered = value.lower()
    return "UR" + lowered[2:] if lowered.startswith("ur") else value


def kinematics_for(model_id):
    """取某型号的 `{links, jointLimits}`；未知型号抛 `SimError`（附可用清单）。"""
    table = load_kinematics()
    key = str(model_id or "").strip().lower()
    entry = table.get(key)
    if not isinstance(entry, dict):
        raise SimError(
            "未知型号 %r。可用型号：%s" % (model_id, "、".join(model_ids())),
            "SIM_UNKNOWN_MODEL")
    links = entry.get("links")
    if not isinstance(links, list) or len(links) < 6:
        raise SimError("型号 %s 的运动学链不足 6 段" % key, "SIM_ASSET_MISSING")
    return entry


def joint_limits(model_id):
    """6 个关节的 `(min, max)`；个别型号的某关节为 `None`（表里就是 null）。

    ⚠️ 真机 UR3/UR3e 的第 6 关节在这里是 `null`（数据源缺口），所以**不能**把 `None`
    当成「限制为 0」—— 那样会把合法的腕部旋转判成越限。
    """
    entry = kinematics_for(model_id)
    raw = entry.get("jointLimits")
    out = []
    for i in range(6):
        pair = raw[i] if isinstance(raw, list) and i < len(raw) else None
        if (isinstance(pair, (list, tuple)) and len(pair) == 2
                and all(isinstance(v, (int, float)) for v in pair)):
            out.append((float(pair[0]), float(pair[1])))
        else:
            out.append(None)
    return out


# ---------------------------------------------------------------------------
# 4×4 列主序矩阵（与 src/client/robot/fk.js 逐元素等价）
# ---------------------------------------------------------------------------

def identity4():
    return [1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]


def multiply4(a, b):
    """列主序 4×4 乘法：返回 a·b（先施加 b，再施加 a）。与 fk.js 的 multiply4 同序。"""
    out = [0.0] * 16
    for c in range(4):
        for r in range(4):
            out[c * 4 + r] = (a[r] * b[c * 4]
                              + a[4 + r] * b[c * 4 + 1]
                              + a[8 + r] * b[c * 4 + 2]
                              + a[12 + r] * b[c * 4 + 3])
    return out


def rot_z(t):
    c = math.cos(t)
    s = math.sin(t)
    return [c, s, 0.0, 0.0,
            -s, c, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]


def pose_to_matrix(x, y, z, roll=0.0, pitch=0.0, yaw=0.0):
    """URDF rpy（ZYX 内旋）→ 4×4 列主序。与 fk.js 的 poseToMatrix4 同一套公式。"""
    cr, sr = math.cos(roll), math.sin(roll)
    cp, sp = math.cos(pitch), math.sin(pitch)
    cy, sy = math.cos(yaw), math.sin(yaw)
    return [
        cy * cp, sy * cp, -sp, 0.0,
        cy * sp * sr - sy * cr, sy * sp * sr + cy * cr, cp * sr, 0.0,
        cy * sp * cr + sy * sr, sy * sp * cr - cy * sr, cp * cr, 0.0,
        x, y, z, 1.0,
    ]


def _unit(value, fallback=0.0):
    return float(value) if isinstance(value, (int, float)) else fallback


def fk_links(model_id, q):
    """6 个连杆坐标系（基座 → 各连杆）的累积变换；`links[5]` 即 tool0。"""
    entry = kinematics_for(model_id)
    links = entry["links"]
    t = identity4()
    out = []
    for i in range(6):
        link = links[i] if isinstance(links[i], dict) else {}
        t = multiply4(t, pose_to_matrix(
            _unit(link.get("x")), _unit(link.get("y")), _unit(link.get("z")),
            _unit(link.get("roll")), _unit(link.get("pitch")), _unit(link.get("yaw"))))
        t = multiply4(t, rot_z(_unit(q[i]) if isinstance(q, (list, tuple)) and i < len(q) else 0.0))
        out.append(list(t))
    return out


def fk(model_id, q):
    """tool0 的 4×4 列主序矩阵（= `fk_links` 的最后一段）。"""
    return fk_links(model_id, q)[5]


def axis_angle_from_matrix(m):
    """旋转矩阵 → UR 的旋转向量（轴角）。

    ## 符号约定（这一条曾经错过，别再靠手推）
    轴线来自反对称部分 `(R − Rᵀ)`。本项目的矩阵是**列主序** `m[col*4 + row]`，于是
    `R[row][col] = m[col*4 + row]`，取 `k·(m[6]−m[9], m[8]−m[2], m[1]−m[4])` ——
    这三个下标**逐分量都必须是这个方向**：写反任意一个都会得到"反射"，于是 `movel` 的目标
    姿态、HUD 里读回的 `rx/ry/rz` 全都变成逆旋转（`test/sim-backend.test.mjs` 用
    `v → 矩阵 → v` 的往返把它钉死）。
    """
    trace = m[0] + m[5] + m[10]
    cos_angle = max(-1.0, min(1.0, (trace - 1.0) / 2.0))
    angle = math.acos(cos_angle)
    if angle < 1e-8:
        return [0.0, 0.0, 0.0]
    if math.sin(angle) < 1e-6:
        # θ≈π：反对称部分退化（sinθ→0），改用 R = 2kkᵀ − I 的**对角与非对角**关系定轴。
        # 取对角最大的一维定正号，其余维用 R[i][j] = 2·k_i·k_j 解出 —— 符号自洽、不需要猜。
        diag = [m[0], m[5], m[10]]
        i = max(range(3), key=lambda j: diag[j])
        axis = [0.0, 0.0, 0.0]
        axis[i] = math.sqrt(max(0.0, (diag[i] + 1.0) / 2.0))
        if axis[i] < 1e-8:
            return [0.0, 0.0, 0.0]
        for j in range(3):
            if j != i:
                axis[j] = m[j * 4 + i] / (2.0 * axis[i])
        norm = math.sqrt(sum(v * v for v in axis)) or 1.0
        return [axis[j] / norm * angle for j in range(3)]
    k = angle / (2.0 * math.sin(angle))
    return [k * (m[6] - m[9]), k * (m[8] - m[2]), k * (m[1] - m[4])]


def tcp_pose(model_id, q):
    """`[x, y, z, rx, ry, rz]`（米 / 旋转向量弧度）—— 与真机 `get_actual_tcp_pose()` 同约定。"""
    m = fk(model_id, q)
    rot = axis_angle_from_matrix(m)
    return [m[12], m[13], m[14], rot[0], rot[1], rot[2]]


def matrix_from_axis_angle(x, y, z, rx, ry, rz):
    """旋转向量（轴角）→ 4×4 列主序齐次矩阵（Rodrigues）。`movel` 的目标位姿用它。"""
    values = [_unit(x), _unit(y), _unit(z), _unit(rx), _unit(ry), _unit(rz)]
    x, y, z, rx, ry, rz = values
    angle = math.sqrt(rx * rx + ry * ry + rz * rz)
    if angle < 1e-12:
        rotation = identity4()
    else:
        ax, ay, az = rx / angle, ry / angle, rz / angle
        c, s = math.cos(angle), math.sin(angle)
        v = 1.0 - c
        rotation = [
            ax * ax * v + c, ay * ax * v + az * s, az * ax * v - ay * s, 0.0,
            ax * ay * v - az * s, ay * ay * v + c, az * ay * v + ax * s, 0.0,
            ax * az * v + ay * s, ay * az * v - ax * s, az * az * v + c, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]
    rotation[12], rotation[13], rotation[14] = x, y, z
    return rotation


def matrix_to_pose(m):
    """矩阵 → `[x, y, z, rx, ry, rz]`（位姿回读与 `_target_*` 都用它）。"""
    rot = axis_angle_from_matrix(m)
    return [m[12], m[13], m[14], rot[0], rot[1], rot[2]]


def pose_to_matrix_axis_angle(pose):
    """`[x, y, z, rx, ry, rz]` → 矩阵；长度不足时缺的当 0（宽容解析工具的 pose 参数）。"""
    values = [pose[i] if isinstance(pose, (list, tuple)) and i < len(pose) else 0.0
              for i in range(6)]
    return matrix_from_axis_angle(*values)


# ---------------------------------------------------------------------------
# 逆运动学（数值阻尼最小二乘）
# ---------------------------------------------------------------------------

# 位置误差与姿态误差的量纲不同（米 vs 弧度），残差里给姿态一个等效长度权重，
# 否则"转 1 弧度"和"移动 1 米"被当成同等代价，手腕会先乱转。
_ROT_WEIGHT = 0.25


def _rotation_error(target, current):
    """目标姿态相对当前姿态的旋转向量（世界系，用于误差向量）。"""
    # e = axis_angle(R_target · R_currentᵀ)
    rt = [target[0:3], target[4:7], target[8:11]]
    rc = [current[0:3], current[4:7], current[8:11]]
    diff = [[0.0] * 3 for _ in range(3)]
    for i in range(3):
        for j in range(3):
            diff[i][j] = sum(rt[i][k] * rc[j][k] for k in range(3))
    m = [diff[0][0], diff[1][0], diff[2][0], 0.0,
         diff[0][1], diff[1][1], diff[2][1], 0.0,
         diff[0][2], diff[1][2], diff[2][2], 0.0,
         0.0, 0.0, 0.0, 1.0]
    return axis_angle_from_matrix(m)


def _position_error(target, current):
    return [target[12] - current[12], target[13] - current[13], target[14] - current[14]]


def _solve6(a, b):
    """解 6×6 线性方程 a·x = b（高斯消元带部分选主元）；奇异时返回 None。"""
    n = 6
    m = [list(a[i]) + [b[i]] for i in range(n)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(m[r][col]))
        if abs(m[pivot][col]) < 1e-12:
            return None
        m[col], m[pivot] = m[pivot], m[col]
        inv = 1.0 / m[col][col]
        for r in range(n):
            if r == col:
                continue
            factor = m[r][col] * inv
            if factor == 0.0:
                continue
            for c in range(col, n + 1):
                m[r][c] -= factor * m[col][c]
    return [m[i][n] / m[i][i] for i in range(n)]


def ik(model_id, target_matrix, seed, limits=None, iterations=120, tol_pos=1e-4, tol_rot=1e-4):
    """数值逆解：返回 6 个关节角，或 `None`（不可达 / 不收敛）。

    - **阻尼最小二乘（DLS）** + 定步长上限：靠近奇异位形时阻尼自动变大，不会炸出巨大步长；
    - 雅可比用**前向差分**（每个关节一次额外正解，共 6 次/迭代），与正解同一份代码 ⇒ 自洽；
    - 关节限位在**接受结果时**校验（越限即判失败，绝不悄悄钳到边界 —— 那会让孪生画出
      一条真机根本走不了的轨迹）。
    """
    q = [float(seed[i]) if isinstance(seed, (list, tuple)) and i < len(seed) else 0.0
         for i in range(6)]
    scale = _ROT_WEIGHT
    for _ in range(int(iterations)):
        current = fk(model_id, q)
        pos_err = _position_error(target_matrix, current)
        rot_err = [v * scale for v in _rotation_error(target_matrix, current)]
        err = pos_err + rot_err
        norm = math.sqrt(sum(v * v for v in err))
        if (math.sqrt(sum(v * v for v in pos_err)) <= tol_pos
                and math.sqrt(sum(v * v for v in rot_err)) <= tol_rot * scale):
            return q if _within_limits(model_id, q, limits) else None
        # 数值雅可比：6 列，每列 d(位姿)/dq_j
        jac = [[0.0] * 6 for _ in range(6)]
        h = 1e-6
        for j in range(6):
            bumped = list(q)
            bumped[j] += h
            probe = fk(model_id, bumped)
            dpos = [(probe[12 + i] - current[12 + i]) / h for i in range(3)]
            drot = [v * scale / h for v in _rotation_error(probe, current)]
            for i in range(3):
                jac[i][j] = dpos[i]
                jac[i + 3][j] = drot[i]
        # DLS：dq = Jᵀ (J Jᵀ + λ²I)⁻¹ e
        lam = 1e-3 * (1.0 + norm)
        jjt = [[sum(jac[i][k] * jac[j][k] for k in range(6)) + (lam * lam if i == j else 0.0)
                for j in range(6)] for i in range(6)]
        y = _solve6(jjt, err)
        if y is None:
            return None
        dq = [sum(jac[i][k] * y[i] for i in range(6)) for k in range(6)]
        # 单次迭代步长上限：避免跨越奇异位形后绕远路
        biggest = max(abs(v) for v in dq)
        if biggest > 0.35:
            dq = [v * (0.35 / biggest) for v in dq]
        q = [q[i] + dq[i] for i in range(6)]
    return None


def _within_limits(model_id, q, limits=None):
    pairs = limits if limits is not None else joint_limits(model_id)
    for i in range(6):
        pair = pairs[i] if i < len(pairs) else None
        if pair is None:
            continue
        lo, hi = pair
        if q[i] < lo - 1e-6 or q[i] > hi + 1e-6:
            return False
    return True


# 多起点逆解的**兜底起点**：均匀铺在关节空间里的固定点（确定性，便于复现）。
#
# 为什么需要：单起点的数值逆解对"离起点很远的可达位姿"会不收敛，而**"不可达"是一个
# 很强的断言** —— 不能因为我只从一个起点试过就宣称某个目标走不到。多起点只在**失败时**
# 才付出代价（正常情况下第一个起点就命中），换来的是"拒绝 → 确实解不出来"的可信度。
_FALLBACK_SEEDS = (
    [0.0, -1.5707963268, 1.5707963268, -1.5707963268, -1.5707963268, 0.0],   # 竖直收拢
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, -0.7853981634, 1.5707963268, -0.7853981634, -1.5707963268, 0.0],
    [0.6, -1.2, 1.2, -1.0, -1.5, 0.6],
    [-0.6, -1.2, 1.2, -1.0, -1.5, -0.6],
    [1.2, -1.6, 1.6, -0.6, -1.6, 1.2],
    [-1.2, -1.6, 1.6, -0.6, -1.6, -1.2],
    [0.0, -2.0, 2.0, -1.2, -1.6, 0.0],
)


def _pseudo_random_seeds(count=12):
    """确定性伪随机起点（固定 LCG）：只在手挑起点全失败时才用。

    随机化是为了覆盖"手挑的那几个位形恰好都在同一个奇异邻域"的情况；确定性是为了可复现
    —— 同一个目标在两次运行里必须给出同一个结论（否则"不可达"会变成掷骰子）。
    """
    state = 20261011
    out = []
    for _ in range(count):
        seed = []
        for _ in range(6):
            state = (state * 1103515245 + 12345) % 2147483648
            seed.append(-2.6 + (state / 2147483648.0) * 5.2)
        out.append(seed)
    return out


def ik_reachable(model_id, target_matrix, seeds, limits=None, iterations=120):
    """多起点逆解：**先按给定顺序试（第一个通常是当前/上一个途经点，最省事）**，
    再试手挑的兜底起点，最后试一组确定性伪随机起点。

    返回 `q` 或 `None`。`None` 的语义是"这些起点都收敛不到该位姿" —— 调用方据此报
    「逆解失败（可能不可达/越限/近奇异）」，而不是静默糊一个近似姿态。

    ⚠️ 这条路径**只在失败时才贵**：正常情况第一个起点（上一个途经点）几步就收敛。
    """
    tried = []
    candidates = list(seeds or []) + list(_FALLBACK_SEEDS) + _pseudo_random_seeds()
    for seed in candidates:
        key = tuple(round(float(v), 6) for v in (seed if isinstance(seed, (list, tuple)) else []))
        if key in tried:
            continue
        tried.append(key)
        got = ik(model_id, target_matrix, seed, limits=limits, iterations=iterations)
        if got is not None:
            return got
    return None


def _shortest_joint_delta(start, goal):
    """按**最短路径**逐关节算增量：真机 movej 也不会为了省 1 弧度多转一圈。"""
    out = []
    for i in range(6):
        delta = goal[i] - start[i]
        while delta > math.pi:
            delta -= 2.0 * math.pi
        while delta < -math.pi:
            delta += 2.0 * math.pi
        out.append(delta)
    return out


# ---------------------------------------------------------------------------
# 起始姿态预设（面板的下拉选项与工具参数共用同一份定义）
# ---------------------------------------------------------------------------

PRESETS = {
    # 全零位：与 `fk.js` 的零位一致，最直观
    "zero": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    # 竖直收拢：常见的"就绪"位形，各轴都不靠近奇异
    "upright": [0.0, -1.5707963268, 1.5707963268, -1.5707963268, -1.5707963268, 0.0],
    # 侧伸：给移动类指令留出空间
    "reach": [0.0, -0.7853981634, 1.5707963268, -0.7853981634, -1.5707963268, 0.0],
}


def preset_joints(name, model_id=None):
    """预设名 → 6 个关节角；缺失/非法时回退 `zero`（**不抛错**：起点不该成为失败原因）。

    `model_id` 只用于限位校验：预设点若被某个小臂型号判为越限，就退回落位（避免开局即僵）。
    """
    key = str(name or "zero").strip().lower()
    q = list(PRESETS.get(key, PRESETS["zero"]))
    if model_id is not None and not _within_limits(model_id, q):
        return list(PRESETS["zero"])
    return q


# ---------------------------------------------------------------------------
# 虚拟机器人
# ---------------------------------------------------------------------------

# 单段运动的最短时长（秒）：太短会让 20 Hz 的孪生丢帧（看不清动作）
_MIN_SEGMENT_S = 0.05


class VirtualRobot:
    """一台**虚拟 UR**：只有运动学状态，没有控制器、没有网络。

    运动模型（"运动学级"的全部含义）：

    - 一条运动是**关节空间的折线** `[q0, q1, … qn]` + 每段时长；
    - 每段时长取 `max(maxdq / v_eff, 2·sqrt(maxdq / a))` —— 前者是匀速下限、后者是
      三角速度剖面的最短时间；位置用 **smoothstep** 时间标度（起停平滑，但不做 jerk 限幅）；
    - 状态是**纯函数式推进**的：`advance()` 按墙上时钟算出当前 q，**不需要线程**。
      于是 20 Hz 的孪生推送线程读到的是连续姿态，而命令线程只需等到 `is_steady()`。
    - `target_q` 是这条运动的终点（等价真机 RTDE 的 `target_q`），用于孪生的"幽灵臂"。
    """

    def __init__(self, ip, model, q=None, speed_scaling=1.0, preset="zero"):
        self.ip = str(ip)
        self.model = str(model).strip().lower()
        kinematics_for(self.model)  # 未知型号立刻失败，而不是等第一条指令
        self.limits = joint_limits(self.model)
        self.speed_scaling = _clamp_speed(speed_scaling)
        self.preset_name = str(preset or "zero")
        self.q = list(q) if isinstance(q, (list, tuple)) and len(q) >= 6 else preset_joints(preset, self.model)
        self.q = [float(v) for v in self.q[:6]]
        self._waypoints = [list(self.q)]
        self._segment_s = [_MIN_SEGMENT_S]
        self._started_at = time.time() - _MIN_SEGMENT_S
        # 总时长 0 ⇒ 构造出来就是"已到位"：`ursim_sim_start` 之后的第一帧不该被报成"运动中"。
        self._total_s = 0.0
        self.started_at = self._started_at
        self.move_count = 0
        self.created_at = time.time()
        self.serial = "SIM-%s-%04d" % (canonical_model_name(self.model).upper(),
                                       int(self.created_at) % 10000)

    # ── 时间推进 ──────────────────────────────────────────────
    def _t_now(self, now=None):
        return time.time() if now is None else float(now)

    def elapsed(self, now=None):
        return max(0.0, self._t_now(now) - self._started_at)

    def _sample(self, elapsed):
        """按已流逝时间取关节角：**整条折线一条全局速度剖面**，段内按关节角线性插值。

        时间 → 全局进度 → smoothstep → 沿折线的弧长位置 → 段内对 6 个关节角逐个插值。

        为什么不是"每段各自 smoothstep"：movel 沿直线每 1 cm 取一个细分点，逐段各自
        smoothstep 等于**每 1 cm 就减速到零再重新加速**（一次 0.5 m 的 movel 有 50 次启停），
        视觉上就是一顿一顿，孪生每帧拿到的关节角速度也忽大忽小、插值后像在跳帧。
        改成整条折线共用一条剖面后，整段运动只有一次加速—匀速—减速，关节角连续变化。
        """
        count = len(self._waypoints) - 1
        if count <= 0:
            return list(self._waypoints[-1]) if self._waypoints else list(self.q)
        path_s = sum(self._segment_s[1:])
        if path_s <= 0:
            return list(self._waypoints[-1])
        u = min(1.0, max(0.0, elapsed / path_s))
        # 走完全程就**原样返回终点**（不要靠浮点累减走到最后一段）：折线可能有上百段，
        # 逐段相减的舍入会让末段只走到 1-ε，终点于是差那么一点点 —— 画圆闭合、movel 到位
        # 这类"必须精确落在给定点"的契约就是这么被打破的。
        if u >= 1.0:
            return list(self._waypoints[-1])
        remaining = (u * u * (3.0 - 2.0 * u)) * path_s  # 全局 smoothstep
        for index in range(count):
            duration = self._segment_s[index + 1]
            if remaining < duration or index == count - 1:
                start = self._waypoints[index]
                goal = self._waypoints[index + 1]
                t = 0.0 if duration <= 0 else min(1.0, max(0.0, remaining / duration))
                return [start[i] + (goal[i] - start[i]) * t for i in range(6)]
            remaining -= duration
        return list(self._waypoints[-1])

    def advance(self, now=None):
        """把内部 `q` 推到"现在"；返回当前 q。幂等、无副作用。"""
        self.q = self._sample(self.elapsed(now))
        return self.q

    def is_steady(self, now=None):
        return self.elapsed(now) >= self._total_s - 1e-9

    def target_q(self):
        return list(self._waypoints[-1])

    # ── 运动指令 ──────────────────────────────────────────────
    def _plan(self, waypoints, v, a, now=None, total_s=None):
        """把关节折线排成时间表，并把起点锚定到"现在"。

        起点用**当前实际姿态**（而不是上一条运动的终点）：真机若在运动途中收到新指令，
        新轨迹也是从当前位置开始的。

        **整条折线共用一条时间剖面**：先按各段的关节位移分配"名义时长"（让各段的关节速度
        一致），总时长由**整段行程**（所有段位移之和）按 v/a 算出 —— 而不是把逐段时长相加。
        这个区别是肉眼可见的：movel 沿直线每 1 cm 一个细分点，逐段计时等于每 1 cm 起停一次
        （几十次微型加/减速，动起来一顿一顿）；按整段行程计时，整条运动只有一次
        加速—匀速—减速，配合 `_sample` 的全局 smoothstep 才是连续平滑的。

        `total_s`（movej/movel 的 `t` 参数）给了就**优先于 a/v**：按比例缩放各段名义时长，
        使总时长等于 `t` —— 与手册"给了 t 就忽略 a/v"的语义一致。下限 `_MIN_SEGMENT_S` 是
        **总时长**的下限；不再逐段压地板（逐段地板会把细分点重新变成一次启停）。
        """
        current = self._sample(self.elapsed(now))
        chain = [current] + [[float(x) for x in w[:6]] for w in waypoints]
        # 每段的关节位移（取该段里动得最多的那个关节），用来按"同一关节速度"分配时间。
        weights = [max(abs(chain[i + 1][j] - chain[i][j]) for j in range(6))
                   for i in range(len(chain) - 1)]
        travel = sum(weights)
        total = max(_MIN_SEGMENT_S, _travel_duration(travel, v, a, self.speed_scaling))
        nominal = [0.0] * len(weights) if travel <= 1e-12 else [total * (w / travel) for w in weights]
        if isinstance(total_s, (int, float)) and total_s > 0:
            computed = sum(nominal) or _MIN_SEGMENT_S
            ratio = max(float(total_s), _MIN_SEGMENT_S) / computed
            nominal = [s * ratio for s in nominal]
        self._waypoints = chain
        self._segment_s = [_MIN_SEGMENT_S] + nominal
        self._total_s = sum(self._segment_s)
        self._started_at = self._t_now(now)
        self.q = list(current)
        self.move_count += 1

    def move_joints(self, q_goal, v=1.05, a=1.4, now=None, total_s=None):
        """movej：目标关节角（按最短路径）。越限直接拒绝。"""
        goal = [float(q_goal[i]) for i in range(6)]
        if not _within_limits(self.model, goal, self.limits):
            raise SimError("目标关节角超出 %s 的关节限位，已拒绝（仿真不会替你钳到边界）"
                           % canonical_model_name(self.model), "SIM_JOINT_LIMIT")
        current = self._sample(self.elapsed(now))
        delta = _shortest_joint_delta(current, goal)
        self._plan([[current[i] + delta[i] for i in range(6)]], v, a, now=now, total_s=total_s)

    def move_cartesian(self, poses, v=0.25, a=1.2, step_m=0.01, now=None, total_s=None):
        """movel 语义：目标**位姿**（一个或多个途经点）→ 逐点逆解 → 关节折线。

        直线段按 `step_m` 细分（位置线性、姿态在旋转向量空间线性插值），每个细分点用**上一点**
        作种子做逆解 —— 这是"直线运动"在运动学仿真里唯一诚实的做法：只在给定途经点之间做关节
        插值会让 TCP 走出一条弧线，那不是 movel。

        任一途经点无解即整条运动失败（**不会**跳过该点继续走）。
        """
        if not poses:
            raise SimError("movel 需要至少一个目标位姿", "SIM_BADARG")
        current = self._sample(self.elapsed(now))
        chain_poses = [tcp_pose(self.model, current)]
        for pose in poses:
            target = _normalize_pose(pose)
            chain_poses.extend(_interpolate_poses(chain_poses[-1], target, step_m))
        seed = list(current)
        waypoints = [list(current)]
        for index, pose in enumerate(chain_poses[1:], start=1):
            ok = ik_reachable(self.model, pose_to_matrix_axis_angle(pose), [seed], limits=self.limits)
            if ok is None:
                raise SimError(
                    "第 %d 个途经点在运动学上不可达（多个起点逆解均未收敛）：%s。"
                    "movel 的每个细分点都要求可解；请拆成多段、改目标或改起始姿态。"
                    % (index, _format_pose(pose)), "SIM_UNREACHABLE")
            waypoints.append(list(ok))
            seed = list(ok)
        self._plan(waypoints, v, a, now=now, total_s=total_s)

    def move_cartesian_path(self, waypoints, v=0.25, a=1.2, now=None):
        """movep 语义：一趟走过多个 Cartesian 途经点（每个点各自逆解，不细分直线）。"""
        return self.move_cartesian(waypoints, v, a, now=now)

    def servoj(self, q_goal, now=None):
        """servoj：直接把姿态设过去（真机是 500 Hz 流式伺服；这里退化成一次瞬时到位）。

        ⚠️ 语义差异是**故意暴露**的：仿真不模拟伺服带宽，文档里写明。
        """
        goal = [float(q_goal[i]) for i in range(6)]
        if not _within_limits(self.model, goal, self.limits):
            raise SimError("servoj 目标超出关节限位", "SIM_JOINT_LIMIT")
        self._plan([goal], 1.05, 1.4, now=now)

    def stop(self, now=None):
        """stopj/stopl：在当前姿态冻结（清掉剩余轨迹）。"""
        current = self._sample(self.elapsed(now))
        self._waypoints = [list(current)]
        self._segment_s = [_MIN_SEGMENT_S]
        self._total_s = _MIN_SEGMENT_S
        self._started_at = self._t_now(now)
        self.q = list(current)

    def speedj_probe(self):
        """当前最大关节速度（rad/s）—— 只读、用于 `ursim_wait_steady` 之外的诊断。"""
        step = 1e-3
        later = self._sample(min(self._total_s, self.elapsed() + step))
        now = self.advance()
        return max(abs(later[i] - now[i]) / step for i in range(6))

    # ── 读回 ──────────────────────────────────────────────────
    def snapshot(self, now=None):
        """孪生推送用的一帧：**只给 q 与由 q 正解出的 tcp**（保证界面与读回一致）。"""
        q = self.advance(now)
        tcp = tcp_pose(self.model, q)
        return {"q": list(q), "tcp": tcp}

    def target_snapshot(self, now=None):
        """控制器"打算去哪"（孪生的幽灵臂）：终点关节角与其正解 TCP。"""
        goal = self.target_q()
        return {"target_q": goal, "target_tcp": tcp_pose(self.model, goal)}

    def status(self, now=None):
        """`ursim_get_status` 的仿真子集。`simulated: True` 是**契约字段**：调用方据此知道
        这不是真机读数，界面据此打仿真水印。"""
        q = self.advance(now)
        pose = tcp_pose(self.model, q)
        goal = self.target_q()
        return {
            "ip": self.ip,
            "simulated": True,
            "robot_model": canonical_model_name(self.model),
            "model_id": self.model,
            "tcp_pose": pose,
            "joint_positions": list(q),
            "target_q": goal,
            "target_tcp_pose": tcp_pose(self.model, goal),
            "serial_number": self.serial,
            "software_version": "SIM",
            "safety_mode": "NORMAL",
            "robot_mode": "RUNNING" if not self.is_steady(now) else "IDLE",
            "program_state": "STOPPED",
            "running": not self.is_steady(now),
            "remote_control": True,
            "speed_scaling": self.speed_scaling,
            "up_time_seconds": self._t_now(now) - self.created_at,
            "joint_limits_deg": _limits_deg(self.limits),
        }


# ---------------------------------------------------------------------------
# 时间/几何辅助
# ---------------------------------------------------------------------------

def _clamp_speed(value):
    try:
        speed = float(value)
    except (TypeError, ValueError):
        return 1.0
    if not (speed == speed) or speed <= 0:  # NaN / <=0
        return 1.0
    return max(0.01, min(1.0, speed))


def _normalize_pose(pose):
    """把调用方给的位姿规整成 6 个浮点（缺的补 0）—— 手工输入的 pose 常常少给旋转分量。"""
    return [float(pose[i]) if isinstance(pose, (list, tuple)) and i < len(pose)
            and isinstance(pose[i], (int, float)) else 0.0 for i in range(6)]


def _interpolate_poses(start, goal, step_m=0.01, max_steps=800):
    """`start → goal` 的 Cartesian 直线细分（含终点，不含起点）。

    位置线性；姿态在**旋转向量空间**线性插值 —— 绕单一轴转动时精确，一般情形是近似
    （真机的 movel 由控制器做姿态插补，仿真不做四元数球面插值）。这个近似写进了文档。
    """
    start = _normalize_pose(start)
    goal = _normalize_pose(goal)
    span = math.sqrt(sum((goal[i] - start[i]) ** 2 for i in range(3)))
    step = step_m if isinstance(step_m, (int, float)) and step_m > 0 else 0.01
    count = 1 if span <= step else min(max_steps, int(math.ceil(span / step)))
    out = []
    for k in range(1, count + 1):
        u = k / float(count)
        out.append([start[i] + (goal[i] - start[i]) * u for i in range(6)])
    return out


def _travel_duration(travel, v, a, speed_scaling=1.0):
    """走完 `travel`（关节空间弧度）**需要多久**：匀速下限与三角速度剖面取大者，再按倍率缩放。

    只吃一个**标量行程**，所以单段和整条折线都能用（`_plan` 用的是整条折线的总行程）。
    不在这里压 `_MIN_SEGMENT_S`：那是"总时长"的下限，由调用方对总时长压一次，
    逐段压会毁掉按位移分配时间的比例。
    """
    travel = float(travel) if isinstance(travel, (int, float)) else 0.0
    if travel <= 1e-12:
        return 0.0
    speed = max(1e-4, float(v) if isinstance(v, (int, float)) and v > 0 else 1.05) * _clamp_speed(speed_scaling)
    accel = float(a) if isinstance(a, (int, float)) and a > 0 else 1.4
    by_speed = travel / speed
    by_accel = 2.0 * math.sqrt(travel / max(1e-4, accel))
    return max(by_speed, by_accel)


def _format_pose(pose):
    try:
        return "[%s]" % ", ".join("%.4f" % float(pose[i]) for i in range(6))
    except Exception:
        return str(pose)


def _limits_deg(limits):
    out = []
    for pair in limits:
        if pair is None:
            out.append(None)
        else:
            out.append([math.degrees(pair[0]), math.degrees(pair[1])])
    return out
