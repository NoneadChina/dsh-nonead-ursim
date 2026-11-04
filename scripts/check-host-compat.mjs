#!/usr/bin/env node
/**
 * scripts/check-host-compat.mjs — 针对**已安装的宿主**校验本插件能否工作。
 *
 * 背景：本插件对宿主有两类硬依赖——工具参数 schema 必须落在宿主的 value-schema DSL 词表内，
 * 客户端半必须满足 `dsh.client` + `window.__ModuleLoader__` 的装载契约。两者出问题时的表现都是
 * 「静默少功能」而不是启动失败（v0.3.9 那 16 个工具就是这样消失的），所以放进一条命令里显式检查。
 *
 * 校验项：
 *   1. peer 范围：用宿主自带的 semver 比对 package.json 的 peerDependencies 与宿主实装版本；
 *   2. 工具 schema：用宿主**真实**的 @deepseek-ai/dsh-tools 编译全部工具参数 schema，并数出注册数；
 *   3. 仿真只读路由：驱动 `ctx.inject(['webServer'], …)`，确认六条路由的注册形状；
 *   4. dsh.client 声明与客户端 bundle：类型契约、`exports["./client"]` 可解析、bundle 以包名注册。
 *
 * 用法：
 *   node scripts/check-host-compat.mjs [hostNodeModules | app.asar]
 *   缺省依次尝试 $DSH_HOST_NODE_MODULES、常见安装根下**任意含 DSH 的目录**的
 *   `resources/app/node_modules` 或 `resources/app.asar`、扫盘找到的安装目录、
 *   ../dsh-plugin-desktop/node_modules，最后才自插件目录向上查找（此时标注为 dev 副本）。
 *
 * 打包宿主（`resources/app.asar`）普通 Node 读不到，本脚本会用宿主自己的可执行文件
 * 加 `ELECTRON_RUN_AS_NODE=1` 重跑自己 —— 也就是插件实际加载的运行时。
 *
 * 退出码：0 = 全部通过；1 = 存在失败；2 = 环境错误。
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire, registerHooks } from 'node:module'
import { basename, dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PLUGIN_ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const PEER_PACKAGES = [
  '@deepseek-ai/dsh',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/cordis',
  '@deepseek-ai/schemastery',
]
/** 工具表当前规模（当前的 87 个）；注册数少于它即为「静默丢工具」。 */
const EXPECTED_TOOLS = 89
/**
 * 仿真侧注册的 `kind:'exact'` 路由条数。
 *
 * 0.6.3 起是 4 条：state / asset / models / **stream**（第 20 条的 SSE 实时流）。
 * 0.7.0 增加第 5 条：**sim**（离线仿真开关 —— 第一条写路由，GET 读状态 / POST 启停）。
 * 0.3.0 增加第 6 条：**jog**（面板实时控制 —— 点动/位姿/关节/调速，只对仿真目标生效）。
 * 加路由时必须同步改这里 —— 这条断言的意义就是"注册形状变了要有人知道"，
 * 而不是"永远只能是 N 条"。
 */
const TWIN_ROUTE_COUNT = 6

const failures = []
const pass = (title, detail) => console.log(`PASS  ${title}${detail === undefined ? '' : ` — ${detail}`}`)
const fail = (title, detail) => {
  failures.push(`${title}${detail === undefined ? '' : `：${detail}`}`)
  console.log(`FAIL  ${title}${detail === undefined ? '' : ` — ${detail}`}`)
}
const note = (text) => console.log(`note  ${text}`)

/**
 * 定位宿主 node_modules（含 @deepseek-ai/dsh-tools 的那个）。
 *
 * 返回 `{ kind, nodeModules, asarPath?, devCopy? }`：
 *   - `kind: 'dir'`  —— 常规安装（`resources/app/node_modules`），普通 Node 直接可读；
 *   - `kind: 'asar'` —— 打包安装（`resources/app.asar`）。asar 是**文件**不是目录，
 *     普通 Node 的 `existsSync` / `readdirSync` / `import` 一律看不见里面的内容，
 *     只有 Electron 运行时（宿主 exe 加 `ELECTRON_RUN_AS_NODE=1`）能读 ⇒ 需要自举。
 *     当前宿主（Nonead DSH Desktop 2.x）就是这种形态，所以这不是可选项。
 */
