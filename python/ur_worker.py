"""
dsh-nonead-ursim — persistent UR control worker.

© 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com

A stdio JSON worker that owns Universal Robots connections for a DSH plugin.
It reuses the URBasic library (vendored from the reference nUR MCP server) and
keeps one RTDE / Dashboard / RealTime client per robot IP alive across calls so
the model issues one `connect` and many commands without re-establishing links.

Protocol (line-delimited JSON over stdin/stdout):

  request : {"id": <int>, "op": "<op>", "<param>": <value>, ...}
  response: {"id": <int>, "ok": true,  "data": <any>}
            {"id": <int>, "ok": false, "error": "<message>", "data": <any|null>}

The worker reads one request per line, runs it, writes exactly one response
line and flushes. It is deliberately single-threaded and serial; long motion
commands are bounded by the move-confirmation loops below.
"""

import json
import math
import os
import re
import shlex
import sys
import threading
import time
import traceback

# URBasic / RTDE returns numpy arrays and scalars for pose/register/temperature
# data; convert them to native JSON types at the serialization boundary.
import numpy as np


def _json_default(obj):
    """json.dumps default: make numpy values JSON-serializable."""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    raise TypeError("Object of type %s is not JSON serializable" % type(obj).__name__)


# ---- 结构化错误码 ---------------------------------------------------------
#
# 协议过去只有一句中文 `error` 字符串，模型/脚本无法据此分支处理（"连不上"和"参数非法"
# 都是同一种失败）。现在补一个稳定的 `code`，同时**保留**人类可读的 error 文本。
#
# 为什么 `respond()` 还要拒绝 NaN/Infinity：Python 的 json.dumps 默认把它们写成
# `NaN` / `Infinity` —— 那不是合法 JSON，Node 的 JSON.parse 会抛，而 worker.js 的
# `_onLine` 又会**静默丢弃**解析失败的行 ⇒ 调用方只看到一句笼统的 "timed out"，
# 真正的原因（某次读取返回了非有限值）永远查不到。宁可在这里大声报错。
ERROR_CODES = {
    "BADARG": "参数非法（缺字段/维度不对/超范围/非有限数值）",
    "NOT_CONNECTED": "未连接或连接已断开",
    "CONNECT_FAILED": "连接机器人失败",
    "TIMEOUT": "等待机器人响应超时",
    "SAFETY": "机器人处于安全停止状态，指令被拒绝",
    "NOT_REMOTE": "控制器不在远程控制模式，URScript 会被静默丢弃",
    "NOT_EXECUTED": "控制器没有执行脚本（URScript 被静默丢弃/固件不接受该指令组合）",
    "SEND_FAILED": "脚本未能送达控制器",
    "UNSUPPORTED": "当前控制器/固件不支持该操作",
    "HUGE": "未实现的内部错误",
}


class WorkerError(Exception):
    """带稳定错误码的业务异常（handler 抛它，main() 直接映射成协议响应）。"""

    def __init__(self, code, message, data=None):
        super(WorkerError, self).__init__(message)
        self.code = code if code in ERROR_CODES else "HUGE"
        self.data = data


def _error_code_for(exc):
    """把异常映射成错误码。保持"粗但稳定"，不追求精确分类。"""
    if isinstance(exc, WorkerError):
        return exc.code
    if isinstance(exc, ValueError):
        return "BADARG"
    if isinstance(exc, TimeoutError):
        return "TIMEOUT"
    if isinstance(exc, ConnectionError):
        return "NOT_CONNECTED"
    if isinstance(exc, NotImplementedError):
        return "UNSUPPORTED"
    return "HUGE"


def err(message, code=None, data=None):
    """构造一个失败结果。`code` 缺省时按消息内容猜一个（兼容既有调用点）。"""
    out = {"error": str(message)}
    if code is None:
        lowered = str(message)
        if "超时" in lowered:
            code = "TIMEOUT"
        elif "未连接" in lowered or "连接不存在" in lowered or "连接失败" in lowered:
            code = "CONNECT_FAILED" if "失败" in lowered else "NOT_CONNECTED"
        elif "必须是" in lowered or "缺失" in lowered or "范围" in lowered or "拒绝" in lowered:
            code = "BADARG"
        elif "远程控制" in lowered:
            code = "NOT_REMOTE"
        else:
            code = "HUGE"
    out["code"] = code
    if data is not None:
        out["data"] = data
    return out

# The JSON protocol lives on the real stdout (stdin/stdout pipe). Isolate the
# vendored URBasic library's own print() output to a log file so it cannot
# corrupt the response channel: URBasic (rtde.py, urScript.py, dashboard.py,
# ...) prints diagnostic lines to stdout that are not part of the protocol.
_PROTOCOL_OUT = sys.stdout

# 协议行（响应 + 主动推送）的写入锁。
#
# 仿真遥测现在由后台线程**主动推送**（见 `_twin_push_loop`），它会与主线程的
# `respond()` 并发写同一个 stdout。少了这把锁，两条 JSON 行会交错甚至互相截断，
# Node 侧 readline 于是拿到无法解析的行 —— 表现为仿真随机丢帧、请求莫名超时。
_PROTOCOL_LOCK = threading.Lock()
_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ur_worker.log")

# 日志上限：一份现役 + 一份滚动的旧文件，磁盘占用因此被钳在 ~2×上限。
# 为什么必须有：URBasic 的 RTDE 重连失败分支会**每次循环**打印（上游没有 sleep，
# 断链时等于每秒数万行），实测单机日志被推到 277 MB / 1076 万行。限速见
# URBasic/rtde.py 里那段注释，这里再加一道与写入者无关的兜底。
_LOG_MAX_BYTES = 8 * 1024 * 1024


class _CappedLog:
    """带大小上限的日志文件：写满就滚成 ``<path>.1``（覆盖上一份旧日志）。

    只实现 URBasic 用得到的 ``write``/``flush``（它把 stdout 当文件用）。

    **必须线程安全**：RTDE 接收线程、Dashboard 接收线程、RealTimeClient 的等待线程都会
    直接 print（即调用本对象的 write）。上游没有锁时，一次 ``_roll()`` 可能正好在另一个
    线程的 ``write()`` 中间关掉文件句柄 ⇒ 那个线程抛 ValueError 当场死亡（RTDE 线程一死，
    `isRunning()` 就永远为 False，整条连接再也不能用）。
    """

    def __init__(self, path, max_bytes):
        self._path = path
        self._max = max_bytes
        self._lock = threading.RLock()
        self._written = self._current_size()
        # newline="" ⇒ 不做 \n→\r\n 翻译：日志用 LF，且下面对写入字节数的统计与磁盘上
        # 的真实大小一致（否则每次换行都会多一个字节，限幅会被低估）。
        self._handle = open(path, "a", encoding="utf-8", buffering=1, newline="")

    def _current_size(self):
        try:
            return os.path.getsize(self._path)
        except OSError:
            return 0

    def _roll(self):
        try:
            self._handle.close()
        except Exception:
            pass
        try:
            os.replace(self._path, self._path + ".1")
        except OSError:
            pass
        self._handle = open(self._path, "a", encoding="utf-8", buffering=1, newline="")
        self._written = 0

    def write(self, text):
        if not isinstance(text, str):
            text = str(text)
        with self._lock:
            if self._written + len(text) > self._max:
                self._roll()
            self._handle.write(text)
            self._written += len(text)
            return len(text)

    def flush(self):
        with self._lock:
            try:
                self._handle.flush()
            except Exception:
                pass

    def close(self):
        with self._lock:
            try:
                self._handle.close()
            except Exception:
                pass

    # 少量文件对象的常见接口：URBasic 只用到 print/write，但第三方代码偶尔会问这些，
    # 缺了就会 AttributeError（把「日志」变成「崩溃」）。
    encoding = "utf-8"

    def isatty(self):
        return False

    def fileno(self):
        return self._handle.fileno()

    def writable(self):
        return True


_LOG = _CappedLog(_LOG_PATH, _LOG_MAX_BYTES)
sys.stdout = _LOG


def _log(msg):
    _LOG.write("%s\n" % msg)
    _LOG.flush()


import URBasic

# ---------------------------------------------------------------------------
# Connection registry
# ---------------------------------------------------------------------------

ROBOTS = {}          # ip -> UrScriptExt instance
ROBOT_MODELS = {}    # ip -> RobotModel instance

# ip -> 连接代次：**每真正新建一条机器人连接就 +1**，只增不减。
#
# 存在的唯一理由：让宿主判断"按 IP 记住的型号还作不作数"。型号在**一条连接存续期间**
# 确实不变（所以值得缓存），但"同一个 IP 换了一台别的型号"时它必然变 —— 而这件事在
# worker 侧唯一可靠的信号就是**连接对象换了新的**（换机器人 ⇒ 旧 RTDE 掉线 ⇒
# `ensure_connected` 重建）。宿主把这个代次随仿真推送一起下发，代次一变就重读型号。
#
# ⚠️ **只增不减**（断开也不清零）：宿主的缓存里记的是"读它时的代次"，计数一旦回退
# （比如断开后从 1 重新数），新连接的 `1` 就会与上一轮那个 `1` 一模一样 —— 宿主会认为
# "连接没变"，于是**恰好在我要修的那个场景里**继续沿用上一台机器人的型号。每条目只是一个
# 整数，按 IP 累积没有任何代价。
ROBOT_CONN_SEQ = {}

# ---------------------------------------------------------------------------
# 离线仿真（运动学级）
# ---------------------------------------------------------------------------

# 保留的仿真地址：**回环**。真机的 RTDE(30003)/Dashboard(29999) 服务跑在控制器上，所以
# "本机回环上有一台真 UR" 在物理上不可能；把这个地址留给仿真，等于让"仿真绝不能碰真机"
# 成为**结构性**保证，而不是靠一张可能漂移的登记表。（宿主侧的门禁豁免也只认这一个地址。）
#
# 唯一的理论边界：URSim 若配置成监听本机回环，命令会到达那个**模拟控制器** —— 那里没有真
# 机械臂，所以最坏结果只是"仿真被送到模拟器上"，不构成人身/设备风险。
"""运行模式（路线图 A）。

`sim`（默认）＝纯离线仿真，真机通道结构性不可达；`real` ＝**显式开启**的真机通道，目标由宿主
侧白名单收口。由宿主通过环境变量传入，缺省即 `sim` —— 也就是说"什么都不配"永远是最安全的形态。
"""
MOTION_MODE = os.environ.get("DSH_URSIM_MODE", "sim").strip().lower()
REAL_MODE = MOTION_MODE == "real"
SIM_IP = "127.0.0.1"

# 本插件（dsh-nonead-ursim）**只操作仿真机器人**：不存在任何真机通道。
# 因此"调用任何指令时若仿真没开就自动开一台"用的默认配置：
DEFAULT_SIM_MODEL = "ur12e"      # 与客户端面板的默认型号一致
DEFAULT_SIM_PRESET = "upright"   # 竖直收拢（用户 2026-10-12 裁定：新载入的机器人默认姿势）
DEFAULT_SIM_SCALING = 1.0        # 倍率 100%

# 仿真自身的生命周期与运维类指令：它们**不做** ip 收口（各自校验），也不触发自动就绪。
#   · sim_start/stop/status：仿真自己的开关，重复调用要有意义（重建/幂等/读状态）
#   · ping / shutdown_worker：worker 健康检查与优雅退出，与任何机器人都无关
#   · connect / disconnect：已改为**仿真语义**（见各自的实现）
SIM_PASSTHROUGH_OPS = frozenset({
    "sim_start", "sim_stop", "sim_status", "ping", "shutdown_worker",
    "connect", "disconnect",
})


# ip -> ur_sim.VirtualRobot。全是内存里的运动学状态：没有 socket、没有线程。
SIMS = {}

# 仿真的合法型号 = 运动学表里的型号（`assets/kinematics.json`），与内置 GLB 一一对应。
_SIM_PRESETS = ("zero", "upright", "reach")


def _sim_module():
    """**惰性**导入 `python/ur_sim.py`。

    为什么惰性：真机路径的可靠性不该因为一个可视化功能的模块缺失而下降 —— 万一发布包里
    少了 ur_sim.py，`ursim_movej` 仍然必须能开动真机（只是仿真不可用），而不是整个 worker
    起不来。导入失败会被转成一条可读的仿真错误。
    """
    try:
        import ur_sim  # noqa: WPS433 (同目录模块，PYTHONPATH 由 lib/worker.js 指向 python/)
        return ur_sim
    except Exception as exc:
        raise WorkerError("SIM_UNAVAILABLE",
                          "离线仿真不可用：无法导入 ur_sim（%s）。这是安装包不完整，"
                          "真机功能不受影响。" % exc)


def sim_capabilities():
    """仿真的能力边界（工具与错误信息共用同一份声明，避免文档与实现漂移）。"""
    return {
        "read": ["ursim_get_joint_pose", "ursim_get_tcp_pose", "ursim_get_robot_model", "ursim_get_status",
                 "ursim_get_target_values", "ursim_get_serial_number", "ursim_get_software_version",
                 "ursim_get_robot_mode", "ursim_get_safety_mode", "ursim_get_program_state",
                 "ursim_get_speed_scaling", "ursim_get_uptime"],
        "motion": ["ursim_movej", "ursim_movel", "ursim_movep", "ursim_movec", "ursim_servoj",
                   "ursim_move_optimized", "ursim_run_sequence", "ursim_move_x", "ursim_move_y", "ursim_move_z",
                   "ursim_move_tool_x", "ursim_move_tool_y", "ursim_move_tool_z",
                   "ursim_draw_circle", "ursim_draw_square", "ursim_draw_rectangle", "ursim_draw_star",
                   "ursim_wait_steady", "ursim_stopj", "ursim_stopl"],
        "io": ["ursim_set_digital_out", "ursim_get_digital_out_bits", "ursim_get_digital_in",
               "ursim_get_digital_in_bits", "ursim_set_analog_out", "ursim_get_analog_in",
               "ursim_get_int_register", "ursim_get_double_register", "ursim_get_bit_register"],
        "telemetry": ["ursim_get_runtime_telemetry", "ursim_get_robot_current",
                      "ursim_get_robot_voltage", "ursim_get_joint_temperatures",
                      "ursim_get_tcp_force"],
        "not_simulated": ["力控（ursim_force_mode 系列）",
                          "安全状态位（ursim_get_safety_status）", "程序加载与执行（ursim_load_program / ursim_run_program）",
                          "原始脚本（ursim_send_script）", "传送带",
                          "电源/刹车/自由驱动/示教等机械状态变更"],
        "note": ("运动学级：只有正解/逆解与轨迹插值，没有动力学、没有安全功能、没有控制器。"
                 "速度与加速度只用来决定每段运动的时长（近似），不做 jerk 限幅。"
                 "I/O 与寄存器是**内存态**：输出可写可读回，输入没有信号源（恒 0），"
                 "寄存器没有写入口（恒初值）。遥测是**运动学估算**：由有限差分加量级模型推出，"
                 "带 estimated 标记，不是 RTDE 测量。"),
    }


def _sim_entry(ip):
    """取某 IP 的仿真对象；不是仿真地址就返回 None。"""
    return SIMS.get(str(ip)) if ip is not None else None


def _sim_bump_epoch(ip):
    """仿真启停 = 连接代次 +1：宿主据此重读型号，仿真据此**换网格**（与真机换机器人同一条链）。"""
    ROBOT_CONN_SEQ[ip] = ROBOT_CONN_SEQ.get(ip, 0) + 1


def _sim_no_semantics(op):
    """「这条指令在离线仿真里没有语义」的标准回报。

    **绝不**返回一个看起来成功的结果：没有控制器就没有那些语义，假装有等于骗人。
    """
    caps = sim_capabilities()
    return err(
        "指令 %s 在离线仿真中没有语义。仿真只实现**运动学**：运动类工具（%s 等）与位姿读回；"
        "%s 都需要真实控制器。本插件只做运动学仿真：要执行这些指令，请把 motionMode 设为 real 并在"
        "realRobotIps 白名单里填入目标 IP（真机或 URSim）；sim 模式下非回环地址会被拒绝。"
        % (op, "、".join(caps["motion"][:6]), "、".join(caps["not_simulated"][:4])),
        "SIM_UNSUPPORTED",
        {"op": op, "simulated": True, "capabilities": caps})


# 连接构造的硬上限（秒）。依据：URBasic 自己那圈“等 RTDE 数据就绪”是 20×1 s
# （`urScript.py` 的 `_ready_waits > 20`），再叠加 rtde / realTimeClient 各自最长 60 s 的重连
# 循环与 dashboard 的 2 s —— 构造完全可能几十秒不返回。这个值必须**小于** Node 侧默认的
# 60 s 命令超时（`lib/worker.js` 的 `commandTimeoutMs`），否则调用方先收到自己那句笼统的
# “timed out”，看不到下面那条说明原因的 worker 错误。
CONNECT_TIMEOUT_S = 20.0

# 当前正在处理的请求（worker 单线程串行处理，故用模块级变量即可）：自杀前用它回一条可读错误。
_CURRENT_REQUEST_ID = None
_CURRENT_TIMEOUT_MS = None


def _connect_or_exit(ip):
    """构造 UrScriptExt；超过预算仍未返回就 ``os._exit(1)``。

    **为什么是进程级自杀，而不是抛错或尽力清理**：连接构造卡住时，控制器侧的 RTDE 会话仍被占着
    ——控制器同一时刻只接受一个 RTDE 客户端——而那些半成品线程/套接字已经无法可靠取消，
    清理本身也会卡。只有进程退出能真正把它们交还给操作系统。

    `lib/worker.js` 已有对应处理：进程一退出就把在飞请求全部失败，并在**下次调用**时按
    `restartDelayMs`（500 ms）退避重新拉起一个干净 worker。所以调用方只需重试一次，
    不必再人工重启任何东西。

    @returns (robot, robot_model)
    @raises 构造函数在预算内失败时，原样抛出它自己的异常。
    """
    budget = CONNECT_TIMEOUT_S
    if isinstance(_CURRENT_TIMEOUT_MS, (int, float)) and _CURRENT_TIMEOUT_MS > 0:
        budget = min(budget, max(1.0, float(_CURRENT_TIMEOUT_MS) / 1000.0))

    box = {}

    def build():
        try:
            robot_model = URBasic.robotModel.RobotModel()
            box["robot"] = URBasic.urScriptExt.UrScriptExt(host=ip, robotModel=robot_model)
            box["model"] = robot_model
        except BaseException as exc:  # 交给主线程按原语义抛出
            box["error"] = exc

    thread = threading.Thread(target=build, name="ur-connect", daemon=True)
    thread.start()
    thread.join(budget)

    if thread.is_alive():
        _log("连接 %s 在 %.1fs 内未完成 —— 进程自杀，避免卡住整条调用链"
             "（控制器侧可能仍占着上一次未回收的 RTDE 会话）" % (ip, budget))
        respond({"id": _CURRENT_REQUEST_ID, "ok": False, "data": None,
                 "error": "连接 %s 超时（%.0fs 内未完成）。控制器可能仍占着上一次未回收的 RTDE "
                          "会话；worker 已自行退出，直接重试一次即可（会自动换一个干净进程）。" % (ip, budget)})
        os._exit(1)

    if "error" in box:
        raise box["error"]
    return box["robot"], box["model"]


def ok(data):
    return data


# `err()`、`WorkerError`、`ERROR_CODES` 定义在文件前部（协议/序列化区），
# 因为它们既被 handler 使用，也被 main() 的异常映射使用。


# User-supplied path/name strings reach either a `find` shell command over SSH
# (list_programs) or the dashboard `load` line protocol (load/run program), so
# reject control characters and shell/dashboard metacharacters outright.
_PATH_BAD = re.compile(r"[;|&<>`$(){}'\"\\*?\[\]#!]")


def _sanitize_path(value, field):
    """Return a safe program-name / directory string or raise ValueError.

    Control chars (incl. newline) and shell metacharacters are rejected because
    they allow command injection through the SSH `find` command or the
    dashboard `load <file>` line protocol.
    """
    s = str(value if value is not None else "").strip()
    if any(ord(c) < 32 or ord(c) == 127 for c in s):
        raise ValueError("%s 含控制字符，已拒绝" % field)
    if _PATH_BAD.search(s):
        raise ValueError("%s 含非法字符，已拒绝" % field)
    return s


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def is_connected(ip):
    """True when a live robot object exists and its RTDE loop is running."""
    robot = ROBOTS.get(ip)
    if robot is None:
        return False
    try:
        return bool(robot.robotConnector and robot.robotConnector.RTDE and
                    robot.robotConnector.RTDE.isRunning())
    except Exception:
        return False


def ensure_connected(ip):
    """Return (robot, robotModel) for an IP, connecting if needed.

    Raises on connection failure so callers can surface a readable error.
    """
    # 保留地址守卫：仿真地址**绝不能**被当作真机去连。除了"免得白等 20 s"之外，这条更是
    # 「仿真碰不到真机」的兜底 —— 即使宿主侧的仿真登记表漂了（比如 worker 重启后仿真没了），
    # 指向该地址的指令也只会得到这句拒绝，永远不会打到一个真实控制器上。
    if str(ip) == SIM_IP:
        raise WorkerError(
            "CONNECT_FAILED",
            "%s 是插件保留的离线仿真地址（回环），不能作为真机连接。要用仿真请先 "
            "ursim_sim_start(model=...)；要连真机请填它的实际 IP。" % SIM_IP)
    if is_connected(ip):
        return ROBOTS[ip], ROBOT_MODELS[ip]

    # Replace any stale handle (e.g. RTDE dropped after a restart) before
    # reconnecting so we do not leak its sockets.
    stale = ROBOTS.pop(ip, None)
    if stale is not None:
        try:
            stale.robotConnector.close()
        except Exception:
            pass
        ROBOT_MODELS.pop(ip, None)
        # 注意：**不动 `ROBOT_CONN_SEQ`** —— 它必须只增不减（见其定义处的说明）。

    # 连接构造有硬预算：卡住时 _connect_or_exit() 会让本进程自杀，而不是把整条调用链拖住
    # （控制器侧那个未回收的 RTDE 会话只有进程退出才能真正释放）。
    robot, robot_model = _connect_or_exit(ip)
    ROBOTS[ip] = robot
    ROBOT_MODELS[ip] = robot_model
    # 新连接 = 新代次：宿主据此知道"这个 IP 上按连接记住的型号可能已经不是同一台机器人了"。
    # 只增不减（断开/重连都不清零），否则新旧代次可能撞车（见 ROBOT_CONN_SEQ 的定义）。
    ROBOT_CONN_SEQ[ip] = ROBOT_CONN_SEQ.get(ip, 0) + 1

    if not robot.robotConnector.RTDE.isRunning():
        try:
            robot.robotConnector.close()
        except Exception:
            pass
        ROBOTS.pop(ip, None)
        ROBOT_MODELS.pop(ip, None)
        raise ConnectionError("RTDE did not start after connecting to %s" % ip)
    return robot, robot_model


def dashboard(ip):
    return ROBOTS[ip].robotConnector.DashboardClient


# ---------------------------------------------------------------------------
# 脚本发送 / 运动预检查
# ---------------------------------------------------------------------------

def _realtime(robot):
    return robot.robotConnector.RealTimeClient


def _last_send_failure(robot):
    return getattr(_realtime(robot), "lastSendFailure", None) or "原因未知"


def _send_program(robot, script):
    """把一段 URScript 送到控制器并**如实返回是否送出去了**（bool）。

    修好 `RealTimeClient.__sendPrg` 之后 `SendProgram` 已经会返回布尔值。这里对**没有**
    返回值的实现（其它版本/被替换的假对象）按"已交给发送路径"处理并记一条日志 ——
    把它当成失败会让"控制器没回 ACK"这种常态被误报为发送失败。
    """
    sender = getattr(_realtime(robot), "SendProgram", None)
    if not callable(sender):
        return False
    try:
        result = sender(script)
    except Exception as exc:
        _log("SendProgram 抛异常：%r" % (exc,))
        return False
    if result is None:
        _log("SendProgram 未返回布尔值（该实现未报告发送结果），按已发送处理")
        return True
    return bool(result)


def _realtime_send(robot, script):
    """发一条单行 URScript 语句（`set_*` 那一类）。Returns bool。"""
    sender = getattr(_realtime(robot), "Send", None)
    if not callable(sender):
        return False
    try:
        result = sender(script)
    except Exception as exc:
        _log("RealTimeClient.Send 抛异常：%r" % (exc,))
        return False
    if result is None:
        _log("RealTimeClient.Send 未返回布尔值（该实现未报告发送结果），按已发送处理")
        return True
    return bool(result)


def _budget_ms(p, reserve_ms=1000):
    """把 Node 给的命令预算收窄一点，留给 worker 回报错误。

    Node 侧的超时计时**从写入请求那一刻**就开始，而 worker 拿到预算后才开始干活；
    若两者相等，真实超时的调用方只会看到 Node 那句笼统的 "timed out"，看不到 worker
    更具体的原因（"移动未确认到位" / "未观察到脚本开始执行"）。`op_send_script`
    早就在这么做，这里把它推广到所有长耗时操作。
    """
    try:
        total = int(p.get("_timeout_ms", 60000))
    except Exception:
        total = 60000
    return max(1000, total - reserve_ms)


def _motion_error_code(message):
    """运动/执行类指令"没做到"时用的稳定错误码。

    三类失败必须分开（它们的处置完全不同）：
      · 控制器**没执行**脚本（URScript 被静默丢弃 / 固件不收该指令组合）⇒ `NOT_EXECUTED`；
      · 读不到当前位姿、无法完成确认（会话可能已断）⇒ `NOT_CONNECTED`；
      · 执行了，但预算内没确认到位（超时/位置偏差）⇒ `TIMEOUT`。
    """
    text = str(message)
    if "未观察到脚本开始执行" in text or "没有执行" in text:
        return "NOT_EXECUTED"
    if "读取" in text and "失败" in text:
        return "NOT_CONNECTED"
    return "TIMEOUT"


def _motion_failure(what, message, data):
    """运动/执行类指令**没做到**时的统一失败回包（信封 `ok:false`）。

    旧写法无论确认结果如何都 `return ok({... "ok": ok_flag ...})` ⇒ 信封 `ok` 恒为 true，
    把 `ok_flag=False`（"59 s 内没走完" / "从未观察到脚本开始执行"）埋在 `data.ok` 里：
    调用方与模型读到的是一句"命令已发送，移动未确认到位"，看起来就是成功。这里把"没做到"
    升级成信封失败（`main()` 据此回 `ok:false` + 稳定 `code`），同时**原样保留 data**
    （含 `ok: False` 与 command/ip 等既有字段），既有的"读 data.ok"读取方不受影响。
    """
    payload = dict(data or {})
    payload["ok"] = False
    return err("指令 %s 没有完成：%s" % (what, message),
               _motion_error_code(message), payload)


def _assert_remote_control(ip, what):
    """发送 URScript 之前的预检查：不在远程控制模式时**提前**给出可读原因。

    为什么值得做：本地/示教器模式下控制器会**静默丢弃** URScript（不报错），于是运动类
    工具会一直等到确认循环超时，最后报一句"移动结束但未到达目标（位置存在偏差）"——
    把"指令根本没被接收"误导成"位置有偏差"。这里问一次 dashboard（三态探测），
    确认 false 就直接失败。**未知（None）不拦**：探测不到不等于不在远程模式，不能因为
    旁证缺失就拒绝执行。
    """
    try:
        state, raw = _remote_control(dashboard(ip))
    except Exception:
        return
    if state is False:
        raise WorkerError(
            "NOT_REMOTE",
            "%s 之前检测到控制器**不在远程控制模式**（dashboard 回答 %r）：本地/示教器模式下 "
            "URScript 与运动指令会被控制器静默丢弃，因此已提前中止。请在示教器上切到远程控制"
            "（或确认 PolyScope 的 Remote Control 设置）后重试。" % (what, raw),
        )


def _dashboard_send(d, cmd):
    """对**已有 dashboard 句柄**执行一条命令并只认本次应答。Returns (ok, respond)。

    ## 为什么所有 dashboard 读取都必须经过这里（陈旧应答）
    `Dashboard.__send()` 的流程是「sendall → wait_dbs → return」，而 `wait_dbs()` 只等
    "任意一次 notify"、**不校验应答属于哪条命令**；`last_respond` 也只在真正收到消息时
    才被覆盖。于是当应答丢失/接收线程已停时，调用方读到的是**上一条命令的应答**。
    最典型的事故：上一条 `isProgramSaved` 刚回过 "True"，紧接着问 `is in remote control`，
    于是一台**没在远程控制模式**的机器人被报成 `remote_control: true`，模型据此下发
    URScript，被控制器静默丢弃，而工具全程回报成功。
    ⇒ `sendCommand()` 会先清空 `last_respond`，只认发送之后新到达的应答；这里统一走它。
    """
    send_command = getattr(d, "sendCommand", None)
    if callable(send_command):
        return send_command(cmd)
    # 旧版 Dashboard 没有 sendCommand：退回直接调用（wait_dbs 现在至少有超时）。
    try:
        getattr(d, cmd)()
    except Exception as exc:
        return False, "%s: %s" % (type(exc).__name__, exc)
    return True, (d.last_respond or "").strip()


def _dashboard_cmd(ip, cmd):
    """按 IP 执行一条 dashboard 命令。Returns (ok, respond)。见 `_dashboard_send`。"""
    try:
        d = dashboard(ip)
    except Exception as exc:
        return False, "%s: %s" % (type(exc).__name__, exc)
    return _dashboard_send(d, cmd)


def _dashboard_cmd_args(ip, cmd, *args):
    """按 IP 执行一条**带参数**的 dashboard 命令。Returns (ok, respond)。

    存在的理由：`_dashboard_send` 只支持无参命令，而 `ur_load(<file>)` 需要参数。
    这里用同一套"清空 last_respond → 发送 → 只认本次应答"的顺序，避免读到陈旧应答。
    """
    try:
        d = dashboard(ip)
    except Exception as exc:
        return False, "%s: %s" % (type(exc).__name__, exc)
    try:
        d.last_respond = None
    except Exception:
        pass
    try:
        getattr(d, cmd)(*args)
    except Exception as exc:
        return False, "%s: %s" % (type(exc).__name__, exc)
    respond = getattr(d, "last_respond", None)
    if respond is None:
        return False, ""
    return True, str(respond).strip()


def _enum_token(respond):
    """把一条 dashboard 查询的**整行应答**剥成裸枚举词。

    UR 控制器对这些查询回的是带标签前缀的整行文本（`safetymode` → `"Safetymode: NORMAL"`、
    `robotmode` → `"Robotmode: RUNNING"`，见 `URBasic/dashboard.py` 各方法的文档字符串）。
    客户端按裸枚举词查中文表、并按"未知模式算异常"判定安全问题 ⇒ 带前缀的值既翻不出中文，
    又会把 `NORMAL` 误报成需要处置的安全异常（仿真面板底部会恒挂处置提示）。所以在**协议
    边界**统一剥掉 `标签:` 前缀，只把枚举词交给上层。

    返回值里没有冒号时（如 `programState` 回的 `"PLAYING"`）原样返回；查询失败哨兵
    `"<查询失败>"` 同样原样透传。
    """
    text = str(respond if respond is not None else "").strip()
    if ":" in text:
        return text.rsplit(":", 1)[-1].strip()
    return text


_PROGRAM_STATE_NAME = re.compile(r"^(?P<state>\S+)\s+<[^>]*>$")


def _program_state(respond):
    """把 `programState` 的应答剥成**裸程序状态词**。

    与 `safetymode` / `robotmode` 只带 `标签:` **前缀**不同，`programState` 回的是
    「状态词 + 程序名」：实测 PolyScope 5.21 / UR30 空闲时回 `STOPPED <未命名>`，
    运行中回 `PLAYING <程序名>`。`_enum_token` 只剥前缀，这串会原样到达客户端，
    而客户端按裸枚举词查中文表（`describeProgramState`），查不到就把
    `STOPPED <未命名>` 原样显示成「程序 STOPPED <未命名>」而不是「程序 已停止」。
    这里在协议边界把尾部的 `<程序名>` 去掉。

    **不能误伤查询失败哨兵 `"<查询失败>"`**：它前面没有状态词，而本正则要求
    `状态词 + 空白` 在前，故哨兵与任何裸值都原样透传。
    """
    text = _enum_token(respond)
    match = _PROGRAM_STATE_NAME.match(text)
    if match:
        return match.group("state")
    return text


def _remote_control(d):
    """探测机器人是否处于远程控制模式：**三态**。Returns (state, raw)。

    state 取值：
      - ``True``  —— dashboard 明确回答 "true"；
      - ``False`` —— dashboard 明确回答 "false"；
      - ``None``  —— **未知**：dashboard 没回答、回答不可解析（例如
        "could not understand ..."）或探测本身抛异常。

    为什么必须三态：把「没问到」与「问到了，是 false」混为一谈，会让工具对着一台状态未知的
    机器人给出「请去 PolyScope 开启 Remote Control」的指引——那是**基于未知道信息的断言**。
    而且真正决定 URScript 能不能生效的是控制器的实际模式，dashboard 的回答只是个旁证：
    所以未知时如实说未知，false 时也只在固件不在「CB3 3.1–3.20 默认可用」区间时才提示用户去改设置。
    """
    raw = ""
    try:
        ok_flag, respond = _dashboard_send(d, "ur_is_remote_control")
        if ok_flag:
            raw = respond
    except Exception:
        return None, raw
    lowered = raw.lower()
    if lowered == "true":
        return True, raw
    if lowered == "false":
        return False, raw
    return None, raw


