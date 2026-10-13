/**
 * test/sim-telemetry.test.mjs — 遥测的**运动学估算**（路线图 B1）。
 *
 * 过去 `get_runtime_telemetry` / `get_robot_current` / `get_robot_voltage` /
 * `get_joint_temperatures` / `get_tcp_force` 在仿真里一律 `SIM_UNSUPPORTED`，于是孪生面板的遥测行
 * 永远是空的。B1 之后它们返回**估算值**（有限差分 + 量级模型），并且每一条都带 `estimated: true`
 * 与 `note` —— 估算不是测量，标注是这套实现的一部分。
 *
 * 这里最关键的一条断言是「**运动中**采样的速度/电流/温度都不是 0」：这正是"面板遥测行有值"的用户
 * 可见结果。运动在后台线程里跑，采样在主线程做 —— 与生产一致（孪生推送线程就是在运动期间采样）。
 *
 * 运行：node --test test/sim-telemetry.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url));

const HARNESS = `
import json, os, sys, tempfile, threading, time, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(tempfile.mkdtemp(prefix="ur-tel-"), "t.log"), 4096)
sys.stdout = ur_worker._LOG

IP = ur_worker.SIM_IP
out = {}
ur_worker.SIMS.clear()
ur_worker.op_sim_start({"ip": IP, "model": "ur5e"})

# ① 静止时的基线（同时建立采样历史）
idle = ur_worker.route_op("get_runtime_telemetry", {"ip": IP})["data"]
out["keys"] = sorted(idle.keys())
out["estimated"] = idle.get("estimated")
out["has_note"] = bool(idle.get("note"))
out["idle_speeds_max"] = max(abs(x) for x in idle["joint_speeds"])
out["currents_in_range"] = all(0.0 <= x <= 8.0 for x in idle["joint_currents"])
out["temps_in_range"] = all(28.0 <= x <= 50.0 for x in idle["joint_temperatures"])
out["voltage_nominal"] = idle["robot_voltage"]

# ② 运动**期间**采样：后台线程跑一段 1.5 s 的 movej，主线程读遥测
err = []
def move():
    try:
        ur_worker.route_op("movej", {"ip": IP,
                                     "q": [0.3, -1.2, 1.4, -0.6, -1.3, 0.8], "t": 1.5})
    except Exception as exc:
        err.append(repr(exc))

th = threading.Thread(target=move)
th.start()
time.sleep(0.5)
during = ur_worker.route_op("get_runtime_telemetry", {"ip": IP})["data"]
th.join(timeout=15)
out["move_err"] = err
out["moving_speeds_max"] = max(abs(x) for x in during["joint_speeds"])
out["moving_currents_max"] = max(during["joint_currents"])
out["moving_tcp_speed_max"] = max(abs(x) for x in during["tcp_speed"][:3])
out["moving_accel_len"] = len(during["tool_accelerometer"])
out["tcp_force_len"] = len(during["tcp_force"])

# ③ 温度会随负载缓慢上升（时间常数 ~60 s，所以只断言"不低于环境温度且不超过上限"）
out["temps_after"] = ur_worker.route_op("get_joint_temperatures", {"ip": IP})["data"]["joint_temperatures"]

# ④ 单值读口的形状与真机一致
out["robot_current"] = ur_worker.route_op("get_robot_current", {"ip": IP})["data"]["robot_current"]
out["robot_voltage"] = ur_worker.route_op("get_robot_voltage", {"ip": IP})["data"]["robot_voltage"]
out["tcp_force_direct_len"] = len(ur_worker.route_op("get_tcp_force", {"ip": IP})["data"]["tcp_force"])

# ⑤ 能力清单必须把遥测从 not_simulated 移走
caps = ur_worker.sim_capabilities()
out["caps_telemetry"] = len(caps.get("telemetry", []))
out["not_simulated_mentions_telemetry"] = any("遥测" in s for s in caps["not_simulated"])

# ⑥ ★ 面板真实数据源：孪生 detail 读的是 status，不是 get_runtime_telemetry ——
#    所以 status 必须也带上那六个字段，否则"面板遥测行是空的"这件事没被修好。
st = ur_worker.route_op("status", {"ip": IP})["data"]
out["status_telemetry_keys"] = [
    k for k in ("robot_voltage", "robot_current", "joint_temperatures",
                "joint_currents", "tcp_force", "tcp_speed")
    if k in st and st[k] is not None
]
out["status_telemetry_estimated"] = st.get("telemetry_estimated")

ur_worker._PROTOCOL_OUT.write(json.dumps(out) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`;

function probe() {
  const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
    encoding: 'utf8',
    timeout: 120000,
    env: {
      ...process.env,
      PYTHONPATH: pythonDir,
      PYTHONUNBUFFERED: '1',
      PYTHONIOENCODING: 'utf-8',
    },
  });
  assert.equal(child.status, 0, `探针失败：${child.stderr}`);
  const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'));
  assert.ok(line, `未拿到 JSON 结果：${JSON.stringify(child.stdout)}`);
  return JSON.parse(line);
}

test('★ B1：遥测在仿真里返回估算值（形状与真机一致、恒带 estimated 与 note）', () => {
  const g = probe();
  for (const key of [
    'joint_currents',
    'joint_voltages',
    'joint_speeds',
    'tcp_speed',
    'tcp_force',
    'tool_accelerometer',
    'speed_scaling',
    'momentum',
    'robot_voltage',
    'robot_current',
    'joint_temperatures',
  ]) {
    assert.ok(g.keys.includes(key), `遥测必须包含真机同名字段 ${key}（实际 ${g.keys.join(',')}）`);
  }
  assert.equal(g.estimated, true, '★ 估算值必须带 estimated 标记 —— 不能让人误当测量');
  assert.equal(g.has_note, true, '★ 必须带 note 说明这是估算、由什么推出来的');
  assert.ok(g.idle_speeds_max < 0.05, `静止时关节速度应≈0，实际 ${g.idle_speeds_max}`);
  assert.equal(g.currents_in_range, true, '电流估算必须落在量级范围内（0-8 A）');
  assert.equal(g.temps_in_range, true, '温度估算必须落在环境温度到上限之间');
  assert.equal(g.voltage_nominal, 48, '机器人电压按名义值 48 V 报');
  assert.equal(g.move_err.length, 0, `后台运动不得报错：${g.move_err.join(';')}`);
});

test('★ B1：运动期间遥测**不是空的**（面板遥测行的用户可见结果）', () => {
  const g = probe();
  assert.ok(
    g.moving_speeds_max > 0.1,
    `★ 运动中关节速度必须非零（面板遥测行过去恒空），实际 ${g.moving_speeds_max}`,
  );
  assert.ok(g.moving_currents_max > 0.5, `运动中电流必须随负载上升，实际 ${g.moving_currents_max}`);
  assert.ok(
    g.moving_tcp_speed_max > 0.005,
    `运动中 TCP 速度必须非零，实际 ${g.moving_tcp_speed_max}`,
  );
  assert.equal(g.moving_accel_len, 3, '工具加速度计必须是 3 维');
  assert.equal(g.tcp_force_len, 6, 'TCP 受力必须是 6 维（力 3 + 力矩 3）');
  assert.equal(g.tcp_force_direct_len, 6, 'get_tcp_force 单值读口同样是 6 维');
  assert.ok(g.robot_current > 0, `机器人电流必须为正，实际 ${g.robot_current}`);
  assert.equal(g.robot_voltage, 48);
  assert.ok(Array.isArray(g.temps_after) && g.temps_after.length === 6, '关节温度必须是 6 个');
});

test('★ B1：能力清单把遥测从「无仿真语义」移到 telemetry', () => {
  const g = probe();
  assert.equal(g.caps_telemetry, 5, '能力清单必须列出 5 个遥测工具');
  assert.equal(
    g.not_simulated_mentions_telemetry,
    false,
    '遥测已实现，不得再出现在 not_simulated 里',
  );
});

test('★ B1：孪生面板的真实数据源（status）也带上了这六个遥测字段', () => {
  const g = probe();
  // 面板的 detail 通道读的是 status（见 lib/twin-routes.js 的 body.detail 字段清单）。
  // 只改 get_runtime_telemetry 是不够的 —— 这条断言盯的是"面板上真的会有值"。
  const expected = [
    'robot_voltage',
    'robot_current',
    'joint_temperatures',
    'joint_currents',
    'tcp_force',
    'tcp_speed',
  ];
  assert.deepEqual(
    g.status_telemetry_keys,
    expected,
    `★ status 必须带上面板要读的六个遥测字段，实际只有 ${g.status_telemetry_keys.join(',')}`,
  );
  assert.equal(g.status_telemetry_estimated, true, 'status 里的遥测同样必须标注是估算');
});