function hasHost(dir) {
  return typeof dir === 'string' && dir !== ''
    && existsSync(join(dir, '@deepseek-ai', 'dsh-tools', 'package.json'))
}

/** 一个候选路径能不能当宿主：普通 node_modules 目录，或打包的 app.asar。 */
function classifyHost(candidate) {
  if (typeof candidate !== 'string' || candidate === '') return undefined
  const resolved = resolvePath(candidate)
  if (/\.asar$/i.test(resolved)) {
    return existsSync(resolved)
      ? { kind: 'asar', asarPath: resolved, nodeModules: join(resolved, 'node_modules') }
      : undefined
  }
  return hasHost(resolved) ? { kind: 'dir', nodeModules: resolved } : undefined
}

/** 一个安装目录（如 `D:\Software\Nonead DSH Desktop`）里的宿主，两种安装形态都试。 */
function classifyInstallDir(dir) {
  return classifyHost(join(dir, 'resources', 'app', 'node_modules'))
    ?? classifyHost(join(dir, 'resources', 'app.asar'))
}

/**
 * 扫盘找安装目录。
 *
 * `%ProgramFiles%` 之类的环境变量只覆盖一部分机器：本机就装在 `D:\Software\Nonead DSH Desktop`，
 * 既不在 Program Files 也不在 LocalAppData\Programs。于是旧版在这里必然落空、退到
 * 「插件目录向上查找」拿到仓库自带的**旧 dev 副本**，给出误导性的 peer 结论。
 * 这里逐盘看两级目录，命中「目录名含 dsh」的候选再按两种安装形态探测。
 */
function scanInstalledHosts() {
  const roots = process.platform === 'win32'
    ? 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => `${letter}:\\`)
    : ['/usr/share', '/usr/local', '/opt', '/Applications']
  for (const root of roots) {
    let firstLevel = []
    try {
      firstLevel = readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of firstLevel) {
      if (entry.isDirectory() !== true) continue
      const dir = join(root, entry.name)
      // 一级目录名本身含 dsh（例如 `Program Files\DSH Desktop`）
      if (/dsh/i.test(entry.name)) {
        const found = classifyInstallDir(dir)
        if (found !== undefined) return found
      }
      // 二级目录名含 dsh（例如 `D:\Software\Nonead DSH Desktop`）
      let secondLevel = []
      try {
        secondLevel = readdirSync(dir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const child of secondLevel) {
        if (child.isDirectory() !== true || /dsh/i.test(child.name) !== true) continue
        const found = classifyInstallDir(join(dir, child.name))
        if (found !== undefined) return found
      }
    }
  }
  return undefined
}

