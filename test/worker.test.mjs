/**
 * test/worker.test.mjs — Python worker 进程管理层的契约（`lib/worker.js`）。
 *
 * ## 为什么需要
 * 「连接构造卡死 ⇒ worker 自杀 ⇒ 下次调用换新进程」这条修法的后半程完全依赖本层：
 * - 子进程退出必须让**在飞的请求立即失败**（否则调用方会一直等到自己的命令超时）；
 * - 下一次 `call()` 必须能**重新拉起**一个干净进程，并遵守 `restartDelayMs` 退避
 *   （否则一个开机即崩的 worker 会变成紧凑的崩溃→重启循环）。
 * 这两条此前只有读码确认，没有测试。
 *
 * 做法：把 `pythonDir` 指向一个临时目录，里面放一个**假 worker**（实现往返/自杀/挂住三种行为），
 * 于是不需要机器人、也不需要真插件脚本就能驱动真实的 `UrWorker`。
 *
 * 运行：node --test test/worker.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { UrWorker } from '../lib/worker.js'

const PYTHON = process.env.PYTHON ?? 'python'

/** 假 worker：`echo` 正常回包；`die` 直接退出（模拟崩溃）；`hang` 永不回包。 */
const FAKE_WORKER = `
import json, sys, time

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    req = json.loads(line)
    op = req.get("op")
    if op == "echo":
        sys.stdout.write(json.dumps({"id": req["id"], "ok": True, "data": {"echo": req.get("v")}}) + "\\n")
        sys.stdout.flush()
    elif op == "fail":
        sys.stdout.write(json.dumps({"id": req["id"], "ok": False, "error": "bad op"}) + "\\n")
        sys.stdout.flush()
    elif op == "fail-coded":
        sys.stdout.write(json.dumps({"id": req["id"], "ok": False, "error": "bad op with code",
                                     "code": "BADARG", "data": {"field": "q"}}) + "\\n")
        sys.stdout.flush()
    elif op == "die":
        sys.exit(3)
    elif op == "hang":
        time.sleep(30)
    elif op == "hang-noise":
        # 先往 stderr 写一行可辨认的原因，再挂住 —— 用于验证"超时 kill 时错误信息仍带 stderr"。
        sys.stderr.write("noise-from-worker: killed while busy\\n")
        sys.stderr.flush()
        time.sleep(30)
    elif op == "push":
        # 先推一行**没有 id** 的主动推送（模拟仿真遥测），再回一条正常响应。
        sys.stdout.write(json.dumps({"push": "telemetry", "ip": "1.2.3.4", "ts": 111,
                                     "data": {"q": [1, 2, 3, 4, 5, 6], "tcp": [0, 0, 1, 0, 0, 0]}}) + "\\n")
        sys.stdout.flush()
        sys.stdout.write(json.dumps({"id": req["id"], "ok": True, "data": {"pushed": True}}) + "\\n")
        sys.stdout.flush()
`

/** 建一个带假 worker 的临时 pythonDir，返回 { dir, worker() , cleanup() }。 */
function fakeWorkerFixture({ restartDelayMs } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ur-worker-test-'))
  writeFileSync(join(dir, 'ur_worker.py'), FAKE_WORKER, 'utf8')
  const workers = []
  return {
    dir,
    worker() {
      const instance = new UrWorker({ pythonBin: PYTHON, pythonDir: dir, ...(restartDelayMs === undefined ? {} : { restartDelayMs }) })
      workers.push(instance)
      return instance
    },
    cleanup() {
      for (const instance of workers) {
        try {
          instance.dispose()
        } catch {
          /* 忽略 */
        }
      }
      rmSync(dir, { recursive: true, force: true })
    },
  }
}

test('协议往返：call() 解析响应并把 data 交给调用方', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    assert.deepEqual(await worker.call('echo', { v: 42 }), { echo: 42 })
    // ok:false 的响应必须变成 reject，并把 error 文本带出来。
    await assert.rejects(() => worker.call('fail'), /bad op/)
  } finally {
    fixture.cleanup()
  }
})

test('子进程退出：在飞请求立即失败，且错误里带退出码与 stderr', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await assert.rejects(() => worker.call('die'), /UR worker exited \(code=3/)
  } finally {
    fixture.cleanup()
  }
})

