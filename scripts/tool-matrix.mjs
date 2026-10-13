/**
 * scripts/tool-matrix.mjs — every op's *classification* becomes an explicit declaration.
 *
 * ## Why this exists
 * Most of the tool registry is already gated: `check-worker-ops.py` proves tools ↔ `HANDLERS`
 * parity, `check-doc-tools.mjs` proves tools ↔ both README tables, `check-tool-params.py` proves
 * schema ↔ what Python actually reads, and `check-approval-gate.py` proves the gated set is real
 * and contains the ops that must never be ungated.
 *
 * What none of them prove is **which bucket a *new* op lands in**. Two classification decisions
 * are made by whoever adds the op, and until this file existed nothing forced them to be *stated*:
 *
 *   1. **Is it gated?** — this is how the H-1 defect happened: seven ops with physical side
 *      effects (`set_tcp`, `set_tool_output_mode`, `set_digital_out`, …) sat outside
 *      `APPROVAL_OPS` while every gate stayed green, because "not gated" was a silent default.
 *   2. **What does the simulation do with it?** — `SIM_OPS` / `SIM_PASSTHROUGH_OPS` decide whether
 *      an op is simulated, passed through, or refused with `SIM_UNSUPPORTED`. A new op silently
 *      becomes "refused" and nobody is told whether that was intended.
 *
 * So `docs/tool-matrix.json` is the declaration table, and this script is the gate that keeps it
 * honest: every op reachable from a tool must be declared, and each declaration must match what
 * the code actually does (`APPROVAL_OPS`, `SIM_OPS`, `SIM_PASSTHROUGH_OPS`).
 *
 * It is *review friction*, not a safety net: the declaration is generated from the code on
 * bootstrap, so it can never contradict it at birth. Its value is that a new op shows up in the
 * diff as an explicit `gated: false` / `sim: "unsupported"` line somebody had to look at.
 *
 * Usage:
 *   node scripts/tool-matrix.mjs           # verify (exit 1 on any mismatch)
 *   node scripts/tool-matrix.mjs --write   # regenerate docs/tool-matrix.{json,md} from the code
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const INDEX = `${root}lib/index.js`;
/** 工具声明面（0.1.3 起独立成模块；APPROVAL_OPS 仍留在 `lib/index.js`）。 */
const DEFS = `${root}lib/tool-defs.js`;
const WORKER = `${root}python/ur_worker.py`;
const DECLARATIONS = `${root}docs/tool-matrix.json`;
const DOC = `${root}docs/tool-matrix.md`;

/** Simulation buckets, as `route_op`/`sim_dispatch` see them. */
const SIM_SIMULATED = 'simulated'; // in SIM_OPS
const SIM_PASSTHROUGH = 'passthrough'; // in SIM_PASSTHROUGH_OPS
const SIM_UNSUPPORTED = 'unsupported'; // neither ⇒ refused with SIM_UNSUPPORTED

/** Read the code's actual state — this is the ground truth the declarations are checked against. */
function readSources() {
  const index = readFileSync(INDEX, 'utf8');
  const defs = readFileSync(DEFS, 'utf8');
  const worker = readFileSync(WORKER, 'utf8');

  const tools = [...defs.matchAll(/\{\s*op:\s*'([a-z_0-9]+)',\s*\n\s*toolName:\s*'(ursim_[a-zA-Z_0-9]+)'/g)]
    .map((m) => ({ op: m[1], toolName: m[2] }));

  const approvalBlock = /const APPROVAL_OPS = new Set\(\[(.*?)\]\);/s.exec(index)?.[1] ?? '';
  const gated = new Set([...approvalBlock.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]));

  // HANDLERS: `"op": op_fn,` — same shape check-worker-ops.py relies on (ast there, regex here).
  const handlersBlock = /^HANDLERS = \{(.*?)^\}/ms.exec(worker)?.[1] ?? '';
  const handlers = new Set([...handlersBlock.matchAll(/"([a-z_0-9]+)":\s*op_/g)].map((m) => m[1]));

  const simOpsBlock = /^SIM_OPS = \{(.*?)^\}/ms.exec(worker)?.[1] ?? '';
  const simulated = new Set([...simOpsBlock.matchAll(/"([a-z_0-9]+)":/g)].map((m) => m[1]));

  const passBlock = /SIM_PASSTHROUGH_OPS = frozenset\(\{([\s\S]*?)\}\)/m.exec(worker)?.[1] ?? '';
  const passthrough = new Set([...passBlock.matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]));

  return { tools, gated, handlers, simulated, passthrough };
}

/** Which simulation bucket is this op in? */
function simBucket(op, src) {
  if (src.simulated.has(op)) return SIM_SIMULATED;
  if (src.passthrough.has(op)) return SIM_PASSTHROUGH;
  return SIM_UNSUPPORTED;
}

/** The observed matrix: one entry per op reachable from a tool. */
function observe(src) {
  const out = new Map();
  for (const { op, toolName } of src.tools) {
    out.set(op, { op, toolName, gated: src.gated.has(op), sim: simBucket(op, src) });
  }
  return out;
}

function readDeclarations() {
  try {
    const parsed = JSON.parse(readFileSync(DECLARATIONS, 'utf8'));
    return parsed?.ops ?? null;
  } catch {
    return null;
  }
}

