/**
 * test/sim-only.test.mjs — 「本插件不存在任何真机」这条契约的守门测试。
 *
 * ## 为什么需要它
 * 用户 2026-10-12 裁定：dsh-nonead-ursim **只操作离线仿真机器人，不存在任何真机通道**，
 * 且"使用不依靠任何真机"。这件事有两半，两半都要钉住：
 *   ① **行为**（下面第二组用例）：真机地址被拒（`SIM_BADARG`）、省略 ip 时自动开一台
 *      UR12e 并真的把动作做完、仿真无语义的指令回报 `SIM_UNSUPPORTED`、
 *      `connect` = 确保仿真在跑、`disconnect` = 停仿真（幂等）。
 *   ② **结构**（第一组用例）：真机路径**永远不可达** —— 只有
 *      `SIM_PASSTHROUGH_OPS` 里的 op 能落到 `HANDLERS`，其余一律经 `route_op` 在仿真里解决。
 *      只测行为的话，"真机实现还在、只是没被调用"是看不出来的。
 *
 * 运行：node --test test/sim-only.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url))
const workerSource = readFileSync(join(pythonDir, 'ur_worker.py'), 'utf8').replace(/\r\n/g, '\n')

test('契约：主派发只经 route_op —— 真机实现除 SIM_PASSTHROUGH_OPS 外不可达', () => {
  const mainBody = /def main\(\):[\s\S]*$/.exec(workerSource)?.[0] ?? ''
  assert.match(mainBody, /data = route_op\(op_name, params\)/,
    'main() 必须经 route_op 派发（否则真机路径又会被走通）')
  assert.ok(!/sim_dispatch\(op_name, params\)/.test(mainBody),
    'main() 不得再直接调 sim_dispatch —— 那样"不在仿真里、又没被拒绝"的指令会落到真机实现')

  const passthrough = /SIM_PASSTHROUGH_OPS = frozenset\(\{([\s\S]*?)\}\)/.exec(workerSource)
  assert.ok(passthrough, '必须声明 SIM_PASSTHROUGH_OPS')
  // ⚠️ **闭集**断言（安全审计 M-2）：这个 frozenset 是"哪些 op 能落回 HANDLERS（真机实现）"
  // 的**唯一开关**。只断言"包含"的话，任何一次看起来无害的新增（`list_programs` / `send_script` /
  // `power_off` 这类"像仿真生命周期或运维"的名字）都会重新打通真机路径 —— 而四个静态门禁与
  // 全部测试**都不会红**。所以这里钉成相等：新增一项就必须同步复核并更新本断言。
  const declared = [...passthrough[1].matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]).sort()
  assert.deepEqual(
    declared,
    ['connect', 'disconnect', 'ping', 'shutdown_worker', 'sim_start', 'sim_status', 'sim_stop'],
    'SIM_PASSTHROUGH_OPS 是闭集：新增一项即重新打开真机实现',
  )

  const routeBody = /def route_op\(op_name, params\):[\s\S]*?\n\ndef /.exec(workerSource)?.[0] ?? ''
  assert.match(routeBody, /_pin_sim_ip\(params\)/, 'route_op 必须先收口 ip')
  assert.match(routeBody, /_ensure_sim_ready\(\)/, 'route_op 必须保证仿真已就绪')
  assert.match(routeBody, /SIM_BADARG|_pin_sim_ip/, '非仿真地址必须被拒绝')
})

/** 在真 Python 里驱动 `route_op` / `op_connect` / `op_disconnect`，把结果打成一行 JSON。 */
const HARNESS = `
import json, os, sys, tempfile, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(tempfile.mkdtemp(prefix="ur-simonly-"), "t.log"), 4096)
sys.stdout = ur_worker._LOG

out = {}
POSE = [-0.6914, -0.1742, 0.1768, 2.2214, 2.2214, 0.0]

# ① 真机地址：必须被拒，且**不许**因此把仿真开起来
ur_worker.SIMS.clear()
r = ur_worker.route_op("movel", {"ip": "192.168.1.199", "pose": POSE})
out["real_ip_code"] = r.get("code") if isinstance(r, dict) else "?"
out["real_ip_started_sim"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is not None

# ② 省略 ip 且没开仿真 ⇒ 自动开一台 UR12e，并把动作真的做完
r = ur_worker.route_op("movel", {"pose": POSE})
out["auto_error"] = r.get("error") if isinstance(r, dict) else None
out["auto_sim_running"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is not None
# 读数一律走 worker 自己的状态接口，不去碰 VirtualRobot 的内部方法名
st = (ur_worker.op_sim_status({}) or {}).get("data") or {}
out["auto_model"] = st.get("model_id")
out["auto_tcp_z"] = round(st.get("tcp_pose", [0, 0, 0])[2], 4)

# ③ 仿真无语义的指令：SIM_UNSUPPORTED，不落到真机实现
#   ⚠️ 反例要挑**真的**没有仿真语义的 op：get_runtime_telemetry 自 B1 起有估算实现，
#   再拿它当反例会拿到真数据（这正是契约变更的信号）。
#   ⚠️⚠️ 本段是嵌在 JS 模板字符串里的 Python：注释里**绝不能出现反引号**（会截断模板串）。
r = ur_worker.route_op("force_mode", {})
out["force_mode_code"] = r.get("code") if isinstance(r, dict) else "?"
out["force_mode_error"] = r.get("error") if isinstance(r, dict) else None
r = ur_worker.route_op("set_tool_voltage", {})
out["telemetry_code"] = r.get("code") if isinstance(r, dict) else "?"

# ④ connect = 确保仿真在跑；disconnect = 停仿真（幂等）
ur_worker.SIMS.clear()
c = ur_worker.op_connect({})
out["connect_error"] = c.get("error")
out["connect_connected"] = (c.get("data") or {}).get("connected") if isinstance(c, dict) else None
out["connect_sim_running"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is not None
d = ur_worker.op_disconnect({})
out["disconnect_error"] = d.get("error")
out["disconnect_sim_running"] = ur_worker.SIMS.get(ur_worker.SIM_IP) is not None
d2 = ur_worker.op_disconnect({})
out["disconnect_twice_error"] = d2.get("error")

# ⑤ 默认起始姿态「竖直收拢」必须对**全部**型号成立：换型号时新机器人就从它开始，
#    若某个型号判它越限，preset_joints 会静默退回落位（zero）—— 那等于"换了型号姿势就变了"。
import ur_sim
PRESET_UP = ur_sim.PRESETS["upright"]
out["model_count"] = len(ur_sim.model_ids())
out["upright_fallback_models"] = [
    mid for mid in ur_sim.model_ids()
    if max(abs(ur_sim.preset_joints("upright", mid)[i] - PRESET_UP[i]) for i in range(6)) > 1e-12
]

# ⑥ 工具级默认：ursim_sim_start **不带 preset** 时，起始姿态也必须是「竖直收拢」
#    （与面板换型号、自动就绪一致 —— 三处默认不能各说各话）
ur_worker.SIMS.clear()
s = ur_worker.op_sim_start({"model": "ur12e"})
out["default_preset"] = (s.get("data") or {}).get("preset")
out["sim_stop_message"] = (ur_worker.op_sim_stop({}) or {}).get("message")

ur_worker._PROTOCOL_OUT.write(json.dumps(out) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`

