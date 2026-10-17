/**
 * scripts/check-doc-tools.mjs — keep the READMEs' tool tables honest.
 *
 * ## What this catches, and what the earlier version missed
 * The tool *count* is gated in two other places, but a count is not a list: a table can say
 * "83 tools" while naming 80 of them, or name a tool that no longer exists. The first version of
 * this check scanned the whole README for `` `ursim_*` `` identifiers — which meant **prose counted
 * as documentation**. Deleting an entire table row still passed, because the tool was usually
 * mentioned somewhere else in the file (verified by mutation in the verification audit).
 *
 * Now the tool names are read from **table rows only** (`|`-delimited lines), and they must match
 * what `lib/index.js` registers:
 *   - every registered tool must appear in a table row, in both READMEs
 *   - no table may name a tool that is not registered (a stale row is worse than a missing one)
 *   - the stated total must equal the number of registered tools
 *   - the registry itself must have no duplicate names
 *
 * Names mentioned in prose are reported as a note, never as a failure — the READMEs legitimately
 * mention names that are not in the registry, such as the deliberately-absent `ursim_get_joint_current`.
 *
 * Run: node scripts/check-doc-tools.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const indexSource = readFileSync(`${root}lib/tool-defs.js`, 'utf8');

/** Tool names as registered by lib/index.js. */
const registered = [...indexSource.matchAll(/toolName:\s*'(ursim_[a-z0-9_]+)'/g)].map((m) => m[1]);
const registeredSet = new Set(registered);

/** Tool names that appear inside a markdown table row. */
function tableNames(file) {
  const text = readFileSync(`${root}${file}`, 'utf8');
  const names = new Set();
  for (const line of text.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue;
    for (const m of line.matchAll(/`(ursim_[a-z0-9_]+)`/g)) names.add(m[1]);
  }
  return names;
}

/** Tool names anywhere in the file (prose included) — informational only. */
function allNames(file) {
  const text = readFileSync(`${root}${file}`, 'utf8');
  return new Set([...text.matchAll(/`(ursim_[a-z0-9_]+)`/g)].map((m) => m[1]));
}

let failed = false;
const fail = (message) => {
  failed = true;
  console.log(`FAIL  ${message}`);
};
const pass = (message) => console.log(`PASS  ${message}`);

if (registered.length !== registeredSet.size) {
  fail(`lib/index.js 里有重复的工具名：${registered.filter((n, i) => registered.indexOf(n) !== i).join(', ')}`);
} else {
  pass(`lib/index.js 注册了 ${registered.length} 个唯一工具名`);
}

for (const file of ['README.md', 'README.zh.md']) {
  const inTable = tableNames(file);
  const missing = registered.filter((name) => !inTable.has(name));
  const stale = [...inTable].filter((name) => !registeredSet.has(name));

  if (missing.length > 0) {
    fail(`${file} 的**表格**里缺少 ${missing.length} 个已注册工具：${missing.join(', ')}`);
  } else {
    pass(`${file} 的表格列出了全部 ${registered.length} 个工具`);
  }
  if (stale.length > 0) {
    fail(`${file} 的表格里有 ${stale.length} 个未注册的工具名（陈旧行）：${stale.join(', ')}`);
  }

  const proseOnly = [...allNames(file)].filter((name) => !registeredSet.has(name));
  if (proseOnly.length > 0) {
    console.log(`note  ${file} 正文提到 ${proseOnly.length} 个未注册的 ursim_* 名字（允许，仅提示）：${proseOnly.join(', ')}`);
  }
}

/* ------------------------------------------------------------------ *
 * 受门禁 op 清单：README 是 `APPROVAL_OPS` 与 tool-matrix 之外的**第三份**手写副本
 * ------------------------------------------------------------------ *
 *
 * P1 #5：两份 README 的 🛡️ 段曾各自手写一份受门禁清单 —— 都漏了 7 个 H-1 op
 * （`set_tcp` / `set_tool_output_mode` / `set_tool_voltage` / `tool_communication` /
 * `set_digital_out` / `set_analog_out` / `set_conveyor_tick`），还把 `ursim_draw_*` 写成了
 * 旧前缀 `ur_draw_*`。所有既有门禁都是绿的：`check-approval-gate.py` 只看代码，
 * `tool-matrix.mjs` 只看声明表，而两份 README 的这段清单没有任何人核对。
 *
 * 现在把这份副本也变成受门禁的事实：从 `lib/index.js` 的 `APPROVAL_OPS` 解析 op 集合、
 * 用 `lib/tool-defs.js` 的 `op → toolName` 映射换成工具名，再与两份 README 的 🛡️ 段
 * **双向比对** —— README 漏列的、多列的、以及前缀写错的都 FAIL。解析支持逐个列全与
 * `ursim_move_x|y|z` 这类同前缀简写（README 现在已经逐个列全，简写支持只是防止回退）。
 */
