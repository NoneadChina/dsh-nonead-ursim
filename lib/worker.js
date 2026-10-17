/**
 * dsh-nonead-ursim — Python worker process manager.
 *
 * Spawns the vendored `python/ur_worker.py` once (lazily) and keeps it alive
 * across tool calls so UR robot connections persist. Speaks a line-delimited
 * JSON protocol over stdin/stdout and fans out a matching promise per request.
 *
 * Robustness notes:
 * - `ensureStarted()` awaits the child's `spawn` event before the first write,
 *   so an early `call` never hits a still-closed stdin stream.
 * - the child environment scrubs DSH_* and credential-shaped vars (like DSH's
 *   own subprocess seam) so the worker never sees harness secrets.
 * - a crashed worker fails every in-flight request and respawns on the next
 *   call, with a short backoff to avoid a tight crash loop.
 * - **a timed-out call kills the child — but only when the request was actually
 *   dispatched, and only for callers that did not opt out.** The worker is
 *   strictly single-threaded (`for line in sys.stdin`): if one request never
 *   finishes, every later request queues behind it and times out too — the
 *   plugin would be dead until the host restarts, with a "timed out" message
 *   that hides the real cause. Killing the process is the only way to interrupt
 *   robot/library code that ignores our deadlines (see
 *   python/URBasic/realTimeClient.py). Conversely, an abort that arrives
 *   **before** the payload was written must not kill anything (P0-3): nobody
 *   outside that call is stuck, and the child may be mid-motion for someone else.
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

/**
 * Keep PATH and ordinary env, drop DSH_* and credential-shaped names.
 *
 * ⚠️ 例外：`DSH_URSIM_TWIN_PUSH` 是 Python worker **自己要读**的诊断开关（见
 * `python/ur_worker.py` 的 `TWIN_PUSH_DISABLED`）。它必须穿过这道清洗，否则 README 里
 * 那条"设为 0 可关掉推送做对照"永远无效 —— 这正是改名之前的状态。
 */
const ENV_PASSTHROUGH = new Set(['DSH_URSIM_TWIN_PUSH']);

function scrubbedEnv(extra) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (ENV_PASSTHROUGH.has(key)) { env[key] = value; continue; }
    if (/^DSH_/.test(key)) continue;
    if (/KEY|PASSWORD|SECRET|TOKEN/i.test(key)) continue;
    env[key] = value;
  }
  return { ...env, ...extra };
}

/**
 * Reject rather than queue when this many requests are already in flight: a
 * robot that stops answering must not let an unbounded backlog build up behind
 * a single-threaded worker (every queued caller would burn its own timeout
 * waiting for a slot that only frees when the head request finishes).
 */
export const DEFAULT_MAX_IN_FLIGHT = 8;

/**
 * 读类调用（目前只有仿真）**默认**的并发上限（H-3）。
 *
 * 存在的理由：只有一道总闸时，仿真的读能把 `DEFAULT_MAX_IN_FLIGHT` 个槽位全部占满，而准入
 * 检查是"总数 ≥ 上限即 BUSY" —— 于是**停止指令会在宿主侧被拒**，连 worker 的队列都进不去。
 * 真机正在运动、你想让它停的那一刻，恰恰是最容易被读占满的时刻。给读类单设一道闸门，命令类
 * 就永远有保留槽位（8 − 3 = 5）。数值取 3：仿真一路订阅只需要 1 个在飞读，3 已经能覆盖
 * "面板 + 缩略图 + 另一个标签页"，再多也只是让读自己排队。
 */
export const DEFAULT_CLASS_MAX_IN_FLIGHT = 3;

/**
 * Error classes this manager attaches, so callers (e.g. the digital twin) can
 * branch on *why* a call failed without parsing Chinese/English prose.
 *
 * They split into two kinds, and the distinction matters:
 *   - "we could not get an answer in time" (busy / timeout / killed / exited /
 *     aborted) — the robot may be perfectly healthy, just occupied;
 *   - a structured failure the Python side reported (`BADARG`, `TIMEOUT`, …),
 *     which is carried through untouched from the response envelope.
 */
