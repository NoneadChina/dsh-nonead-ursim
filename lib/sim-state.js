/**
 * 仿真态的**落盘**（0.1.10，路线图 E2）。
 *
 * ## 为什么需要它
 *
 * `SIMS` 活在 Python 子进程的内存里；宿主为此记住了"应该有一台什么样的虚拟机器人"，并在子进程
 * 被替换时按记忆重建（`lib/index.js` 的自愈）。但**宿主自己也会重启**（DSH 重开、插件重载）：
 * 那份记忆是宿主进程内存，重启即失，自愈便无从谈起 —— 表现为"上次明明开着仿真，重启后一切
 * 从头开始，而且没有任何说明"。
 *
 * 这里把那份记忆写到磁盘，让"仿真态"跨宿主重启存活。
 *
 * ## 三条纪律
 *
 * 1. **用户明确关掉就不复活**：落盘的是**意图**（`enabled`），不是"最后看到的画面"。`false`
 *    与"文件不存在"都表示"不要恢复"。
 * 2. **落盘失败绝不影响仿真**：磁盘满、目录只读、JSON 坏了 —— 全部降级成"没有记忆"，
 *    只写一条日志。仿真本身照常工作。
 * 3. **写是原子的**：先写同目录的 `.tmp` 再 `rename` —— 半截文件比没有文件更危险（读回来是
 *    一台"型号为空"的虚拟机器人）。
 *
 * 文件位置：显式配置 `simStateFile` > `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`
 * （`DSH_HOME` 缺省 `~/.dsh`）。
 */

import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';

/** 落盘格式版本：形状变了就抬它，旧文件按"读不懂"处理（宁可不恢复，也不猜）。 */
export const SIM_STATE_VERSION = 1;

/** 本插件的落盘目录名（DSH 数据目录下按插件分家，互不打扰）。 */
export const SIM_STATE_DIR_NAME = 'dsh-nonead-ursim';

/** DSH 数据目录：`DSH_HOME` > `~/.dsh`（与宿主其它数据同处）。 */
export function dshHome(env = process.env) {
  const fromEnv = typeof env?.DSH_HOME === 'string' ? env.DSH_HOME.trim() : '';
  return fromEnv !== '' ? fromEnv : join(homedir(), '.dsh');
}

/** 仿真态文件路径：显式 `file` 优先，否则按 DSH 数据目录约定拼。 */
export function simStatePath({ file = '', env = process.env } = {}) {
  const explicit = typeof file === 'string' ? file.trim() : '';
  if (explicit !== '') return explicit;
  return join(dshHome(env), 'plugin-data', SIM_STATE_DIR_NAME, 'sim-state.json');
}

/**
 * 读回仿真态。
 *
 * 任何异常/形状不对一律返回 `null`（= 没有可恢复的记忆）—— 这个文件是**加分项**，它坏了不能让
 * 插件启动失败。`enabled !== true` 也返回 `null`：只有"上次确实开着"才谈得上恢复。
 *
 * @returns {{model: string, preset?: string, speed_scaling?: number, at?: number}|null}
 */
export function readSimState(file, { logger = null } = {}) {
  if (typeof file !== 'string' || file === '') return null;
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    // 文件不存在是**常态**（从没开过仿真），不吵；其它读取错误值得记一笔。
    if (e?.code !== 'ENOENT') logger?.warn?.(`universal-robots: 读仿真态失败（忽略）：${e?.message ?? e}`);
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger?.warn?.('universal-robots: 仿真态文件不是合法 JSON（忽略，按没有记忆处理）');
    return null;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (parsed.version !== SIM_STATE_VERSION) {
    logger?.warn?.(`universal-robots: 仿真态文件版本 ${String(parsed.version)} 不认识（忽略）`);
    return null;
  }
  if (parsed.enabled !== true) return null;
  const model = typeof parsed.model === 'string' ? parsed.model.trim() : '';
  if (model === '') return null;
  const cfg = { model };
  if (typeof parsed.preset === 'string' && parsed.preset !== '') cfg.preset = parsed.preset;
  if (Number.isFinite(parsed.speed_scaling)) cfg.speed_scaling = parsed.speed_scaling;
  /*
   * `at` **不进**返回值：它是落盘元数据（给人看的"上次是何时"），而返回值会被原样当作
   * `sim_start` 的参数用（`rebuild()` 里 `{...cfg}`）—— 多带一个键就是把内部细节送上线路。
   */
  return cfg;
}

/**
 * 写入仿真态（原子）。返回是否成功 —— 调用方**不需要**因此改变行为，只记日志。
 *
 * @param {string} file
 * @param {{enabled: boolean, model?: string, preset?: string, speed_scaling?: number, at?: number}} state
 */
export function writeSimState(file, state, { logger = null, now = Date.now } = {}) {
  if (typeof file !== 'string' || file === '') return false;
  const payload = {
    version: SIM_STATE_VERSION,
    enabled: state?.enabled === true,
    at: Number.isFinite(state?.at) ? state.at : now(),
  };
  if (payload.enabled) {
    const model = typeof state?.model === 'string' ? state.model.trim() : '';
    // fail-closed：要落盘"开着"就必须有型号，否则读回来是一台空型号的机器人。
    if (model === '') return false;
    payload.model = model;
    if (typeof state?.preset === 'string' && state.preset !== '') payload.preset = state.preset;
    if (Number.isFinite(state?.speed_scaling)) payload.speed_scaling = state.speed_scaling;
  }
  const tmp = `${file}.tmp`;
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    renameSync(tmp, file);
    return true;
  } catch (e) {
    logger?.warn?.(`universal-robots: 写仿真态失败（不影响仿真）：${e?.message ?? e}`);
    try {
      rmSync(tmp, { force: true });
    } catch {
      /* 清理失败无所谓：下次写会覆盖同一个 tmp */
    }
    return false;
  }
}