def _software_version(d):
    """Read the controller's URSoftware / PolyScope version string ("" when unreadable)."""
    try:
        ok_flag, respond = _dashboard_send(d, "ur_polyscopeVersion")
        return respond if ok_flag else ""
    except Exception:
        return ""


# CB3（URSoftware 3.1–3.20）**默认就允许 Remote Control**，不需要在 PolyScope 里额外开启。
# 因此 dashboard 的 `ur_is_remote_control` 报 false 时，对这一段固件**不能**给出
# 「请去 PolyScope 开启」的指引 —— 那是错误指引（会让用户去改一个本就无需改的设置）。
# 这条事实由用户明确给出（2026-09-27），覆盖全部 CB3 3.1–3.20 固件。
CB3_REMOTE_CONTROL_DEFAULT_MINOR = (1, 20)


def cb3_remote_control_default_on(version):
    """该 URSoftware/PolyScope 版本是否落在「CB3 默认允许 Remote Control」区间（3.1–3.20）。

    @param version 形如 ``"3.15.8.106339"``；无法解析时返回 False（保守：仍给开启提示）。
    """
    m = re.match(r"\s*(\d+)\.(\d+)", str(version or ""))
    if m is None:
        return False
    major, minor = int(m.group(1)), int(m.group(2))
    low, high = CB3_REMOTE_CONTROL_DEFAULT_MINOR
    return major == 3 and low <= minor <= high


# ---------------------------------------------------------------------------
# Pose / confirmation helpers (mirrors the reference implementation)
# ---------------------------------------------------------------------------

def _vec(p, key, n, what):
    """Coerce `p[key]` to a list of exactly `n` floats or raise ValueError.

    Guards against malformed URScript: a joint/pose vector (q, pose, center,
    origin, via/to) is required to have exactly the expected dimension. The old
    code silently accepted any length, which could emit malformed `movej(...)`
    /`movel(...)` commands or an out-of-range indexing error later.
    """
    raw = p.get(key)
    if raw is None:
        raise ValueError(what + " 缺失，需要传入 %d 维数组" % n)
    try:
        vals = [float(x) for x in raw]
    except (TypeError, ValueError):
        raise ValueError(what + " 必须是数值数组（如 [1.0,2.0,...]）")
    if len(vals) != n:
        raise ValueError(what + " 必须是 %d 维数组，收到 %d 维" % (n, len(vals)))
    for v in vals:
        if not math.isfinite(v):
            # JSON 允许 `NaN`/`Infinity`（Python 的 json.loads 默认接），一路走到
            # `movel(p[nan,...])` 会让控制器收到一段语义未定义的脚本；而在返回路径上
            # 非有限值又会被写成非法 JSON（见 respond()）。在入口就拦住。
            raise ValueError(what + " 含非有限数值（NaN/Infinity），已拒绝")
    return vals


def _bounded_int(raw, key, lo, hi, what):
    """Coerce `p[key]` to an int within [lo, hi] or raise ValueError.

    Guards register indices and I/O port numbers: an out-of-range value would
    otherwise reach `dataDir['output_int_register_<n>']` and raise a KeyError, or
    an invalid port would silently return None. Since DSH 1.5.3's value-schema
    DSL rejects JSON-Schema numeric constraints, **this is the authoritative
    range check** for these parameters (the tool descriptions only *document*
    the range).
    """
    try:
        v = int(raw)
    except (TypeError, ValueError):
        raise ValueError(what + " 必须是整数，收到 %r" % (raw,))
    if not (lo <= v <= hi):
        raise ValueError(what + " 必须在 [%d, %d] 范围内，收到 %d" % (lo, hi, v))
    return v


def _nonneg_float(raw, key, what, allow_zero=True):
    """Coerce `p[key]` to a non-negative float or raise ValueError.

    Guards motion parameters (acceleration, speed, blend radius, time) and
    drawing dimensions: a negative value would make the controller behave
    unexpectedly (negative speed/acceleration, reversed geometry). `allow_zero`
    permits 0 for time/blend radius where 0 is meaningful; drawing dimensions
    that must be positive use allow_zero=False.
    """
    try:
        v = float(raw)
    except (TypeError, ValueError):
        raise ValueError(what + " 必须是数值，收到 %r" % (raw,))
    if not math.isfinite(v):
        raise ValueError(what + " 必须是有穷数值，收到 %s" % v)
    threshold = 0 if allow_zero else 0
    if v < threshold:
        raise ValueError(what + " 不能为负数，收到 %s" % v)
    if not allow_zero and v == 0:
        raise ValueError(what + " 必须大于 0，收到 0")
    return v


def _bounded_float(raw, key, lo, hi, what):
    """Coerce `p[key]` to a float within [lo, hi] or raise ValueError.

    Used for `servoj`'s online-control parameters (control period, lookahead
    time, proportional gain). Those ranges used to be declared in the tool's
    JSON schema, but DSH 1.5.3's value-schema DSL no longer accepts JSON-Schema
    numeric constraints (`minimum`/`maximum`/`exclusiveMinimum`) — a tool that
    declares them fails to register entirely. The range therefore lives here:
    **this function is the only enforcement** for these three parameters, and
    out-of-range values would drive the robot's online controller unstable.
    """
    try:
        v = float(raw)
    except (TypeError, ValueError):
        raise ValueError(what + " 必须是数值，收到 %r" % (raw,))
    if not math.isfinite(v):
        raise ValueError(what + " 必须是有穷数值，收到 %s" % v)
    if not (lo <= v <= hi):
        raise ValueError(what + " 必须在 [%s, %s] 范围内，收到 %s" % (lo, hi, v))
    return v


def _round_pose(pose):
    return [round(x, 3) for x in pose]


def _right_pose_joint(current, q, tol=0.1):
    return all(current[i] + tol >= q[i] >= current[i] - tol for i in range(6))


def _rotation_angle_between(rotvec_a, rotvec_b):
    """两个 UR 姿态旋转向量（轴角）之间的**最小旋转夹角**（弧度，[0, π]）。

    ⚠️ 为什么不能逐分量比较：`(rx,ry,rz)` 是轴角表示，同一个姿态有无数等价写法 ——
    `[0,0,2π]` 与 `[0,0,0]` 是**同一个姿态**（逐分量比较会判成相差 6.28）；
    而 `[0.05,0,0]` 与 `[0,0,0.05]` 是**不同姿态**（绕不同轴转 0.05）却逐分量只差 0.05。
    因此到达判定必须走矩阵：θ = acos((tr(R_aᵀ R_b) − 1) / 2)。
    """
    ra = _rotvec_to_matrix(rotvec_a)
    rb = _rotvec_to_matrix(rotvec_b)
    cos_theta = (float(np.trace(ra.T.dot(rb))) - 1.0) / 2.0
    # 数值误差可能让 cos 略超 [-1,1]，acos 会得到 nan
    cos_theta = max(-1.0, min(1.0, cos_theta))
    return math.acos(cos_theta)


def _right_pose_tcp(current, pose, pos_tol=0.010, rot_tol=0.05):
    """判断 TCP 是否"到位"：位置逐分量、姿态用**夹角**。

    位置用 10 mm 线性容差；姿态用 0.05 rad（≈2.9°）的**角**容差 —— 见
    `_rotation_angle_between` 的说明，逐分量比较会同时产生假阴（等价姿态判为偏差）与
    假阳（不同姿态判为到位）。
    """
    if not all(current[i] + pos_tol >= pose[i] >= current[i] - pos_tol for i in range(3)):
        return False
    return _rotation_angle_between(current[3:6], pose[3:6]) <= rot_tol


# RTDE 的 `robot_status_bits` 第 1 位 = 程序正在运行（UR RTDE 文档）。
ROBOT_STATUS_PROGRAM_RUNNING = 0x2


def _program_running(ip):
    """程序是否在运行 —— **优先读 RTDE 状态位**，不再依赖 dashboard 往返。

    为什么改：旧实现每次都跑一趟 dashboard（`ur_running`），而 dashboard 是一条
    带状态机的单 socket 协议（应答靠 `last_respond` 传递、接收线程可能已停）。用它做
    每秒一次的确认轮询，既慢又错 —— 只要 `last_respond` 里残留着上一条 `isProgramSaved`
    的 "True"，就会把"没在运行"读成"在运行"，于是确认循环一路空转到超时。
    RTDE 的 `robot_status_bits` 是随数据流以 500 Hz 更新的，读它零成本、无往返、不可能陈旧。
    """
    try:
        model = ROBOT_MODELS.get(ip)
        if model is not None:
            word = model.dataDir.get("robot_status_bits") if hasattr(model.dataDir, "get") else None
            if word is not None:
                return bool(int(word) & ROBOT_STATUS_PROGRAM_RUNNING)
    except Exception:
        pass
    # RTDE 状态位还不可用（刚连上/数据未到）：退回 dashboard 探测。
    ok_flag, respond = _dashboard_cmd(ip, "ur_running")
    if not ok_flag:
        # 两次探测都失败：如实当作"没在运行"，好过卡住整条调用链。
        return False
    return "true" in respond.lower()


def _movej_confirm(ip, q, timeout_ms=60000):
    """Wait for a movej to finish. Returns (ok, message).

    Bounded by `timeout_ms` so a robot that never reaches the target (e.g. a
    program that keeps running) cannot block the single-threaded worker forever.
    `ok` is True only when the target was reached AND the robot settled; a
    persistent deviation that never settles reports `ok=False`.
    """
    deadline = time.time() + timeout_ms / 1000.0
    settled_offsets = 0
    while True:
        if time.time() > deadline:
            return False, "移动未确认到位（超时 %.0fms）" % timeout_ms
        time.sleep(1)
        try:
            current = _round_pose(ROBOTS[ip].get_actual_joint_positions())
        except Exception:
            return False, "读取关节位置失败，无法确认到位"
        if _right_pose_joint(current, q):
            if not _program_running(ip):
                return True, "移动完成"
            # On target but the program is still running: keep waiting.
        else:
            if _program_running(ip):
                continue
            # Off-target and idle: count consecutive unsettled reads. If the
            # robot repeatedly stops off-target, report that honestly rather
            # than claiming success.
            settled_offsets += 1
            if settled_offsets > 5:
                return False, "移动结束但未到达目标（位置存在偏差）"
    return True, "移动完成"


def _movel_confirm(ip, pose, timeout_ms=60000):
    deadline = time.time() + timeout_ms / 1000.0
    settled_offsets = 0
    while True:
        if time.time() > deadline:
            return False, "移动未确认到位（超时 %.0fms）" % timeout_ms
        time.sleep(1)
        try:
            current = _round_pose(ROBOTS[ip].get_actual_tcp_pose())
        except Exception:
            return False, "读取 TCP 位置失败，无法确认到位"
        if _right_pose_tcp(current, pose):
            if not _program_running(ip):
                return True, "移动完成"
        else:
            if _program_running(ip):
                continue
            settled_offsets += 1
            if settled_offsets > 5:
                return False, "移动结束但未到达目标（位置存在偏差）"
    return True, "移动完成"


def _wait_robot_idle(ip, timeout_ms=60000):
    """等机器人执行完一段"发完即返回"的脚本。Returns (ok, message)。

    ## 为什么必须先看到"在运行"
    旧实现是「发完脚本 → 立刻问一次"在跑吗" → 没在跑就报『执行完成』」。可是
    `RealTimeClient.SendProgram` 只是把字节写进 socket 就返回（真正的执行由控制器稍后
    开始），所以**第一次探测几乎必然看到"没在运行"** —— 于是四个绘图操作（draw_circle /
    draw_square / draw_rectangle / draw_star）无论脚本是否真的被执行，都会回报
    `ok: true`「执行完成」。而 UR 在非远程控制模式下会**静默丢弃** URScript，
    这正是最需要被区分出来的情形。
    ⇒ 现在要求先观察到"确实在运行"（`saw_running`），否则如实报告"从未观察到开始执行"。
    """
    deadline = time.time() + timeout_ms / 1000.0
    saw_running = False
    while time.time() < deadline:
        running = _program_running(ip)
        if running:
            saw_running = True
        elif saw_running:
            return True, "执行完成"
        time.sleep(0.2)
    if saw_running:
        return False, "执行未确认完成（超时 %.0fms）" % timeout_ms
    return False, ("未观察到脚本开始执行（超时 %.0fms）—— 控制器很可能没有执行这段 URScript，"
                   "最常见原因是机器人不在远程控制模式（本地/示教器模式下脚本会被静默丢弃）"
                   % timeout_ms)


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

def op_connect(p):
    """连接 = 让**目标**就绪。

    - `sim` 模式（默认）：确保离线仿真在跑（见 `_sim_connect`，行为与从前逐字节相同）；
    - `real` 模式（`DSH_URSIM_MODE=real`，显式开启）：连真机 —— 复用 `ensure_connected()`
      建立 RTDE/Dashboard/RealTime 会话（见 `_real_connect`）。旧实现在 real 模式下仍走仿真
      分支，于是 `connect(ip=<真机>)` 被 `_sim_requested_ip` 拒成 SIM_BADARG，文案却说
      "要连真机请填它的实际 IP" —— 与实际分支矛盾。

    ⚠️ 保留回环地址在**两种模式**下都表示离线仿真：real 模式下也不会被当成本机真机去连
    （否则"把真控制器端口转发到环回"那条绕过路径就被重新打开了）。
    """
    if REAL_MODE:
        return _real_connect(p)
    return _sim_connect(p)


def _sim_connect(p):
    """连接 = **确保离线仿真在跑**（本插件不存在真机，所以"连接"就是这台虚拟机器人）。

    用户裁定：`ursim_connect` 改成仿真语义 —— 没开就按默认型号（UR12e / 全零位 / 倍率 1）
    自动开一台，并返回它的当前状态；`ip` 只能省略或给保留地址。
    旧实现是"连真机 + dashboard 探测远程控制模式"，那套真机通道已从本插件移除。
    """
    _ip, problem = _sim_requested_ip(p)
    if problem is not None:
        return problem
    not_ready = _ensure_sim_ready()
    if not_ready is not None:
        return not_ready
    result = op_sim_status({})
    if isinstance(result, dict) and "error" not in result:
        data = result.get("data")
        label = (data or {}).get("robot_model") or DEFAULT_SIM_MODEL
        if isinstance(data, dict):
            data["connected"] = True
        result["message"] = "已连接：离线仿真机器人（%s）在保留地址 %s。" % (label, SIM_IP)
    return result


def _real_requested_ip(p):
    """真机模式下解析 `ip`：**必须显式给出**，且保留回环地址仍表示仿真目标。

    返回 `(ip, 错误结果或 None)`。与 `_pin_sim_ip` 的约定一致：缺省地址只属于仿真模式，
    真机模式下不该有"不写 ip 就连某台机器人"的便利。
    """
    raw = p.get("ip")
    if raw is None or str(raw).strip() == "":
        return None, err(
            "真机模式（DSH_URSIM_MODE=real）必须显式提供 ip —— 缺省地址只属于仿真模式"
            "（那台虚拟机器人）；要操作仿真请显式传 %s。" % SIM_IP, "BADARG")
    return str(raw).strip(), None


def _real_connect(p):
    """真机模式下的 `ursim_connect`：确保到该 IP 的 RTDE/Dashboard/RealTime 会话就绪。

    复用既有 `ensure_connected()`（保留地址守卫 / 陈旧句柄替换 / 连接硬预算都在它里面），
    并如实回报远程控制模式的三态探测 —— 不在远程模式时 URScript 会被静默丢弃，这条提示
    必须在"连接成功"的同一份回包里给出，而不是等第一条运动指令失败。
    """
    ip, problem = _real_requested_ip(p)
    if problem is not None:
        return problem
    if ip == SIM_IP:
        # 保留回环地址在两种模式都表示离线仿真，绝不交给真机实现。
        return _sim_connect(p)
    robot, _model = ensure_connected(ip)
    remote, raw = _remote_control(dashboard(ip))
    data = {"ip": ip, "connected": True,
            "remote_control": remote, "remote_control_raw": raw}
    try:
        data["joint_positions"] = [float(x) for x in robot.get_actual_joint_positions()]
        data["tcp_pose"] = [float(x) for x in robot.get_actual_tcp_pose()]
    except Exception:
        # 读不到姿态不影响"会话已建立"这个结论；不把它升级成连接失败。
        pass
    ok_model, name = _dashboard_cmd(ip, "ur_get_robot_model")
    if ok_model:
        data["robot_model"] = str(name).strip()
    if remote is False:
        hint = ("⚠️ 控制器报告**不在远程控制模式**：URScript 与运动指令会被静默丢弃，"
                "请在示教器上切到远程控制后再发运动指令。")
    elif remote is None:
        hint = "（未能确认远程控制模式：dashboard 没有回答。）"
    else:
        hint = "（远程控制模式已确认。）"
    return ok({"message": "已连接（真机）：%s。%s" % (ip, hint), "data": data})


def op_disconnect(p):
    """断开 = 释放**目标**。

    - `sim` 模式（默认）：停掉离线仿真（见 `_sim_disconnect`，行为与从前逐字节相同）；
    - `real` 模式：关闭真机的 RTDE/Dashboard/RealTime 会话并丢掉句柄（见
      `_real_disconnect`）—— 真机部署下原先**没有任何工具**能主动释放 RTDE 会话，
      只能等进程退出，控制器会一直看着那一条未回收的会话。
    """
    if REAL_MODE:
        return _real_disconnect(p)
    return _sim_disconnect(p)


def _sim_disconnect(p):
    """断开 = **停掉离线仿真**（幂等）。

    旧实现是 `robot.robotConnector.close()` —— 关真机的 RTDE/Dashboard/RealTime 连接；
    本插件没有真机，"断开"的对应动作就是把这台虚拟机器人收掉。
    """
    _ip, problem = _sim_requested_ip(p)
    if problem is not None:
        return problem
    if SIMS.get(SIM_IP) is None:
        return ok({"message": "连接不存在（当前没有在跑的仿真）", "simulated": True, "ip": SIM_IP})
    result = op_sim_stop({})
    if isinstance(result, dict) and "error" not in result:
        result["message"] = "连接已断开：离线仿真已停止。"
    return result


def _real_disconnect(p):
    """真机模式下的 `ursim_disconnect`：关闭会话并丢掉句柄（幂等）。

    与 `ensure_connected()` 的"陈旧句柄替换"同一套动作：`robotConnector.close()` 会关掉
    RTDE / Dashboard / RealTime 三路连接；然后从 `ROBOTS`/`ROBOT_MODELS` 里摘掉。
    ⚠️ **不动 `ROBOT_CONN_SEQ`**：连接代次只增不减（见其定义处的说明）。
    """
    ip, problem = _real_requested_ip(p)
    if problem is not None:
        return problem
    if ip == SIM_IP:
        return _sim_disconnect(p)
    robot = ROBOTS.pop(ip, None)
    ROBOT_MODELS.pop(ip, None)
    if robot is None:
        return ok({"message": "连接不存在（%s 上没有已建立的会话）" % ip,
                   "data": {"ip": ip, "connected": False}})
    try:
        robot.robotConnector.close()
    except Exception as exc:
        return err("关闭 %s 的连接失败：%s" % (ip, exc), "NOT_CONNECTED",
                   {"ip": ip, "connected": False})
    return ok({"message": "连接已断开（真机）：%s 的 RTDE/Dashboard/RealTime 会话已关闭。" % ip,
               "data": {"ip": ip, "connected": False}})


def op_status(p):
    ip = str(p["ip"])
    robot, model = ensure_connected(ip)
    d = dashboard(ip)

    def dash(cmd):
        ok_flag, respond = _dashboard_cmd(ip, cmd)
        if not ok_flag:
            # Distinguish a failed dashboard query from a genuinely empty field:
            # an empty string would be indistinguishable from "no value", while a
            # marker tells the caller/model that this particular field could not
            # be read (e.g. the dashboard connection dropped) without failing the
            # whole status snapshot.
            return "<查询失败>"
        return respond

    tcp = [float(x) for x in robot.get_actual_tcp_pose()]
    joint = [float(x) for x in robot.get_actual_joint_positions()]
    try:
        timestamp = model.RobotTimestamp()
    except Exception:
        timestamp = None
    remote, remote_raw = _remote_control(d)
    data = {
        "ip": ip,
        "tcp_pose": tcp,
        "joint_positions": joint,
        "robot_model": dash("ur_get_robot_model"),
        "serial_number": dash("ur_serial_number"),
        "software_version": dash("ur_polyscopeVersion"),
        "safety_mode": _enum_token(dash("ur_safetymode")),
        "robot_mode": _enum_token(dash("ur_robotmode")),
        "program_state": _program_state(dash("ur_programState")),
        "loaded_program": dash("ur_get_loaded_program"),
        "running": _program_running(ip),
        # true / false / null（null = 未能问到，见 _remote_control 的三态说明）。
        "remote_control": remote,
        "remote_control_raw": remote_raw,
        "up_time_seconds": timestamp,
        "robot_voltage": float(model.ActualRobotVoltage()),
        "robot_current": float(model.ActualRobotCurrent()),
        "joint_temperatures": [float(x) for x in model.JointTemperatures()],
        # 这些量本来就已经在 500 Hz 的 RTDE 数据流里，读取零成本；以前没有任何工具暴露它们。
        "joint_currents": [float(x) for x in model.ActualCurrent()],
        "joint_voltages": [float(x) for x in model.ActualJointVoltage()],
        "joint_speeds": [float(x) for x in model.ActualQD()],
        "tcp_speed": [float(x) for x in model.ActualTCPSpeed()],
        "tcp_force": [float(x) for x in model.ActualTCPForce()],
        "speed_scaling": float(model.SpeedScaling()),
    }
    return ok({"message": "机器人状态读取成功", "data": data})


