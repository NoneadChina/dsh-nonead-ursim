/**
 * dsh-nonead-ursim — DeepSeek Harness plugin to control Universal Robots.
 *
 * © 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com
 *
 * Registers a set of native tools (via @deepseek-ai/dsh-tools) that drive UR
 * collaborative robots through a vendored Python worker (python/ur_worker.py,
 * which wraps the URBasic library copied from the reference nUR MCP server).
 *
 * Design: one persistent Python worker process holds the RTDE / Dashboard /
 * RealTime client sockets per robot IP, so the model calls `connect` once and
 * then issues many commands without re-establishing links.
 *
 * Safety: this plugin commands a physical robot. It is intended for trained
 * operators with the robot in line of sight and an E-stop within reach. Tool
 * descriptions repeat the key warnings; treat it like granting the bash tool.
 */

import z from '@deepseek-ai/schemastery';
// 仿真态的**落盘**（0.1.10，路线图 E2）：让"应该有一台什么仿真"跨宿主重启存活。
import { readSimState, simStatePath, writeSimState } from './sim-state.js';
// 面板 I/O 写请求的校验与整形（0.1.13，方案 P1）。
import { parseIoWrite } from './twin-io.js';
// 回环地址的**唯一真源**（0.1.14）：与 lib/twin-io.js 共用，避免两处常量各改各的。
import { SIM_IP as SIM_IP_FROM_MODULE } from './sim-ip.js';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { UrWorker } from './worker.js';
import { pendingMotion } from './pending-motion.js';
import {
  TWIN_STATE_PATH,
  TWIN_ASSET_PATH,
  TWIN_MODELS_PATH,
  TWIN_STREAM_PATH,
  TWIN_SIM_PATH,
  TWIN_JOG_PATH,
  createTwinStateHandler,
  createTwinStreamHandler,
  createTwinAssetHandler,
  createTwinModelsHandler,
  parseJogRequest,
  twinStateQuery,
} from './twin-routes.js';
// 数字仿真只读遥测的**专用**预算与"不杀进程"语义：仿真与运动指令共用同一条单线程 worker
// 队列，机器人一动仿真的读就要排队 —— 用默认的 60 s 预算会让它超时并**杀掉 Python 子进程**
// （连带整条 RTDE/Dashboard 会话），仿真此后永远拿不到位姿。详见 lib/twin-worker.js 的文件头。
import { TWIN_READ_TIMEOUT_MS, createTwinReadWorker } from './twin-worker.js';

/** 插件根目录（打包后位于 `app.asar` 内）。 */
const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Python worker 目录。
 *
 * ⚠️ **必须做 asar 感知替换**：打包后本文件在 `app.asar` 内，而 `python/**` 经
 * `asarUnpack` 被解到 **`app.asar.unpacked/`**。Python 是**外部进程**，看不见 asar —
 * 直接指向 asar 内的路径会让 `spawn` 立刻失败（`can't open file '...app.asar\...\python\ur_worker.py'`），
 * 于是**所有 `ursim_*` 工具在已安装版里全部不可用**。开发环境走 Junction、路径里没有
 * `app.asar`，替换不会生效，因此两种形态共用这一行。
 *
 * 匹配串刻意带上两边的分隔符：`app.asar.unpacked` 后面跟的是 `.` 而不是分隔符，
 * 所以幂等（不会被替换成 `app.asar.unpacked.unpacked`）。
 */
const PYTHON_DIR = join(PLUGIN_ROOT, 'python')
  .replace(`${sep}app.asar${sep}`, `${sep}app.asar.unpacked${sep}`);

/**
 * `assets/models/` — GLB meshes served by the twin asset route (Ruling 7).
 * The directory may legitimately not exist yet while meshes are still being
 * produced; `createTwinAssetHandler` degrades that to a clean 404.
 *
 * **无需** asar 感知：这一份由 Node 的 `fs` 读取，而 Electron 给 `fs` 打了 asar 补丁，
 * 留在 asar 内反而更快。
 */
const ASSETS_DIR = join(PLUGIN_ROOT, 'assets', 'models');

export const name = 'nonead-ursim';

export const inject = ['tools'];

export const Config = z.object({
  pythonBin: z.string().default('python'),
  commandTimeoutMs: z.number().min(1000).max(600000).default(60000),
  connectTimeoutMs: z.number().min(1000).default(30000),
  requireApprovalForMotion: z.boolean().default(false),
  /**
   * 运行模式（路线图 A）：`sim`（默认）＝纯离线仿真；`real` ＝**显式开启**的真机通道。
   *
   * 缺省即 `sim`：什么都不配时，本插件的真机通道结构性不可达（见 python/ur_worker.py 的
   * `_pin_sim_ip`）。开启 `real` 必须同时给出 `realRobotIps` 白名单 —— 白名单为空时
   * **任何目标都会被拒**（fail-closed），而不是"谁都能连"。
   */
  motionMode: z.string().default('sim'),
  /** 真机模式下允许操作的机器人地址，逗号分隔（例如 `192.168.1.10,192.168.1.11`）。 */
  realRobotIps: z.string().default(''),
  /**
   * 仿真态是否落盘（路线图 E2，0.1.10）。落盘后，宿主重启（DSH 重开、插件重载）仍能按上次的
   * 配置把仿真恢复出来 —— 否则那份"应该有一台什么仿真"的记忆随进程消失，自愈也就无从谈起。
   * 用户**明确关掉**仿真时落盘的是 `enabled:false`，重启不会把它复活。
   */
  persistSimState: z.boolean().default(true),
  /** 仿真态文件路径；留空 = `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`。 */
  simStateFile: z.string().default(''),
});

/**
 * Ops that physically move the arm or run a program — covered by the human approval gate.
 *
 * 这个集合表达的是「**开启门禁时**覆盖哪些 op」，不是「默认要不要门禁」：`requireApprovalForMotion`
 * 自 0.2.3 起默认 `false`（运动免人工确认），集合本身一个成员都没动 —— 用户显式设为 `true` 时，
 * 下面这些 op 照旧逐条走人工确认，且 fail-closed 行为与从前逐字节一致。
 */
const APPROVAL_OPS = new Set([
  'movej', 'movel', 'movep', 'movec', 'servoj', 'move_x', 'move_y', 'move_z',
  'move_tool_x', 'move_tool_y', 'move_tool_z',
  // `run_sequence` 是一条命令里连走多段 —— 它动的比上面任何一个都多，没有理由不门禁。
  'run_sequence',
  'draw_circle', 'draw_square', 'draw_rectangle', 'draw_star',
  'load_program', 'run_program', 'send_script', 'reset_error',
  // 0.5.0: the new ops that can move the arm or change its physical state.
  // `set_freedrive`/`set_teach_mode` hand the arm to a human (or make it limp),
  // `brake_release` lets it fall under gravity, `power_off`/`shutdown` drop it.
  'set_freedrive', 'set_teach_mode', 'power_on', 'power_off', 'brake_release',
  'unlock_protective_stop', 'shutdown', 'zero_ftsensor', 'conveyor_tracking',
  // 0.6.0: force mode presses the arm against its environment and keeps pressing;
  // `speedj`/`speedl` are open-ended *velocity* commands (the arm keeps moving
  // until it is stopped), and `stopj`/`stopl` decelerate a moving arm.
  // Changing the payload also re-zeros the force/torque sensor, which changes how
  // the arm responds to contact — so it is gated too.
  'force_mode', 'end_force_mode', 'force_mode_settings',
  'speedj', 'speedl', 'stopj', 'stopl',
  'set_payload_inertia',
  // `move_optimized` moves the arm (smoothly, but it moves); `motion_version`
  // changes how *every later* move is planned, so it is a motion-capability
  // change rather than a read.
  'move_optimized', 'motion_version',
  // 审计补齐（host-audit H-2）：这两个 op 的副作用与**已经受门禁**的兄弟 op 完全同类。
  //   `set_payload` 与 `set_payload_inertia` 都发 set_payload_mass + set_payload_cog，
  //   而设置负载会**自动把力/力矩测量归零**（等效于受门禁的 `zero_ftsensor`）——
  //   只门禁其中一个等于留了一个同效果的旁路。
  //   `set_gravity` 改变重力补偿方向：设错就是"松手后下坠或上飘"，属于让机械臂
  //   脱离程序控制的物理状态变更。
  'set_payload', 'set_gravity',
  // 审计补齐（安全审计 H-1，2026-10-13）：这 7 个 op 都不是"读"，而是**持久改变物理行为或
  // 致动外部设备**，此前一直免审批：
  //   `set_tcp` 改的是此后**每一次运动**的参考点（与已受门禁的 `motion_version` 同类：一个改
  //     规划方式、一个改坐标系，却一个有门禁一个没有）；
  //   `set_tool_output_mode` / `set_tool_voltage` / `tool_communication` 改工具法兰的针脚语义、
  //     电压与串口复用（`tool_communication` 打开会**禁用工具端模拟输入**；工具自己的描述就写着
  //     "接错可能损坏工具"）；
  //   `set_digital_out` / `set_analog_out` 能致动夹爪、传送带、焊机等外设；
  //   `set_conveyor_tick` 改传送带计数（`conveyor_tracking` 已受门禁，这是它的兄弟 op）。
  // 仿真目标本就不走这道门（见 `isOfflineSimTarget`），所以本改动只作用于**真机部署** ——
  // 那正是需要它生效的地方。
  'set_tcp', 'set_tool_output_mode', 'set_tool_voltage', 'tool_communication',
  'set_digital_out', 'set_analog_out', 'set_conveyor_tick',
]);

