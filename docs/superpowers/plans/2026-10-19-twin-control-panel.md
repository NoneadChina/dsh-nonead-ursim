# 仿真面板实时控制 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给只读的 3D 仿真面板加左右两条控制轨（TCP 点动 / 位姿数值 / 六关节 / 速度倍率），让面板能实时驱动离线仿真机器人。

**Architecture:** 浏览器半边新增 `src/client/twin-controls.js`（纯函数工厂 + DOM 片段，由 `twin-panel.js` 挂载），全部命令走宿主新增的一条写路由 `POST /nonead-ursim/twin/jog`（信任栅栏 + **只允许仿真目标**）；宿主把请求派发到 worker 的既有 op（`move_*` / `movej` / `movel`）或两条新 op（`jog_rotate`、`set_speed_scaling`）。安全边界沿用「面板只控仿真」：真机模式下面板控件禁用、路由 403。

**Tech Stack:** Node 22+ ESM、`node:test` + `node:assert/strict`、Python 3.12（`ur_worker.py` / `ur_sim.py`）、浏览器端原生 DOM + 既有 three.js 面板、esbuild 打客户端 bundle。

**Spec:** [`docs/superpowers/specs/2026-10-19-twin-control-panel-design.md`](../specs/2026-10-19-twin-control-panel-design.md)

---

## File Structure

| 文件 | 责任 | 本计划中的动作 |
|---|---|---|
| `lib/twin-paths.js` | 零 import 的路径常量真源（host 与 client 共用） | 追加 `TWIN_JOG_PATH` |
| `lib/twin-routes.js` | host 侧路由的解析/守卫积木 | re-export 新路径 + 新增 `parseJogRequest` |
| `lib/index.js` | 注册路由（`isTrustedWrite` 已在此文件，1218 行起是 `/twin/sim` 的注册样板） | 注册 `POST /twin/jog` |
| `lib/tool-defs.js` | 87 个工具声明（`op` / `toolName` / `parameters` / `timeoutMs`） | 追加 `ursim_jog_rotate`、`ursim_set_speed_scaling` |
| `python/ur_worker.py` | op 实现 + 两张派发表 | 新增 `op_jog_rotate`、`op_set_speed_scaling`、两条 `_sim_*`，登记进 HANDLERS 与 `sim_dispatch` 表（该表在 4715 行，注释「op -> 处理函数」） |
| `src/client/twin-controls.js` | **新建**：左轨/右轨的全部 DOM 与交互状态机 | 全新文件 |
| `src/client/twin-panel.js` | 面板装配（2393 行，已偏大，不再扩写控件细节） | 三栏骨架 + 挂载两条轨 + 松开时下发 |
| `src/client/strings.js` | 中英文案 | 新增控件文案键 |
| `docs/tool-schemas.golden.json` | 工具注册面黄金快照 | 用 `URSIM_WRITE_GOLDEN=1` 重生成（89 条） |
| `README.md` / `README.zh.md` | 工具表与总数（门禁会校验） | 补两行、87 → 89 |
| `test/twin-routes.test.mjs` / `test/sim-backend.test.mjs` / `test/twin-panel.test.mjs` | 既有测试文件 | 追加新用例 |

**为什么新建 `src/client/twin-controls.js`：** `twin-panel.js` 已经 2393 行（画布、HUD、I/O、仿真开关、模型、主题、截图都在里面）。控制轨是独立职责（点动/输入/状态机），放新文件才能被单独测试；`twin-panel.js` 只负责「插进布局 + 把最新快照喂给它 + 把命令交给 `request()`」。

---

### Task 0: 动手前先读三处锚点（把本计划的假设坐实）

**Files:** 只读，不改。

- [ ] **Step 1: 确认 Python 侧的位姿/矩阵 helper 名字**

Run: `Select-String -Path python/ur_worker.py -Pattern '^def _tool_axis_move|^def _current_tcp_pose|^def _pose_to_matrix|^def _matrix_to_pose|^def _compose' | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() }`
Expected: 打印 `_tool_axis_move` 等函数的行号。**本计划里 `_compose_rotation` / `_current_tcp_pose` / `_sim_tcp_pose` 是按语义起的名字**：如果文件里已有等价函数（很可能有，`_tool_axis_move` 内部就在用），**直接复用真名，不要新写一套数学**。

- [ ] **Step 2: 确认 HANDLERS 表与 sim 派发表的位置**

Run: `Select-String -Path python/ur_worker.py -Pattern '^HANDLERS|^[A-Z_]+ = \{|"get_speed_scaling": _sim' | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() } | Select-Object -First 10`
Expected: 看到真机 HANDLERS 表与 4715 行附近「op -> 处理函数」的 sim 表。

- [ ] **Step 3: 确认宿主侧的注入名**

Run: `Select-String -Path lib/index.js -Pattern 'simIps|const SIM_IP|readJsonBody|sendJson\(' | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() } | Select-Object -First 12`
Expected: 确认 `simIps` / `SIM_IP` / `sendJson` 在路由闭包作用域内可见；`readJsonBody` 若不存在，用该文件里 `/twin/sim` 读请求体的同一方式。

- [ ] **Step 4: 确认面板测试的挂载 helper**

Run: `Select-String -Path test/twin-panel.test.mjs -Pattern 'async function mount|function mount|onSend|snapshot\(' | ForEach-Object { "{0}: {1}" -f $_.LineNumber, $_.Line.Trim() } | Select-Object -First 8`
Expected: 找到既有挂载 helper；Task 5–7 的测试都**复用它**，不要另造一套。

### Task 1: 宿主写路由 `POST /nonead-ursim/twin/jog`

**Files:**
- Modify: `lib/twin-paths.js`（文件末尾追加）
- Modify: `lib/twin-routes.js`（re-export 区约第 41 行 + 追加 `parseJogRequest`）
- Modify: `lib/index.js:1218-1249` 之后（新增一段 `hostCtx.effect(... register ...)`）
- Test: `test/twin-routes.test.mjs`（追加 4 个用例）

- [ ] **Step 1: 写失败测试**

在 `test/twin-routes.test.mjs` 末尾追加（沿用该文件既有的 import 与 `assert` 风格）：