test('★ 连续调用不给 stdin 累积 error 监听器（旧写法第 11 次调用即 MaxListenersExceededWarning）', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    for (let i = 0; i < 20; i += 1) {
      assert.deepEqual(await worker.call('echo', { v: i }), { echo: i })
    }
    const stdin = worker.proc?.stdin
    assert.ok(stdin, '应存在子进程 stdin')
    // 未处理的 'error' 会掀掉宿主进程，所以必须有人接；但**只能挂一个**：
    // 逐次 `on('error')` 且从不摘除会累积监听器与闭包，并让 Node 刷警告。
    assert.equal(
      stdin.listenerCount('error'),
      1,
      `stdin 的 error 监听器必须恒为 1（每个子进程只挂一次），实测 ${stdin.listenerCount('error')}`,
    )
  } finally {
    fixture.cleanup()
  }
})

test('★ 失败的 spawn 不占代次：respawnCount 只统计真正起来的子进程', async () => {
  const fixture = fakeWorkerFixture()
  try {
    // 解释器路径不存在 ⇒ spawn 失败：不得触发 'spawn' 事件，也不得占用一个代次
    // （占用会让宿主误判"子进程被换过"而重建仿真并让客户端重新下载 GLB）。
    const broken = new UrWorker({
      pythonBin: join(tmpdir(), 'definitely-not-a-python-interpreter-xyz'),
      pythonDir: fixture.dir,
    })
    await assert.rejects(() => broken.call('echo', { v: 1 }))
    assert.equal(broken.stats().respawnCount, 0, '失败的 spawn 不得占用代次')
    broken.dispose()

    // 正对照：成功起来的子进程占且仅占一个代次。
    const ok = fixture.worker()
    assert.deepEqual(await ok.call('echo', { v: 'ok' }), { echo: 'ok' })
    assert.equal(ok.stats().respawnCount, 1, '成功的 spawn 必须占一个代次')
  } finally {
    fixture.cleanup()
  }
})

test('★ 分闸准入（H-3）：读类占满自己那道闸门后，命令类仍能被接纳', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    const readOpts = { class: 'twin-read', classMaxInFlight: 3 }

    // 三路读先进队列（`hang` 不回包，所以它们会一直占着槽位）。
    const reads = [0, 1, 2].map(() => worker.call('hang', {}, 30000, undefined, readOpts))
    await new Promise((r) => setTimeout(r, 250))
    assert.equal(worker.stats().pending, 3, '三路读应当都在飞')

    // 第 4 路读被**自己那道闸门**拒掉：注意总闸门（默认 8）此时并没满，所以这不是总闸门报的错。
    await assert.rejects(
      () => worker.call('hang', {}, 30000, undefined, readOpts),
      /twin-read 类请求已达上限/,
      '读类必须受自己的上限约束',
    )

    // 命令类（不传 class）照常入队 —— 旧写法在 8 路读把总闸占满时，这里会被 BUSY 直接拒掉，
    // 于是一台真机正在运动、用户想让它停的那一刻，停止指令根本到不了 worker。
    const stop = worker.call('stopj', { a: 2 })
    stop.catch(() => {}) // 子进程被 dispose 时会 reject；这里只关心"是否被接纳"
    await new Promise((r) => setTimeout(r, 250))
    assert.equal(worker.stats().pending, 4, '命令类必须被接纳（3 路读 + 1 条命令）')

    for (const p of reads) p.catch(() => {})
  } finally {
    fixture.cleanup()
  }
})

test('★ 超时 kill 时，同孩子的其它在飞请求必须拿到带 stderr 的 KILLED 原因', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    // ① 先发一条会挂住并超时的调用：它自己拿到 TIMEOUT；超时后 `_killFor` 杀掉子进程。
    const hang = worker.call('hang-noise', {}, 800)
    // ② 让第二条请求真的写进同一个孩子的 stdin，于是它属于"被 kill 殃及的在飞请求"。
    await new Promise((r) => setTimeout(r, 150))
    const collateral = worker.call('hang', {}, 5000)

    await assert.rejects(hang, /timed out after 800ms/)
    await assert.rejects(collateral, (err) => {
      // 旧写法用共享的 `this.stderrTail`，而 per-child 尾部在 `_failAll()` 里已被清掉，
      // 于是这里只会得到一句**没有原因**的"进程已被终止"。
      assert.match(err.message, /进程已被终止/, `应是 KILLED 原因：${err.message}`)
      assert.match(err.message, /noise-from-worker/, `KILLED 原因里必须带子进程 stderr：${err.message}`)
      return true
    })
  } finally {
    fixture.cleanup()
  }
})

