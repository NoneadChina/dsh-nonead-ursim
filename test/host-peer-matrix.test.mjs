// test/host-peer-matrix.test.mjs
//
// 回归测试：peer 范围必须同时覆盖**历史上支持过的每一个宿主版本族**与**当前宿主版本族**。
//
// 背景（真实事故，同一形态出现过两次）：DSH 的预发布版本只被**三元组相同**的预发布区间放行。
// `^0.2.1-alpha.5` 覆盖不到 `0.2.2-alpha.3`，因为比较子里没有 `(0,2,2)` 这个三元组 ——
// 于是宿主一升级，`verify:host` 的 4 项 peer 断言全红，而工具注册（89/89）、路由（6 条）、
// 客户端 bundle 契约其实全是绿的。用户看到的是"插件不适配当前版本"，实际只是声明没跟上。
//
// 修法只能是逐族补一条比较子（semver 没有"接受任意预发布"的范围写法）。本测试把这件事钉死，
// 并保证**旧族不会被顺手删掉** —— "兼容之前的版本"必须是一条可执行的断言，不能只是一句描述：
//   1. lock 根条目的 peerDependencies 必须与 package.json 完全一致（只改一处会漏）；
//   2. 每个受支持版本族的 `^X.Y.Z` 比较子必须出现在范围里（等价于 semver 的预发布放行条件）；
//   3. 仓库里有 semver 时，逐个版本做真实 `satisfies`，把 2 的推理再验一遍。
//
// 新增宿主版本时：把版本加进 SUPPORTED_HOST_VERSIONS，并给 package.json **和**
// package-lock.json 的范围各补一条比较子，然后跑 `npm run verify:host` 对真宿主复核。
//
// 运行：node --test test/host-peer-matrix.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))

/**
 * 有实测证据的宿主版本族 —— 每一条都对应一次真实的 `verify:host` 或一次安装形态核对。
 * 不要把猜测的版本写进来：这里的意义是"我们确实支持过它"。
 */
const SUPPORTED_HOST_VERSIONS = {
  // 0.1.2-rc.1：仓库早期 devDependencies 里的宿主副本；0.1.7-rc.2：README 记录的 89/89 那台。
  // 0.2.0-rc.2：Beta 树实测（cordis 4.0.4 / schemastery 3.18.4）。
  // 0.2.1-alpha.5：Nonead DSH Desktop 2.1.6 实测（4.0.5-alpha.2 / 3.18.5-alpha.2）。
  // 0.2.1-rc.1 / 0.2.2-rc.1：dsh-better-sidebar 的兼容表记录的宿主族（0.2.1-rc.x 对应它的 0.28.2）。
  // 0.2.2-alpha.3：Nonead DSH Desktop 2.2.x 早期实测（4.0.6-alpha.2 / 3.18.6-alpha.2）。
  // 0.2.2-rc.2：Nonead DSH Desktop 2.2.11 实测（cordis 4.1.0 / schemastery 3.19.0）—— 当前宿主。
  // 0.3.0：尚未发布；这是用户要求的兼容窗口上界，范围用 `^0.3.0-0` 预留**整条** 0.3.x
  //        谱系（`^0.3.0` 会把 0.3.0-rc.1 这类预发布挡在外面）。
  '@deepseek-ai/dsh': [
    '0.1.2-rc.1',
    '0.1.7-rc.2',
    '0.2.0-rc.2',
    '0.2.1-alpha.5',
    '0.2.1-rc.1',
    '0.2.2-alpha.3',
    '0.2.2-rc.1',
    '0.2.2-rc.2',
    '0.3.0',
  ],
  '@deepseek-ai/dsh-tools': [
    '0.1.2-rc.1',
    '0.1.7-rc.2',
    '0.2.0-rc.2',
    '0.2.1-alpha.5',
    '0.2.1-rc.1',
    '0.2.2-alpha.3',
    '0.2.2-rc.1',
    '0.2.2-rc.2',
    '0.3.0',
  ],
  '@deepseek-ai/cordis': ['4.0.2', '4.0.4', '4.0.5-alpha.2', '4.0.6-alpha.2', '4.1.0'],
  '@deepseek-ai/schemastery': ['3.18.2', '3.18.4', '3.18.5-alpha.2', '3.18.6-alpha.2', '3.19.0'],
}

/** semver 是宿主侧的传递依赖，缺失时退回纯字符串断言（见测试 2）。 */
let semver
try {
  semver = createRequire(import.meta.url)('semver')
} catch {
  semver = undefined
}

/** 版本 → `major.minor.patch`（丢掉预发布与构建标记）。 */
const tupleOf = (version) => version.split('-')[0].split('+')[0]

/**
 * 范围里是否存在一个 `^` 比较子，且它的三元组与给定版本相同。
 *
 * 这只对**预发布**版本是必要条件：semver 规定预发布版本只能被三元组相同的预发布区间放行 ——
 * `satisfies('0.2.2-alpha.3', '^0.2.1-alpha.5')` 为 false，因为范围里的预发布比较子只有 (0,2,1)，
 * 补上 `^0.2.2-alpha.3` 才成立。普通版本（如 `4.0.4`）不受此限，落在 `^4.0.2` 区间内即可，
 * 所以它们由下面的 `satisfies` 用例负责。
 */
function hasTupleComparator(range, version) {
  const wanted = tupleOf(version)
  return range
    .split('||')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('^'))
    .some((comparator) => tupleOf(comparator.slice(1).trim()) === wanted)
}

test('package-lock.json 根条目的 peerDependencies 与 package.json 完全一致', () => {
  const lockPeers = lock.packages?.['']?.peerDependencies
  assert.ok(lockPeers, 'package-lock.json 的 packages[""] 里没有 peerDependencies')
  assert.deepEqual(
    lockPeers,
    manifest.peerDependencies,
    '只改了 package.json 或只改了 lock：两者必须逐条一致（CI 用 npm ci，lock 才是生效的那份）',
  )
})

// 每个包一条独立用例：失败时直接指出是哪个包缺了哪个族。
// 只对预发布族做「三元组比较子」断言 —— 这是不依赖 semver 也能成立的硬条件。
for (const [name, versions] of Object.entries(SUPPORTED_HOST_VERSIONS)) {
  test(`${name} 的 peer 范围覆盖全部受支持的预发布版本族`, () => {
    const range = manifest.peerDependencies?.[name]
    assert.ok(range, `package.json 未声明 ${name} 的 peer 范围`)
    const prereleases = versions.filter((version) => version.includes('-'))
    for (const version of prereleases) {
      assert.ok(
        hasTupleComparator(range, version),
        `缺少覆盖 ${version} 的比较子（应补 ^${tupleOf(version)}…）：${range}`,
      )
    }
  })
}

test('semver 可用时对每个受支持宿主版本做真实 satisfies', (t) => {
  if (semver === undefined) {
    // 不静默通过：明确说明这一层没跑，且上面的比较子断言已经覆盖了预发布放行条件。
    t.diagnostic('仓库里没有 semver，跳过真实求值（比较子断言已覆盖同一条件）')
    return
  }
  for (const [name, versions] of Object.entries(SUPPORTED_HOST_VERSIONS)) {
    const range = manifest.peerDependencies[name]
    for (const version of versions) {
      assert.equal(
        semver.satisfies(version, range),
        true,
        `${name}@${version} 不满足声明的范围：${range}`,
      )
    }
  }
})