```js
import { parseJogRequest } from '../lib/twin-routes.js'

test('★ jog 路由：只接受 cartesian / rotate / joint / pose / home / speed 六种 mode', () => {
  const cases = [
    { mode: 'cartesian', axis: 'x', distance: 0.005, frame: 'tool' },
    { mode: 'rotate', axis: 'rz', deltaRad: 0.02, frame: 'tool' },
    { mode: 'joint', q: [0, -1.5, 0, -1.5, -1.5, 0] },
    { mode: 'pose', pose: [0.1, -0.2, 0.3, 0, 0, 0] },
    { mode: 'home' },
    { mode: 'speed', fraction: 0.5 },
  ]
  for (const body of cases) {
    assert.notEqual(parseJogRequest(body), null, `${body.mode} 应被接受`)
  }
  for (const body of [null, {}, { mode: 'nope' }, { mode: 'speed', fraction: '0.5' }]) {
    assert.equal(parseJogRequest(body), null, `${JSON.stringify(body)} 应被拒绝`)
  }
})

test('★ jog 路由：speed 模式把倍率钳到 0.01–1.0，并回显原始值', () => {
  const low = parseJogRequest({ mode: 'speed', fraction: 0.001 })
  assert.equal(low.fraction, 0.01)
  assert.equal(low.requested, 0.001)
  const high = parseJogRequest({ mode: 'speed', fraction: 9 })
  assert.equal(high.fraction, 1)
})

test('★ jog 路由：cartesian / rotate 的 frame 只接受 tool / base', () => {
  assert.equal(parseJogRequest({ mode: 'cartesian', axis: 'x', distance: 0.005, frame: 'moon' }), null)
  assert.notEqual(parseJogRequest({ mode: 'rotate', axis: 'rx', deltaRad: 0.02, frame: 'base' }), null)
})

test('★ jog 路由：joint 必须是 6 个有限数，pose 必须是 6 个有限数', () => {
  assert.equal(parseJogRequest({ mode: 'joint', q: [0, 0, 0] }), null)
  assert.equal(parseJogRequest({ mode: 'joint', q: [0, 0, 0, 0, 0, NaN] }), null)
  assert.equal(parseJogRequest({ mode: 'pose', pose: [0, 0, 0, 0, 0] }), null)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/twin-routes.test.mjs 2>&1 | Select-Object -Last 8`
Expected: FAIL —— `parseJogRequest is not a function`（或 import 报错）

- [ ] **Step 3: 加路径常量**

`lib/twin-paths.js` 末尾追加：

```js
/**
 * 面板控制写路由（2026-10 实时控制）：**只服务离线仿真**。
 *
 * 与 `TWIN_SIM_PATH` 的区别：那条只能启停/换型号（会重建仿真），
 * 这条在**运行中**下发单步点动、绝对位姿、关节目标与速度倍率 —— 都不重建。
 * 宿主侧强制校验目标是 `127.0.0.1` 的仿真实例，真机模式一律 403。
 */
export const TWIN_JOG_PATH = '/nonead-ursim/twin/jog';
```

- [ ] **Step 4: 写 `parseJogRequest` 并导出**

`lib/twin-routes.js` 的 re-export 行（第 41 行）改为：

```js
export { TWIN_STATE_PATH, TWIN_ASSET_PATH, TWIN_MODELS_PATH, TWIN_STREAM_PATH, TWIN_SIM_PATH, TWIN_JOG_PATH } from './twin-paths.js';
```

同文件末尾追加：

```js
/** 面板控制允许的六种模式。 */
export const TWIN_JOG_MODES = new Set(['cartesian', 'rotate', 'joint', 'pose', 'home', 'speed']);

/** 距离/角度/关节数的有限性判定（拒绝 NaN / Infinity / 字符串）。 */
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec6 = (v) => Array.isArray(v) && v.length === 6 && v.every(isNum);

/**
 * 校验并整形一条面板控制请求。**永不抛错**：不合法一律返回 `null`。
 *
 * 返回值的 `requested` 字段保留客户端原始值，`fraction` 是钳位后的实际值 ——
 * 两者都给，是因为界面要能把「我拖到 0.5% 但实际是 1%」如实说清楚。
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

  // cartesian / rotate
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
```

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/twin-routes.test.mjs 2>&1 | Select-Object -Last 8`
Expected: PASS，`fail 0`

- [ ] **Step 6: 在宿主注册路由**

在 `lib/index.js` 里 `TWIN_SIM_PATH` 的那段 `hostCtx.effect(...)`（1218–1249 行）**之后**追加一段同样形状的注册。依赖已在作用域内：`isTrustedWrite`、`isTrustedRequest`、`sendJson`、`simIps`、`worker`（沿用同文件既有引用；若某个名字不在作用域内，按该文件里 sim 路由取用的同一注入方式取得）。

```js
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
              let body;
              try {
                body = JSON.parse(await readJsonBody(req));
              } catch {
                sendJson(res, { status: 400, headers: {}, body: { ok: false, code: 'BAD_JSON', error: '请求体不是合法 JSON' } });
                return;
              }
              const cmd = parseJogRequest(body);
              if (cmd === null) {
                sendJson(res, { status: 400, headers: {}, body: { ok: false, code: 'BAD_COMMAND', error: '不支持的控制指令' } });
                return;
              }
              // ★ 安全边界：面板只控仿真。这里**不看客户端**，自己判定目标。
              if (!simIps.has(SIM_IP)) {
                sendJson(res, {
                  status: 403,
                  headers: {},
                  body: { ok: false, code: 'SIM_ONLY', error: '面板控制只在离线仿真中可用；真机请用工具调用（受审批门禁保护）' },
                });
                return;
              }
              try {
                const r = await dispatchJog(cmd);
                sendJson(res, { status: 200, headers: {}, body: { ok: true, ...r } });
              } catch (e) {
                const code = e?.code ?? 'JOG_FAILED';
                sendJson(res, {
                  status: 200,
                  headers: {},
                  body: { ok: false, code, error: e instanceof Error ? e.message : String(e) },
                });
              }
            },
          }),
        'ursim-twin: jog route',
      );
