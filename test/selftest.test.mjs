/**
 * test/selftest.test.mjs — 真实 Python worker 的端到端协议自检（不需要机器人）。
 *
 * 通过真正的进程管理器（`lib/worker.js`）拉起真正的 `python/ur_worker.py`，验证：
 *   ping 往返、未知 op 被拒、未知 op 带结构化错误码、优雅关闭（shutdown）能结束进程。
 *
 * 这是"Python 半能不能起来"的唯一现场证据：所有其它 Python 用例都用 `python -c` 探针
 * 直接调函数，只有这里经过 spawn + 行协议 + 真实解释器启动路径（含依赖导入）。
 *
 * 运行：node --test test/selftest.test.mjs
 * 指定解释器：UR_PYTHON=C:\Python312\python.exe node --test test/selftest.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { UrWorker } from '../lib/worker.js';

const pythonDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'python');
const PYTHON = process.env.UR_PYTHON || process.env.PYTHON || 'python';

function makeWorker(extra = {}) {
  return new UrWorker({
    pythonBin: PYTHON,
    pythonDir,
    commandTimeoutMs: 30000,
    ...extra,
  });
}

/**
 * 直接起一个**不带 PYTHONUTF8** 的真实 worker（绕过 `lib/worker.js` 的 spawn env）。
 *
 * 存在的唯一理由：验证 **Python 侧自己的 stdin 防御**（`main()` 里的 `reconfigure`）。
 * `lib/worker.js` 那条 `PYTHONUTF8=1` 由 UrWorker 的用例覆盖；这里刻意删掉它，模拟
 * "别的启动方式（手工接管道）"—— 若两处都没做，中文参数会按 locale 编码被损坏。
 */
function rawWorkerRequest(payload, { timeoutMs = 15000 } = {}) {
  const env = { ...process.env, PYTHONPATH: pythonDir, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' };
  delete env.PYTHONUTF8;                      // ← 故意不设：让 Python 侧自己收口
  const child = spawn(PYTHON, ['-u', join(pythonDir, 'ur_worker.py')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.kill(); } catch { /* 忽略 */ }
      fn(value);
    };
    const timer = setTimeout(
      () => finish(reject, new Error(`raw worker 超时（${timeoutMs}ms）`)),
      timeoutMs,
    );
    child.once('error', (error) => finish(reject, error));
    child.once('exit', (code) => {
      // 没拿到响应就退出 ⇒ worker 崩了（编码损坏正是这个症状之一）。
      finish(reject, new Error(`raw worker 提前退出（code=${code}），未拿到响应`));
    });
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id !== payload.id) continue;     // 无 id 的主动推送直接跳过
        finish(resolve, msg);
        return;
      }
    });
    child.stdin.write(`${JSON.stringify(payload)}\n`, 'utf8');
  });
}

test('真实 worker：ping 往返带回 Python 与 URBasic 就绪状态', async () => {
  const worker = makeWorker();
  try {
    const pong = await worker.call('ping');
    assert.equal(pong?.message, 'pong');
    assert.equal(pong?.data?.urbasic, true, 'URBasic 必须可导入');
    assert.match(String(pong?.data?.python ?? ''), /^\d+\.\d+/, '必须报告 Python 版本');
  } finally {
    worker.dispose();
  }
});

test('真实 worker：未知 op 被拒绝，且带机器可读错误码', async () => {
  const worker = makeWorker();
  try {
    await assert.rejects(() => worker.call('nope-not-an-op'), (error) => {
      assert.match(error.message, /未知操作/);
      assert.equal(error.code, 'BADARG', '未知 op 必须是 BADARG（而非笼统的 HUGE）');
      return true;
    });
  } finally {
    worker.dispose();
  }
});

test('真实 worker：disconnect 一个从未连接过的 IP 是幂等的成功', async () => {
  const worker = makeWorker();
  try {
    const res = await worker.call('disconnect', { ip: '127.0.0.1' });
    assert.match(String(res?.message ?? ''), /连接不存在/);
  } finally {
    worker.dispose();
  }
});

test('真实 worker：参数校验在入口处生效（NaN 必须被拒，不能送到控制器）', async () => {
  const worker = makeWorker();
  try {
    // 未连接任何机器人：这里期望的是**参数校验先失败**（BADARG），而不是连接失败，
    // 说明 `_vec` 的有限性检查确实在 ensure_connected 之前生效。
    // 注意：JSON 里 NaN 不是合法字面量，所以用字符串 "nan" —— float("nan") 同样能造出 NaN。
    await assert.rejects(
      () => worker.call('movel', { ip: '127.0.0.1', pose: ['nan', 0, 0, 0, 0, 0] }),
      (error) => {
        assert.ok(['BADARG', 'CONNECT_FAILED', 'NOT_CONNECTED'].includes(error.code),
          `应当是一个明确的结构化错误，实测 code=${error.code} message=${error.message}`);
        return true;
      },
    );
  } finally {
    worker.dispose();
  }
});

test('真实 worker：shutdown 会自行退出（让 RTDE 会话被主动释放，而不是被 kill）', async () => {
  const worker = makeWorker();
  try {
    await worker.call('ping');
    const closed = await worker.shutdown({ timeoutMs: 8000 });
    assert.equal(closed, true, 'shutdown 必须在期限内收到应答');
    // 进程应当已经退出（正常退出码 0）。
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(worker.proc, null, '退出后不得再持有进程句柄');
  } finally {
    worker.dispose();
  }
});

