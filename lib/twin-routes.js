/**
 * dsh-nonead-ursim — host HTTP routes for the UR digital twin.
 *
 * © 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com
 *
 * Three read-only endpoints consumed by the right-dock 3D twin:
 *   GET <TWIN_STATE_PATH>[?ip=<ip>][&detail=1] → live joint angles + TCP + robot model
 *                                      (`ip` optional — Ruling 35: omitted means
 *                                      "the single connected robot"; `detail=1`
 *                                      adds the slower dashboard/status fields)
 *   GET <TWIN_ASSET_PATH>?model=<urXX> → assets/models/<urXX>.glb (Ruling 7:
 *                                        `/plugins/<id>/` only serves client.js/.map)
 *   GET <TWIN_MODELS_PATH>            → which GLBs are actually present locally
 *
 * Design: all handlers are **pure logic** — they never touch `req`/`res`, the
 * socket or the filesystem layout beyond an injected `assetsDir`. `lib/index.js`
 * does the HTTP plumbing (trust fence, method check, query parsing, status
 * write). This split keeps the security-relevant decisions unit-testable
 * without a live server.
 *
 * Failure policy: the twin is a best-effort *visualisation* channel. A missing
 * robot, a dead worker or a not-yet-downloaded mesh asset must never turn into
 * a 5xx that the client would surface as a hard error — they degrade to
 * `connected:false` / an empty 404 instead. Every failure additionally carries a
 * machine-readable `code` so the UI can say *why* it is not connected instead of
 * rendering one generic "not connected" line.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
import { pendingMotion } from './pending-motion.js';
import { TWIN_READ_MAX_IN_FLIGHT } from './twin-worker.js';

/**
 * 同时存活的 SSE 订阅上限。
 *
 * 与读类闸门**同值**：串行化之后每路帧泵最多占 1 个在读槽位（见
 * `createTwinStreamHandler` 里的说明），所以"路数 = 槽位数"是唯一不会让某一路必然拿
 * `WORKER_BUSY` 的默认值。单独导出是为了让测试和宿主能在不改实现的情况下读到这个算术。
 */
export const TWIN_STREAM_MAX_CLIENTS = TWIN_READ_MAX_IN_FLIGHT;

/**
 * Route paths (Ruling 22): the single source of truth is the **zero-import**
 * `lib/twin-paths.js`, shared verbatim with the browser half so the two can
 * never drift. Re-exported here to keep this module's public surface — this
 * file must NOT be imported by the client: it pulls in `node:fs` for the GLB
 * route, which cannot be bundled for the browser.
 */
export { TWIN_STATE_PATH, TWIN_ASSET_PATH, TWIN_MODELS_PATH, TWIN_STREAM_PATH, TWIN_SIM_PATH, TWIN_JOG_PATH } from './twin-paths.js';

/**
 * Model-id whitelist. Deliberately strict: `[a-z0-9]+` cannot express any path
 * separator, `.` or `..`, so a whitelisted id can never climb out of
 * `assetsDir` (the explicit containment check below is defence in depth).
 */
const MODEL_ID_RE = /^[a-z0-9]+$/;

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
/** Status payloads are live telemetry: never let a proxy or the HTTP cache reuse one. */
const NO_STORE = 'no-store, no-cache, must-revalidate';
const STATE_HEADERS = { ...JSON_HEADERS, 'cache-control': NO_STORE };