function findHost(argv) {
  const candidates = [
    argv[2],
    process.env.DSH_HOST_NODE_MODULES,
    // Windows 上 Program Files 不在 PATH 里，所以候选路径写死并逐个探测存在性。
    'C:\\Program Files\\DSH Desktop\\resources\\app\\node_modules',
    'C:\\Program Files\\DSH Desktop\\resources\\app.asar',
    'C:\\Program Files (x86)\\DSH Desktop\\resources\\app\\node_modules',
    'C:\\Program Files (x86)\\DSH Desktop\\resources\\app.asar',
  ]
  for (const candidate of candidates) {
    const found = classifyHost(candidate)
    if (found !== undefined) return found
  }

  /*
   * 这里原本写死 `C:\Program Files\DSH Desktop\...`，而本机实际目录是
   * `Nonead DSH Desktop` ⇒ 候选全部落空，`npm run verify:host` 直接报"请显式传路径"，
   * 于是这个"宿主 API 兼容性自审"实际上没人跑得起来 —— 一个静态检查工具**跑不起来**，
   * 比它查出问题更糟。
   */
  const installRoots = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    typeof process.env.LOCALAPPDATA === 'string' ? join(process.env.LOCALAPPDATA, 'Programs') : undefined,
    '/Applications',
  ].filter((value) => typeof value === 'string' && value !== '')
  for (const root of installRoots) {
    const found = classifyInstallDir(root)
    if (found !== undefined) return found
    let entries = []
    try {
      entries = readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isDirectory() !== true || /dsh/i.test(entry.name) !== true) continue
      const inRoot = classifyInstallDir(join(root, entry.name))
      if (inRoot !== undefined) return inRoot
    }
  }

  const scanned = scanInstalledHosts()
  if (scanned !== undefined) return scanned

  const desktopSibling = resolvePath(PLUGIN_ROOT, '..', 'dsh-plugin-desktop', 'node_modules')
  const sibling = classifyHost(desktopSibling)
  if (sibling !== undefined) return sibling

  /*
   * ⚠️ 必须排在所有真实宿主探测**之后**：本仓库自己的 node_modules 里带着**旧 dev 副本**的
   * @deepseek-ai/dsh-tools（`npm ci` 按 lock 装的是 0.2.0-rc.2），用它校验会得到误导性结论。
   * 命中时打上 `devCopy`，调用方据此明确告诉用户"这是代理校验，不是运行中宿主"。
   */
  let dir = PLUGIN_ROOT
  for (;;) {
    const candidate = join(dir, 'node_modules')
    const found = classifyHost(candidate)
    if (found !== undefined) return { ...found, devCopy: true }
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

/** 从 `<install>/resources/app.asar` 反推宿主可执行文件（自举用）。 */
function hostExecutableFor(asarPath) {
  const installRoot = dirname(dirname(asarPath))
  let entries = []
  try {
    entries = readdirSync(installRoot, { withFileTypes: true })
  } catch {
    return undefined
  }
  const files = entries.filter((entry) => entry.isFile()).map((entry) => join(installRoot, entry.name))
  const executables = files.filter((file) => /\.exe$/i.test(file))
  if (executables.length > 0) {
    // 优先与安装目录同名的 exe：`Nonead DSH Desktop\Nonead DSH Desktop.exe`
    const wanted = basename(installRoot).toLowerCase()
    const exact = executables.find((file) => basename(file).toLowerCase() === `${wanted}.exe`)
    return exact ?? executables[0]
  }
  if (process.platform !== 'win32') {
    for (const file of files) {
      try {
        if ((statSync(file).mode & 0o111) !== 0) return file
      } catch {
        continue
      }
    }
  }
  return undefined
}

function hostManifest(hostModules, name) {
  const path = join(hostModules, ...name.split('/'), 'package.json')
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
}

/** 解析宿主包的 ESM 入口，供加载钩子重定向本插件的裸导入。 */
function hostEntry(hostModules, specifier) {
  const [scope, name] = specifier.split('/')
  const packageDir = join(hostModules, scope, name)
  const manifestPath = join(packageDir, 'package.json')
  if (!existsSync(manifestPath)) return undefined
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entry = manifest.exports?.['.']
  const relative = typeof entry === 'string'
    ? entry
    : entry?.import ?? entry?.default ?? entry?.require ?? manifest.module ?? manifest.main
  return typeof relative === 'string' ? pathToFileURL(join(packageDir, relative)).href : undefined
}

const host = findHost(process.argv)
if (host === undefined) {
  console.error('找不到宿主；请显式传路径：node scripts/check-host-compat.mjs <host node_modules | app.asar>')
  process.exit(2)
}

/*
 * 打包安装（`resources/app.asar`）在普通 Node 下读不到内容：asar 是**文件**，
 * `existsSync` / `import` 一律看不见里面的模块。于是本脚本在打包宿主（本机就是）上
 * 只会"报错退出"—— 一条查不出来的检查，比没有更糟。这里用宿主自己的可执行文件
 * 重跑一遍自己（`ELECTRON_RUN_AS_NODE=1`），也就是插件**实际运行的那个运行时**。
 */
if (host.kind === 'asar' && process.versions.electron === undefined) {
  const manual = `set ELECTRON_RUN_AS_NODE=1 && "<安装目录>\\<宿主>.exe" "${fileURLToPath(import.meta.url)}" "${host.nodeModules}"`
  if (process.env.DSH_HOST_COMPAT_BOOTSTRAPPED === '1') {
    console.error(`宿主是打包形态（${host.asarPath}），但自举后仍不是 Electron 运行时。请手动执行：`)
    console.error(`  ${manual}`)
    process.exit(2)
  }
  const executable = hostExecutableFor(host.asarPath)
  if (executable === undefined) {
    console.error(`宿主是打包形态（${host.asarPath}），但没在安装目录里找到可执行文件。请手动执行：`)
    console.error(`  ${manual}`)
    process.exit(2)
  }
  console.log(`boot    用宿主运行时自举（app.asar 需要 Electron 的 fs）：${executable}`)
  const child = spawnSync(executable, [fileURLToPath(import.meta.url), host.nodeModules], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOST_COMPAT_BOOTSTRAPPED: '1' },
  })
  if (child.error !== undefined) {
    console.error(`自举失败：${child.error.message}`)
    process.exit(2)
  }
  process.exit(child.status ?? 2)
}