```

同文件追加 `dispatchJog`（把六种 mode 映射到 op，`cartesian` 走 `move_*` / `move_tool_*`）：

```js
  /**
   * 面板控制 → worker op。**只做转发**，不在这里算几何（几何在 Python 侧，
   * 与真机路径共用同一份实现，避免两套数学）。
   */
  async function dispatchJog(cmd) {
    const ip = SIM_IP;
    if (cmd.mode === 'speed') {
      return (await worker.call('set_speed_scaling', { ip, fraction: cmd.fraction })).data;
    }
    if (cmd.mode === 'home') {
      // 用户 2026-10-17 裁定的回零位形（与型号无关的关节角）。
      return (await worker.call('movej', { ip, q: [0, -Math.PI / 2, 0, -Math.PI / 2, -Math.PI, 0] })).data;
    }
    if (cmd.mode === 'joint') {
      return (await worker.call('movej', { ip, q: cmd.q })).data;
    }
    if (cmd.mode === 'pose') {
      return (await worker.call('movel', { ip, pose: cmd.pose })).data;
    }
    if (cmd.mode === 'rotate') {
      return (await worker.call('jog_rotate', { ip, axis: cmd.axis, delta_rad: cmd.deltaRad, frame: cmd.frame })).data;
    }
    return (await worker.call(`move_${cmd.frame === 'tool' ? `tool_${cmd.axis}` : cmd.axis}`, { ip, distance: cmd.distance })).data;
  }
```

同文件顶部 import 区把 `TWIN_JOG_PATH` 与 `parseJogRequest` 加进既有 import（第 33–37 行的 `TWIN_*` 列表 + `twin-routes.js` 的解构）。

- [ ] **Step 7: 同步更新启动日志文案**

把 1251–1255 行那句日志改成同时提到两条写路由：

```js
      ctx.logger?.info?.(
        `universal-robots: 已挂载数字仿真路由 ${TWIN_STATE_PATH}、${TWIN_ASSET_PATH}、${TWIN_MODELS_PATH} 与 ${TWIN_STREAM_PATH}` +
          `（只读遥测预算 ${TWIN_READ_TIMEOUT_MS}ms，超时不杀 worker）` +
          `，离线仿真开关 ${TWIN_SIM_PATH}（启停/换型号）与面板控制 ${TWIN_JOG_PATH}（点动/位姿/关节/调速，**只对仿真生效**）`,
      );
```

- [ ] **Step 8: 跑现有路由测试确认没回归**

Run: `node --test test/twin-routes.test.mjs 2>&1 | Select-Object -Last 6`
Expected: PASS，全部用例通过（含既有 55 个）

- [ ] **Step 9: 提交**

```bash
git add lib/twin-paths.js lib/twin-routes.js lib/index.js test/twin-routes.test.mjs
git commit -m "feat(twin): 新增面板控制写路由 POST /twin/jog（只对仿真生效）"
```

---

### Task 2: Python `jog_rotate`（绕轴增量旋转点动）

**Files:**
- Modify: `python/ur_worker.py`（新增 `op_jog_rotate`，登记进 HANDLERS 与 `sim_dispatch` 表）
- Test: `test/sim-backend.test.mjs`（追加 2 个用例）

- [ ] **Step 1: 写失败测试**

`test/sim-backend.test.mjs` 末尾追加（该文件已能驱动仿真后端，沿用其既有 helper）：

```js
test('★ jog_rotate：绕工具 Z 轴转 0.1 rad，TCP 位置不变、姿态符合轴角合成', async () => {
  const before = await simCall('get_target_values', { ip: '127.0.0.1' })
  const r = await simCall('jog_rotate', { ip: '127.0.0.1', axis: 'rz', delta_rad: 0.1, frame: 'tool' })
  assert.equal(r.ok, true, r.error)
  const after = await simCall('get_target_values', { ip: '127.0.0.1' })
  // 绕**工具**轴转：位置不动
  for (let i = 0; i < 3; i += 1) assert.ok(Math.abs(after.data.tcp_pose[i] - before.data.tcp_pose[i]) < 1e-6)
  assert.notDeepEqual(after.data.tcp_pose.slice(3), before.data.tcp_pose.slice(3))
})

test('★ jog_rotate：绕基座 X 轴转，位置随姿态一起变；非法 axis 被拒', async () => {
  const r = await simCall('jog_rotate', { ip: '127.0.0.1', axis: 'rx', delta_rad: 0.05, frame: 'base' })
  assert.equal(r.ok, true, r.error)
  const bad = await simCall('jog_rotate', { ip: '127.0.0.1', axis: 'nope', delta_rad: 0.05, frame: 'base' })
  assert.equal(bad.ok, false)
})
```

> 若该文件没有 `simCall` helper，用它现有的调用方式（读文件头部的 helper 定义，按同一签名包装 `route_op`）。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/sim-backend.test.mjs 2>&1 | Select-Object -Last 10`
Expected: FAIL —— 仿真返回 `SIM_UNSUPPORTED`（新 op 还没实现）

- [ ] **Step 3: 实现真机路径**

在 `python/ur_worker.py` 的 `op_move_tool_z`（1972 行）之后追加。复用文件里已有的矩阵工具（`_tool_axis_move` 同层使用的那几个 helper：位姿→矩阵、矩阵→位姿）：

```python
def op_jog_rotate(p):
    """绕**指定轴**增量旋转 TCP（面板「TCP 方向」方向盘用）。

    `frame='tool'` 时绕工具自身轴；`frame='base'` 时绕基座轴。
    实现方式与 `_tool_axis_move` 同源：**先算目标位姿，再发一条 `movel`**，
    不做 URScript 侧的旋转指令 —— 这样仿真与真机走的是同一条几何。
    """
    ip = _str(p, "ip")
    axis = _str(p, "axis")
    frame = _str(p, "frame", "tool")
    delta = _num(p, "delta_rad", 0.0)
    if axis not in ("rx", "ry", "rz"):
        return err("BADARG", "axis 必须是 rx / ry / rz", {"axis": axis})
    if frame not in ("tool", "base"):
        return err("BADARG", "frame 必须是 tool / base", {"frame": frame})
    if not math.isfinite(delta) or delta == 0.0:
        return err("BADARG", "delta_rad 必须是非零有限数", {"delta_rad": delta})

    current = _current_tcp_pose(ip)          # 与本文件其它 op 取当前位姿同一个入口
    if current is None:
        return err("NOT_CONNECTED", "拿不到当前 TCP 位姿")

    index = {"rx": 3, "ry": 4, "rz": 5}[axis]
    target = list(current)
    if frame == "tool":
        # 工具系：把「绕工具轴的小旋转」左乘到当前姿态上
        target[3:] = _compose_rotation(current[3:], index - 3, delta)
    else:
        # 基座系：把「绕基座轴的小旋转」左乘到当前姿态上（角度分量在基座系直接累加）
        target[index] = current[index] + delta

    result = op_movel({"ip": ip, "pose": target})
    if result.get("ok") is not True:
        return result
    result.setdefault("data", {})
    result["data"].update({
        "jog_rotate": {"axis": axis, "delta_rad": delta, "frame": frame,
                       "from_pose": current, "target_pose": target},
    })
    return result
```