/** Trim a query value; anything that is not a string becomes ''. */
function textOf(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Machine-readable failure reasons returned with `connected:false`.
 * The client maps these to human text, so the *cause* survives the wire.
 */
export const TWIN_CODES = {
  NO_ROBOT: 'no_robot',
  NOT_CONNECTED: 'robot_not_connected',
  AMBIGUOUS: 'ambiguous_robot',
  WORKER_UNAVAILABLE: 'worker_unavailable',
  ROBOT_ERROR: 'robot_error',
  BAD_REQUEST: 'bad_request',
};

/** Standard disconnected envelope: never a 5xx, always says why. */
function disconnected(code, reason, extra = {}) {
  return { status: 200, headers: STATE_HEADERS, body: { connected: false, code, reason, ...extra } };
}

/**
 * worker 侧的"**暂时**拿不到答案"类错误码（见 `lib/worker.js` 的 `WORKER_ERROR_CODES`）。
 *
 * 为什么必须把这一类与"机器人真的没连上"分开：`UrWorker` 是单线程 stdin 队列，机器人执行
 * 运动指令期间仿真的读会排队并超时（这是**常态**，不是故障）。以前这种情况被映射成
 * `connected:false`，客户端于是把整个 3D 视图和 HUD 都藏起来、写上「未连接机器人」——
 * 用户看到的就是"仿真同步了两个动作之后就不动了（其实是变成未连接）"。
 * 现在这一类降级成"陈旧帧"：照旧 `connected:true`、带上 **原来的 ts**（龄期继续增长）与
 * `stale:true`，客户端保留读数并在界面上写「数据已停止更新 Ns」。
 */
export const TWIN_TRANSIENT_WORKER_CODES = new Set([
  'WORKER_BUSY',
  'WORKER_TIMEOUT',
  'WORKER_ABORTED',
  'WORKER_KILLED',
  'WORKER_EXITED',
  'WORKER_STDIN',
  'WORKER_DISPOSED',
  'WORKER_SPAWN',
]);

/**
 * 陈旧帧最多回放多久（毫秒）。
 *
 * 再久就不再假装知道机器人现在在哪 —— 一帧十分钟前的姿态比"不知道"更危险。
 */
export const TWIN_STALE_MAX_MS = 30000;

/**
 * 主动推送的**新鲜窗口**（毫秒）：缓存比这更旧就回退到显式读。
 *
 * Python 侧以 20 Hz（50 ms）推送，这里留约 6 倍余量吸收抖动。之所以必须有它：推送线程
 * 一旦停摆（worker 重启、RTDE 掉线），缓存会永远停在最后一笔 —— 拿陈旧姿态冒充实时读数
 * 比"回退去读一次（并按既有规则报 stale）"危险得多。
 */
export const TWIN_PUSH_FRESH_MS = 300;

/**
 * 详情（`detail=1`）在**帧路径**上允许的有界等待上限（毫秒）。
 *
 * 详情要两次 worker 往返（`status` + `get_target_values`），而 worker 是**单线程 stdin
 * 队列**：机器人正在执行运动命令时主线程卡在到位确认循环里，这两次往返会一直排队 ——
 * 实测每一帧因此被拖住 2.5 s（twin 读预算）到 5 s（两次往返）。而 SSE 是"每
 * `TWIN_STREAM_DETAIL_MS` 带一次 detail"的慢节拍，于是运动期间画面反复卡顿、界面常驻
 * 「数据已停止更新 Ns · 正在重试」。详情是**加分项**，不该有能力拖住姿态通道。
 *
 * 所以帧路径只等这么久：空闲时（常态）详情照常在同一次调用里给到；超预算就用上一笔
 * 缓存，一格都不等（见 `createTwinStateHandler` 的 `readDetail` / `bounded`）。
 */
export const TWIN_DETAIL_BUDGET_MS = 400;

/**
 * 型号（`get_robot_model`）在**帧路径**上允许的有界等待上限（毫秒）。
 *
 * 这条读曾经是**没有上限**的，于是它是运动期间第二个卡顿源：型号缓存一旦失效（代次变化、
 * TTL 到期，或者上一次读**超时失败没写回缓存**），后面每一帧都会再发一次；而这次读要排进
 * 单线程 stdin 队列，机器人一动就排满 2.5 s（twin 读预算）再超时 —— 超时是**抛异常**，
 * 直接掉进外层 catch 的陈旧回放分支，界面于是写「数据已停止更新 Ns」。
 *
 * 实测（`scripts/` 外的一次性探针，15 s 连续运动）：15 s 内发生 6 次 `get_robot_model`，
 * 其中 4 次等满 2500 ms 超时；SSE 只跑到 6.4 Hz（应 10 Hz）、最大帧间隔 2606 ms、11 次
 * `stale` 事件。型号是**静态事实**（一条连接存续期间不可能变），所以帧路径只肯为它等这点
 * 时间：超出就用上一次已知值，绝不因为"问不到型号"把整帧退化成陈旧回放。
 */
export const TWIN_MODEL_READ_BUDGET_MS = 250;

/**
 * 型号读失败后的**退避窗口**（毫秒）：这段时间内不再发型号读。
 *
 * 没有退避时，"读超时 ⇒ 没写缓存 ⇒ 下一帧再读 ⇒ 再超时"会自我维持：运动期间每一帧都付
 * 2.5 s 排队代价。静态事实 + 短退避 ⇒ 一次失败最多让**一帧**没有型号，而且那一帧照样带
 * q/tcp（不 stale）。
 */
export const TWIN_MODEL_BACKOFF_MS = 5000;

/**
 * 详情读**超时**后的退避窗口（毫秒）。
 *
 * 详情虽然只等 `TWIN_DETAIL_BUDGET_MS` 就继续出帧，但它**提交**出去的那次读仍会占住读类
 * 闸门（`TWIN_READ_MAX_IN_FLIGHT`）直到 worker 侧 2.5 s 预算耗尽。运动期间若每 2 s 都提交
 * 一次，闸门里就长期躺着没人要的 `status` / `get_target_values`，把别的读（含型号读）
 * 挤到排队。退避让"忙的时候"少发几次：详情只是加分项，画面连续比 HUD 里那几行数字更重要。
 */
export const TWIN_DETAIL_BACKOFF_MS = 5000;

/**
 * 详情**后台刷新**的最小间隔（毫秒）。
 *
 * 详情不再阻塞帧，改成"先给缓存、后台再刷新"。没有这条线，10 Hz 的帧泵会在空闲时也每秒
 * 踢十次 `status` + `get_target_values` —— 单线程 worker 会被白白烧掉。默认沿用原来那个
 * 慢节拍（`TWIN_STREAM_DETAIL_MS`，2 s）。
 */
export const TWIN_DETAIL_REFRESH_MIN_MS = 2000;

/**
 * 把一次 `/state` 请求的 URL 翻译成读取逻辑要的查询对象（**白名单**，纯函数）。
 *
 * 为什么要有这个函数：路由那一层曾经**只转发 `detail`**，把 `io` / `reg` / `from` / `count` 全丢了
 * ⇒ `createTwinStateHandler` 里 `wantsIo` / `wantsRegisters` 恒为 false ⇒ **面板的 I/O 与寄存器
 * 永远读不出值**（返回的帧里根本没有 `io` / `registers` 字段，界面上那两块要么空着、要么一直停在
 * 一句提示上）。而所有 I/O / 寄存器单测都是**直接调用读取逻辑**的，从不经过路由那一层，所以四道门
 * 全绿也照样漏 —— 抽成纯函数就是为了让"路由到底转发了什么"能被单测钉住（路由本身要挂 webServer
 * 才能测，成本高）。
 *
 * `ip` **故意不转发**：本插件只操作离线仿真，目标由路由钉死在 `SIM_IP` 上。
 *
 * @param {unknown} rawUrl `req.url`（可能带查询串，也可能什么都不是）
 * @returns {{detail: string, io: string, reg: string, from: string, count: string}} 缺省一律空串
 */
export function twinStateQuery(rawUrl) {
  let params;
  try {
    params = new URL(typeof rawUrl === 'string' && rawUrl !== '' ? rawUrl : '/', 'http://localhost')
      .searchParams;
  } catch {
    params = new URLSearchParams();
  }
  const pick = (key) => params.get(key) ?? '';
  return {
    detail: pick('detail'),
    io: pick('io'),
    reg: pick('reg'),
    from: pick('from'),
    count: pick('count'),
  };
}

/**
 * 型号缓存的安全网（毫秒）：**只有拿不到连接代次时**才按龄期判断。
 *
 * 正常路径（推送线程在跑）靠连接代次精确判断，稳态下**一次多余的 Dashboard 往返都没有**；
 * 这条 TTL 是给"推送被关掉 / 旧版 worker 不带 conn 字段"用的兜底：宁可每 10 s 多问一次
 * 型号，也不能让仿真永远停在上一个型号上。
 */
export const TWIN_MODEL_TTL_MS = 10000;

/**
 * 把型号缓存的取值规整成 `{name, epoch, at}`；无法解析时返回 `null`。
 *
 * 兼容两种形态：裸字符串（`'UR5e'`，旧调用方与既有测试用）与完整条目（宿主写回的形态）。
 *
 * @param {unknown} value `modelFor()` 的返回值
 * @returns {{name: string, epoch: string|undefined, at: number|undefined,
 *            simulated: boolean}|null}
 */
export function normalizeModelEntry(value) {
  if (typeof value === 'string') {
    const name = value.trim();
    return name === '' ? null : { name, epoch: undefined, at: undefined, simulated: false };
  }
  if (value !== null && typeof value === 'object') {
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (name === '') return null;
    return {
      name,
      epoch: typeof value.epoch === 'string' && value.epoch !== '' ? value.epoch : undefined,
      at: Number.isFinite(value.at) ? value.at : undefined,
      // `simulated` 跟型号一起读出来（python 的 get_robot_model 会带这个字段）：
      // 仿真面板/截图据此打"仿真"水印，所以它必须与该型号同一个生命周期。
      simulated: value.simulated === true,
    };
  }
  return null;
}

/**
 * Build the `/twin/state` handler.
 *
 * `ip` is **optional** (Ruling 35): the host owns the connection registry, so
 * the browser half must not have to know — or guess — the robot's address.
 *   - `ip` given             → that robot (unchanged behaviour);
 *   - omitted, 0 connected   → `connected:false` / "no robot connected";
 *   - omitted, exactly 1     → that robot (the common single-robot case);
 *   - omitted, 2+ connected  → 400 (ambiguous: the caller must disambiguate).
 *
 * `detail` (0.5.0) adds the dashboard-backed fields already computed by the
 * worker's `status` op. They are much more expensive than a pose read, so the
 * client polls them on a slow channel rather than at pose rate.
 *
 * @param {object} deps
 * @param {{call: Function}|null} deps.worker live UR worker (may be null when
 *   the Python worker failed to initialise).
 * @param {() => Set<string>} deps.connectedIps registry of IPs the `connect`
 *   tool has successfully reached. Advisory only — correctness rests on the
 *   catch below.
 * @param {(ip: string) => (string|{name: string, epoch?: string, at?: number}|null)} [deps.modelFor]
 *   按 IP 记住的机器人型号（`'UR5e'` 或 `{name, epoch, at}`）。型号在**一条连接存续期间**
 *   确实不变，所以值得缓存；但"同一个 IP 换了一台别的型号"时它必然变，所以缓存必须带
 *   **失效条件**（见 `deps.setModelFor` / `deps.telemetryEpoch` / `deps.modelTtlMs`）。
 *   可选 —— 不提供时每次调用都去读型号。
 * @param {(ip: string, entry: {name: string, epoch?: string, at?: number}) => void} [deps.setModelFor]
 *   把**本次读到**的型号写回缓存。没有它，这里读一次就丢一次：文档里写的"缓存"其实只在
 *   别处（工具调用）写过一次时才会命中，其余情况仿真每帧都去 Dashboard 往返一趟。
 * @param {(ip: string) => (string|undefined)} [deps.telemetryEpoch]
 *   推送遥测里带的**连接代次**（见 `lib/worker.js` 的 `telemetry.epoch`）。代次变了说明
 *   这个 IP 上的机器人**换了新连接** —— 也就是"被换成另一台"的唯一可靠信号。缺省从
 *   `deps.telemetry` 的返回值里取 `epoch`。
 * @param {number} [deps.modelTtlMs=TWIN_MODEL_TTL_MS] 拿不到连接代次时的兜底龄期
 * @param {number} [deps.staleMaxMs=TWIN_STALE_MAX_MS] 陈旧帧最多回放多久
 * @param {() => number} [deps.now=Date.now] 时钟（注入点）
 * @param {(ip: string) => ({at: number, ts: number, q: number[], tcp: number[]}|undefined)} [deps.telemetry]
 *   worker 主动推送的最新遥测（`lib/worker.js` 的 `latestTelemetry`）。提供它时，读数
 *   优先走这条**零往返**通道 —— 机器人运动期间 stdin 队列被占住，只有它还出得了数。
 *   缺省为空实现，行为与改动前一致。
 * @param {number} [deps.pushFreshMs=TWIN_PUSH_FRESH_MS] 推送缓存的新鲜窗口，超过就回退显式读
 * @returns {(query?: {ip?: string, detail?: string}) => Promise<{status: number, headers: object, body: object}>}
 */
export function createTwinStateHandler({
  worker,
  connectedIps,
  modelFor,
  setModelFor,
  telemetryEpoch,
  modelTtlMs,
  staleMaxMs,
  now,
  telemetry,
  pushFreshMs,
  detailBudgetMs,
  modelReadBudgetMs,
  modelBackoffMs,
  detailBackoffMs,
  detailRefreshMinMs,
} = {}) {
  const registry = typeof connectedIps === 'function' ? connectedIps : () => new Set();
  const memo = typeof modelFor === 'function' ? modelFor : () => null;
  const sink = typeof setModelFor === 'function' ? setModelFor : null;
  const clock = typeof now === 'function' ? now : Date.now;
  const modelTtl = Number.isFinite(modelTtlMs) && modelTtlMs >= 0 ? modelTtlMs : TWIN_MODEL_TTL_MS;
  const staleWindowMs = Number.isFinite(staleMaxMs) && staleMaxMs >= 0 ? staleMaxMs : TWIN_STALE_MAX_MS;
  const detailBudget = Number.isFinite(detailBudgetMs) && detailBudgetMs > 0
    ? detailBudgetMs
    : TWIN_DETAIL_BUDGET_MS;
  const modelReadBudget = Number.isFinite(modelReadBudgetMs) && modelReadBudgetMs > 0
    ? modelReadBudgetMs
    : TWIN_MODEL_READ_BUDGET_MS;
  const modelBackoff = Number.isFinite(modelBackoffMs) && modelBackoffMs >= 0
    ? modelBackoffMs
    : TWIN_MODEL_BACKOFF_MS;
  const detailBackoff = Number.isFinite(detailBackoffMs) && detailBackoffMs >= 0
    ? detailBackoffMs
    : TWIN_DETAIL_BACKOFF_MS;

  /**
   * 详情缓存与去重（见 `TWIN_DETAIL_BUDGET_MS`）。
   *
   * `detailCache`：每台机器人最近一次**成功**读到的详情；帧路径优先把它带上。
   * `detailInFlight`：同一台机器人同一时刻只飞一次 —— 运动中不会把 worker 队列塞满一堆
   * 没人要的详情请求（旧写法每一帧都新发两次往返，然后一起排队）。
   */
  const detailCache = new Map();
  const detailInFlight = new Map();

  /**
   * 两条**退避线**（ip → 时刻，毫秒）：`clock()` 还没到点就不再发这一类读。
   *
   * 它们解决的是同一件事的两个面：**"读不到"时的代价必须有限**。worker 是单线程 stdin
   * 队列，运动期间任何提交进去的读都要等到运动结束才被处理；帧路径虽然只等
   * `detailBudget` / `modelReadBudget`，但**提交**出去的那次读会一直占着读类闸门
   * （`TWIN_READ_MAX_IN_FLIGHT`，只有 3 个槽位）直到 worker 侧预算耗尽。不退避时，
   * 详情每 2 s 提交一次、型号每帧提交一次 —— 槽位被没人要的请求长期占满，别的读只好排队
   * ⇒ 帧泵被饿死到 5 s 以上 ⇒ 界面「数据已停止更新」。
   *
   * 退避后，忙时最多每 `TWIN_MODEL_BACKOFF_MS` / `TWIN_DETAIL_BACKOFF_MS` 才试一次；空闲时第一次就成功，
   * 退避线立刻清零，常态零影响。
   */
  const modelBackoffUntil = new Map();
  const detailBackoffUntil = new Map();

  /**
   * 详情**后台刷新**的最小间隔（ip → 上次成功读取的时刻）。
   *
   * 详情现在不再阻塞帧（见 `wantsDetail` 那段），而是"用缓存 + 后台刷新"；没有这条线，
   * 10 Hz 的帧泵会在**空闲**时也每秒踢十次 `status` + `get_target_values`，把单线程
   * worker 白白烧掉。用它把刷新压回原来的慢节拍（`TWIN_DETAIL_REFRESH_MIN_MS`，默认 2 s）。
   */
  const detailFetchedAt = new Map();
  const detailRefreshMin = Number.isFinite(detailRefreshMinMs) && detailRefreshMinMs >= 0
    ? detailRefreshMinMs
    : TWIN_DETAIL_REFRESH_MIN_MS;

  /**
   * I/O 读数的**最后一笔成功值 + 去重**（P0-2）。
   *
   * 与 `detailCache` / `detailInFlight` 同一策略：I/O 是**加分项**，某一拍读失败（读类闸门
   * BUSY、worker 正被运动命令占住、某一根通道临时报错）不该让整块 I/O 变成一行 `{error}` ——
   * 面板会把它显示成"读取失败"。失败时带上上一笔成功读数并附 `error` 说明，与详情通道一致。
   *
   * 去重的作用：同一台机器人的帧可能由轮询与 SSE 两条路同时要，没必要把同一组四路读塞两遍。
   */
  const ioCache = new Map();
  const ioInFlight = new Map();

  /**
   * 读一次详情（dashboard 状态 + 目标姿态）。
   *
   * `status` 失败即整笔失败（调用方据此如实写 `detail.error`）；`get_target_values` 失败只是
   * 少了"幽灵臂"那一层 —— 语义与旧版一致，区别只是**不再阻塞帧**。
   */
  const readDetail = (ip) => {
    const existing = detailInFlight.get(ip);
    if (existing !== undefined) return existing;
    const job = (async () => {
      const detail = {};
      const st = await worker.call('status', { ip });
      const d = st?.data;
      if (d && typeof d === 'object') {
        detail.safety_mode = d.safety_mode;
        detail.robot_mode = d.robot_mode;
        detail.program_state = d.program_state;
        detail.loaded_program = d.loaded_program;
        detail.running = d.running;
        detail.remote_control = d.remote_control;
        detail.software_version = d.software_version;
        detail.serial_number = d.serial_number;
        detail.up_time_seconds = d.up_time_seconds;
        detail.speed_scaling = d.speed_scaling;
        detail.robot_voltage = d.robot_voltage;
        detail.robot_current = d.robot_current;
        detail.joint_temperatures = d.joint_temperatures;
        detail.joint_currents = d.joint_currents;
        // 清单第 9 条（工程辅助可视化）：`status` 本来就带这两个 RTDE 量
        // （python 侧 `op_status` 的 `tcp_force` / `tcp_speed`），透传出去给
        // TCP 受力箭头与 HUD 用，**不需要任何新增的 worker 调用**。
        detail.tcp_force = d.tcp_force;
        detail.tcp_speed = d.tcp_speed;
      }
      // 目标姿态（数字仿真的"幽灵臂"）：`target_*` 来自 RTDE 数据流，**不在** dashboard 的
      // status 里，所以要单独问一次 worker。它是加分项：拿不到就不给这一层。
      try {
        const targets = await worker.call('get_target_values', { ip });
        const targetQ = targets?.data?.target_q;
        if (Array.isArray(targetQ) && targetQ.length === 6 && targetQ.every(Number.isFinite)) {
          detail.target_q = targetQ;
        }
      } catch {
        /* 加分项 */
      }
      return detail;
    })();
    detailInFlight.set(ip, job);
    const done = () => { if (detailInFlight.get(ip) === job) detailInFlight.delete(ip); };
    job.then(done, done);
    return job;
  };

  /** 有界等待：超时就 reject（调用方降级到上一笔缓存），绝不让帧无限等下去。 */
  const bounded = (promise, ms) => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`读取超过 ${ms}ms（worker 正忙），这一拍降级到上一笔缓存`)),
        ms,
      );
      if (typeof timer.unref === 'function') timer.unref();
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  };
  /**
   * 读主动推送的缓存。**任何异常都降级成"没有推送"**：遥测推送是加分项，它出问题只能
   * 让这一帧回退到显式读，绝不能让整个状态查询失败。
   */
  const readPushed = (ip) => {
    if (typeof telemetry !== 'function') return undefined;
    try {
      const value = telemetry(ip);
      return value !== null && typeof value === 'object' ? value : undefined;
    } catch {
      return undefined;
    }
  };
  const pushFreshWindowMs = Number.isFinite(pushFreshMs) && pushFreshMs >= 0 ? pushFreshMs : TWIN_PUSH_FRESH_MS;
  /**
   * 这一帧看到的**连接代次**（拿不到时为 `undefined`）。
   *
   * 三种来源，按可靠性排序：注入的 `telemetryEpoch()` → 推送缓存自带的 `epoch`
   * （`lib/worker.js` 已把"第几个子进程"拼进去，跨 worker 重启也不会撞车）→ 都没有就是
   * `undefined`，调用方退回按 TTL 判断。任何异常一律降级成"不知道"，绝不因此让这一帧失败。
   */
  const epochOf = (ip) => {
    if (typeof telemetryEpoch === 'function') {
      try {
        const value = telemetryEpoch(ip);
        if (typeof value === 'string' && value !== '') return value;
        return undefined;
      } catch {
        return undefined;
      }
    }
    const pushed = readPushed(ip);
    const value = pushed !== undefined && pushed !== null ? pushed.epoch : undefined;
    return typeof value === 'string' && value !== '' ? value : undefined;
  };
  /**
   * 每台机器人**最后一笔成功读数**（ip → {body, at}）。
   *
   * 只用于"暂时读不到"时降级成陈旧帧；条目很小（qs/tcp 各 6 个数），键的个数就是已连接
   * 机器人的台数。超过 `staleWindowMs` 的条目会被删除，绝不无限回放。
   */
  const lastGood = new Map();

  /** Read the registry defensively — a throwing source degrades to "unknown". */
  function knownIps() {
    try {
      const value = registry();
      return value instanceof Set ? [...value] : [];
    } catch {
      return [];
    }
  }

  const truthy = (value) => value === true || value === '1' || value === 'true';

  /** 把查询参数夹到整数区间（非法值取兜底），用于寄存器的分片参数。 */
  const clampInt = (value, fallback, lo, hi) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(hi, Math.max(lo, Math.trunc(n)));
  };

  /**
   * **串行**执行一组读（P0-2，H-3 的另一半）。
   *
   * 为什么不能再用 `Promise.all` 直接扇出：`UrWorker.call()` 的读类闸门按**单次调用**计数
   * （`lib/twin-worker.js` 的 `TWIN_READ_MAX_IN_FLIGHT = 3`）。一帧 `/state?io=1` 自己就发 4 个
   * 读、寄存器最多发 16 个 —— 并发扇出会在**宿主侧**被自己的闸门拒成 `WORKER_BUSY`，而
   * `Promise.all` 首个 reject 会让整块 I/O 变成 `{error}`（面板报"读取失败"，其实只是四路里
   * 有一路排队）。收紧准入（P0-2①）之后这是**确定性**的，所以扇出必须收进闸门：
   * 串行执行让同一帧任何时刻只占 1 个读槽，3 路订阅同时读也刚好 ≤ 闸门 3；
   * 超出的订阅仍按既有设计退化成 `frame-error`，客户端保留上一帧。
   */
  const readSerial = async (tasks) => {
    const values = [];
    for (const task of tasks) values.push(await task());
    return values;
  };

  /**
   * 数字 I/O + 模拟输入（0.1.9）。
   *
   * ⚠️ 只用 **RTDE 侧**的读法：`get_digital_output_bits` / `get_digital_input_bits` / `get_analog_in`。
   * 不用 `get_digital_in(which="tool")` —— 那条会往控制器发一段短 URScript，**可能打断正在运行
   * 的程序**（README 的「工具端数字 I/O」一节写着这件事）。面板只是读数，不能有这种副作用。
   *
   * ⚠️ **op 名是 `get_digital_output_bits`（output），不是 `get_digital_out_bits`（out）**。工具名恰好
   * 叫 `ursim_get_digital_out_bits`，这里曾照工具名的写法少了一个 "put"，于是面板的 I/O 一行永远显示
   * 「未知操作：get_digital_out_bits」而读不出任何值 —— 而单测里的假 worker 也照错名伪造，四道门全绿。
   * op 名一律以 `python/ur_worker.py` 的 `HANDLERS` 为准；`scripts/check-worker-ops.py` 现在会把这类
   * "宿主直接调用、worker 不认"的 op 名判红。
   *
   * ⚠️ 四路读必须**串行**（见 `readSerial`）：并发扇出会撞上读类闸门（P0-2）。
   */
  const readIo = async (target) => {
    const read = async (op, params = {}) => {
      const res = await worker.call(op, { ip: target, ...params });
      return res?.data ?? null;
    };
    const [out, din, an0, an1] = await readSerial([
      () => read('get_digital_output_bits'),
      () => read('get_digital_input_bits'),
      () => read('get_analog_in', { n: 0 }),
      () => read('get_analog_in', { n: 1 }),
    ]);
    const bits = (value) => (Array.isArray(value) ? value.map((b) => b === true) : null);
    const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
    return {
      digital_out: bits(out?.bits),
      digital_in: bits(din?.bits),
      analog_in: [num(an0?.value), num(an1?.value)],
      simulated: out?.simulated === true || din?.simulated === true,
      note: typeof din?.note === 'string' ? din.note : null,
    };
  };

  /**
   * 读一次 I/O（同一台机器人同一时刻只飞一次，见 `ioCache` 的说明）。
   *
   * @param {string} ip
   * @returns {Promise<object>} `readIo()` 的结果（失败时 reject，由调用方降级到 `ioCache`）
   */
  const readIoOnce = (ip) => {
    const existing = ioInFlight.get(ip);
    if (existing !== undefined) return existing;
    const job = readIo(ip);
    ioInFlight.set(ip, job);
    const done = () => { if (ioInFlight.get(ip) === job) ioInFlight.delete(ip); };
    job.then(done, done);
    return job;
  };

  /**
   * 一段寄存器（0.1.9）：逐下标 getter，`count` 硬上限 16。
   *
   * 为什么要分片：这两个读数**没有批量工具**（int/double 0-23、bool 0-63 都是逐个 index 读），
   * 一次要 112 个值就是 112 次往返。分片 + 上限让"面板刷一次"最多 16 次，且调用方自己决定要哪段。
   *
   * ⚠️ **逐下标读也必须串行**（P0-2）：16 个 `Promise.all` 的并发读会被读类闸门
   * （`TWIN_READ_MAX_IN_FLIGHT`）拒掉第 4 个起的所有请求，整块寄存器变成 `WORKER_BUSY` 错误行。
   */
  const readRegisters = async (target, set, from, count) => {
    const spec = set === 'int'
      ? { op: 'get_int_register', max: 23 }
      : set === 'double'
        ? { op: 'get_double_register', max: 23 }
        : { op: 'get_bit_register', max: 63 };
    const start = clampInt(from, 0, 0, spec.max);
    const span = clampInt(count, 8, 1, 16);
    const end = Math.min(start + span - 1, spec.max);
    const indexes = [];
    for (let i = start; i <= end; i += 1) indexes.push(i);
    const values = await readSerial(indexes.map((index) => async () => {
      const res = await worker.call(spec.op, { ip: target, index });
      const value = res?.data?.value;
      if (typeof value === 'boolean') return value;
      return Number.isFinite(Number(value)) ? Number(value) : null;
    }));
    return { set, from: start, count: indexes.length, values };
  };

  return async function handleTwinState(query = {}) {
    const requested = textOf(query?.ip);
    const wantsDetail = truthy(query?.detail ?? query?.full);
    /*
     * I/O 与寄存器通道（0.1.9）。与 `detail` 同一条策略：**慢通道、加分项**，失败绝不影响位姿。
     *
     * 为什么不做成独立路由：这两个读数没有批量工具（数字位是两条 op，寄存器是逐下标 getter），
     * 而这条路由已经解决了 ip 解析、信任围栏与"某一路失败不成灾"三件事 —— 再开一条只会把
     * 这三件事抄一遍，还会多出一个需要单独守的口子。
     */
    const wantsIo = truthy(query?.io);
    const registerSet = textOf(query?.reg).toLowerCase();
    const wantsRegisters = registerSet === 'int' || registerSet === 'double' || registerSet === 'bit';
    let ip = requested;

    if (ip === '') {
      const ips = knownIps();
      if (ips.length === 0) {
        return disconnected(TWIN_CODES.NO_ROBOT, 'no robot connected');
      }
      if (ips.length > 1) {
        return {
          status: 400,
          headers: STATE_HEADERS,
          body: {
            connected: false,
            code: TWIN_CODES.AMBIGUOUS,
            error: 'multiple robots connected; pass ?ip=<ip>',
            reason: `当前有 ${ips.length} 台机器人已连接，请指定 ?ip=`,
            ips: ips.slice().sort(),
          },
        };
      }
      ip = ips[0];
    } else if (!knownIps().includes(ip)) {
      return disconnected(TWIN_CODES.NOT_CONNECTED, `robot ${ip} is not connected`, { ip });
    }

    if (worker === null || worker === undefined || typeof worker.call !== 'function') {
      return disconnected(TWIN_CODES.WORKER_UNAVAILABLE, 'UR worker unavailable', { ip });
    }

    try {
      /*
       * ① 新鲜推送优先：这条路上**没有任何 worker 往返**，所以机器人正在执行运动命令
       * （stdin 队列被运动确认循环占住）时它照样出帧 —— 这就是"数字仿真完整跟随机器人
       * 动作"的实现。② 推送缺失或过期时才回退到显式读：静止时的常规路径，也是推送线程
       * 万一停摆时的安全网。
       */
      let q = [];
      let tcp = [];
      let frameTs = clock();
      const pushed = readPushed(ip);
      if (pushed !== undefined && clock() - pushed.at <= pushFreshWindowMs) {
        q = Array.isArray(pushed.q) ? pushed.q : [];
        tcp = Array.isArray(pushed.tcp) ? pushed.tcp : [];
        // 采样时刻由 worker 提供（与宿主同一台机器），客户端据此算"数据停了多久"。
        if (Number.isFinite(pushed.ts)) frameTs = pushed.ts;
      } else {
        /*
         * 两次读**串行**，与文件里其它读路径一致（见 :417 与 :490 的说明）：
         *
         * 读类闸门（`TWIN_READ_MAX_IN_FLIGHT`）按**单次调用**计数。以前这里是 `Promise.all`
         * 两读并发 —— 单帧占 2 个槽位，而闸门只有 3 个，于是"两路订阅 + 一帧回退读"就会让
         * 第三路起拿到 `WORKER_BUSY`（面板表现为间歇 `frame-error`）。串行后每路帧泵最多
         * 占 1 个槽位，`maxClients` 也就有了确定的算术：路数 = 槽位数（见下方 maxClients）。
         * 回退路径只在推送过期时才走，多一个往返换来的是不再互相饿死。
         */
        const jp = await worker.call('get_joint_pose', { ip });
        const tp = await worker.call('get_tcp_pose', { ip });
        // 注意信封层级：协议响应是 `{"id":n,"ok":true,"data":<op 的返回值>}`，而每个 op 自己
        // 返回的是 `{"message":…,"data":{…}}`（见 python/ur_worker.py 的 ok()：它**原样**返回
        // 传进来的 dict）。`UrWorker.call()` resolve 的是响应里的 `data`，所以这里拿到的是
        // `{message, data:{…}}` —— 真正载荷在**再下一层** `.data`。
        // 曾经按单层读（`jp.joint_positions`），于是 model/q/tcp 恒为空、仿真面板连上机器人也
        // 只显示黑屏；而 test/twin-routes.test.mjs 的假 worker 恰好造了扁平的返回值，所以门禁
        // 一直是绿的。改这里时请同步那张假 worker 的形状。
        q = Array.isArray(jp?.data?.joint_positions) ? jp.data.joint_positions : [];
        tcp = Array.isArray(tp?.data?.tcp_pose) ? tp.data.tcp_pose : [];
      }

      /*
       * 型号：**缓存还作不作数**由连接代次决定，其次才是龄期。
       *
       * 以前这里是 `memo(ip) || 去读一次`：读到的值从不写回，于是文档里承诺的"缓存"
       * 只在别处（工具调用返回过 robot_model）写过一次时才生效；而一旦生效就**永久生效**
       * —— 型号只在一台机器人的连接存续期间不可能变，可"同一个 IP 换了一台别的型号"
       * 恰恰会换掉连接。结果就是仿真永远停在上一个型号上（换装、取景、可达范围、
       * 关节限位全部沿用旧型号），只有重新走一次 ursim_connect / ursim_disconnect 才会好。
       *
       * 现在：代次变了（`ensure_connected` 重建过连接）就重读；拿不到代次（推送关掉 /
       * 旧版 worker）则按 TTL 兜底重读。稳态下代次不变 ⇒ 一次多余的 Dashboard 往返都没有。
       */
      const epoch = epochOf(ip);
      const cachedModel = normalizeModelEntry(memo(ip));
      /**
       * 推送行自带的型号（0.3.11）：运动期间**唯一**的型号来源，零 worker 往返。
       *
       * 以前这里只有"缓存命中 / 去读一次"两条路，而读取在运动期间必然超时（要排 stdin
       * 队列）—— 超时就是抛异常，直接掉进外层 catch 的陈旧回放分支，界面写「数据已停止
       * 更新 Ns」。仿真侧把型号塞进 20 Hz 的推送行之后，这条路彻底不需要 worker 了。
       */
      const pushedModel = pushed !== undefined && pushed !== null && typeof pushed.model === 'string'
        ? pushed.model.trim()
        : '';
      let model = '';
      let simulated = false;
      let needModelRead = true;
      if (pushedModel !== '') {
        model = pushedModel;
        needModelRead = false;
        // 顺手写回缓存：静态事实，别的路径（工具调用 / 后续帧）也能直接用。
        if (sink !== null && (cachedModel === null
          || cachedModel.name !== pushedModel
          || (epoch !== undefined && cachedModel.epoch !== epoch))) {
          try {
            sink(ip, {
              name: pushedModel,
              epoch,
              at: clock(),
              simulated: pushed !== undefined && pushed !== null && pushed.simulated === true,
            });
          } catch {
            /* 缓存写失败只是退化成"下次还要写一次"，绝不能毁掉这一帧 */
          }
        }
      }
      if (needModelRead && cachedModel !== null) {
        if (epoch !== undefined && cachedModel.epoch !== undefined) {
          needModelRead = cachedModel.epoch !== epoch;
        } else if (Number.isFinite(cachedModel.at)) {
          needModelRead = clock() - cachedModel.at > modelTtl;
        } else {
          // 既没有代次也没有龄期（调用方只给了一个裸字符串）：当作可信的记忆，保持原语义。
          needModelRead = false;
        }
        if (!needModelRead) {
          model = cachedModel.name;
          simulated = cachedModel.simulated;
        }
      }
      if (needModelRead) {
        /*
         * 有缓存就先拿来兜底：型号是**静态事实**，"这一拍问不到"不等于"这一帧没有型号"。
         *
         * 读本身是**有界**的（`TWIN_MODEL_READ_BUDGET_MS`），而且失败后再等
         * `TWIN_MODEL_BACKOFF_MS` 才重试 —— 否则"超时 ⇒ 没写缓存 ⇒ 下一帧再读 ⇒ 再超时"
         * 会自我维持，运动期间每一帧都要付一次 2.5 s 排队代价。
         */
        if (cachedModel !== null) {
          model = cachedModel.name;
          simulated = cachedModel.simulated;
        }
        const now = clock();
        const backoffUntil = modelBackoffUntil.get(ip);
        if (backoffUntil === undefined || now >= backoffUntil) {
          try {
            const md = await bounded(worker.call('get_robot_model', { ip }), modelReadBudget);
            const name = String(md?.data?.robot_model ?? '').trim();
            if (name === '') {
              modelBackoffUntil.set(ip, now + modelBackoff);
            } else {
              model = name;
              simulated = md?.data?.simulated === true;
              modelBackoffUntil.delete(ip);
              // 读到了就写回，下次（同一个代次内）不必再问。写不进去不影响这一帧。
              if (sink !== null) {
                try {
                  sink(ip, { name, epoch, at: clock(), simulated });
                } catch {
                  /* 缓存写失败只是退化成"下次还要再读一次"，绝不能毁掉这一帧 */
                }
              }
            }
          } catch {
            /*
             * 型号读超时（运动期间必然发生）：用上一次已知值，**绝不让整帧变成陈旧回放**。
             * 一行提示都不值得换掉一整帧连续的位姿。
             */
            modelBackoffUntil.set(ip, now + modelBackoff);
          }
        }
      }
      // 推送行本身也带 `simulated`（见 python 的 `_twin_push_loop`）：型号缓存命中时它是
      // 第二个证据来源，避免"仿真刚起、型号条目还没刷新"的那一两帧水印缺失。
      if (pushed !== undefined && pushed !== null && pushed.simulated === true) simulated = true;

      /** `q` empty but `connected:true` would freeze the arm with no explanation. */
      const degraded = q.length < 6
        ? { code: 'incomplete_pose', reason: '机器人没有返回完整的关节角（q 不足 6 维）' }
        : undefined;

      const body = {
        connected: true,
        // Echoed so the client can show *which* robot it resolved to when it did
        // not pass ?ip= itself.
        ip,
        model,
        q,
        tcp,
        // 这一帧是不是在展示**离线仿真**里的一台虚拟机器人？面板据此把"仿真"水印与
        // "它不会动真机"说清楚 —— 界面绝不能让人以为这是真机读数。
        simulated,
        // 读数时间：推送路径用 worker 的采样时刻，读路径用本次读取时刻。客户端据此算
        // "数据停了多久"，所以它必须来自采样，而不是推送/响应的到达时间。
        ts: frameTs,
        ...(degraded ? { degraded: true, ...degraded } : {}),
      };

      // 待审批的运动目标（清单第 8 条：先看后动）：审批弹窗说"要动了"，仿真面板同步把
      // 目标画出来 —— 比弹窗里一串数字强得多。
      //
      // 没有待审批时**整个字段缺席**（而不是给 null），client 一眼就能区分"当前没有审批"
      // 与"有审批但解析不出目标"。
      const pending = pendingMotion.read();
      if (pending !== null) body.pending_motion = pending;

      if (wantsDetail) {
        /*
         * ⚠️ 详情**绝不能在帧路径上等 worker**（修复"运动期间画面卡顿"）。
         *
         * `status` + `get_target_values` 走的是单线程 stdin 队列：机器人运动时主线程卡在
         * 到位确认循环里，它们要一直排到运动结束 —— 实测每次 2.5 s（twin 读预算）。而 SSE 是
         * "每 2 s 带一次 detail"的慢节拍，于是运动期间每 2 s 就有一次帧被拖慢、界面闪一下
         * 「数据已停止更新」。
         *
         * 现在：**只要有过一笔详情，这一帧就不碰 worker** —— 直接用缓存，同时把"刷新"丢到
         * 后台（不 await、失败只退避）。详情是加分项，一秒都不值得让位姿帧去排队。第一帧
         * 没有缓存时才做一次有界等待（静止时很快；运动中最多 `detailBudgetMs`）。
         */
        const cachedDetail = detailCache.get(ip);
        const now = clock();
        const backoffUntil = detailBackoffUntil.get(ip);
        const cooling = backoffUntil !== undefined && now < backoffUntil;

        /** 后台刷新详情：不阻塞这一帧，失败只记退避（绝不冒泡成 frame-error）。 */
        const refreshDetailInBackground = () => {
          if (cooling) return;
          const lastAt = detailFetchedAt.get(ip);
          if (lastAt !== undefined && clock() - lastAt < detailRefreshMin) return;
          // 先占位再发：10 Hz 的帧泵否则会在同一个窗口里连踢十次。
          detailFetchedAt.set(ip, clock());
          void bounded(readDetail(ip), detailBudget).then((detail) => {
            detailCache.set(ip, detail);
            detailBackoffUntil.delete(ip);
          }, () => {
            // 失败不占刷新位，交给退避线管（它才是"别一直重试"的那道闸）。
            detailFetchedAt.delete(ip);
            detailBackoffUntil.set(ip, clock() + detailBackoff);
          });
        };

        if (cachedDetail !== undefined) {
          body.detail = cachedDetail;
          refreshDetailInBackground();
        } else if (!cooling) {
          try {
            const detail = await bounded(readDetail(ip), detailBudget);
            detailCache.set(ip, detail);
            detailFetchedAt.set(ip, clock());
            detailBackoffUntil.delete(ip);
            body.detail = detail;
          } catch (e) {
            const reason = e instanceof Error ? e.message : String(e);
            // Detail is a bonus: a failure must not take down the pose channel.
            // 超时就退避：不值得为了 HUD 里那几行数字一直占着读槽位。
            detailFetchedAt.delete(ip);
            detailBackoffUntil.set(ip, now + detailBackoff);
            body.detail = { error: reason };
          }
        } else {
          body.detail = { error: '详情读取退避中（worker 正被运动命令占住）' };
        }
      }

      // I/O 与寄存器（0.1.9）同样是加分项：任何失败都只写进自己的字段，位姿通道照常。
      if (wantsIo) {
        const cachedIo = ioCache.get(ip);
        if (cachedIo !== undefined) {
          /*
           * 有上一笔就给上一笔，刷新丢到后台（与详情同一策略）：I/O 是加分项，运动期间那次读
           * 会一直排在 stdin 队列里，干等它只会把面板的位姿通道一起拖慢。
           */
          body.io = cachedIo;
          void bounded(readIoOnce(ip), detailBudget).then((io) => {
            ioCache.set(ip, io);
          }, () => { /* 失败就继续用上一笔，绝不冒泡成 frame-error */ });
        } else {
          try {
            // 没有缓存时才等一次（有界）：I/O 是加分项，不能把这条请求拖到 2.5 s 以上。
            const io = await bounded(readIoOnce(ip), detailBudget);
            ioCache.set(ip, io);
            body.io = io;
          } catch (e) {
            const reason = e instanceof Error ? e.message : String(e);
            body.io = { error: reason };
          }
        }
      }
      if (wantsRegisters) {
        try {
          // 同上：寄存器也是加分项，有界等待（超时就报这一块，不影响位姿）。
          body.registers = await bounded(
            readRegisters(ip, registerSet, query?.from, query?.count),
            detailBudget,
          );
        } catch (e) {
          body.registers = { error: e instanceof Error ? e.message : String(e) };
        }
      }

      // 这一帧真的读到了：记成"最后一笔已知读数"，供暂时读不到时降级回放。
      lastGood.set(ip, { body, at: clock() });

      return { status: 200, headers: STATE_HEADERS, body };
    } catch (e) {
      /*
       * Never 500 on a robot/worker error.
       *
       * 但**也不能**把"暂时读不到"报成"机器人没连上"：
       * `UrWorker` 是单线程 stdin 队列，机器人执行运动指令期间仿真的读会排队并超时
       * （这是常态）。把它当成未连接，客户端就会藏掉整个 3D 视图与 HUD —— 用户看到的正是
       * "仿真同步了两个动作之后就不动了"。所以这一类降级成**陈旧帧**：仍然是 connected，
       * 但 `ts` 保持原值（龄期继续增长）、并显式带上 `stale:true` 与原因，让客户端一边
       * 保留读数一边如实显示"数据已停止更新"。
       */
      const errorCode = e !== null && typeof e === 'object' ? e.code : undefined;
      const cached = lastGood.get(ip);
      if (cached !== undefined) {
        const age = clock() - cached.at;
        if (TWIN_TRANSIENT_WORKER_CODES.has(errorCode) && age <= staleWindowMs) {
          return {
            status: 200,
            headers: STATE_HEADERS,
            body: {
              // 原样回放最后一笔已知读数（含**原来的** ts）。
              ...cached.body,
              stale: true,
              stale_reason: errorCode,
              stale_ms: age,
            },
          };
        }
        // 过了回放窗口（或不是"暂时"类错误）：不再假装知道机器人在哪。
        if (age > staleWindowMs) lastGood.delete(ip);
      }
      return disconnected(TWIN_CODES.ROBOT_ERROR, e instanceof Error ? e.message : String(e), { ip });
    }
  };
}