def op_get_tcp_pose(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    pose = [float(x) for x in ROBOTS[ip].get_actual_tcp_pose()]
    return ok({"message": "当前TCP位置：%s" % pose, "data": {
        "tcp_pose": pose, "ip": ip}})


def op_get_joint_pose(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    joint = [float(x) for x in ROBOTS[ip].get_actual_joint_positions()]
    return ok({"message": "当前关节姿态：%s" % joint, "data": {
        "joint_positions": joint, "ip": ip}})


def op_get_robot_model(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    d = dashboard(ip)
    ok_flag, model = _dashboard_cmd(ip, "ur_get_robot_model")
    if not ok_flag:
        return err("读取机器人型号失败：%s" % model, "TIMEOUT")
    remote, _ = _remote_control(d)
    return ok({"message": model,
               "data": {"robot_model": model, "remote_control": remote, "ip": ip}})


def op_get_serial_number(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    ok_flag, sn = _dashboard_cmd(ip, "ur_serial_number")
    if not ok_flag:
        return err("读取序列号失败：%s" % sn, "TIMEOUT")
    return ok({"message": "序列号：%s" % sn,
               "data": {"serial_number": sn, "ip": ip}})


def op_get_time(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    try:
        ts = model.RobotTimestamp()
    except Exception as e:
        return err("开机时长获取失败：%s" % e)
    return ok({"message": "开机时长（秒）：%.2f" % ts,
               "data": {"up_time_seconds": ts, "ip": ip}})


def op_get_software_version(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    ok_flag, v = _dashboard_cmd(ip, "ur_polyscopeVersion")
    if not ok_flag:
        return err("读取软件版本失败：%s" % v, "TIMEOUT")
    return ok({"message": "软件版本：%s" % v,
               "data": {"software_version": v, "ip": ip}})


def op_get_safety_mode(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    ok_flag, m = _dashboard_cmd(ip, "ur_safetymode")
    if not ok_flag:
        return err("读取安全模式失败：%s" % m, "TIMEOUT")
    mode = _enum_token(m)
    return ok({"message": "安全模式：%s" % mode,
               "data": {"safety_mode": mode, "ip": ip}})


# UR RTDE 输出位定义。只列**有明确文档**的位：没列出的位不会出现在名字表里，但仍然会以原始
# 数值回给调用方（宁可少说，也不要编造位含义）。
_SAFETY_STATUS_BITS = {
    0: "normal_mode", 1: "reduced_mode", 2: "protective_stop", 3: "recovery_mode",
    4: "safeguard_stop", 5: "system_emergency_stop", 6: "robot_emergency_stop",
    7: "emergency_stop", 8: "violation", 9: "fault", 10: "stopped_due_to_safety",
}
_ROBOT_STATUS_BITS = {
    0: "power_on", 1: "program_running", 2: "teach_button_pressed", 3: "power_button_pressed",
}


def _read_status_word(model, field):
    """读一个 32 位状态字（读不到返回 None）。

    vendored `RobotModel` 只提供解码成布尔标志的 `SafetyStatus()` / `RobotStatus()`，没有"原始值"
    访问器；而原始值本身有诊断价值（未列出的位也要能看到），所以这里直接读 `dataDir`。
    """
    value = _rtde_field(model, field)
    try:
        return None if value is None else int(value)
    except Exception:
        return None


def _rtde_field(model, name):
    """读一个 RTDE 接收字段的**原始**值（字段缺失 / 尚未更新时返回 None）。

    为什么不走 URBasic 的访问器：工具遥测与工具模拟输入那一批
    （`ToolOutputCurrent` / `ToolOutputVoltage` / `IoCurrent` / `ToolAnalogInput0/1`）
    在 vendored `robotModel.py` 里全是 `NotImplementedError` **桩** —— 桩只会抛异常，
    调用方于是拿到 None（表现为"全 null"，看起来像控制器没数据，其实是代码里根本没有读）。
    这里直接读 `dataDir`，并且**原样返回**（不做单位换算）。
    """
    try:
        getattr(model, "dataDir")
    except Exception:
        return None
    try:
        return model.dataDir[name]
    except Exception:
        return None


def _wait_robot_power(ip, want_on, timeout=8.0):
    """等 RTDE `robot_status_bits` 的 PowerOn 位到达期望状态。

    Returns: (reached, last_bits)。model 不存在（未连接）时返回 (None, None)。

    为什么用它判断下电：`power off` 生效的瞬间控制器就停止应答 dashboard（它正在断电），
    所以"命令有没有生效"不能问 dashboard，只能看控制器自己的状态位。
    """
    model = ROBOT_MODELS.get(ip)
    if model is None:
        return None, None
    deadline = time.time() + timeout
    bits = None
    while time.time() < deadline:
        bits = _read_status_word(model, "robot_status_bits")
        if bits is not None and bool(bits & 1) == bool(want_on):
            return True, bits
        time.sleep(0.2)
    return False, bits


def _status_bit_names(raw, table):
    """按 {位号: 名字} 表列出已置位的名字（raw 读不到时返回 None）。"""
    if raw is None:
        return None
    return [name for bit, name in sorted(table.items()) if raw & (1 << bit)]


def op_get_safety_status(p):
    """安全/机器人状态位 + 安全模式。

    为什么需要它：运动撞到安全限值时，控制器只会停下来，不会告诉你"撞的是哪一条限值"。RTDE 的
    `safety_status_bits` 能说明**是哪一类安全功能被触发**（protective stop / safeguard / violation /
    fault / stopped_due_to_safety ...），据此再去 PolyScope 的「设置 → 安全 → 安全限值」页对照具体阈值。
    数值化的限值本身**不经** RTDE/dashboard 暴露，插件读不到（这是协议限制，不是本工具的缺陷）。
    """
    ip = str(p["ip"])
    robot, model = ensure_connected(ip)

    def dash(name):
        found, respond = _dashboard_cmd(ip, name)
        return respond if found else "<查询失败>"

    safety_raw = _read_status_word(model, "safety_status_bits")
    robot_raw = _read_status_word(model, "robot_status_bits")
    safety_names = _status_bit_names(safety_raw, _SAFETY_STATUS_BITS)
    robot_names = _status_bit_names(robot_raw, _ROBOT_STATUS_BITS)
    mode = _enum_token(dash("ur_safetymode"))

    def hex_or_unknown(value):
        return "未知" if value is None else "0x%X" % value

    return ok({
        "message": ("安全模式：%s；安全状态位 %s（%s）；机器人状态位 %s（%s）。"
                    "注意：**配置的安全限值数值**（力/力矩/功率/动量/速度等上限）不经 RTDE/dashboard 暴露，"
                    "需在 PolyScope 的「设置 → 安全 → 安全限值」页读取；本工具能指出是哪一类安全功能被触发"
                    "（含 violation / fault），据此对照那一页的具体阈值。"
                    % (mode, hex_or_unknown(safety_raw),
                       "、".join(safety_names) if safety_names else "无置位",
                       hex_or_unknown(robot_raw),
                       "、".join(robot_names) if robot_names else "无置位")),
        "data": {
            "ip": ip,
            "safety_mode": mode,
            "robot_mode": _enum_token(dash("ur_robotmode")),
            "runtime_state": _program_state(dash("ur_programState")),
            "safety_status_bits": safety_raw,
            "safety_status_names": safety_names,
            "robot_status_bits": robot_raw,
            "robot_status_names": robot_names,
            "limits_source": "PolyScope 设置 → 安全 → 安全限值（RTDE/dashboard 不暴露数值）",
        },
    })


def op_get_robot_mode(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    ok_flag, m = _dashboard_cmd(ip, "ur_robotmode")
    if not ok_flag:
        return err("读取运行状态失败：%s" % m, "TIMEOUT")
    mode = _enum_token(m)
    return ok({"message": "运行状态：%s" % mode,
               "data": {"robot_mode": mode, "ip": ip}})


def op_get_program_state(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    prog_ok, prog = _dashboard_cmd(ip, "ur_get_loaded_program")
    state_ok, state = _dashboard_cmd(ip, "ur_programState")
    saved_ok, saved_raw = _dashboard_cmd(ip, "ur_isProgramSaved")
    state = _program_state(state)
    running = _program_running(ip)
    if not (prog_ok or state_ok):
        return err("读取程序状态失败：%s" % (prog or state), "TIMEOUT")
    return ok({"message": "当前程序：%s；执行状态：%s" % (prog, state),
               "data": {"loaded_program": prog, "program_state": state,
                        # saved 读不到时给 null（"未知"），而不是谎报 false
                        "saved": (saved_raw.strip().lower() == "true") if saved_ok else None,
                        "running": running, "ip": ip}})


def op_get_robot_current(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    val = model.ActualRobotCurrent()
    return ok({"message": "%s（安培）" % val,
               "data": {"robot_current": val, "ip": ip}})


def op_get_robot_voltage(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    val = model.ActualRobotVoltage()
    return ok({"message": "%s（伏特）" % val,
               "data": {"robot_voltage": val, "ip": ip}})


def op_get_joint_temperatures(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    val = [float(x) for x in model.JointTemperatures()]
    return ok({"message": "%s（摄氏度）" % val,
               "data": {"joint_temperatures": val, "ip": ip}})


def op_get_int_register(p):
    ip = str(p["ip"])
    idx = _bounded_int(p["index"], "index", 0, 23, "int 寄存器下标")
    _, model = ensure_connected(ip)
    val = model.OutputIntRegister(idx)
    return ok({"message": "%d" % val, "data": {"index": idx, "value": val,
                                               "ip": ip}})


def op_get_double_register(p):
    ip = str(p["ip"])
    idx = _bounded_int(p["index"], "index", 0, 23, "double 寄存器下标")
    _, model = ensure_connected(ip)
    # 走统一的读取路径：访问器缺失时回落原始 RTDE 字段，而不是抛异常或返回 None。
    val = _read_double_register(model, idx)
    return ok({"message": "%s" % val, "data": {"index": idx, "value": val,
                                               "ip": ip}})


def op_get_bit_register(p):
    ip = str(p["ip"])
    idx = _bounded_int(p["index"], "index", 0, 63, "bool 寄存器下标")
    _, model = ensure_connected(ip)
    bits = model.OutputBitRegister()
    val = bits[idx]
    return ok({"message": "%s" % val, "data": {"index": idx, "value": val,
                                               "ip": ip}})


def op_list_programs(p):
    import paramiko
    ip = str(p["ip"])
    username = p.get("username", "root")
    # 不再内置默认口令：旧默认 root/easybot 是一个可被全网扫描到的弱凭据，把口令写在源码里
    # 等于把它当"官方默认"传播。口令现在必须由调用方显式给出。
    password = p.get("password")
    if not isinstance(password, str) or password == "":
        return err("SSH 需要显式提供 password：本插件不再内置任何默认口令（旧默认 root/easybot 已移除）。")
    programs_dir = _sanitize_path(p.get("programs_dir"), "programs_dir")

    ssh = paramiko.SSHClient()
    # RejectPolicy：未知主机密钥**直接拒绝**。旧写法 AutoAddPolicy 会无差别接受任何主机密钥，
    # 那等于把这条 SSH 通道对中间人透明 —— 而这个 op 恰恰要在控制器上执行命令。
    ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
    try:
        ssh.connect(hostname=ip, port=22, username=username, password=password,
                    timeout=8)
    except Exception as e:
        return err("SSH 连接 %s:%d 失败（%s）。请确认机器人已启动 SSH 服务，或检查 username/password。" % (ip, 22, e))

    def sh(cmd, timeout=20):
        try:
            stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
            out = stdout.read().decode("utf-8", "ignore")
            err = stderr.read().decode("utf-8", "ignore")
            return out, err
        except Exception as e:
            return "", str(e)

    # Resolve which directory to scan for *.urp files.
    #   1) programs_dir override (the operator knows best)
    #   2) real robot default  -> /programs
    #   3) URSim layout        -> ~/URSim_Linux-*/programs.<model>/
    if programs_dir:
        scan_cmd = 'find %s -name "*.urp" -type f 2>/dev/null' % shlex.quote(programs_dir)
        dirs_note = "programs_dir: %s" % programs_dir
    else:
        has_programs, _ = sh('test -d /programs && echo yes || echo no')
        if has_programs.strip() == "yes":
            scan_cmd = 'find /programs -name "*.urp" -type f 2>/dev/null'
            dirs_note = "/programs"
        else:
            scan_cmd = ('find /home -name "*.urp" '
                        '-path "*/URSim_Linux-*/programs.*/*.urp" -type f 2>/dev/null')
            dirs_note = "~/URSim_Linux-*/programs.*"

    out, errout = sh(scan_cmd)
    files = [line.strip() for line in out.split("\n") if line.strip().endswith(".urp")]
    programs = [{"path": f, "name": f.rsplit("/", 1)[-1]} for f in files]
    ssh.close()
    if errout and "find" not in errout and "No such" not in errout:
        return err("程序列表获取失败。%s" % errout)
    return ok({"message": "程序列表（%s）共 %s 个：%s" % (
        dirs_note, len(programs), [x["name"] for x in programs]),
        "data": {"programs": programs, "count": len(programs), "ip": ip}})


# ---------------------------------------------------------------------------
# send_script 执行校验（哨兵寄存器）
# ---------------------------------------------------------------------------

# RealTimeClient.SendProgram() 是**单向**的：控制器既不给 ACK，也不把 URScript 的运行期错误
# 回传给我们。所以「脚本到底执行了没有」没有直接返回值——只能在脚本前后各注入一行
# `write_output_integer_register(N, token)`，再从 RTDE 回读该寄存器。两个 token 让结论更细：
#   - 回读到**结束** token ⇒ 脚本确实在控制器上跑到了末尾；
#   - 只回读到**起始** token ⇒ 通道通、脚本开始执行了，但在预算内没跑到末尾（仍在执行、或中途
#     在控制器侧报错中止）；
#   - 两个都没回读到 ⇒ 控制器很可能**根本没执行**这段脚本（本地/示教器模式下 URScript 会被
#     静默丢弃、或脚本在编译阶段就被拒）。
# 这正是「只回一句『脚本程序已发送』」的害处：模型会以为动作生效了。
# 代价：该 int 输出寄存器的旧值会被覆盖（默认取最后一个 23，可用 register 参数改）。
DEFAULT_SENTINEL_REGISTER = 23
SEND_SCRIPT_VERIFY_TIMEOUT_S = 2.0
# 传送带读回用的是 **double** 寄存器（载荷）配一个 **int** 寄存器（哨兵）。刻意分成两个
# 寄存器家族：这样"double 那条写路径坏了"不会把哨兵一起带走 —— 否则三种结局会退化成
# "什么都没发生"，正好把最需要看见的原因藏起来（历史事故就是这条路径静默失效）。
# 20 号避开 send_script 默认的 23 与 freedrive 用的 21。
CONVEYOR_SENTINEL_REGISTER = 20
CONVEYOR_PAYLOAD_REGISTER = 0
# 脚本类运动（draw_* 等）"到底有没有被执行"的探测窗：足够短到能立刻给出结论。
SCRIPT_START_CHECK_TIMEOUT_S = 1.5

# 绘图四件套的默认加速度：**一直就是 1.0**（真机脚本里写的是 `a=1, v=0.25`），与 movel 的
# 手册默认 1.2 不是一回事。新增可选 v/a 参数时**不能**顺手把这个默认值统一成 1.2 —— 那等于
# "不传参数时行为与从前不同"，而这次加参数的前提恰恰是向后兼容。
DRAW_ACCEL_DEFAULT = 1.0


def _read_int_register(model, index):
    """回读 int 输出寄存器；读不到返回 None。

    先用 URBasic 的访问器，访问器缺失（或它自己抛异常）时回落到原始 RTDE 字段 —— 两条路
    都读不到才算"读不到"，避免把一个可用的字段因为访问器不存在而误判为不可用。
    """
    value = None
    if model is not None:
        try:
            value = model.OutputIntRegister(index)
        except Exception:
            value = None
    if value is None:
        value = _rtde_field(model, "output_int_register_%d" % index)
    try:
        return None if value is None else int(value)
    except Exception:
        return None


def _read_double_register(model, index):
    """回读 double 输出寄存器；读不到返回 None（与 `_read_int_register` 同构）。

    为什么要有这个 helper：传送带 tick 走的是 **double** 寄存器（RTDE 字段
    `output_double_register_<n>`），而此前只有 int 那一侧有"访问器失败就回落原始 RTDE 字段"
    的统一读法。缺了它，调用方各自内联 `model.OutputDoubleRegister(n)`，一旦访问器缺失
    就直接炸或静默返回 None —— 两种都不该发生。
    """
    value = None
    if model is not None:
        try:
            value = model.OutputDoubleRegister(index)
        except Exception:
            value = None
    if value is None:
        value = _rtde_field(model, "output_double_register_%d" % index)
    try:
        return None if value is None else float(value)
    except Exception:
        return None


def _sentinel_token(previous, *avoid):
    """造一个与 `previous` **以及 `avoid` 里任何一个**都不同的哨兵 token。

    为什么必须能一次排除一整组：token 的基值是 `0x5A5A0000 | (毫秒 & 0xFFFF)`，
    同一毫秒内反复调用会得到**同一个值**。而"只保证与紧邻的前一个不同"是不够的——
    首尾两个 token 并不相邻，一旦撞上，"脚本被拒收"（寄存器停在起始值）就会被误判成
    "已经跑到结束哨兵"，正好把这个哨兵存在的意义反过来用。
    实测撞过两次（真机 UR30 与单测各一次），所以这里改成显式排除一组。
    """
    taken = set()
    if previous is not None:
        taken.add(previous)
    for item in avoid:
        if item is not None:
            taken.add(item)
    token = 0x5A5A0000 | (int(time.time() * 1000) & 0xFFFF)
    while token in taken:
        token = (token + 1) & 0x7FFFFFFF
    return token


# URScript 的块结构：`def` / `if` / `while` / `for` / `switch` 各自需要一个 `end`；
# `else` / `elif` 是 if 的延续，不额外开块。
_BLOCK_OPEN_RE = re.compile(r"^\s*(?:def|if|while|for|switch)\b")
_BLOCK_END_RE = re.compile(r"^\s*end\b")
_FUNC_DEF_RE = re.compile(r"^(\s*)def\s+([A-Za-z_][\w]*)\s*\(")
_TOP_LEVEL_CALL_RE = re.compile(r"^\s*([A-Za-z_][\w]*)\s*\(")


def _find_function_bodies(lines):
    """定位每个 `def … end`：返回 [(名字, def 行号, 对应 end 行号)]（行号 0 基）。

    块用深度计数配对，所以函数体里嵌套的 if/while 不会把 `end` 认错。
    """
    bodies = []
    index = 0
    while index < len(lines):
        match = _FUNC_DEF_RE.match(lines[index])
        if match is None:
            index += 1
            continue
        depth = 1
        cursor = index + 1
        end_index = None
        while cursor < len(lines):
            if _BLOCK_OPEN_RE.match(lines[cursor]):
                depth += 1
            elif _BLOCK_END_RE.match(lines[cursor]):
                depth -= 1
                if depth == 0:
                    end_index = cursor
                    break
            cursor += 1
        if end_index is None:
            index += 1
            continue
        bodies.append((match.group(2), index, end_index))
        index = end_index + 1
    return bodies


def _inject_sentinels(script, start_sentinel, finish_sentinel):
    """把哨兵注入到「真正会被执行的那段代码」里，且**不改变脚本的执行形态**。

    两种形态，处理方式不同：

    1. **纯语句脚本**（插件自己的 `movej` / `movel` 就是这种）：顶层前后各一行。顶层语句本来就会
       被执行，所以形态不变。
    2. **含 `def … end` 的脚本**：注入到**函数体内部**（第一句 / 最后一句）。
       **绝不拼到顶层**——真机实测过：在 `def … end` 之外拼顶层哨兵，会把脚本变成
       「函数体一句都不跑、顶层语句照跑」的形态，于是哨兵回读成功、实际什么都没做 ⇒
       报出假阳性「已执行完毕 0.0 s」。注入进函数体则不改变形态，且哨兵真的代表「跑到了末尾」。
       只有一个函数时（无论顶层有没有调用）就注入它；有多个函数时只注入**被顶层调用的那个**；
       看不出调用哪个就**拒绝注入**（返回 None）——宁可不校验，也不能假报成功。

    Returns: (payload 文本 或 None, info dict)
    """
    lines = script.split("\n")
    bodies = _find_function_bodies(lines)
    if not bodies:
        return ("%s%s%s" % (start_sentinel, script if script.endswith("\n") else script + "\n",
                            finish_sentinel),
                {"mode": "top_level"})

    body_span = [(start, end) for _name, start, end in bodies]

    def inside_body(index):
        return any(start <= index <= end for start, end in body_span)

    called = []
    for index, line in enumerate(lines):
        if inside_body(index):
            continue
        call = _TOP_LEVEL_CALL_RE.match(line)
        if call is not None and any(call.group(1) == name for name, _s, _e in bodies):
            called.append(call.group(1))

    if len(set(called)) == 1:
        target = called[0]
    elif not called and len(bodies) == 1:
        target = bodies[0][0]
    else:
        return None, {"mode": "refused",
                      "functions": [name for name, _s, _e in bodies],
                      "top_level_calls": sorted(set(called))}

    def_index, end_index = next((start, end) for name, start, end in bodies if name == target)

    # 沿用函数体自身的缩进，保持排版不变。
    body_indent = ""
    if end_index > def_index + 1:
        indent_match = re.match(r"^(\s*)\S", lines[def_index + 1])
        if indent_match is not None:
            body_indent = indent_match.group(1)
    if body_indent == "":
        def_match = _FUNC_DEF_RE.match(lines[def_index])
        body_indent = (def_match.group(1) if def_match is not None else "") + "    "

    injected = (lines[:def_index + 1]
                + [body_indent + start_sentinel.strip()]
                + lines[def_index + 1:end_index]
                + [body_indent + finish_sentinel.strip()]
                + lines[end_index:])
    payload = "\n".join(injected)
    if not payload.endswith("\n"):
        payload += "\n"
    return payload, {"mode": "function_body", "function": target,
                     "def_line": def_index + 1, "end_line": end_index + 1}


def op_send_script(p):
    ip = str(p["ip"])
    script = str(p["script"])
    verify = bool(p.get("verify", True))
    robot, model = ensure_connected(ip)

    if not verify:
        if not _send_program(robot, script):
            return err("脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
        return ok({"message": "脚本已发送，但**未做执行校验**（verify=false）：本工具无法确认控制器是否真的执行了它",
                   "data": {"ip": ip, "sent": True, "verified": None}})

    index = _bounded_int(p.get("register", DEFAULT_SENTINEL_REGISTER), "register", 0, 23, "哨兵寄存器编号")
    before = _read_int_register(model, index)
    start_token = _sentinel_token(before)
    # `finish` 必须同时避开 `before` 与 `start`：它与 `before` **不相邻**，撞上就会把
    # "脚本没执行"直接读成"已跑到末尾"（假阳性）。
    finish_token = _sentinel_token(start_token, before)
    start_line = "write_output_integer_register(%d, %d)\n" % (index, start_token)
    finish_line = "write_output_integer_register(%d, %d)\n" % (index, finish_token)

    payload, injection = _inject_sentinels(script, start_line, finish_line)
    if payload is None:
        # 定位不到该注入哪个函数体 ⇒ **原样发送、不做校验**。绝不用"顶层拼哨兵"糊弄过去：
        # 那正是会报假阳性的形态（见 _inject_sentinels 的说明）。
        sent = _send_program(robot, script)
        if not sent:
            return err("脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
        return ok({"message": ("脚本已按原样发送，但**无法执行校验**：脚本里有多个函数定义，"
                               "顶层看不出会调用哪一个（%s）。要做校验，请只保留一个函数、或在顶层显式调用其中一个；"
                               "也可以传 verify=false 明确表示不校验。注意：此时 verified 为 null ⇒ 表示"
                               "「未确认」，不等于成功。"
                               % ("、".join(injection.get("functions") or []) or "无")),
                   "data": {"ip": ip, "sent": True, "verified": None, "injection": injection}})
    if not _send_program(robot, payload):
        return err("脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")

    budget = min(SEND_SCRIPT_VERIFY_TIMEOUT_S,
                 max(0.5, int(p.get("_timeout_ms", 60000)) / 1000.0 - 1.0))
    deadline = time.time() + budget
    started = False
    observed = before
    while time.time() < deadline:
        observed = _read_int_register(model, index)
        if observed == finish_token:
            return ok({"message": "脚本已在控制器上执行完毕（结束哨兵 %d 已回读，用时 %.1fs）"
                                  % (finish_token, budget - max(0.0, deadline - time.time())),
                       "data": {"ip": ip, "sent": True, "verified": True,
                                "injection": injection,
                                "sentinel": {"register": index, "before": before,
                                             "start_token": start_token, "finish_token": finish_token,
                                             "observed": observed, "started": True}}})
        if observed == start_token:
            started = True
        time.sleep(0.1)

    if started:
        return ok({"message": ("脚本已在控制器上**开始执行**（起始哨兵 %d 已回读），但在 %.1fs 内未见结束哨兵"
                               "（寄存器 %d = %s，期望 %d）⇒ 它可能仍在执行，或中途在控制器侧报错中止。"
                               "如需等待完成，可稍后用 ursim_get_status 看 program_state；"
                               "若脚本本身是阻塞/长动作脚本，可传 verify=false 跳过校验。"
                               % (start_token, budget, index, observed, finish_token)),
                   "data": {"ip": ip, "sent": True, "verified": False,
                            "injection": injection,
                            "sentinel": {"register": index, "before": before,
                                         "start_token": start_token, "finish_token": finish_token,
                                         "observed": observed, "started": True}}})
    return ok({"message": ("脚本已发送，但**连起始哨兵都没观察到**（寄存器 %d 仍为 %s，本次写入过 %d）⇒ 控制器很可能"
                           "根本没有执行这段脚本。最常见的原因：控制器未处于远程控制模式（本地/示教器模式下 URScript "
                           "按设计被静默丢弃）；其次是脚本在控制器侧被拒或立即报错（例如某个函数在该软件版本上不可用）。"
                           "可先用 ursim_get_status 看 remote_control / program_state，或发一段最简脚本单独验证通道。"
                           % (index, observed, start_token)),
               "data": {"ip": ip, "sent": True, "verified": False,
                        "injection": injection,
                        "sentinel": {"register": index, "before": before,
                                     "start_token": start_token, "finish_token": finish_token,
                                     "observed": observed, "started": False}}})


def op_movej(p):
    ip = str(p["ip"])
    q = _vec(p, "q", 6, "movej 的 q")
    # 默认值取自手册：Poly5 15.29 / PolyScope X 15.28 的 `movej(q, a=1.4, v=1.05, t=0, r=0)`
    # （旧代码给的是 a=1/v=1，既不是手册默认值、也不是 URBasic 的默认值，纯粹是随手写的）。
    a = _nonneg_float(p.get("a", 1.4), "a", "movej 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 1.05), "v", "movej 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "movej 的时长")
    r = _nonneg_float(p.get("r", 0), "r", "movej 的交融半径")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "movej")
    robot.movej(q, a, v, t, r, wait=False)
    ok_flag, msg = _movej_confirm(ip, q, _budget_ms(p))
    cmd = "movej(%s,%s,%s,%s,%s)" % (q, a, v, t, r)
    data = {"ok": ok_flag, "command": cmd, "ip": ip}
    if not ok_flag:
        return _motion_failure("movej", msg, data)
    return ok({"message": "命令 %s 已发送，%s" % (cmd, msg),
               "data": data})


def op_movel(p):
    ip = str(p["ip"])
    pose = _vec(p, "pose", 6, "movel 的 pose")
    # 手册默认值：Poly5 15.30 / PolyScope X 15.29 的 `movel(pose, a=1.2, v=0.25, t=0, r=0)`
    # —— 250 mm/s。旧代码默认 v=1（1 m/s，是手册默认的 4 倍），对协作臂来说是"没写速度就按
    # 手册跑得最快的那一档"，这里改回手册值。
    a = _nonneg_float(p.get("a", 1.2), "a", "movel 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "movel 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "movel 的时长")
    r = _nonneg_float(p.get("r", 0), "r", "movel 的交融半径")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "movel")
    robot.movel(pose, a, v, t, r, wait=False)
    ok_flag, msg = _movel_confirm(ip, pose, _budget_ms(p))
    cmd = "movel(p%s,%s,%s,%s,%s)" % (pose, a, v, t, r)
    data = {"ok": ok_flag, "command": cmd, "ip": ip}
    if not ok_flag:
        return _motion_failure("movel", msg, data)
    return ok({"message": "命令 %s 已发送，%s" % (cmd, msg),
               "data": data})


def _axis_move(p, axis):
    ip = str(p["ip"])
    distance = float(p["distance"])
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "沿轴移动")
    pose = [float(x) for x in robot.get_actual_tcp_pose()]
    if len(pose) != 6:
        return err("读取当前 TCP 位姿异常（期望 6 维，收到 %d 维），无法沿轴移动" % len(pose))
    pose[axis] = pose[axis] + distance
    robot.movel(pose, wait=False)
    ok_flag, msg = _movel_confirm(ip, pose, _budget_ms(p))
    cmd = "movel(p[%.4f,%.4f,%.4f,%.4f,%.4f,%.4f],0.5,0.25,0,0)" % tuple(pose)
    data = {"ok": ok_flag, "command": cmd, "ip": ip}
    if not ok_flag:
        return _motion_failure("沿 %s 轴移动" % "xyz"[axis], msg, data)
    return ok({"message": "命令 %s 已发送，%s" % (cmd, msg),
               "data": data})


def op_move_x(p):
    return _axis_move(p, 0)


def op_move_y(p):
    return _axis_move(p, 1)


def op_move_z(p):
    return _axis_move(p, 2)


def _rotvec_to_matrix(rotvec):
    """UR 的 TCP 姿态 (rx,ry,rz)（轴角：方向为旋转轴、模长为旋转角，单位弧度）→ 3×3 旋转矩阵。

    Rodrigues 公式；零旋转返回单位阵。
    """
    v = np.asarray(rotvec, dtype=float)
    theta = float(np.linalg.norm(v))
    if theta < 1e-12:
        return np.eye(3)
    k = v / theta
    skew = np.array([[0.0, -k[2], k[1]],
                     [k[2], 0.0, -k[0]],
                     [-k[1], k[0], 0.0]])
    return np.eye(3) + math.sin(theta) * skew + (1.0 - math.cos(theta)) * (skew @ skew)


def _tool_axis_move(p, axis):
    """沿**工具坐标系**的某条轴做直线移动（axis: 0=x, 1=y, 2=z）。

    做法：读当前 TCP 位姿 → 用其姿态的旋转矩阵把「工具系位移」换算成「基座系位移」→ 直接发基座系
    的 movel 目标位姿。**刻意不用 URScript 的 pose_trans**：它在各软件版本上的可用性/行为有差异
    （CB3 3.15 上出现过运行期中止），而这里的换算只用 numpy、与控制器版本无关，且目标位姿是我们
    自己算出来的、可核对——返回值里同时给出工具系位移与换算后的基座系位移。
    """
    ip = str(p["ip"])
    distance = float(p["distance"])
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "沿工具轴移动")
    pose = [float(x) for x in robot.get_actual_tcp_pose()]
    if len(pose) != 6:
        return err("读取当前 TCP 位姿异常（期望 6 维，收到 %d 维），无法沿工具轴移动" % len(pose))
    delta_tool = [0.0, 0.0, 0.0]
    delta_tool[axis] = distance
    delta_base = _rotvec_to_matrix(pose[3:6]).dot(np.asarray(delta_tool, dtype=float))
    target = [pose[0] + float(delta_base[0]), pose[1] + float(delta_base[1]),
              pose[2] + float(delta_base[2]), pose[3], pose[4], pose[5]]
    robot.movel(target, wait=False)
    ok_flag, msg = _movel_confirm(ip, target, _budget_ms(p))
    cmd = "movel(p[%.4f,%.4f,%.4f,%.4f,%.4f,%.4f],0.5,0.25,0,0)" % tuple(target)
    data = {"ok": ok_flag, "command": cmd, "ip": ip,
            "tool_delta": delta_tool,
            "base_delta": [float(x) for x in delta_base]}
    if not ok_flag:
        return _motion_failure("沿工具 %s 轴移动" % "xyz"[axis], msg, data)
    return ok({"message": "命令 %s 已发送（工具系 %s 轴 %.4f m ⇒ 基座系位移 [%.4f, %.4f, %.4f]），%s"
                          % (cmd, "xyz"[axis], distance, float(delta_base[0]),
                             float(delta_base[1]), float(delta_base[2]), msg),
               "data": data})


def op_move_tool_x(p):
    return _tool_axis_move(p, 0)


def op_move_tool_y(p):
    return _tool_axis_move(p, 1)


def op_move_tool_z(p):
    return _tool_axis_move(p, 2)


def _circle_waypoints(center, r, coordinate):
    """圆的 4 个途经点（**从 `op_draw_circle` 原样抽出**，真机 URScript 与离线仿真共用）。

    抽出来的理由：仿真的轨迹必须与真机那条 URScript 是**同一份几何**，否则"仿真里画了个圆"
    与"真机上画了个圆"会是两个不同的圆 —— 那正是"看起来能用、其实在骗人"。
    """
    wp = [list(center) for _ in range(4)]
    if coordinate == "z":
        wp[0][2] = wp[0][2] + r
        wp[1][1] = wp[1][1] + r
        wp[2][2] = wp[2][2] - r
        wp[3][1] = wp[3][1] - r
    else:
        wp[0][0] = wp[0][0] - r
        wp[1][1] = wp[1][1] + r
        wp[2][0] = wp[2][0] + r
        wp[3][1] = wp[3][1] - r
    return wp


def _circle_pose(center, plane_u, plane_v, r, theta):
    """圆上一点：`center + r·(cosθ·u + sinθ·v)`，姿态恒等于 `center` 的姿态。

    θ=0/π/2/π/3π/2 恰好落在 `_circle_waypoints` 的 4 个点上 —— 真机那两条 `movec`
    走的正是这个圆（4 个共圆的 90° 点）。
    """
    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    return [center[0] + r * (cos_t * plane_u[0] + sin_t * plane_v[0]),
            center[1] + r * (cos_t * plane_u[1] + sin_t * plane_v[1]),
            center[2] + r * (cos_t * plane_u[2] + sin_t * plane_v[2]),
            center[3], center[4], center[5]]


def _square_waypoints(origin, border, coordinate):
    """正方形的 3 个途经点（`origin` 是一个角）；真机脚本再回到 `origin` 闭合。"""
    wp = [list(origin) for _ in range(3)]
    if coordinate == "z":
        # y-z 竖直平面：先沿 +y 走 border，再沿 z 走 border（回到原 x）
        wp[0][1] = wp[0][1] + border
        wp[1][1] = wp[1][1] + border
        wp[1][2] = wp[1][2] - border
        wp[2][2] = wp[2][2] - border
    else:
        # x-y 水平平面：先沿 +y 走 border，再沿 +x 走 border
        wp[0][1] = wp[0][1] + border
        wp[1][1] = wp[1][1] + border
        wp[1][0] = wp[1][0] + border
        wp[2][0] = wp[2][0] + border
    return wp


def _rectangle_waypoints(origin, width, height, coordinate):
    """长方形的 3 个途经点（`origin` 是一个角）；真机脚本再回到 `origin` 闭合。"""
    wp = [list(origin) for _ in range(3)]
    if coordinate == "z":
        wp[0][1] = wp[0][1] + width
        wp[1][1] = wp[1][1] + width
        wp[1][2] = wp[1][2] - height
        wp[2][2] = wp[2][2] - height
    else:
        wp[0][1] = wp[0][1] + width
        wp[1][1] = wp[1][1] + width
        wp[1][0] = wp[1][0] + height
        wp[2][0] = wp[2][0] + height
    return wp


def _star_vertices(center, side, coordinate):
    """五角星的 5 个顶点与外接半径 `R`（边长为 `side` 时 `R = side / (2·sin72°)`）。"""
    R = side / (2.0 * math.sin(math.radians(72.0)))
    angles = [90.0, 162.0, 234.0, 306.0, 18.0]
    verts = []
    for ang in angles:
        rad = math.radians(ang)
        dvx = R * math.cos(rad)
        dvy = R * math.sin(rad)
        if coordinate == "z":
            v = [center[0], center[1] + dvy, center[2] + dvx,
                 center[3], center[4], center[5]]
        else:
            v = [center[0] + dvx, center[1] + dvy, center[2],
                 center[3], center[4], center[5]]
        verts.append(v)
    return verts, R


# 五角星的连线顺序：每隔一个顶点连一次 ⇒ 一笔画出五角星（真机脚本与仿真共用）。
STAR_ORDER = [0, 2, 4, 1, 3, 0]


def op_draw_circle(p):
    ip = str(p["ip"])
    center = _vec(p, "center", 6, "draw_circle 的 center")
    r = _nonneg_float(p["r"], "r", "draw_circle 的半径", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    # v/a/t 可选（0.2.2）：默认值与这条工具**一直用的**那一对相同（真机脚本原本写死
    # `a=1, v=0.25`）⇒ 不传时行为与从前完全一致。`t` 在真机路径上没有对应物，见
    # `_ignored_t_note`：URScript 的 `t` 是每条 move* 各一个时长，不是整段一个。
    a = _nonneg_float(p.get("a", 1.0), "a", "draw_circle 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "draw_circle 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "draw_circle 的时长")
    robot, _ = ensure_connected(ip)
    wp = _circle_waypoints(center, r, coordinate)
    # `movec` 的 mode 参数省略（默认就是 0）：某些固件对多余的关键字参数更严格，省略可提高跨版本兼容性。
    cmd = ("movep(p%s, a=%s, v=%s, r=0.025)\n"
           "movec(p%s, p%s, a=%s, v=%s, r=0.025)\n"
           "movec(p%s, p%s, a=%s, v=%s, r=0.025)" %
           (wp[0], a, v, wp[1], wp[2], a, v, wp[3], wp[0], a, v))
    _assert_remote_control(ip, "draw_circle")

    # 「控制器到底有没有执行这段脚本」必须当场确认：固件差异会让这段指令组合被拒（真机实测：
    # CB3/3.15 正常，UR20/PS5.21 一动不动），而旧实现只会在 _wait_robot_idle 里干等满预算
    # （60 s 后才报超时，且说明不了原因）。前置一行起始哨兵即可把"完全不动"变成即时结论。
    index = _bounded_int(p.get("register", DEFAULT_SENTINEL_REGISTER), "register", 0, 23,
                         "执行哨兵寄存器编号")
    model = ROBOT_MODELS.get(ip)
    token = _sentinel_token(_read_int_register(model, index))
    script = "write_output_integer_register(%d, %d)\n%s\n" % (index, token, cmd)
    if not _send_program(robot, script):
        return err("draw_circle 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    deadline = time.time() + SCRIPT_START_CHECK_TIMEOUT_S
    while time.time() < deadline:
        if _read_int_register(model, index) == token:
            break
        time.sleep(0.1)
    else:
        return err("控制器**没有执行** draw_circle 脚本：%.1fs 内没看到起始哨兵（寄存器 %d）。"
                   "机器人不会移动 —— 旧版就是在这里干等满 60 s 再报超时。可能原因：该固件不接受这段"
                   "指令组合（movep/movec），或控制器未处于远程控制模式。"
                   % (SCRIPT_START_CHECK_TIMEOUT_S, index), "NOT_EXECUTED",
                   {"command": cmd, "register": index, "token": token, "ip": ip})

    ok_flag, confirm = _wait_robot_idle(ip, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "register": index, "ip": ip,
            "t_ignored": t > 0}
    if not ok_flag:
        return _motion_failure("draw_circle", confirm, data)
    return ok({"message": "命令已发送（控制器已开始执行），%s：%s%s" % (confirm, cmd, _ignored_t_note(t)),
               "data": data})


def op_draw_square(p):
    """以 origin 为一个角、border 为边长，走一个闭合正方形。

    ★ 位姿向量的下标：0-2 是 x/y/z（**米**），3-5 是 rx/ry/rz（**弧度**）。
    `coordinate="z"` 表示在 **y-z 竖直平面**内画（与 draw_circle / draw_star 的约定一致），
    因此竖直那条边必须写 **下标 2（z，米）**。

    ⚠️ 这里曾经写成 `wp[1][3] -= border` / `wp[2][3] -= border` —— 把米写进了**旋转分量**，
    于是 `draw_square(border=0.2, coordinate="z")` 实际是让工具绕 rx 转 ±0.2 rad（≈11.5°）
    而不是画方。同一函数里水平分支用的是位置分量，draw_circle/draw_star 的 z 分支也用下标 2，
    所以这是笔误而非设计。
    """
    ip = str(p["ip"])
    origin = _vec(p, "origin", 6, "draw_square 的 origin")
    border = _nonneg_float(p["border"], "border", "draw_square 的边长", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    # v/a/t 可选：默认 a=1.0 / v=0.25 与这条工具原本写死的那一对**完全相同**
    # （⇒ 不传时行为不变）。`t` 在真机路径上被忽略，回包里明说（见 `_ignored_t_note`）。
    a = _nonneg_float(p.get("a", 1.0), "a", "draw_square 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "draw_square 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "draw_square 的时长")
    robot, _ = ensure_connected(ip)
    wp = _square_waypoints(origin, border, coordinate)
    cmd = ("movel(p%s, a=%s, v=%s)\nmovel(p%s, a=%s, v=%s)\n"
           "movel(p%s, a=%s, v=%s)\nmovel(p%s, a=%s, v=%s)\n"
           "movel(p%s, a=%s, v=%s)" %
           (origin, a, v, wp[0], a, v, wp[1], a, v, wp[2], a, v, origin, a, v))
    _assert_remote_control(ip, "draw_square")
    if not _send_program(robot, cmd):
        return err("draw_square 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    ok_flag, confirm = _wait_robot_idle(ip, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "ip": ip, "t_ignored": t > 0}
    if not ok_flag:
        return _motion_failure("draw_square", confirm, data)
    return ok({"message": "命令已发送，%s：%s%s" % (confirm, cmd, _ignored_t_note(t)),
               "data": data})


def op_draw_rectangle(p):
    """以 origin 为一个角、width × height 走一个闭合长方形。

    ★ 同 `op_draw_square`：竖直方向的位移必须落在**位置**分量上
    （`coordinate="z"` 时是下标 2 = z，米），不能落在旋转分量（下标 3 = rx，弧度）。
    这里同样修掉了 `wp[1][3] -= height` 的笔误。
    """
    ip = str(p["ip"])
    origin = _vec(p, "origin", 6, "draw_rectangle 的 origin")
    width = _nonneg_float(p["width"], "width", "draw_rectangle 的长", allow_zero=False)
    height = _nonneg_float(p["height"], "height", "draw_rectangle 的宽", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    # 同 `op_draw_square`：v/a/t 可选，默认 a=1.0 / v=0.25 与原来写死的值完全一致。
    a = _nonneg_float(p.get("a", 1.0), "a", "draw_rectangle 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "draw_rectangle 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "draw_rectangle 的时长")
    robot, _ = ensure_connected(ip)
    wp = _rectangle_waypoints(origin, width, height, coordinate)
    cmd = ("movel(p%s, a=%s, v=%s)\nmovel(p%s, a=%s, v=%s)\n"
           "movel(p%s, a=%s, v=%s)\nmovel(p%s, a=%s, v=%s)\n"
           "movel(p%s, a=%s, v=%s)" %
           (origin, a, v, wp[0], a, v, wp[1], a, v, wp[2], a, v, origin, a, v))
    _assert_remote_control(ip, "draw_rectangle")
    if not _send_program(robot, cmd):
        return err("draw_rectangle 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    ok_flag, confirm = _wait_robot_idle(ip, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "ip": ip, "t_ignored": t > 0}
    if not ok_flag:
        return _motion_failure("draw_rectangle", confirm, data)
    return ok({"message": "命令已发送，%s：%s%s" % (confirm, cmd, _ignored_t_note(t)),
               "data": data})


def op_draw_star(p):
    """Draw a five-pointed star (pentagram) with a given side length.

    center: 6-D pose whose (x,y,z) is the star center; orientation is held.
    side:   length (m) of each pentagram side.
    coordinate: "z" -> vertical (y-z plane); anything else -> horizontal (x-y).
    """
    ip = str(p["ip"])
    center = _vec(p, "center", 6, "draw_star 的 center")
    side = _nonneg_float(p["side"], "side", "draw_star 的边长", allow_zero=False)
    coordinate = str(p.get("coordinate", "xy")).lower()
    # 同 `op_draw_square`：v/a/t 可选，默认 a=1.0 / v=0.25 与原来写死的值完全一致。
    a = _nonneg_float(p.get("a", 1.0), "a", "draw_star 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "draw_star 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "draw_star 的时长")
    robot, _ = ensure_connected(ip)

    verts, R = _star_vertices(center, side, coordinate)
    lines = []
    for idx in STAR_ORDER:
        # ⚠️ 循环变量**不能**叫 v：它是速度参数（旧写法在这里用 `v` 装顶点，那会静默遮住速度）。
        vertex = verts[idx]
        lines.append("movel(p[%.4f,%.4f,%.4f,%.4f,%.4f,%.4f], a=%s, v=%s, r=0.0)"
                     % (tuple(vertex) + (a, v)))
    cmd = "\n".join(lines)
    _assert_remote_control(ip, "draw_star")
    if not _send_program(robot, cmd):
        return err("draw_star 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    ok_flag, confirm = _wait_robot_idle(ip, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "vertices": verts, "radius": R, "ip": ip,
            "t_ignored": t > 0}
    if not ok_flag:
        return _motion_failure("draw_star", confirm, data)
    return ok({"message": "命令已发送（五角星，边长 %sm，外接半径 %.4fm），%s：%s%s"
                          % (side, R, confirm, cmd, _ignored_t_note(t)),
               "data": data})


def _build_program_target(p):
    """Build the string for the dashboard `load` command.

    Accepts a bare name (pick.urp) or a full/relative path (a URSim path). If
    `programs_dir` is supplied and the name is bare, join them so URSim paths
    like ~/URSim_Linux-*/programs.<model>/program.urp work too. Both name and
    directory go through _sanitize_path (rejects control chars + shell
    metachars) before reaching the dashboard so a `\\nplay` payload cannot be
    smuggled past the motion-approval gate.
    """
    name = _sanitize_path(p.get("program_name", ""), "program_name")
    programs_dir = _sanitize_path(p.get("programs_dir", ""), "programs_dir")
    if not name:
        return name
    if programs_dir and "/" not in name:
        return programs_dir.rstrip("/") + "/" + name
    return name


def _load_failed(resp):
    r = (resp or "").lower()
    return ("not found" in r) or ("no such" in r) or ("no program loaded" in r)


# dashboard 对 stop/pause/play 的失败应答关键词。缺少这层检查时，"命令被拒"与"命令生效"
# 都只回一句原始应答，工具则一律回报成功。
_DASHBOARD_FAILURE_WORDS = (
    "could not", "not understand", "not allowed", "failed", "no program",
    "unable", "error", "denied", "not loaded",
)


def _dashboard_ok(resp):
    """dashboard 应答是否表示成功（无法判断的应答按成功处理，但会原样回报）。"""
    r = (resp or "").strip().lower()
    return not any(word in r for word in _DASHBOARD_FAILURE_WORDS)


def _loaded_program(d):
    """Authoritative check: ask the dashboard what program is loaded."""
    try:
        send_command = getattr(d, "sendCommand", None)
        if callable(send_command):
            ok_flag, respond = send_command("ur_get_loaded_program")
            return respond if ok_flag else ""
        d.ur_get_loaded_program()
        return (d.last_respond or "").strip()
    except Exception:
        return ""


def op_load_program(p):
    ip = str(p["ip"])
    name = _sanitize_path(p.get("program_name", ""), "program_name")
    ensure_connected(ip)
    if not name:
        return err("未指定要加载的程序名 program_name。")
    target = _build_program_target(p)
    # `ur_load` 需要参数，不能走无参的 _dashboard_cmd；但**必须**沿用同一套"只认本次应答"
    # 的做法（先清空 last_respond），否则 "File not found" 会被上一条应答顶掉。
    sent, resp = _dashboard_cmd_args(ip, "ur_load", target)
    loaded = _loaded_program(dashboard(ip))
    confirmed = (not _load_failed(loaded)) and (not _load_failed(resp)) and loaded != ""
    note = "" if confirmed else "；加载未确认，请检查程序名/路径或是否在对应的 UR 实例下"
    return ok({"message": "加载程序：%s（已加载：%s%s）" % (name, loaded, note),
               "data": {"program_name": name, "target": target, "loaded": loaded,
                        "respond": resp, "sent": sent,
                        "confirmed": confirmed, "ip": ip}})


def op_run_program(p):
    ip = str(p["ip"])
    name = _sanitize_path(p.get("program_name", ""), "program_name")
    ensure_connected(ip)
    d = dashboard(ip)
    if name:
        target = _build_program_target(p)
        d.last_respond = None
        d.ur_load(target)
        loaded = _loaded_program(d)
        if _load_failed(loaded):
            return err("无法运行：加载程序 %s 未确认（%s）。请检查程序名/路径，或确认该程序在当前 UR 实例的程序目录下。" % (name, loaded))
    play_ok, resp = _dashboard_cmd(ip, "ur_play")
    # 只回报"已下发"，并且**同时给出运行状态**：dashboard 说 play 了、但机器人可能因安全
    # 停止/未使能而根本没启动。把 running 一并返回，调用方（与模型）才有依据下判断。
    running = _program_running(ip)
    if not play_ok:
        return err("启动程序失败：%s" % resp, "TIMEOUT")
    if not _dashboard_ok(resp):
        return err("启动程序被控制器拒绝：%s" % resp)
    return ok({"message": "已下发启动程序 %s（控制器应答：%s；运行状态：%s）"
                          % (name or "(当前加载)", resp, "运行中" if running else "未在运行"),
               "data": {"program_name": name, "respond": resp, "running": running, "ip": ip}})


def op_stop_program(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    sent, resp = _dashboard_cmd(ip, "ur_stop")
    if not sent:
        return err("停止程序失败：%s" % resp, "TIMEOUT")
    if not _dashboard_ok(resp):
        return err("停止程序被控制器拒绝：%s" % resp)
    return ok({"message": "已停止程序（%s）" % resp,
               "data": {"respond": resp, "running": _program_running(ip), "ip": ip}})


def op_pause_program(p):
    ip = str(p["ip"])
    ensure_connected(ip)
    sent, resp = _dashboard_cmd(ip, "ur_pause")
    if not sent:
        return err("暂停程序失败：%s" % resp, "TIMEOUT")
    if not _dashboard_ok(resp):
        return err("暂停程序被控制器拒绝：%s" % resp)
    return ok({"message": "已暂停程序（%s）" % resp,
               "data": {"respond": resp, "running": _program_running(ip), "ip": ip}})


def op_reset_error(p):
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    power_on = robot.reset_error()
    return ok({"message": "错误复位完成，机器人就绪：%s" % power_on,
               "data": {"power_on": bool(power_on), "ip": ip}})


def op_ping(p):
    """Health check — no robot required."""
    return ok({"message": "pong",
               "data": {"python": sys.version.split()[0], "urbasic": True}})


def op_get_digital_in(p):
    ip = str(p["ip"])
    which = str(p.get("which", "std")).lower()
    robot, _ = ensure_connected(ip)
    if which == "config":
        n = _bounded_int(p["n"], "n", 8, 15, "config 端口号")
        val = robot.get_configurable_digital_in(n)
    elif which == "tool":
        n = _bounded_int(p["n"], "n", 0, 1, "tool 端口号")
        # Tool digital inputs are not on RTDE; get_tool_digital_in runs a
        # URScript expression via the RealTime client and reads the result back.
        #
        # ⚠️ 实测（PolyScope 5.21 / UR30 / URSim）：**控制器可能拒绝执行这段脚本** ——
        # 未接工具、工具 I/O 未启用或工具端被 TCI 串口占用时，`get_tool_digital_in(n)`
        # 会让程序以**运行期错误**结束。上游的 `waitRobotIdleOrStopFlag()` 把这种情况抛成
        # `RuntimeError: Robot program execution error!!!`，对使用者零信息量；更糟的是
        # `urScript.get_tool_digital_in` 随后**回读输出寄存器 0** —— 脚本没跑成，它读到的是
        # 上一次遗留的值，却当成输入电平报出去（上游注释里已记过这个坑）。
        # 这里把运行期失败换成说明原因的错误，并且**在失败路径上不回读任何寄存器**。
        try:
            val = robot.get_tool_digital_in(n)
        except RuntimeError as exc:
            if "execution error" not in str(exc):
                raise
            return err(
                "控制器拒绝执行读取工具数字输入的脚本（get_tool_digital_in(%d)）⇒ 无法给出电平。"
                "常见原因：未连接工具、工具数字 I/O 未启用，或工具端被 TCI 串口占用"
                "（启用工具通信会禁用工具模拟输入）。原始报错：%s" % (n, exc))
    else:
        n = _bounded_int(p["n"], "n", 0, 7, "std 端口号")
        val = robot.get_standard_digital_in(n)
    return ok({"message": "%s" % bool(val),
               "data": {"which": which, "port": n, "value": bool(val), "ip": ip}})


def op_set_digital_out(p):
    ip = str(p["ip"])
    which = str(p.get("which", "std")).lower()
    value = bool(p["value"])
    robot, _ = ensure_connected(ip)
    # 全部数字输出都走 URScript（与 tool/analog/payload/TCP 的既有做法一致），
    # 不走 RTDE *输入*：控制器会拒绝第二次 SETUP_INPUTS（"An input parameter is
    # already in use."），该异常在 RTDE 线程里会把整条连接拖死（详见
    # URBasic/rtde.py 中 run() 处的注释）。代价：UR 只在「远程控制」模式下接受
    # URScript，本地（示教器）模式下该命令会被控制器按设计静默丢弃。
    flag = "True" if value else "False"
    if which == "config":
        n = _bounded_int(p["n"], "n", 8, 15, "config 端口号")
        # URBasic 内部按 0-7 给 8 路 configurable 输出编号，而本工具沿用 UR 的
        # 全局 I/O 编号 8-15；不做换算时掩码会算出 2**8=256 而溢出 UINT8。
        script = "set_configurable_digital_out(%d, %s)\n" % (n - 8, flag)
    elif which == "tool":
        n = _bounded_int(p["n"], "n", 0, 1, "tool 端口号")
        # Tool digital outputs are not on RTDE; set_tool_digital_out sends the
        # URScript `write_tool_digital_out` command over the RealTime client.
        robot.set_tool_digital_out(n, value)
        return ok({"message": "已设置数字输出 %s.%d = %s" % (which, n, value),
                   "data": {"which": which, "port": n, "value": value, "ip": ip}})
    else:
        n = _bounded_int(p["n"], "n", 0, 7, "std 端口号")
        script = "set_standard_digital_out(%d, %s)\n" % (n, flag)
    if not _realtime_send(robot, script):
        return err("数字输出脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置数字输出 %s.%d = %s" % (which, n, value),
               "data": {"which": which, "port": n, "value": value, "ip": ip}})


def op_get_analog_in(p):
    ip = str(p["ip"])
    n = _bounded_int(p["n"], "n", 0, 1, "模拟输入端口号")
    robot, _ = ensure_connected(ip)
    val = robot.get_standard_analog_in(n)
    return ok({"message": "%s" % val, "data": {"port": n, "value": val, "ip": ip}})


# 模拟输出端口的"域"：电压域满量程 10 V，电流域满量程 20 mA。
# URScript 的 `set_analog_out(n, f)` 收的是**相对电平 f∈[0,1]**（f=1.0 对应 10V / 20mA，
# 取决于该端口的域设置）。而 RTDE 回读的 `standard_analog_outputN` 是工程值。
ANALOG_ASSUMED_FULL_SCALE = 10.0


def op_set_analog_out(p):
    """设置标准模拟输出。

    ⚠️ 上游语义陷阱：URScript 的 `set_analog_out(n, f)` 的参数 f 是**相对电平 [0,1]**，
    不是伏特/毫安。旧实现把调用方给的数字**原样**发过去，于是 `value=5` 被当成 f=5 ⇒
    端口输出满量程（约 10 V），而工具说明写的是"0-10 或 0-20"。同时它连范围都不校验。
    现在接受**工程单位**（默认伏特，`full_scale` 可指定 20 表示电流域），换算成 [0,1] 后发送，
    并把换算前后的值都回报出来，方便核对。
    """
    ip = str(p["ip"])
    n = _bounded_int(p["n"], "n", 0, 1, "模拟输出端口号")
    full_scale = _bounded_float(p.get("full_scale", 10.0), "full_scale", 0.001, 1000.0,
                                "模拟输出满量程（电压域 10，电流域 20）")
    value = float(p["value"])
    if not math.isfinite(value):
        raise WorkerError("BADARG", "模拟输出值必须是有穷数值，收到 %s" % value)
    if value < 0 or value > full_scale:
        raise WorkerError("BADARG", "模拟输出值必须在 [0, %s]（%s）范围内，收到 %s"
                          % (full_scale, "工程单位", value))
    fraction = value / full_scale
    robot, _ = ensure_connected(ip)
    # URBasic 的 set_standard_analog_out 是 NotImplementedError 桩，所以直接发 URScript。
    if not _realtime_send(robot, 'set_analog_out(%d, %.6f)\n' % (n, fraction)):
        return err("模拟输出脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    read_back = None
    try:
        read_back = float(ROBOT_MODELS[ip].StandardAnalogOutput(n))
    except Exception:
        pass
    # ⚠️ 回读的是该通道的**电压**量。若通道被配置成电流域（0-20 mA），这个读数与你设定的电流
    # 根本不是同一个量（真机实测：设 5 V、通道为电流域时回读只有 0.012 V）——所以把类型字一起给出。
    io_types = _rtde_field(ROBOT_MODELS.get(ip), "analog_io_types")
    try:
        io_types = None if io_types is None else int(io_types)
    except Exception:
        io_types = None
    return ok({"message": "已设置模拟输出 %d = %s（相对电平 %.4f；回读 %s%s）"
                          % (n, value, fraction,
                             read_back if read_back is not None else "不可用",
                             "；注意：回读的是电压量，若该通道是电流域则与设定值不是同一个量"
                             if read_back is not None and abs(read_back - value) > 0.05 else ""),
               "data": {"port": n, "value": value, "full_scale": full_scale,
                        "fraction": fraction, "read_back": read_back,
                        "analog_io_types": io_types, "ip": ip}})


def op_set_tool_voltage(p):
    """设置工具法兰供电电压（0 / 12 / 24 V）。

    ⚠️ 上游 `UrScript.set_tool_voltage()` 是 `NotImplementedError` 桩（urScript.py），
    所以旧实现在**每一次调用**上都必然抛异常并回报 ok:false —— 这个工具从来没有成功过。
    这里按同样的模式直接发 URScript。
    """
    ip = str(p["ip"])
    voltage = int(p["voltage"])
    if voltage not in (0, 12, 24):
        raise WorkerError("BADARG", "工具电压只能是 0 / 12 / 24，收到 %s" % voltage)
    robot, _ = ensure_connected(ip)
    if not _realtime_send(robot, "set_tool_voltage(%d)\n" % voltage):
        return err("工具电压脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置工具电压为 %sV" % voltage,
               "data": {"voltage": voltage, "ip": ip}})


def op_set_tcp(p):
    ip = str(p["ip"])
    pose = _vec(p, "pose", 6, "set_tcp 的 pose")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "set_tcp")
    if not _send_program(robot, "set_tcp(p[%.6f,%.6f,%.6f,%.6f,%.6f,%.6f])\n" % tuple(pose)):
        return err("set_tcp 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置 TCP：%s" % pose,
               "data": {"tcp": [float(x) for x in pose], "ip": ip}})


def op_set_payload(p):
    ip = str(p["ip"])
    mass = float(p["mass"])
    if not math.isfinite(mass) or mass < 0:
        raise WorkerError("BADARG", "负载质量必须是非负有穷数值，收到 %s" % mass)
    cog = _vec(p, "cog", 3, "set_payload 的 cog") if p.get("cog") is not None else [0.0, 0.0, 0.0]
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "set_payload")
    # URBasic 的 `set_payload(m, CoG)` 是 NotImplementedError 桩，发两条已实现的 URScript。
    cog_str = "p[%.4f,%.4f,%.4f]" % tuple(cog)
    script = "set_payload_mass(%.4f)\nset_payload_cog(%s)\n" % (mass, cog_str)
    if not _realtime_send(robot, script):
        return err("负载设置脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置负载：%skg，重心 %s" % (mass, cog),
               "data": {"mass": mass, "cog": [float(x) for x in cog], "ip": ip}})


def op_movep(p):
    ip = str(p["ip"])
    pose = _vec(p, "pose", 6, "movep 的 pose")
    a = _nonneg_float(p.get("a", 1.2), "a", "movep 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "movep 的速度", allow_zero=False)
    r = _nonneg_float(p.get("r", 0), "r", "movep 的交融半径")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "movep")
    if not _send_program(robot, "movep(p[%.6f,%.6f,%.6f,%.6f,%.6f,%.6f], a=%s, v=%s, r=%s)"
                                % (pose[0], pose[1], pose[2], pose[3], pose[4], pose[5], a, v, r)):
        return err("movep 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    cmd = "movep(p%s, a=%s, v=%s, r=%s)" % (pose, a, v, r)
    ok_flag, msg = _movel_confirm(ip, pose, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "ip": ip}
    if not ok_flag:
        return _motion_failure("movep", msg, data)
    return ok({"message": "命令 %s 已发送，%s" % (cmd, msg),
               "data": data})


def op_movec(p):
    """圆弧运动：从当前位置，经 `pose_via` 到 `pose_to`。

    ⚠️ **不能调用 URBasic 的 `UrScript.movec()`**：它内部把 `movetype` 写死成 `'p'`
    （urScript.py 里 `self._move(movetype='p', pose=pose_to, ..., pose_via=pose_via)`），
    而 `_move` 的 `if movetype == 'c'` 分支在 `'p'` 下永远不成立 —— 结果是
    **`pose_via` 被完全丢弃、实际发出去的是 `movep`（直线交融运动）**；即使把 movetype
    改成 `'c'`，那个分支拼出来的是未替换的模板字面量 `movec({prefix_via}{pose_via_x}, ...)`，
    同样是废的。所以这里与 `op_draw_circle` 一样**自己拼原始 URScript** 再发送。
    """
    ip = str(p["ip"])
    via = _vec(p, "pose_via", 6, "movec 的 pose_via")
    to = _vec(p, "pose_to", 6, "movec 的 pose_to")
    a = _nonneg_float(p.get("a", 1.2), "a", "movec 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "movec 的速度", allow_zero=False)
    r = _nonneg_float(p.get("r", 0), "r", "movec 的交融半径")
    # 手册新增参数（Poly5 15.28 / PolyScope X 15.27）：`mode=0` 沿途插补姿态，
    # `mode=1` 姿态相对圆弧切线保持不变（即"固定姿态"圆弧）。旧实现根本没发这个参数，
    # 于是想走固定姿态圆弧只能绕开这个工具。
    mode = _bounded_int(p.get("mode", 0), "mode", 0, 1, "movec 的 mode（0 插补姿态 / 1 固定姿态）")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "movec")
    cmd = ("movec(p[%.4f,%.4f,%.4f,%.4f,%.4f,%.4f], p[%.4f,%.4f,%.4f,%.4f,%.4f,%.4f], "
           "a=%s, v=%s, r=%s, mode=%d)") % (
        via[0], via[1], via[2], via[3], via[4], via[5],
        to[0], to[1], to[2], to[3], to[4], to[5], a, v, r, mode)
    if not _send_program(robot, cmd):
        return err("movec 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    ok_flag, msg = _movel_confirm(ip, to, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "ip": ip}
    if not ok_flag:
        return _motion_failure("movec", msg, data)
    return ok({"message": "命令 %s 已发送，%s" % (cmd, msg),
               "data": data})


# ---------------------------------------------------------------------------
# 多段连续运动（run_sequence）：一份解析、两条路径
# ---------------------------------------------------------------------------
#
# 段的两种类型：**只有这两种，不做别名**（"movej"/"movel"/"j"/"c" 之类一律拒绝）。
# 批量输入的宽容会让调用方以为自己在说一件事、实际执行的是另一件。
SEQUENCE_TYPES = ("joint", "cartesian")


def _six_numbers(raw, what):
    """把一段的 q/pose 收敛成 6 个有穷浮点，否则抛 `ValueError`（⇒ BADARG）。

    为什么不直接用 `_vec`：那个助手形如 `_vec(p, "key", …)`，而跨语言门禁
    （`scripts/check-tool-params.py`）会把那个字符串实参当成本 op 声明的**顶层参数名** ——
    于是段内的 `q`/`pose` 会被判成"Python 读了但 schema 没声明"。它们不是顶层参数。
    """
    if not isinstance(raw, (list, tuple)) or len(raw) != 6:
        raise ValueError("%s 必须是 6 维数组，收到 %r" % (what, raw))
    out = []
    for value in raw:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("%s 含非数值元素：%r" % (what, value))
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("%s 含非有限数值（NaN/Infinity），已拒绝" % what)
        out.append(number)
    return out


def _sequence_segments(p):
    """解析 `run_sequence` 的段列表（真机与仿真**共用同一份解析与校验**）。

    形态：`[{"type":"joint","q":[q0..q5]}, {"type":"cartesian","pose":[x,y,z,rx,ry,rz]}, …]`。
    非法输入一律当场拒绝（`ValueError` ⇒ BADARG）：**绝不"尽力而为"地跳过某一段** —— 一条
    序列的意义就是每一段都走到，静默丢段等于把"A→B→C"执行成"A→C"。
    """
    raw = p.get("segments")
    if not isinstance(raw, (list, tuple)) or len(raw) == 0:
        raise ValueError("run_sequence 的 segments 必须是非空数组（至少一段），收到 %r" % (raw,))
    out = []
    for index, item in enumerate(raw, start=1):
        if not isinstance(item, dict):
            raise ValueError("segments 第 %d 段必须是对象（{type:'joint', q:[…]} 或 "
                             "{type:'cartesian', pose:[…]}），收到 %r" % (index, item))
        kind = str(item.get("type", "")).strip().lower()
        if kind not in SEQUENCE_TYPES:
            raise ValueError("segments 第 %d 段的 type 必须是 %s，收到 %r"
                             % (index, " 或 ".join("'%s'" % t for t in SEQUENCE_TYPES),
                                item.get("type")))
        key = "q" if kind == "joint" else "pose"
        out.append({"type": kind,
                    key: _six_numbers(item.get(key), "segments 第 %d 段的 %s" % (index, key))})
    return out


def _ignored_t_note(t):
    """真机路径**没有**"整段时长"这个参数（URScript 的 `t` 是每条 move* 各一个）。

    给了就必须在回包里说清楚它被忽略了 ——"看起来接受了"比"明确拒绝"更危险。
    """
    if not (isinstance(t, (int, float)) and t > 0):
        return ""
    return ("\n⚠️ 整段时长 t=%s 在真机路径上不建模（URScript 的 t 是每条 move* 各一个），已被忽略；"
            "仿真路径会用它缩放整条轨迹。" % t)


def op_run_sequence(p):
    """多段连续运动（**真机实现**）：一段一条 `movej`/`movel`，按顺序发进同一条脚本。

    ⚠️ 真机路径与仿真路径**不等价**，这一点必须写出来、而不是让它看起来一样：
      · 仿真把整条折线排成**一条**时间剖面（段间零停顿，见 `ur_sim.VirtualRobot.run_sequence`）；
      · 这里发出去的是一串 movej/movel —— 控制器在每个途经点按交融半径 `r` 过渡，`r=0`
        （默认）时**逐段起停**。这是 URScript 能表达的极限。
      · **整段时长 `t` 在真机路径上不建模**：给了也只会在回包里被明说为"已忽略"。

    起始哨兵与到位确认与 `op_draw_circle` 同一套：脚本是否真的被控制器执行必须当场区分出来
    （非远程控制模式下 URScript 会被静默丢弃，那时旧写法只会干等满预算）。
    """
    ip = str(p["ip"])
    segments = _sequence_segments(p)
    # 默认值与 movel 的手册默认一致（1.2 / 0.25），**关节段也用同一对**：一个工具只有一组 a/v，
    # 让 joint 段偷偷改用 movej 的 1.4/1.05 会让"不传 a/v"变成一个说不清的行为。
    a = _nonneg_float(p.get("a", 1.2), "a", "run_sequence 的加速度", allow_zero=False)
    v = _nonneg_float(p.get("v", 0.25), "v", "run_sequence 的速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "run_sequence 的时长")
    r = _nonneg_float(p.get("r", 0), "r", "run_sequence 的交融半径")
    robot, _ = ensure_connected(ip)
    lines = []
    for segment in segments:
        if segment["type"] == "joint":
            lines.append("movej([%s], a=%s, v=%s, r=%s)"
                         % (",".join("%.6f" % x for x in segment["q"]), a, v, r))
        else:
            lines.append("movel(p[%s], a=%s, v=%s, r=%s)"
                         % (",".join("%.6f" % x for x in segment["pose"]), a, v, r))
    cmd = "\n".join(lines)
    _assert_remote_control(ip, "run_sequence")
    # 哨兵寄存器不可选：它不是这个工具的参数（参数表里没有它，多给一个也没意义），
    # 所以固定用默认那一个 —— 与 `ursim_draw_circle` 的可配置 register 不同。
    index = DEFAULT_SENTINEL_REGISTER
    model = ROBOT_MODELS.get(ip)
    token = _sentinel_token(_read_int_register(model, index))
    script = "write_output_integer_register(%d, %d)\n%s\n" % (index, token, cmd)
    if not _send_program(robot, script):
        return err("run_sequence 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    deadline = time.time() + SCRIPT_START_CHECK_TIMEOUT_S
    while time.time() < deadline:
        if _read_int_register(model, index) == token:
            break
        time.sleep(0.1)
    else:
        return err("控制器**没有执行** run_sequence 脚本：%.1fs 内没看到起始哨兵（寄存器 %d）。"
                   "机器人不会移动。可能原因：该固件不接受这段指令组合（movej/movel），"
                   "或控制器未处于远程控制模式。"
                   % (SCRIPT_START_CHECK_TIMEOUT_S, index), "NOT_EXECUTED",
                   {"command": cmd, "register": index, "token": token, "ip": ip})

    ok_flag, confirm = _wait_robot_idle(ip, _budget_ms(p))
    data = {"ok": ok_flag, "command": cmd, "register": index, "ip": ip,
            "segment_count": len(segments), "t_ignored": t > 0}
    if not ok_flag:
        return _motion_failure("run_sequence", confirm, data)
    return ok({"message": "连续 %d 段已发送（控制器已开始执行），%s：%s%s"
                          % (len(segments), confirm, cmd, _ignored_t_note(t)),
               "data": data})


def op_servoj(p):
    ip = str(p["ip"])
    q = _vec(p, "q", 6, "servoj 的 q")
    # 手册的 t 默认值随版本变化：3.15.4 写的是 t=0.008，Poly5 15.44 / PolyScope X 15.43 改成
    # t=0.002（"preferred to call this function with a new setpoint in each timestep"）。
    # 这里保留 0.008 作为默认值以兼容 CB3，但把范围放宽到 0.002 —— 调用方显式给 0.002 时
    # 不会因为"低于旧下限"被拒。
    t = _bounded_float(p.get("t", 0.008), "t", 0.002, 1.0, "servoj 的控制时长")
    # lookahead_time 的下限同样随版本变化：3.15.4 是 0.03，Poly5/PolyScope X 是 0.01。
    look = _bounded_float(p.get("lookahead_time", 0.1), "lookahead_time",
                         0.01, 0.2, "servoj 的前瞻时间")
    gain = int(_bounded_float(p.get("gain", 100), "gain", 100, 2000, "servoj 的比例增益"))
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "servoj")
    if not _send_program(robot, "servoj([%s], t=%s, lookahead_time=%s, gain=%s)"
                                % (",".join("%.6f" % x for x in q), t, look, gain)):
        return err("servoj 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "servoj 已下发（连续流单步）：%s" % q,
               "data": {"q": q, "t": t, "lookahead_time": look, "gain": gain, "ip": ip}})


# ---------------------------------------------------------------------------
# 力控 / 速度控制 / 目标值 / 稳态等待（手册交叉核对后新增）
# ---------------------------------------------------------------------------
#
# 这一组全部直接拼 URScript（理由与 movec/draw_* 一致：URBasic 里对应的包装要么是
# NotImplementedError 桩，要么会阻塞等待一段**永不结束**的程序）。参数名与语义逐条对照
# 仓库内的三本官方手册：
#   ScriptManual/scriptManual_3.15.4.pdf          （URSoftware 3.x / CB3）
#   ScriptManual/script_directory_Poly5.pdf       （PolyScope 5 / e-Series）
#   ScriptManual/script_directory_PolyscopeX.pdf  （PolyScope X / 10.x）
# 三个版本的签名一致处才写成"通用"；版本差异见工具描述与 docs/urscript-manual-analysis.md。

# 手册给出的力控参数范围（Poly5 15.12 / 15.16 / 15.17；PolyScope X 15.11 / 15.14 / 15.15）。
FORCE_MODE_TYPES = (1, 2, 3)
FORCE_MODE_DAMPING_RANGE = (0.0, 1.0)
FORCE_MODE_GAIN_RANGE = (0.0, 2.0)


def _float_list(raw, n, what):
    """把 JSON 数组强转成 n 个有限浮点数（力控的 selection_vector/wrench/limits 用）。"""
    if raw is None:
        raise ValueError(what + " 缺失，需要传入 %d 维数组" % n)
    try:
        vals = [float(x) for x in raw]
    except (TypeError, ValueError):
        raise ValueError(what + " 必须是数值数组（如 [1,0,0,0,0,0]）")
    if len(vals) != n:
        raise ValueError(what + " 必须是 %d 维数组，收到 %d 维" % (n, len(vals)))
    for v in vals:
        if not math.isfinite(v):
            raise ValueError(what + " 含非有限数值（NaN/Infinity），已拒绝")
    return vals


def _ur_number(v):
    """URScript 里数值的字面量写法。

    整数必须写成 `2` 而不是 `2.0`（`force_mode` 的 type 只接受整数 1/2/3），
    其余用 `%g`：既保留足够精度，又不会把 `0.05` 写成 `0.050000` —— 这些脚本会被写进
    日志和工具返回值里供人核对，短一点的数字更容易看出"我传的到底是几"。
    """
    f = float(v)
    if f.is_integer() and abs(f) < 1e15:
        return "%d" % int(f)
    return "%g" % f


def _ur_list(vals):
    return "[%s]" % ",".join(_ur_number(v) for v in vals)


def op_force_mode(p):
    """进入力控（Force Mode）。

    Poly5 15.12 / PolyScope X 15.11：`force_mode(task_frame, selection_vector, wrench, type, limits)`

    ⚠️ 行为要点（手册原文的直译）：
      - selection_vector 里 1 = 该轴**柔性**（机器人会沿/绕该轴运动以达成 wrench），0 = 刚性；
      - limits 对柔性轴是**最大 TCP 速度**，对刚性轴是**允许的最大位置偏差**；
      - 手册明确建议进入力控前先 `sleep(0.02)`，并避免沿柔性轴的运动与高减速 ——
        这里采纳该建议，在脚本里先 sleep 再进力控；
      - type=1/3 会对力坐标系做变换（1：y 轴指向力坐标系原点；3：x 轴为 TCP 速度在
        力坐标系 xy 面的投影），type=2 不做变换。

    实现方式与 URBasic 的 `UrScript.force_mode()` 相同：把 `force_mode(...)` 放进一个
    永不退出的程序（`while True: force_mode(...) sync() end`），这样力控在控制器侧持续生效，
    而 worker 不会被阻塞。**退出**用 `ursim_end_force_mode`（它发一条新脚本抢占该程序，并调用
    `end_force_mode()`），或直接停止控制器上的程序。
    """
    ip = str(p["ip"])
    task_frame = _float_list(p.get("task_frame", [0, 0, 0, 0, 0, 0]), 6, "force_mode 的 task_frame")
    selection = _float_list(p.get("selection_vector", [0, 0, 1, 0, 0, 0]), 6,
                            "force_mode 的 selection_vector")
    wrench = _float_list(p.get("wrench", [0, 0, 0, 0, 0, 0]), 6, "force_mode 的 wrench")
    f_type = _bounded_int(p.get("type", 2), "type", 1, 3, "force_mode 的 type（1/2/3）")
    limits = _float_list(p.get("limits", [2, 2, 1.5, 1, 1, 1]), 6, "force_mode 的 limits")
    damping = None
    if p.get("damping") is not None:
        damping = _bounded_float(p["damping"], "damping",
                                 FORCE_MODE_DAMPING_RANGE[0], FORCE_MODE_DAMPING_RANGE[1],
                                 "force_mode 的 damping")
    gain = None
    if p.get("gain_scaling") is not None:
        gain = _bounded_float(p["gain_scaling"], "gain_scaling",
                              FORCE_MODE_GAIN_RANGE[0], FORCE_MODE_GAIN_RANGE[1],
                              "force_mode 的 gain_scaling")
    # selection_vector 只能是 0/1：别的值控制器会直接报错，提前拦住并说明。
    for i, s in enumerate(selection):
        if s not in (0.0, 1.0):
            raise ValueError("force_mode 的 selection_vector 只能由 0/1 组成，第 %d 个是 %s"
                             % (i, s))
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "force_mode")
    prelude = ""
    if damping is not None:
        # 手册 15.16 / 15.15：这两个值必须**在进入力控之前**设置才会生效。
        prelude += "force_mode_set_damping(%s)\n" % _ur_number(damping)
    if gain is not None:
        prelude += "force_mode_set_gain_scaling(%s)\n" % _ur_number(gain)
    call = "force_mode(p%s, %s, %s, %d, %s)" % (
        _ur_list(task_frame), _ur_list(selection), _ur_list(wrench), f_type, _ur_list(limits))
    # 永不退出的程序：力控需要持续被"重新声明"，程序一旦结束力控就退出（手册亦如此说明）。
    script = (prelude
              + "def ur_force_mode():\n"
                "  sleep(0.02)\n"
                "  while(True):\n"
                "    %s\n"
                "    sync()\n"
                "  end\n"
                "end\nur_force_mode()\n" % call)
    if not _send_program(robot, script):
        return err("force_mode 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "力控已进入：%s（退出请调用 ursim_end_force_mode，或在示教器停止程序）" % call,
               "data": {"command": call, "task_frame": task_frame,
                        "selection_vector": selection, "wrench": wrench, "type": f_type,
                        "limits": limits, "damping": damping, "gain_scaling": gain,
                        "ip": ip}})


def op_end_force_mode(p):
    """退出手动/力控模式（`end_force_mode()`）。

    手册 15.8 / PolyScope X 15.7。向 30003 发一段新脚本会抢占正在运行的力控程序，
    `end_force_mode()` 随之执行（与 `_set_control_mode` 的关闭路径同一机制）。
    """
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    if not _send_program(robot, "end_force_mode()\n"):
        return err("end_force_mode 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已退出力控（end_force_mode）", "data": {"ip": ip}})


def op_force_mode_settings(p):
    """读取/设置力控的 damping 与 gain_scaling。

    ⚠️ 这两个值**没有回读通道**：手册只定义了 `force_mode_set_*`（Poly5 15.16/15.17、
    PolyScope X 15.15/15.14），本插件因此只记住**本次会话通过本工具设置过的值**，
    并在返回值里把这一点写清楚 —— 不做"读回来的当前值"这种假装。
    """
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    applied = {}
    if p.get("damping") is not None:
        damping = _bounded_float(p["damping"], "damping",
                                 FORCE_MODE_DAMPING_RANGE[0], FORCE_MODE_DAMPING_RANGE[1],
                                 "力控 damping")
        if not _realtime_send(robot, "force_mode_set_damping(%s)\n" % _ur_number(damping)):
            return err("force_mode_set_damping 未能送达控制器：%s" % _last_send_failure(robot),
                       "SEND_FAILED")
        applied["damping"] = damping
    if p.get("gain_scaling") is not None:
        gain = _bounded_float(p["gain_scaling"], "gain_scaling",
                              FORCE_MODE_GAIN_RANGE[0], FORCE_MODE_GAIN_RANGE[1],
                              "力控 gain_scaling")
        if not _realtime_send(robot, "force_mode_set_gain_scaling(%s)\n" % _ur_number(gain)):
            return err("force_mode_set_gain_scaling 未能送达控制器：%s"
                       % _last_send_failure(robot), "SEND_FAILED")
        applied["gain_scaling"] = gain
    if not applied:
        raise ValueError("至少要给出 damping 或 gain_scaling 之一（这两个值无法回读）")
    return ok({"message": "已设置力控参数 %s（该值在控制器侧无法回读，这里只回报本次设置值）"
                          % applied,
               "data": {"applied": applied, "readback_supported": False, "ip": ip}})


def op_speedj(p):
    """关节速度控制 `speedj(qd, a, t)`（Poly5 15.48 / PolyScope X 15.47）。

    线性加速到恒定关节速度后**持续运动**。手册给出 t 是可选的：给了 t，函数在 t 秒后返回；
    没给，则在达到目标速度时返回 —— **此时机器人仍在以该速度运动**，直到 stopj 或新指令。
    因此这里把"没给 t"如实写进返回值（否则调用方会以为指令已经结束）。
    """
    ip = str(p["ip"])
    qd = _vec(p, "qd", 6, "speedj 的 qd")
    a = _nonneg_float(p.get("a", 0.5), "a", "speedj 的关节加速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "speedj 的时长")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "speedj")
    cmd = "speedj(%s, %s, %s)" % (_ur_list(qd), _ur_number(a), _ur_number(t))
    if not _send_program(robot, cmd + "\n"):
        return err("speedj 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    looped = "持续运动" if t == 0 else ("%.3fs 后返回，机械臂仍可以该速度运动" % t)
    return ok({"message": "speedj 已下发（%s；停止请调用 ursim_stopj）" % looped,
               "data": {"command": cmd, "qd": qd, "a": a, "t": t, "ip": ip}})


def op_speedl(p):
    """TCP 速度控制 `speedl(xd, a, t, aRot='a')`（Poly5 15.49 / PolyScope X 15.48）。

    ⚠️ **这是全插件最"放得开"的运动指令**：它绕过正常的位置轨迹规划，直接给 TCP 速度。
    手册要求 a > 0；aRot 省略时按 a 处理（`aRot='a'` 即此意）。
    """
    ip = str(p["ip"])
    xd = _vec(p, "xd", 6, "speedl 的 xd")
    a = _nonneg_float(p.get("a", 0.5), "a", "speedl 的加速度", allow_zero=False)
    t = _nonneg_float(p.get("t", 0), "t", "speedl 的时长")
    a_rot = None
    if p.get("a_rot") is not None:
        a_rot = _nonneg_float(p["a_rot"], "a_rot", "speedl 的旋转加速度", allow_zero=False)
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "speedl")
    args = "%s, %s, %s" % (_ur_list(xd), _ur_number(a), _ur_number(t))
    if a_rot is not None:
        args += ", aRot=%s" % _ur_number(a_rot)
    cmd = "speedl(%s)" % args
    if not _send_program(robot, cmd + "\n"):
        return err("speedl 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    looped = "持续运动" if t == 0 else ("%.3fs 后返回，TCP 仍可以该速度运动" % t)
    return ok({"message": "speedl 已下发（%s；停止请调用 ursim_stopl）" % looped,
               "data": {"command": cmd, "xd": xd, "a": a, "t": t, "a_rot": a_rot, "ip": ip}})


def op_stopj(p):
    """减速到关节速度为零 `stopj(a)`（Poly5 15.51 / PolyScope X 15.50）。"""
    ip = str(p["ip"])
    a = _nonneg_float(p.get("a", 2.0), "a", "stopj 的关节减速度", allow_zero=False)
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "stopj")
    cmd = "stopj(%s)" % _ur_number(a)
    if not _send_program(robot, cmd + "\n"):
        return err("stopj 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "stopj 已下发（关节减速，a=%s rad/s²）" % a,
               "data": {"command": cmd, "a": a, "ip": ip}})


def op_stopl(p):
    """减速到 TCP 速度为零 `stopl(a, aRot='a')`（Poly5 15.52 / PolyScope X 15.51）。"""
    ip = str(p["ip"])
    a = _nonneg_float(p.get("a", 0.5), "a", "stopl 的减速度", allow_zero=False)
    a_rot = None
    if p.get("a_rot") is not None:
        a_rot = _nonneg_float(p["a_rot"], "a_rot", "stopl 的旋转减速度", allow_zero=False)
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "stopl")
    args = _ur_number(a) + (", aRot=%s" % _ur_number(a_rot) if a_rot is not None else "")
    cmd = "stopl(%s)" % args
    if not _send_program(robot, cmd + "\n"):
        return err("stopl 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "stopl 已下发（TCP 减速，a=%s）" % a,
               "data": {"command": cmd, "a": a, "a_rot": a_rot, "ip": ip}})


def op_wait_steady(p):
    """等待机器人完全静止（对应手册的 `is_steady()`）。

    ⚠️ **没有调用 URScript 的 `is_steady()`**，理由是它没法可靠地用在本 worker 的形态里：
    `is_steady()` 是表达式，需要在控制器上跑一段程序把结果写进寄存器再读回；更关键的是
    手册（Poly5 16.39）明确写着"在非标准位置模式（力控、示教）下它**总是返回 false**"，
    而在标准位置模式里等它变 true，与直接观察 RTDE 的速度量是同一件事。
    这里改为轮询**已在 RTDE 数据流里**的 `actual_TCP_speed` 与 `actual_qd`：
    零额外往返、不受程序运行状态影响，且在力控/示教模式下同样能给出真实的静止判断。
    """
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    timeout_s = _bounded_float(p.get("timeout_s", 10.0), "timeout_s", 0.1, 300.0,
                               "等待静止的超时（秒）")
    lin_tol = _bounded_float(p.get("linear_tolerance", 0.005), "linear_tolerance", 1e-4, 1.0,
                             "TCP 线速度静止阈值（m/s）")
    ang_tol = _bounded_float(p.get("angular_tolerance", 0.01), "angular_tolerance", 1e-4, 10.0,
                             "TCP 角速度静止阈值（rad/s）")
    deadline = time.time() + timeout_s
    last = None
    while True:
        try:
            tcp_speed = [float(x) for x in model.ActualTCPSpeed()]
            qd = [float(x) for x in model.ActualQD()]
        except Exception as exc:                                      # noqa: BLE001
            return err("读取速度量失败，无法判断是否静止：%s" % exc, "NOT_CONNECTED")
        lin = math.sqrt(sum(x * x for x in tcp_speed[:3]))
        ang = math.sqrt(sum(x * x for x in tcp_speed[3:6]))
        joint = max(abs(x) for x in qd)
        last = {"tcp_linear_speed": round(lin, 6), "tcp_angular_speed": round(ang, 6),
                "max_joint_speed": round(joint, 6)}
        steady = lin <= lin_tol and ang <= ang_tol
        if steady:
            return ok({"message": "机器人已静止（TCP 线速度 %.4f m/s ≤ %.4f，角速度 %.4f rad/s ≤ %.4f）"
                                  % (lin, lin_tol, ang, ang_tol),
                       "data": dict(last, steady=True, waited_tolerance=True, ip=ip)})
        if time.time() >= deadline:
            return ok({"message": "等待静止超时（%.1fs）：TCP 线速度 %.4f m/s、角速度 %.4f rad/s，"
                                  "**未达到静止判据**" % (timeout_s, lin, ang),
                       "data": dict(last, steady=False, timeout_s=timeout_s, ip=ip)})
        time.sleep(0.05)


def _vec_or_none(model, getter, n):
    try:
        vals = [float(x) for x in getter()]
    except Exception:
        return None
    return vals if len(vals) == n else None


def op_get_target_values(p):
    """读取"控制器打算去哪"：目标关节角/速度/加速度 与 目标 TCP 位姿/速度。

    数据来自 RTDE 的 `target_*` 字段（本插件已把它们加入接收配方，见
    URBasic/rtdeConfiguration.xml）—— 零额外往返。与 `actual_*`（实际值）的差值是唯一能
    直接看出"指令已下发但还没执行 / 被交融 / 被安全限速拉住"的观测量；手册里对应的
    URScript 函数是 `get_target_joint_positions/speeds`、`get_target_tcp_speed`（Poly5 16.24 /
    16.25 / 16.30）等。
    """
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    data = {
        "target_q": _vec_or_none(model, model.TargetQ, 6),
        "target_qd": _vec_or_none(model, model.TargetQD, 6),
        "target_qdd": _vec_or_none(model, model.TargetQDD, 6),
        "target_tcp_pose": _vec_or_none(model, model.TargetTCPPose, 6),
        "target_tcp_speed": _vec_or_none(model, model.TargetTCPSpeed, 6),
        "actual_q": _vec_or_none(model, model.ActualQ, 6),
        "actual_tcp_pose": _vec_or_none(model, model.ActualTCPPose, 6),
        "ip": ip,
    }
    if data["target_tcp_pose"] is None and data["target_q"] is None:
        return err("RTDE 的 target_* 字段尚不可用（数据流可能刚建立或配方被替换）",
                   "TIMEOUT", {"ip": ip})
    return ok({"message": "目标值读取成功（target_* 来自 RTDE 数据流）", "data": data})


def op_tool_communication(p):
    """开关工具端 RS-485/TCP 通信（Tool Communication Interface）。

    手册：`set_tool_communication(enabled, baud_rate, parity, stop_bits, rx_idle_chars, tx_idle_chars)`
    （Poly5 18.50 / PolyScope X 18.50）。**手册明确警告：启用 TCI 会禁用工具模拟输入。**
    """
    ip = str(p["ip"])
    enabled = bool(p.get("enabled", True))
    baud = _bounded_int(p.get("baud_rate", 115200), "baud_rate", 9600, 5000000, "波特率")
    if baud not in (9600, 19200, 38400, 57600, 115200, 1000000, 2000000, 5000000):
        raise ValueError("波特率只能是手册列出的 9600/19200/38400/57600/115200/1000000/"
                         "2000000/5000000，收到 %d" % baud)
    parity = _bounded_int(p.get("parity", 2), "parity", 0, 2, "校验位（0 无 / 1 奇 / 2 偶）")
    stop_bits = _bounded_int(p.get("stop_bits", 1), "stop_bits", 1, 2, "停止位（1 或 2）")
    rx_idle = _bounded_float(p.get("rx_idle_chars", 1.0), "rx_idle_chars", 1.0, 40.0,
                             "RX idle chars")
    tx_idle = _bounded_float(p.get("tx_idle_chars", 3.5), "tx_idle_chars", 0.0, 40.0,
                             "TX idle chars")
    robot, _ = ensure_connected(ip)
    cmd = "set_tool_communication(%s, %d, %d, %d, %s, %s)" % (
        "True" if enabled else "False", baud, parity, stop_bits,
        _ur_number(rx_idle), _ur_number(tx_idle))
    if not _realtime_send(robot, cmd + "\n"):
        return err("set_tool_communication 脚本未能送达控制器：%s"
                   % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已%s工具通信接口（%s）%s"
                          % ("启用" if enabled else "禁用", cmd,
                             "；⚠️ 工具模拟输入已被禁用" if enabled else ""),
               "data": {"enabled": enabled, "baud_rate": baud, "parity": parity,
                        "stop_bits": stop_bits, "rx_idle_chars": rx_idle,
                        "tx_idle_chars": tx_idle, "command": cmd, "ip": ip}})


def op_set_tool_output_mode(p):
    """工具输出模式：1 = power（双针供电模式）/ 0 = 普通数字输出。

    手册 Poly5 18.52 / PolyScope X 18.52：mode 1 表示数字输出针被用作**附加电源**。
    """
    ip = str(p["ip"])
    # ⚠️ 这里**不能有默认值**：mode 会改变工具法兰针脚的电平语义（1 = 双针被用作附加电源），
    # 静默默认成 power 可能损坏接在上面的工具。schema 标了 required，实现就必须同样拒绝缺省 ——
    # 这条一致性正是 `check-tool-params.py` 补上的（它过去只比参数名，不看必填与类型）。
    if p.get("mode") is None:
        raise WorkerError("BADARG", "必须显式指定 mode（0 = 普通数字输出 / 1 = power 双针供电）"
                                    "—— 它改变工具法兰针脚的电平语义，不能有默认值")
    mode = _bounded_int(p["mode"], "mode", 0, 1, "工具输出模式（0 普通 / 1 power）")
    robot, _ = ensure_connected(ip)
    cmd = "set_tool_output_mode(%d)" % mode
    if not _realtime_send(robot, cmd + "\n"):
        return err("set_tool_output_mode 脚本未能送达控制器：%s"
                   % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置工具输出模式为 %d%s" % (mode, "（power/双针供电）" if mode == 1 else ""),
               "data": {"mode": mode, "command": cmd, "ip": ip}})


def op_set_payload_inertia(p):
    """设置负载的**质量 + 重心 + 惯性矩阵**（PolyScope X 16.52 `set_target_payload`）。

    手册要点：
      - 惯性矩阵对角线（Ixx, Iyy, Izz）不得为负，每个元素上限 ±133 kg·m²；
      - `set_payload(m, cog)` 会**重置**惯性矩阵（手册把它标为 deprecated，因为会出现
        "质量/重心/惯量不一致"的组合），所以要设惯量就用这个工具一次设全；
      - 设置负载会**自动把力/力矩测量归零**（等效于 zero_ftsensor）；
      - transition_time > 0 可以让负载切换时机器人不"跳"一下（抓/放重物时有用）。

    CB3（URSoftware 3.x）上控制器**没有**这个函数 —— 手册 3.15.4 只有 `set_payload(m, cog)`。
    因此本工具在旧固件上会退回只设置质量与重心，并在返回值里说明。
    """
    ip = str(p["ip"])
    mass = _nonneg_float(p.get("mass"), "mass", "负载质量（kg）", allow_zero=True)
    cog = _vec(p, "cog", 3, "负载重心 cog")
    inertia = None
    if p.get("inertia") is not None:
        inertia = _float_list(p["inertia"], 9, "负载惯性矩阵 inertia（行主序 3×3，kg·m²）")
        for i, name in ((0, "Ixx"), (4, "Iyy"), (8, "Izz")):
            if inertia[i] < 0:
                raise ValueError("惯性矩阵对角线不得为负：%s = %s" % (name, inertia[i]))
        for i, v in enumerate(inertia):
            if abs(v) > 133.0:
                raise ValueError("惯性矩阵元素上限为 ±133 kg·m²，第 %d 个是 %s" % (i, v))
    transition = _bounded_float(p.get("transition_time", 0.0), "transition_time", 0.0, 60.0,
                                "负载切换过渡时间（秒）")
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "set_payload")
    if inertia is None:
        # 与既有 op_set_payload 相同的两条 URScript，三个手册版本都有。**刻意不用**
        # `set_payload(m, cog)`：手册明确说它会**重置惯性矩阵**（5.10.0 起被标为 deprecated），
        # 于是"只想改质量"会顺手把惯量清零，质量/重心/惯量三者不再自洽。
        # 分成 set_payload_mass + set_payload_cog 两条就不会动惯量矩阵。
        script = ("set_payload_mass(%s)\nset_payload_cog(%s)\n"
                  % (_ur_number(mass), _ur_list(cog)))
        note = "只设置了质量与重心（未给 inertia）：用 set_payload_mass + set_payload_cog，不会重置惯性矩阵"
    else:
        m = ",".join(_ur_list(inertia[i * 3:i * 3 + 3]) for i in range(3))
        script = "set_target_payload(%s, %s, [%s], %s)\n" % (
            _ur_number(mass), _ur_list(cog), m, _ur_number(transition))
        note = "已同时设置质量、重心与惯性矩阵"
    if not _send_program(robot, script):
        return err("负载设置脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "%s（⚠️ 设置负载会同时把力/力矩测量归零）" % note,
               "data": {"mass": mass, "cog": cog, "inertia": inertia,
                        "transition_time": transition, "command": script.strip(), "ip": ip}})


def op_move_optimized(p):
    """OptiMove 平滑运动：`optimovej(goal, a=0.3, v=0.3, r=0)` / `optimovel(...)`。

    手册：Poly5 15.32/15.33、PolyScope X 15.31/15.32。与 movej/movel 的区别是
    **jerk 受限**的速度剖面，运动更平滑、振动更小；`a`/`v` 不是 rad/s 或 m/s，而是
    "机器人能力的一个比例"，取值范围 (0, 1]，1 表示该构型下能达到的最快。

    `goal` 在手册里可写四种形态（关节、基座位姿、`struct{pose,frame}`、世界模型对象名）。
    本工具支持前两种 —— 后两种需要 PolyScope 侧的坐标系/世界模型对象，脚本里写错只会得到
    控制器的一句运行期错误，因此**在这里明确拒绝**并说明原因，而不是把含糊的脚本发出去。

    ⚠️ 手册说明 OptiMove **不受 Motion Version 设置影响**，且只能与 movej/l、optimovej/l
    互相交融（从其它运动类型切入时机器人应处于静止）。
    """
    ip = str(p["ip"])
    kind = str(p.get("goal_type", "")).lower()
    a = _bounded_float(p.get("a", 0.3), "a", 0.0001, 1.0, "optimove 的加速度比例")
    v = _bounded_float(p.get("v", 0.3), "v", 0.0001, 1.0, "optimove 的速度比例")
    r = _nonneg_float(p.get("r", 0), "r", "optimove 的交融半径")
    frame = p.get("frame")
    if frame is not None:
        raise ValueError("optimove 的 frame（坐标系名/世界模型对象）需要 PolyScope 侧的对象，"
                         "本插件不支持：请不要传 frame，或改用 movej/movel 自行换算到基座系")
    if kind in ("j", "joint", "joints", "optimovej"):
        q = _vec(p, "goal", 6, "optimovej 的 goal（六关节角）")
        call = "optimovej(%s, a=%s, v=%s, r=%s)" % (_ur_list(q), _ur_number(a),
                                                    _ur_number(v), _ur_number(r))
        confirm = lambda: _movej_confirm(ip, q, _budget_ms(p))          # noqa: E731
        goal_desc = {"goal_type": "joints", "goal": q}
    elif kind in ("l", "pose", "linear", "optimovel"):
        pose = _vec(p, "goal", 6, "optimovel 的 goal（六维位姿）")
        call = "optimovel(p%s, a=%s, v=%s, r=%s)" % (_ur_list(pose), _ur_number(a),
                                                     _ur_number(v), _ur_number(r))
        confirm = lambda: _movel_confirm(ip, pose, _budget_ms(p))       # noqa: E731
        goal_desc = {"goal_type": "pose", "goal": pose}
    else:
        raise ValueError('optimove 的 goal_type 必须是 "joints"（optimovej）或 "pose"（optimovel），'
                         "收到 %r" % kind)
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "optimove")
    if not _send_program(robot, call + "\n"):
        return err("optimove 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    ok_flag, msg = confirm()
    data = {"ok": ok_flag, "command": call, "a": a, "v": v, "r": r, "ip": ip}
    data.update(goal_desc)
    if not ok_flag:
        return _motion_failure("optimove（%s）" % goal_desc["goal_type"], msg, data)
    return ok({"message": "命令 %s 已发送（a/v 是能力比例，不是物理单位），%s" % (call, msg),
               "data": data})


def op_motion_version(p):
    """读取/设置 Motion Version（Poly5 14.x、PolyScope X 14.x），以及 jerk 增益。

    - 版本 1：与旧版 PolyScope 相同的运动剖面；
    - 版本 2：规划时把速度/加速度**钳到硬件上限**，交融半径重叠时**动态收缩**而不是跳过该段
      （版本 1 在交融重叠时会跳过整段运动并给 "Overlapping Blends" 警告）。

    ⚠️ 手册明确：**新机型与 PolyScope X 只支持版本 2**，而 CB3（3.x）没有这个设置。

    `jerk_gain_scaling`（PolyScope X 15.23/15.24）只作用于**jerk 受限**的剖面 ——
    手册点名的正是 `movej[motion_version>=2]`、`movel[...>=2]`、`optimovej`、`optimovel`，
    也就是 `ursim_move_optimized` 与版本 2 的运动。范围 [0.01, 1.0]，默认 1.0；
    手册建议"需要更平滑的运动就调小"，并把它写在程序开头（值会保留到下次设置或重启）。
    """
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    version = p.get("version")
    jerk = None
    if p.get("jerk_gain_scaling") is not None:
        jerk = _bounded_float(p["jerk_gain_scaling"], "jerk_gain_scaling", 0.01, 1.0,
                              "jerk 增益（1.0 = 默认，越小越平滑）")
    if version is None and jerk is None:
        raise ValueError("至少要给出 version 或 jerk_gain_scaling 之一")
    applied = {}
    if version is not None:
        ver = _bounded_int(version, "version", 1, 2, "Motion Version")
        if not _realtime_send(robot, "motion_version_set(%d)\n" % ver):
            return err("motion_version_set 未能送达控制器：%s" % _last_send_failure(robot),
                       "SEND_FAILED")
        applied["version"] = ver
    if jerk is not None:
        if not _realtime_send(robot, "jerk_gain_scaling_set(%s)\n" % _ur_number(jerk)):
            return err("jerk_gain_scaling_set 未能送达控制器：%s"
                       % _last_send_failure(robot), "SEND_FAILED")
        applied["jerk_gain_scaling"] = jerk
    return ok({"message": "已设置 %s（这两个设置都没有回读通道，返回值只报告本次设置值）" % applied,
               "data": {"applied": applied, "readback_supported": False, "ip": ip}})


def op_get_freedrive_status(p):
    """读取 freedrive（手动拖动）当前姿态的**奇异点接近程度**（PolyScope X 15.20）。

    ⚠️ 这个函数的返回值**不是**"freedrive 开着还是关着"，而是当前姿态离奇异点多远：
    `0` = 正常、`1` = 接近奇异点、`2` = 太接近（拖动阻力明显变大）。
    手册原话：受限 freedrive（`freedrive_mode(freeAxes=...)`）在奇异点附近可用性下降，
    因此这个值用来**建议操作员换一条路径或改用不受限的 freedrive**。

    它需要控制器能执行 URScript 表达式并回读寄存器，因此会向输出寄存器写一个值
    （默认 21 号 int 寄存器，旧值会被覆盖）；读不到时如实报失败并说明可能原因。
    """
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    register = _bounded_int(p.get("register", 21), "register", 0, 23,
                            "回读用的 int 输出寄存器编号")

    # 两步走，才能区分「固件不支持」与「真的读到 0」：
    #   第一步：写一个与旧值不同的 token，确认 **该寄存器可被这段脚本改写**（通道通）；
    #   第二步：让 get_freedrive_status() 去覆盖它。若固件不认识该函数，整段脚本会编译失败，
    #           寄存器就停在 token 上 ⇒ 如实报「不支持/未执行」，而不是把陈旧的 0 说成"正常"。
    token = _sentinel_token(_read_int_register(ROBOT_MODELS.get(ip), register))
    setter = ("def ur_write_token():\n"
              "  write_output_integer_register(%d, %d)\n"
              "end\nur_write_token()\n" % (register, token))
    if not _send_program(robot, setter):
        return err("get_freedrive_status 通道探测脚本未能送达控制器：%s"
                   % _last_send_failure(robot), "SEND_FAILED")
    deadline = time.time() + 2.0
    while time.time() < deadline:
        if _read_int_register(ROBOT_MODELS.get(ip), register) == token:
            break
        time.sleep(0.1)
    else:
        return err("未能写入哨兵值（寄存器 output_int_register_%d 上一直看不到 %d）⇒ 控制器没有执行"
                   "这段脚本，可能是未处于远程控制模式" % (register, token), "NOT_EXECUTED",
                   {"register": register, "token": token, "ip": ip})

    program = ("def ur_get_freedrive_status():\n"
               "  write_output_integer_register(%d, get_freedrive_status())\n"
               "end\nur_get_freedrive_status()\n" % register)
    if not _send_program(robot, program):
        return err("get_freedrive_status 脚本未能送达控制器：%s"
                   % _last_send_failure(robot), "SEND_FAILED")
    deadline = time.time() + 2.0
    raw = token
    while time.time() < deadline:
        raw = _read_int_register(ROBOT_MODELS.get(ip), register)
        if raw is not None and raw != token:
            break
        time.sleep(0.1)
    if raw is None or raw == token:
        return err("该控制器**不支持** get_freedrive_status()：脚本没有执行，寄存器仍停在通道探测用的"
                   "哨兵值 %d（PolyScope 版本可能低于 5.24；这不是「读到 0 = 正常」）"
                   % token, "UNSUPPORTED",
                   {"register": register, "token": token, "observed": raw, "ip": ip})
    code = int(raw)
    names = {0: "正常（离奇异点足够远）", 1: "接近奇异点", 2: "太接近奇异点（拖动阻力明显）"}
    return ok({"message": "freedrive 姿态状态：%d —— %s%s"
                          % (code, names.get(code, "未知"), "" if code == 0 else "；建议换路径或改用不受限 freedrive"),
               "data": {"status": code, "status_name": names.get(code, "unknown"),
                        "supported": True, "register": register, "ip": ip}})


def op_get_tool_telemetry(p):
    """读取工具端电气遥测：工具电压/电流、I/O 电流、工具模式（全部来自 RTDE 数据流）。

    ⚠️ 这三个访问器在 vendored `robotModel.py` 里都是 `NotImplementedError` 桩，且它们的
    RTDE 字段以前**不在接收配方里** —— 两个原因叠加，旧实现必然返回全 null（看起来像
    "控制器没数据"，其实是插件根本没读）。现在字段已加进配方，这里直接读 `dataDir`。

    ⚠️ 单位：UR RTDE 文档把 `tool_output_voltage` 定义为 **INT32**（不是浮点伏特），
    所以这里原样回报，不擅自换算；需要物理量时请按控制器文档解释该整数。
    """
    ip = str(p["ip"])
    _, model = ensure_connected(ip)

    def num(name, accessor=None):
        """优先用访问器（某些控制器/测试替身实现了它），失败或为 None 时回落到原始 RTDE 字段。"""
        if accessor is not None:
            try:
                value = getattr(model, accessor)()
                if value is not None:
                    return float(value)
            except Exception:
                pass
        value = _rtde_field(model, name)
        if value is None:
            return None
        try:
            return float(value)
        except Exception:
            return None

    data = {
        "tool_output_voltage": num("tool_output_voltage", "ToolOutputVoltage"),
        "tool_output_current": num("tool_output_current", "ToolOutputCurrent"),
        "io_current": num("io_current", "IoCurrent"),
        "tool_mode": num("tool_mode"),
        "ip": ip,
    }
    missing = [name for name in ("tool_output_voltage", "tool_output_current", "io_current")
               if data[name] is None]
    message = "工具电气遥测读取成功（来自 RTDE 数据流）"
    if missing:
        message += ("；以下字段读不到：%s。若控制器固件未提供该 RTDE 字段，它会一直是 null —— "
                    "这表示「该控制器不支持」，而不是「读取出错」" % "、".join(missing))
    return ok({"message": message, "data": data})


def _bit_masks(model):
    di = model.dataDir.get("actual_digital_input_bits") if hasattr(model.dataDir, "get") else None
    do = model.dataDir.get("actual_digital_output_bits") if hasattr(model.dataDir, "get") else None

    def bits(mask):
        return {str(i): bool(mask & (1 << i)) for i in range(16)} if mask is not None else None

    return bits(di), bits(do)


def op_get_digital_input_bits(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    di, _ = _bit_masks(model)
    return ok({"message": "数字输入位（std 0-7 + config 8-15）：%s" % di,
               "data": {"bits": di, "ip": ip}})


def op_get_digital_output_bits(p):
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    _, do = _bit_masks(model)
    return ok({"message": "数字输出位（std 0-7 + config 8-15）：%s" % do,
               "data": {"bits": do, "ip": ip}})


def op_get_conveyor(p):
    """读取传送带编码器 tick —— **并且自证这段脚本真的被执行过**。

    为什么必须自证（事故复盘）：`get_conveyor_tick_count()` 是一段 URScript，它可能因为
    任何原因整段被控制器**在加载期拒收**（用了该固件不认识的函数名、不在远程控制模式…）。
    拒收时**一行都不会执行**，而且不会置"程序执行错误"标志 —— `waitRobotIdleOrStopFlag()`
    什么也看不到。旧实现于是照样回读 `output_double_register_0`，把**一个从没人写过的值**
    当成 tick 报出去。这个事故真的发生过：脚本里的函数名被"修正"成不存在的
    `write_output_double_register`（把 RTDE 字段名当成了 URScript 函数名），
    于是 `ursim_get_conveyor` 长期静默返回 0，且没有任何报错。

    结论的三种结局必须分开报：
      - 回读到**结束**哨兵 ⇒ 脚本跑完了，寄存器里的 tick 可信；
      - 只回读到**起始**哨兵 ⇒ 通道通、脚本开始了，但没走到末尾 ⇒ `get_conveyor_tick_count()`
        在该固件上很可能不可用/中途报错 ⇒ **不给** tick 值；
      - 两个都没回读到 ⇒ 整段脚本没被执行 ⇒ **不给** tick 值，并说明最可能的原因。

    哨兵用 **int** 寄存器、载荷用 **double** 寄存器：两个不同的寄存器家族，这样"载荷那条
    写路径坏了"不会连哨兵一起带走 —— 否则三种结局会退化成"什么都没发生"，又把原因藏起来。
    """
    ip = str(p["ip"])
    robot, model = ensure_connected(ip)
    index = _bounded_int(p.get("register", CONVEYOR_SENTINEL_REGISTER), "register", 0, 23,
                         "哨兵用的 int 输出寄存器编号")
    payload_index = _bounded_int(p.get("payload_register", CONVEYOR_PAYLOAD_REGISTER),
                                 "payload_register", 0, 23,
                                 "写 tick 用的 double 输出寄存器编号")

    # 第一步：通道探测。仅当这一步成功，后面"脚本没执行"才能归因到脚本本身。
    probe_token = _sentinel_token(_read_int_register(model, index))
    probe = ("def ur_write_conveyor_probe():\n"
             "  write_output_integer_register(%d, %d)\n"
             "end\nur_write_conveyor_probe()\n" % (index, probe_token))
    if not _send_program(robot, probe):
        return err("传送带通道探测脚本未能送达控制器：%s" % _last_send_failure(robot),
                   "SEND_FAILED", {"ip": ip})
    deadline = time.time() + SEND_SCRIPT_VERIFY_TIMEOUT_S
    while time.time() < deadline:
        if _read_int_register(model, index) == probe_token:
            break
        time.sleep(0.1)
    else:
        return err("控制器没有执行探测脚本（output_int_register_%d 上一直看不到哨兵值 %d）⇒ "
                   "它可能未处于远程控制模式，或整段 URScript 被静默丢弃。此时**无法**给出传送带 tick，"
                   "也不会回读一个陈旧值来冒充它。" % (index, probe_token),
                   "NOT_EXECUTED",
                   {"register": index, "token": probe_token, "ip": ip})

    # 第二步：载荷 + 首尾哨兵。`finish` 必须同时避开 probe 与 start —— 三个 token 互不相同
    # 是这套判定成立的前提（否则"没执行"会被读成"执行完毕"）。
    start_token = _sentinel_token(probe_token)
    finish_token = _sentinel_token(start_token, probe_token)
    payload = ("def ur_get_conveyor_tick_count():\n"
               "  write_output_integer_register(%d, %d)\n"
               "  write_output_float_register(%d, get_conveyor_tick_count())\n"
               "  write_output_integer_register(%d, %d)\n"
               "end\nur_get_conveyor_tick_count()\n"
               % (index, start_token, payload_index, index, finish_token))
    if not _send_program(robot, payload):
        return err("get_conveyor_tick_count 脚本未能送达控制器：%s" % _last_send_failure(robot),
                   "SEND_FAILED", {"ip": ip})

    deadline = time.time() + SEND_SCRIPT_VERIFY_TIMEOUT_S
    observed = probe_token
    started = False
    while time.time() < deadline:
        observed = _read_int_register(model, index)
        if observed == finish_token:
            # 走到末尾**必然**开始过。轮询间隔（0.1s）可能整个错过中间态，所以这里显式置位 ——
            # 否则会报出 "verified=true 但 started=false" 这种自相矛盾的证据组合。
            started = True
            break
        if observed == start_token:
            started = True
        time.sleep(0.1)

    sentinel = {"register": index, "payload_register": payload_index,
                "probe_token": probe_token, "start_token": start_token,
                "finish_token": finish_token, "observed": observed, "started": started}

    if observed != finish_token:
        if started:
            return err("传送带读取脚本**开始执行了但没走到末尾**（起始哨兵 %d 已回读，结束哨兵 %d 没出现）⇒ "
                       "`get_conveyor_tick_count()` 在该控制器上很可能不可用、或中途报错中止。"
                       "因此**不给** tick 值。" % (start_token, finish_token),
                       "UNSUPPORTED", dict(sentinel, ip=ip))
        return err("传送带读取脚本**根本没有执行**：哨兵仍停在通道探测值 %d（起始与结束哨兵都没出现）⇒ "
                   "整段脚本在控制器侧被拒（最常见原因：脚本里用了该固件不认识的函数，"
                   "例如把 RTDE 字段名 `output_double_register` 当成了 URScript 函数名）。"
                   "此时**不给** tick 值 —— 旧实现在这种情况下会把一个从没被写过的寄存器读成 tick。"
                   % probe_token,
                   "NOT_EXECUTED", dict(sentinel, ip=ip))

    tick = _read_double_register(model, payload_index)
    if tick is None:
        return err("脚本已执行完毕（结束哨兵已回读），但 output_double_register_%d 读不到值"
                   % payload_index, "READ_FAILED", dict(sentinel, ip=ip))
    return ok({"message": "传送带 tick：%s（脚本已在控制器上执行完毕，结束哨兵 %d 已回读）"
                          % (tick, finish_token),
               "data": {"tick_count": tick, "register": payload_index,
                        "sentinel": sentinel, "verified": True, "ip": ip}})


def op_set_conveyor_tick(p):
    ip = str(p["ip"])
    tick = int(p["tick_count"])
    res = int(p.get("absolute_encoder_resolution", 0))
    robot, _ = ensure_connected(ip)
    robot.set_conveyor_tick_count(tick, res)
    return ok({"message": "已设置传送带 tick=%s" % tick,
               "data": {"tick_count": tick, "ip": ip}})


# ---------------------------------------------------------------------------
# 控制模式 / 电源 / 安全（新增能力）
# ---------------------------------------------------------------------------
#
# 这一组全部通过原始 URScript 或 dashboard 命令实现，理由与既有实现一致：
# URBasic 里对应的包装要么是 NotImplementedError 桩，要么会额外做"等程序结束"的阻塞式等待，
# 而 freedrive / teach 这类程序**本来就设计成永不结束**，用包装函数会把单线程 worker 卡死。

def _set_control_mode(p, mode):
    """freedrive / teach 的开与关。mode ∈ {freedrive, teach}。"""
    ip = str(p["ip"])
    enabled = bool(p.get("enabled", True))
    robot, _ = ensure_connected(ip)
    if mode == "freedrive":
        start_cmd, end_cmd = "freedrive_mode()", "end_freedrive_mode()"
    else:
        start_cmd, end_cmd = "teach_mode()", "end_teach_mode()"
    if enabled:
        # 用「永不退出」的程序让被控模式在控制器侧持续生效（这正是 URBasic 的做法：
        # `while(True): freedrive_mode(); sleep(600) end`）。send 后不需要等它结束 ——
        # 它不会结束。
        script = "def ur_%s_on():\n  while(True):\n    %s\n    sleep(600)\n  end\nend\n" % (mode, start_cmd)
    else:
        # 关闭：向 30003 发一段新脚本会**抢占**正在运行的那个永续程序，而
        # `end_*_mode()` 这一句随之被执行。
        script = "%s\n" % end_cmd
    if not _send_program(robot, script):
        return err("%s 脚本未能送达控制器：%s" % (mode, _last_send_failure(robot)), "SEND_FAILED")
    return ok({"message": "%s 模式已%s（%s）" % (mode, "开启" if enabled else "关闭",
                                                "可在控制器停止运行程序前手动拖动机械臂，"
                                                "或在面板上停止程序来退出" if enabled
                                                else "已恢复正常位置控制"),
               "data": {"mode": mode, "enabled": enabled, "command": script.strip(), "ip": ip}})


def op_set_freedrive(p):
    """开关"自由驱动"（freedrive）：开启后可手动拖动机械臂。"""
    return _set_control_mode(p, "freedrive")


def op_set_teach_mode(p):
    """开关"示教模式"（teach）。"""
    return _set_control_mode(p, "teach")


def _dashboard_switch(p, cmd, description):
    """执行一条 dashboard 开关类命令并要求应答不表示失败。"""
    ip = str(p["ip"])
    ensure_connected(ip)
    sent, resp = _dashboard_cmd(ip, cmd)
    if not sent:
        return err("%s 失败（控制器无应答）：%s" % (description, resp), "TIMEOUT")
    if not _dashboard_ok(resp):
        return err("%s 被控制器拒绝：%s" % (description, resp))
    return ok({"message": "%s 已下发（控制器应答：%s）" % (description, resp),
               "data": {"respond": resp, "ip": ip}})


def op_power_on(p):
    """机器人上电（使能电机）。"""
    return _dashboard_switch(p, "ur_power_on", "机器人上电")


# 下电 / 关机类命令的验证预算：命令生效后控制器会停止应答 dashboard，所以只能等状态位。
POWER_OFF_VERIFY_TIMEOUT_S = 8.0


def op_power_off(p):
    """机器人下电。⚠️ 会让机械臂失去刚性支撑。

    为什么不能只看 dashboard 的应答：`power off` 生效的瞬间控制器就**停止应答**（它正在断电），
    旧实现把"无应答"当成失败 ⇒ 真机上明明已下电却报「失败（控制器无应答）」的**假阴性**。
    现在以控制器自己的状态为准：等 RTDE `robot_status_bits` 的 PowerOn 位清零；等到了就报成功
    （附证据），等不到才报失败，并把看到的状态位交出来供复核。
    """
    ip = str(p["ip"])
    ensure_connected(ip)
    sent, resp = _dashboard_cmd(ip, "ur_power_off")
    reached, bits = _wait_robot_power(ip, want_on=False, timeout=POWER_OFF_VERIFY_TIMEOUT_S)
    if reached:
        return ok({"message": "机器人已下电（RTDE 的 PowerOn 位已清零%s）"
                              % ("；dashboard 未应答 —— 这正是断电时的预期行为，不是失败"
                                 if not sent else "；dashboard 应答：%s" % resp),
                   "data": {"power_on": False, "robot_status_bits": bits,
                            "dashboard_sent": sent, "dashboard_respond": resp, "ip": ip}})
    if sent and _dashboard_ok(resp):
        return ok({"message": "下电命令已被控制器接受（应答：%s），但 %.0fs 内没看到 PowerOn 位清零；"
                              "请用 ur_status 复核（状态位更新有延迟时也会这样）"
                              % (resp, POWER_OFF_VERIFY_TIMEOUT_S),
                   "data": {"power_on": None, "robot_status_bits": bits,
                            "dashboard_sent": sent, "dashboard_respond": resp, "ip": ip}})
    return err("下电失败：dashboard 未应答，且 %.0fs 内 RTDE 的 PowerOn 位仍为 1（应答：%s）"
               % (POWER_OFF_VERIFY_TIMEOUT_S, resp), "TIMEOUT",
               {"robot_status_bits": bits, "ip": ip})


def op_brake_release(p):
    """释放刹车。⚠️ 释放后机械臂可能因重力下落。"""
    return _dashboard_switch(p, "ur_brake_release", "释放刹车")


def op_unlock_protective_stop(p):
    """解除保护性停止 / 关闭安全弹窗。

    与 `ursim_reset_error` 的区别：后者走 `UrScriptExt.reset_error()`，会**顺带**做上电与
    释放刹车；只想把保护性停止解掉、不想让机械臂动起来时，用这个工具。
    """
    ip = str(p["ip"])
    ensure_connected(ip)
    unlocked, unlock_resp = _dashboard_cmd(ip, "ur_unlock_protective_stop")
    closed, close_resp = _dashboard_cmd(ip, "ur_close_safety_popup")
    if not (unlocked or closed):
        return err("解除保护性停止失败（控制器无应答）：%s / %s" % (unlock_resp, close_resp), "TIMEOUT")
    # 解除后**重新读一次安全状态**，让调用方看到结果而不是"已发送"。
    try:
        model = ROBOT_MODELS[ip]
        safety_raw = _read_status_word(model, "safety_status_bits")
        names = _status_bit_names(safety_raw, _SAFETY_STATUS_BITS)
    except Exception:
        safety_raw, names = None, None
    return ok({"message": "已解除保护性停止/关闭安全弹窗（unlock：%s；close popup：%s）；"
                          "当前安全状态位：%s"
                          % (unlock_resp, close_resp, names if names else "无置位"),
               "data": {"unlock_respond": unlock_resp, "close_popup_respond": close_resp,
                        "safety_status_bits": safety_raw, "safety_status_names": names, "ip": ip}})


def op_shutdown(p):
    """关闭控制器（电源）。⚠️ 需要人工重新上电。

    与 `ursim_power_off` 同理：控制器关机时不会给你一个"成功"应答，所以"无应答"不能算失败 ——
    这里把「命令已发出 + 之后再问一次 dashboard 已经不通」作为成功的**旁证**并明确标注为旁证。
    """
    ip = str(p["ip"])
    ensure_connected(ip)
    sent, resp = _dashboard_cmd(ip, "ur_shutdown")
    if sent and _dashboard_ok(resp):
        return ok({"message": "关闭控制器命令已被接受（应答：%s）；控制器将断开，需要人工重新上电" % resp,
                   "data": {"accepted": True, "dashboard_respond": resp, "ip": ip}})
    time.sleep(2.0)
    alive, alive_resp = _dashboard_cmd(ip, "ur_robotmode")
    if not alive:
        return ok({"message": "已发出关闭控制器命令；2s 后 dashboard 已不可达 —— 与关机行为一致"
                              "（旁证，不是确定性证据：%s）" % alive_resp,
                   "data": {"accepted": None, "dashboard_reachable": False,
                            "dashboard_respond": resp, "ip": ip}})
    return err("关闭控制器命令未生效：dashboard 仍可应答（%s / %s）" % (resp, alive_resp), "TIMEOUT",
               {"ip": ip})


def op_get_runtime_telemetry(p):
    """一次读取所有"已在 RTDE 数据流里、但以前没有任何工具暴露"的实时量。

    这些字段**本来就在 500 Hz 的 RTDE 输出配方里**（见 URBasic/rtdeConfiguration.xml），
    读取它们不需要额外配置、也不需要 dashboard 往返，因此代价几乎为零：
    关节电流/电压/角速度、TCP 线速度/受力、速度倍率、动量、工具加速度计。
    """
    ip = str(p["ip"])
    _, model = ensure_connected(ip)

    def vec(getter):
        try:
            return [float(x) for x in getter()]
        except Exception:
            return None

    return ok({
        "message": "实时遥测读取成功（全部来自 RTDE 数据流，无需额外配置）",
        "data": {
            "ip": ip,
            "joint_currents": vec(model.ActualCurrent),
            "joint_voltages": vec(model.ActualJointVoltage),
            "joint_speeds": vec(model.ActualQD),
            "tcp_speed": vec(model.ActualTCPSpeed),
            "tcp_force": vec(model.ActualTCPForce),
            "tool_accelerometer": vec(model.ActualToolAccelerometer),
            "speed_scaling": float(model.SpeedScaling()),
            "momentum": float(model.ActualMomentum()),
            "robot_voltage": float(model.ActualRobotVoltage()),
            "robot_current": float(model.ActualRobotCurrent()),
            "joint_temperatures": vec(model.JointTemperatures),
        },
    })


def op_get_speed_scaling(p):
    """读取速度倍率。

    ⚠️ 两个字段语义完全不同，旧实现只给了前者，于是"静止时读 0"看起来像"速度被压到 0"：
      - `speed_scaling`：控制器**实际**的倍率。**静止时控制器就报 0**，这是正常的。
      - `target_speed_fraction`：**请求**的倍率（速度滑块 / 程序里 `set_speed_slider` 的值）。
    判断"速度有没有被限制"请看 target_speed_fraction；判断"此刻跑多快"看运动中的 speed_scaling。
    """
    ip = str(p["ip"])
    _, model = ensure_connected(ip)

    def num(name):
        value = _rtde_field(model, name)
        try:
            return None if value is None else float(value)
        except Exception:
            return None

    actual = num("speed_scaling")
    target = num("target_speed_fraction")
    return ok({"message": ("实际速度倍率（speed_scaling）：%s；请求倍率（target_speed_fraction）：%s。"
                           "注意：speed_scaling 在**静止时**读 0 属正常（它反映的是「此刻实际」），"
                           "要判断速度是否被限制请看请求倍率。"
                           % (actual if actual is not None else "不可用",
                              target if target is not None else "不可用")),
               "data": {"speed_scaling": actual, "target_speed_fraction": target, "ip": ip}})


def op_set_gravity(p):
    """设置重力方向向量的方向（单位向量），用于非水平安装。

    ⚠️ 只在机器人**非水平安装**或需要显式声明重力方向时才需要；设置错误会让控制器的
    重力补偿出错（表现为松手后下坠或上飘）。
    """
    ip = str(p["ip"])
    d = _vec(p, "direction", 3, "gravity 的 direction")
    norm = math.sqrt(sum(x * x for x in d))
    if norm < 1e-9:
        raise WorkerError("BADARG", "重力方向不能是零向量")
    unit = [x / norm for x in d]
    robot, _ = ensure_connected(ip)
    if not _send_program(robot, "set_gravity([%.6f,%.6f,%.6f])\n" % tuple(unit)):
        return err("set_gravity 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已设置重力方向为 [%.4f, %.4f, %.4f]（已归一化）" % tuple(unit),
               "data": {"direction": unit, "normalized_from": d, "ip": ip}})


def op_zero_ftsensor(p):
    """把力/力矩传感器的读数归零。⚠️ 归零瞬间机械臂应处于"无力"状态。"""
    ip = str(p["ip"])
    robot, _ = ensure_connected(ip)
    if not _send_program(robot, "zero_ftsensor()\n"):
        return err("zero_ftsensor 脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "已下发力/力矩传感器归零", "data": {"ip": ip}})


def op_get_tcp_force(p):
    """读取 TCP 受力/力矩 [Fx,Fy,Fz,Tx,Ty,Tz]（来自 RTDE）。"""
    ip = str(p["ip"])
    _, model = ensure_connected(ip)
    force = [float(x) for x in model.ActualTCPForce()]
    return ok({"message": "TCP 受力：%s" % force,
               "data": {"tcp_force": force, "ip": ip}})


def op_conveyor_tracking(p):
    """传送带跟踪：编码器设置 / 线性跟踪 / 圆盘跟踪 / 停止。

    ## 这一版是**按手册重写**的（旧版每个实参都在错误的位置）

    旧实现发的是 `conveyor_pulse_decode(a, b, 0)` /
    `set_conveyor_tick_count(0, ticks_per_meter)` /
    `track_conveyor_linear(p[0,…], speed)` / `track_conveyor_circular(p[0,…], radius, speed)`。
    逐条对照 PolyScope 5 手册（`ScriptManual/txt/script_directory_Poly5.txt`）：

    - `conveyor_pulse_decode(type,A,B)`（15.1，764 行）—— 第一个槽是**解码方式**，而旧代码把
      "编码器 A 通道"放了进去；默认 `encoder_a=0` 恰好等于手册里 "0 is no encoder, pulse
      decoding is disabled"（770 行），也就是**解码根本没开**。
    - `set_conveyor_tick_count(tick_count, absolute_encoder_resolution)`（15.45，1595 行）——
      第二个槽是 0-4 的**位宽枚举**，旧代码把"每米脉冲数"塞了进去；而且该参数被
      `allow_zero=False` 校验，恰恰拒绝了唯一合理的值 0。
    - `track_conveyor_linear(direction, ticks_per_meter, encoder_index=0)`（15.57，1772 行）——
      第一个参是**方向位姿**，旧代码传的是零位姿；第二个参是每米脉冲数，旧代码传的是"速度"。
    - `track_conveyor_circular(center, ticks_per_revolution, rotate_tool='False',
      encoder_index=0)`（15.56，1746 行）—— 旧代码把"半径"当成每转脉冲数、把浮点数当成布尔量。

    ⇒ 现在每个参数都按手册的槽位与量纲传，且**不再有默认的"速度"这种手册里不存在的概念**。

    ⚠️ **未经真机验证**：本实现只保证"发出去的 URScript 与手册签名/语义一致"，签名本身已用
    手册逐条核对（见上），但跟踪行为需要一台真的带编码器的传送带才能确认。请先在 URSim 上
    试，并在真机上空载验证后再接工件。

    action：
      "setup_pulse"   —— 把控制器脉冲解码器挂到编码器上（`encoder_enable_pulse_decode`）
      "setup_absolute"—— 告诉控制器编码器通过 `encoder_set_tick_count` 喂绝对值
      "linear" / "circular" —— 开始跟踪（不含编码器设置，便于先设置一次、之后反复启停）
      "stop"          —— 停止跟踪
    """
    ip = str(p["ip"])
    action = str(p.get("action", "")).lower()
    robot, _ = ensure_connected(ip)
    _assert_remote_control(ip, "conveyor_tracking")

    def encoder_index():
        return _bounded_int(p.get("encoder_index", 0), "encoder_index", 0, 1,
                            "编码器编号（手册：只能是 0 或 1）")

    if action == "stop":
        script = "stop_conveyor_tracking()\n"
        note = "已停止传送带跟踪"
    elif action == "setup_pulse":
        # encoder_enable_pulse_decode(encoder_index, decoder_type, A, B)
        enc = encoder_index()
        decoder = _bounded_int(p.get("decoder_type", 1), "decoder_type", 1, 4,
                               "解码方式（1 正交 / 2 升降沿 / 3 升沿 / 4 降沿；手册里的 0 表示"
                               "关闭解码，作为设置动作没有意义，故不接受）")
        # 引脚范围随固件不同：CB3（3.x）脉冲解码器只有数字输入 0-3，
        # e-Series / PolyScope X 是 8-11（手册 15.3：「A: Encoder input A pin. Must be 8-11」）。
        # 两种都被接受，但由调用方显式给出 —— 猜错会让解码静默失效。
        a = _bounded_int(p.get("encoder_a"), "encoder_a", 0, 11, "编码器 A 引脚")
        b = _bounded_int(p.get("encoder_b"), "encoder_b", 0, 11, "编码器 B 引脚")
        script = "encoder_enable_pulse_decode(%d, %d, %d, %d)\n" % (enc, decoder, a, b)
        note = ("已把脉冲解码器挂到编码器 %d（方式 %d，引脚 A=%d B=%d）。"
                "⚠️ 引脚合法范围随固件不同：CB3(3.x) 用 0-3，e-Series/PolyScope X 用 8-11"
                % (enc, decoder, a, b))
    elif action == "setup_absolute":
        # encoder_enable_set_tick_count(encoder_index, range_id)
        enc = encoder_index()
        range_id = _bounded_int(p.get("range_id", 0), "range_id", 0, 4,
                                "编码器计数范围（0=32 位有符号 … 4=32 位无符号）")
        script = "encoder_enable_set_tick_count(%d, %d)\n" % (enc, range_id)
        if p.get("tick_count") is not None:
            tick = int(p["tick_count"])
            script += "encoder_set_tick_count(%d, %d)\n" % (enc, tick)
        note = "已把编码器 %d 配置为外部喂计数值（范围 %d）" % (enc, range_id)
    elif action in ("linear", "circular"):
        enc = encoder_index()
        if action == "linear":
            # track_conveyor_linear(direction, ticks_per_meter, encoder_index=0)
            direction = _vec(p, "direction", 6,
                             "track_conveyor_linear 的 direction（基座系下传送带的方向位姿，"
                             "例如 x 轴方向为 [1,0,0,0,0,0]）")
            ticks = _nonneg_float(p.get("ticks_per_meter"), "ticks_per_meter",
                                  "每米脉冲数（>0；手册：编码器走过 1 米产生的脉冲数）",
                                  allow_zero=False)
            script = "track_conveyor_linear(p%s, %s, %d)\n" % (
                _ur_list(direction), _ur_number(ticks), enc)
            note = "已开始线性跟踪（方向 p%s，%s 脉冲/米）" % (_ur_list(direction), _ur_number(ticks))
        else:
            # track_conveyor_circular(center, ticks_per_revolution, rotate_tool='False',
            #                          encoder_index=0)
            center = _vec(p, "center", 6, "track_conveyor_circular 的 center（基座系下的圆心位姿）")
            ticks = _nonneg_float(p.get("ticks_per_revolution"), "ticks_per_revolution",
                                  "每转脉冲数（>0；手册：传送带转一圈编码器看到的脉冲数）",
                                  allow_zero=False)
            rotate_raw = p.get("rotate_tool", False)
            rotate = "True" if (rotate_raw is True or str(rotate_raw).lower() in ("true", "1")) else "False"
            script = "track_conveyor_circular(p%s, %s, %s, %d)\n" % (
                _ur_list(center), _ur_number(ticks), rotate, enc)
            note = "已开始圆盘跟踪（圆心 p%s，%s 脉冲/转，工具随传送带旋转=%s）" % (
                _ur_list(center), _ur_number(ticks), rotate)
    else:
        raise WorkerError(
            "BADARG",
            'action 必须是 "setup_pulse" / "setup_absolute" / "linear" / "circular" / "stop"，收到 %r'
            % action)

    if not _send_program(robot, script):
        return err("传送带跟踪脚本未能送达控制器：%s" % _last_send_failure(robot), "SEND_FAILED")
    return ok({"message": "%s。下发脚本：%s" % (note, script.strip()),
               "data": {"action": action, "command": script.strip(),
                        "hardware_verified": False, "ip": ip}})


def op_get_tool_analog_in(p):
    """读取工具端模拟输入（0/1）。

    ⚠️ **未经真机验证的实现**（与仓库里其它"直接发 URScript"的工具同一风险等级）：
    工具模拟输入不经 RTDE，只能靠 URScript 表达式读取，而表达式必须跑在程序里；这里按
    UR 脚本手册的 `get_tool_analog_in(n)` + `write_output_float_register(address, value)`
    组合把结果写进一个**专用**的输出寄存器再经 RTDE 回读。可选参数 `read_register`
    （默认 22）让调用方在固件不认识上述函数名时换一个寄存器；若 5 s 内读不回值，
    工具会**如实报失败**并说明原因，而不是返回一个陈旧值。

    代价：会覆盖该寄存器的旧值；且这次读取会打断当前正在运行的程序。
    """
    ip = str(p["ip"])
    n = _bounded_int(p["n"], "n", 0, 1, "工具模拟输入端口号")
    # 默认 22：避开 send_script 的默认哨兵 23，也避开厂内程序常用的 0-3。
    register = _bounded_int(p.get("read_register", 22), "read_register", 0, 23, "回读用寄存器")
    robot, model = ensure_connected(ip)
    _assert_remote_control(ip, "get_tool_analog_in")

    # 优先走 RTDE 直读（tool_analog_input0/1）：零代价、也不打断当前运行的程序。
    # 只有该字段读不到时，才退回下面"发脚本 + 回读寄存器"的笨办法。
    direct = _rtde_field(model, "tool_analog_input%d" % n)
    if direct is not None:
        types_raw = _rtde_field(model, "tool_analog_input_types")
        try:
            types_value = None if types_raw is None else int(types_raw)
        except Exception:
            types_value = None
        return ok({"message": "工具模拟输入 %d = %s（RTDE 直读；该通道类型编码 %s，按控制器文档解释）"
                              % (n, direct, types_value if types_value is not None else "不可用"),
                   "data": {"n": n, "value": float(direct), "source": "rtde",
                            "tool_analog_input_types": types_value, "ip": ip}})

    before = None
    try:
        before = float(model.OutputDoubleRegister(register))
    except Exception:
        pass
    script = ("def ur_read_tool_analog():\n"
              "    write_output_float_register(%d, get_tool_analog_in(%d))\n"
              "end\n" % (register, n))
    if not _send_program(robot, script):
        return err("读取工具模拟输入失败：%s" % _last_send_failure(robot), "SEND_FAILED")
    deadline = time.time() + 5.0
    while time.time() < deadline:
        try:
            value = model.OutputDoubleRegister(register)
        except Exception:
            value = None
        # 必须等到**值发生变化**（或原本就是 None）才算读到本次结果：寄存器里可能残留着
        # 上一次的值，拿它当本次读数就是上文反复出现的"陈旧应答"问题。
        if value is not None and (before is None or float(value) != before):
            return ok({"message": "工具模拟输入 %d = %s（回读寄存器 %d）" % (n, value, register),
                       "data": {"port": n, "value": float(value), "register": register,
                                "previous": before, "ip": ip}})
        time.sleep(0.1)
    return err("未能读回工具模拟输入 %d：5s 内寄存器 %d 没有更新（旧值 %s）。可能原因："
               "①该寄存器被控制器/程序占用；②当前固件不认识 get_tool_analog_in 或 "
               "write_output_float_register（可换 read_register 再试）；③机器人不在远程控制模式。"
               % (n, register, before), "TIMEOUT")


def op_shutdown_worker(p):
    """优雅退出：先关掉所有机器人连接，再结束进程。

    为什么需要它：RTDE 会话在控制器侧是**独占**的。进程被 kill 时窗口来不及走 FIN，
    控制器可能在一个超时窗口内仍认为旧会话存在，于是紧接着的重连会失败（本文件多处注释
    都提到过这个现象）。让 worker 自己把连接关干净再退出，可以避免这类"重启后连不上"。

    ⚠️ **不能在这里直接 `os._exit(0)`**：本函数的返回值会由 `main()` 序列化成一行响应写进
    stdout，而 `os._exit` 不刷新任何缓冲、也不等管道被读走 —— 实测 Node 侧因此收不到应答，
    `shutdown()` 只能靠超时收场（`selftest.test.mjs` 就是这么发现它的）。
    改为交回返回值、由 `main()` 负责"先应答、再在下一轮读循环前退出"。
    """
    closed = []
    for ip in list(ROBOTS.keys()):
        robot = ROBOTS.pop(ip, None)
        ROBOT_MODELS.pop(ip, None)
        try:
            if robot is not None:
                robot.robotConnector.close()
            closed.append(ip)
        except Exception as exc:
            _log("关闭 %s 的连接时出错：%r" % (ip, exc))
    return ok({"message": "worker 正在退出", "data": {"closed": closed}})


def _exit_soon(code=0, delay_s=0.2):
    """应答写完之后再退出进程（见 op_shutdown_worker 的说明）。

    用 daemon 线程延迟一下退出：给 stdout 的管道缓冲一点时间被对端读走。
    `os._exit` 而不是 `sys.exit` —— 我们不想跑 atexit/线程清理（RTDE/Dashboard 的
    接收线程可能正卡在 recv 里，join 会把"退出"变成新的卡死点）。
    """
    def _boom():
        time.sleep(delay_s)
        try:
            _LOG.close()
        except Exception:
            pass
        os._exit(code)

    threading.Thread(target=_boom, name="ur-exit", daemon=True).start()


# ---------------------------------------------------------------------------
# 离线仿真的 op 实现（运动学级）
# ---------------------------------------------------------------------------
#
# 只覆盖**运动类工具 + 位姿读回**。其余指令一律走 `_sim_no_semantics()` 明确回报
# 「无仿真语义」——宁可说"这里没有"，也不给一个看起来能跑的结果。


def _sim_data(sim, extra=None):
    """仿真返回的统一数据信封：**一定带 `simulated: True`**（工具/界面/截图据此标注）。"""
    data = {
        "simulated": True,
        "ip": sim.ip,
        "model": _sim_module().canonical_model_name(sim.model),
    }
    if extra:
        data.update(extra)
    return data


def _sim_pose(sim):
    """当前 TCP 位姿（由 q 正解而来 ⇒ 与仿真画出来的位置必然一致）。"""
    ur = _sim_module()
    return ur.tcp_pose(sim.model, sim.advance())


def _sim_settle(sim, p):
    """等到"到位"：与真机那几个确认循环同义 —— 命令返回时运动已经结束。

    ⚠️ 这里**阻塞的是 worker 主线程**，但仿真的推送线程照常在 20 Hz 读 `sim.snapshot()`
    （那条线程不读 stdin），所以界面上能看到机械臂真的走完全程 —— 与真机运动时的情况一致。
    """
    budget = _budget_ms(p)
    started = time.time()
    while not sim.is_steady():
        if (time.time() - started) * 1000.0 >= budget:
            return False, ("运动在 %.0fms 内没有走完（仿真：轨迹太长或速度太小；"
                           "可加大 a/v、用 t 指定时长，或把预算调大）" % budget)
        time.sleep(0.02)
    return True, "已到达目标（仿真）"


def _sim_move_reply(sim, p, what, target_pose=None, extra=None):
    """运动类指令的统一回包：等到位 + 回 `{ok, command, ip, simulated}`。

    ⚠️ `_sim_settle` 的 `ok_flag=False`（"预算内没走完"）**必须**升级成信封失败：旧写法
    无条件 `return ok({...})`，调用方看到的是一句"…（运动在 60000ms 内没有走完）"却带着
    `ok:true`，与"已到达目标"无法区分。成功路径的结构与字段**保持原样**（见 data）。
    """
    ok_flag, confirm = _sim_settle(sim, p)
    data = _sim_data(sim, {
        "ok": ok_flag,
        "command": "sim:%s" % what,
        "target_tcp_pose": target_pose if target_pose is not None else _sim_pose(sim),
    })
    if extra:
        data.update(extra)
    if not ok_flag:
        return _motion_failure(what, confirm, data)
    return ok({"message": "%s（%s）" % (what, confirm), "data": data})


def _sim_motion_args(p, joint=False, a_default=None, v_default=None):
    """解析运动参数（与各真机 op 的默认值一致）。

    `joint=True` 时回的是 movej 的手册默认（a=1.4 rad/s²、v=1.05 rad/s），否则 movel 的
    （a=1.2 m/s²、v=0.25 m/s）。`t>0` 由调用方转成 `total_s`。

    `a_default` / `v_default` 只给**默认值本来就不是 movel 手册值**的工具用：绘图四件套的
    默认一直是 a=1.0 / v=0.25（真机那条 URScript 也是 `a=1, v=0.25`），不能因为"统一走这个
    助手"就把它悄悄改成 movel 的 1.2 —— 那会让"不传 v/a 时行为与从前不同"，而这次加参数
    的前提正是向后兼容。
    """
    if a_default is None:
        a_default = 1.4 if joint else 1.2
    if v_default is None:
        v_default = 1.05 if joint else 0.25
    a = _bounded_float(p.get("a", a_default), "a", 1e-4, 100.0, "加速度")
    v = _bounded_float(p.get("v", v_default), "v", 1e-4, 100.0, "速度")
    t = _nonneg_float(p.get("t", 0), "t", "移动时长")
    r = _nonneg_float(p.get("r", 0), "r", "交融半径")
    return a, v, t, r


def _sim_r_note(r, data):
    """`r>0`（交融半径）在仿真里没有模型：路径按**精确途经点**走，必须在回包里说清楚。"""
    if isinstance(r, (int, float)) and r > 0:
        data["sim_note"] = ("仿真不建模交融半径 r=%.4f：途经点会精确到达（真机是圆滑过渡过点）。"
                            % r)
    return data


# ── 位姿 / 状态读回 ──────────────────────────────────────────────────────

def _sim_get_joint_pose(sim, p):
    q = [float(x) for x in sim.advance()]
    return ok({"message": "当前关节姿态（仿真）：%s" % _round_pose(q),
               "data": _sim_data(sim, {"joint_positions": q})})


def _sim_get_tcp_pose(sim, p):
    pose = _sim_pose(sim)
    return ok({"message": "当前TCP位置（仿真）：%s" % _round_pose(pose),
               "data": _sim_data(sim, {"tcp_pose": pose})})


def _sim_get_robot_model(sim, p):
    name = _sim_module().canonical_model_name(sim.model)
    return ok({"message": "%s（离线仿真）" % name,
               "data": _sim_data(sim, {"robot_model": name, "remote_control": True})})


def _sim_get_serial_number(sim, p):
    return ok({"message": "序列号（仿真）：%s" % sim.serial,
               "data": _sim_data(sim, {"serial_number": sim.serial})})


def _sim_get_software_version(sim, p):
    return ok({"message": "软件版本：SIM（离线仿真没有控制器固件）",
               "data": _sim_data(sim, {"software_version": "SIM"})})


def _sim_get_time(sim, p):
    seconds = time.time() - sim.created_at
    return ok({"message": "仿真运行时长（秒）：%.2f" % seconds,
               "data": _sim_data(sim, {"up_time_seconds": seconds})})


def _sim_get_robot_mode(sim, p):
    mode = "RUNNING" if not sim.is_steady() else "IDLE"
    return ok({"message": "运行状态（仿真）：%s" % mode,
               "data": _sim_data(sim, {"robot_mode": mode})})


def _sim_get_safety_mode(sim, p):
    # 仿真里不存在安全功能，所以只能是 NORMAL —— 这**不是**在假装"真机很安全"，
    # `simulated: true` 与界面上的仿真水印就是这个字段的语境。
    return ok({"message": "安全模式（仿真只有 NORMAL：没有安全功能可触发）",
               "data": _sim_data(sim, {"safety_mode": "NORMAL"})})


def _sim_get_program_state(sim, p):
    return ok({"message": "当前程序：<仿真无程序>；执行状态：STOPPED",
               "data": _sim_data(sim, {"loaded_program": None, "program_state": "STOPPED",
                                       "saved": None, "running": not sim.is_steady()})})


def _sim_get_speed_scaling(sim, p):
    return ok({"message": "仿真速度倍率（它直接缩放每段运动的时长）：%.2f" % sim.speed_scaling,
               "data": _sim_data(sim, {"speed_scaling": sim.speed_scaling,
                                       "target_speed_fraction": sim.speed_scaling})})


def _sim_status(sim, p):
    data = sim.status()
    # ⚠️ 仿真面板的遥测行读的是**这条 `status`**（见 lib/twin-routes.js 里 body.detail 的字段清单：
    # robot_voltage / robot_current / joint_temperatures / joint_currents / tcp_force / tcp_speed），
    # 不是 `get_runtime_telemetry`。所以估算值必须出现在这里 —— 否则"面板遥测行在仿真下是空的"
    # 这件事根本没被修好（B1 的用户可见结果就在这一处）。
    est = _sim_estimate(sim)
    data.update({
        "robot_voltage": _SIM_NOMINAL_VOLTAGE,
        "robot_current": est["robot_current"],
        "joint_temperatures": est["temps"],
        "joint_currents": est["currents"],
        "tcp_force": est["force"],
        "tcp_speed": est["tcp_speed"],
        "telemetry_estimated": True,
    })
    return ok({"message": ("离线仿真状态：型号 %s，%s，速度倍率 %.2f。"
                           "（运动学级：没有动力学/安全/程序；遥测列为**估算值**）"
                           % (data["robot_model"], "运动中" if data["running"] else "静止",
                              data["speed_scaling"])),
               "data": data})


def _sim_get_target_values(sim, p):
    ur = _sim_module()
    q = sim.advance()
    goal = sim.target_q()
    data = _sim_data(sim, {
        "target_q": goal,
        "target_tcp_pose": ur.tcp_pose(sim.model, goal),
        "actual_q": [float(x) for x in q],
        "actual_tcp_pose": ur.tcp_pose(sim.model, q),
        # 速度/加速度目标**没有建模**：给 null 比编一个数字诚实（真机读的是控制器的规划值）。
        "target_qd": None, "target_qdd": None, "target_tcp_speed": None,
        "sim_note": "仿真不产生速度/加速度目标（没有规划器），这几个字段恒为 null。",
    })
    return ok({"message": "目标关节角（仿真）：%s" % _round_pose(goal), "data": data})


# ── 运动 ────────────────────────────────────────────────────────────────

def _sim_movej(sim, p):
    q = _vec(p, "q", 6, "movej 的 q")
    a, v, t, r = _sim_motion_args(p, joint=True)
    sim.move_joints(q, v, a, total_s=t if t > 0 else None)
    data_extra = {}
    _sim_r_note(r, data_extra)
    return _sim_move_reply(sim, p, "关节运动到 %s" % _round_pose(q), None, data_extra)


def _sim_movel(sim, p):
    pose = _vec(p, "pose", 6, "movel 的 pose")
    a, v, t, r = _sim_motion_args(p)
    sim.move_cartesian([pose], v, a, total_s=t if t > 0 else None)
    return _sim_move_reply(sim, p, "直线运动到 %s" % _round_pose(pose), pose,
                           _sim_r_note(r, {}))


def _sim_movep(sim, p):
    pose = _vec(p, "pose", 6, "movep 的 pose")
    a = _bounded_float(p.get("a", 1.2), "a", 1e-4, 100.0, "加速度")
    v = _bounded_float(p.get("v", 0.25), "v", 1e-4, 100.0, "速度")
    r = _nonneg_float(p.get("r", 0), "r", "交融半径")
    sim.move_cartesian([pose], v, a)
    return _sim_move_reply(sim, p, "路径运动到 %s" % _round_pose(pose), pose,
                           _sim_r_note(r, {}))


def _sim_move_optimized(sim, p):
    """OptiMove：`a`/`v` 在真机上是**能力比例 (0,1]**，不是 rad/s 或 m/s。

    仿真把它解释成"相对该类型运动的名义速度/加速度的比例"（关节：1.05 rad/s、1.4 rad/s²；
    直线：0.25 m/s、1.2 m/s²）——这一点写进回包，免得调用方以为自己在给物理单位。
    """
    goal_type = str(p["goal_type"]).strip().lower()
    goal = _vec(p, "goal", 6, "move_optimized 的 goal")
    a_ratio = _bounded_float(p.get("a", 0.3), "a", 1e-4, 1.0, "加速度能力比例")
    v_ratio = _bounded_float(p.get("v", 0.3), "v", 1e-4, 1.0, "速度能力比例")
    r = _nonneg_float(p.get("r", 0), "r", "交融半径")
    if p.get("frame") is not None:
        return err("move_optimized 的 frame 参数不受支持（真机路径同样拒绝它）", "BADARG")
    if goal_type == "joints":
        sim.move_joints(goal, 1.05 * v_ratio, 1.4 * a_ratio)
        what = "OptiMove（关节）到 %s" % _round_pose(goal)
        target = None
    elif goal_type == "pose":
        sim.move_cartesian([goal], 0.25 * v_ratio, 1.2 * a_ratio)
        what = "OptiMove（位姿）到 %s" % _round_pose(goal)
        target = goal
    else:
        return err("goal_type 必须是 'joints' 或 'pose'，收到 %r" % goal_type, "BADARG")
    extra = _sim_r_note(r, {})
    extra["sim_note"] = ("a/v 按**能力比例**解释（真机语义即如此）：已折成名义 "
                         "v=%.3f、a=%.3f。仿真不做 jerk 限幅。" % (1.05 * v_ratio if goal_type == "joints" else 0.25 * v_ratio,
                                                                 1.4 * a_ratio if goal_type == "joints" else 1.2 * a_ratio))
    return _sim_move_reply(sim, p, what, target, extra)


def _sim_servoj(sim, p):
    q = _vec(p, "q", 6, "servoj 的 q")
    sim.servoj(q)
    return _sim_move_reply(sim, p, "伺服到 %s" % _round_pose(q), None, {
        "sim_note": ("真机的 servoj 是 500 Hz 流式伺服、一次只推一个 setpoint；仿真把它退化成"
                     "一次瞬时到位（没有伺服带宽可模拟）。要连续轨迹请用 movel/movep。"),
    })


def _sim_axis_move(sim, p, axis):
    """沿**基座**轴平移（与真机 `_axis_move` 同一套算术，也用同一组 URBasic 默认 a=0.5/v=0.25）。"""
    distance = float(p["distance"])
    pose = _sim_pose(sim)
    target = list(pose)
    target[axis] = target[axis] + distance
    sim.move_cartesian([target], 0.25, 0.5)
    return _sim_move_reply(sim, p, "沿基座 %s 轴移动 %.4f m" % ("xyz"[axis], distance), target)


def _sim_tool_axis_move(sim, p, axis):
    """沿**工具系**轴平移：把工具系位移用当前姿态的旋转矩阵换算到基座系（与真机同一算法）。"""
    distance = float(p["distance"])
    pose = _sim_pose(sim)
    delta_tool = [0.0, 0.0, 0.0]
    delta_tool[axis] = distance
    delta_base = _rotvec_to_matrix(pose[3:6]).dot(np.asarray(delta_tool, dtype=float))
    target = [pose[0] + float(delta_base[0]), pose[1] + float(delta_base[1]),
              pose[2] + float(delta_base[2]), pose[3], pose[4], pose[5]]
    sim.move_cartesian([target], 0.25, 0.5)
    return _sim_move_reply(sim, p, "沿工具 %s 轴移动 %.4f m（基座位移 [%.4f, %.4f, %.4f]）"
                           % ("xyz"[axis], distance, float(delta_base[0]),
                              float(delta_base[1]), float(delta_base[2])), target,
                           {"tool_delta": delta_tool,
                            "base_delta": [float(x) for x in delta_base]})


def _sim_draw_circle(sim, p):
    """圆：走**与真机那条 URScript 同一个圆**（4 个共圆途经点 ⇒ 解析圆参数）。"""
    ur = _sim_module()
    center = _vec(p, "center", 6, "draw_circle 的 center")
    r = _nonneg_float(p["r"], "r", "draw_circle 的半径", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    # v/a/t 可选：默认仍是这条工具一直用的 a=1.0 / v=0.25（真机脚本同值）⇒ 不传时行为不变。
    a, v, t, _blend = _sim_motion_args(p, a_default=DRAW_ACCEL_DEFAULT)
    wp = _circle_waypoints(center, r, coordinate)
    plane_u = [(wp[0][i] - center[i]) / r for i in range(3)]
    plane_v = [(wp[1][i] - center[i]) / r for i in range(3)]
    steps = max(16, min(180, int(2.0 * math.pi * r / 0.01)))
    poses = [wp[0]] + [_circle_pose(center, plane_u, plane_v, r, 2.0 * math.pi * k / steps)
                       for k in range(steps + 1)]
    sim.move_cartesian(poses, v, a, total_s=t if t > 0 else None)
    return _sim_move_reply(sim, p, "画圆（半径 %.4f m，%s 平面）" % (r, coordinate), None, {
        "waypoints": wp, "steps": len(poses),
        "sim_note": ("仿真按解析圆行走（与真机那条 movep+2×movec 的 4 个共圆点等价）；"
                     "真机路径的 r=0.025 圆滑过渡在仿真里不建模。"),
    })


def _sim_draw_square(sim, p):
    origin = _vec(p, "origin", 6, "draw_square 的 origin")
    border = _nonneg_float(p["border"], "border", "draw_square 的边长", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    a, v, t, _blend = _sim_motion_args(p, a_default=DRAW_ACCEL_DEFAULT)
    wp = _square_waypoints(origin, border, coordinate)
    sim.move_cartesian([wp[0], wp[1], wp[2], origin], v, a, total_s=t if t > 0 else None)
    return _sim_move_reply(sim, p, "画正方形（边长 %.4f m，%s 平面）" % (border, coordinate), None,
                           {"waypoints": wp})


def _sim_draw_rectangle(sim, p):
    origin = _vec(p, "origin", 6, "draw_rectangle 的 origin")
    width = _nonneg_float(p["width"], "width", "draw_rectangle 的长", allow_zero=False)
    height = _nonneg_float(p["height"], "height", "draw_rectangle 的宽", allow_zero=False)
    coordinate = str(p.get("coordinate", "z")).lower()
    a, v, t, _blend = _sim_motion_args(p, a_default=DRAW_ACCEL_DEFAULT)
    wp = _rectangle_waypoints(origin, width, height, coordinate)
    sim.move_cartesian([wp[0], wp[1], wp[2], origin], v, a, total_s=t if t > 0 else None)
    return _sim_move_reply(sim, p, "画长方形（%.4f × %.4f m，%s 平面）" % (width, height, coordinate),
                           None, {"waypoints": wp})


def _sim_draw_star(sim, p):
    center = _vec(p, "center", 6, "draw_star 的 center")
    side = _nonneg_float(p["side"], "side", "draw_star 的边长", allow_zero=False)
    coordinate = str(p.get("coordinate", "xy")).lower()
    a, v, t, _blend = _sim_motion_args(p, a_default=DRAW_ACCEL_DEFAULT)
    verts, radius = _star_vertices(center, side, coordinate)
    path = [verts[i] for i in STAR_ORDER]
    sim.move_cartesian(path, v, a, total_s=t if t > 0 else None)
    return _sim_move_reply(sim, p, "画五角星（边长 %.4f m，外接半径 %.4f m）" % (side, radius),
                           None, {"vertices": verts, "radius": radius})


def _sim_run_sequence(sim, p):
    """多段连续运动（**仿真主路径**）：整条折线只排**一次**时间表 ⇒ 段间零停顿。

    这是这个工具在仿真里的全部价值：`ur_sim.VirtualRobot.run_sequence` 把每段转成关节航点
    后拼成一条折线，再交给 `_plan`（整条折线共用一条时间剖面）。逐段调用 movej/movel 会让
    每一段各自起停 —— 那才是它要避免的东西。
    """
    segments = _sequence_segments(p)
    a, v, t, r = _sim_motion_args(p)
    sim.run_sequence(segments, v, a, total_s=t if t > 0 else None)
    extra = _sim_r_note(r, {})
    notes = ["段间**不停顿**：整条折线共用一条时间剖面（只排一次时间表），不是逐段起停。"]
    if t > 0:
        notes.append("整段时长按 t=%.3f s 缩放（t>0 覆盖 a/v，与 movel 的 t 语义一致）。" % t)
    if "sim_note" in extra:
        notes.append(extra["sim_note"])
    extra["segment_count"] = len(segments)
    extra["sim_note"] = "".join(notes)
    return _sim_move_reply(sim, p, "连续多段运动（%d 段，段间不停顿）" % len(segments), None, extra)


def _sim_movec(sim, p):
    """圆弧：过 `pose_via` 到 `pose_to`（真机走的是 URScript `movec`）。

    位置按**三点定圆**精确走弧；姿态在旋转向量空间分段线性插值（绕单轴时精确，一般情形近似）。
    三点共线时退化成两条直线段 —— 与"圆弧退化"的直觉一致，且不编造一个不存在的圆心。
    """
    via = _vec(p, "pose_via", 6, "movec 的 pose_via")
    to = _vec(p, "pose_to", 6, "movec 的 pose_to")
    a = _bounded_float(p.get("a", 1.2), "a", 1e-4, 100.0, "加速度")
    v = _bounded_float(p.get("v", 0.25), "v", 1e-4, 100.0, "速度")
    r = _nonneg_float(p.get("r", 0), "r", "交融半径")
    mode = _bounded_int(p.get("mode", 0), "mode", 0, 1, "圆弧模式")
    start = _sim_pose(sim)
    poses, note = _arc_poses(start, via, to)
    sim.move_cartesian(poses, v, a)
    extra = _sim_r_note(r, {"mode": mode, "sim_note": note})
    return _sim_move_reply(sim, p, "圆弧运动到 %s" % _round_pose(to), to, extra)


def _sim_wait_steady(sim, p):
    timeout_s = _bounded_float(p.get("timeout_s", 10.0), "timeout_s", 0.1, 300.0, "等待时长")
    linear = _bounded_float(p.get("linear_tolerance", 0.005), "linear_tolerance", 1e-4, 1.0, "线速度阈值")
    angular = _bounded_float(p.get("angular_tolerance", 0.01), "angular_tolerance", 1e-4, 10.0, "角速度阈值")
    started = time.time()
    while not sim.is_steady():
        if time.time() - started >= timeout_s:
            return ok({"message": "仿真未在 %.1fs 内到位（按 timeout_s 如实回报）" % timeout_s,
                       "data": _sim_data(sim, {"steady": False, "waited_s": time.time() - started,
                                               "linear_tolerance": linear,
                                               "angular_tolerance": angular})})
        time.sleep(0.02)
    return ok({"message": "仿真已到位（运动学级仿真里「稳态」就是轨迹走完）",
               "data": _sim_data(sim, {"steady": True, "waited_s": time.time() - started,
                                       "linear_tolerance": linear,
                                       "angular_tolerance": angular,
                                       "sim_note": "速度阈值在仿真里没有意义：没有伺服/动力学模型。"})})


def _sim_stop(sim, p, what):
    sim.stop()
    return ok({"message": "%s：仿真已在当前姿态冻结（没有减速模型，是瞬时停）" % what,
               "data": _sim_data(sim, {"stopped": True})})


def _arc_poses(start, via, to, max_steps=240):
    """三点圆弧 → Cartesian 途经点（含终点，不含起点）。

    返回 `(poses, note)`。三点共线时返回两段折线并说明（**不编造**一个不存在的圆心）。
    圆心由"到 A/B/C 等距"解出（在 A 为原点的 u=B−A、w=C−A 平面里解 2×2 线性方程）。
    """
    a = [float(start[i]) for i in range(3)]
    b = [float(via[i]) for i in range(3)]
    c = [float(to[i]) for i in range(3)]
    u = [b[i] - a[i] for i in range(3)]
    w = [c[i] - a[i] for i in range(3)]
    cross = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
    norm = math.sqrt(sum(v * v for v in cross))
    collinear = "三点共线：圆弧退化，仿真按两段直线走。"
    if norm < 1e-9:
        return [list(via), list(to)], collinear

    uu = sum(u[i] * u[i] for i in range(3))
    ww = sum(w[i] * w[i] for i in range(3))
    uw = sum(u[i] * w[i] for i in range(3))
    det = uu * ww - uw * uw
    if abs(det) < 1e-18 or uu < 1e-18:
        return [list(via), list(to)], collinear
    # 等距条件：α·uu + β·uw = uu/2 ；α·uw + β·ww = ww/2
    alpha = (uu * ww - uw * ww) / (2.0 * det)
    beta = (uu * ww - uw * uu) / (2.0 * det)
    center = [a[i] + alpha * u[i] + beta * w[i] for i in range(3)]
    radius = math.sqrt(sum((a[i] - center[i]) ** 2 for i in range(3)))
    if radius < 1e-9:
        return [list(via), list(to)], collinear

    normal = [v / norm for v in cross]
    e1 = [(a[i] - center[i]) / radius for i in range(3)]
    e2 = [normal[1] * e1[2] - normal[2] * e1[1],
          normal[2] * e1[0] - normal[0] * e1[2],
          normal[0] * e1[1] - normal[1] * e1[0]]

    def angle_of(point):
        vec = [point[i] - center[i] for i in range(3)]
        x = sum(vec[i] * e1[i] for i in range(3))
        y = sum(vec[i] * e2[i] for i in range(3))
        ang = math.atan2(y, x)
        return ang + 2.0 * math.pi if ang < 0 else ang

    phi_b = angle_of(b)
    phi_c = angle_of(c)
    # 方向取"确实会经过 via"的那一侧：via 的角度若在 to 之前就正向扫，否则反向扫。
    sweep = phi_c if phi_b <= phi_c else phi_c - 2.0 * math.pi
    arc_len = abs(sweep) * radius
    steps = max(8, min(max_steps, int(math.ceil(arc_len / 0.01))))
    u_frac = (phi_b / sweep) if abs(sweep) > 1e-12 else 0.5
    u_frac = min(1.0, max(0.0, u_frac))
    poses = []
    for k in range(1, steps + 1):
        frac = k / float(steps)
        phi = sweep * frac
        pos = [center[i] + radius * (math.cos(phi) * e1[i] + math.sin(phi) * e2[i])
               for i in range(3)]
        if frac <= u_frac or u_frac >= 1.0:
            s = frac / u_frac if u_frac > 1e-9 else 0.0
            rot = [start[3 + i] + (via[3 + i] - start[3 + i]) * s for i in range(3)]
        else:
            s = (frac - u_frac) / (1.0 - u_frac)
            rot = [via[3 + i] + (to[3 + i] - via[3 + i]) * s for i in range(3)]
        poses.append([pos[0], pos[1], pos[2], rot[0], rot[1], rot[2]])
    return poses, ("位置按过三点的精确圆弧插值；姿态在旋转向量空间分段线性插值"
                   "（绕单轴时精确，一般情形是近似）。")


# ---------------------------------------------------------------------------
# 仿真的 I/O 与寄存器**内存态**（B3）
#
# 真机上 `set_digital_out` 与 `get_digital_out_bits` 是一对闭环，而仿真里两者过去都是
# `SIM_UNSUPPORTED` —— 于是"置位 → 读回 → 断言"这类教学/演示脚本根本写不出来。这里给每台
# 虚拟机器人一份内存态：
#   · **输出**：可写可读回（std 0-7 / config 8-15 / tool 0-1，位串按 UR 的全局编号 0-15）；
#   · **输入**：**没有生产者** —— 没有任何工具能设置输入，所以一律读 0/False，并在返回值里
#     如实写明原因（不假装有信号）；
#   · **寄存器**：int 24 / double 24 / bool 64，初值 0 / 0.0 / False。本插件没有"写寄存器"的
#     工具（只有读），所以它们在整个会话里恒为初值 —— 同样在返回值里写明。
#
# 状态挂在虚拟机器人**实例**上（`_dsh_io`），因此 `sim_stop` + `sim_start`（或宿主自愈重建
# 子进程后重建仿真）都会自动回到初始态，与"控制器重启"的语义一致，且不需要任何清理代码。
_SIM_IO_INIT = {
    "std_out": 0,
    "config_out": 0,
    "tool_out": 0,
    "analog_out": [0.0, 0.0],
    "int_reg": [0] * 24,
    "double_reg": [0.0] * 24,
    "bit_reg": [False] * 64,
}

_SIM_NO_INPUT_NOTE = "仿真没有输入信号源：没有任何工具能设置输入，因此恒为 0。"


def _sim_require(p, key, kind="值"):
    """仿真实现里取**必填**参数：缺了就明确报 BADARG，而不是抛 KeyError。

    真机句柄直接写 `p["n"]`，参数缺失时抛的是 KeyError —— 它会冒到 main() 的兜底分支、变成
    一句看不出原因的 HUGE 错误。仿真实现没必要重复这个毛病。
    """
    if key not in p or p[key] is None:
        raise WorkerError("BADARG", "仿真实现缺少必填参数 %s（%s）" % (key, kind))
    return p[key]


def _sim_io(sim):
    """取（惰性建）某台虚拟机器人的 I/O 内存态。"""
    state = getattr(sim, "_dsh_io", None)
    if state is None:
        state = {k: (list(v) if isinstance(v, list) else v) for k, v in _SIM_IO_INIT.items()}
        sim._dsh_io = state
    return state


def _sim_output_bits(state):
    """三组输出位拼成真机读回的那种位串：std 0-7 在前、config 8-15 在后。"""
    bits = [bool((state["std_out"] >> i) & 1) for i in range(8)]
    bits += [bool((state["config_out"] >> i) & 1) for i in range(8)]
    return bits


def _sim_set_digital_out(sim, p):
    which = str(p.get("which", "std")).lower()
    value = bool(_sim_require(p, "value", "布尔值"))
    state = _sim_io(sim)
    if which == "config":
        n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 8, 15, "config 端口号")
        key, offset = "config_out", n - 8
    elif which == "tool":
        n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 1, "tool 端口号")
        key, offset = "tool_out", n
    else:
        which = "std"
        n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 7, "std 端口号")
        key, offset = "std_out", n
    state[key] = (state[key] | (1 << offset)) if value else (state[key] & ~(1 << offset))
    return ok({"message": "已设置数字输出 %s.%d = %s（仿真的内存态）" % (which, n, value),
               "data": {"which": which, "port": n, "value": value, "ip": sim.ip,
                        "simulated": True, "memory_state": True}})


def _sim_get_digital_output_bits(sim, p):
    bits = _sim_output_bits(_sim_io(sim))
    return ok({"message": "数字输出位（std 0-7 + config 8-15，仿真的内存态）：%s" % bits,
               "data": {"bits": bits, "ip": sim.ip, "simulated": True, "memory_state": True}})


def _sim_get_digital_input_bits(sim, p):
    bits = [False] * 16
    return ok({"message": "数字输入位（std 0-7 + config 8-15）：%s" % bits,
               "data": {"bits": bits, "ip": sim.ip, "simulated": True,
                        "note": _SIM_NO_INPUT_NOTE}})


def _sim_get_digital_in(sim, p):
    which = str(p.get("which", "std")).lower()
    if which == "tool":
        n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 1, "tool 端口号")
    elif which == "config":
        n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 8, 15, "config 端口号")
    else:
        which, n = "std", _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 7, "std 端口号")
    return ok({"message": "False",
               "data": {"which": which, "port": n, "value": False, "ip": sim.ip,
                        "simulated": True, "note": _SIM_NO_INPUT_NOTE}})


def _sim_set_analog_out(sim, p):
    n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 1, "模拟输出端口号")
    full_scale = _bounded_float(p.get("full_scale", 10.0), "full_scale", 0.001, 1000.0,
                               "模拟输出满量程（电压域 10，电流域 20）")
    value = float(_sim_require(p, "value", "数值"))
    if not math.isfinite(value) or value < 0 or value > full_scale:
        raise WorkerError("BADARG", "模拟输出值必须在 [0, %s] 内且为有穷数值，收到 %s"
                          % (full_scale, value))
    _sim_io(sim)["analog_out"][n] = value
    return ok({"message": "已设置模拟输出 %d = %s（%s 域，仿真的内存态）"
               % (n, value, "电压" if full_scale == 10 else "电流"),
               "data": {"port": n, "value": value, "fraction": value / full_scale,
                        "full_scale": full_scale, "ip": sim.ip, "simulated": True,
                        "memory_state": True}})


def _sim_get_analog_in(sim, p):
    n = _bounded_int(_sim_require(p, "n", "端口号"), "n", 0, 1, "模拟输入端口号")
    return ok({"message": "0.0",
               "data": {"port": n, "value": 0.0, "ip": sim.ip, "simulated": True,
                        "note": _SIM_NO_INPUT_NOTE}})


def _sim_get_int_register(sim, p):
    idx = _bounded_int(_sim_require(p, "index", "寄存器下标"), "index", 0, 23, "int 寄存器下标")
    val = _sim_io(sim)["int_reg"][idx]
    return ok({"message": "%d" % val,
               "data": {"index": idx, "value": val, "ip": sim.ip, "simulated": True,
                        "note": "本插件没有写寄存器的工具：仿真里它恒为初值 0。"}})


def _sim_get_double_register(sim, p):
    idx = _bounded_int(_sim_require(p, "index", "寄存器下标"), "index", 0, 23, "double 寄存器下标")
    val = _sim_io(sim)["double_reg"][idx]
    return ok({"message": "%s" % val,
               "data": {"index": idx, "value": val, "ip": sim.ip, "simulated": True,
                        "note": "本插件没有写寄存器的工具：仿真里它恒为初值 0.0。"}})


def _sim_get_bit_register(sim, p):
    idx = _bounded_int(_sim_require(p, "index", "寄存器下标"), "index", 0, 63, "bool 寄存器下标")
    val = _sim_io(sim)["bit_reg"][idx]
    return ok({"message": "%s" % val,
               "data": {"index": idx, "value": val, "ip": sim.ip, "simulated": True,
                        "note": "本插件没有写寄存器的工具：仿真里它恒为初值 False。"}})


# ---------------------------------------------------------------------------
# 遥测的**运动学估算**（B1）
#
# 过去这一组 op 一律 `SIM_UNSUPPORTED`，于是仿真面板的遥测行在仿真下永远是空的。现在按**有限差分
# + 量级模型**给出估算值：关节速度/加速度由相邻两次采样差分得到，力矩/电流/电压/温度/受力再由一个
# 刻意粗的量级模型推出。
#
# ⚠️ 每一条返回值都带 `estimated: true` 与 `note`：这是**估算，不是测量**。没有控制器就没有 RTDE，
# 没有动力学就没有真实力矩 —— 把估算值当测量值用会得出错误结论，所以标注是这套实现的一部分，
# 不是可选的装饰。
_SIM_TELEMETRY_NOTE = (
    "由**运动学估算**，不是测量：本仿真没有控制器、没有动力学。关节速度/加速度来自相邻两次采样的"
    "有限差分，电流/电压/力矩/温度/受力再按一个量级模型推出。可用于演示与回归，不可用于工程判断。")

_SIM_AMBIENT_C = 28.0
_SIM_NOMINAL_VOLTAGE = 48.0
_SIM_TOOL_MASS_KG = 1.0  # 受力估算的名义负载
_SIM_TORQUE_PER_ACC = (12.0, 12.0, 9.0, 5.0, 4.0, 3.0)  # N·m per rad/s²
_SIM_AMPS_PER_TORQUE = (2.2, 2.2, 1.8, 1.2, 1.0, 0.8)  # A per N·m
_SIM_RATED_SPEED = (3.14, 3.14, 3.14, 3.2, 3.2, 3.2)  # rad/s


def _sim_telemetry_track(sim):
    """每台仿真各持一份采样历史（速度/加速度/TCP 速度靠它做差分，温度靠它积分）。"""
    track = getattr(sim, "_dsh_telemetry", None)
    if track is None:
        track = {"t": None, "q": None, "dq": None, "tcp": None, "tcp_speed": None,
                 "temp": [_SIM_AMBIENT_C] * 6}
        sim._dsh_telemetry = track
    return track


def _sim_estimate(sim):
    """估出这一时刻的"遥测"：关节速度/加速度、TCP 速度/加速度、力矩/电流/电压、温度、受力。"""
    now = time.monotonic()
    q = [float(x) for x in sim.advance()]
    tcp = [float(x) for x in _sim_pose(sim)]
    track = _sim_telemetry_track(sim)

    if track["t"] is None:
        dt, dq, ddq, tcp_speed = 0.0, [0.0] * 6, [0.0] * 6, [0.0] * 6
        tcp_acc = [0.0, 0.0, 0.0]
    else:
        dt = max(now - track["t"], 1e-3)
        dq = [(q[i] - track["q"][i]) / dt for i in range(6)]
        ddq = [(dq[i] - track["dq"][i]) / dt for i in range(6)]
        tcp_speed = [(tcp[i] - track["tcp"][i]) / dt for i in range(6)]
        tcp_acc = [(tcp_speed[i] - track["tcp_speed"][i]) / dt for i in range(3)]

    # 力矩 = 惯性项 + 速度项 + 抵消自身重量的静差；电流/关节电压按量级换算。
    torque = [abs(ddq[i]) * _SIM_TORQUE_PER_ACC[i]
              + abs(dq[i]) / _SIM_RATED_SPEED[i] * 3.0 + 1.5 for i in range(6)]
    current = [min(torque[i] * _SIM_AMPS_PER_TORQUE[i], 8.0) for i in range(6)]
    voltage = [max(6.0, abs(dq[i]) * 22.0 + 4.0) for i in range(6)]

    # 温度：向「环境 + 负载温升」一阶收敛（时间常数约 60 s —— 真机升温也是这个量级的慢过程）。
    if dt > 0:
        for i in range(6):
            target = _SIM_AMBIENT_C + 22.0 * min(current[i] / 6.0, 1.0)
            track["temp"][i] += (target - track["temp"][i]) * min(dt / 60.0, 1.0)

    # TCP 受力：名义负载的惯性力 + 重力反力；力矩部分按 0 报（估算不出来，就不编）。
    force = [_SIM_TOOL_MASS_KG * tcp_acc[i] for i in range(3)]
    force[2] -= _SIM_TOOL_MASS_KG * 9.81

    track.update({"t": now, "q": q, "dq": dq, "tcp": tcp, "tcp_speed": tcp_speed})
    return {
        "dq": dq,
        "tcp_speed": tcp_speed,
        "currents": current,
        "voltages": voltage,
        "temps": list(track["temp"]),
        "force": force + [0.0, 0.0, 0.0],
        "accel3": [tcp_acc[0], tcp_acc[1], tcp_acc[2] + 9.81],
        "robot_current": round(sum(current) * 0.6 + 0.4, 3),
        "momentum": round(sum(abs(x) for x in dq) * 0.35, 3),
    }


def _sim_get_runtime_telemetry(sim, p):
    est = _sim_estimate(sim)
    data = _sim_data(sim, {
        "joint_currents": est["currents"],
        "joint_voltages": est["voltages"],
        "joint_speeds": est["dq"],
        "tcp_speed": est["tcp_speed"],
        "tcp_force": est["force"],
        "tool_accelerometer": est["accel3"],
        "speed_scaling": float(sim.status()["speed_scaling"]),
        "momentum": est["momentum"],
        "robot_voltage": _SIM_NOMINAL_VOLTAGE,
        "robot_current": est["robot_current"],
        "joint_temperatures": est["temps"],
        "estimated": True,
        "note": _SIM_TELEMETRY_NOTE,
    })
    return ok({"message": "实时遥测（**仿真估算**，非测量）", "data": data})


def _sim_get_robot_current(sim, p):
    est = _sim_estimate(sim)
    return ok({"message": "%s（安培，仿真估算）" % est["robot_current"],
               "data": _sim_data(sim, {"robot_current": est["robot_current"],
                                       "estimated": True, "note": _SIM_TELEMETRY_NOTE})})


def _sim_get_robot_voltage(sim, p):
    _sim_estimate(sim)  # 推进采样历史，让相邻两次读数的估计保持一致
    return ok({"message": "%s（伏特，仿真估算）" % _SIM_NOMINAL_VOLTAGE,
               "data": _sim_data(sim, {"robot_voltage": _SIM_NOMINAL_VOLTAGE,
                                       "estimated": True, "note": _SIM_TELEMETRY_NOTE})})


def _sim_get_joint_temperatures(sim, p):
    est = _sim_estimate(sim)
    return ok({"message": "%s（摄氏度，仿真估算）" % [round(x, 2) for x in est["temps"]],
               "data": _sim_data(sim, {"joint_temperatures": est["temps"],
                                       "estimated": True, "note": _SIM_TELEMETRY_NOTE})})


def _sim_get_tcp_force(sim, p):
    est = _sim_estimate(sim)
    return ok({"message": "TCP 受力（仿真估算）：%s" % [round(x, 3) for x in est["force"]],
               "data": _sim_data(sim, {"tcp_force": est["force"], "estimated": True,
                                       "note": _SIM_TELEMETRY_NOTE})})


# op -> 处理函数（`sim_dispatch` 的唯一查找表）
SIM_OPS = {
    "get_joint_pose": _sim_get_joint_pose,
    "get_tcp_pose": _sim_get_tcp_pose,
    "get_robot_model": _sim_get_robot_model,
    "get_serial_number": _sim_get_serial_number,
    "get_software_version": _sim_get_software_version,
    "get_time": _sim_get_time,
    "get_robot_mode": _sim_get_robot_mode,
    "get_safety_mode": _sim_get_safety_mode,
    "get_program_state": _sim_get_program_state,
    "get_speed_scaling": _sim_get_speed_scaling,
    "status": _sim_status,
    "get_target_values": _sim_get_target_values,
    "movej": _sim_movej,
    "movel": _sim_movel,
    "movep": _sim_movep,
    "movec": _sim_movec,
    "servoj": _sim_servoj,
    "move_optimized": _sim_move_optimized,
    # 多段连续：一整条折线只排一次时间表（段间零停顿）—— 这是它相对"逐段调用"的全部区别。
    "run_sequence": _sim_run_sequence,
    "move_x": lambda sim, p: _sim_axis_move(sim, p, 0),
    "move_y": lambda sim, p: _sim_axis_move(sim, p, 1),
    "move_z": lambda sim, p: _sim_axis_move(sim, p, 2),
    "move_tool_x": lambda sim, p: _sim_tool_axis_move(sim, p, 0),
    "move_tool_y": lambda sim, p: _sim_tool_axis_move(sim, p, 1),
    "move_tool_z": lambda sim, p: _sim_tool_axis_move(sim, p, 2),
    "draw_circle": _sim_draw_circle,
    "draw_square": _sim_draw_square,
    "draw_rectangle": _sim_draw_rectangle,
    "draw_star": _sim_draw_star,
    "wait_steady": _sim_wait_steady,
    "stopj": lambda sim, p: _sim_stop(sim, p, "ur_stopj"),
    "stopl": lambda sim, p: _sim_stop(sim, p, "ur_stopl"),
    # B3：I/O 与寄存器的内存态 —— 输出可写可读回，输入没有生产者（一律 0），寄存器只有读口。
    "set_digital_out": _sim_set_digital_out,
    "get_digital_output_bits": _sim_get_digital_output_bits,
    "get_digital_input_bits": _sim_get_digital_input_bits,
    "get_digital_in": _sim_get_digital_in,
    "set_analog_out": _sim_set_analog_out,
    "get_analog_in": _sim_get_analog_in,
    "get_int_register": _sim_get_int_register,
    "get_double_register": _sim_get_double_register,
    "get_bit_register": _sim_get_bit_register,
    # B1：遥测的**运动学估算**（有限差分 + 量级模型；每条返回值都标注 estimated 与 note）
    "get_runtime_telemetry": _sim_get_runtime_telemetry,
    "get_robot_current": _sim_get_robot_current,
    "get_robot_voltage": _sim_get_robot_voltage,
    "get_joint_temperatures": _sim_get_joint_temperatures,
    "get_tcp_force": _sim_get_tcp_force,
}


def sim_dispatch(op, params):
    """把一条指令交给离线仿真；**不是仿真目标就返回 None**（调用方走真机路径）。

    这是"仿真绝不碰真机"的最后一道闸：只有在 `params['ip']` 确实是正在运行的仿真地址时
    才会走这里，其余一切照旧。
    """
    if not isinstance(params, dict):
        return None
    sim = _sim_entry(params.get("ip"))
    if sim is None:
        return None
    handler = SIM_OPS.get(op)
    if handler is None:
        return _sim_no_semantics(op)
    try:
        return handler(sim, params)
    except Exception as exc:  # SimError 家族的 code 一律以 SIM_ 开头
        code = getattr(exc, "code", None)
        if isinstance(code, str) and code.startswith("SIM_"):
            return err(str(exc), code, {"simulated": True, "ip": sim.ip})
        raise


def _sim_requested_ip(p):
    """解析**仿真类** op 的 `ip` 参数：缺省即保留地址；给了别的地址说明调用方搞错了对象。

    返回 `(ip, 错误结果或 None)`。**只认保留地址**：仿真永远不能指向一台真机。

    ⚠️ 真机模式（`REAL_MODE`）的分流**不在这里**：`connect`/`disconnect` 在进入仿真分支
    之前就按模式分给了 `_real_connect`/`_real_disconnect`（见各自的实现）。本函数只服务
    `sim_start`/`sim_stop`/`sim_status` 与 `_sim_connect`/`_sim_disconnect` —— 它们的目标
    永远是那台虚拟机器人，所以"只认保留地址"在这里仍然成立。
    """
    raw = p.get("ip")
    if raw is None or str(raw).strip() == "":
        return SIM_IP, None
    value = str(raw).strip()
    if value != SIM_IP:
        return None, err(
            "离线仿真只存在于保留地址 %s（收到 %r）。该地址是回环，真机控制器不可能在那里 —— "
            "要开仿真请用 ursim_sim_start，要连真机请填它的实际 IP。" % (SIM_IP, value), "SIM_BADARG")
    return value, None


def op_sim_start(p):
    """开启（或按新配置重建）离线仿真。"""
    ur = _sim_module()
    ip, problem = _sim_requested_ip(p)
    if problem is not None:
        return problem
    model = str(p["model"]).strip().lower()
    preset = str(p.get("preset", DEFAULT_SIM_PRESET)).strip().lower()
    speed = p.get("speed_scaling", 1.0)
    if ip != SIM_IP:
        return err("离线仿真只允许在保留地址 %s 上开启（收到 %r）。该地址是回环，"
                   "真机控制器不可能出现在那里 —— 这是「仿真碰不到真机」的结构性保证。"
                   % (SIM_IP, ip), "SIM_BADARG")
    if preset not in _SIM_PRESETS:
        return err("未知起始姿态 preset=%r；可用：%s" % (preset, "、".join(_SIM_PRESETS)),
                   "SIM_BADARG")
    try:
        sim = ur.VirtualRobot(ip, model, speed_scaling=speed, preset=preset)
    except Exception as exc:
        code = getattr(exc, "code", None)
        if not (isinstance(code, str) and code.startswith("SIM_")):
            code = "SIM_ERROR"
        return err(str(exc), code)
    SIMS[ip] = sim
    _sim_bump_epoch(ip)
    caps = sim_capabilities()
    return ok({
        "message": (
            "已开启离线仿真：ip=%s，型号 %s，起始姿态 %s，速度倍率 %.2f。\n"
            "后续所有 ursim_* 调用请带 ip=\"%s\"。仿真只实现**运动学**：运动类工具（%s 等）"
            "与位姿读回；其余指令会明确返回「无仿真语义」。"
            % (ip, ur.canonical_model_name(model), preset, sim.speed_scaling, ip,
               "、".join(caps["motion"][:6]))),
        "data": {
            "simulated": True,
            "active": True,
            "ip": ip,
            "model": ur.canonical_model_name(model),
            "model_id": model,
            "preset": preset,
            "speed_scaling": sim.speed_scaling,
            "capabilities": caps,
            "joint_positions": [float(x) for x in sim.advance()],
        },
    })


def op_sim_stop(p):
    """关闭离线仿真（幂等：本来没开也返回 ok）。"""
    ip, problem = _sim_requested_ip(p)
    if problem is not None:
        return problem
    sim = SIMS.pop(ip, None)
    if sim is None:
        return ok({"message": "离线仿真本来就没有开启。",
                   "data": {"simulated": False, "active": False, "ip": SIM_IP}})
    _sim_bump_epoch(ip)
    return ok({"message": "离线仿真已关闭（%s · %s）。"
                                  % (ip, _sim_module().canonical_model_name(sim.model)),
               "data": {"simulated": False, "active": False, "ip": SIM_IP}})


def op_sim_status(p):
    """读取离线仿真的当前状态（面板的开关据此同步；工具侧用于"到底开没开"）。"""
    ip, problem = _sim_requested_ip(p)
    if problem is not None:
        return problem
    sim = SIMS.get(ip)
    caps = sim_capabilities()
    if sim is None:
        return ok({"message": "离线仿真未开启。可用 ursim_sim_start（model=...）开启。",
                   "data": {"simulated": False, "active": False, "ip": SIM_IP,
                            "models": _sim_module().model_ids(), "capabilities": caps}})
    data = sim.status()
    data.update({"active": True, "models": _sim_module().model_ids(), "capabilities": caps,
                 "preset": getattr(sim, "preset_name", "zero")})
    return ok({"message": "离线仿真运行中：ip=%s，型号 %s。" % (ip, data["robot_model"]),
               "data": data})


HANDLERS = {
    "connect": op_connect,
    "disconnect": op_disconnect,
    "status": op_status,
    "get_tcp_pose": op_get_tcp_pose,
    "get_joint_pose": op_get_joint_pose,
    "get_robot_model": op_get_robot_model,
    "get_serial_number": op_get_serial_number,
    "get_time": op_get_time,
    "get_software_version": op_get_software_version,
    "get_safety_mode": op_get_safety_mode,
    "get_safety_status": op_get_safety_status,
    "get_robot_mode": op_get_robot_mode,
    "get_program_state": op_get_program_state,
    "get_robot_current": op_get_robot_current,
    "get_robot_voltage": op_get_robot_voltage,
    "get_joint_temperatures": op_get_joint_temperatures,
    "get_int_register": op_get_int_register,
    "get_double_register": op_get_double_register,
    "get_bit_register": op_get_bit_register,
    "list_programs": op_list_programs,
    "send_script": op_send_script,
    "movej": op_movej,
    "movel": op_movel,
    "move_x": op_move_x,
    "move_y": op_move_y,
    "move_z": op_move_z,
    # 工具坐标系方向（worker 侧用旋转矩阵换算成基座系位移，不依赖 URScript 的 pose_trans）
    "move_tool_x": op_move_tool_x,
    "move_tool_y": op_move_tool_y,
    "move_tool_z": op_move_tool_z,
    "draw_circle": op_draw_circle,
    "draw_square": op_draw_square,
    "draw_rectangle": op_draw_rectangle,
    "draw_star": op_draw_star,
    "load_program": op_load_program,
    "run_program": op_run_program,
    "stop_program": op_stop_program,
    "pause_program": op_pause_program,
    "reset_error": op_reset_error,
    "ping": op_ping,
    "get_digital_in": op_get_digital_in,
    "set_digital_out": op_set_digital_out,
    "get_analog_in": op_get_analog_in,
    "set_analog_out": op_set_analog_out,
    "set_tool_voltage": op_set_tool_voltage,
    "set_tcp": op_set_tcp,
    "set_payload": op_set_payload,
    "movep": op_movep,
    "movec": op_movec,
    "run_sequence": op_run_sequence,
    "servoj": op_servoj,
    # ── 力控 / 速度控制 / 目标值（0.6.0，手册 15.x / 16.x / 18.x 交叉核对后新增）──
    "force_mode": op_force_mode,
    "end_force_mode": op_end_force_mode,
    "force_mode_settings": op_force_mode_settings,
    "speedj": op_speedj,
    "speedl": op_speedl,
    "stopj": op_stopj,
    "stopl": op_stopl,
    "wait_steady": op_wait_steady,
    "get_target_values": op_get_target_values,
    "tool_communication": op_tool_communication,
    "set_tool_output_mode": op_set_tool_output_mode,
    "set_payload_inertia": op_set_payload_inertia,
    "get_tool_telemetry": op_get_tool_telemetry,
    # OptiMove（jerk 受限的平滑运动）与 Motion Version 设置
    "move_optimized": op_move_optimized,
    "motion_version": op_motion_version,
    "get_freedrive_status": op_get_freedrive_status,
    "get_digital_input_bits": op_get_digital_input_bits,
    "get_digital_output_bits": op_get_digital_output_bits,
    "get_conveyor": op_get_conveyor,
    "set_conveyor_tick": op_set_conveyor_tick,
    # ── 新增能力（0.5.0）───────────────────────────────────────────────────
    # 控制模式 / 电源 / 安全
    "set_freedrive": op_set_freedrive,
    "set_teach_mode": op_set_teach_mode,
    "power_on": op_power_on,
    "power_off": op_power_off,
    "brake_release": op_brake_release,
    "unlock_protective_stop": op_unlock_protective_stop,
    "shutdown": op_shutdown,
    # 实时遥测（字段本来就在 RTDE 数据流里）
    "get_runtime_telemetry": op_get_runtime_telemetry,
    "get_speed_scaling": op_get_speed_scaling,
    "get_tcp_force": op_get_tcp_force,
    # 配置 / 工具端 I/O / 传送带跟踪
    "set_gravity": op_set_gravity,
    "zero_ftsensor": op_zero_ftsensor,
    "get_tool_analog_in": op_get_tool_analog_in,
    "conveyor_tracking": op_conveyor_tracking,
    # 优雅退出（host 侧 dispose 前调用；见 op_shutdown_worker 的说明）。
    # ⚠️ 名字不能是 "shutdown" —— 那是**关闭控制器**（上面 op_shutdown）。两者曾经撞名，
    # 表现是 `shutdown` 这个 op 被解析成"关闭控制器"，于是既报 KeyError: 'ip'，
    # 又永远不会真的退出 worker（worker.js 的优雅关闭因此只能靠超时收场）。
    "shutdown_worker": op_shutdown_worker,
    # 离线仿真（运动学级）：启停与状态。**其余仿真指令不在 HANDLERS 里** —— 它们由
    # `sim_dispatch()` 在派发前拦截（见 main()），因为是否走仿真取决于 `ip` 而不是 op。
    "sim_start": op_sim_start,
    "sim_stop": op_sim_stop,
    "sim_status": op_sim_status,
}


def _write_protocol_line(body):
    """写一行协议 JSON —— 响应与主动推送共用，必须整行原子（见 `_PROTOCOL_LOCK`）。"""
    line = (body + "\n").encode("utf-8")
    with _PROTOCOL_LOCK:
        buf = getattr(_PROTOCOL_OUT, "buffer", None)
        if buf is not None:
            buf.write(line)
            buf.flush()
        else:
            _PROTOCOL_OUT.write(line.decode("utf-8"))
            _PROTOCOL_OUT.flush()


def respond(payload):
    # Write UTF-8 bytes on the raw buffer so locale text encodings (e.g. GBK on
    # Chinese Windows) can never corrupt or reject the JSON. Node's readline
    # decodes the pipe as UTF-8, so Chinese values round-trip cleanly.
    #
    # `allow_nan=False`：Python 默认把 NaN/Infinity 写成 `NaN`/`Infinity`，那**不是合法
    # JSON** —— Node 的 JSON.parse 会抛，而 lib/worker.js 的 `_onLine` 对解析失败的行
    # 是静默丢弃的，调用方只会看到一句笼统的 "timed out"。宁可在这里大声失败
    # （由 main() 的 except 兜住并回报一个可读错误）。
    body = json.dumps(payload, ensure_ascii=False, default=_json_default, allow_nan=False)
    _write_protocol_line(body)


# ---------------------------------------------------------------------------
# 仿真遥测主动推送 —— 数字仿真"完整跟随机器人动作"的关键
# ---------------------------------------------------------------------------
#
# 为什么必须有：本 worker 是单线程 stdin 队列，运动类工具（`_movej_confirm` /
# `_wait_robot_idle` 的确认循环）会一直占着它，仿真的读因此排在后面并超时 ——
# 用户看到的是「数据已停止更新 Ns」。但遥测数据本身**从来没有停过**：RTDE 由
# URBasic 的后台线程以 500 Hz 持续写入 `model.dataDir`，读它与 stdin 队列无关。
#
# 所以遥测改由这里**主动推送**：推送行不带 `id`，与"请求/响应"天然区分，旧宿主
# 只会把它记成一条无法匹配的响应（无副作用），因此协议向后兼容。

# 推送节拍：仿真 SSE 每 100 ms 一帧，20 Hz 足够让每一帧都拿到新鲜读数。
TWIN_PUSH_INTERVAL_S = 0.05

# 推送线程开关（诊断可用 DSH_URSIM_TWIN_PUSH=0 关掉，便于对比"有没有推送"的行为差异）。
TWIN_PUSH_DISABLED = os.environ.get("DSH_URSIM_TWIN_PUSH", "").strip().lower() in ("0", "off", "false", "no")


def _twin_push_snapshot(ip):
    """只读 RTDE 接收缓存，返回 ``{"q": […6], "tcp": […6]}``；拿不到就返回 None。

    **绝不走命令队列、绝不做网络往返**：这正是它能在机器人运动期间继续出数的原因。
    字段优先取原始 RTDE 数据（`_rtde_field`，零往返），缺失时回退到 URBasic 访问器。

    ## 存活门（0.7.0）：会话死了就**闭嘴**，绝不拿旧缓存冒充新读数

    `_rtde_field` 读的是 `model.dataDir` 里**最后一笔**写入值 —— 它在 RTDE 掉线后依然存在。
    于是会话断掉（机器人被换掉 / 断电 / 网线拔了）时，推送线程会继续用**当下的时间戳**
    发**掉线前**的关节角：宿主的仿真于是看起来一切正常，实际冻在最后一帧，而且因为推送
    一直"新鲜"，宿主永远不会回退到显式读 —— 而**显式读才是会重连、从而发现"换了一台
    机器人"的那条路**。所以：RTDE 接收循环不在跑，就一帧都不推。

    这也顺带修掉了"型号永远停在旧值"：停推 ⇒ 宿主发起显式读 ⇒ `ensure_connected`
    重建连接（`ROBOT_CONN_SEQ` +1）⇒ 宿主按新代次重读型号 ⇒ 仿真换模型。

    ## 离线仿真（0.7.0）
    仿真是**纯内存状态、纯函数式推进**（`ur_sim.VirtualRobot.advance()` 按墙上时钟算 q），
    所以这里直接取它的一帧即可：零往返、零副作用，而且与真机共用同一条推送通道 ——
    于是仿真面板、SSE、陈旧检测那一整套逻辑对仿真**一行都不用改**。
    """
    sim = SIMS.get(ip)
    if sim is not None:
        return sim.snapshot()
    if not is_connected(ip):
        return None
    robot = ROBOTS.get(ip)
    if robot is None:
        return None
    model = ROBOT_MODELS.get(ip)
    q = _rtde_field(model, "actual_q") if model is not None else None
    tcp = _rtde_field(model, "actual_TCP_pose") if model is not None else None
    if q is None:
        try:
            q = robot.get_actual_joint_positions()
        except Exception:
            return None
    if tcp is None:
        try:
            tcp = robot.get_actual_tcp_pose()
        except Exception:
            return None
    try:
        q = [float(x) for x in q]
        tcp = [float(x) for x in tcp]
    except Exception:
        return None
    if len(q) < 6 or len(tcp) < 6:
        return None
    return {"q": q[:6], "tcp": tcp[:6]}


def _twin_push_loop():
    """后台推送线程：周期性把每台已连接机器人（以及离线仿真）的姿态写成一行协议 JSON。

    行里**没有 `id`** —— 这是与响应区分开的唯一标志，Node 侧据此把它当推送处理
    （见 lib/worker.js 的 `_onLine`）。任何异常都不允许打死这条线程，更不允许影响主协议。
    """
    while True:
        time.sleep(TWIN_PUSH_INTERVAL_S)
        try:
            # 仿真地址不在 ROBOTS 里（它没有 socket），所以两份注册表都要遍历；去重交给
            # `_twin_push_snapshot` 自己的分流（同一个 ip 不可能同时在两边）。
            for ip in list(ROBOTS.keys()) + [addr for addr in SIMS.keys() if addr not in ROBOTS]:
                snapshot = _twin_push_snapshot(ip)
                if snapshot is None:
                    continue
                sim = SIMS.get(ip)
                _write_protocol_line(json.dumps({
                    "push": "telemetry",
                    "ip": ip,
                    # 连接代次：宿主用它与"按 IP 记住的型号"对账，代次变了就重读型号
                    # （同一 IP 换了一台别的型号 / 仿真启停 = 代次变了）。
                    #
                    # ⚠️ **仿真也必须给代次**：仿真没有 RTDE 连接，`ROBOT_CONN_SEQ` 里没有
                    # 这条记录，于是 `conn` 曾是 null ⇒ 宿主 `connectionEpoch()` 得到
                    # `undefined` ⇒ 退回**按 10 s TTL 重读型号**（`TWIN_MODEL_TTL_MS`）。
                    # 而那次重读要排进单线程 stdin 队列：机器人一动，读就排队到 2.5 s 预算
                    # 耗尽，这一帧退化成"回放上一帧"（`ts` 不前进）—— 界面于是显示
                    # 「数据已停止更新 Ns」并反复重建通道，画面一顿一顿。
                    # 仿真的代次取**该虚拟机器人的创建时刻**：同一次仿真内恒定（稳态零多余
                    # 往返），启停/重建即变化（型号缓存正确失效）。
                    "conn": ROBOT_CONN_SEQ.get(ip) if sim is None else round(sim.created_at, 3),
                    # 这一帧来自离线仿真吗？（宿主/界面据此打仿真水印；真机帧不带此字段）
                    **({"simulated": True} if sim is not None else {}),
                    "ts": int(time.time() * 1000),
                    "data": snapshot,
                }, ensure_ascii=False, default=_json_default, allow_nan=False))
        except Exception:
            continue


def selfcheck():
    """Validate the Python runtime without touching a robot.

    Runs `python ur_worker.py --selfcheck`. Prints a JSON summary to the real
    stdout and returns 0 when the required pieces are present.
    """
    results = {
        "python": sys.version.split()[0],
        "urbasic": True,
        "numpy": None,
        "paramiko": None,
        "rtde_config_exists": None,
    }
    try:
        import numpy
        results["numpy"] = numpy.__version__
    except Exception as e:
        results["numpy"] = "ERROR: %s" % e
        results["urbasic"] = False
    try:
        import paramiko
        results["paramiko"] = paramiko.__version__
    except Exception as e:
        results["paramiko"] = "ERROR: %s" % e

    # rtde.py resolves URBasic/rtdeConfiguration.xml first and only falls back to the
    # vendored ...Default.xml. The **preferred** file is the one that must be present:
    # without it no input recipe reaches the controller and every RTDE write dies with
    # AttributeError on `__rtde_input_config.names`. Checking the fallback alone is what
    # let this selfcheck pass while that outage was live.
    rtde_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "URBasic")
    results["rtde_config_exists"] = os.path.isfile(os.path.join(rtde_dir, "rtdeConfiguration.xml"))
    results["rtde_config_fallback_exists"] = os.path.isfile(
        os.path.join(rtde_dir, "rtdeConfigurationDefault.xml"))

    # URBasic is imported at module load — reaching here proves it is present.
    _PROTOCOL_OUT.write(json.dumps(results, ensure_ascii=False) + "\n")
    _PROTOCOL_OUT.flush()

    ok = (isinstance(results["numpy"], str) and results["numpy"][0].isdigit()
          and isinstance(results["paramiko"], str) and results["paramiko"][0].isdigit()
          and results["rtde_config_exists"] and results["urbasic"])
    return 0 if ok else 1