function renderDoc(observed, declared) {
  const rows = [...observed.values()].sort((a, b) => a.op.localeCompare(b.op));
  const count = (predicate) => rows.filter(predicate).length;
  const lines = [
    '# op 分类矩阵（生成物，请勿手改）',
    '',
    '> 由 `node scripts/tool-matrix.mjs --write` 生成，由 `node scripts/tool-matrix.mjs` 校验。',
    '> 声明表是 [`docs/tool-matrix.json`](./tool-matrix.json)：新增一个 op 必须在那里显式声明它',
    '> **是否受人工审批门禁**、**仿真会怎么处理它** —— 这两件事以前是"沉默的默认值"，',
    '> H-1（七个带物理副作用的 op 免审批）就是这样溜过去的。',
    '',
    `共 **${rows.length}** 个 op：受门禁 **${count((r) => r.gated)}**、仿真实现 **${count((r) => r.sim === SIM_SIMULATED)}**、` +
      `仿真透传 **${count((r) => r.sim === SIM_PASSTHROUGH)}**、仿真明确不支持 **${count((r) => r.sim === SIM_UNSUPPORTED)}**。`,
    '',
    '| op | 工具 | 审批门禁 | 仿真 | 声明理由 |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    const why = declared?.[row.op]?.why ?? '';
    lines.push(
      `| \`${row.op}\` | \`${row.toolName}\` | ${row.gated ? '**是**' : '否'} | ${row.sim} | ${why} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function write() {
  const src = readSources();
  const observed = observe(src);
  const previous = readDeclarations() ?? {};
  const ops = {};
  // 保留既有的 `why`（人工写下的理由），其余从代码观察值生成。
  for (const [op, row] of [...observed.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const why = previous[op]?.why;
    ops[op] = why === undefined ? { gated: row.gated, sim: row.sim } : { gated: row.gated, sim: row.sim, why };
  }
  const json = {
    _readme:
      'op 分类的唯一声明表。gated=是否受人工审批门禁；sim=simulated|passthrough|unsupported。' +
      'why 只在"看不出来为什么"时写。改代码后跑 node scripts/tool-matrix.mjs --write 重新生成，再跑不带参数校验。',
    ops,
  };
  writeFileSync(DECLARATIONS, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  writeFileSync(DOC, renderDoc(observed, ops), 'utf8');
  console.log(`wrote ${DECLARATIONS} and ${DOC} (${observed.size} ops)`);
}

function verify() {
  const src = readSources();
  const observed = observe(src);
  const declared = readDeclarations();
  const failures = [];
  const notes = [];

  if (declared === null) {
    console.log(`FAIL  读不到声明表 ${DECLARATIONS}（先跑 node scripts/tool-matrix.mjs --write）`);
    process.exit(1);
  }

  // ① 每个 op 都必须被显式声明：新增工具时这一条会红，直到有人写下它归哪个桶。
  const undeclared = [...observed.keys()].filter((op) => declared[op] === undefined);
  if (undeclared.length > 0) {
    failures.push(
      `有 ${undeclared.length} 个 op 没有声明（新增 op 必须显式声明 gated 与 sim）：${undeclared.join(', ')}`,
    );
  }
  // ② 陈旧的声明
  const stale = Object.keys(declared).filter((op) => !observed.has(op));
  if (stale.length > 0) failures.push(`声明表里有 ${stale.length} 个已不存在的 op：${stale.join(', ')}`);

  // ③ 声明的 gated 必须与 APPROVAL_OPS 完全一致（两个方向都要报）
  const gatedMismatch = [];
  for (const [op, row] of observed) {
    const want = declared[op]?.gated;
    if (want === undefined) continue;
    const actual = src.gated.has(op);
    if (want !== actual) {
      gatedMismatch.push(`${op}(声明 ${want} / 实际 ${actual})`);
    }
  }
  if (gatedMismatch.length > 0) {
    failures.push(
      `审批门禁归属不一致（声明 vs lib/index.js 的 APPROVAL_OPS）：${gatedMismatch.join(', ')}`,
    );
  }
  // APPROVAL_OPS 里的 op 若不是任何工具能触达的，也要报（check-approval-gate 只管拼写是否存在）
  const gatedUnreachable = [...src.gated].filter((op) => !observed.has(op));
  if (gatedUnreachable.length > 0) {
    failures.push(`APPROVAL_OPS 里有没被任何工具触达的 op：${gatedUnreachable.join(', ')}`);
  }

  // ④ 声明的 sim 桶必须与 python 侧一致
  const simMismatch = [];
  for (const [op, row] of observed) {
    const want = declared[op]?.sim;
    if (want === undefined) continue;
    if (want !== row.sim) simMismatch.push(`${op}(声明 ${want} / 实际 ${row.sim})`);
  }
  if (simMismatch.length > 0) {
    failures.push(`仿真归属不一致（声明 vs python 的 SIM_OPS/SIM_PASSTHROUGH_OPS）：${simMismatch.join(', ')}`);
  }

  // ⑤ 数据可从代码完整重建（既有的 86 工具契约仍成立）
  const rows = [...observed.values()];
  notes.push(
    `op ${rows.length} 个：受门禁 ${rows.filter((r) => r.gated).length}、` +
      `仿真实现 ${rows.filter((r) => r.sim === SIM_SIMULATED).length}、` +
      `仿真透传 ${rows.filter((r) => r.sim === SIM_PASSTHROUGH).length}、` +
      `仿真不支持 ${rows.filter((r) => r.sim === SIM_UNSUPPORTED).length}`,
  );

  for (const note of notes) console.log(`note  ${note}`);
  if (failures.length > 0) {
    for (const failure of failures) console.log(`FAIL  ${failure}`);
    process.exit(1);
  }
  console.log('PASS  每个 op 的审批门禁与仿真归属都与声明表一致');
}

const writeMode = process.argv.includes('--write');
if (writeMode) write();
else verify();