/** SSE 推送间隔（毫秒）。比 10 Hz 轮询更快，但没必要更快 —— 采样率是宿主侧的事。 */
export const TWIN_STREAM_INTERVAL_MS = 100;

/** SSE 心跳间隔（毫秒）：有些代理在 30–60 s 无数据时会切断连接。 */
export const TWIN_STREAM_HEARTBEAT_MS = 15000;

/**
 * 流里的 `detail` 慢节拍（毫秒）。
 *
 * ⚠️ **必须做**：`createTwinStateHandler` 只在 query 带 `detail=1` 时才去问 dashboard。
 * 流如果一帧都不带 detail，安全模式 / 温度 / 倍率 / 母线就**永远是空的** —— 而这几项
 * 恰恰是清单第 1 条刚补进来的现场排障信息。也不能每帧都带：dashboard 往返明显贵于
 * 一次位姿读，10 Hz 地问会把机器人打满。
 */
export const TWIN_STREAM_DETAIL_MS = 2000;

/**
 * 一帧读**还没回来**时的"数据停滞"提示节拍（毫秒）。
 *
 * ⚠️ **必须有**：Python worker 是单线程 `for line in sys.stdin`，而运动类工具会一直占着它
 * （`_movej_confirm` / `_wait_robot_idle` 的确认循环要等机器人真的停下来）。仿真的读因此会
 * **排队**，而 `pumping` 背压又明确"上一帧没回来就不发下一帧" —— 两者叠加的结果是：机器人
 * 一运动，流就**一个事件都不发**。客户端看到的是一条"开着的、安静的流"，画面停在最后一帧
 * 且没有任何提示，用户看到的正是"同步两个动作后就不动了"。
 *
 * 所以读还没回来时改为周期性发一个 `stale` 事件（客户端据此显示"数据已停止更新"），
 * 而不是静默。实测：`scripts/probe-twin-pump-stall.mjs` 修前 6 s 零事件。
 */