> **实现提示（读代码时确认）**：本文件已有「姿态（旋转向量）↔ 矩阵」的成对 helper（`_tool_axis_move` 内部用的那几个，名字以 `_` 开头）。`_compose_rotation(rotvec, axisIndex, delta)` = 把 rotvec 转成矩阵 → 右乘 `R_axis(delta)` → 再转回旋转向量；**若已有等价 helper 就直接复用，不要新写一套数学**。

- [ ] **Step 4: 实现仿真路径**

在 `python/ur_worker.py` 的 `_sim_get_speed_scaling`（4110 行）附近追加：

```python
def _sim_jog_rotate(sim, p):
    """仿真侧：与真机同一条几何 —— 取当前位姿 → 算目标 → 走仿真的 movel。"""
    q = list(sim.q)
    current = _sim_tcp_pose(sim)
    axis = p.get("axis")
    frame = p.get("frame", "tool")
    delta = float(p.get("delta_rad", 0.0))
    if axis not in ("rx", "ry", "rz") or frame not in ("tool", "base"):
        return err("BADARG", "axis / frame 不合法", {"axis": axis, "frame": frame})
    if not math.isfinite(delta) or delta == 0.0:
        return err("BADARG", "delta_rad 必须是非零有限数", {"delta_rad": delta})
    target = list(current)
    index = {"rx": 3, "ry": 4, "rz": 5}[axis]
    if frame == "tool":
        target[3:] = _compose_rotation(current[3:], index - 3, delta)
    else:
        target[index] = current[index] + delta
    ok_ = sim.movel(target)                  # 仿真里已有的绝对位姿入口（与 op_movel 的仿真分支一致）
    if not ok_:
        return err("SIM_UNREACHABLE", "目标位姿在仿真里不可达", {"target_pose": target})
    return ok({"message": "已绕 %s 轴旋转 %.3f rad（%s 系）" % (axis, delta, frame),
               "data": _sim_data(sim, {"jog_rotate": {"axis": axis, "delta_rad": delta, "frame": frame}})}, sim=sim)
```

在 `sim_dispatch` 的查找表（4715 行注释「op -> 处理函数」之后、`"get_speed_scaling": _sim_get_speed_scaling,` 附近）追加：

```python
    "jog_rotate": _sim_jog_rotate,
```

在真机 HANDLERS 表里同样登记 `"jog_rotate": op_jog_rotate,`。

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/sim-backend.test.mjs 2>&1 | Select-Object -Last 10`
Expected: PASS，`fail 0`

- [ ] **Step 6: 提交**

```bash
git add python/ur_worker.py test/sim-backend.test.mjs
git commit -m "feat(sim): 新增 jog_rotate（绕轴增量旋转点动，真机与仿真共用同一份几何）"
```

---

### Task 3: Python `set_speed_scaling`（运行中调速，**不重建**）

**Files:**
- Modify: `python/ur_worker.py`
- Test: `test/sim-backend.test.mjs`（追加 2 个用例）

- [ ] **Step 1: 写失败测试**

```js
test('★ set_speed_scaling：改倍率**不重建仿真**（位姿与关节角不变）', async () => {
  const before = await simCall('get_target_values', { ip: '127.0.0.1' })
  const r = await simCall('set_speed_scaling', { ip: '127.0.0.1', fraction: 0.5 })
  assert.equal(r.ok, true, r.error)
  const after = await simCall('get_target_values', { ip: '127.0.0.1' })
  assert.deepEqual(after.data.joint_positions, before.data.joint_positions)
  assert.deepEqual(after.data.tcp_pose, before.data.tcp_pose)
  const read = await simCall('get_speed_scaling', { ip: '127.0.0.1' })
  assert.equal(read.data.speed_scaling, 0.5)
})

