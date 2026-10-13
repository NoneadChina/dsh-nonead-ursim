/**
 * test/twin-worker.test.mjs — 数字仿真只读遥测的 worker 策略（`lib/twin-worker.js`）。
 *
 * ## 为什么单独一个用例（0.6.6 的真机缺陷）
 * 仿真与运动指令共用**同一条单线程 Python worker 队列**：机器人执行运动指令期间，仿真的读
 * 排在它后面。而 `UrWorker.call()` 的默认预算（`commandTimeoutMs`，60 s）到点时会**杀掉
 * 子进程** —— 那是为"卡在库代码里的单线程 worker"设计的。可对一条**只读可视化**读来说，
 * 这一刀连带杀掉了整条机器人会话（RTDE/Dashboard 都在那个子进程里），仿真此后永远拿不到
 * 位姿，用户看到的就是"同步了两个动作之后就再也不动了"。
 * ⇒ 仿真读必须：**短预算 + 超时不杀进程**。
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TWIN_READ_TIMEOUT_MS, TWIN_READ_MAX_IN_FLIGHT, createTwinReadWorker } from '../lib/twin-worker.js';
import { WORKER_ERROR_CODES } from '../lib/worker.js';

test('仿真读预算必须**远短于**默认命令预算（它每秒发约 20 次）', () => {
  assert.ok(Number.isFinite(TWIN_READ_TIMEOUT_MS) && TWIN_READ_TIMEOUT_MS > 0);
  assert.ok(
    TWIN_READ_TIMEOUT_MS <= 5000,
    `仿真读预算 ${TWIN_READ_TIMEOUT_MS}ms 太长：一帧读卡住就等于停帧，客户端只能看到冻住的画面`,
  );
  // 与 UrWorker 的默认值（60000）比较：这里刻意写死数字，避免"两边一起被改大"。
  assert.ok(TWIN_READ_TIMEOUT_MS < 60000, '仿真读不得沿用 60 s 的命令预算');
});

test('包装后的 call() 必须透传 op/params，并强制 killOnTimeout:false', async () => {
  const seen = [];
  const fake = {
    call: async (...args) => {
      seen.push(args);
      return { message: 'ok', data: { joint_positions: [0, 0, 0, 0, 0, 0] } };
    },
  };
  const twin = createTwinReadWorker(fake);
  assert.ok(twin !== null);

  const result = await twin.call('get_joint_pose', { ip: '1.2.3.4' });
  assert.deepEqual(result.data.joint_positions, [0, 0, 0, 0, 0, 0]);

  assert.equal(seen.length, 1);
  const [op, params, timeoutMs, signal, options] = seen[0];
  assert.equal(op, 'get_joint_pose');
  assert.deepEqual(params, { ip: '1.2.3.4' });
  assert.equal(timeoutMs, TWIN_READ_TIMEOUT_MS, '★ 必须用仿真自己的短预算');
  assert.equal(signal, undefined, '仿真读不受工具调用的取消信号牵连');
  // H-3：仿真读必须同时声明自己的**读类闸门**。否则 N 路 SSE 订阅各有一次在飞读，8 路就能把
  // worker 的在飞槽位占满，而准入是"总数 ≥ 上限即 BUSY" —— 命令类（含 stopj/stopl 这类停止
  // 指令）会在宿主侧被拒，连队列都进不去。
  assert.deepEqual(
    options,
    { killOnTimeout: false, class: 'twin-read', classMaxInFlight: TWIN_READ_MAX_IN_FLIGHT },
    '★ 超时不得杀子进程；且读类必须自带上限，给命令类留槽位',
  );
  assert.ok(
    TWIN_READ_MAX_IN_FLIGHT < 8,
    '读类上限必须小于 worker 的在飞上限，否则等于没有保留槽位',
  );
});

test('没有可用 worker 时返回 null（路由据此回 worker_unavailable，而不是抛错）', () => {
  assert.equal(createTwinReadWorker(null), null);
  assert.equal(createTwinReadWorker(undefined), null);
  assert.equal(createTwinReadWorker({}), null);
  assert.equal(createTwinReadWorker({ call: 'not a function' }), null);
});

test('worker 的错误码是机器可读的（仿真据此区分"暂时读不到"与"真的没连上"）', () => {
  // 这些码必须存在且互不相同：`lib/twin-routes.js` 的 TWIN_TRANSIENT_WORKER_CODES 依赖它们。
  const codes = Object.values(WORKER_ERROR_CODES);
  assert.ok(codes.includes('WORKER_TIMEOUT'), '超时必须有自己的码');
  assert.ok(codes.includes('WORKER_BUSY'), '达到 maxInFlight 必须有自己的码');
  assert.equal(new Set(codes).size, codes.length, '错误码不得重复');
  for (const code of codes) assert.match(code, /^WORKER_[A-Z]+$/u);
});