export const TWIN_STREAM_STALE_NOTIFY_MS = 1000;

/**
 * 单帧读的安全网（毫秒）：超过这个时长仍未 settle 就**放弃这一帧**。
 *
 * 这是一条兜底：正常路径由 worker 自己的超时结束（`lib/index.js` 的仿真读另有更短的
 * 专用预算），这里只防"读的 promise 永远不 settle"（例如 worker 管理器卡在 spawn 上）。
 * 刻意取得比 worker 预算大得多，避免与它抢着结束同一帧 —— 抢跑会导致实际请求在 worker
 * 队列里继续叠加（`maxInFlight` 只有 8，堆满会让**每一帧**都立刻失败）。
 */
export const TWIN_STREAM_FRAME_TIMEOUT_MS = 15000;

/**
 * 非 `state` 事件的类型名。
 *
 * ⚠️ **绝不能叫 `error`。** 浏览器把 `EventSource.onerror` 实现成
 * `addEventListener('error', …)`（规范：onerror 就是 error 事件的事件处理器属性），
 * 而服务端事件是按 `event:` 字段派发的 ⇒ 一个名叫 `error` 的服务端事件会**直接命中
 * 客户端的 onerror**，被当成"连接断了"，于是宿主文档里那句"单帧失败只发一个 error 事件，
 * 绝不拆掉整条流"在真实浏览器里恰好**反过来**。实测（`scripts/probe-twin-stream-error-event.mjs`）：
 * 一个 error 帧 ⇒ 客户端拆流重连；连来 8 次 ⇒ 客户端进入终态 gaveup，仿真永久冻结。
 */
