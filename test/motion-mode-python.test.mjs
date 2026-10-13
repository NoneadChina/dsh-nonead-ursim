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
});