/**
 * 需要人工审批的运动工具的**宿主侧时间余量**（毫秒，P0-3）。
 *
 * 为什么不能共用同一个 60 s：宿主把工具的 `timeoutMs` 当**整个 `execute()` 的死线**，而
 * `execute()` 里先 `await requestApproval()`（人可能几十秒后才点），再 `worker.call()`
 * 用**同一份** `commandTimeoutMs` 做运动预算。于是"人确认 55 s + 运动 10 s"会在第 60 s 被
 * 宿主判超时 ⇒ `exec.signal` abort ⇒ worker 杀掉 Python 子进程 —— 一条本来正常的运动指令
 * 表现为"莫名被终止"，而且它可能**已经在真机上动起来了**。
 *
 * 现在：门禁开启时，受门禁工具的宿主死线 = 命令预算 + 本余量；`worker.call()` 的预算仍是
 * 命令预算本身（控制器侧的运动时限一个字不改）。这样审批等待不再吃掉运动预算。
 */
export const APPROVAL_MARGIN_MS = 120000;

/**
 * 载荷指纹：对"审批时人类看到的参数"做 sha256（前 16 位），审批通过后必须一致才允许下发。
 *
 * 为什么**不能**只对 `send_script` 的脚本文本做绑定：`sanitizeArgs()` 是**浅拷贝**，
 * 嵌套数组（`force_mode` 的 `task_frame`、`selection_vector`、`wrench`…）与调用方共享同一个
 * 对象引用 —— 审批是异步的（人可能几秒到几分钟后才点），这期间那个数组**确实可以被改掉**，
 * 而字符串参数（脚本）反而是不可变的。所以指纹算在**整个载荷**上，覆盖两条路径。
 */
function payloadDigest(args) {
  return createHash('sha256').update(JSON.stringify(args) ?? '', 'utf8').digest('hex').slice(0, 16);
}

/**
 * 脚本摘要：行数 + 字节数 + 开头几行。
 *
 * `send_script` 是唯一能把任意逻辑送进控制器的 op，而旧的 240 字符截断意味着第 241 个字符之后
 * 的一切**人类根本看不到就要签字**（审计项 M-1）。人无法逐字读完的长脚本，至少可以核对
 * "行数/字节数对不对"以及"开头是不是我以为的那段"，再用审批理由里的载荷指纹做整体绑定。
 */
function summarizeScript(script) {
  const parts = script.split(/\r\n|\r|\n/);
  // 编辑器口径：末尾那个换行不算独立一行（"a\nb\n" 是 2 行）。
  const lines = parts.length > 0 && parts[parts.length - 1] === '' ? parts.length - 1 : parts.length;
  const bytes = Buffer.byteLength(script, 'utf8');
  const head = parts.slice(0, 3).join(' ⏎ ').slice(0, 120);
  return `${lines} 行 / ${bytes} 字节；开头：${head}`;
}

function summarizeArgs(args, op) {
  try {
    if (op === 'send_script' && typeof args?.script === 'string') return summarizeScript(args.script);
    return JSON.stringify(args).slice(0, 240);
  } catch {
    return '';
  }
}

/**
 * Ask a human on the DSH approval channel before dispatching a motion op.
 * Fail-closed: no approval service, no agent, or a non-`allowed-once` outcome
 * all throw, so the command is never sent to the worker.
 */
async function requestApproval(ctx, toolName, args, exec, op) {
  const approval = typeof ctx.get === 'function' ? ctx.get('approval') : ctx.approval;
  if (approval === undefined) {
    throw new Error(`运动指令 ${toolName} 需人工批准，但当前环境未组合审批服务（fail-closed）。可设 requireApprovalForMotion=false 禁用，或补装 @deepseek-ai/dsh-user-approval。`);
  }
  if (exec.agent === undefined) {
    throw new Error(`运动指令 ${toolName} 需路由到会话审批，但该调用无 agent（fail-closed）。`);
  }
  /*
   * 载荷绑定（M-1）：先算出"将被下发的载荷"的指纹，审批通过后**再算一次**比对。
   *
   * 审批是异步的（人可能几秒到几分钟后才点）。这期间载荷若被改动（见 `payloadDigest` 的注释：
   * 嵌套数组与调用方共享引用），旧写法会把一份**没人看过**的参数送进控制器 —— 真机上
   * `task_frame` 被改一格，力控压向的方向就变了。现在：给人看过的是哪个指纹，下发的就必须是同一个。
   */
  const approvedPayload = payloadDigest(args);
  // 先登记待审批目标，让仿真面板能把"它要往哪动"画出来（清单第 8 条：先看后动）。
  // token 保证并发/重叠审批时只清自己那一次。
  const token = pendingMotion.begin(toolName, args);
  try {
    const outcome = await approval.request({
      agent: exec.agent,
      toolName,
      reason: `请确认是否允许机器人执行 ${toolName}（${summarizeArgs(args, op)}｜载荷 ${approvedPayload}）`,
      signal: exec.signal,
    });
    if (outcome !== 'allowed-once') {
      throw new Error(`运动指令 ${toolName} 未获人工批准（${outcome}），已取消。`);
    }
    const actualPayload = payloadDigest(args);
    if (actualPayload !== approvedPayload) {
      throw new Error(
        `载荷在审批期间发生了变化（审批时 ${approvedPayload}，当前 ${actualPayload}），已取消。`,
      );
    }
  } finally {
    // 无论批准、拒绝还是审批服务抛错，都必须撤掉预览 —— 否则面板会一直挂着一层
    // "待审批"的假目标，比不显示更误导。
    pendingMotion.end(token);
  }
}

import { textOutput, numberArray, IP, OPTIONAL_SIM_IP, AXIS_MOTION_DISTANCE, MOVE_PARAMS, buildTools } from './tool-defs.js';