export const TWIN_STREAM_FRAME_ERROR_EVENT = 'frame-error';

/** 数据停滞提示的事件名（客户端保留上一帧，只把"停了多久"显示出来）。 */
export const TWIN_STREAM_STALE_EVENT = 'stale';

/** 从请求 URL 里取查询串（SSE handler 拿不到已解析的 query）。 */
function queryOf(url) {
  const at = typeof url === 'string' ? url.indexOf('?') : -1;
  if (at === -1) return {};
  const out = {};
  for (const [key, value] of new URLSearchParams(url.slice(at + 1))) out[key] = value;
  return out;
}

/**
 * Build the `/twin/stream` Server-Sent Events handler（清单第 20 条：实时跟随）。
 *
 * DSH 的 `webServer` 路由契约是 `handler(req, res) => void`，类型定义里明确写了
 * "owns the full response lifecycle (may hold the response open, e.g. SSE)" ——
 * 所以这条路由**不需要任何上游改动**，也不需要返回 `{status, headers, body}`。
 *
 * 与 `/twin/state` 的关系：**互斥使用**。客户端要么轮询、要么订阅流；两套并存会让同一
 * 帧被推两次、画面抖动。handler 内部直接复用 `createTwinStateHandler`，所以两条路
 * 经的纯逻辑完全一致。
 *
 * ## 事件（0.6.6 起）
 * - `state`：**完整**状态快照（直接复用状态路由的 body），逐帧替换。
 * - `stale`：这一帧的读还没回来（worker 被运动指令占住是常态）。客户端保留上一帧，
 *   把"数据停了多久"显示出来。
 * - `frame-error`：这一帧彻底失败了（读抛错，或超过 `frameTimeoutMs` 被放弃）。
 *   **刻意不叫 `error`** —— 那个名字会被浏览器的 `EventSource.onerror` 接走，
 *   于是一次单帧失败就把整条流拆掉（见 `TWIN_STREAM_FRAME_ERROR_EVENT` 的注释）。
 *
 * ## 不变量
 * - 同一时刻**只有一帧读在飞**（不向单线程 worker 叠加请求；`maxInFlight` 只有 8，
 *   叠满会让每一帧都立刻失败）。
 * - 任何情况下都**不静默**：它要么发 `state`，要么发 `stale`，要么发 `frame-error`。
 * - 单帧的失败/超时**绝不**关闭连接，也绝不结束响应。
 *
 * @param {object} deps 与 `createTwinStateHandler` 相同，另加 `intervalMs` / `heartbeatMs` /
 *   `detailMs` / `staleNotifyMs` / `frameTimeoutMs` / `now`
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void}
 */