def _pin_sim_ip(params):
    """收口 `ip`：仿真模式下钉死在保留地址；**真机模式**下只要求显式给出。

    ⚠️ 运行模式由宿主通过环境变量 `DSH_URSIM_MODE` 传入（见 `lib/worker.js` 的 `_spawnOnce`），
    默认 `sim`：

      · `sim`（默认，纯离线仿真）：真机 IP 在派发**之前**就被拒绝，因此 URBasic 的 RTDE /
        Dashboard / RealTime、SSH 程序列表、远程控制探测那一整套真机通道**永远不可达**
        （不是"有但不用"，是"到不了"）。
      · `real`（**必须由使用者显式开启**，见 README 的「真机通道」一节）：ip 必须显式给出
        （缺省在仿真模式下意味着"那台虚拟机器人"，真机模式下不该有这个便利），而"允许去哪台
        机器人"由宿主侧白名单判定（见 `lib/index.js` 的 `realRobotIps`）—— 本层只保证
        "目标是写出来的"，不负责授权。

    返回错误结果（调用方直接回报）或 None（可以继续）。
    """
    raw = params.get("ip")
    if REAL_MODE:
        if raw is None or str(raw).strip() == "":
            return err(
                "真机模式（DSH_URSIM_MODE=real）必须显式提供 ip —— 缺省地址只属于仿真模式。",
                "BADARG")
        params["ip"] = str(raw).strip()
        return None
    if raw is None or str(raw).strip() == "":
        params["ip"] = SIM_IP
        return None
    value = str(raw).strip()
    if value == SIM_IP:
        params["ip"] = SIM_IP
        return None
    return err(
        "%r 不是本插件的目标：dsh-nonead-ursim 只操作**离线仿真**机器人（保留地址 %s），"
        "不存在任何真机通道。请省略 ip，或显式传 %s。" % (value, SIM_IP, SIM_IP),
        "SIM_BADARG", {"simulated": True, "ip": SIM_IP})


