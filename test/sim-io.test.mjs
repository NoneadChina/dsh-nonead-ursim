/**
 * test/sim-io.test.mjs — 仿真里 I/O 与寄存器的**内存态**（路线图 B3）。
 *
 * 为什么需要：真机上 `set_digital_out` 与 `get_digital_out_bits` 是一对闭环，而仿真里两者过去
 * 都是 `SIM_UNSUPPORTED` —— "置位 → 读回 → 断言"这种教学/演示脚本根本写不出来。B3 之后：
 *   · 输出可写可读回（std / config / tool，位串按 UR 的全局编号 0-15）；
 *   · 输入**没有生产者**，一律 0（并在返回值里说明原因，不假装有信号）；
 *   · 寄存器只有读口（本插件没有写寄存器的工具），恒为初值；
 *   · 状态挂在虚拟机器人**实例**上 ⇒ 重开仿真等于"控制器重启"，回到初始态。
 *
 * 运行：node --test test/sim-io.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pythonDir = fileURLToPath(new URL('../python/', import.meta.url));

const HARNESS = `
import json, os, sys, tempfile, ur_worker

ur_worker._LOG = ur_worker._CappedLog(os.path.join(tempfile.mkdtemp(prefix="ur-io-"), "t.log"), 4096)
sys.stdout = ur_worker._LOG

IP = ur_worker.SIM_IP
out = {}
ur_worker.SIMS.clear()

def bits():
    return ur_worker.route_op("get_digital_output_bits", {"ip": IP})["data"]["bits"]

# ① 输出闭环：置位 → 读回
ur_worker.route_op("set_digital_out", {"ip": IP, "which": "std", "n": 3, "value": True})
b = bits()
out["std_bit3"] = b[3]
out["std_bit4"] = b[4]

# ② config 端口沿用 UR 的全局编号 8-15（n=10 ⇒ 位串下标 10）
ur_worker.route_op("set_digital_out", {"ip": IP, "which": "config", "n": 10, "value": True})
b = bits()
out["config_global10"] = b[10]
out["std_bit3_kept"] = b[3]

# ③ tool 端口 0-1
ur_worker.route_op("set_digital_out", {"ip": IP, "which": "tool", "n": 1, "value": True})
r = ur_worker.route_op("set_digital_out", {"ip": IP, "which": "tool", "n": 1, "value": True})
out["tool_ok"] = isinstance(r, dict) and "error" not in r

# ④ 清位也是闭环
ur_worker.route_op("set_digital_out", {"ip": IP, "which": "std", "n": 3, "value": False})
out["cleared_bit3"] = bits()[3]

# ⑤ 输入恒 0 且**说明原因**
r = ur_worker.route_op("get_digital_in", {"ip": IP, "n": 2})
out["input_value"] = r["data"]["value"]
out["input_note"] = bool(r["data"].get("note"))
out["input_bits_all_false"] = all(x is False for x in
                                  ur_worker.route_op("get_digital_input_bits", {"ip": IP})["data"]["bits"])

# ⑥ 模拟量：写 5V（满量程 10）⇒ 相对电平 0.5；模拟输入同样没有信号源
r = ur_worker.route_op("set_analog_out", {"ip": IP, "n": 1, "value": 5.0})
out["analog_fraction"] = round(r["data"]["fraction"], 6)
out["analog_in"] = ur_worker.route_op("get_analog_in", {"ip": IP, "n": 0})["data"]["value"]

# ⑦ 寄存器恒初值，且返回值里写明"没有写入口"
r = ur_worker.route_op("get_int_register", {"ip": IP, "index": 7})
out["int_reg"] = r["data"]["value"]
out["int_reg_note"] = bool(r["data"].get("note"))
out["double_reg"] = ur_worker.route_op("get_double_register", {"ip": IP, "index": 7})["data"]["value"]
out["bit_reg"] = ur_worker.route_op("get_bit_register", {"ip": IP, "index": 7})["data"]["value"]

# ⑧ 非法端口仍然被拒（内存态不放松参数校验）。
#    注意：_bounded_int 抛的是 ValueError（不是 WorkerError）—— 宿主侧由 main() 的异常处理统一
#    转成错误响应。这里只断言"确实被拒、没有静默写入"，不绑死异常类型。
try:
    bad = ur_worker.route_op("set_digital_out", {"ip": IP, "which": "std", "n": 99, "value": True})
    out["bad_port_rejected"] = isinstance(bad, dict) and "error" in bad
    out["bad_port_msg"] = str((bad or {}).get("error", ""))
except Exception as exc:
    out["bad_port_rejected"] = True
    out["bad_port_msg"] = str(exc)

# ⑨ 重开仿真 ⇒ 回到初始态（状态挂在实例上，等价于控制器重启）
ur_worker.route_op("set_digital_out", {"ip": IP, "which": "std", "n": 5, "value": True})
ur_worker.op_sim_stop({"ip": IP})
ur_worker.op_sim_start({"ip": IP, "model": "ur5e"})
out["reset_after_restart"] = all(x is False for x in bits())

ur_worker._PROTOCOL_OUT.write(json.dumps(out) + "\\n")
ur_worker._PROTOCOL_OUT.flush()
`;

function probe() {
  const child = spawnSync(process.env.PYTHON ?? 'python', ['-u', '-c', HARNESS], {
    encoding: 'utf8',
    timeout: 60000,
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

test('★ B3：仿真里数字输出可写可读回（std / config / tool），输入恒 0 并说明原因', () => {
  const g = probe();
  assert.equal(g.std_bit3, true, '★ 置位后读回必须是 True —— 这是 B3 的闭环本身');
  assert.equal(g.std_bit4, false, '未置位的位必须保持 False');
  assert.equal(g.config_global10, true, 'config 端口 n=10 必须落在全局编号 10 上');
  assert.equal(g.std_bit3_kept, true, 'config 的写入不得影响 std 组的位');
  assert.equal(g.tool_ok, true, 'tool 端口（0-1）必须可写');
  assert.equal(g.cleared_bit3, false, '清位也必须闭环');
  assert.equal(g.input_value, false, '仿真没有输入信号源，数字输入恒为 False');
  assert.equal(g.input_note, true, '恒 0 必须**说明原因**，不能只给一个 0');
  assert.equal(g.input_bits_all_false, true, '输入位串必须全 False');
});

test('★ B3：模拟量与寄存器按内存态回报，非法端口仍被拒，重开仿真回到初始态', () => {
  const g = probe();
  assert.equal(g.analog_fraction, 0.5, '写 5V（满量程 10）⇒ 相对电平必须是 0.5');
  assert.equal(g.analog_in, 0, '模拟输入没有信号源，恒为 0');
  assert.equal(g.int_reg, 0, 'int 寄存器恒初值 0');
  assert.equal(g.int_reg_note, true, '寄存器恒初值必须说明"本插件没有写寄存器的工具"');
  assert.equal(g.double_reg, 0, 'double 寄存器恒初值 0.0');
  assert.equal(g.bit_reg, false, 'bool 寄存器恒初值 False');
  assert.equal(g.bad_port_rejected, true, '内存态不得放松参数校验（std 端口 0-7）');
  assert.equal(g.reset_after_restart, true, '★ 重开仿真必须回到初始态（状态挂在实例上）');
});
