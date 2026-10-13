/**
 * dsh-nonead-ursim — the digital twin's **read-only** worker policy.
 *
 * © 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com
 *
 * The twin polls the robot at ~10 Hz (SSE frames every 100 ms) through the same
 * single-threaded Python worker that executes every motion command. That shared
 * queue is what makes this file necessary: while the robot is moving, the twin's
 * read sits **behind** the motion command in the worker's stdin queue, so it
 * takes as long as the motion does.
 *
 * Two consequences, both of which used to stop the twin from ever following the
 * robot again:
 *
 * 1. **The default budget is 60 s.** `UrWorker.call()` kills the Python child
 *    when a request exceeds its deadline — by design: a single-threaded worker
 *    stuck inside library code would otherwise make every later request queue
 *    behind it. But a *read-only visualisation* read that times out must not
 *    destroy the robot session (RTDE + Dashboard live in that child): the twin
 *    would then never get a pose again, and the user sees "it synced two moves
 *    and then stopped".
 * 2. **A wedged read wedges the frame pump.** The twin's frame pump refuses to
 *    stack a second read on top of an outstanding one (8 in-flight requests is
 *    the worker's hard ceiling), so one slow read means no frames at all.
 *
 * Therefore the twin reads with a **short budget** and `killOnTimeout: false`:
 * fail fast, keep the session, let the next frame try again. Motion commands
 * keep their own budget and their own kill-on-timeout behaviour, untouched.
 *
 * Kept free of every dependency (no cordis, no schema, no `node:` beyond
 * nothing at all) so it can be unit-tested without the host module graph.
 */

/**
 * The digital twin's per-read budget (milliseconds).
 *
 * Short on purpose: a twin frame is worth ~10 ms of robot time, and the client
 * shows "data stalled" rather than silently freezing. See the file header.
 */
export const TWIN_READ_TIMEOUT_MS = 2500;

/**
 * 孪生读**最多**同时占用的在飞槽位数（H-3）。
 *
 * worker 的在飞上限是 8，而每一路 SSE 订阅都有自己的帧泵（每泵一帧在读）—— 8 路订阅就能把
 * 8 个槽位全部占满，`UrWorker.call()` 的准入是"总数 ≥ 上限即 BUSY"，于是**命令类调用（包括
 * `stopj`/`stopl`/`end_force_mode` 这类停止指令）会在宿主侧被拒**，根本到不了 worker：
 * 真机正在运动、你想让它停的那一刻，恰恰是最容易被读占满的时刻。
 *
 * 给读类单开一道闸门后，命令类永远至少有 5 个槽位；孪生这边最多 3 路同时读，超出的那一路
 * 退化成一条 `frame-error`，客户端保留上一帧继续显示（不断流、也不杀进程）。
 */
export const TWIN_READ_MAX_IN_FLIGHT = 3;

/**
 * Wrap a worker so its `call()` uses the twin's read-only policy.
 *
 * @param {{call: Function}|null|undefined} worker the live `UrWorker` (may be
 *   `null` when the Python half failed to initialise).
 * @returns {{call: (op: string, params?: object) => Promise<unknown>}|null}
 *   `null` when there is no usable worker, so the route handlers keep answering
 *   `connected:false` / `worker_unavailable` exactly as before.
 */
export function createTwinReadWorker(worker) {
  if (worker === null || worker === undefined || typeof worker.call !== 'function') return null;
  return {
    call: (op, params) =>
      worker.call(op, params, TWIN_READ_TIMEOUT_MS, undefined, {
        killOnTimeout: false,
        // 分闸：读类不得挤占命令槽位（H-3）。
        class: 'twin-read',
        classMaxInFlight: TWIN_READ_MAX_IN_FLIGHT,
      }),
  };
}