def _ensure_sim_ready():
    """确保仿真在跑：没开就按默认（UR12e / 全零位 / 倍率 1）开一台。

    用户裁定：调用任何工具都不该要求先连真机、也不该要求先手工开仿真 ——
    「使用不依靠任何真机」就是**直接发指令就能动**。

    返回错误结果（起不来；调用方如实回报，绝不退回去碰真机）或 None（已就绪）。
    """
    if SIMS.get(SIM_IP) is not None:
        return None
    started = op_sim_start({"ip": SIM_IP, "model": DEFAULT_SIM_MODEL,
                            "preset": DEFAULT_SIM_PRESET,
                            "speed_scaling": DEFAULT_SIM_SCALING})
    if isinstance(started, dict) and "error" in started:
        return started
    return None


def route_op(op_name, params):
    """纯仿真插件的主路由。

    返回结果 dict，或 None 表示"交给 HANDLERS"（只可能是 `SIM_PASSTHROUGH_OPS` 里的 op）。

    为什么要有这一层：本插件的模型视野里仍然保留真机语义的那 40 多个工具名（用户裁定
    "保留工具名，只回报仿真不支持"），但**真机实现一行都不许被调用**。所以：
      1. `ip` 先收口（非保留地址 ⇒ 直接拒绝）；
      2. 再确保仿真在跑（自动就绪）；
      3. 最后交给 `sim_dispatch()` —— 命中的要么是仿真实现，要么是 `SIM_UNSUPPORTED`，
         两者都不可能碰到真机。
    """
    if op_name in SIM_PASSTHROUGH_OPS:
        return None
    if op_name not in HANDLERS:
        raise WorkerError("BADARG", "未知操作：%s" % op_name)
    problem = _pin_sim_ip(params)
    if problem is not None:
        return problem
    if REAL_MODE and params.get("ip") != SIM_IP:
        # 真机模式（路线图 A）：非保留地址交给 HANDLERS 的真机实现。
        #
        # ⚠️ 保留回环地址在**两种模式**下都表示"那台虚拟机器人"，绝不交给真机实现 —— 否则
        # `127.0.0.1` 会去连本机的 RTDE/Dashboard，把"把真控制器端口转发到环回"这条
        # 审计里点名的绕过路径重新打开。
        return None
    not_ready = _ensure_sim_ready()
    if not_ready is not None:
        return not_ready
    return sim_dispatch(op_name, params)