export const WORKER_ERROR_CODES = {
  BUSY: 'WORKER_BUSY',
  TIMEOUT: 'WORKER_TIMEOUT',
  ABORTED: 'WORKER_ABORTED',
  KILLED: 'WORKER_KILLED',
  EXITED: 'WORKER_EXITED',
  STDIN: 'WORKER_STDIN',
  DISPOSED: 'WORKER_DISPOSED',
  SPAWN: 'WORKER_SPAWN',
};

/** Build an `Error` with a machine-readable `code`. */
function coded(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export class UrWorker {
  constructor({
    pythonBin,
    pythonDir,
    commandTimeoutMs = 60000,
    restartDelayMs = 500,
    maxInFlight = DEFAULT_MAX_IN_FLIGHT,
    /**
     * 运行模式（路线图 A）：`sim`（默认，纯离线仿真）或 `real`（显式开启的真机通道）。
     * 只作为环境变量 `DSH_URSIM_MODE` 传给 Python 侧 —— 判据在 worker 里，宿主不参与"能不能碰真机"
     * 这件事的判断（见 python/ur_worker.py 的 `_pin_sim_ip` / `route_op`）。
     */
    motionMode = 'sim',
  }) {
    this.pythonBin = pythonBin;
    this.pythonDir = pythonDir;
    this.commandTimeoutMs = commandTimeoutMs;
    this.restartDelayMs = restartDelayMs;
    this.motionMode = motionMode === 'real' ? 'real' : 'sim';
    this.maxInFlight = maxInFlight > 0 ? maxInFlight : DEFAULT_MAX_IN_FLIGHT;
    this.proc = null;
    this.nextId = 1;
    this.pending = new Map();
    this.stderrTail = '';
    /**
     * Per-child stderr, so a dying child's error message never quotes a newer child's output.
     * WeakMap keyed by the ChildProcess object (dropped automatically with the child).
     */
    this._stderrTailByProc = new WeakMap();
    /**
     * 最新推送遥测（ip → {at, ts, q, tcp}），由 worker 主动推来（见 `_onPush`）。
     *
     * 仿真直接读这里，**不再为每一帧向单线程 worker 发命令** —— 运动命令占住 stdin
     * 队列时这张表照样在更新，这就是"机器人运动时仿真仍完整跟随"的实现方式。条目极小
     * （12 个数），键的个数就是已连接机器人的台数。
     */
    this.telemetry = new Map();
    /** Diagnostics counters — surfaced through `stats()`. */
    this.droppedLines = 0;
    this.unknownResponses = 0;
    this.lastDroppedLine = '';
    this.respawnCount = 0;
    /** 收到的主动推送行数（诊断用：为 0 说明 Python 侧的推送线程没起来）。 */
    this.pushCount = 0;
    this._spawnPromise = null;
    this._lastExitAt = 0;
    this._disposed = false;
  }

  /** Snapshot of the manager's health — cheap, safe to log or expose. */
  stats() {
    return {
      pending: this.pending.size,
      droppedLines: this.droppedLines,
      unknownResponses: this.unknownResponses,
      respawnCount: this.respawnCount,
      lastDroppedLine: this.lastDroppedLine,
      stderrTail: this.stderrTail,
      running: this.proc !== null && this.proc.exitCode === null,
      /** 收到的推送行数；为 0 说明 Python 侧的推送线程没起来（诊断用）。 */
      pushed: this.pushCount,
      telemetryIps: [...this.telemetry.keys()],
    };
  }

  /**
   * Handle one **pushed** protocol line — a line without `id`.
   *
   * The Python half pushes live telemetry on its own thread (see
   * `_twin_push_loop` in `python/ur_worker.py`) instead of waiting to be asked,
   * precisely because being asked means standing in the single-threaded stdin
   * queue behind whatever motion command is currently running. RTDE keeps
   * updating the cache at 500 Hz regardless, so this channel stays live while
   * the robot moves — which is the whole point of the digital twin.
   *
   * Validation is deliberately strict and silent: a malformed or partial push
   * must never clobber a good reading with a half pose (the arm would visibly
   * jump). Anything suspect leaves the previous entry untouched.
   *
   * @param {{push?: unknown, ip?: unknown, ts?: unknown, data?: unknown, conn?: unknown}} msg
   */
  _onPush(msg) {
    this.pushCount += 1;
    if (msg.push !== 'telemetry') return;
    const ip = typeof msg.ip === 'string' ? msg.ip : '';
    if (ip === '') return;
    const data = msg.data;
    if (data === null || typeof data !== 'object') return;
    const q = Array.isArray(data.q) ? data.q.filter((value) => Number.isFinite(value)) : [];
    const tcp = Array.isArray(data.tcp) ? data.tcp.filter((value) => Number.isFinite(value)) : [];
    if (q.length < 6 || tcp.length < 6) return;
    const at = Date.now();
    /**
     * Python 侧的**连接代次**（`ROBOT_CONN_SEQ`，每新建一条机器人连接 +1）。
     *
     * 宿主用它判断"按 IP 记住的型号还作不作数"：同一个 IP 换了一台别的型号 ⇒ 旧连接
     * 掉线 ⇒ worker 重连 ⇒ 代次变 ⇒ 型号必须重读。缺字段（旧版 worker）时为 null，
     * 宿主退回按时间窗（TTL）判断，行为与改之前一致。
     */
    const conn = Number.isFinite(msg.conn) ? msg.conn : null;
    this.telemetry.set(ip, {
      at,
      ts: Number.isFinite(msg.ts) ? msg.ts : at,
      q: q.slice(0, 6),
      tcp: tcp.slice(0, 6),
      conn,
      /**
       * 这一帧来自**离线仿真**吗？（python 侧的 `_twin_push_loop` 在仿真帧上带 `simulated`）
       * 仿真据此打仿真水印 —— 界面上"这是虚拟机器人"必须一眼可见，不能让人误当成真机。
       */
      simulated: msg.simulated === true,
      // ⚠️ `conn` 只是**那个 Python 进程内**的计数：worker 重启后它从 1 重新开始数，
      // 上一个孩子留下的 `1` 会与新的 `1` 撞车，宿主就会误判"连接没变"而继续用上一台
      // 机器人的型号。所以代次必须带上"这是第几个子进程"。
      epoch: conn === null ? undefined : `${this.respawnCount}:${conn}`,
    });
  }

  /**
   * Latest pushed telemetry for one robot, or `undefined` when none has arrived.
   *
   * The caller decides how old is too old — the twin falls back to an explicit
   * read past its freshness window, so a stalled push never freezes the view.
   *
   * @param {string} ip robot address
   * @returns {{at: number, ts: number, q: number[], tcp: number[], conn: number|null,
   *            epoch: string|undefined}|undefined}
   */
  latestTelemetry(ip) {
    return this.telemetry.get(ip);
  }

  /**
   * Ensure a live child process. Resolves once the child has actually spawned
   * (stdin writable) or rejects if spawn failed. Idempotent across concurrent
   * callers: only one spawn is ever in flight.
   *
   * Crash backoff: when the previous process exited recently (within
   * `restartDelayMs`), we wait out the remainder before respawning so a worker
   * that dies on startup cannot produce a tight crash->respawn loop.
   */
  async ensureStarted() {
    if (this._disposed) {
      throw coded('UR worker was disposed', WORKER_ERROR_CODES.DISPOSED);
    }
    if (this._spawnPromise === null) {
      this._spawnPromise = this._start();
    }
    await this._spawnPromise;
  }

  _start() {
    this.stderrTail = '';
    // 新子进程的遥测还没到：旧的属于上一个孩子，先丢弃 —— 否则仿真会拿一条已死会话
    // 的姿态继续画（重启后那台机器人可能早已不在原位）。
    this.telemetry.clear();

    return new Promise((resolve, reject) => {
      // Crash backoff (see the class docstring): if the last run ended moments
      // ago, wait the remainder of `restartDelayMs` before spawning again so a
      // worker that exits immediately on boot cannot spin in a tight loop.
      const wait = this._lastExitAt + this.restartDelayMs - Date.now();
      const start = () => {
        // 代次**只在真正 spawn 成功时**递增（见下面 `proc.on('spawn')`）：一次失败的 spawn
        // 也算一个代次的话，宿主会误判"子进程被换过"（`stats().respawnCount`）→ 重建仿真、
        // 并让客户端重新下载并重建 1.5–3.5 MB 的 GLB —— 一次失败重启换来一次无意义的模型重载。
        return this._spawnOnce().then(resolve, reject);
      };
      if (wait > 0) {
        const timer = setTimeout(() => {
          clearTimeout(timer);
          start().catch(reject);
        }, wait);
        return;
      }
      start().catch(reject);
    });
  }

  _spawnOnce() {
    const script = join(this.pythonDir, 'ur_worker.py');
    const env = scrubbedEnv({
      PYTHONPATH: this.pythonDir,
      PYTHONUNBUFFERED: '1',
      // 运行模式交给 Python 侧（缺省即 sim；见 ur_worker.py 的 MOTION_MODE）。
      DSH_URSIM_MODE: this.motionMode,
    });
    this.stderrTail = '';

    return new Promise((resolve, reject) => {
      let proc;
      try {
        proc = spawn(this.pythonBin, ['-u', script], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env,
        });
      } catch (e) {
        this._spawnPromise = null;
        reject(coded(`UR worker failed to start: ${e.message}`, WORKER_ERROR_CODES.SPAWN));
        return;
      }
      this.proc = proc;

      const rl = createInterface({ input: proc.stdout });
      rl.on('line', (line) => this._onLine(line));

      proc.stderr.on('data', (d) => {
        const s = d.toString();
        this.stderrTail = (this.stderrTail + s).slice(-2000);
        // Per-child copy: `this.stderrTail` is shared, so at exit time it may already
        // belong to a newer child (see the `exit` handler).
        this._stderrTailByProc.set(proc, ((this._stderrTailByProc.get(proc) ?? '') + s).slice(-2000));
      });

      /*
       * `stdin` 的 'error' **每个子进程只挂一次**。
       *
       * 旧写法在 `call()` 里逐次 `proc.stdin.on('error', …)` 且从不摘除：第 11 次调用就触发
       * `MaxListenersExceededWarning`，并且每次调用都往流上永久留一个闭包（闭包捕获 settle →
       * 捕获整条 promise 链）。仿真 + 工具调用按小时累积，警告还会把真正的故障从宿主日志里淹掉。
       *
       * 未处理的 'error' 是**未捕获异常**（会掀掉整个宿主进程），所以这一处必须有人接；接成
       * "每个孩子一次"之后语义反而更准：管道断了，**这个孩子**在飞的所有请求都注定失败，
       * 而不是只有最后写入的那一个。
       */
      proc.stdin?.on('error', (e) => {
        const line = `stdin error: ${e.message}\n`;
        this.stderrTail = (this.stderrTail + line).slice(-2000);
        this._stderrTailByProc.set(proc, ((this._stderrTailByProc.get(proc) ?? '') + line).slice(-2000));
        this._failFor(proc, coded(`UR worker stdin 写入失败：${e.message}`, WORKER_ERROR_CODES.STDIN));
      });

      let spawned = false;
      proc.on('spawn', () => {
        spawned = true;
        // 真正起来的子进程才占一个代次：`epoch`（见 `_onPush`）与 `stats().respawnCount`
        // 都靠它区分"这是第几个孩子"，失败的 spawn 不该占号。
        this.respawnCount += 1;
        resolve();
      });

      proc.on('error', (e) => {
        if (this.proc === proc) {
          this._spawnPromise = null;
        }
        if (!spawned) {
          reject(coded(`UR worker failed to start: ${e.message}`, WORKER_ERROR_CODES.SPAWN));
        }
        this._failFor(proc, coded(`UR worker failed to start: ${e.message}`, WORKER_ERROR_CODES.SPAWN));
        if (this.proc === proc) {
          this.proc = null;
        }
      });

      /*
       * ⚠️ **只清理属于自己的状态。**
       *
       * 旧写法无条件执行 `this.proc = null; this._spawnPromise = null;
       * this._failAll(...)`。而被 kill 的子进程与"下一个子进程"之间存在 500ms 重启退避窗口：
       * 旧子进程的 exit 事件完全可能在新子进程**已经起来并且正在服务请求**之后才到达 ——
       * 于是这次 exit 会把 `this.proc` 清成 null（`stats().running` 从此说谎）、把新子进程
       * 正在飞的请求全部 reject（调用方看到一句莫名其妙的 "UR worker exited"），而
       * `dispose()` 之后也再找不到那个新子进程去 kill —— 留下一个仍占着控制器独占 RTDE
       * 会话的孤儿 Python 进程。仿真面板每秒发 20 次 worker 调用，第二次落进这个窗口是常态。
       *
       * 现在：`exit` 先判断死的到底是不是"当前"子进程，只清自己的状态；并且只失败**路由到
       * 这个子进程**的在飞请求（每个请求在 `call()` 里记录了它的 child）。
       */
      proc.on('exit', (code, signal) => {
        const isCurrent = this.proc === proc;
        const mine = this._stderrFor(proc);
        if (isCurrent) {
          this._spawnPromise = null;
          this._lastExitAt = Date.now();
          this.proc = null;
        }
        const reason = coded(
          `UR worker exited (code=${code ?? '?'}, signal=${signal ?? '?'})${mine ? `: ${mine.slice(-500)}` : ''}`,
          WORKER_ERROR_CODES.EXITED,
        );
        this._failFor(proc, reason);
      });
    });
  }

  /**
   * The stderr tail captured for one specific child.
   *
   * `this.stderrTail` is shared state and is overwritten by whichever child wrote last, so at
   * exit time it may belong to a *different* (newer) child. Each child keeps its own tail here,
   * which is what makes the error message trustworthy.
   */
  _stderrFor(proc) {
    return this._stderrTailByProc.get(proc) ?? this.stderrTail;
  }

  /** Fail only the in-flight requests that were routed to `proc`. */
  _failFor(proc, reason) {
    const doomed = [...this.pending.values()].filter((entry) => entry.child === proc);
    for (const entry of doomed) {
      try {
        entry.reject(reason);
      } catch {
        /* a rejecting handler must not stop the remaining failures */
      }
    }
    this._stderrTailByProc.delete(proc);
  }

  _onLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      // The worker writes the protocol on stdout and redirects URBasic's own
      // prints into a log file, so an unparseable line means something new is
      // printing to the protocol channel (or a value could not be serialised).
      // Silently ignoring it used to turn that into a mysterious client-side
      // timeout — count it and keep the tail for `stats()`.
      this.droppedLines += 1;
      this.lastDroppedLine = line.slice(0, 300);
      return;
    }
    /*
     * 主动推送（没有 `id` 的协议行，见 python/ur_worker.py 的 `_twin_push_loop`）。
     *
     * 必须先于"按 id 匹配响应"处理：否则它会被记成一条无法匹配的响应，白白抬高
     * `unknownResponses`，同时丢掉**唯一**能在机器人运动期间继续更新的遥测来源 ——
     * 那正是仿真"数据已停止更新"的解药（运动命令占住的是 stdin 队列，而 RTDE 缓存
     * 由 URBasic 自己的线程持续更新，推送因此不受影响）。
     */
    if (msg !== null && typeof msg === 'object' && msg.id === undefined && typeof msg.push === 'string') {
      this._onPush(msg);
      return;
    }
    const entry = this.pending.get(msg.id);
    if (entry === undefined) {
      this.unknownResponses += 1;
      this.lastDroppedLine = line.slice(0, 300);
      return;
    }
    // Do NOT delete from `pending` here: `entry.resolve`/`entry.reject` are the
    // settling wrappers and do the bookkeeping (delete + clearTimeout + abort
    // listener removal). Deleting first made those wrappers see "no such id"
    // and return without ever settling the promise, so every call hung until
    // its own timeout fired.
    if (msg.ok) {
      entry.resolve(msg.data);
    } else {
      // Attach the structured code (0.5.0+) so callers/tests can branch on the
      // failure class without parsing Chinese prose.
      const error = new Error(msg.error);
      if (typeof msg.code === 'string') error.code = msg.code;
      if (msg.data !== undefined) error.data = msg.data;
      entry.reject(error);
    }
  }

  _failAll(reason) {
    for (const [, entry] of this.pending) {
      try {
        entry.reject(reason);
      } catch {
        /* a rejecting handler must not stop the remaining failures */
      }
    }
    this.pending.clear();
  }

  /**
   * Kill the child and drop the spawn handle so the next `call()` starts a
   * clean process. Used when a request exceeds its deadline: the Python side is
   * single-threaded and may be stuck inside library code with no cancellation,
   * so the process is the only unit we can reliably reset.
   */
  _killFor(address) {
    const proc = this.proc;
    this.proc = null;
    this._spawnPromise = null;
    /*
     * stderr 必须在 `_failAll()` **之前**取：`_failFor`/`_failAll` 会清掉 per-child 的
     * stderr 表，而这里恰恰是最需要 stderr 的场合（超时/取消导致 kill）—— 旧写法用的是
     * 共享的 `this.stderrTail`，于是经常给出一句**没有原因**的 "进程已被终止"。
     */
    const tail = proc === null ? this.stderrTail : this._stderrFor(proc);
    if (proc !== null && proc.exitCode === null) {
      try {
        proc.kill();
      } catch {
        /* already gone */
      }
      this._lastExitAt = Date.now();
    }
    const reason = coded(
      `UR worker 未能及时完成 ${address}，进程已被终止以便下一个请求换用干净的 worker` +
        `${tail ? `（stderr: ${tail.slice(-300)}）` : ''}`,
      WORKER_ERROR_CODES.KILLED,
    );
    this._failAll(reason);
  }

  /**
   * Send one request and await its response.
   *
   * `options.killOnTimeout` (0.6.6) decides what a deadline means:
   *   - `true` (default) — the historical behaviour: kill the child, because a
   *     single-threaded worker stuck inside library code would otherwise make
   *     every later request queue behind it until its own timeout.
   *   - `false` — reject *only* this caller. Used by the digital twin's read-only
   *     telemetry: the robot session (RTDE + Dashboard, held by the child) is
   *     strictly more valuable than one visualisation frame, and the twin polls
   *     at 10 Hz — so a twin read that times out while the worker is busy
   *     executing a motion command must NOT tear the session down. The command
   *     that made the worker busy still carries its own budget and still kills
   *     the child if *it* overruns; the twin only declines to escalate.
   *
   * ⚠️ **取消（abort）也遵守 `killOnTimeout`**（P0-3）：这条注释以前只说超时，而
   * `onAbort` 无条件 `_killFor()` —— 于是一个 `killOnTimeout:false` 的读在取消时照样会杀掉
   * 正在服务运动指令的子进程，把"超时不杀"的承诺从旁路撤销掉。现在两条路径同一语义。
   *
   * ⚠️ **未派发的取消绝不杀子进程**（P0-3）：审批等待可以吃掉几十秒宿主 deadline，届时
   * `exec.signal` 被 abort，但这条请求一个字节都还没写进 stdin —— 子进程里根本没有它，杀它
   * 只会毁掉别的调用/正在跑的运动（RTDE 会话也跟着没）。只有 `stdin` 真的写过
   * （`entry.dispatched`）才升级为 `_killFor()`。
   *
   * @param {string} op worker op name
   * @param {object} [params]
   * @param {number} [timeoutMs]
   * @param {AbortSignal} [signal]
   * @param {{killOnTimeout?: boolean, class?: string, classMaxInFlight?: number}} [options]
   */
  async call(op, params = {}, timeoutMs = this.commandTimeoutMs, signal, options = {}) {
    const killOnTimeout = options?.killOnTimeout !== false;
    if (this._disposed) {
      throw coded('UR worker was disposed', WORKER_ERROR_CODES.DISPOSED);
    }
    /*
     * 分闸准入（H-3）：读类调用先过**自己那道闸门**。
     *
     * 读类（仿真）与命令类共用一个单线程 worker，但它们的**重要性不对称**：一帧画面丢了只是
     * 画面停一下，一条停止指令被拒则是安全问题。所以读类先受 `classMaxInFlight` 约束，命令类
     * 因此永远有保留槽位。
     *
     * ⚠️ **准入与占槽必须在同一个同步段完成**（P0-2）。
     * 旧写法把准入放在 `await this.ensureStarted()` **之前**、把 `pending.set()` 放在它**之后**：
     * 同一 tick 内并发的 N 个 `call()` 都在任何写入之前跑完准入 ⇒ 全部通过。实测 8 连发
     * （`class:'twin-read'`，`classMaxInFlight:3`）⇒ `pending=8` ⇒ 此刻来的 `stop_program`
     * 被总闸门拒成 `WORKER_BUSY`，H-3 那句"停止指令永远有槽位"被绕开了。
     * 现在：进入 `call()` 的同步段就写入占位条目，后续并发调用立刻数得到它；每条 settle 路径
     * （成功 / 失败 / abort / 超时 / 子进程退出 / dispose）都会删除条目 ⇒ 槽位不会泄漏。
     */
    const cls = typeof options?.class === 'string' && options.class !== '' ? options.class : null;
    if (cls !== null) {
      const cap = Number.isFinite(options?.classMaxInFlight) && options.classMaxInFlight > 0
        ? options.classMaxInFlight
        : DEFAULT_CLASS_MAX_IN_FLIGHT;
      let inClass = 0;
      for (const entry of this.pending.values()) {
        if (entry.cls === cls) inClass += 1;
      }
      if (inClass >= cap) {
        throw coded(
          `UR worker 的 ${cls} 类请求已达上限（${cap}）：读类请求不得挤占命令槽位。`,
          WORKER_ERROR_CODES.BUSY,
        );
      }
    }
    if (this.pending.size >= this.maxInFlight) {
      throw coded(
        `UR worker 当前有 ${this.pending.size} 个请求在排队（上限 ${this.maxInFlight}）：` +
          '机器人可能已无响应，请先确认连接状态再重试。',
        WORKER_ERROR_CODES.BUSY,
      );
    }
    const id = this.nextId++;
    // Carry the effective command timeout to the worker so the Python side can
    // bound its own move-confirmation / completion waits to the same budget,
    // instead of blocking the (single-threaded) worker forever.
    const payload = JSON.stringify({ id, op, _timeout_ms: timeoutMs, ...params });

    /*
     * 注意：`new Promise` 的 executor 是**同步执行**的 ⇒ 下面的 `pending.set()` 会在 `call()`
     * 把 promise 返回给调用方之前完成 —— 这正是"同步占槽"的实现方式。真正的派发
     * （`ensureStarted()` + 写入 stdin）挪进了 executor 里的 async 段。
     */
    return new Promise((resolve, reject) => {
      let timer = null;
      let onAbort = null;
      /** Once settled we must not touch `this.pending` for this id again. */
      const settle = (fn) => (value) => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        if (timer !== null) clearTimeout(timer);
        if (signal !== undefined && onAbort !== null) signal.removeEventListener('abort', onAbort);
        fn(value);
      };
      const settleResolve = settle(resolve);
      const settleReject = settle(reject);

      /*
       * 这条请求**真的写进 stdin 了吗**？（P0-3 的判据）
       * 未派发（`dispatched:false`）时 abort 只让本次调用失败，绝不 `_killFor()`。派发前
       * `child` 还是 null，`_failFor()` 因此不会把它算到某个具体子进程头上。
       */
      const entry = {
        timer: null,
        resolve: settleResolve,
        reject: settleReject,
        child: null,
        // 分闸统计用（见上面的准入段）：命令类为 null，读类由调用方给出。
        cls,
        /** `true` = payload 至少已经尝试写进 stdin（此后它可能仍占着单线程队列）。 */
        dispatched: false,
      };
      // ★ 同步占槽：与上面的准入检查同处一个同步段（P0-2）。
      this.pending.set(id, entry);

      onAbort = () => {
        // 如实说明"这次调用失败 ≠ 控制器侧已停下"：通用文案会盖住真实原因与现场处置方式。
        settleReject(coded(
          `UR call "${op}" was aborted（超时/取消只代表本次调用失败；若这是运动指令，` +
            '控制器侧的动作可能仍在继续，请用示教器/急停确认机器人状态）',
          WORKER_ERROR_CODES.ABORTED,
        ));
        // ① 一个字节都没写 ⇒ 子进程里没有这条请求，杀它只会毁掉别人的会话/运动。
        if (!entry.dispatched) return;
        // ② 只读遥测读（killOnTimeout:false）连超时都不升级为杀进程，取消同理。
        if (!killOnTimeout) return;
        this._killFor(`"${op}"（已取消）`);
      };

      if (signal !== undefined) {
        if (signal.aborted) {
          // 传进来就已经 aborted：settle 掉，**不派发、不 kill**（旧写法这里会杀子进程）。
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      // 派发段：ensureStarted 可能耗掉几百毫秒（首次 spawn / 崩溃退避），不能在同步段里 await。
      void (async () => {
        try {
          await this.ensureStarted();
        } catch (e) {
          settleReject(e);
          return;
        }
        // 等 spawn 期间被取消 / 超时 / dispose：请求不能再写进去（槽位已由 settle 释放）。
        if (!this.pending.has(id)) return;
        // Which child this request is routed to. `_failFor()` uses it so a dying child can only
        // fail *its own* requests, never a newer child's (see the `exit` handler).
        entry.child = this.proc;
        timer = setTimeout(() => {
          settleReject(coded(
            `UR call "${op}" timed out after ${timeoutMs}ms（本次调用失败不代表控制器侧动作已停止：` +
              '机器人可能仍在执行，请用示教器/急停确认）',
            WORKER_ERROR_CODES.TIMEOUT,
          ));
          // The Python handler is still running and cannot be cancelled; kill it
          // so the *next* call is not stuck behind it forever. Skipped for
          // read-only callers that opted out (see `call()`'s doc comment): they
          // must never destroy the robot session just because it was busy.
          if (killOnTimeout) this._killFor(`"${op}"`);
        }, timeoutMs);
        entry.timer = timer;

        const proc = entry.child;
        if (proc !== null && proc.exitCode === null && proc.stdin?.writable) {
          // ⚠️ **先标 dispatched 再写**：写可能已经部分落进管道（对端收下了字节），此后
          // abort/超时就必须杀进程 —— 那条没人要的请求会继续占着单线程队列。
          entry.dispatched = true;
          try {
            // `stdin` 的 'error' 由 `_spawnOnce()` **每个子进程只挂一次**（那里解释了为什么不能
            // 逐次挂：监听器会累积、闭包会永久留在流上）；这里只负责写。
            proc.stdin.write(payload + '\n');
          } catch (e) {
            // 同步写失败（管道已关）必须让调用方失败，而不是变成一条无人处理的 rejection。
            settleReject(coded(`UR worker stdin 写入失败：${e.message}`, WORKER_ERROR_CODES.STDIN));
          }
        } else if (proc !== null) {
          // The process is still referenced but no longer writable (about to
          // exit): tell the caller instead of silently dropping the request.
          settleReject(coded('UR worker process is not writable', WORKER_ERROR_CODES.EXITED));
        } else {
          // `this.proc` was cleared by an `exit` between `ensureStarted()` and
          // the write (spawn/exit race): fail clearly so the caller can retry.
          settleReject(coded('UR worker exited before the request could be sent', WORKER_ERROR_CODES.EXITED));
        }
      })();
    });
  }

  /**
   * Ask the worker to release every robot connection and exit on its own, so
   * RTDE / Dashboard / RealTime sessions are closed deliberately instead of
   * being torn down by process death (which can leave the controller holding a
   * claimed RTDE session). Best-effort: never throws, never blocks for long.
   *
   * The grace period is floored at 5 s: `call()` kills the child on timeout, so
   * a shorter budget would trade a deliberate close for exactly the abrupt
   * process death this method exists to avoid. Callers may only extend it.
   */
  async shutdown({ timeoutMs = 5000 } = {}) {
    if (this._disposed) return false;
    const budget = Math.max(5000, timeoutMs);
    try {
      await Promise.race([
        // ⚠️ op 名是 `shutdown_worker`（不是 `shutdown` —— 后者是"关闭控制器"）。
        this.call('shutdown_worker', {}, budget),
        new Promise((_, reject) => setTimeout(() => reject(new Error('shutdown timeout')), budget)),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  dispose() {
    this._disposed = true;
    this.telemetry.clear();
    const proc = this.proc;
    this.proc = null;
    this._spawnPromise = null;
    if (proc !== null) {
      try {
        proc.stdin.end();
      } catch {}
      try {
        proc.kill();
      } catch {}
    }
    this._failAll(coded('UR worker was disposed', WORKER_ERROR_CODES.DISPOSED));
  }
}