export function createTwinStreamHandler(deps = {}) {
  const readState = createTwinStateHandler(deps);
  const intervalMs = Number.isFinite(deps.intervalMs) && deps.intervalMs > 0
    ? deps.intervalMs
    : TWIN_STREAM_INTERVAL_MS;
  const heartbeatMs = Number.isFinite(deps.heartbeatMs) && deps.heartbeatMs > 0
    ? deps.heartbeatMs
    : TWIN_STREAM_HEARTBEAT_MS;
  const detailMs = Number.isFinite(deps.detailMs) && deps.detailMs >= 0
    ? deps.detailMs
    : TWIN_STREAM_DETAIL_MS;
  const staleNotifyMs = Number.isFinite(deps.staleNotifyMs) && deps.staleNotifyMs > 0
    ? deps.staleNotifyMs
    : TWIN_STREAM_STALE_NOTIFY_MS;
  const frameTimeoutMs = Number.isFinite(deps.frameTimeoutMs) && deps.frameTimeoutMs > 0
    ? deps.frameTimeoutMs
    : TWIN_STREAM_FRAME_TIMEOUT_MS;
  const now = typeof deps.now === 'function' ? deps.now : Date.now;
  /*
   * 同时存活的订阅上限（H-3）。
   *
   * 每路订阅都有自己的帧泵（每 100 ms 一次读）。超过这个数量就**不再接受**新订阅、明确回 503，
   * 而不是让所有订阅一起退化成 `frame-error`：读类在 worker 侧只有 3 个槽位（见 twin-worker.js
   * 的 `TWIN_READ_MAX_IN_FLIGHT`），第 4 路只会互相饿死。
   *
   * ⚠️ 默认值必须与那个槽位数**对得上**：串行化读之后（见下方回退读的说明）每路帧泵最多
   * 占 1 个在读槽位，所以"路数 ≤ 槽位数"。以前写死 4 而槽位是 3，第 4 路稳定拿
   * `WORKER_BUSY`；注释还声称 4 已覆盖"面板 + 另一个标签页 + 诊断脚本"，等于把一个必然
   * 失败的配置当成默认值。要放宽就先把槽位调大（并接受命令类少几个槽位）。
   */
  const maxClients = Number.isFinite(deps.maxClients) && deps.maxClients > 0
    ? deps.maxClients
    : TWIN_STREAM_MAX_CLIENTS;
  let activeStreams = 0;

  return function handleTwinStream(req, res) {
    if (req?.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('allow', 'GET');
      res.end();
      return;
    }

    if (activeStreams >= maxClients) {
      // 明确告诉调用方"太多订阅"，而不是静默降级：仿真面板会把这条当成连接失败来提示。
      res.writeHead(503, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': NO_STORE,
      });
      res.end(JSON.stringify({ error: 'too many twin streams', active: activeStreams, max: maxClients }));
      return;
    }
    activeStreams += 1;

    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': NO_STORE,
      connection: 'keep-alive',
      // 反向代理常见的缓冲会把 SSE 攒成一坨再吐，显式关掉。
      'x-accel-buffering': 'no',
    });

    let closed = false;
    /**
     * 当前在飞的那一帧读（`null` = 空闲）。
     *
     * ⚠️ 语义是"**这一帧的读已经发出去了**"，而不是"泵正在跑"：前者才是背压的正确粒度。
     * 以前这里是布尔 `pumping`，同样不做叠加 —— 但读慢了（worker 被运动指令占住是常态）
     * 就**什么都不发**，客户端无法区分"数据停了"与"一切正常"。现在读在飞时：
     *   ① 周期性发 `stale`（把停滞如实说出来）；
     *   ② 超过 `frameTimeoutMs` 就放弃这一帧（安全网，防 promise 永不 settle）。
     */
    let inFlight = null;
    let readSeq = 0;
    let frameErrors = 0;
    let lastStaleAt = Number.NEGATIVE_INFINITY;
    // detail 慢节拍：只有走到点上才向 dashboard 要一次状态细节（见 TWIN_STREAM_DETAIL_MS）。
    let lastDetailAt = Number.NEGATIVE_INFINITY;

    const send = (event, data) => {
      if (closed) return;
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        // 写失败即视为断开；cleanup 由 close 事件兜底。
      }
    };

    /** 读还没回来：至少让客户端知道"数据停在哪儿了"（静默停帧是不可接受的）。 */
    const notifyStalled = (entry) => {
      if (closed) return;
      const at = now();
      if (at - lastStaleAt < staleNotifyMs) return;
      lastStaleAt = at;
      send(TWIN_STREAM_STALE_EVENT, {
        pendingMs: Math.max(0, at - entry.startedAt),
        timeoutMs: frameTimeoutMs,
      });
    };

    /** 安全网：放弃这一帧（不发 state、不拆流），让下一个节拍重新读数。 */
    const abandonInFlight = (entry) => {
      entry.abandoned = true;
      frameErrors += 1;
      if (inFlight === entry) inFlight = null;
      send(TWIN_STREAM_FRAME_ERROR_EVENT, {
        reason: 'read_timeout',
        message: `这一帧的状态读取超过 ${frameTimeoutMs}ms 仍未返回，已放弃该帧（流保持连接）`,
        frameErrors,
      });
    };

    const pump = async () => {
      if (closed) return;
      if (inFlight !== null) {
        notifyStalled(inFlight);
        if (now() - inFlight.startedAt > frameTimeoutMs) abandonInFlight(inFlight);
        return;
      }
      const entry = { startedAt: now(), seq: (readSeq += 1), abandoned: false };
      inFlight = entry;
      try {
        const query = queryOf(req?.url);
        // 慢节拍带 detail（见 TWIN_STREAM_DETAIL_MS）：客户端那边 `detail` 会沿用上一帧，
        // 所以偶尔带一次就够，中间帧不会把安全模式/温度抹成空白。
        if (detailMs > 0 && now() - lastDetailAt >= detailMs) {
          lastDetailAt = now();
          query.detail = '1';
        }
        const result = await readState(query);
        if (closed || entry.abandoned) return;
        send('state', result?.body ?? {});
      } catch (e) {
        // 单帧失败**绝不断流**：发一条 frame-error 事件，客户端保留上一帧继续显示。
        if (closed || entry.abandoned) return;
        frameErrors += 1;
        send(TWIN_STREAM_FRAME_ERROR_EVENT, {
          reason: 'read_failed',
          message: e instanceof Error ? e.message : String(e),
          frameErrors,
        });
      } finally {
        // 只清"自己那一帧"：安全网可能已经把 inFlight 换掉了。
        if (inFlight === entry) inFlight = null;
      }
    };

    // 立刻推第一帧：订阅者不该先干等一个 interval。
    void pump();
    const timer = setInterval(() => { void pump(); }, intervalMs);
    const beat = setInterval(() => {
      if (closed) return;
      try {
        res.write(': ping\n\n');
      } catch { /* 已断开 */ }
    }, heartbeatMs);

    const cleanup = () => {
      if (closed) return;
      closed = true;
      // 只在"这一路确实是活着的订阅"时递减：`closed` 是幂等门，所以计数不会被减两次。
      activeStreams -= 1;
      clearInterval(timer);
      clearInterval(beat);
      try {
        res.end();
      } catch { /* 已断开 */ }
    };
    req?.on?.('close', cleanup);
    req?.on?.('error', cleanup);
    res?.on?.('close', cleanup);
    res?.on?.('error', cleanup);
  };
}