test('退出→退避重启：下一次 call() 在 restartDelayMs 之后拉起干净进程并成功', async () => {
  const fixture = fakeWorkerFixture({ restartDelayMs: 500 })
  try {
    const worker = fixture.worker()
    await assert.rejects(() => worker.call('die'), /exited/)

    // 紧接着再调用：必须等完退避再重启（不是立刻 spawn，也不是永久失效）。
    const started = Date.now()
    assert.deepEqual(await worker.call('echo', { v: 'after-restart' }), { echo: 'after-restart' })
    const elapsed = Date.now() - started
    assert.ok(elapsed >= 400, `重启应遵守 restartDelayMs（实测 ${elapsed}ms）`)
    assert.ok(elapsed < 10000, `重启不应拖太久（实测 ${elapsed}ms）`)
  } finally {
    fixture.cleanup()
  }
})

test('单次调用超时：命令预算到点即 reject，不让调用方被卡死的 worker 拖住', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    const started = Date.now()
    await assert.rejects(() => worker.call('hang', {}, 300), /timed out after 300ms/)
    const elapsed = Date.now() - started
    assert.ok(elapsed >= 250 && elapsed < 5000, `超时应在预算附近触发（实测 ${elapsed}ms）`)

    // 超时之后那个进程**必须**已经被杀掉：worker 是单线程的，挂在里面的请求没有任何
    // 取消机制，不换进程就等于后续每一次调用都会排队等到超时（插件等于死了，却只报
    // 一句笼统的 "timed out"）。
    await new Promise((resolve) => setTimeout(resolve, 300))
    assert.equal(worker.proc, null, '超时后必须丢弃子进程句柄')
    assert.equal(worker.stats().running, false, '超时后子进程不应仍在运行')
  } finally {
    fixture.cleanup()
  }
})

test('超时换新进程：下一次 call() 仍然可用（自动恢复，无需人工重启插件）', async () => {
  const fixture = fakeWorkerFixture({ restartDelayMs: 100 })
  try {
    const worker = fixture.worker()
    await assert.rejects(() => worker.call('hang', {}, 300), /timed out/)
    // 同一个 UrWorker 实例：下一次调用必须拉起一个干净的 worker 并成功。
    assert.deepEqual(await worker.call('echo', { v: 'recovered' }), { echo: 'recovered' })
  } finally {
    fixture.cleanup()
  }
})

// ── 0.6.6：仿真的只读遥测**不得**因为超时就杀掉机器人会话 ────────────────────
//
// 机器人执行运动指令时仿真的读会排队（同一条单线程 stdin 队列），用默认预算会在超时时杀掉
// 子进程 —— 连带整条 RTDE/Dashboard 会话，仿真此后永远拿不到位姿。只读读传
// `killOnTimeout:false`：**这一次调用**失败，进程与会话留下。

test('killOnTimeout:false —— 超时只让这一次调用失败，不杀子进程（机器人会话必须活着）', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await worker.call('echo', { v: 'warm' })
    const procBefore = worker.proc
    assert.ok(procBefore, '先要有一个活着的子进程');

    const error = await worker.call('hang', {}, 300, undefined, { killOnTimeout: false }).then(
      () => null,
      (e) => e,
    );
    assert.ok(error, '超时必须 reject 调用方');
    assert.match(error.message, /timed out after 300ms/);
    assert.equal(error.code, 'WORKER_TIMEOUT', '★ 必须带机器可读的错误码（仿真据此降级成"陈旧帧"）');

    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(worker.proc, procBefore, '★ 不得换/杀子进程：会话（RTDE/Dashboard）在它里面');
    assert.equal(worker.stats().running, true, '子进程必须仍然活着');

    // 会话没死 ⇒ 下一个读立刻可用（这就是"机器人运动完仿真自动跟上"的前提）。
    assert.deepEqual(await worker.call('echo', { v: 'after-timeout' }), { echo: 'after-timeout' });
  } finally {
    fixture.cleanup()
  }
})

test('默认（不传选项）行为不变：超时仍然杀掉子进程以解救卡死的单线程 worker', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await assert.rejects(() => worker.call('hang', {}, 300), /timed out/)
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(worker.proc, null, '★ 命令类调用的既有语义不得被仿真的需要改掉');
  } finally {
    fixture.cleanup()
  }
})

test('在飞请求上限：超过 maxInFlight 时立即拒绝，不排队等到各自超时', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = new UrWorker({
      pythonBin: PYTHON,
      pythonDir: fixture.dir,
      maxInFlight: 2,
      restartDelayMs: 100,
    })
    const hanging = [worker.call('hang', {}, 30000), worker.call('hang', {}, 30000)]
    // 让前两个请求真的落到 pending 表里
    await new Promise((resolve) => setTimeout(resolve, 200))
    await assert.rejects(() => worker.call('echo', { v: 1 }), /在排队（上限 2）/)
    worker.dispose()
    await Promise.allSettled(hanging)
  } finally {
    fixture.cleanup()
  }
})

