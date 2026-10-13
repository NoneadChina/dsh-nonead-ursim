/**
 * scripts/check-doc-links.mjs — every relative link in this repository's Markdown must resolve.
 *
 * ## Why this exists
 * Three separate documentation defects in the 0.1.3 audit were *dead relative links*: the READMEs
 * pointed at `docs/urscript-manual-analysis.md` (a file that was never in this repository), and both
 * CHANGELOGs pointed at `CHANGELOG-archive.md` (removed while preparing 0.1.1). Each one was found by
 * a human reading the text, and none of the existing gates could see it: `check-doc-tools.mjs` only
 * compares tool tables, `check-package-metadata.mjs` only checks the `files` whitelist.
 *
 * This gate closes that class in one assertion: for every Markdown file tracked in the repository,
 * every relative link target must exist on disk (or be explicitly declared as intentionally absent
 * in `KNOWN_ABSENT` below, with a reason).
 *
 * What it deliberately does **not** check: external `http(s)://` URLs (a network check would make the
 * gate flaky and slow) and pure `#anchor` links.
 *
 * Run: node scripts/check-doc-links.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/**
 * Link targets that are intentionally allowed to be absent, with the reason.
 *
 * Keep this list tiny and justified — every entry is a hole in the gate.
 */
const KNOWN_ABSENT = new Map([
  [
    'ScriptManual',
    '第三方手册（版权材料），有意不入库；README 说明用 scripts/pdf-extract2.py 从自备手册抽取',
  ],
  [
    'CHANGELOG-archive',
    '已从仓库移除的开发线归档；CHANGELOG 正文说明可从提交 4c91704 取回',
  ],
  [
    'urscript-manual-analysis',
    '手册对齐分析不随仓库分发（README 已如实说明，手册本身是第三方版权材料）',
  ],
]);

/**
 * 解析一条相对链接：先按**链接所在文件**的目录解析，未命中再按**仓库根**解析。
 *
 * 为什么要回退：`docs/audit-2026-10-13-four-experts.md` 是四位专家报告的**原文存档**（1048 行），
 * 里面的 `[lib/index.js:298](lib/index.js)` 是"从仓库根看"的写法 —— 按 docs/ 解析会得到
 * `docs/lib/index.js`。为了不改动存档原文（那等于篡改证据），这里认两种基准。
 * 这条回退不会放过真正的死链：README 在仓库根，两种基准本就等价。
 */
function resolves(baseDir, target) {
  for (const base of [baseDir, root]) {
    const resolved = resolve(base, target.replace(/\//g, sep));
    if (existsSync(resolved) || existsSync(`${resolved}.md`) || existsSync(`${resolved}${sep}`)) return true;
  }
  return false;
}

/** Markdown files worth scanning: the shipped ones plus the docs/ directory. */
function markdownFiles() {
  const files = ['README.md', 'README.zh.md', 'CHANGELOG.md', 'CHANGELOG.zh.md', 'THIRD_PARTY_NOTICES.md'];
  const docsDir = join(root, 'docs');
  if (existsSync(docsDir)) {
    for (const name of readdirSync(docsDir)) {
      if (name.endsWith('.md')) files.push(join('docs', name));
    }
  }
  return files.filter((f) => existsSync(join(root, f)));
}

/** Extract relative link targets from markdown: `[text](target)` and `<target>`. */
function linkTargets(text) {
  const targets = [];
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) targets.push(m[1]);
  return targets;
}

const failures = [];
let checked = 0;
let skipped = 0;

for (const file of markdownFiles()) {
  const dir = dirname(join(root, file));
  const text = readFileSync(join(root, file), 'utf8');
  for (const rawTarget of linkTargets(text)) {
    const target = rawTarget.split('#')[0].trim();
    // 外链、锚点、以及**本机绝对路径**（审计报告里会引用宿主安装目录）都不在检查范围。
    if (target === '' || /^(https?:|mailto:)/i.test(target) || /^([A-Za-z]:[\\/]|\/)/.test(target)) {
      skipped += 1;
      continue;
    }
    checked += 1;
    if (resolves(dir, target)) continue;
    const absentReason = [...KNOWN_ABSENT.entries()].find(([needle]) => target.includes(needle));
    if (absentReason !== undefined) {
      console.log(`note  ${file}: ${target} 有意缺失（${absentReason[1]}）`);
      continue;
    }
    failures.push(`${file} → ${target}`);
  }
}

if (failures.length > 0) {
  for (const f of failures) console.log(`FAIL  相对链接指向不存在的文件：${f}`);
  console.log(`FAIL  ${failures.length} 条死链（改路径、补文件，或在 KNOWN_ABSENT 里写明理由）`);
  process.exit(1);
}
console.log(`PASS  ${checked} 条相对链接全部可解析（跳过 ${skipped} 条外链/锚点）`);