/**
 * Build the `/twin/asset` handler.
 *
 * Sends a strong `ETag` (and honours `If-None-Match` with a 304) plus an
 * immutable cache directive: mesh files are content-addressed by model name and
 * never change in place, and the client releases its model handle whenever the
 * panel closes — without validators every reopen re-downloads 1.5-3.5 MB.
 *
 * @param {object} deps
 * @param {string} deps.assetsDir absolute path of `assets/models`. The
 *   directory may legitimately not exist yet (meshes are still being
 *   produced), in which case every lookup is a clean 404.
 * @returns {(query?: {model?: string}, headers?: object) => Promise<{status: number, headers: object, body: Buffer|object}>}
 */
export function createTwinAssetHandler({ assetsDir } = {}) {
  const root = typeof assetsDir === 'string' && assetsDir.trim() !== '' ? resolve(assetsDir) : '';
  const rootPrefix = root === '' ? '' : root + sep;

  /**
   * `file → {size, mtimeMs, body, etag}`：GLB 是不可变资产（按型号内容寻址），但**可能被就地
   * 重生成**（压缩脚本会重写同名文件），所以用 `size + mtimeMs` 当失效判据 —— 命中时连一次
   * `readFile` 与 SHA-1 都不做，只 stat 一次；未命中才读盘 + 哈希，并把字节留在内存里
   * （每型号 0.7–2 MB，与浏览器端 immut 缓存语义一致）。
   */
  const assetCache = new Map();

  async function loadAsset(file) {
    const info = await stat(file);
    const hit = assetCache.get(file);
    if (hit !== undefined && hit.size === info.size && hit.mtimeMs === info.mtimeMs) return hit;
    const body = await readFile(file);
    // Strong validator over the bytes: correct even if a mesh is regenerated in place
    // (the name would stay, the content would not).
    const entry = {
      size: info.size,
      mtimeMs: info.mtimeMs,
      body,
      etag: `"${createHash('sha1').update(body).digest('hex')}"`,
    };
    assetCache.set(file, entry);
    return entry;
  }

  return async function handleTwinAsset(query = {}, reqHeaders = {}) {
    const model = textOf(query?.model);
    if (model === '') {
      return { status: 400, headers: JSON_HEADERS, body: { error: 'model is required' } };
    }
    if (!MODEL_ID_RE.test(model)) {
      // Covers `../../package.json`, `..\..\package.json`, `a/b`, `UR3`, …
      return { status: 400, headers: JSON_HEADERS, body: { error: 'invalid model id' } };
    }
    if (root === '') {
      return { status: 404, headers: JSON_HEADERS, body: { error: 'asset not found' } };
    }

    const file = join(root, `${model}.glb`);
    if (!file.startsWith(rootPrefix)) {
      // Unreachable while MODEL_ID_RE holds; kept so a future relaxation of the
      // whitelist cannot silently become a traversal primitive.
      return { status: 400, headers: JSON_HEADERS, body: { error: 'invalid model id' } };
    }

    try {
      const asset = await loadAsset(file);
      const cacheHeaders = {
        'content-type': 'model/gltf-binary',
        'content-length': String(asset.body.length),
        etag: asset.etag,
        'cache-control': 'public, max-age=31536000, immutable',
      };
      const inm = reqHeaders?.['if-none-match'];
      // 304 判定放在缓存命中之后：旧写法**连 304 也要把整个 GLB（1.5–3.5 MB）读一遍再算一次 SHA-1**
      // —— 浏览器每开一次面板都会重验一次，纯浪费。
      if (typeof inm === 'string' && inm.split(',').some((tag) => tag.trim() === asset.etag)) {
        return { status: 304, headers: cacheHeaders, body: '' };
      }
      return { status: 200, headers: cacheHeaders, body: asset.body };
    } catch {
      // ENOENT (assets/models/ still absent) and EISDIR both land here.
      return { status: 404, headers: JSON_HEADERS, body: { error: 'asset not found' } };
    }
  };
}