const toolByOp = new Map(
  [...indexSource.matchAll(/\{\s*op:\s*'([a-z_0-9]+)',\s*\n\s*toolName:\s*'(ursim_[a-zA-Z_0-9]+)'/g)]
    .map((match) => [match[1], match[2]]),
);
const indexJsSource = readFileSync(`${root}lib/index.js`, 'utf8');
const approvalBlock = /const APPROVAL_OPS = new Set\(\[(.*?)\]\);/s.exec(indexJsSource)?.[1] ?? '';
const approvalOps = [...approvalBlock.matchAll(/'([a-z_0-9]+)'/g)].map((match) => match[1]);
const gatedNames = new Set();
const unmappedOps = [];
for (const op of approvalOps) {
  const toolName = toolByOp.get(op);
  if (toolName === undefined) unmappedOps.push(op);
  else gatedNames.add(toolName);
}

if (approvalOps.length === 0) {
  fail('从 lib/index.js 的 APPROVAL_OPS 解析出 0 个 op —— 解析规则与源码格式脱节了');
} else if (unmappedOps.length > 0) {
  fail(`APPROVAL_OPS 里有 ${unmappedOps.length} 个 op 找不到对应工具名（无法与 README 对账）：${unmappedOps.join(', ')}`);
} else {
  pass(`APPROVAL_OPS 的 ${approvalOps.length} 个受门禁 op 都映射到了工具名`);
}

/**
 * 解析一份 README 的 🛡️ 受门禁清单，返回 `{ names, badTokens, error }`。
 *
 * - `` `ursim_movej` ``：逐个列全；
 * - `` `ursim_move_x|y|z` ``：同前缀简写，展开成 `ursim_move_x` / `ursim_move_y` / `ursim_move_z`；
 * - `` `ursim_draw_*` ``：通配前缀，按 `APPROVAL_OPS` 的已知工具名展开；
 * - `` `ur_draw_*` `` 这类"看着像工具名、前缀却不是 ursim_"的记号记为 `badTokens`（前缀写错）。
 *
 * 只扫描**那一行**（以 `> 🛡️` 开头），而不是全文——否则正文里随便提到一个名字就能让清单
 * 看起来是完整的（这正是第一版 check 的缺陷）。
 */
function gatedNamesInReadme(file) {
  const lines = readFileSync(`${root}${file}`, 'utf8')
    .split('\n')
    .filter((line) => /^>\s*🛡️/.test(line));
  if (lines.length !== 1) {
    return { names: new Set(), badTokens: [], error: `期望恰好一行以 "> 🛡️" 开头的受门禁说明，实际 ${lines.length} 行` };
  }
  const names = new Set();
  const badTokens = [];
  for (const match of lines[0].matchAll(/`([^`\n]+)`/g)) {
    const token = match[1].trim();
    if (/^ursim_[a-z0-9_]+$/.test(token)) {
      names.add(token);
      continue;
    }
    // 同前缀简写：`ursim_move_x|y|z`（也容忍后半段写全名）。
    if (/^ursim_[a-z0-9_]+(?:\|[a-z0-9_]+)+$/.test(token)) {
      const parts = token.split('|');
      const prefix = parts[0].slice(0, parts[0].lastIndexOf('_') + 1);
      names.add(parts[0]);
      for (const suffix of parts.slice(1)) {
        names.add(/^ursim_/.test(suffix) ? suffix : prefix + suffix);
      }
      continue;
    }
    // 通配前缀：`ursim_draw_*`。
    if (/^ursim_[a-z0-9_]*\*$/.test(token)) {
      const prefix = token.slice(0, -1);
      const expanded = [...gatedNames].filter((name) => name.startsWith(prefix));
      if (expanded.length === 0) badTokens.push(token);
      for (const name of expanded) names.add(name);
      continue;
    }
    // 前缀写错：`ur_draw_*`、`ur_move_x|y|z`、`ur_movej` 之类。
    if (/^ur[a-z0-9_]*(\*|\|)/.test(token) || /^ur_[a-z0-9_]+$/.test(token)) {
      badTokens.push(token);
      continue;
    }
    // 其余以 ursim_ 开头但不符合任何已知形态的记号，同样算无法识别。
    if (/^ursim_/.test(token)) badTokens.push(token);
  }
  return { names, badTokens, error: null };
}

for (const file of ['README.md', 'README.zh.md']) {
  const { names, badTokens, error } = gatedNamesInReadme(file);
  if (error !== null) {
    fail(`${file} 的受门禁清单：${error}`);
    continue;
  }
  if (badTokens.length > 0) {
    fail(`${file} 的受门禁清单里有 ${badTokens.length} 个无法识别 / 前缀写错的工具名：${badTokens.join(', ')}`);
  }
  if (names.size === 0) {
    fail(`${file} 的受门禁清单解析出 0 个工具名（防静默失效：解析规则或段落结构变了）`);
    continue;
  }
  const missing = [...gatedNames].filter((name) => !names.has(name));
  const extra = [...names].filter((name) => !gatedNames.has(name));
  if (missing.length > 0) {
    fail(`${file} 的受门禁清单漏列 ${missing.length} 个 APPROVAL_OPS 里的工具：${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    fail(`${file} 的受门禁清单多列 ${extra.length} 个不在 APPROVAL_OPS 里的工具：${extra.join(', ')}`);
  }
  if (missing.length === 0 && extra.length === 0) {
    pass(`${file} 的受门禁清单与 APPROVAL_OPS 双向一致（${names.size} 个工具）`);
  }
}

/**
 * The stated count must match the registry (the two READMEs phrase it differently).
 */
for (const [file, pattern] of [
  ['README.md', /\*\*(\d+)\*\* tools \(`ursim_\*`\) in total/],
  ['README.zh.md', /共 \*\*(\d+)\*\* 个工具/],
]) {
  const text = readFileSync(`${root}${file}`, 'utf8');
  const match = pattern.exec(text);
  if (!match) {
    fail(`${file} 里找不到工具总数那一句（正则失配？）`);
  } else if (Number(match[1]) !== registered.length) {
    fail(`${file} 声称 ${match[1]} 个工具，实际注册 ${registered.length} 个`);
  } else {
    pass(`${file} 的总数与实际一致（${registered.length}）`);
  }
}

process.exit(failed ? 1 : 0);
