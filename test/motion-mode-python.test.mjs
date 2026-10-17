/**
 * test/motion-mode-python.test.mjs — 运行模式在 **Python 侧**的收口（路线图 A）。
 *
 * 为什么单独一个文件：`sim` 模式的结构性保证（真机 IP 在派发前被拒）与 `real` 模式的开闸
 * （允许真实地址、不自动开仿真）都发生在 `python/ur_worker.py` 里，而它是宿主之外的进程。
 * 这里用真的 Python 驱动 `_pin_sim_ip` / `route_op`，**两个方向都断言**：
 *   · `sim`（默认）：真实地址 ⇒ SIM_BADARG；
 *   · `real`（显式开启）：真实地址 ⇒ 不再是错误（授权交给宿主白名单），且**不**自动开仿真。
 *
 * 运行：node --test test/motion-mode-python.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url));

const HARNESS = `
import json, os, sys, tempfile, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(tempfile.mkdtemp(prefix="ur-mode-"), "t.log"), 4096)
sys.stdout = ur_worker._LOG

out = {}
out["mode"] = ur_worker.MOTION_MODE
out["real_mode"] = ur_worker.REAL_MODE

# ① 缺省 ip：仿真模式下意味着"那台虚拟机器人"；真机模式下必须是**非法输入**。
out["no_ip_error"] = (ur_worker._pin_sim_ip({}) or {}).get("error") is not None

# ② 真实地址：仿真模式拒绝（SIM_BADARG），真机模式放行（授权归宿主白名单）。
p = {"ip": "192.168.1.10"}
problem = ur_worker._pin_sim_ip(p)
out["real_ip_code"] = None if problem is None else problem.get("code")
out["ip_after"] = p.get("ip")

# ③ route_op 在真机模式下**不进仿真**：返回 None（交给 HANDLERS），且不自动开仿真。
ur_worker.SIMS.clear()
out["route_is_none"] = ur_worker.route_op("get_joint_pose", {"ip": "192.168.1.10"}) is None
out["sim_not_started"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is None

# ④ 但**保留回环地址在两种模式下都表示仿真**（绝不交给真机实现 —— 否则"把真控制器端口转发到
#    环回"那条绕过路径就被重新打开了）。
out["sim_ip_goes_to_sim"] = ur_worker.route_op("get_joint_pose", {"ip": ur_worker.SIM_IP}) is not None
out["sim_started_for_sim_ip"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is not None

# ⑤ connect/disconnect 的分支选择（P1-4）：real 模式走真机语义，sim 模式逐字节不变。
#    ⚠️ 全程用桩：测试绝不真连机器人（ensure_connected / dashboard / 远程控制探测全替换）。
class _Connector:
    def __init__(self):
        self.closed = 0
    def close(self):
        self.closed += 1

class _Robot:
    def __init__(self):
        self.robotConnector = _Connector()

_real_robot = _Robot()
_ensure_calls = []

def _fake_ensure(ip):
    _ensure_calls.append(ip)
    return _real_robot, object()

ur_worker.ensure_connected = _fake_ensure
ur_worker.dashboard = lambda ip: object()
ur_worker._remote_control = lambda d: (True, "true")
ur_worker._dashboard_cmd = lambda ip, cmd: (True, "UR12e")

REAL_IP = "192.168.1.10"
ur_worker.SIMS.clear()          # 从干净状态观察"connect 会不会顺手开仿真"

# 真实地址的 connect：sim 模式下必须仍是 SIM_BADARG；real 模式下必须走真机语义。
_conn_real = ur_worker.HANDLERS["connect"]({"ip": REAL_IP})
out["connect_real_ip"] = {
    "code": _conn_real.get("code"),
    "ensure_called": len(_ensure_calls),
    "data_ip": (_conn_real.get("data") or {}).get("ip"),
    "connected": (_conn_real.get("data") or {}).get("connected"),
    "remote_control": (_conn_real.get("data") or {}).get("remote_control"),
    "sim_created": ur_worker.SIMS.get(ur_worker.SIM_IP) is not None,
}

# 缺省 ip：sim 模式 = 那台虚拟机器人；real 模式必须非法（缺省地址只属于仿真模式）。
_conn_default = ur_worker.HANDLERS["connect"]({})
out["connect_default"] = {
    "code": _conn_default.get("code"),
    "simulated": (_conn_default.get("data") or {}).get("simulated"),
}

# 保留回环地址在两种模式下都走仿真（绝不交给真机实现）。
_loop = ur_worker.HANDLERS["connect"]({"ip": ur_worker.SIM_IP})
out["connect_loopback"] = {
    "simulated": (_loop.get("data") or {}).get("simulated"),
    "ensure_calls": len(_ensure_calls),
}

# disconnect：real 模式下必须关真机会话并摘句柄；sim 模式下仍是仿真语义（拒绝真机地址）。
ur_worker.ROBOTS[REAL_IP] = _real_robot
ur_worker.ROBOT_MODELS[REAL_IP] = object()
_disc = ur_worker.HANDLERS["disconnect"]({"ip": REAL_IP})
out["disconnect_real_ip"] = {
    "code": _disc.get("code"),
    "closed": _real_robot.robotConnector.closed,
    "removed": REAL_IP not in ur_worker.ROBOTS,
    "sim_still_active": ur_worker.SIMS.get(ur_worker.SIM_IP) is not None,
}

ur_worker._PROTOCOL_OUT.write(json.dumps(out) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`;

/** 在给定模式下跑一次探针，返回它打印的 JSON。 */
function probe(mode) {
  const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
    encoding: 'utf8',
    timeout: 60000,
    env: {
      ...process.env,
      PYTHONPATH: pythonDir,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8',
      DSH_URSIM_MODE: mode,
    },
  });
  assert.equal(child.status, 0, `探针失败（${mode}）：${child.stderr}`);
  const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'));
  assert.ok(line, `未拿到 JSON 结果（${mode}）：${JSON.stringify(child.stdout)}`);
  return JSON.parse(line);
}

