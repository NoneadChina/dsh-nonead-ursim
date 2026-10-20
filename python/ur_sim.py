"""
python/ur_sim.py — 运动学级离线仿真引擎（**没有任何网络/机器人调用**）。

© 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com

## 这个模块是什么

`ur_worker.py` 用它实现「离线仿真」：一个**虚拟机器人**，让 AI 在没有真机的情况下驱动数字
仿真里的模型动起来。它只做**运动学**：正解、逆解、关节/笛卡尔轨迹插值、位姿读回。

## 它明确**不是**什么（诚实边界，务必与 README 一致）

- 没有动力学：不做力矩、惯性、重力、碰撞检测、关节伺服误差。
- 没有控制器：安全状态、程序执行（.urp）、RTDE 遥测（温度/电流/电压/受力）、工具 I/O、
  寄存器、传送带**都不存在可模拟的语义** —— 那些指令一律由 `ur_worker.py` 明确回报
  「无仿真语义」，而不是给一个看起来能跑的结果。
- 时间参数是**近似**：`a`/`v` 只用来决定每段运动的时长（smoothstep 时间标度），
  不做真实控制器的梯形/jerk 限幅。

## 与仿真的一致性（硬约束）

仿真客户端用 `src/client/robot/fk.js` 从 `q` 正解出 TCP 与各连杆位姿。所以：

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

import functools
import json
import math
import os
import threading
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

    为什么缓存：仿真 20 Hz 推送每一帧都要正解，重复读盘是纯粹的浪费；文件在运行期不会变。
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

    仿真按 `snap.model` 小写化后取 GLB 与运动学，所以大小写不影响渲染；这个转换只为让
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


def _rotate_vector(m, v):
    """用列主序 4×4 矩阵的左上 3×3 部分旋转三维向量（速度流换系用）。

    `m[col*4 + row]` 是第 `row` 行第 `col` 列，所以 `out[row] = Σ_col m[col*4+row]·v[col]`。
    """
    return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
            m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
            m[2] * v[0] + m[6] * v[1] + m[10] * v[2]]


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
    - 关节限位在**接受结果时**校验（越限即判失败，绝不悄悄钳到边界 —— 那会让仿真画出
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


# 逆解连续性门（相邻航点允许的最大单关节跳变，弧度）。
#
# 为什么是 0.5 rad：movel 沿直线每 1 cm 取一个细分点，正常连续跟踪时相邻细分点的关节变化
# 在 0.01 rad 量级（1 m 处 1 cm ≈ 0.01 rad）；近奇异位形会大一些，但仍远小于"换构型 /
# 换分支"的跳变。多起点兜底实测会返回与上一航点差 3.14 / 5.30 / 6.71 rad 的解（腕部翻半圈、
# 换一只"手"），那是真机在 1 cm 内绝对走不出来的折线 —— 仿真却会把它画成一条平滑轨迹并回报
# "已到达目标"。0.5 rad（≈28.6°）给正常轨迹留了约 50 倍余量，同时能拦下所有分支级跳变。
MAX_IK_STEP_RAD = 0.5


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


def _local_retry_seeds(seeds, spread=0.05):
    """连续性门拒绝兜底解之后的**局部重解**种子：调用方种子 + 每个关节 ±spread 的小扰动。

    为什么需要这一步：兜底解被判定"与上一航点不连续"**不等于**这个位姿不可达 —— 也可能
    只是从上一航点出发、120 次迭代没能收敛。此时只从上一航点附近（含小扰动）多迭代几步，
    仍失败才判不可达；绝不能拿一个跳变很大的兜底解冒充"到达"。
    """
    out = []
    for seed in seeds or []:
        if not isinstance(seed, (list, tuple)):
            continue
        base = [float(seed[i]) if i < len(seed) else 0.0 for i in range(6)]
        out.append(base)
        for joint in range(6):
            for sign in (-1.0, 1.0):
                bumped = list(base)
                bumped[joint] += sign * spread
                out.append(bumped)
    return out


def ik_reachable(model_id, target_matrix, seeds, limits=None, iterations=120, max_step=None):
    """多起点逆解：**先按给定顺序试（第一个通常是当前/上一个途经点，最省事）**，
    再试手挑的兜底起点，最后试一组确定性伪随机起点。

    返回 `q` 或 `None`。`None` 的语义是"这些起点都收敛不到该位姿" —— 调用方据此报
    「逆解失败（可能不可达/越限/近奇异）」，而不是静默糊一个近似姿态。

    `max_step`（弧度；`None` 表示不设门）是**连续性门**：非 `None` 时，任何收敛解除了
    要解出来，还必须与调用方的**第一个种子**（= 上一个航点）满足 `max|Δq| <= max_step`，
    比较按**最短关节路径**（关节角是模 2π 的）。为什么必须有：多起点兜底会解出属于另一个
    构型分支的解 —— 对"1 cm 的相邻航点"来说，那就是一条真机绝对走不出来的折线，而回包
    仍会说"已到达目标"。

    连续性门拒掉兜底解之后，会**只用局部种子再重解一次**（含小扰动、更多迭代）；仍失败
    才返回 `None`。这样真正需要多起点的合法位姿不会因为这道门本身被误判成不可达。

    ⚠️ 这条路径**只在失败时才贵**：正常情况第一个起点（上一个途经点）几步就收敛。
    """
    given = [s for s in (seeds or []) if isinstance(s, (list, tuple))]
    anchor = None
    if max_step is not None and given:
        anchor = [float(given[0][i]) if i < len(given[0]) else 0.0 for i in range(6)]
    tried = []
    candidates = list(seeds or []) + list(_FALLBACK_SEEDS) + _pseudo_random_seeds()
    for seed in candidates:
        key = tuple(round(float(v), 6) for v in (seed if isinstance(seed, (list, tuple)) else []))
        if key in tried:
            continue
        tried.append(key)
        got = ik(model_id, target_matrix, seed, limits=limits, iterations=iterations)
        if got is None:
            continue
        if anchor is not None and _max_joint_step(got, anchor) > float(max_step):
            continue
        return got
    if anchor is not None:
        # 只从局部种子重解一次：多给一倍迭代，仍不连续/不收敛才判不可达。
        retry_iterations = max(int(iterations), 120) * 2
        for seed in _local_retry_seeds(given):
            got = ik(model_id, target_matrix, seed, limits=limits, iterations=retry_iterations)
            if got is None:
                continue
            if _max_joint_step(got, anchor) <= float(max_step):
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


def _max_joint_step(a, b):
    """两个关节配置之间**按最短路径**的最大单关节变化（弧度）。

    必须按最短路径算：`q5=5.58` 与 `q5=-0.70` 是同一个姿态（差 2π，真机也只走最短路径），
    直接相减会把它误判成 6.28 rad 的跳变。
    """
    return max(abs(v) for v in _shortest_joint_delta(a, b))


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

# 单段运动的最短时长（秒）：太短会让 20 Hz 的仿真丢帧（看不清动作）
_MIN_SEGMENT_S = 0.05

# 速度流**单帧**最大积分步长（秒）。
#
# 速度流（`speedl` 语义）是"每来一帧就按 Δt 积分"的：浏览器卡一下、推送线程被占住几秒
# 都是常态。若直接按墙上时钟差积分，一次 3 秒的停顿会在下一帧把机械臂**瞬移** 3·v 米
# （然后是必然的逆解失败、twist 被清 —— 用户看到的就是"按了一下就卡死"）。钳到 0.1 s
# 后，最坏情况是"少走了一点"，而不是"跳过去"。
_MAX_TWIST_DT = 0.1


def _locked(method):
    """把 `VirtualRobot` 的方法串行化在同一把**可重入**锁上。

    为什么需要：一台虚拟机器人有**两条线程**同时碰它 ——
    · 命令线程（worker 主线程）：`move_joints` / `move_cartesian` / `set_twist` / `stop` …；
    · 推送线程（`_twin_push_loop`，20 Hz）：`snapshot()` → `advance()`。

    没有锁时 `advance()` 的「读 `_last_advance_at` → 按 Δt 积分 → 写 `_last_advance_at`」
    与 `_plan()` 的「写 5 个字段（`_waypoints` / `_segment_s` / `_total_s` / `_started_at`）」
    可以交错，后果有两种，都是**看起来正常、实际错**：

    1. **撕裂帧**：推送线程在 `_waypoints` 已更新、`_started_at` 还是旧值时取帧 ⇒ `u ≥ 1`
       ⇒ 这一帧直接画在终点，下一帧再弹回起点（画面上闪一下，很难复现也很难归因）；
    2. **双积分**：推送线程与命令线程同时观测到同一段 Δt>0，速度流被积两次 ⇒ 实际位移
       是请求速度的两倍。

    用 `RLock` 而不是 `Lock`：`_plan` / `move_*` / `status` 之间有嵌套调用，普通 `Lock`
    会在自身上直接死锁。
    """
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        with self._lock:
            return method(self, *args, **kwargs)
    return wrapper


class VirtualRobot:
    """一台**虚拟 UR**：只有运动学状态，没有控制器、没有网络。

    运动模型（"运动学级"的全部含义）：

    - 一条运动是**关节空间的折线** `[q0, q1, … qn]` + 每段时长；
    - 每段时长取 `max(maxdq / v_eff, 2·sqrt(maxdq / a))` —— 前者是匀速下限、后者是
      三角速度剖面的最短时间；位置用 **smoothstep** 时间标度（起停平滑，但不做 jerk 限幅）；
    - 状态是**纯函数式推进**的：`advance()` 按墙上时钟算出当前 q，**不需要线程**。
      于是 20 Hz 的仿真推送线程读到的是连续姿态，而命令线程只需等到 `is_steady()`。
    - `target_q` 是这条运动的终点（等价真机 RTDE 的 `target_q`），用于仿真的"幽灵臂"。
    """

    def __init__(self, ip, model, q=None, speed_scaling=1.0, preset="zero"):
        # 推送线程（20 Hz `snapshot()`）与命令线程共用同一份状态，先建锁（见 `_locked`）。
        self._lock = threading.RLock()
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
        # ── 速度流（`speedl` 语义）────────────────────────────────────────────
        # `twist` = [vx,vy,vz,ωx,ωy,ωz]（m/s、rad/s），`frame` 决定它表达在哪个坐标系；
        # `_twist_deadline` 是**看门狗**截止时刻：到点没收到新指令就自动归零。
        self._twist = [0.0] * 6
        self._twist_frame = "base"
        self._twist_deadline = 0.0
        # 上一次 `advance()` 的时刻（速度流用它算 Δt）。None ⇒ 还没有过推进。
        self._last_advance_at = None
        # 速度流被逆解拒绝过没有（供 `status()` / `twist_state()` 如实回报）。
        self._twist_rejected = False
        self._twist_reject_reason = ""
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
        视觉上就是一顿一顿，仿真每帧拿到的关节角速度也忽大忽小、插值后像在跳帧。
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

    @_locked
    def advance(self, now=None):
        """把内部 `q` 推到"现在"；返回当前 q。

        这里有**两条互斥的推进通道**：

        1. **速度流**（`speedl` 语义）：`twist` 非零且没到看门狗截止时间 ⇒ 按 Δt 积一帧；
        2. **轨迹段**（既有 `_plan` 折线）：没有有效速度流时按 elapsed 采样。

        为什么必须互斥：两条通道都写同一个 `q`，同时推进等于"轨迹走一点、速度再叠一点"，
        而且用的是两条不同的时间基准（`_started_at` vs 上一帧 `advance` 的时刻）。互斥之后
        任一时刻只有一个来源在决定位姿，"这一帧到底走了多少"才可解释。

        看门狗过期（或全零 twist）时也要**把当前姿态锚成新轨迹**：否则回到轨迹段会按
        `elapsed` 采样到速度流开始之前的旧航点，机械臂会"弹回去"。
        """
        now = self._t_now(now)
        if self._twist_live(now):
            self._integrate_twist(now)
            return self.q
        if any(abs(v) > 1e-12 for v in self._twist):
            # 到点自动归零（看门狗）。这是最后的安全底线：浏览器崩溃/标签页被杀时，
            # 不会再有新的 velocity 指令来续命。
            self._twist = [0.0] * 6
            self._freeze_current(now)
        self.q = self._sample(self.elapsed(now))
        self._last_advance_at = now
        return self.q

    @_locked
    def is_steady(self, now=None):
        """速度流有效期间**永远不算"稳态"**（它会一直走下去，直到停或看门狗到点）。"""
        now = self._t_now(now)
        if self._twist_live(now):
            return False
        return self.elapsed(now) >= self._total_s - 1e-9

    # ── 速度流（`speedl` / `stopl` 语义）─────────────────────────────────────
    def _twist_live(self, now):
        """这一时刻速度流是否仍在生效（非零 + 未过看门狗截止时间）。"""
        return now <= self._twist_deadline and any(abs(v) > 1e-12 for v in self._twist)

    def _freeze_current(self, now):
        """把当前 `q` 变成一条**零长度轨迹**：之后 `_sample` 恒回当前姿态。

        速度流是逐帧改 `q` 的，而 `_sample` 只会沿 `_waypoints` 插值。不同步这两者，
        速度流一结束（stopl / 看门狗到点）机械臂就会跳回上一段轨迹的航点。
        """
        self._waypoints = [list(self.q)]
        self._segment_s = [_MIN_SEGMENT_S]
        self._total_s = 0.0
        self._started_at = now

    @_locked
    def set_twist(self, twist, frame="base", ttl_s=0.4, now=None):
        """写入一条**速度流**（`speedl` 语义）并武装看门狗。

        - `twist` 六元有限数，`[vx,vy,vz,ωx,ωy,ωz]`（m/s、rad/s）；
        - `frame`：`'base'`（缺省）或 `'tool'` —— 线速度与角速度都表达在那个坐标系里；
        - `ttl_s`：看门狗时长（秒）。到点没有新指令 ⇒ 自动归零（见 `advance()`）；
        - **全零 twist 等价于 stop**（协议里明确允许），按停止处理。

        速度流从**当前姿态**起步：先把剩下的轨迹段清掉（等价于"新的运动指令接管"）。
        否则 `advance()` 里的互斥规则会让"段"和"速度流"互相僵住 —— 段不推进、速度也不
        推进，机械臂原地不动直到看门狗过期。
        """
        if not isinstance(twist, (list, tuple)) or len(twist) != 6:
            raise SimError("速度流需要 6 维 twist（vx,vy,vz,ωx,ωy,ωz），收到 %r" % (twist,),
                           "SIM_BADARG")
        values = []
        for value in twist:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise SimError("速度流 twist 含非数值元素：%r" % (value,), "SIM_BADARG")
            number = float(value)
            if not math.isfinite(number):
                raise SimError("速度流 twist 含非有限数值（NaN/Infinity），已拒绝", "SIM_BADARG")
            values.append(number)
        if frame not in ("tool", "base"):
            raise SimError("速度流的 frame 必须是 'tool' 或 'base'，收到 %r" % (frame,),
                           "SIM_BADARG")
        now = self._t_now(now)
        # 续命之前先把**旧 twist** 从「上一次 advance」积到"现在"。
        #
        # 为什么必须补这一段：面板按住时每 ~100ms 发一条 velocity，而推送线程 20Hz 调
        # advance()。若这里直接改锚点，两条指令之间那段时间就被丢掉了 —— 实测 1 秒的
        # 连续点动只走了请求速度的 **64%**，而且比例随推送节奏抖动（按住不放却越走越慢）。
        # 先积分再接管，运动总位移才只取决于墙上时钟。
        if self._twist_live(now) and any(abs(v) > 1e-12 for v in values):
            self._integrate_twist(now)
        # 接管当前姿态：清掉残留轨迹段（与 `stop()` 同一手法，但不把 move_count 当运动）。
        current = self._sample(self.elapsed(now))
        self._waypoints = [list(current)]
        self._segment_s = [_MIN_SEGMENT_S]
        self._total_s = 0.0
        self._started_at = now
        self.q = list(current)
        self._twist_rejected = False
        self._twist_reject_reason = ""
        # 首帧不跳：下一次 advance 的 Δt 从"收到这条指令的时刻"算起。
        self._last_advance_at = now
        if all(abs(v) <= 1e-12 for v in values):
            # 全零 = stop：不保留一个"零速度的武装状态"。
            self._twist = [0.0] * 6
            self._twist_frame = frame
            self._twist_deadline = now
            return
        try:
            ttl = float(ttl_s)
        except (TypeError, ValueError):
            ttl = 0.4
        if not math.isfinite(ttl) or ttl <= 0.0:
            ttl = 0.4
        self._twist = values
        self._twist_frame = frame
        self._twist_deadline = now + ttl

    @_locked
    def stop_twist(self, now=None):
        """立即清掉速度流（`stopl` / 全零 twist 语义）。位姿保持不动。"""
        now = self._t_now(now)
        self.q = list(self._sample(self.elapsed(now)))
        self._twist = [0.0] * 6
        self._twist_deadline = now
        self._last_advance_at = now
        # 冻结当前姿态：之后不会再有任何通道把它推回去。
        self._freeze_current(now)

    @_locked
    def twist_state(self, now=None):
        """速度流的只读快照（供 `status()` 与测试核对"到底停了没有/为什么停"）。"""
        now = self._t_now(now)
        return {
            "twist": list(self._twist),
            "frame": self._twist_frame,
            "deadline": self._twist_deadline,
            "active": self._twist_live(now),
            "rejected": bool(self._twist_rejected),
            "reject_reason": self._twist_reject_reason,
        }

    def _integrate_twist(self, now):
        """按 Δt 把 twist 积一帧：位姿 → 逆解 → 关节角。

        线速度直接加在 TCP 位置上；角速度用 `R_axis(ω·Δt)` 做**严格旋转合成**：
        基座系左乘 `R_δ·R`，工具系右乘 `R·R_δ`（与 `jog_rotate` 同一套约定）。

        逆解失败（不可达 / 与上一帧不连续）时**保持当前关节角并清掉 twist**：
        不抛错、不卡死 —— 面板会一直按着点动键，抛错只会把 worker 主线程变成一条
        错误流；而"停在原地 + 如实记录被拒"才是安全且可解释的行为。
        """
        dt = 0.0 if self._last_advance_at is None else now - self._last_advance_at
        if not math.isfinite(dt) or dt <= 0.0:
            # 首帧（Δt=0）不能跳：必须从收到指令的位置起步。
            self._last_advance_at = now
            return
        dt = min(dt, _MAX_TWIST_DT)
        pose = tcp_pose(self.model, self.q)
        rotation = matrix_from_axis_angle(0.0, 0.0, 0.0, pose[3], pose[4], pose[5])
        linear = self._twist[0:3]
        angular = self._twist[3:6]
        delta = matrix_from_axis_angle(0.0, 0.0, 0.0,
                                       angular[0] * dt, angular[1] * dt, angular[2] * dt)
        if self._twist_frame == "tool":
            # 工具系：线速度先旋到基座系；姿态右乘（绕工具自己的轴）。
            linear_base = _rotate_vector(rotation, linear)
            target_rotation = multiply4(rotation, delta)
        else:
            linear_base = list(linear)
            target_rotation = multiply4(delta, rotation)
        target = list(target_rotation)
        target[12] = pose[0] + linear_base[0] * dt
        target[13] = pose[1] + linear_base[1] * dt
        target[14] = pose[2] + linear_base[2] * dt
        solved = ik_reachable(self.model, target, [self.q], limits=self.limits,
                              max_step=MAX_IK_STEP_RAD)
        if solved is None:
            self._twist = [0.0] * 6
            self._twist_rejected = True
            self._twist_reject_reason = (
                "速度流的目标位姿在运动学上不可达：局部逆解不收敛，或解与上一帧**不连续**"
                "（跳变超过 %.1f rad）。速度流已自动清零，关节角保持在拒绝时的位置。"
                % MAX_IK_STEP_RAD)
            self._freeze_current(now)
            self._last_advance_at = now
            return
        self.q = [float(v) for v in solved]
        self._freeze_current(now)
        self._last_advance_at = now

    @_locked
    def target_q(self):
        return list(self._waypoints[-1])

    # ── 运动指令 ──────────────────────────────────────────────
    @_locked
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
        # 任何**离散**运动指令都接管速度流：否则一条 movel 走完、看门狗又还没到点时，
        # 之前那条 speedl 会"复活"，机械臂自己又走起来 —— 那不是任何一方的本意。
        self._twist = [0.0] * 6
        self._twist_deadline = 0.0
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

    @_locked
    def move_joints(self, q_goal, v=1.05, a=1.4, now=None, total_s=None):
        """movej：目标关节角（按最短路径）。越限直接拒绝。"""
        goal = [float(q_goal[i]) for i in range(6)]
        if not _within_limits(self.model, goal, self.limits):
            raise SimError("目标关节角超出 %s 的关节限位，已拒绝（仿真不会替你钳到边界）"
                           % canonical_model_name(self.model), "SIM_JOINT_LIMIT")
        current = self._sample(self.elapsed(now))
        delta = _shortest_joint_delta(current, goal)
        self._plan([[current[i] + delta[i] for i in range(6)]], v, a, now=now, total_s=total_s)

    @_locked
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
            ok = ik_reachable(self.model, pose_to_matrix_axis_angle(pose), [seed],
                              limits=self.limits, max_step=MAX_IK_STEP_RAD)
            if ok is None:
                raise SimError(
                    "第 %d 个途经点在运动学上不可达：局部逆解不收敛，或收敛到与上一航点**不连续**的"
                    "另一个构型分支（跳变超过 %.1f rad）。多起点兜底解不连续时本仿真**拒绝**它 ——"
                    "那种跳变会让仿真画出一条真机在相邻航点之间走不出来的折线。%s。"
                    "movel 的每个细分点都要求可解且连续；请拆成多段、改目标或改起始姿态。"
                    % (index, MAX_IK_STEP_RAD, _format_pose(pose)), "SIM_UNREACHABLE")
            waypoints.append(list(ok))
            seed = list(ok)
        self._plan(waypoints, v, a, now=now, total_s=total_s)

    @_locked
    def move_cartesian_path(self, waypoints, v=0.25, a=1.2, now=None):
        """movep 语义：一趟走过多个 Cartesian 途经点（每个点各自逆解，不细分直线）。"""
        return self.move_cartesian(waypoints, v, a, now=now)

    @_locked
    def run_sequence(self, segments, v=0.25, a=1.2, step_m=0.01, now=None, total_s=None):
        """**多段连续运动**：把每一段转成关节航点后拼成一条折线，只排**一次**时间表。

        ★ 这个方法存在的全部理由就是 `_plan` 的语义（见它的文档）：它把整条折线排成**一条**
        时间剖面。于是段与段之间**不会各自起停** —— 20 段也只是一次加速、一次减速。反过来，
        逐段调用 `move_joints` / `move_cartesian` 会让每一段都收敛到零速度再重新加速，那就是
        20 次起停，与"一条连续轨迹"是两回事。这也是本方法**不**复用 `move_cartesian` 的原因：
        那个方法内部就调用了 `_plan`，每段一次。

        `segments` 形如
        `[{"type": "joint", "q": [6 个数]}, {"type": "cartesian", "pose": [6 个数]}, …]`：

        - `joint` 段：按**最短路径**取目标（与 `move_joints` / 真机 movej 同一个约定），并校验
          关节限位；
        - `cartesian` 段：照 `move_cartesian` 的做法，对**上一个航点的 TCP** 按 `step_m` 细分
          直线（joint 段之后那个 TCP 是关节角的**正解**，而不是调用方写下的位姿），每个细分点
          以上一点为种子求逆解；
        - 任一段任一点无解 ⇒ **整条序列失败**（`SIM_UNREACHABLE`），绝不跳过这一段继续走 ——
          在这条路径上"跳过"等于悄悄把调用方要的路线换成了另一条。
        """
        if not segments:
            raise SimError("run_sequence 需要至少一段（segments 不能为空）", "SIM_BADARG")
        current = self._sample(self.elapsed(now))
        waypoints = []
        seed = list(current)
        # "上一个 TCP"（下一条 cartesian 直线的起点）。`_plan` 会把**当前实际姿态**接在折线
        # 开头，所以这里不重复放起点。
        last_pose = tcp_pose(self.model, current)
        for index, segment in enumerate(segments, start=1):
            kind = str(segment.get("type", "")).strip().lower() if isinstance(segment, dict) else ""
            if kind == "joint":
                goal = _segment_vector(segment, "q", index, "joint 段的 q")
                if not _within_limits(self.model, goal, self.limits):
                    raise SimError(
                        "第 %d 段（joint）的目标关节角超出 %s 的关节限位，已拒绝"
                        "（仿真不会替你钳到边界）" % (index, canonical_model_name(self.model)),
                        "SIM_JOINT_LIMIT")
                delta = _shortest_joint_delta(seed, goal)
                goal = [seed[i] + delta[i] for i in range(6)]
                waypoints.append(goal)
                seed = list(goal)
                last_pose = tcp_pose(self.model, goal)
                continue
            if kind == "cartesian":
                target = _segment_vector(segment, "pose", index, "cartesian 段的 pose")
                chain = _interpolate_poses(last_pose, target, step_m)
                for point_index, pose in enumerate(chain, start=1):
                    got = ik_reachable(self.model, pose_to_matrix_axis_angle(pose),
                                       [seed], limits=self.limits, max_step=MAX_IK_STEP_RAD)
                    if got is None:
                        raise SimError(
                            "第 %d 段（cartesian）的第 %d 个细分点在运动学上不可达：局部逆解不收敛，"
                            "或收敛到与上一航点**不连续**的另一个构型分支（跳变超过 %.1f rad）。"
                            "多起点兜底解不连续时本仿真**拒绝**它 —— 那种跳变会让仿真画出一条真机在"
                            "相邻航点之间走不出来的折线。%s。整条序列已失败：每个细分点都要求可解且"
                            "连续，序列**不会**跳过这一段继续走（请拆成多段、改目标或改起始姿态）。"
                            % (index, point_index, MAX_IK_STEP_RAD, _format_pose(pose)),
                            "SIM_UNREACHABLE")
                    waypoints.append(list(got))
                    seed = list(got)
                last_pose = tcp_pose(self.model, seed)
                continue
            raise SimError(
                "第 %d 段的 type 必须是 'joint' 或 'cartesian'，收到 %r"
                % (index, segment.get("type") if isinstance(segment, dict) else segment),
                "SIM_BADARG")
        self._plan(waypoints, v, a, now=now, total_s=total_s)

    @_locked
    def servoj(self, q_goal, now=None):
        """servoj：直接把姿态设过去（真机是 500 Hz 流式伺服；这里退化成一次瞬时到位）。

        ⚠️ 语义差异是**故意暴露**的：仿真不模拟伺服带宽，文档里写明。
        """
        goal = [float(q_goal[i]) for i in range(6)]
        if not _within_limits(self.model, goal, self.limits):
            raise SimError("servoj 目标超出关节限位", "SIM_JOINT_LIMIT")
        self._plan([goal], 1.05, 1.4, now=now)

    @_locked
    def stop(self, now=None):
        """stopj/stopl：在当前姿态冻结（清掉剩余轨迹**与速度流**）。"""
        now = self._t_now(now)
        current = self._sample(self.elapsed(now))
        self._waypoints = [list(current)]
        self._segment_s = [_MIN_SEGMENT_S]
        # 总时长必须是 **0**（不是 `_MIN_SEGMENT_S`）：`is_steady()` 判的是
        # `elapsed >= _total_s`，而 stop 之后 `_started_at = now` ⇒ elapsed 从 0 起算。
        # 若这里写 0.05，紧接的 `get_robot_mode` / `status.running` / 短超时 `wait_steady`
        # 会在 50ms 内报"还在动" —— 与 `stopj`/`stopl` 的"已停"语义自相矛盾，也与
        # `_freeze_current()`（同一个动作，写的就是 0.0）不一致。
        self._total_s = 0.0
        self._started_at = now
        self.q = list(current)
        # 速度流同样是"还在动"的一种：stop 之后必须一起清掉，否则下一帧 advance 会继续积分。
        self._twist = [0.0] * 6
        self._twist_deadline = now
        self._last_advance_at = now

    @_locked
    def speedj_probe(self):
        """当前最大关节速度（rad/s）—— 只读、用于 `ursim_wait_steady` 之外的诊断。

        两个采样点必须来自**同一条时间基准**、且都不推进状态：
        · 旧实现用 `self.advance()` 取"现在"，它既会按墙钟推进 `q`，也会积分速度流 /
          触发看门狗 —— 一个"只读诊断"因此有了副作用；
        · 旧实现的 `later` 被 `min(self._total_s, …)` 饱和：轨迹走完时两点永远相同 ⇒ 恒 0；
          速度流有效时 `_sample` 返回的是轨迹点（与 q 无关）⇒ 结果是噪声。

        现在：`now` 取 `elapsed()` 的同一基准，`later` 取 `now + step`，`_sample` 在
        `u ≥ 1` 时原样返回终点 ⇒ 轨迹走完时速度恒为 0，运动中则是终点方向的真实差分。
        """
        step = 1e-3
        base = self.elapsed()
        now = self._sample(base)
        later = self._sample(base + step)
        return max(abs(later[i] - now[i]) / step for i in range(6))

    # ── 读回 ──────────────────────────────────────────────────
    @_locked
    def snapshot(self, now=None):
        """仿真推送用的一帧：**只给 q 与由 q 正解出的 tcp**（保证界面与读回一致）。"""
        q = self.advance(now)
        tcp = tcp_pose(self.model, q)
        return {"q": list(q), "tcp": tcp}

    @_locked
    def target_snapshot(self, now=None):
        """控制器"打算去哪"（仿真的幽灵臂）：终点关节角与其正解 TCP。"""
        goal = self.target_q()
        return {"target_q": goal, "target_tcp": tcp_pose(self.model, goal)}

    @_locked
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
            # 速度流的实时状态（active / 看门狗截止时刻 / 是否被逆解拒绝过）：
            # 面板与排障脚本据此区分"已停"与"还在按着"。
            "twist": self.twist_state(now),
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


def _segment_vector(segment, key, index, what):
    """取 `run_sequence` 某一段里的 6 维 q/pose；不合格就抛 `SimError`（**不**宽容补零）。

    为什么不复用 `_normalize_pose`：那个是给"手工输入的位姿常常少给旋转分量"准备的宽容解析，
    少几个就补 0。但段是**批量**输入：少一个数、或者形状搞错了，补零只会把它悄悄变成另一个
    目标 —— 而这是一条序列，走错一段就是走错整条轨迹。批量输入的容错代价与单条指令完全不同。
    """
    raw = segment.get(key) if isinstance(segment, dict) else None
    if not isinstance(raw, (list, tuple)) or len(raw) != 6:
        raise SimError("第 %d 段的 %s 必须是 6 维数组，收到 %r" % (index, what, raw), "SIM_BADARG")
    out = []
    for value in raw:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise SimError("第 %d 段的 %s 含非数值元素：%r" % (index, what, value), "SIM_BADARG")
        number = float(value)
        if not math.isfinite(number):
            raise SimError("第 %d 段的 %s 含非有限数值（NaN/Infinity），已拒绝" % (index, what),
                           "SIM_BADARG")
        out.append(number)
    return out


def _mat4_mul(a, b):
    """两个 4×4 **列主序**矩阵相乘（布局与 `matrix_from_axis_angle` 一致）。"""
    out = [0.0] * 16
    for col in range(4):
        for row in range(4):
            out[col * 4 + row] = (a[row] * b[col * 4]
                                  + a[4 + row] * b[col * 4 + 1]
                                  + a[8 + row] * b[col * 4 + 2]
                                  + a[12 + row] * b[col * 4 + 3])
    return out


def _mat4_transpose(m):
    return [m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15]]


def _interpolate_poses(start, goal, step_m=0.01, max_steps=800):
    """`start → goal` 的 Cartesian 直线细分（含终点，不含起点）。

    位置线性；姿态走**球面插值**：取相对旋转 `R_startᵀ·R_goal` 的旋转向量（角度必在
    [0, π]，天然走短边），再按弧长比例旋转起始姿态。**终点精确等于目标姿态** ——
    这一点是硬要求：逐分量线性插值（旧实现）在 `rx` 跨 ±π 时会把 6.28 rad 走成长边，
    且 `start + wrapped_delta` 一般**不是**目标旋转（多轴时甚至不是同一朝向），
    `jog_rotate` 回报的目标姿态与实际到位姿态就会对不上。

    细分步数取「位移细分」与「姿态细分」的**较大者**：纯原地转动（位置没变、只有 rx/ry/rz
    变化）以前 `span = 0` ⇒ 只产生 1 个中间点，整段姿态变化被压成一步"瞬转"，
    `wait_steady` 几乎立刻报稳。姿态分辨率固定为 0.01 rad（≈0.57°），与 step_m 无关。
    """
    start = _normalize_pose(start)
    goal = _normalize_pose(goal)
    m_start = matrix_from_axis_angle(0.0, 0.0, 0.0, *start[3:6])
    m_goal = matrix_from_axis_angle(0.0, 0.0, 0.0, *goal[3:6])
    rel = axis_angle_from_matrix(_mat4_mul(_mat4_transpose(m_start), m_goal))
    pos_span = math.sqrt(sum((goal[i] - start[i]) ** 2 for i in range(3)))
    rot_span = math.sqrt(sum(v * v for v in rel))
    step = step_m if isinstance(step_m, (int, float)) and step_m > 0 else 0.01
    pos_count = 1 if pos_span <= step else int(math.ceil(pos_span / step))
    rot_count = 1 if rot_span <= 0.01 else int(math.ceil(rot_span / 0.01))
    count = min(max_steps, max(pos_count, rot_count))
    # 姿态变化可忽略（纯平移）时**原样沿用起始姿态**：`矩阵 → 旋转向量` 在 θ≈π 附近
    # 的往返误差约 1e-6 rad，会把"沿轴平移"的中间航点微微拧一下，最终位姿也就带上
    # 同样量级的姿态漂移。（终点下面直接取 goal 的三个分量，天然精确。）
    pure_translation = rot_span < 1e-9
    out = []
    for k in range(1, count + 1):
        u = k / float(count)
        pos = [start[i] + (goal[i] - start[i]) * u for i in range(3)]
        if k == count:
            out.append(pos + list(goal[3:6]))
            continue
        if pure_translation:
            out.append(pos + list(start[3:6]))
            continue
        m = _mat4_mul(m_start, matrix_from_axis_angle(0.0, 0.0, 0.0,
                                                      rel[0] * u, rel[1] * u, rel[2] * u))
        out.append(pos + axis_angle_from_matrix(m))
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