test('行为：真机地址被拒、自动就绪、无语义指令回报 SIM_UNSUPPORTED、connect/disconnect 是仿真语义', () => {
  const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, PYTHONPATH: pythonDir, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' },
  })
  assert.equal(child.status, 0, `探针失败：${child.stderr}`)
  const line = child.stdout.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'))
  assert.ok(line, `未拿到 JSON 结果：${JSON.stringify(child.stdout)}`)
  const got = JSON.parse(line)

  // ① 真机地址是非法输入，而且**不许**顺手把仿真开起来（先收口、再就绪）
  assert.equal(got.real_ip_code, 'SIM_BADARG', '真机地址必须以 SIM_BADARG 拒绝')
  assert.equal(got.real_ip_started_sim, false, '被拒的调用不得有任何副作用（不许开仿真）')

  // ② 自动就绪：没开仿真也能直接动
  //    （Python 的 `dict.get()` 缺键返回 None ⇒ JSON null，这里就按 null 断言）
  assert.equal(got.auto_error, null, `省略 ip 时不该报错：${got.auto_error}`)
  assert.equal(got.auto_model, 'ur12e', '自动开的仿真默认型号必须是 UR12e')
  assert.equal(got.auto_sim_running, true, '调用后仿真必须在跑')
  assert.ok(Math.abs(got.auto_tcp_z - 0.1768) < 1e-3,
    `动作必须真的做完（TCP z 应 ≈0.1768，实际 ${got.auto_tcp_z}）`)

  // ⑦ 文案必须可执行：无仿真语义的指引要指向 real 通道，sim_stop 不得声称"回到真机"
  //    （依据：sim 模式下非回环地址会被结构性拒绝，旧文案教用户 ursim_connect 指向 URSim 必然失败）
  assert.ok(got.force_mode_error && got.force_mode_error.includes("realRobotIps"),
    "无仿真语义的指引必须指向 real 通道（realRobotIps 白名单）：" + got.force_mode_error)
  assert.ok(!got.force_mode_error.includes("指向它的 IP"),
    "不得再教用户用 ursim_connect 指向 URSim（sim 模式下该地址会被拒绝）")
  assert.ok(got.sim_stop_message && got.sim_stop_message.includes("离线仿真已关闭"),
    "sim_stop 文案应如实说明仿真已关闭：" + got.sim_stop_message)
  assert.ok(!got.sim_stop_message.includes("回到真机"),
    "sim 模式不存在真机通道，sim_stop 文案不得声称回到真机")

  // ③ 仿真无语义的指令如实回报，不假装成功、也不去碰真机
  assert.equal(got.force_mode_code, 'SIM_UNSUPPORTED')
  assert.equal(got.telemetry_code, 'SIM_UNSUPPORTED')

  // ④ connect / disconnect 的仿真语义
  assert.equal(got.connect_error, null, `connect 不该报错：${got.connect_error}`)
  assert.equal(got.connect_connected, true, 'connect 必须报告已连接')
  assert.equal(got.connect_sim_running, true, 'connect 之后仿真必须在跑')
  assert.equal(got.disconnect_error, null)
  assert.equal(got.disconnect_sim_running, false, 'disconnect 必须把仿真停掉')
  assert.equal(got.disconnect_twice_error, null, 'disconnect 必须幂等')

  // ⑤ 默认起始姿态「竖直收拢」对全部型号成立（换型号后新机器人就从这里开始）
  assert.equal(got.model_count, 14, '内置型号必须是 14 个')
  assert.deepEqual(
    got.upright_fallback_models,
    [],
    '★ 有型号判「竖直收拢」越限而退回全零位 —— 那样换型号后姿势就不是竖直收拢了',
  )

  // ⑥ 工具级默认起始姿态同样是竖直收拢（面板换型号 / 自动就绪 / 工具默认三处一致）
  assert.equal(got.default_preset, 'upright', '★ ursim_sim_start 不传 preset 时默认必须是竖直收拢')
})