test('默认（不设 DSH_URSIM_MODE）＝ sim：真机地址在派发前被拒，且不自动开仿真', () => {
  const got = probe('sim');
  assert.equal(got.mode, 'sim');
  assert.equal(got.real_mode, false);
  assert.equal(got.real_ip_code, 'SIM_BADARG', '仿真模式下真实地址必须以 SIM_BADARG 拒绝');
  assert.equal(got.no_ip_error, false, '仿真模式下缺省 ip 是合法的（指向那台虚拟机器人）');

  // ── P1-4：sim 模式下 connect/disconnect 必须是**仿真语义**（逐字节保持原行为） ──
  assert.equal(got.connect_real_ip.code, 'SIM_BADARG',
    'sim 模式下 connect(真机地址) 仍必须报 SIM_BADARG');
  assert.equal(got.connect_real_ip.ensure_called, 0,
    'sim 模式绝不允许触碰真机连接器');
  assert.equal(got.connect_default.code, null, 'sim 模式下缺省 ip 的 connect 必须成功');
  assert.equal(got.connect_default.simulated, true, 'sim 模式下 connect 必须走仿真');
  assert.equal(got.connect_loopback.simulated, true, 'sim 模式下保留地址仍然走仿真');
  assert.equal(got.disconnect_real_ip.code, 'SIM_BADARG',
    'sim 模式下 disconnect(真机地址) 仍必须被拒');
  assert.equal(got.disconnect_real_ip.closed, 0, 'sim 模式绝不允许关闭真机会话');
});

test('★ real 模式：真实地址不再被拒、缺省 ip 变成非法、且绝不自动开仿真', () => {
  const got = probe('real');
  assert.equal(got.mode, 'real');
  assert.equal(got.real_mode, true);
  assert.equal(got.real_ip_code, null, '★ 真机模式下真实地址必须能通过 Python 侧收口（授权在宿主白名单）');
  assert.equal(got.ip_after, '192.168.1.10', 'ip 必须原样保留（不得被改写成保留回环地址）');
  assert.equal(got.no_ip_error, true, '★ 真机模式下缺省 ip 必须非法 —— 缺省地址只属于仿真模式');
  assert.equal(got.route_is_none, true, '真机模式下 route_op 必须返回 None（交给 HANDLERS 的真机实现）');
  assert.equal(got.sim_not_started, true, '★ 真机模式下 route_op 不得顺手把仿真开起来');
  assert.equal(
    got.sim_ip_goes_to_sim,
    true,
    '★ 保留回环地址在真机模式下仍必须走仿真（否则 127.0.0.1 会去连真控制器）',
  );
  assert.equal(got.sim_started_for_sim_ip, true, '保留地址的调用照旧自动就绪仿真');

  // ── P1-4：real 模式下 connect/disconnect 必须走**真机语义**（桩，不真连） ──
  assert.equal(got.connect_real_ip.code, null,
    '★ real 模式下 connect(真机地址) 不能再被 SIM_BADARG 拒绝（旧实现与实际分支矛盾）');
  assert.equal(got.connect_real_ip.ensure_called, 1,
    '★ 必须复用 ensure_connected 建立真机会话');
  assert.equal(got.connect_real_ip.data_ip, '192.168.1.10', '回包必须带真实 IP');
  assert.equal(got.connect_real_ip.connected, true);
  assert.equal(got.connect_real_ip.remote_control, true,
    '必须回报远程控制模式的三态探测结果（不在远程模式时运动指令会被静默丢弃）');
  assert.equal(got.connect_real_ip.sim_created, false, '真机 connect 不得顺手开仿真');
  assert.equal(got.connect_default.code, 'BADARG',
    '★ real 模式下缺省 ip 必须非法（缺省地址只属于仿真模式）');
  assert.equal(got.connect_loopback.simulated, true,
    '★ 保留回环地址在 real 模式下仍必须走仿真（绝不交给真机实现）');
  assert.equal(got.connect_loopback.ensure_calls, 1,
    '保留地址走仿真时不得再多调一次真机连接器');
  assert.equal(got.disconnect_real_ip.code, null,
    '★ real 模式下 disconnect 必须走真机语义（真机部署原先没有主动释放 RTDE 的入口）');
  assert.equal(got.disconnect_real_ip.closed, 1,
    '★ 必须关闭 robotConnector（RTDE/Dashboard/RealTime 三路会话）');
  assert.equal(got.disconnect_real_ip.removed, true, '必须摘掉 ROBOTS 里的句柄');
  assert.equal(got.disconnect_real_ip.sim_still_active, true,
    '真机 disconnect 不得动离线仿真');
});