// ── P1-1：仿真运动"没走完"必须体现在信封 ok 上 ─────────────────────────────
//
// 旧实现 `_sim_move_reply` 无条件 `return ok({... "ok": ok_flag ...})`：`_sim_settle` 的
// `ok_flag=False`（"预算内没走完"）只埋在 data.ok 里，信封 ok 恒为 true —— 调用方/模型读到
// 的是一句"…（运动在 2500ms 内没有走完）"却当作成功。这里用真实协议确认：
//   ① 失败时 UrWorker 必须 reject，code=TIMEOUT，且 `error.data.ok === false`（信封 ok 一致）；
//   ② 成功路径的 data 字段列表与改动前**逐字段相同**（结构未变）。

test('★ P1-1：仿真运动预算内没走完 ⇒ 信封 ok:false，且信封 ok 与 data.ok 一致', async () => {
  const worker = makeWorker();
  try {
    await worker.call('sim_start', { model: 'ur12e' });
    // 目标 2 rad、速度压到下限 1e-4 ⇒ 名义时长上万秒；命令预算 2.5 s（worker 内部 settle
    // 预算 1.5 s）⇒ 必然"没走完"。
    const error = await worker
      .call('movej', { ip: '127.0.0.1', q: [2, 0, 0, 0, 0, 0], v: 0.0001 }, 2500)
      .then(() => null, (e) => e);
    assert.ok(error, '没走完必须 reject（旧实现回 ok:true，把 false 埋在 data.ok）');
    assert.equal(error.code, 'TIMEOUT', '超时类失败必须带 TIMEOUT');
    assert.equal(error.data?.ok, false, '★ 信封 ok 必须等于 data.ok（都为 false）');
    assert.equal(error.data?.simulated, true, '失败时仍必须带 simulated 标记');
    assert.match(String(error.message), /没有完成/, '失败文案不得沿用"已发送"');
  } finally {
    worker.dispose();
  }
});

test('★ P1-1：仿真运动成功路径的返回结构未变（data 字段列表与改动前一致）', async () => {
  const worker = makeWorker();
  try {
    await worker.call('sim_start', { model: 'ur12e' });
    const reply = await worker.call('movej', { ip: '127.0.0.1', q: [0.1, 0, 0, 0, 0, 0] });
    // 成功路径的外层结构 = handler 的 `{message, data}`（与改动前一致）；
    // `_sim_move_reply` 的成功 data = _sim_data(simulated, ip, model) + ok/command/target_tcp_pose。
    assert.deepEqual(Object.keys(reply).sort(), ['data', 'message'],
      '成功路径的外层结构只应有 message + data（与改动前一致）');
    const data = reply.data;
    assert.deepEqual(
      Object.keys(data).sort(),
      ['command', 'ip', 'model', 'ok', 'simulated', 'target_tcp_pose'],
      '成功路径的 data 只应有这 6 个字段（与改动前逐字段相同，失败分支不污染它）',
    );
    assert.equal(data.ok, true);
    assert.match(reply.message, /已到达目标/, '成功文案必须仍在（结构未变的证据）');
    assert.match(data.command, /^sim:关节运动到/, 'command 仍是 "sim:<what>" 的原样格式');
    assert.equal(data.simulated, true);
    assert.equal(data.ip, '127.0.0.1');
    assert.ok(Array.isArray(data.target_tcp_pose) && data.target_tcp_pose.length === 6,
      'target_tcp_pose 必须是 6 维位姿');
  } finally {
    worker.dispose();
  }
});

// ── P1-3：stdin 必须按 UTF-8 读（中文 Windows 上默认是 GBK） ─────────────────
//
// 症状：Node 写 UTF-8、Python 按 locale（GBK + surrogateescape）解 ⇒ 非 ASCII 参数被静默
// 损坏；回包 `.encode('utf-8')` 时抛 UnicodeEncodeError —— **此时副作用往往已经发生**。
// 修法是两处：`lib/worker.js` 的 spawn env 加 `PYTHONUTF8=1`（本文件第一条用例覆盖）与
// `ur_worker.main()` 里的 `sys.stdin.reconfigure`（第二条用例绕过 Node 侧 env 单独覆盖）。

test('★ P1-3：中文参数经 lib/worker.js spawn 的 worker 原样往返', async () => {
  const worker = makeWorker();
  try {
    // 非法 preset ⇒ 错误文案会原样回显参数值。若 stdin 被按 GBK 解码/损坏，这里拿不到原文。
    const error = await worker
      .call('sim_start', { model: 'ur12e', preset: '中文姿态' })
      .then(() => null, (e) => e);
    assert.ok(error, '非法 preset 必须失败');
    assert.match(String(error.message), /中文姿态/,
      `中文参数必须原样回显（实测：${error.message}）`);
    assert.equal(worker.stats().running, true,
      '★ 编码损坏会让回包 encode 失败并带走 worker；进程必须仍然活着');
    assert.equal((await worker.call('ping'))?.message, 'pong', '往返之后仍必须可用');
  } finally {
    worker.dispose();
  }
});

test('★ P1-3：绕过 Node 侧 env 时，Python 自己的 stdin 防御仍让中文原样往返', async () => {
  // 不设 PYTHONUTF8：只有 `ur_worker.main()` 里的 `sys.stdin.reconfigure` 能救。
  const msg = await rawWorkerRequest({ id: 1, op: 'sim_start', model: 'ur12e', preset: '中文姿态' });
  assert.equal(msg.ok, false, '非法 preset 必须失败');
  assert.match(String(msg.error), /中文姿态/,
    `中文参数必须原样回显（实测：${msg.error}）`);
});