def main():
    global _CURRENT_REQUEST_ID, _CURRENT_TIMEOUT_MS
    # 协议是 UTF-8（见 `respond` / `_write_protocol_line`），但 Python 的 stdin **默认跟
    # locale**：中文 Windows 上是 GBK + `errors='surrogateescape'`。宿主按 UTF-8 写、这边按
    # GBK 解 ⇒ 非 ASCII 参数被静默损坏成代理字符；回包时 `.encode('utf-8')` 抛
    # UnicodeEncodeError —— **而那时副作用（运动/I/O）已经发生**。
    # `lib/worker.js` 的 spawn env 已设 `PYTHONUTF8=1`；这里再做一层显式收口，保证任何启动
    # 方式（包括手工 `python ur_worker.py` 接管道）都按 UTF-8 读。旧解释器没有 reconfigure
    # 时忽略此步（PYTHONUTF8 那条仍然生效）。
    try:
        sys.stdin.reconfigure(encoding="utf-8", errors="strict")
    except Exception:
        pass
    # 仿真遥测的推送线程：与运动命令**并行**（RTDE 缓存由 URBasic 自己的接收线程更新），
    # 所以机器人运动期间仿真照样有数据。daemon=True：主线程退出即随之结束。
    if not TWIN_PUSH_DISABLED:
        threading.Thread(target=_twin_push_loop, name="twin-push", daemon=True).start()
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            # 供 _connect_or_exit() 在自杀前回报「哪一条请求、什么原因」。
            _CURRENT_REQUEST_ID = req_id
            _CURRENT_TIMEOUT_MS = req.get("_timeout_ms")
            op_name = req.get("op")
            params = {k: v for k, v in req.items() if k not in ("id", "op")}
            # 纯仿真路由：本插件只操作离线仿真机器人（`route_op` 的说明）。
            # 只有 `SIM_PASSTHROUGH_OPS`（仿真启停/状态、ping、优雅退出、connect/disconnect）
            # 会落回 HANDLERS；其余一切都在仿真里解决，真机实现不可达。
            data = route_op(op_name, params)
            if data is None:
                handler = HANDLERS.get(op_name)
                if handler is None:
                    raise WorkerError("BADARG", "未知操作：%s" % op_name)
                data = handler(params)
            if isinstance(data, dict) and "error" in data:
                respond({"id": req_id, "ok": False, "data": data.get("data"),
                         "error": data["error"], "code": data.get("code", "HUGE")})
            else:
                respond({"id": req_id, "ok": True, "data": data})
            # 优雅退出：应答已经写出去，再让进程稍后消失（见 _exit_soon 的说明）。
            if op_name == "shutdown_worker":
                _exit_soon(0)
        except WorkerError as exc:
            # 业务异常：已有稳定错误码，直接回报（完整栈写日志，协议行保持简短）。
            _log("WorkerError %s: %s\n%s" % (exc.code, exc, traceback.format_exc()))
            respond({"id": req_id, "ok": False, "data": exc.data,
                     "error": str(exc), "code": exc.code})
        except Exception as exc:
            # 未预料的异常：**完整栈进日志**（旧实现只取 limit=1，库里抛出的
            # AttributeError 会丢掉所有上下文，实际排障时等于没有信息），协议行只回
            # 一句可读的摘要 + 稳定错误码。
            _log("未处理异常（op=%s）：\n%s" % (req.get("op") if isinstance(req, dict) else "?",
                                            traceback.format_exc()))
            respond({"id": req_id, "ok": False, "data": None,
                     "error": "%s: %s" % (type(exc).__name__, exc),
                     "code": _error_code_for(exc)})


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selfcheck":
        sys.exit(selfcheck())
    main()