test('协议噪声可诊断：无法解析的行与未知 id 会被计数，而不是静默丢弃', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await worker.call('echo', { v: 1 })
    // 直接驱动内部解析：模拟 URBasic 之类的库往协议通道上乱打印，以及乱序/陌生的响应。
    worker._onLine('not json at all')
    worker._onLine(JSON.stringify({ id: 999999, ok: true, data: {} }))
    const stats = worker.stats()
    assert.equal(stats.droppedLines, 1, '无法解析的行必须被计数')
    assert.equal(stats.unknownResponses, 1, 'id 不认识的响应必须被计数')
    assert.match(stats.lastDroppedLine, /999999|not json/, '必须保留最后一条噪声的线索')
  } finally {
    fixture.cleanup()
  }
})

test('结构化错误码：ok:false 响应里的 code 必须挂到 Error 上', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await assert.rejects(() => worker.call('fail-coded'), (error) => {
      assert.equal(error.code, 'BADARG', '必须把协议里的 code 透传给调用方')
      assert.match(error.message, /bad op with code/)
      return true
    })
  } finally {
    fixture.cleanup()
  }
})

test('dispose()：结束子进程并让在飞请求以明确原因失败', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await worker.ensureStarted() // 先让子进程真的起来，避免与 spawn 竞态
    const pending = worker.call('hang', {}, 30000)
    // call() 内部先 await ensureStarted() 再登记 pending，等一个 tick 让请求落到 pending 表里。
    await new Promise((resolve) => setTimeout(resolve, 100))
    worker.dispose()
    await assert.rejects(() => pending, /UR worker was disposed/)
    // dispose 之后不得再拉起新进程（否则插件卸载后还会留下一个 Python 进程）。
    await assert.rejects(() => worker.call('echo', { v: 1 }), /disposed/)
  } finally {
    fixture.cleanup()
  }
})

test('契约：默认退避为 500 ms（与「自杀后约 0.5 s 换新进程」的说法一致）', () => {
  const worker = new UrWorker({ pythonBin: PYTHON, pythonDir: 'unused' })
  assert.equal(worker.restartDelayMs, 500)
  assert.equal(worker.commandTimeoutMs, 60000)
  assert.equal(worker.maxInFlight, 8)
})

// ── 主动推送遥测（仿真"完整跟随机器人动作"的通道）──────────────────────────
//
// worker 现在会主动推**没有 id** 的协议行（见 python/ur_worker.py 的 `_twin_push_loop`）。
// 这一层必须把它当推送处理，而不是"一条匹配不上的响应"：后者会丢掉唯一能在运动期间
// 继续更新的遥测来源。

test('★ 主动推送行写入遥测缓存，且不会被记成「无法匹配的响应」', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await worker.call('push', {})

    const telemetry = worker.latestTelemetry('1.2.3.4')
    assert.ok(telemetry, '推送行必须写入遥测缓存')
    assert.deepEqual(telemetry.q, [1, 2, 3, 4, 5, 6])
    assert.deepEqual(telemetry.tcp, [0, 0, 1, 0, 0, 0])
    assert.equal(telemetry.ts, 111, 'ts 用推送行自带的采样时刻')

    const stats = worker.stats()
    assert.equal(stats.unknownResponses, 0, '推送行不能被计成无法匹配的响应')
    assert.equal(stats.droppedLines, 0, '推送行是合法 JSON，不能被记成噪声')
    assert.ok(stats.pushed >= 1, '推送计数应增加')
    assert.deepEqual(stats.telemetryIps, ['1.2.3.4'])

    // 关节角不足 6 维的推送必须被丢弃：半截姿态会把机械臂画歪。
    worker._onLine(JSON.stringify({
      push: 'telemetry', ip: '1.2.3.4', ts: 222, data: { q: [1, 2], tcp: [0, 0, 1, 0, 0, 0] },
    }))
    assert.equal(worker.latestTelemetry('1.2.3.4').ts, 111, '不完整的推送不得覆盖上一笔好读数')
  } finally {
    fixture.cleanup()
  }
})

test('dispose() 清空遥测缓存（不给已死会话留姿态）', async () => {
  const fixture = fakeWorkerFixture()
  try {
    const worker = fixture.worker()
    await worker.call('push', {})
    assert.ok(worker.latestTelemetry('1.2.3.4'))
    worker.dispose()
    assert.equal(worker.latestTelemetry('1.2.3.4'), undefined)
  } finally {
    fixture.cleanup()
  }
})