const hostModules = host.nodeModules
if (host.devCopy === true) {
  console.log('note    宿主来自插件目录内的 npm 产物（代理校验），**不代表正在运行的宿主**；装好后请重跑本检查')
}
console.log(`plugin  ${PLUGIN_ROOT}`)
console.log(`host    ${hostModules}`)
console.log('')

const manifest = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'package.json'), 'utf8'))
console.log(`plugin version ${manifest.version}`)
for (const name of PEER_PACKAGES) {
  const installed = hostManifest(hostModules, name)
  console.log(`  ${name.padEnd(30)} host ${installed?.version ?? '(未安装)'}  declared ${manifest.peerDependencies?.[name] ?? '(无)'}`)
}
console.log('')

// ── 1. peer 范围 ────────────────────────────────────────────────────────────
const requireBase = existsSync(join(hostModules, '..', 'package.json'))
  ? join(hostModules, '..', 'package.json')
  : join(hostModules, 'noop.cjs')
let semver
try {
  semver = createRequire(requireBase)('semver')
} catch {
  semver = undefined
}
if (semver === undefined) note('宿主未提供 semver，跳过 peer 范围求值（上面已打印版本对照）')
else {
  for (const name of PEER_PACKAGES) {
    const declared = manifest.peerDependencies?.[name]
    const installed = hostManifest(hostModules, name)?.version
    if (installed === undefined) { fail(`peer ${name}`, '宿主未安装该包'); continue }
    if (declared === undefined) { note(`${name} 未声明 peer，宿主 ${installed}`); continue }
    if (semver.satisfies(installed, declared)) pass(`peer ${name}`, `宿主 ${installed} 满足 ${declared}`)
    else fail(`peer ${name}`, `宿主 ${installed} 不满足 ${declared}（预发布范围只匹配自身版本三元组，需为该版本族补一条）`)
  }
}