/**
 * Build the `/twin/models` handler: which model ids are actually present.
 *
 * Needed because the client knows only the kinematics keys baked into its
 * bundle — when the robot reports a model with no local mesh, that mismatch
 * used to surface as a silent fallback to approximate geometry.
 *
 * @param {object} deps
 * @param {string} deps.assetsDir absolute path of `assets/models` (may not exist).
 * @returns {() => Promise<{status: number, headers: object, body: object}>}
 */
export function createTwinModelsHandler({ assetsDir } = {}) {
  const root = typeof assetsDir === 'string' && assetsDir.trim() !== '' ? resolve(assetsDir) : '';

  return async function handleTwinModels() {
    if (root === '') {
      return { status: 200, headers: STATE_HEADERS, body: { models: [] } };
    }
    try {
      const entries = await readdir(root);
      const models = entries
        .filter((name) => name.endsWith('.glb'))
        .map((name) => name.slice(0, -4))
        .filter((id) => MODEL_ID_RE.test(id))
        .sort();
      return { status: 200, headers: STATE_HEADERS, body: { models } };
    } catch {
      // Directory not produced yet (or unreadable): an empty list, never a 5xx.
      return { status: 200, headers: STATE_HEADERS, body: { models: [] } };
    }
  };
}

/**
 * 面板控制允许的八种模式。
 *
 * **模块私有**：它只在 `parseJogRequest` 里当白名单用，没有任何外部消费方（路由只看
 * 「解析结果是不是 `null`」，客户端有自己的 UI 枚举）。导出它就是多一个需要守的公共
 * 表面 —— 谁都能在别处 `add()` 一条进去，把这里的白名单悄悄撑大。
 *
 * `velocity` / `stop`（2026-10-19，长按连续点动）：短按仍走一次 `cartesian`（一步
 * `movel`），按住则改走**速度流** —— 前者"走一步就停"，后者"一直走，松手停"。
 */
const TWIN_JOG_MODES = new Set([
  'cartesian', 'rotate', 'joint', 'pose', 'home', 'speed',
  'velocity', 'stop',
]);

/**
 * 速度流的**看门狗**时长（毫秒）：缺省与钳位区间。
 *
 * 这是安全底线而不是调参项：浏览器崩溃 / 标签页被杀时不会再有新的 velocity 指令，
 * 服务器必须自己把速度归零。下限 100 ms 比前端的重复节奏（~100 ms）略宽，上限 2000 ms
 * 保证"最坏情况下机械臂最多再走 2 秒"。
 */
export const TWIN_JOG_TTL_DEFAULT_MS = 400;
export const TWIN_JOG_TTL_MIN_MS = 100;
export const TWIN_JOG_TTL_MAX_MS = 2000;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec6 = (v) => Array.isArray(v) && v.length === 6 && v.every(isNum);

/**
 * 校验并整形一条面板控制请求。**永不抛错**：不合法一律返回 `null`。
 *
 * `requested` 保留客户端原始值、`fraction` 是钳位后的实际值 —— 两者都给，是为了让
 * HTTP 调用方（工具 / 脚本）能看出自己传的值被改过。**面板本身不展示它**：面板下限
 * 10% 高于宿主下限 1%，两级钳位对面板输入是恒等变换，不会出现「被悄悄改值」的情况。
 *
 * @param {unknown} body 已解析的 JSON 请求体
 * @returns {object|null} 整形后的指令；不合法时为 `null`
 */
export function parseJogRequest(body) {
  if (body === null || typeof body !== 'object') return null;
  const mode = body.mode;
  if (typeof mode !== 'string' || !TWIN_JOG_MODES.has(mode)) return null;
  if (mode === 'home') return { mode };
  if (mode === 'speed') {
    if (!isNum(body.fraction)) return null;
    const clamped = Math.min(1, Math.max(0.01, body.fraction));
    return { mode, fraction: clamped, requested: body.fraction };
  }
  if (mode === 'joint') {
    if (!isVec6(body.q)) return null;
    return { mode, q: body.q.slice() };
  }
  if (mode === 'pose') {
    if (!isVec6(body.pose)) return null;
    return { mode, pose: body.pose.slice() };
  }
  /*
   * 速度流（长按连续点动）。`twist` = [vx,vy,vz,ωx,ωy,ωz]（m/s、rad/s），帧只认 tool/base
   * （缺省 **base** —— 与 cartesian/rotate 的缺省 tool 不同：速度流描述的是"TCP 往哪走"，
   * 面板按住时最直觉的是基座方向）。
   *
   * `ttlMs` 是看门狗而不是"这次走多久"：服务器记下「现在 + ttlMs」，到点没收到新 velocity
   * 就自动归零。越界**钳位**而不是拒绝（0 → 100、99999 → 2000）—— 它是安全兜底，
   * 不该因为调用方多给了一个数量级就把整条指令判成非法。
   */
  if (mode === 'velocity') {
    if (!isVec6(body.twist)) return null;
    const frame = body.frame === undefined ? 'base' : body.frame;
    if (frame !== 'tool' && frame !== 'base') return null;
    let ttlMs = TWIN_JOG_TTL_DEFAULT_MS;
    if (body.ttlMs !== undefined) {
      if (!isNum(body.ttlMs)) return null;
      ttlMs = Math.min(TWIN_JOG_TTL_MAX_MS, Math.max(TWIN_JOG_TTL_MIN_MS, body.ttlMs));
    }
    return { mode, twist: body.twist.slice(), frame, ttlMs };
  }
  // 松手/急停：立即把速度归零。没有额外字段 —— 多传的一律忽略（停止不该被参数卡住）。
  if (mode === 'stop') return { mode };
  const frame = body.frame === undefined ? 'tool' : body.frame;
  if (frame !== 'tool' && frame !== 'base') return null;
  const axis = body.axis;
  if (mode === 'cartesian') {
    if (axis !== 'x' && axis !== 'y' && axis !== 'z') return null;
    if (!isNum(body.distance) || body.distance === 0) return null;
    return { mode, axis, distance: body.distance, frame };
  }
  if (axis !== 'rx' && axis !== 'ry' && axis !== 'rz') return null;
  if (!isNum(body.deltaRad) || body.deltaRad === 0) return null;
  return { mode, axis, deltaRad: body.deltaRad, frame };
}