test('★ set_speed_scaling：越界值钳到 0.01–1.0 并回显请求值', async () => {
  const low = await simCall('set_speed_scaling', { ip: '127.0.0.1', fraction: 0.0001 })
  assert.equal(low.ok, true, low.error)
  assert.equal(low.data.fraction, 0.01)
  assert.equal(low.data.requested, 0.0001)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/sim-backend.test.mjs 2>&1 | Select-Object -Last 10`
Expected: FAIL —— `SIM_UNSUPPORTED` 或 op 不存在

- [ ] **Step 3: 实现**

真机路径（放在 `op_get_speed_scaling`（3684 行）**之后**）：

```python
def op_set_speed_scaling(p):
    """设置速度倍率（真机走 `set_speed_slider`，并回读 `target_speed_fraction` 校验）。"""
    ip = _str(p, "ip")
    requested = _num(p, "fraction", None)
    if requested is None or not math.isfinite(requested):
        return err("BADARG", "fraction 必须是有限数", {"fraction": requested})
    fraction = max(0.01, min(1.0, float(requested)))
    model = _require_connected(ip)           # 与本文件其它写类 op 同一个取连接入口
    if model is None:
        return err("NOT_CONNECTED", "机器人未连接")
    model.setSpeedScaling(fraction) if hasattr(model, "setSpeedScaling") else None
    actual = float(model.SpeedScaling())
    return ok({"message": "速度倍率设为 %.2f（请求 %.4f）" % (fraction, requested),
               "data": {"fraction": fraction, "requested": requested, "actual": actual, "ip": ip}})
```

> **实现提示**：本仓库另有真机插件用的是 URScript `set_speed_slider(fraction)`。此处按本文件取连接对象后再找它已有的发送入口（`_send_script` / `model.send_program` 之类，读代码确认），**不要凭空造名字**；拿不到回读通道时按 `actual: None` 如实回报，不假装校验过。

仿真路径（放在 `_sim_get_speed_scaling` 之后）：

```python
def _sim_set_speed_scaling(sim, p):
    """仿真侧：直接改运行中实例的倍率 —— **绝不重建**（重建会把机器人推回起始位姿）。"""
    requested = p.get("fraction")
    if not isinstance(requested, (int, float)) or not math.isfinite(float(requested)):
        return err("BADARG", "fraction 必须是有限数", {"fraction": requested})
    fraction = max(0.01, min(1.0, float(requested)))
    sim.speed_scaling = ur_sim_clamp_speed(fraction) if hasattr(ur_sim, "…") else fraction
    return ok({"message": "仿真速度倍率设为 %.2f（请求 %.4f；下一段运动开始生效）" % (fraction, requested),
               "data": _sim_data(sim, {"fraction": fraction, "requested": requested})}, sim=sim)
```

> **实现提示**：`ur_sim.py` 有 `_clamp_speed()`（约 815 行）。按本文件引用仿真模块的方式取到它并复用即可；直接赋值 `sim.speed_scaling = fraction` 也可（0.01–1.0 已在此处钳过）。

- [ ] **Step 4: 登记两张表**

`sim_dispatch` 表追加 `"set_speed_scaling": _sim_set_speed_scaling,`；HANDLERS 追加 `"set_speed_scaling": op_set_speed_scaling,`。

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/sim-backend.test.mjs 2>&1 | Select-Object -Last 8`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add python/ur_worker.py test/sim-backend.test.mjs
git commit -m "feat(sim): 新增 set_speed_scaling（运行中调速，不重建仿真）"
```

---

### Task 4: 工具声明 + 黄金快照 + 文档计数

**Files:**
- Modify: `lib/tool-defs.js`（在 `move_tool_z` 块之后追加两条）
- Modify: `docs/tool-schemas.golden.json`（重生成）
- Modify: `README.md` / `README.zh.md`（工具表 + 总数 87 → 89）

- [ ] **Step 1: 追加两条工具声明**

`lib/tool-defs.js` 里 `move_tool_z` 那一块之后追加（沿用 `IP()` / `AXIS_MOTION_DISTANCE()` 这类既有 helper 的形状）：

```js
    {
      op: 'jog_rotate',
      toolName: 'ursim_jog_rotate',
      description:
        '绕指定轴**增量旋转** TCP（面板「TCP 方向」方向盘用；真机与仿真共用同一份几何）。frame=tool 绕工具自身轴、base 绕基座轴；delta_rad 为弧度、必须非零。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        axis: { type: 'string', enum: ['rx', 'ry', 'rz'], description: '旋转轴：rx / ry / rz' },
        delta_rad: { type: 'number', description: '增量弧度（非零有限数，面板默认 ±0.035 ≈ 2°）' },
        frame: { type: 'string', enum: ['tool', 'base'], description: '参考系：tool（默认）/ base' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'set_speed_scaling',
      toolName: 'ursim_set_speed_scaling',
      description:
        '设置速度倍率（0.01–1.0，即 1%–100%）。仿真侧**原地修改**运行中实例、不重建；真机侧走速度滑块并回读 target_speed_fraction。面板滑块自己的范围是 10%–100%，这一条与面板无关。⚠️ 影响此后所有运动的速度。',
      parameters: {
        ip: IP(),
        fraction: { type: 'number', description: '速度倍率 0.01–1.0（越界会被钳到该区间）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
```

- [ ] **Step 2: 重生成黄金快照**

```bash
$env:URSIM_WRITE_GOLDEN='1'; node --test test/tool-schema-dsl.test.mjs 2>&1 | Select-Object -Last 4; Remove-Item Env:URSIM_WRITE_GOLDEN
node -e "const g=require('./docs/tool-schemas.golden.json'); console.log('golden 条数:', g.length)"
```
Expected: `golden 条数: 89`

- [ ] **Step 3: 跑声明相关测试**

Run: `node --test test/tool-schema-dsl.test.mjs 2>&1 | Select-Object -Last 6`
Expected: PASS

- [ ] **Step 4: 补 README 工具表与总数**

两份 README 的工具表各补两行（`ursim_jog_rotate`、`ursim_set_speed_scaling`），并把「87 个工具」改为「89 个工具」（表格标题、总数断言句、以及任何提到数量的句子）。然后跑：

Run: `npm run check:docs 2>&1 | Select-Object -Last 8`
Expected: PASS（`check-doc-tools` 会逐条对账，缺一行就红）

- [ ] **Step 5: 提交**

```bash
git add lib/tool-defs.js docs/tool-schemas.golden.json README.md README.zh.md
git commit -m "feat(tools): 新增 ursim_jog_rotate / ursim_set_speed_scaling（工具面 87→89）"
```

---

### Task 5: 前端骨架 —— 三栏布局 + 可收起侧轨

**Files:**
- Create: `src/client/twin-controls.js`
- Modify: `src/client/twin-panel.js`（装配处约 686–730 行 `view` / `canvas` 那一带）
- Test: `test/twin-panel.test.mjs`（追加 3 个用例）

- [ ] **Step 1: 写失败测试**

```js
test('★ 控制面板骨架：三栏 grid + 两条侧轨 + 收起把手，收起状态进 localStorage', async () => {
  const panel = await mountTestPanel({ connected: true, simulated: true, model: 'ur12e', q: [0, -1.5, 0, -1.5, -1.5, 0] })
  const root = panel.root
  assert.ok(root.querySelector('[data-ursim-twin-rail="left"]'), '左轨应存在')
  assert.ok(root.querySelector('[data-ursim-twin-rail="right"]'), '右轨应存在')
  assert.ok(root.querySelector('[data-ursim-twin-rail-toggle="left"]'), '左轨收起把手应存在')
  root.querySelector('[data-ursim-twin-rail-toggle="left"]').click()
  assert.equal(root.querySelector('[data-ursim-twin-rail="left"]').getAttribute('data-collapsed'), 'true')
})
```

> 若 `test/twin-panel.test.mjs` 已有等价的挂载 helper（它已有 72 个用例），直接复用其 helper 与断言风格，别新造一套。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/twin-panel.test.mjs 2>&1 | Select-Object -Last 8`
Expected: FAIL —— 找不到 `[data-ursim-twin-rail]`

- [ ] **Step 3: 新建 `src/client/twin-controls.js`（骨架部分）**

```js
/**
 * src/client/twin-controls.js — 面板控制轨（左：点动 + 速度倍率；右：位姿 + 关节）
 *
 * 与 `twin-panel.js` 的分工：这里只管**控件 DOM 与交互状态机**，不碰 three.js、不碰路由；
 * 命令通过注入的 `send(cmd)` 交回去，状态通过 `update(snapshot)` 喂进来。
 * 单文件职责，便于单独测试（`test/twin-panel.test.mjs` 直接挂它）。
 */

/** 侧轨宽度（px）——与 CSS grid 同一份真源，测试直接用这两个数。 */
export const RAIL_W = 128;
export const RAIL_W_RIGHT = 176;
export const RAIL_COLLAPSED_W = 24;

/** localStorage 键：记住两条轨的收起状态。 */
export const RAIL_STATE_KEY = 'dsh-nonead-ursim.rails';

const makeEl = (doc, tag, className, dataAttr) => {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (dataAttr) el.setAttribute(dataAttr, '');
  return el;
};

function readRailState(storage) {
  try {
    const raw = storage?.getItem?.(RAIL_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { left: parsed?.left === true, right: parsed?.right === true };
  } catch {
    return { left: false, right: false };
  }
}

function writeRailState(storage, state) {
  try {
    storage?.setItem?.(RAIL_STATE_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式 / 配额满：保持可用，不抛错 */
  }
}

/**
 * 建一条可收起的侧轨。返回 `{ rail, toggle, setCollapsed }`。
 */
export function buildRail(doc, side, storage) {
  const state = readRailState(storage);
  const rail = makeEl(doc, 'div', `ursim-twin-rail ursim-twin-rail-${side}`, 'data-ursim-twin-rail');
  rail.setAttribute('data-ursim-twin-rail', side);
  const toggle = makeEl(doc, 'button', 'ursim-twin-rail-toggle', 'data-ursim-twin-rail-toggle');
  toggle.setAttribute('data-ursim-twin-rail-toggle', side);
  toggle.setAttribute('aria-expanded', String(state[side] !== true));
  const body = makeEl(doc, 'div', 'ursim-twin-rail-body');
  rail.appendChild(toggle);
  rail.appendChild(body);
  const setCollapsed = (collapsed) => {
    rail.setAttribute('data-collapsed', String(collapsed));
    rail.style.width = `${collapsed ? RAIL_COLLAPSED_W : side === 'left' ? RAIL_W : RAIL_W_RIGHT}px`;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    const next = readRailState(storage);
    next[side] = collapsed;
    writeRailState(storage, next);
  };
  setCollapsed(state[side] === true);
  toggle.addEventListener('click', () => setCollapsed(rail.getAttribute('data-collapsed') !== 'true'));
  return { rail, toggle, body, setCollapsed };
}
```

- [ ] **Step 4: 在 `twin-panel.js` 里装配**

在 `view`/`canvas` 那一带（约 686–730 行）把原来的单列结构改成三栏容器，并挂两条轨（左轨 body 由 Task 6 填、右轨 body 由 Task 7 填；本任务先建空轨与骨架，保证测试通过）：

```js
  const stage = makeEl(doc, 'div', 'ursim-twin-stage')
  const left = buildRail(doc, 'left', win.localStorage)
  const right = buildRail(doc, 'right', win.localStorage)
  stage.appendChild(left.rail)
  stage.appendChild(view)      // 原来的画布容器
  stage.appendChild(right.rail)
  root.appendChild(stage)
```

并给面板注入 CSS（沿用该文件既有的 `<style>` 注入方式，约 `injectStyles`）：

```css
.ursim-twin-stage { display: grid; grid-template-columns: 128px minmax(280px, 1fr) 176px; align-items: stretch; }
.ursim-twin-rail { display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
.ursim-twin-rail[data-collapsed="true"] .ursim-twin-rail-body { display: none; }
.ursim-twin-rail-toggle { height: 24px; cursor: pointer; }
```

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/twin-panel.test.mjs 2>&1 | Select-Object -Last 8`
Expected: PASS（含既有 72 个用例，不得回归）

- [ ] **Step 6: 提交**

```bash
git add src/client/twin-controls.js src/client/twin-panel.js test/twin-panel.test.mjs
git commit -m "feat(panel): 三栏骨架 + 两条可收起控制轨"
```

---

### Task 6: 左轨控件 —— 点动方向盘 + 步长 + 速度倍率

**Files:**
- Modify: `src/client/twin-controls.js`
- Modify: `src/client/strings.js`
- Test: `test/twin-panel.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
test('★ 左轨：点一次 X+ 只发一条 cartesian 命令，且用最新帧的步长', async () => {
  const sent = []
  const panel = await mountTestPanel({ connected: true, simulated: true, onSend: (c) => sent.push(c) })
  panel.root.querySelector('[data-ursim-jog="cartesian-x-plus"]').click()
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0], { mode: 'cartesian', axis: 'x', distance: 0.005, frame: 'tool' })
})

test('★ 左轨：速度滑块 10%–100%，松手才发一条 speed 命令', async () => {
  const sent = []
  const panel = await mountTestPanel({ connected: true, simulated: true, onSend: (c) => sent.push(c) })
  const slider = panel.root.querySelector('[data-ursim-speed]')
  assert.equal(slider.min, '10')
  assert.equal(slider.max, '100')
  slider.value = '50'
  assert.equal(sent.length, 0, '拖动（input 事件）不得下发')
  slider.dispatchEvent(new panel.window.Event('change'))
  assert.deepEqual(sent[0], { mode: 'speed', fraction: 0.5 })
})

test('★ 左轨：simulated=false 时所有点动按钮 disabled', async () => {
  const panel = await mountTestPanel({ connected: true, simulated: false })
  assert.equal(panel.root.querySelector('[data-ursim-jog="cartesian-x-plus"]').disabled, true)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/twin-panel.test.mjs 2>&1 | Select-Object -Last 8`
Expected: FAIL —— 找不到 `[data-ursim-jog]`

- [ ] **Step 3: 实现左轨**

`src/client/twin-controls.js` 追加：

```js
/** 点动步长（产品默认）。位置 mm、角度度。 */
export const STEP_MM = [1, 5, 10];
export const STEP_DEG = [1, 2, 5];
/** 速度倍率滑块范围（产品约束：10%–100%）。 */
export const SPEED_MIN = 10;
export const SPEED_MAX = 100;

const pad = (doc, kind, specs, onCommand) => {
  const grid = makeEl(doc, 'div', 'ursim-twin-pad', 'data-ursim-twin-pad');
  grid.setAttribute('data-ursim-twin-pad', kind);
  for (const { cell, key, label } of specs) {
    const b = makeEl(doc, 'button', 'ursim-twin-pad-cell', 'data-ursim-jog');
    b.setAttribute('data-ursim-jog', key);
    b.textContent = label;
    b.style.gridArea = cell;
    b.addEventListener('click', () => onCommand(key));
    grid.appendChild(b);
  }
  return grid;
};

/**
 * 建左轨内容：位置方向盘、Z 行、步长、方向方向盘、RZ 行、速度倍率。
 * `send(cmd)` 由面板注入；`getState()` 返回 `{ simulated, connected }` 供禁用判断。
 */
export function mountLeftRail(doc, body, { send, strings, getState, onStepChange }) {
  /**
   * `send(body)` 收到的是**路由 body**（`{mode:...}`），不是中间指令：
   * 整形放在这里（它知道步长/参考系），面板只管 POST —— 测试因此可以直接断言 body。
   */
  const stepMm = { value: 5 };
  const stepDeg = { value: 2 };
  const frame = { value: 'tool' };
  const jog = (key) => {
    const mm = (sign) => ({ mode: 'cartesian', axis: key.split('-')[1], distance: sign * stepMm.value / 1000, frame: frame.value });
    const rad = (sign) => ({ mode: 'rotate', axis: key.split('-')[1], deltaRad: sign * stepDeg.value * Math.PI / 180, frame: frame.value });
    if (key === 'home') return { mode: 'home' };
    if (key.startsWith('cartesian-')) return mm(key.endsWith('-plus') ? 1 : -1);
    if (key.startsWith('rotate-')) return rad(key.endsWith('-plus') ? 1 : -1);
    return null;
  };
  const sync = () => {
    const { simulated, connected, stalled } = getState();
    // 控制面禁用的三个条件：没连上 / 不是仿真 / 数据通道停滞（设计 §7、§10）
    const enabled = Boolean(connected && simulated && !stalled);
    for (const b of body.querySelectorAll('[data-ursim-jog]')) b.disabled = !enabled;
    const slider = body.querySelector('[data-ursim-speed]');
    if (slider) slider.disabled = !enabled;
  };
  // 位置：3×3 取上/左/右/下 + 中心回零；Z 另起一行
  const posSpecs = [
    { cell: '1 / 2', key: 'cartesian-y-plus', label: '↑' },
    { cell: '2 / 1', key: 'cartesian-x-minus', label: '←' },
    { cell: '2 / 2', key: 'home', label: strings.railHome },
    { cell: '2 / 3', key: 'cartesian-x-plus', label: '→' },
    { cell: '3 / 2', key: 'cartesian-y-minus', label: '↓' },
  ];
  body.appendChild(pad(doc, 'cartesian', posSpecs, (key) => { const b = jog(key); if (b) send(b); }));
  // …（Z 行、步长分段控件、方向方向盘、RZ 行、速度滑块按设计 §4 的尺寸实现）
  sync();
  return { sync };
}
```

命令整形集中在面板侧（Task 5 里注入的 `send`），键盘映射：

| key | 命令 |
|---|---|
| `cartesian-x-plus` / `-minus` | `{mode:'cartesian', axis:'x', distance:±stepM/1000, frame}` |
| `cartesian-y-*` / `cartesian-z-*` | 同上换 axis |
| `rotate-rx-plus` / `-minus` | `{mode:'rotate', axis:'rx', deltaRad:±stepRad, frame}` |
| `home` | `{mode:'home'}` |
| `speed` | `{mode:'speed', fraction: value/100}` |

- [ ] **Step 4: 补文案**

`src/client/strings.js` 的 zh / en 两份各加（键名对称，`strings.test.mjs` 会校验）：

```js
  railTitleTcp: 'TCP 位置',
  railTitleRot: 'TCP 方向',
  railTitleSpeed: '速度倍率',
  railHome: '回零',
  railStepMm: '步长',
  railStepDeg: '角度',
  railSpeedRuntime: '速度倍率（运行中）',   // en: 'Speed (live)'
  railDisabledReal: '真机控制请使用工具调用（受审批门禁保护）',
```

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/twin-panel.test.mjs test/strings.test.mjs 2>&1 | Select-Object -Last 8`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/client/twin-controls.js src/client/strings.js test/twin-panel.test.mjs
git commit -m "feat(panel): 左轨点动方向盘/步长/速度倍率（10%–100%，松手下发）"
```

---

### Task 7: 右轨控件 —— 位姿数值 + 六关节滑块（本地预览、松手下发）

**Files:**
- Modify: `src/client/twin-controls.js`
- Modify: `src/client/twin-panel.js`（把 `update(snapshot)` 接进来）
- Test: `test/twin-panel.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
test('★ 右轨：拖滑块只做本地预览，松手才发一条 joint 命令', async () => {
  const sent = []
  const panel = await mountTestPanel({ connected: true, simulated: true, onSend: (c) => sent.push(c) })
  const s = panel.root.querySelector('[data-ursim-joint="0"]')
  s.value = '30'
  s.dispatchEvent(new panel.window.Event('input'))
  assert.equal(sent.length, 0, 'input 期间不得下发')
  s.dispatchEvent(new panel.window.Event('change'))
  assert.equal(sent.length, 1)
  assert.equal(sent[0].mode, 'joint')
  assert.equal(sent[0].q.length, 6)
})

test('★ 右轨：位姿输入回车发 pose 命令；失败时回滚到最新帧值', async () => {
  const sent = []
  const panel = await mountTestPanel({ connected: true, simulated: true, onSend: (c) => sent.push(c), failNext: true })
  const input = panel.root.querySelector('[data-ursim-pose="x"]')
  input.value = '123'
  input.dispatchEvent(new panel.window.Event('change'))
  assert.equal(sent[0].mode, 'pose')
  await panel.flush()
  assert.equal(input.value, String(Math.round(panel.snapshot().tcp[0] * 1000)))
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test test/twin-panel.test.mjs 2>&1 | Select-Object -Last 8`
Expected: FAIL

- [ ] **Step 3: 实现右轨**

```js
/** 关节行：名称 24 + ◀ 22 + 滑块 + ▶ 22 + 度数 44（设计 §5）。 */
export function mountRightRail(doc, body, { send, strings, getState, previewJoint }) {
  const dragging = new Set();
  const poseBox = makeEl(doc, 'div', 'ursim-twin-pose')
  for (const key of ['x', 'y', 'z', 'rx', 'ry', 'rz']) {
    const input = makeEl(doc, 'input', 'ursim-twin-pose-input', 'data-ursim-pose')
    input.setAttribute('data-ursim-pose', key);
    input.type = 'number';
    input.step = key.startsWith('r') ? '0.001' : '1';
    // 位姿输入：用**最新帧**的其余分量拼成 6 元组（绝不用旧帧）—— 设计 §6 规则 3
    input.addEventListener('change', () => {
      const tcp = getState().tcp ?? [0, 0, 0, 0, 0, 0];
      const next = tcp.slice();
      const index = ['x', 'y', 'z', 'rx', 'ry', 'rz'].indexOf(key);
      next[index] = key.startsWith('r') ? Number(input.value) : Number(input.value) / 1000;
      send({ mode: 'pose', pose: next });
    });
    poseBox.appendChild(input);
  }
  body.appendChild(poseBox);

  const jointRows = [];
  for (let i = 0; i < 6; i += 1) {
    const row = makeEl(doc, 'div', 'ursim-twin-joint-row');
    const slider = makeEl(doc, 'input', 'ursim-twin-joint-slider', 'data-ursim-joint');
    slider.setAttribute('data-ursim-joint', String(i));
    slider.type = 'range';
    slider.min = '-360';
    slider.max = '360';
    slider.step = '0.1';
    // 拖动只预览（本地 FK 由面板做），松手才发一条 movej —— 设计 §6 规则 1
    slider.addEventListener('input', () => {
      dragging.add(i);
      previewJoint?.(i, Number(slider.value) * Math.PI / 180);
    });
    slider.addEventListener('change', () => {
      dragging.delete(i);
      const q = getState().q ? getState().q.slice() : [0, 0, 0, 0, 0, 0];
      q[i] = Number(slider.value) * Math.PI / 180;
      send({ mode: 'joint', q });
    });
    jointRows.push({ slider, value: makeEl(doc, 'span', 'ursim-twin-joint-value') });
    row.appendChild(slider);
    row.appendChild(jointRows[i].value);
    body.appendChild(row);
  }
  return {
    /** 每帧调用：只在**没有正在拖动**的轴上回填，避免把手从用户指下拽走。 */
    update(snapshot) {
      for (let i = 0; i < 6; i += 1) {
        if (dragging.has(i)) continue;
        const deg = (snapshot.q?.[i] ?? 0) * 180 / Math.PI;
        jointRows[i].slider.value = String(deg);
        jointRows[i].value.textContent = `${deg.toFixed(1)}°`;
      }
    },
  };
}
```

- [ ] **Step 4: 面板接上 `update(snapshot)` 与命令分发**

在 `twin-panel.js` 的每帧渲染处（`snap` 到位之后）调用 `right.update(snap)` 与 `left.sync()`；把 `send(cmd)` 按命令种类翻译成 HTTP：

```js
  async function sendCommand(cmd) {
    if (inflight) return;                       // 同组只允许一条在飞
    inflight = true;
    try {
      const res = await request(TWIN_JOG_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toJogBody(cmd)),
      });
      const body = await res.json();
      if (body?.ok !== true) throw new Error(String(body?.error ?? '宿主拒绝了这次控制'));
    } finally {
      inflight = false;
      left.sync();
    }
  }
```

`toJogBody` 按设计 §4 的键盘映射表把 `cmd` 翻成路由 body；`joint-commit` 用当前拖动值组成 6 元组；`pose-input` 用**最新帧的其余分量**拼成 6 元组（绝不用旧帧）。

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test test/twin-panel.test.mjs 2>&1 | Select-Object -Last 8`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/client/twin-controls.js src/client/twin-panel.js test/twin-panel.test.mjs
git commit -m "feat(panel): 右轨位姿数值 + 六关节滑块（本地预览、松手下发、失败回滚）"
```

---

### Task 8: 全量门禁 + 手动验收 + 版本

**Files:**
- Modify: `package.json` / `package-lock.json`（版本 → 0.3.0，这是**功能版本**不是补丁）
- Modify: `CHANGELOG.md` / `CHANGELOG.zh.md`

- [ ] **Step 1: 跑全量门禁**

```bash
npm run check 2>&1 | Select-Object -Last 6
npm test 2>&1 | Select-Object -Last 4
```
Expected: 两条都 exit 0；`npm test` 输出「共 N 项…失败 0」

- [ ] **Step 2: 真宿主校验**

```bash
$env:ELECTRON_RUN_AS_NODE='1'; & 'D:\Software\Nonead DSH Desktop\Nonead DSH Desktop.exe' scripts/check-host-compat.mjs 'D:\Software\Nonead DSH Desktop\resources\app.asar\node_modules' 2>&1 | Select-Object -Last 6; Remove-Item Env:ELECTRON_RUN_AS_NODE
```
Expected: `工具 schema 通过宿主真实 DSL — 89/89`、`result: 全部通过`

- [ ] **Step 3: 手动验收（逐条对设计 §12）**

1. 重启 DSH（link 安装不热更新）→ 打开面板 → 依次点 X+ / Y- / Z+ / 回零 / 旋转键，观察 3D 与 HUD 同步变化
2. 拖关节滑块：拖动中 3D 有预览、**机器人不动**；松手后才动
3. 速度滑块：拖到 50% 松手 → `ursim_get_speed_scaling` 读回 0.5、位姿不变
4. 真机模式（临时把 `motionMode` 设为 `real`）→ 控件禁用；直接用 `curl` 打 `/nonead-ursim/twin/jog` 应得 403

- [ ] **Step 4: 版本与更新日志**

```bash
npm version 0.3.0 --no-git-tag-version
```
然后两份 CHANGELOG 各加 `## [0.3.0] - 2026-10-19`（新增：面板实时控制；两条新工具；安全边界「只对仿真」），提交并打 `v0.3.0` 标签（与既有标签同为轻量）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore(release): 0.3.0（面板实时控制）"
git tag v0.3.0
```

---

## 风险与回滚

| 风险 | 处置 |
|---|---|
| 新路由成为「第二条写通道」被真机误用 | 宿主侧**自己**判定 `simIps`，不看客户端；真机一律 403（Task 1 Step 6） |
| 面板逐帧推送把用户拖拽的滑块拽回 | `update()` 跳过正在拖动的轴（Task 7 Step 3） |
| 命令堆叠撞 `WORKER_BUSY` | 面板 `inflight` 单飞 + 按钮置灰；worker 侧只允许 1 条在飞 |
| 工具面计数漂移（87→89）导致文档门禁红 | Task 4 Step 4 显式跑 `check:docs` |
| 整块功能需要回滚 | 只需回滚 4 个提交：路由（Task 1）、两个 op（Task 2/3）、前端（Task 5–7）互不依赖，可分别 revert |