export function apply(ctx, config = {}) {
  let worker = null;
  let workerError = null;

  /*
   * ⚠️ **代码里必须有默认值，不能只依赖 Config schema。**
   *
   * `Config` 用 `z.…default(...)` 声明了四个默认值，而宿主确实会应用它们（已用真实的
   * schemastery 验证：`schema({})` ⇒ `{pythonBin:'python', commandTimeoutMs:60000,
   * connectTimeoutMs:30000, requireApprovalForMotion:false}`）。但 `apply()` 是导出函数：
   * 只要有人用**未经 schema 解析**的裸对象调用它（测试桩、脚本化装配、将来换装配路径），
   * 这几个值就都是 `undefined`。四个字段的下游写法因此都有 `?? 默认值` 兜底。
   *
   * 门禁这一句的兜底值**必须与 schema 的默认值一致**，因为产品默认是"运动免人工确认"
   * （2026-10-15 决定，0.2.3 起）：裸 config 走的就是这条兜底，两处一旦不一致，"没解析
   * schema"就变成一次静默的语义分叉 —— 要么凭空多出一次人工确认，要么凭空少一道门，
   * 而调用方无从察觉。
   *
   * ⚠️ 默认 `false` **不是**把门禁删掉：`APPROVAL_OPS`、`requestApproval()` 的判定与报错文案
   * 一字未动。用户**显式**设 `requireApprovalForMotion: true` 时，行为与从前逐字节一致 ——
   * 未组合审批服务 / 无代理 / 应答非 `allowed-once` 三种情形一律 fail-closed（拒绝且不下发）。
   */
  const requireApprovalForMotion = config.requireApprovalForMotion ?? false;

  /*
   * 运行模式（路线图 A）——**必须在 `new UrWorker` 之前求值**：worker 的构造要吃它（作为
   * `DSH_URSIM_MODE` 传给 Python）。写在后面会踩 `const` 的 TDZ：构造抛错 → `worker` 恒为 null
   * → 一个工具都不会注册（本轮实测就是先踩了这个，表现是"未注册 ursim_movej"）。
   *
   * 两件事同时成立才允许碰真机：配置里写了 `motionMode: 'real'`，且目标在 `realRobotIps`
   * 白名单里。缺省（什么都不配）永远是 `sim` ⇒ 真机通道结构性不可达。
   *
   * 真机模式下**人工审批豁免不存在**：`isOfflineSimTarget` 只在仿真模式下生效。这一条同时把
   * 审计的 H-2 结构性关掉 —— 从前"豁免"由宿主侧集合决定，而那个集合可以被模型自己用
   * `ursim_sim_start` 置位（被监督者自己授予自己豁免）。现在模式是配置（人写的）。
   */
  const motionMode = config.motionMode === 'real' ? 'real' : 'sim';
  const realRobotIps = new Set(
    String(config.realRobotIps ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== ''),
  );
  if (motionMode === 'real' && realRobotIps.size === 0) {
    ctx.logger?.warn?.(
      'universal-robots: motionMode=real 但 realRobotIps 为空 —— 所有目标都会被拒绝（fail-closed）。' +
        '请在配置里写出允许操作的机器人地址。',
    );
  }

  try {
    worker = new UrWorker({
      pythonBin: config.pythonBin ?? 'python',
      pythonDir: PYTHON_DIR,
      commandTimeoutMs: config.commandTimeoutMs ?? 60000,
      // 运行模式交给 Python 侧判定（缺省 sim ⇒ 真机通道结构性不可达）。
      motionMode,
    });
    ctx.effect(
      () => () => {
        // Ask the worker to close its robot connections before killing it: an
        // RTDE session is exclusive on the controller, and a process death can
        // leave the controller holding it until its own timeout — which is
        // exactly the "cannot reconnect after a restart" symptom. `dispose()`
        // is still called unconditionally afterwards, and `shutdown()` is
        // best-effort, so a wedged worker never blocks teardown for long.
        // ⚠️ **必须 return 这个 promise。** cordis 的 `runDisposable` 只在 disposer 返回 thenable
        // 时才 await 它（`const result = dispose(); if (isObject(result) && 'then' in result) …`）。
        // 旧写法启动了清理却不返回 ⇒ 宿主不等它，**Python 子进程可能活过宿主**，而它手里正握着
        // 排他的 RTDE 会话（下一个进程连不上，直到控制器自己超时）。
        return Promise.resolve()
          .then(() => worker.shutdown({ timeoutMs: 5000 }))
          .catch(() => {})
          .finally(() => worker.dispose());
      },
      'universal-robots: worker',
    );
  } catch (e) {
    workerError = e;
    ctx.logger?.warn?.(`universal-robots: worker init failed: ${e.message}`);
  }

  /*
   * Connected-IP registry for the twin state route.
   *
   * `UrWorker` exposes no `connectedIps()` member, and the Python protocol must
   * not change for a visualisation feature — so the host half derives the set
   * from successful `connect` / `disconnect` tool calls (below). It is only a
   * fast pre-check: real correctness comes from the handler's try/catch, so a
   * stale entry costs one failed probe rather than a false `connected:true`.
   */
  const connectedIps = new Set();

  /*
   * Memoised robot model per IP: `ip → {name, epoch, at}`.
   *
   * The model name is a Dashboard round trip and cannot change while a connection
   * lives, so caching it is right — but a cache of a thing that *can* change needs
   * an invalidation rule, and this one used to have only "connect/disconnect tool
   * was called". Swapping the robot at the same IP (a different model on the same
   * address) therefore left the twin rendering the previous model forever.
   *
   * Now the entry carries the **connection epoch** it was read under
   * (`lib/worker.js` telemetry: the Python process's `ROBOT_CONN_SEQ` plus the
   * spawn generation). A reconnect — which is exactly what a swapped robot causes
   * — changes the epoch, so `createTwinStateHandler` re-reads the model and the
   * client swaps the mesh. `at` is the fallback age budget for when no epoch is
   * available (push disabled / older worker).
   *
   * Cleared on connect and on disconnect as before.
   */
  const robotModels = new Map();

  /*
   * 离线仿真目标（0.7.0）。
   *
   * `SIM_IP` 是**保留的回环地址**：真机控制器的 RTDE/Dashboard 服务跑在控制器上，本机回环
   * 不可能出现一台真 UR，所以"仿真碰不到真机"是**结构性**保证，而不是靠这张集合。集合只用来
   * 决定"要不要弹人工确认"（仿真里没有可伤人的动作，弹窗只会让人误以为它在动真机）：
   * 一旦集合漂了（worker 重启后仿真没了），worker 侧的保留地址守卫会让指令直接失败，
   * 绝不会打到一个真实控制器上 —— 失效方向是安全的。
   */
  const SIM_IP = SIM_IP_FROM_MODULE;
  const simIps = new Set();
  /** 这条指令的目标是不是**正在运行的离线仿真**（只有它才跳过人工确认）。 */
  const isOfflineSimTarget = (ip) => ip === SIM_IP && simIps.has(SIM_IP);

  /*
   * 仿真的**配置记忆 + 自愈**（0.7.0 修复）。
   *
   * 病灶：`SIMS` 活在 Python 子进程的**内存**里。子进程一旦被替换（崩溃重启、插件重载、
   * 进程被回收），那台虚拟机器人就没了，而宿主侧的 `simIps` 仍然以为它在 —— 于是出现
   * "仿真明明是开着的，可每条指令都报未连接"这种自相矛盾的状态，而且**没有任何提示**。
   *
   * 治法：宿主记住"应该有一台什么样的虚拟机器人"，在把指令交给 worker **之前**确认它还在，
   * 丢了就按记忆重建。重建是有代价的（虚拟机器人回到起始姿态），所以只在真有怀疑时探测：
   * 子进程代次变了立刻查，否则每 `SIM_PROBE_INTERVAL_MS` 兜底查一次。
   */
  let simConfig = null;
  /** 上次**跨重启恢复**失败的原因（成功或不需要恢复时为 null；只用于回显，不改变任何行为）。 */
  let simRestoreError = null;
  /**
   * 落盘配置（0.1.10，路线图 E2）。
   *
   * `persistSimState:false` ⇒ 不碰磁盘（`simStateFile` 为 null，所有落盘调用都变成空操作）；
   * 这是给"不想让插件写文件"的宿主留的退路。失败**一律不影响仿真**：`writeSimState` 内部
   * try/catch 并只写日志。
   */
  const simStateFile = (config.persistSimState ?? true)
    ? simStatePath({ file: config.simStateFile ?? '' })
    : null;
  const persistSim = (state) => {
    if (simStateFile === null) return;
    writeSimState(simStateFile, state, { logger: ctx.logger });
  };
  /** 正在进行的探测/重建（并发去重：同一时刻只探测一次）。 */
  let simHealInFlight = null;
  /** 上次**确认仿真还在**的时刻。 */
  let simProbeAt = 0;
  /** 开启仿真时看到的子进程代次：它变了就说明子进程被换过，仿真必然已丢。 */
  let simRespawnSeen = -1;
  /** 没换子进程时的兜底探测间隔（毫秒）。 */
  const SIM_PROBE_INTERVAL_MS = 10000;
  /** 探测本身的预算：只是问一句"还在吗"，不该占住整条命令的超时预算。 */
  const SIM_PROBE_TIMEOUT_MS = 5000;

  /** 当前子进程代次（拿不到就当"不知道"，此时只靠时间兜底）。 */
  const workerRespawnCount = () => {
    try {
      const stats = worker?.stats?.();
      return Number.isFinite(stats?.respawnCount) ? stats.respawnCount : null;
    } catch {
      return null;
    }
  };

  /**
   * 装上自愈：包一层 `worker.call`，**所有**打在仿真地址上的指令都先确认虚拟机器人还在。
   *
   * 包在 `worker.call` 这一层（而不是工具执行处）是关键：仿真的读路径走
   * `createTwinReadWorker(worker)`，它也调用同一个 `worker.call`，于是"面板看到的仿真"与
   * "工具驱动的仿真"共用同一条自愈，不会一个修好了另一个还在报未连接。
   */
  const installSimSelfHealing = () => {
    if (worker === null || typeof worker.call !== 'function') return;
    const rawCall = worker.call.bind(worker);

    const noteAlive = () => {
      simProbeAt = Date.now();
      const respawn = workerRespawnCount();
      if (respawn !== null) simRespawnSeen = respawn;
    };

    /** 按记忆的配置重建虚拟机器人；没有记忆就如实注销（让调用方看到未连接，而不是假成功）。 */
    const rebuild = async () => {
      const cfg = simConfig;
      if (cfg === null) {
        simIps.delete(SIM_IP);
        connectedIps.delete(SIM_IP);
        return false;
      }
      const res = await rawCall('sim_start', { ...cfg }, config.commandTimeoutMs ?? 60000);
      if (res?.data?.active === true) {
        simIps.add(SIM_IP);
        connectedIps.add(SIM_IP);
        robotModels.delete(SIM_IP);
        noteAlive();
        ctx.logger?.warn?.(
          `universal-robots: 离线仿真的 worker 子进程被替换过，已按 ${cfg.model} 自动重建`
            + '（虚拟机器人回到起始姿态；面板会跟着刷新）',
        );
        return true;
      }
      return false;
    };

    const heal = async (op, params) => {
      // 仿真自身的三个 op 不参与自愈：`sim_status` 是探测手段本身，`sim_start/stop` 是用户意图。
      if (op === 'sim_start' || op === 'sim_stop' || op === 'sim_status') return;
      if (worker === null || typeof worker.call !== 'function') return;
      if (!isOfflineSimTarget(params?.ip)) return;
      if (simConfig === null) return;
      if (simHealInFlight !== null) {
        await simHealInFlight;
        return;
      }
      const respawn = workerRespawnCount();
      const respawnChanged = respawn !== null && respawn !== simRespawnSeen;
      if (!respawnChanged && Date.now() - simProbeAt <= SIM_PROBE_INTERVAL_MS) return;
      simHealInFlight = (async () => {
        let status = null;
        try {
          // ⚠️ **探针必须 `killOnTimeout: false`**（否则它会把正在运动的 worker 杀掉）。
          // `rawCall` 走的是历史默认语义：超时即杀子进程（理由见 lib/worker.js 的
          // `options.killOnTimeout`）—— 那对"一条卡死的指令"是对的，但对**探测**是错的：
          // worker 单线程，运动期间主线程就卡在 `_sim_settle` 里，任何探针都必然排到运动
          // 结束之后才可能被读到。5 s 预算一到，探针就把整条正在执行的运动连人带会话处决，
          // 表现是长动作（仿真或真机都成立）在中途莫名收到
          // `UR worker 未能及时完成 "sim_status"`。探测的语义是"看一眼、答不上来就算了"，
          // 与下面 catch 的意图一致：**不在这里抢修，也不在这里处决**。
          status = await rawCall('sim_status', {}, SIM_PROBE_TIMEOUT_MS, undefined, {
            killOnTimeout: false,
          });
        } catch {
          // 探测自己失败（子进程正忙/刚挂）：不在这里抢修，让这条指令照常走、如实报错。
          return;
        }
        if (status?.data?.active === true) {
          noteAlive();
          return;
        }
        await rebuild();
      })();
      try {
        await simHealInFlight;
      } finally {
        simHealInFlight = null;
      }
    };

    worker.call = async (op, params, ...rest) => {
      await heal(op, params);
      return rawCall(op, params, ...rest);
    };

    /*
     * 跨宿主重启的恢复（0.1.10，路线图 E2）。
     *
     * 落盘的只有"上次确实开着"这一种情况（`enabled:false` 与文件不存在都读成 `null`），所以这里
     * 不需要再猜用户意图。恢复**复用 `rebuild()`**：与自愈同一条路径、同样会重新登记
     * `simIps`/`connectedIps`，失败也**不假装成功**（`isOfflineSimTarget` 仍为假，指令如实报未连接）。
     *
     * 刻意放在这里（worker 建立之后、且同步代码里**只发起不等待**）：插件加载不能被一次
     * `sim_start` 拖住；失败只把原因记下来，由面板回显。
     */
    if (simStateFile !== null) {
      const persisted = readSimState(simStateFile, { logger: ctx.logger });
      if (persisted !== null) {
        simConfig = persisted;
        void (async () => {
          try {
            const restored = await rebuild();
            if (restored) {
              ctx.logger?.info?.(
                `universal-robots: 已按上次的配置恢复离线仿真（${persisted.model}`
                  + `${persisted.preset ? ` / ${persisted.preset}` : ''}）`,
              );
            } else {
              simRestoreError = '恢复失败：控制器没有接受 sim_start';
            }
          } catch (e) {
            simRestoreError = e instanceof Error ? e.message : String(e);
            ctx.logger?.warn?.(`universal-robots: 恢复上次的离线仿真失败（不影响工具）：${simRestoreError}`);
          }
        })();
      }
    }
  };

  /** 记下"仿真应该是这个样子"（只有成功开启时才记）。 */
  const noteSimEnabled = (args) => {
    const model = typeof args?.model === 'string' ? args.model.trim() : '';
    if (model === '') return;
    simConfig = { model };
    if (typeof args.preset === 'string' && args.preset !== '') simConfig.preset = args.preset;
    if (Number.isFinite(args.speed_scaling)) simConfig.speed_scaling = args.speed_scaling;
    simProbeAt = Date.now();
    const respawn = workerRespawnCount();
    simRespawnSeen = respawn === null ? -1 : respawn;
    // 落盘"意图"：下次宿主启动时按它恢复（用户没关过 ⇒ 该有一台同样的虚拟机器人）。
    persistSim({ enabled: true, ...simConfig });
  };

  /** 用户/AI 明确关掉仿真：清掉记忆，避免自愈又把它拉起来。 */
  const noteSimDisabled = () => {
    simConfig = null;
    simProbeAt = 0;
    simRespawnSeen = -1;
    // 落盘 `enabled:false` 是关键：重启后**不得**把它复活（"明确关掉"也是一种持久意图）。
    persistSim({ enabled: false });
  };

  /**
   * 从 `sim_start` / `connect` 的响应里取出"该记成什么样的一台仿真"（P0-4）。
   *
   * 两个来源的字段名不同：`sim_start` 的入参是 `{model, preset, speed_scaling}`；
   * `connect` 在 python 侧就是"确保仿真在跑 + 返回 sim_status"（见 `python/ur_worker.py` 的
   * `op_connect`），响应是 `sim.status()` 那一份，型号叫 `model_id`、起始姿态叫 `preset`。
   * 这里统一成 `noteSimEnabled()` 认识的形状 —— 拿不到型号就返回 `null`（不猜一个默认型号，
   * 否则子进程被换后会把一台**别的**机器人重建回来）。
   *
   * @param {object} args 工具入参（`sim_start` 用）
   * @param {object} data worker 响应里的 `data`
   * @returns {{model: string, preset?: string, speed_scaling?: number}|null}
   */
  const simConfigFrom = (args, data) => {
    const pickString = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : '');
    const model = pickString(data?.model_id) || pickString(args?.model);
    if (model === '') return null;
    const cfg = { model };
    const preset = pickString(data?.preset) || pickString(args?.preset);
    if (preset !== '') cfg.preset = preset;
    if (Number.isFinite(data?.speed_scaling)) cfg.speed_scaling = data.speed_scaling;
    else if (Number.isFinite(args?.speed_scaling)) cfg.speed_scaling = args.speed_scaling;
    return cfg;
  };

  /**
   * 仿真生命周期的**唯一登记口**（P0-4）。
   *
   * `connect` / `disconnect` 在 python 侧就是"确保仿真在跑" / "停掉仿真"（见
   * `python/ur_worker.py` 的 `op_connect` / `op_disconnect`），而 `sim_start` / `sim_stop` 是同一件
   * 事的显式版本，面板开关路由也是同一条 python 路径。三条入口必须写**同一份宿主侧真源**
   * （`simIps` / `connectedIps` / `robotModels` / `simConfig` / 落盘），否则会出现：
   *
   *   - `connect` 之后 `isOfflineSimTarget` 仍为假 ⇒ 仿真目标被误当"真机目标"去弹审批；
   *   - 面板 I/O 写按 `simIps` 判定 ⇒ 明明连着却回 409 `SIM_NOT_RUNNING`；
   *   - `simConfig` 为空 ⇒ 子进程被换后自愈"没有记忆可重建"，指令全部报未连接；
   *   - `disconnect` 之后宿主以为仿真还在 ⇒ 宿主与 python 各按不同型号重建，认知永久分叉。
   *
   * @param {boolean} enabled 开 / 关
   * @param {{model: string, preset?: string, speed_scaling?: number}|null} [cfg]
   *   开启时"应该是一台什么样的仿真"；`null` = 只登记运行状态、不写记忆（拿不到型号时）。
   */
  const applySimLifecycle = (enabled, cfg = null) => {
    if (enabled) {
      simIps.add(SIM_IP);
      connectedIps.add(SIM_IP);
      // 型号缓存故意不在登记时写：让 `createTwinStateHandler` 按新连接代次自己读一次更一致。
      robotModels.delete(SIM_IP);
      if (cfg !== null) noteSimEnabled(cfg);
    } else {
      simIps.delete(SIM_IP);
      connectedIps.delete(SIM_IP);
      robotModels.delete(SIM_IP);
      noteSimDisabled();
    }
  };

  installSimSelfHealing();

  /**
   * 某 IP 当前的**连接代次**，来自 worker 的推送遥测（拿不到就是 `undefined`）。
   *
   * 只读、零往返：推送缓存由 URBasic 自己的接收线程在更新。任何异常都降级成"不知道"，
   * 让调用方退回按时间窗判断 —— 一个诊断用的缓存不该有能力影响工具调用。
   */
  const connectionEpoch = (ip) => {
    if (worker === null || typeof worker.latestTelemetry !== 'function') return undefined;
    try {
      const entry = worker.latestTelemetry(ip);
      const epoch = entry !== null && typeof entry === 'object' ? entry.epoch : undefined;
      return typeof epoch === 'string' && epoch !== '' ? epoch : undefined;
    } catch {
      return undefined;
    }
  };

  /**
   * 记下一台机器人的型号（读到时顺手打上当前连接代次与时刻）。
   *
   * 空型号一律忽略：`robot_models` 为空字符串时把空值写进缓存，仿真下次会拿到
   * `''` 并显示成"未知型号"，比不缓存更糟。
   *
   * `simulated` 也一起记：这一帧来自离线仿真时，仿真面板要打仿真水印、截图水印也要带上，
   * 而它是**跟着型号一起**读出来的（见 python 的 `get_robot_model`），所以存在同一个条目里
   * 就不会出现"型号是仿真的、水印说不是真机"这种自相矛盾。
   */
  const cacheRobotModel = (ip, name, simulated = false) => {
    const value = typeof name === 'string' ? name.trim() : '';
    if (value === '') return;
    robotModels.set(ip, {
      name: value,
      epoch: connectionEpoch(ip),
      at: Date.now(),
      simulated: simulated === true,
    });
  };

  /**
   * Build one tool.
   *
   * ⚠️ **`op` 只能来自这里的闭包参数，绝不能来自 `args`。**
   *
   * 这里曾经直接把模型给的 `args` 交给 `worker.call(op, args, …)`，而 `lib/worker.js:272`
   * 拼线上载荷时是 `{ id, op, _timeout_ms, ...params }` —— `params` 展开在**最后**，于是
   * 模型只要多传一个 `op` 字段就能把它改掉（`{"ip":…, "op":"power_off"}`），而审批门禁检查的
   * 是闭包里的 `op`（`APPROVAL_OPS.has(op)`）。dsh-tools 的参数 schema 不拒绝未声明字段
   * （编译出来的 parameters 没有 `additionalProperties: false`），所以这个多出来的字段能一路
   * 走到 worker —— **全部 38 个受门禁的 op 都可以借任意未受门禁的工具绕过人工确认**
   * （多传 `id` 还能让调用挂满超时后被 kill）。同一个洞也允许模型覆写保护字段 `id` /
   * `_timeout_ms`。
   *
   * 现在的两道防线：
   *   1. 线上载荷按**工具自己声明的参数表**白名单过滤（未声明的字段一律丢弃）；
   *   2. `op` 始终是闭包里的那个，与门禁判定所用的值同一个来源。
   */
  const makeTool = (op, { toolName, description, parameters, timeoutMs }) => {
    const allowedKeys = new Set(Object.keys(parameters ?? {}));
    /*
     * 两个**不同**的时间预算（P0-3）：
     *   - `callTimeoutMs` —— 交给 `worker.call()`，也就是控制器侧运动的预算（Python 用它约束
     *     到位确认/完成等待）；它一个字都不改。
     *   - `hostTimeoutMs` —— 交给 `defineTool()` 的**整个 `execute()` 死线**。门禁开启时它
     *     必须额外容纳"人点确认"的等待，否则审批会吃掉运动预算（见 `APPROVAL_MARGIN_MS`）。
     *
     * ⚠️ 门禁关闭时**不传**新值（保持 undefined = 宿主的既有默认），受门禁工具才显式加余量 ——
     * 非门禁工具的行为与改动前逐字节一致。
     */
    const callTimeoutMs = timeoutMs ?? config.commandTimeoutMs ?? 60000;
    const hostTimeoutMs = requireApprovalForMotion && APPROVAL_OPS.has(op)
      ? callTimeoutMs + APPROVAL_MARGIN_MS
      : timeoutMs;
    /**
     * 只保留该工具声明过的参数 —— 挡住 `op` / `id` / `_timeout_ms` 之类的注入。
     *
     * `ip` 额外**归一化（trim）**：宿主侧的仿真判定是严格相等（`ip === SIM_IP`，不 trim），
     * 而 Python 侧会 trim 后接受并改写。于是 `" 127.0.0.1"` 在宿主侧被判成"真机目标" → 走人工
     * 审批；在 approval=never 的会话里就表现为"命令被拒"，极易被误诊成 worker 故障。口径统一在
     * 宿主这一处，fail-closed 的方向不变（非回环地址依旧按真机处理）。
     */
    const sanitizeArgs = (args) => {
      if (args === null || typeof args !== 'object') return {};
      const safe = {};
      for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(args, key)) safe[key] = args[key];
      }
      if (typeof safe.ip === 'string') safe.ip = safe.ip.trim();
      return safe;
    };

    return defineTool({
      name: toolName,
      description,
      parameters,
      output: textOutput(),
      timeoutMs: hostTimeoutMs,
      async execute(rawArgs, exec) {
        const args = sanitizeArgs(rawArgs);
        // 离线仿真的目标不弹人工确认：那里没有可伤人的动作（仿真只有运动学，绝不能碰真机；
        // 见 SIM_IP 的说明）。对**真机**的一切行为不变 —— 这是安全门禁唯一的例外。
        const simTarget = isOfflineSimTarget(args.ip);
        /*
         * 真机模式的两道收口（路线图 A）：
         *   ① 目标必须在白名单里 —— 不在就**在派发前**拒绝（fail-closed，连 worker 都不打扰）；
         *   ② **没有任何审批豁免** —— `simTarget` 只在仿真模式下才算数。这一条把审计的 H-2
         *      结构性关掉：豁免从"模型可以自己置位的运行期状态"变成了"人写进配置的模式"。
         */
        if (
          motionMode === 'real'
          && typeof args.ip === 'string'
          && args.ip !== SIM_IP // 保留地址在两种模式下都表示仿真（见 python 侧 route_op 的同款说明）
          && !realRobotIps.has(args.ip)
        ) {
          throw new Error(
            `真机模式（motionMode=real）：目标 ${args.ip} 不在 realRobotIps 白名单里，已拒绝。` +
              `请在插件配置里写出允许操作的机器人地址（当前白名单 ${realRobotIps.size} 项）。`,
          );
        }
        const exempt = motionMode === 'sim' && simTarget;
        if (requireApprovalForMotion && APPROVAL_OPS.has(op) && !exempt) {
          await requestApproval(ctx, toolName, args, exec, op);
        }
        const res = await worker.call(op, args, callTimeoutMs, exec.signal);
        // Only after a *successful* round-trip: the twin registry is advisory
        // (a stale entry just costs one failed probe; see twin-routes.js).
        if (op === 'connect' && typeof args.ip === 'string') {
          connectedIps.add(args.ip);
          // A reconnect must not inherit the previous robot's memoised model.
          robotModels.delete(args.ip);
        }
        if (op === 'disconnect' && typeof args.ip === 'string') {
          connectedIps.delete(args.ip);
          robotModels.delete(args.ip);
        }
        /*
         * 离线仿真的生命周期登记（P0-4）：`connect`/`disconnect` 与 `sim_start`/`sim_stop`
         * **共用同一个登记口**（`applySimLifecycle`）。
         *
         * python 侧 `op_connect` 就是"确保仿真在跑然后返回 sim_status"、`op_disconnect` 就是
         * "停掉仿真"（见 python/ur_worker.py）。宿主以前只在 sim_* 分支登记，于是 connect 之后：
         * `isOfflineSimTarget` 为假（仿真目标被误弹审批）、面板 I/O 写回 409、子进程被换后
         * `simConfig` 为空导致自愈不重建；disconnect 之后宿主以为仿真还在，两条路径各按不同
         * 型号重建。现在三条入口写同一份真源与落盘。
         */
        if (op === 'sim_start' && res?.data?.active === true) {
          applySimLifecycle(true, simConfigFrom(args, res?.data));
        }
        if (op === 'sim_stop') {
          applySimLifecycle(false);
        }
        if (op === 'connect') {
          // `connect` 的响应就是 `sim_status`：型号在 `model_id`、起始姿态在 `preset`。
          // 成功返回 ⇒ python 的 `_ensure_sim_ready()` 已保证仿真在跑；只有"回包里没写 active"
          // 时才需要追问一次。型号/姿态拿不到时同样**只读地**补问 sim_status（绝不为记忆改
          // python 侧）；仍然拿不到就只登记运行状态、不写记忆 —— 运行状态与 I/O 路由照常生效。
          const data = res?.data;
          let active = data?.active === true;
          let cfg = simConfigFrom(args, data);
          if (data?.active === undefined || cfg === null) {
            try {
              const status = await worker.call('sim_status', {}, callTimeoutMs);
              if (status?.data?.active === true) active = true;
              if (cfg === null) cfg = simConfigFrom(args, status?.data);
            } catch {
              /* 探测失败：按回包信息为准，不在这里假装成功 */
            }
          }
          if (active) applySimLifecycle(true, cfg);
        }
        if (op === 'disconnect') {
          // python 的 disconnect 只针对保留回环地址（`_sim_requested_ip`），语义就是"停仿真"。
          applySimLifecycle(false);
        }
        // Cache the model name the moment an op reports it (op_connect only
        // returns the version/remote state, so this covers get_robot_model and
        // status as well).
        if (typeof args.ip === 'string' && res && typeof res.data === 'object' && res.data !== null) {
          const name = res.data.robot_model;
          if (typeof name === 'string' && name.trim() !== '') {
            cacheRobotModel(args.ip, name, res.data.simulated === true);
          } else if (op === 'disconnect') {
            robotModels.delete(args.ip);
          }
        }
        let text = res?.message ?? String(res);
        if (res?.data !== undefined) {
          text += '\n' + JSON.stringify(res.data, null, 2);
        }
        return text;
      },
    });
  };


  /*
   * 注册结果必须如实上报。
   *
   * v0.3.9 的事故复现：多家工具的参数 schema 被 DSL 拒绝，注册在 try/catch 里逐个静默失败，
   * 而收尾那行打印的是硬编码的 `tools.length`，于是「日志看起来正常」骗过了所有检查，
   * 直到用户发现工具不见了。⇒ 现在按**实际成功数**上报；有失败就把清单与原因写出来；
   * 一个都没装成时区分三种原因（worker 初始化失败 / 宿主没有 tools 服务 / register 不是函数）。
   */
  // 声明面是工厂：`timeoutMs` 来自配置，必须显式传进去（见 lib/tool-defs.js 的说明）。
  const tools = buildTools(config);
  const registerTool = ctx.tools?.register;
  if (worker !== null && typeof registerTool === 'function') {
    const failures = [];
    let registered = 0;
    for (const t of tools) {
      try {
        registerTool.call(ctx.tools, makeTool(t.op, t));
        registered += 1;
      } catch (e) {
        failures.push(`${t.toolName}（${e?.message ?? e}）`);
        ctx.logger?.warn?.(`universal-robots: 注册 ${t.toolName} 失败：${e.message}`);
      }
    }
    if (failures.length === 0) {
      ctx.logger?.info?.(`universal-robots: 已注册 ${registered}/${tools.length} 个 UR 机器人控制工具`);
    } else {
      ctx.logger?.warn?.(
        `universal-robots: 只注册了 ${registered}/${tools.length} 个 UR 机器人控制工具；失败 ${failures.length} 个：${failures.join('；')}`,
      );
    }
  } else {
    const reason = worker === null
      ? `worker 初始化失败（${workerError?.message ?? '未知原因'}）`
      : ctx.tools === undefined
        ? '宿主未组合 tools 服务'
        : '宿主的 ctx.tools.register 不是函数（宿主 API 可能已变更）';
    ctx.logger?.warn?.(`universal-robots: 未注册任何工具，原因：${reason}`);
  }

  /*
   * ── Digital-twin host routes (read-only) ──────────────────────────────────
   *
   * Mounted through `ctx.inject(['webServer'], …)` rather than a top-level
   * `inject` entry: adding 'webServer' to the module-level `inject` array would
   * make the *whole* plugin (every ursim_* tool) refuse to load in any host that
   * composes no web server. The routes are mounted even when the worker is
   * null, so the twin simply reports `connected:false`.
   */
  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (hostCtx) => {
      /*
       * ⚠️ 仿真的读走 `createTwinReadWorker(worker)`：短预算 + **超时不杀进程**。
       * 直接用 worker 会让"机器人正在运动 ⇒ worker 忙 ⇒ 仿真读排队 ⇒ 60 s 后超时 ⇒
       * 子进程被杀 ⇒ 整条机器人会话（RTDE/Dashboard）没了 ⇒ 仿真永远不再更新"。
       * 见 lib/twin-worker.js 的文件头。
       */
      const twinWorker = createTwinReadWorker(worker);
      /**
       * 主动推送遥测的读取口（见 lib/worker.js 的 `latestTelemetry`）。
       *
       * ⚠️ 必须挂在**原始 worker** 上，不能走 `twinWorker` —— `createTwinReadWorker`
       * 只替换 `call()` 的预算，推送缓存是 `UrWorker` 自身的状态。
       *
       * 有了它，仿真的每一帧**不再需要 worker 往返**：机器人运动时运动命令占住的是
       * stdin 队列，而 RTDE 缓存由 URBasic 自己的接收线程以 500 Hz 更新，推送因此照常
       * 到达 —— 这正是「数据已停止更新 Ns」的解药。
       */
      const twinTelemetry = (ip) => (worker !== null && worker !== undefined
        && typeof worker.latestTelemetry === 'function'
        ? worker.latestTelemetry(ip)
        : undefined);
      const stateHandler = createTwinStateHandler({
        worker: twinWorker,
        connectedIps: () => connectedIps,
        modelFor: (ip) => robotModels.get(ip) ?? null,
        // 读到的型号写回同一张表：轮询与 SSE 两条路共用一份缓存，稳态下零多余往返。
        setModelFor: (ip, entry) => { robotModels.set(ip, entry); },
        // 连接代次一旦变化（同一个 IP 上换了机器人 / RTDE 掉线重连），型号缓存立即失效。
        telemetryEpoch: connectionEpoch,
        telemetry: twinTelemetry,
      });
      const assetHandler = createTwinAssetHandler({ assetsDir: ASSETS_DIR });
      const modelsHandler = createTwinModelsHandler({ assetsDir: ASSETS_DIR });
      // 流式路由复用与轮询**完全相同**的读取逻辑（`createTwinStateHandler`），
      // 所以两条路不会出现语义漂移（含上面的型号缓存与失效规则）。
      const streamHandler = createTwinStreamHandler({
        worker: twinWorker,
        connectedIps: () => connectedIps,
        modelFor: (ip) => robotModels.get(ip) ?? null,
        setModelFor: (ip, entry) => { robotModels.set(ip, entry); },
        telemetryEpoch: connectionEpoch,
        telemetry: twinTelemetry,
      });

      /**
       * Trust fence: these routes expose robot telemetry and local files, so
       * only same-origin loopback callers are served. Mirrors the shell's own
       * plugin-route guard (see e.g. dsh-dream-skin `isTrustedApiRequest`).
       */
      const isTrustedRequest = (req) => {
        const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
        if (host === undefined) return false;
        let hostUrl;
        try {
          hostUrl = new URL(`http://${host}`);
        } catch {
          return false;
        }
        const hn = hostUrl.hostname;
        const loopback = hn === 'localhost' || hn === '[::1]' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hn);
        if (!loopback) return false;
        if (req.headers['sec-fetch-site'] === 'cross-site') return false;
        const origin = req.headers.origin;
        if (origin === undefined) return true;
        try {
          return new URL(origin).host === hostUrl.host;
        } catch {
          return false;
        }
      };

      const sendJson = (res, { status, body, headers }) => {
        res.writeHead(status, {
          'content-type': 'application/json; charset=utf-8',
          // Live telemetry: a cached pose is worse than no pose. The handlers
          // also set this, but the shell's own responses (403/405) should not
          // be cacheable either.
          'cache-control': 'no-store, no-cache, must-revalidate',
          ...(headers ?? {}),
        });
        res.end(JSON.stringify(body));
      };

      /**
       * The asset handler returns a Buffer on a hit and a JSON-able object on a
       * miss, so serialise by type — `res.end({...})` would throw.
       */
      const sendAssetResult = (res, r) => {
        const headers = r.headers ?? {};
        if (Buffer.isBuffer(r.body) || typeof r.body === 'string') {
          res.writeHead(r.status, headers);
          res.end(r.body);
          return;
        }
        res.writeHead(r.status, {
          'content-type': 'application/json; charset=utf-8',
          ...headers,
        });
        res.end(JSON.stringify(r.body ?? ''));
      };

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_STREAM_PATH,
            // 流式路由自己持有响应生命周期（DSH 的 webServer 明确支持 SSE），
            // 所以这里**不**用 sendJson 收尾。信任围栏仍在最前面。
            handler: (req, res) => {
              if (!isTrustedRequest(req)) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              streamHandler(req, res);
            },
          }),
        'ursim-twin: stream route',
      );

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_STATE_PATH,
            handler: async (req, res) => {
              if (!isTrustedRequest(req)) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              if (req.method !== 'GET') {
                res.writeHead(405);
                res.end();
                return;
              }
              /*
               * ⚠️ 查询参数必须**原样透传**给读取逻辑（`twinStateQuery` 是白名单纯函数，可单测）。
               *
               * 这里曾经只转发 `detail`，把 `io` / `reg` / `from` / `count` 全丢了 ⇒ 读取逻辑里
               * `wantsIo` / `wantsRegisters` 恒为 false ⇒ **面板的 I/O 与寄存器永远读不出值**
               * （返回的帧里根本没有 `io` / `registers` 字段）。单测直接调用读取逻辑、不经过路由，
               * 所以四道门全绿也照样漏。`/stream` 没这个坑，是因为流式处理器自己解析 URL ——
               * 现在两条路共用同一份白名单函数。
               */
              sendJson(res, await stateHandler({
                // ⚠️ **忽略 ?ip=**：本插件只操作离线仿真机器人，不存在任何真机通道。
                // 客户端即使带着一个真机地址来（旧配置里的 ip / __URSIM_TWIN_IP__），
                // 这里也一律钉到保留地址上 —— 仿真的取数不可能落到真机。
                ip: SIM_IP,
                ...twinStateQuery(req.url),
              }));
            },
          }),
        'ursim-twin: state route',
      );

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_ASSET_PATH,
            handler: async (req, res) => {
              if (!isTrustedRequest(req)) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              if (req.method !== 'GET') {
                res.writeHead(405);
                res.end();
                return;
              }
              const url = new URL(req.url, 'http://localhost');
              const r = await assetHandler(
                { model: url.searchParams.get('model') ?? '' },
                // Forward the validator so a cached GLB can be answered with 304:
                // without it every panel reopen re-downloads 1.5-3.5 MB.
                req.headers,
              );
              sendAssetResult(res, r);
            },
          }),
        'ursim-twin: asset route',
      );

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_MODELS_PATH,
            handler: async (req, res) => {
              if (!isTrustedRequest(req)) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              if (req.method !== 'GET') {
                res.writeHead(405);
                res.end();
                return;
              }
              sendJson(res, await modelsHandler());
            },
          }),
        'ursim-twin: models route',
      );

      /*
       * ── 离线仿真的开关路由（本插件**唯一**的写路由）──────────────────────────
       *
       * `GET`  读当前仿真状态（面板开机时据此同步开关，无副作用）
       * `POST` 开关仿真（面板里的那个开关；等价于 ursim_sim_start / ursim_sim_stop）
       *
       * 写守卫比读路由**多三层**，因为这个 handler 会改状态：
       *   ① `isTrustedRequest`（回环 Host + 非跨站 + Origin 同源）；
       *   ② **必须带 Origin**（上游 dsh-community-market 的写路由同样要求）：没有 Origin 的
       *      请求只能是非浏览器客户端（或伪造），一律拒绝；
       *   ③ 只接受 `application/json`，且请求体有上限（4 KB）——超过就 destroy。
       *
       * 它的副作用被刻意压到最小：只能创建/销毁**回环地址上的运动学虚拟机器人**，
       * 任何真机都不会因此收到指令（见 python 侧 `SIM_IP` 的保留地址守卫）。
       */
      const SIM_BODY_MAX_BYTES = 4096;
      const readJsonBody = (req) => new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
          size += chunk.length;
          if (size > SIM_BODY_MAX_BYTES) {
            reject(new Error('请求体过大'));
            try { req.destroy(); } catch { /* 已断开 */ }
            return;
          }
          chunks.push(chunk);
        });
        req.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString('utf8').trim();
            resolve(text === '' ? {} : JSON.parse(text));
          } catch (e) {
            reject(new Error(`请求体不是合法 JSON：${e.message}`));
          }
        });
        req.on('error', () => reject(new Error('读取请求体失败')));
      });

      /** 面板的写请求允许吗？（读路由的信任围栏 + Origin 必填 + JSON content-type） */
      const isTrustedWrite = (req) => {
        if (!isTrustedRequest(req)) return false;
        if (typeof req.headers.origin !== 'string' || req.headers.origin === '') return false;
        const type = typeof req.headers['content-type'] === 'string'
          ? req.headers['content-type'].toLowerCase() : '';
        return type.includes('application/json');
      };

      /** 启停仿真时同步宿主侧的登记表（复用工具侧**同一份**登记逻辑，P0-4）。 */
      const applySimEnabled = (enabled, cfg = null) => applySimLifecycle(enabled, cfg);

      const simHandler = async (req) => {
        if (worker === null || typeof worker.call !== 'function') {
          return { status: 503, body: { ok: false, error: 'UR worker 不可用' } };
        }
        if (req.method === 'GET') {
          const res = await worker.call('sim_status', {}, config.commandTimeoutMs);
          /*
           * 面板的「当前模式」指示（P0）要的两个字段。
           *
           * 它们是**配置**（人写下的），不随运行状态变化；但界面必须能一直看到 —— 真机模式下
           * 「这条指令会不会动真机」是操作员最该一眼看到的事。只给角标"仿真"是不够的：
           * 没有角标 ≠ 安全（真机模式下原本什么标识都没有）。
           */
          return {
            status: 200,
            body: {
              ok: true,
              ...(res?.data ?? {}),
              motion_mode: motionMode,
              real_robots: [...realRobotIps],
              // 落盘的记忆（0.1.10）与"上次恢复失败"的原因：面板据此说明"为什么这里没有仿真"。
              remembered: simConfig,
              restore_error: simRestoreError,
            },
          };
        }
        // POST
        const body = await readJsonBody(req);
        /*
         * 面板的 I/O 写（方案 P1，0.1.13）。
         *
         * 这条路由是本插件**唯一**的写通道，所以 I/O 写也走它 —— 而不是再开一条（守卫、体积上限、
         * 信任围栏都是现成的）。**只对正在运行的离线仿真放行**：真机 I/O 请让 AI 调用对应工具，
         * 那里有审批门与声明面白名单；面板写通道不给真机留入口（设计文档 §5.4「真机与仿真分道」）。
         */
        if (body.io !== null && typeof body.io === 'object') {
          const parsed = parseIoWrite(body.io);
          if (!parsed.ok) return { status: 400, body: { ok: false, error: parsed.error } };
          if (!simIps.has(SIM_IP)) {
            return {
              status: 409,
              body: {
                ok: false,
                code: 'SIM_NOT_RUNNING',
                error: '离线仿真没有在运行：面板的 I/O 写只作用于仿真（真机 I/O 请让 AI 调用对应工具）',
              },
            };
          }
          const r = await worker.call(parsed.op, parsed.params, config.commandTimeoutMs);
          if (r !== null && typeof r === 'object' && r.code !== undefined) {
            return { status: 400, body: { ok: false, code: r.code, error: r.message ?? 'I/O 写失败' } };
          }
          return { status: 200, body: { ok: true, message: r?.message, ...(r?.data ?? {}) } };
        }
        const enabled = body.enabled === true;
        if (enabled) {
          const model = typeof body.model === 'string' ? body.model.trim() : '';
          if (model === '') {
            return { status: 400, body: { ok: false, error: '开启仿真必须提供 model（型号 id）' } };
          }
          const args = { model };
          if (typeof body.preset === 'string' && body.preset.trim() !== '') args.preset = body.preset.trim();
          if (Number.isFinite(body.speed_scaling)) args.speed_scaling = body.speed_scaling;
          const res = await worker.call('sim_start', args, config.commandTimeoutMs);
          if (res?.data?.active !== true) {
            return { status: 200, body: { ok: false, error: res?.message ?? '开启仿真失败', ...(res?.data ?? {}) } };
          }
          applySimEnabled(true, args);
          return { status: 200, body: { ok: true, ...(res.data ?? {}) } };
        }
        const res = await worker.call('sim_stop', {}, config.commandTimeoutMs);
        applySimEnabled(false);
        return { status: 200, body: { ok: true, ...(res?.data ?? {}) } };
      };

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_SIM_PATH,
            handler: async (req, res) => {
              if (req.method !== 'GET' && req.method !== 'POST') {
                res.writeHead(405, { allow: 'GET, POST' });
                res.end();
                return;
              }
              // 读与写用不同的守卫：读走仿真那套（与其它只读路由一致），写必须更严。
              const trusted = req.method === 'POST' ? isTrustedWrite(req) : isTrustedRequest(req);
              if (!trusted) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              try {
                const r = await simHandler(req);
                sendJson(res, { status: r.status, headers: {}, body: r.body });
              } catch (e) {
                sendJson(res, {
                  status: 200,
                  headers: {},
                  body: { ok: false, error: e instanceof Error ? e.message : String(e) },
                });
              }
            },
          }),
        'ursim-twin: sim route',
      );

      /*
       * ── 面板控制（实时控制）路由：第二条写通道 ─────────────────────────────
       *
       * 与 `/twin/sim` 的区别：那条只能启停/换型号（会重建仿真），这条在**运行中**下发
       * 单步点动、绝对位姿、关节目标与速度倍率 —— 都不重建。
       *
       * 安全边界：**只对离线仿真生效**。判定由宿主自己做（`isOfflineSimTarget`），
       * 不看客户端传来的任何字段 —— 真机模式下这条通道一律 403，真机控制只能走
       * 受审批门禁保护的工具调用。
       */

      /**
       * 面板控制 → worker op。**只做转发**，不在这里算几何（几何在 Python 侧，
       * 与真机路径共用同一份实现，避免两套数学）。
       *
       * 返回的是 worker 的**完整信封** `{message, data}`（不是 `.data`）：调用方要把
       * `message` 也回给面板（与 `/twin/sim` 的 I/O 写一致），丢掉它面板就只能显示一句
       * 笼统的"已执行"，看不出控制器到底怎么回应的。
       *
       * `ip` 由调用方传入 —— **派发给谁，就由调用方先校验谁**（见路由里那句
       * `isOfflineSimTarget(ip)`）。这里**刻意不给缺省值**：一个漏传 ip 的调用方应该立刻
       * 暴露成 `ip: undefined`，而不是被一个隐式默认值悄悄派发到 `SIM_IP` ——
       * 「校验了谁」与「派发给谁」必须能分叉时立刻看见，而不是靠默认值把两者重新粘在一起。
       *
       * 注意：`jog_rotate` / `set_speed_scaling` 由后续任务实现，本任务只保证路由与校验正确。
       */
      async function dispatchJog(cmd, ip) {
        if (cmd.mode === 'speed') {
          return worker.call('set_speed_scaling', { ip, fraction: cmd.fraction });
        }
        if (cmd.mode === 'home') {
          // 用户 2026-10-17 裁定的回零位形（与型号无关的关节角）。
          return worker.call('movej', { ip, q: [0, -Math.PI / 2, 0, -Math.PI / 2, -Math.PI, 0] });
        }
        if (cmd.mode === 'joint') {
          return worker.call('movej', { ip, q: cmd.q });
        }
        if (cmd.mode === 'pose') {
          return worker.call('movel', { ip, pose: cmd.pose });
        }
        if (cmd.mode === 'rotate') {
          return worker.call('jog_rotate', { ip, axis: cmd.axis, delta_rad: cmd.deltaRad, frame: cmd.frame });
        }
        const op = cmd.frame === 'tool' ? `move_tool_${cmd.axis}` : `move_${cmd.axis}`;
        return worker.call(op, { ip, distance: cmd.distance });
      }

      hostCtx.effect(
        () =>
          hostCtx.webServer.register({
            kind: 'exact',
            path: TWIN_JOG_PATH,
            handler: async (req, res) => {
              if (req.method !== 'POST') {
                res.writeHead(405, { allow: 'POST' });
                res.end();
                return;
              }
              if (!isTrustedWrite(req)) {
                res.writeHead(403);
                res.end('forbidden');
                return;
              }
              /*
               * 守卫顺序在这里是**语义**，不是风格：
               *   405 方法 → 403 信任栅栏 → 403 仿真守卫 → 400 解析 → 派发。
               *
               * 仿真守卫必须排在**解析之前**：面板的行为是「见到 403 就禁控件」，而真机部署
               * 收到畸形 body 时如果先回 400，面板会把它当成"参数写错了、可以改"，而不是
               * "这里根本不许写" —— 真机模式下就凭空多出一条看起来只差参数的 400 路径。
               * 安全判定必须先于任何内容判断。
               */
              /*
               * 安全边界：面板只控仿真。判定由宿主自己做（`isOfflineSimTarget`），不看客户端
               * 传来的任何字段。**校验的就是即将派发的那个 ip** —— 它同时被传给 `dispatchJog`，
               * 所以"派发给谁"与"校验了谁"不可能分叉。
               */
              const ip = SIM_IP;
              if (!isOfflineSimTarget(ip)) {
                sendJson(res, {
                  status: 403,
                  headers: {},
                  body: {
                    ok: false,
                    code: 'SIM_ONLY',
                    error: '面板控制只在离线仿真中可用；真机请用工具调用（受审批门禁保护）',
                  },
                });
                return;
              }
              /*
               * `readJsonBody` **自己就把 JSON 解析好了**（见它的实现：resolve 的是对象，
               * 非法 JSON 直接 reject）。这里不能再 `JSON.parse` 一次 —— 那会把对象变成
               * "[object Object]" 并让**每一条合法请求**都变成 BAD_JSON。
               */
              let body;
              try {
                body = await readJsonBody(req);
              } catch {
                sendJson(res, {
                  status: 400,
                  headers: {},
                  body: { ok: false, code: 'BAD_JSON', error: '请求体不是合法 JSON' },
                });
                return;
              }
              const cmd = parseJogRequest(body);
              if (cmd === null) {
                sendJson(res, {
                  status: 400,
                  headers: {},
                  body: { ok: false, code: 'BAD_COMMAND', error: '不支持的控制指令' },
                });
                return;
              }
              /*
               * worker 未就绪（Python 起不来 / 已被 dispose）是**部署状态**，不是请求错误：
               * 给 503 + 明确 code，而不是让它抛成未捕获异常、由上游变成一句 500
               * （`/twin/sim` 的 simHandler 顶部有同一道兜底）。
               */
              if (worker === null || worker === undefined || typeof worker.call !== 'function') {
                sendJson(res, {
                  status: 503,
                  headers: {},
                  body: { ok: false, code: 'WORKER_UNAVAILABLE', error: 'UR worker 不可用' },
                });
                return;
              }
              try {
                const r = await dispatchJog(cmd, ip);
                /*
                 * 带上 worker 的 `message`（与 `/twin/sim` 的 I/O 写同口径）：
                 * 只回 `data` 的话面板只能写一句笼统的"已执行"，看不出控制器怎么回应的。
                 *
                 * `requested` 是**客户端原始倍率**，与 `fraction`（钳位后的实际值）一起回给面板：
                 * 拖动滑块到 0.5% 会被钳到 1%，界面必须能把「你要的 0.5% / 实际 1%」如实说清楚。
                 * 它放在 `data` 展开之后，避免 worker 回包里万一也有同名字段把它盖掉。
                 */
                sendJson(res, {
                  status: 200,
                  headers: {},
                  body: {
                    ok: true,
                    message: r?.message,
                    ...(r?.data ?? {}),
                    ...(cmd.mode === 'speed' ? { requested: cmd.requested } : {}),
                  },
                });
              } catch (e) {
                sendJson(res, {
                  status: 200,
                  headers: {},
                  body: { ok: false, code: e?.code ?? 'JOG_FAILED', error: e instanceof Error ? e.message : String(e) },
                });
              }
            },
          }),
        'ursim-twin: jog route',
      );

      ctx.logger?.info?.(
        `universal-robots: 已挂载数字仿真路由 ${TWIN_STATE_PATH}、${TWIN_ASSET_PATH}、${TWIN_MODELS_PATH} 与 ${TWIN_STREAM_PATH}` +
          `（只读遥测预算 ${TWIN_READ_TIMEOUT_MS}ms，超时不杀 worker）` +
          `，离线仿真开关 ${TWIN_SIM_PATH}（启停/换型号）与面板控制 ${TWIN_JOG_PATH}（点动/位姿/关节/调速，**只对仿真生效**）`,
      );
    });
  } else {
    ctx.logger?.warn?.('universal-robots: ctx.inject 不可用，未挂载数字仿真路由');
  }
}