// ── 2/3. 用宿主真实的编译器驱动插件 ────────────────────────────────────────
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@deepseek-ai/')) {
      const url = hostEntry(hostModules, specifier)
      if (url !== undefined) return { url, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

const registered = []
const mountedRoutes = []
const warnings = []
const infos = []
const effectErrors = []
const logger = {
  info: (message) => infos.push(String(message)),
  warn: (message) => warnings.push(String(message)),
  error: (message) => warnings.push(String(message)),
}
/** Cordis 的 ctx.effect 语义：立即执行回调，返回值作为 disposer。 */
const effect = (callback) => {
  try {
    const disposer = callback()
    return typeof disposer === 'function' ? disposer : () => {}
  } catch (cause) {
    effectErrors.push(cause instanceof Error ? cause.message : String(cause))
    return () => {}
  }
}

try {
  const plugin = await import(pathToFileURL(join(PLUGIN_ROOT, 'lib', 'index.js')).href)
  plugin.apply(
    {
      logger,
      effect,
      get: () => undefined,
      inject: (deps, callback) => {
        callback({
          logger,
          effect,
          webServer: {
            register: (route) => {
              mountedRoutes.push(route)
              return () => {}
            },
          },
        })
        return () => {}
      },
      tools: { register: (tool) => registered.push(tool) },
    },
    {},
  )
} catch (cause) {
  fail('驱动插件 apply()', cause instanceof Error ? cause.message : String(cause))
}

if (effectErrors.length > 0) fail('effect 回调执行', effectErrors.join('；'))

const registrationFailures = warnings.filter((line) => /注册 .* 失败/.test(line))
if (registered.length === EXPECTED_TOOLS && registrationFailures.length === 0) {
  pass('工具 schema 通过宿主真实 DSL', `${registered.length}/${EXPECTED_TOOLS} 个工具注册成功`)
} else {
  const reasons = registrationFailures.length === 0 ? '(无逐条告警)' : registrationFailures.slice(0, 5).join(' | ')
  fail('工具 schema 通过宿主真实 DSL', `仅 ${registered.length}/${EXPECTED_TOOLS} 注册成功；${reasons}`)
}

if (mountedRoutes.length === TWIN_ROUTE_COUNT && mountedRoutes.every((route) => route.kind === 'exact' && typeof route.handler === 'function')) {
  pass('仿真只读路由', mountedRoutes.map((route) => route.path).join('、'))
} else {
  fail('仿真只读路由', `期望 ${TWIN_ROUTE_COUNT} 条 kind:'exact' 路由，实际 ${mountedRoutes.length} 条`)
}

if (infos.some((line) => line.includes(`已注册 ${EXPECTED_TOOLS}/${EXPECTED_TOOLS}`))) {
  pass('注册上报', '如实报告实际注册数量')
} else {
  fail('注册上报', `未看到真实计数上报：${infos.join(' | ') || '(无 info 日志)'}`)
}

// ── 4. dsh.client 声明与客户端 bundle ──────────────────────────────────────
const declaration = manifest.dsh?.client
if (declaration === undefined) {
  note('未声明 dsh.client（无客户端半）')
} else {
  const problems = []
  if (declaration.platform !== 'web') problems.push(`platform 必须是 "web"（实际 ${JSON.stringify(declaration.platform)}）`)
  for (const key of ['inject', 'external']) {
    const value = declaration[key]
    if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string'))) {
      problems.push(`${key} 必须是字符串数组`)
    }
  }
  if (declaration.immediately !== undefined && typeof declaration.immediately !== 'boolean') problems.push('immediately 必须是布尔')

  const clientField = manifest.exports?.['./client']
  const clientRelative = typeof clientField === 'string' ? clientField : clientField?.default
  let bundleHead = ''
  if (typeof clientRelative !== 'string') problems.push('声明了 dsh.client 但 exports["./client"] 不是字符串或带字符串 default 的对象')
  else if (!existsSync(join(PLUGIN_ROOT, clientRelative))) problems.push(`exports["./client"] 指向的文件不存在：${clientRelative}`)
  else bundleHead = readFileSync(join(PLUGIN_ROOT, clientRelative), 'utf8').slice(0, 400)

  if (bundleHead !== '') {
    if (!bundleHead.includes('window.__ModuleLoader__.load(')) problems.push('客户端 bundle 未以 window.__ModuleLoader__.load 装载')
    else if (!bundleHead.includes(JSON.stringify(manifest.name))) problems.push(`客户端 bundle 的注册 id 必须等于包名 ${manifest.name}`)
  }

  if (problems.length === 0) pass('dsh.client 声明与客户端 bundle', `platform=${declaration.platform}，入口 ${clientRelative}`)
  else fail('dsh.client 声明与客户端 bundle', problems.join('；'))
}

// ── 运行时前置（不是宿主兼容问题，但决定工具能否真的动起来）────────────────
const python = spawnSync('python', ['--version'], { stdio: 'ignore' })
if (python.status === 0) note('系统 python 可用：worker 可以启动（首次调用工具时才会 spawn）')
else note('未检测到可用的系统 python：工具会注册成功，但调用时会失败；需安装 Python 与 requirements.txt 的依赖（宿主不自带解释器）')

console.log('')
if (failures.length === 0) {
  console.log('result: 全部通过')
  process.exit(0)
}
console.log(`result: ${failures.length} 项失败`)
for (const failure of failures) console.log(`  - ${failure}`)
process.exit(1)
