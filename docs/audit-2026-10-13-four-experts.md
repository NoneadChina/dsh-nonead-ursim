# dsh-nonead-ursim v0.1.1 全面审计 — 四位工程专家原始报告（2026-10-13）

> 来源：本会话内并行召唤的四位工程专家（安全工程师 / 软件架构师 / 高级开发者 / 技术文档工程师），
> 均为**只读审计**、未修改任何文件。报告按专家分节，逐条给出 文件:行、依据、影响与修法。
> 本轮已落地的修复见当日工作日志与 handoff/handoff-20261013-230655.md；
> 尚未处理的项目列在该账本的「进度与下一步」。

---
## 安全工程师
我查了记忆（本工作区白板/账本 + 跨工作区 dsh-nonead-universal-robots 的真机时代记录），确认了基线：v0.1.1 = 纯仿真、86 工具、远端 main=c6aa37f；也确认了本机对"动作类工具必须带 ip=127.0.0.1"的既有实测结论——本轮审计把它从"使用要点"升级成了**安全结论**（见 H-2/H-3）。审计全程只读，未修改任何文件。

---

# dsh-nonead-ursim v0.1.1 安全审计报告

**范围**：`lib/index.js`(1912)、`lib/worker.js`(590)、`lib/twin-routes.js`(827)、`lib/twin-worker.js`、`lib/pending-motion.js`、`python/ur_worker.py`(4585)、`python/ur_sim.py`、`python/URBasic/**`、`assets/models`、`requirements.txt`、门禁脚本与测试；另核对了宿主 `DesktopWebServer` 的实际鉴权层。
**部署标签约定**：`[真机]` = 仅当这台插件被接回真控制器时才成立；`[仿真]` = 仿真-only 部署下即成立；`[两者]` = 两种部署都成立。严重度按"该发现能真正发生的那种部署"给。

## 先说三个判断（直接回答你的四问）

1. **①"审批门能否被绕过"——问题问反了**：在 v0.1.1 里这个门**根本不参与防护**。`isOfflineSimTarget`（[lib/index.js:298](lib/index.js)）为真就免审批，而唯一合法目标就是那个保留回环地址，所以**只要仿真在跑，38 个受门禁的 op 全都不弹窗**。真正兜住"碰不到真机"的是 python 侧的 `_pin_sim_ip`，不是审批。门的**实现**是干净的（无共享状态、fail-closed、参数白名单、有回归测试）；**它的定位**才是问题（H-2）。
2. **②"真机不可达是否结构性成立"——成立，我逐层验证了三道闸**，并且发现唯一缺口是**守卫写成"开断言"**（H-5，可被一次无害 PR 静默破坏）。详见文末"已验证不是问题"。
3. **③④ 没有鉴权缺口，但有资源放大**：宿主对**所有**注册路由（含插件路由）套了一层 `x-dsh-desktop-renderer` 令牌判定（[app/lib/webserver.js:42-54](C:/Program%20Files/Nonead%20DSH%20Desktop/resources/app/lib/webserver.js)），插件自己的 Host/Origin/sec-fetch 围栏是第二道，写路由还额外要 Origin + JSON —— CSRF 过不去。但双生读路由**无并发上限**且与运动命令共用同一条 8 槽单线程队列（H-1）。路径穿越、SSRF 均**不成立**（无出网请求 + 严格 `[a-z0-9]+` 白名单）。
4. **⑤ 依赖面偏薄**：URBasic 是 vendored MIT、`requirements.txt` 无钉版本无哈希（L-2）；`assets/models` 里 5 个型号是 UR「Graphical Documentation」条款（非 OSI），已随包分发且 `THIRD_PARTY_NOTICES.md` 已如实标注 —— 这点合规而不是漏洞，但**它意味着这 20.86 MB 二进制是你再分发的责任**，若发布到 npm 需保持该声明随包。另有一个**硬编码真机 SSH 默认口令** `root/easybot`（L-3）。

---

## HIGH

### H-1 受门禁之外的物理副作用 op：`set_tcp` 等 7 个可被模型无审批触发 `[真机]`
**位置**：[lib/index.js:966](lib/index.js)（set_tcp）、[957](lib/index.js)（set_tool_voltage）、[1381](lib/index.js)（set_tool_output_mode）、[920](lib/index.js)（set_digital_out）、[940](lib/index.js)（set_analog_out）、[1056](lib/index.js)（set_conveyor_tick）、[1360](lib/index.js)（tool_communication）；对照 [lib/index.js:81-110](lib/index.js) 的 `APPROVAL_OPS`。

**可利用条件**：任何一次真机部署的模型回合：`ursim_set_tcp` / `ursim_set_tool_output_mode` 是无审批的普通工具调用（模型不需要绕过任何东西）。步进验证：`python scripts/check-approval-gate.py` 实测输出 **NOT GATED 46 项**，上面 7 个都在其中。

**影响**：这 7 个不是"读"，而是持久改变物理行为或致动外部设备：
- `set_tcp` 改的是**此后每一次运动**的参考点（与已受门禁的 `motion_version` 同类：一个改规划方式、一个改坐标系，却一个有门禁一个没有）；
- `set_tool_output_mode` / `set_tool_voltage` 改工具法兰针脚语义与电压，**该工具自己的描述就写着"接错可能损坏工具"**；
- `set_digital_out` / `set_analog_out` 能致动夹爪、传送带、焊机等外设；
- `tool_communication` 开 TCI 会**禁用工具端模拟输入**（复用同一对针脚）。
一句话：模型可以在无人确认的情况下让外部设备动作、或让后续所有运动按错误的基准执行。

**修法**（三处一起改，缺一不可）：
1. 把上述 7 个 op 加进 `APPROVAL_OPS`（[lib/index.js:81](lib/index.js)）；
2. 同步加进 [scripts/check-approval-gate.py:21-36](scripts/check-approval-gate.py) 的 `MUST_BE_GATED`；
3. 把 [test/approval-gate.test.mjs:497-507](test/approval-gate.test.mjs) 那条"兄弟 op 不得一个门禁一个不门禁"的成对断言，扩展成显式家族规则：`set_tcp↔motion_version`、`set_tool_voltage↔set_tool_output_mode↔tool_communication`、`set_digital_out↔set_analog_out`（后两者可合并为"任何写 I/O 的 op"）。

### H-2 "免审批"是模型可以自己授予自己的状态 `[真机]`
**位置**：[lib/index.js:298](lib/index.js)（`isOfflineSimTarget`）、[512-515](lib/index.js)（门禁判定）、[1493-1510](lib/index.js)（`ursim_sim_start` 工具，**不在 APPROVAL_OPS 里**）、[531-537](lib/index.js)（sim_start 成功即 `simIps.add`）。

**可利用条件**（两步，都在模型的正常能力范围内，且都不需要人确认）：
```
ursim_sim_start {model:"ur5e"}          → 宿主 simIps.add('127.0.0.1')（无审批）
ursim_movej {ip:"127.0.0.1", q:[...]}   → simTarget=true → 跳过 requestApproval → 直达 worker
```
`simIps` 一旦置位，直到显式 `sim_stop` 或自愈注销前都为真。也就是说"是否弹人工确认"这个开关，**由被监督的对象自己控制**。

**影响**：在仿真-only 部署下后果为零（目标只能是纯内存虚拟机器人，这是事实）。但在**父线恢复真机路径**、或保留回环地址上出现真控制器（SSH 端口转发 / Docker 端口映射 / 本机 URSim —— 注意 [python/ur_worker.py:334-338](python/ur_worker.py) 的错误文案本身就在教模型"把它当成一台真机，用 ursim_connect 指向它的 IP"）时，H-2 就是**完整的运动审批绕过**：先自授豁免、再无审批驱动真机。

**修法**（关键是换权威来源，不是加判断）：
1. 豁免判据改为 **worker 的权威回答**，而不是宿主侧的集合：在门禁处先做一次带预算的 `sim_status` 探针（缓存 ≤1 s），仅当返回 `{simulated:true, active:true, ip:SIM_IP}` 时才免审批；或直接要求"该 op 的响应带 `simulated:true`"，把豁免放在**事后校验**而不是事前放行；
2. `sim_start` 归入"改变安全状态"的范畴：在存在真机通道的构建里对它也要审批（至少要求人类确认"现在允许无审批仿真动作"）；
3. 顺带修掉 [python/ur_worker.py:4091-4104](python/ur_worker.py) 与 [334-338](python/ur_worker.py) 的自相矛盾指引：错误文案让模型去用 URSim 的 IP，而 `_sim_requested_ip` 会拒绝任何非回环地址。文案改为"URSim 需另装真机版；本插件只做运动学仿真"。

### H-3 双生读路由无并发上限，可占满 8 槽 worker 队列，使**停止类指令**失败 `[两者]`（真机部署升级）
**位置**：[lib/index.js:1677-1694](lib/index.js)（`/twin/stream` 注册，无连接数上限）、[lib/twin-routes.js:674-717](lib/twin-routes.js)（每连接 100 ms 泵 + 每帧一次 worker 读，只保证"单连接内一帧在飞"）、[lib/worker.js:54](lib/worker.js) + [470-476](lib/worker.js)（`maxInFlight=8`，超限直接抛 `WORKER_BUSY`）。

**可利用条件**：任何能过宿主令牌围栏的调用方（渲染器本身；或宿主设置里"普通浏览器访问"打开时的任意本机浏览器/脚本）连续开 8 条 `GET /nonead-ursim/twin/stream`（或高频打 `/twin/state?detail=1`）。不需要任何凭据、不需要 Origin。

**影响**：worker 是单线程 stdin 队列，8 条流各自占一个在飞请求后，**所有**工具调用（包括 `ursim_stopj`/`ursim_stopl`/`ursim_stop_program` 这类"让它停下来"的指令）在队友超时前一律返回 `WORKER_BUSY`。仿真下 = 工具短暂不可用；真机部署下 = **你在机械臂运动时打不出停止指令**。每连接还常驻一个定时器与一个 SSE 长连接（无上限、无 TTL），属可累积的资源放大。

**修法**：
1. 给 `/twin/stream` 加并发上限（建议 2–4，超出返回 503 + 明确 code）与最短订阅 TTL；断连即减计数；
2. `/twin/state` 的 `detail=1` 加最小间隔节流（服务端按连接/IP 记录 last-detail-at，例如 ≥1 s）；
3. 结构性修法：给运动类 op 保留**优先槽位**（例如把 `maxInFlight` 拆成"运动保留 2 槽 + 读共享 6 槽"），保证任何时刻都留得下一条停止指令。

---

## MEDIUM

### M-1 `send_script` 的审批弹窗只给人看 240 字符，等于盲批 `[真机]`
**位置**：[lib/index.js:112-118](lib/index.js)（`summarizeArgs` = `JSON.stringify(args).slice(0, 240)`）、[140](lib/index.js)（拼进审批 `reason`）；[lib/pending-motion.js:139-143](lib/pending-motion.js)（send_script 归为 `opaque`，只给一句"请在执行前确认现场安全"）；python 侧 [lib/index.js:707](lib/index.js) 对应的 `op_send_script` 把 script 原样下发到控制器。

**可利用条件**：真机部署下模型提交一段 >240 字符的 URScript（或刻意把危险指令放在第 240 字符之后）。审批服务只收到 `reason` 一个文本字段，`allowed-once` 授权的是**工具名**而不是内容。

**影响**：人类批准的是"看不见的载荷"。URS 控制器会忠实地执行截断段之后的一切（含 `set_payload`、速度、`movej`、I/O）。这是这轮审计里最接近"用审批制度骗过审批制度"的一条。

**修法**：
1. 对 `send_script` 取消 240 字符截断，改为三段式：脚本全文（或前 40 行 + "…共 N 行"）+ 字节长度 + `sha256` 前 16 位；
2. 长度设硬上限（例如 8 KB），超限直接拒绝下发并提示拆分；
3. 在 python 侧把"下发的脚本"与"审批时摘要的内容"绑定：审批通过后带上摘要哈希，worker 校验后不匹配就拒（把"人批的"和"机器执行的"钉在一起）。

### M-2 "真机不可达"的守卫是**开断言**，可被一次无害 PR 静默破坏 `[仿真]`
**位置**：[test/sim-only.test.mjs:34-42](test/sim-only.test.mjs) —— 只断言 `SIM_PASSTHROUGH_OPS` 里**有** `sim_start/sim_stop/sim_status/ping/shutdown_worker/connect/disconnect`，**不断言"只有"**这些；[scripts/check-worker-ops.py](scripts/check-worker-ops.py) 全程不看这个集合。

**可利用条件**：一次把 `"list_programs"`（SSH 到机器人）、`"send_script"`、`"power_off"` 之类加进那个 frozenset 的提交 —— 这是最容易被误加的一类，因为它们在文件名/语义上"看起来像仿真生命周期或运维"。加完之后：`route_op`（[python/ur_worker.py:4517](python/ur_worker.py)）立刻放它落到 `HANDLERS`，真机实现重新可达，而 **4 个静态门禁 + 全部测试都不会红**。

**影响**：整个 v0.1.1 的安全契约只有这一处开关，且这处开关的守卫是"白名单包含"而非"白名单相等"。

**修法**：
```js
// test/sim-only.test.mjs，替换第 36-42 行
assert.deepEqual([...passthrough[1].matchAll(/"([a-z_0-9]+)"/g)].map(m => m[1]).sort(),
  ['connect','disconnect','ping','shutdown_worker','sim_start','sim_status','sim_stop'],
  'SIM_PASSTHROUGH_OPS 是闭集：新增一项即重新打开真机实现');
```
并在 [scripts/check-worker-ops.py](scripts/check-worker-ops.py) 里加同一条（该脚本已有 `HANDLERS` 解析器，加 5 行即可）。

### M-3 `/twin/asset` 每个请求都全量读盘 + SHA-1，**304 路径也不例外** `[仿真]`
**位置**：[lib/twin-routes.js:774-788](lib/twin-routes.js) —— `readFile(file)` → `createHash('sha1').update(body)` → 再比较 `If-None-Match`；命中 304 时文件已经读满并算完哈希。

**可利用条件**：任何能过令牌围栏的调用方循环请求 `/nonead-ursim/twin/asset?model=ur20&If-None-Match=x`（错的 ETag 即可）。GLB 单个 0.7–3.5 MB，SHA-1 是纯 CPU。

**影响**：纯资源放大（几十 req/s 就能吃掉一个核，同时反复分配 2–3 MB Buffer）；不需要 worker、不需要仿真在跑，因此在仿真-only 下同样成立。另外**无 Range 支持**，客户端每次都要整份传。

**修法**：
1. 启动时（或首次读取后）建 `model → {size, mtimeMs, etag, buf?}` 表，304 分支只比表、不读盘；
2. 更省：`etag` 用 `"${size}-${mtimeMs}"`（弱验证器足够，因为文件随包不可变）；
3. 加 `Range`/`Accept-Ranges` 支持，或至少把 2 MB 档的响应改为流式 `createReadStream`。

### M-4 同一个 handler 两条入口两种强度：`/twin/state` 钉死 ip，`/twin/stream` 不钉 `[仿真]`（纵深防御）
**位置**：[lib/index.js:1712-1719](lib/index.js)（state 路由显式 `ip: SIM_IP` 并写明了理由）↔ [lib/index.js:1684-1691](lib/index.js)（stream 路由把 `req` 直接交给 handler）→ [lib/twin-routes.js:684](lib/twin-routes.js)、[691](lib/twin-routes.js)（`queryOf(req.url)` 原样交给 `readState`）→ [268-294](lib/twin-routes.js)（`query.ip` 直达 `worker.call('get_joint_pose', {ip})`）。

**结论先说**：**不构成当前可达漏洞**。今天 stream 的 `?ip=` 被 `connectedIps` 兜住（[twin-routes.js:292-293](lib/twin-routes.js) 对不在登记表里的 ip 直接返回 `robot_not_connected`，不碰 worker），而登记表只可能在 `await worker.call('connect', …)` **成功**后写入（[lib/index.js:519-520](lib/index.js)）—— 真机 IP 会被 worker 用 `SIM_BADARG` 拒掉，所以表里只可能是 `127.0.0.1`。

**为什么仍然要修**：这句"安全"叠了**两个隐式不变量**（connect 必然失败 + 登记表只含回环），而同一个 handler 的另一条入口用的是**显式钉死**。父线一旦让 connect 对真机成功，stream 路由立刻变成"可指定任意 IP 的取数入口"（虽然仍受同源策略保护，读不到跨站，但"孪生取数永远落不到真机"这个口径就破了）。

**修法**：把钉死下沉到 handler 或让两条入口共用同一个包装器，例如 `createTwinStreamHandler({ ...deps, pinIp: SIM_IP })`，并在 handler 内 `if (pinIp) query.ip = pinIp`（同时保留 `?ip=` 的解析以便将来放开）。改完加一条测试：带 `?ip=192.168.1.77` 请求 stream，断言**从未**出现 `get_joint_pose` 且 ip 非回环的 worker 调用。

---

## LOW

### L-1 `python/sitecustomize.py`：一个放在 PYTHONPATH 目录里、每次起 worker 都会自动执行的代码位 `[仿真]`
**位置**：[python/sitecustomize.py:26-33](python/sitecustomize.py)（往 `sys.path` 追加 `C:\Users\tonyke\...\site-packages`）；触发点 [lib/worker.js:256](lib/worker.js)（`PYTHONPATH: this.pythonDir`）。CPython 的 `site` 会在**任何**以该 PYTHONPATH 启动的解释器里自动 import 它。
**条件与影响**：文件被 `.gitignore` 与 `package.json` 的 `files` 双双排除（不会分发），硬编码路径的用户名 `tonyke` 与本机 `tonyk` 不匹配，**当前是 no-op**。但插件目录在用户 profile 下，且安装链路是本地目录/pnpm 拷贝 —— 任何能写该目录的人放一个 `.py`（含 `sitecustomize.py`、或劫持 `ur_sim.py`/`numpy.py`）都能在 worker 起来之前执行。
**修法**：把垫片移出 PYTHONPATH 目录（单独目录只作 `PYTHONPATH` 的第二项）；worker 启动前校验 `PYTHONPATH` 目录内 `.py` 白名单；README 所述"装好 requirements 后删除"应升级为门禁（`--selfcheck` 里检测到该文件就告警）。

### L-2 依赖未钉版本/无哈希；`paramiko` 被算进必需项却只服务一条不可达路径 `[仿真]`
**位置**：[requirements.txt:3-4](requirements.txt)（`numpy>=1.21`、`paramiko>=2.11`，无上限、无哈希、无锁文件）；[python/ur_worker.py:4438-4460](python/ur_worker.py)（`--selfcheck` 把 paramiko 计入 `ok` 条件）；paramiko 唯一的用途在 [python/ur_worker.py:1347](python/ur_worker.py) 的 `list_programs` —— 而该 op 在本版本是 `SIM_UNSUPPORTED`（不可达）。
**影响**：worker 启动即 `import URBasic`→numpy（[python/ur_worker.py:222](python/ur_worker.py)），供应链面取决于浮动的 `numpy>=1.21`；`paramiko>=2.11` 覆盖了 Terrapin 等已修漏洞的旧版本区间。同时本机没装 paramiko 时 `test:python` 直接红，而它在本插件里毫无用处。
**修法**：`numpy==<pin> --hash=...`、`paramiko` 移入 optional extra；`selfcheck` 把 paramiko 降级为"可选、缺失只告警"；发布前跑 `pip-audit`/`npm audit`（后者目前无 runtime deps，干净）。

### L-3 `list_programs` 硬编码真机 SSH 默认口令 `root/easybot`，且把口令写进模型可见的工具描述 `[真机]`
**位置**：[python/ur_worker.py:1349-1354](python/ur_worker.py)（`password = p.get("password","easybot")`、`username` 默认 `root`、`AutoAddPolicy()` 接受任意主机密钥）；[lib/index.js:698](lib/index.js) 与 [702](lib/index.js)（描述里写"默认账号 root/easybot"，参数默认值再写一遍）。
**影响**：当前不可达（`route_op` → `SIM_UNSUPPORTED`），但代码库与**模型上下文**里都留着一条"用固定弱口令登录真机、且不校验主机密钥"的路径；模型会把它抄进日志/报告，运维也会照抄。它同时也是一条 MITM 面（`AutoAddPolicy`）。
**修法**：默认值改为空并强制显式提供；`AutoAddPolicy` → `RejectPolicy` + 预置 `known_hosts`；工具描述里删除默认口令；若该 op 永远只对 URSim 有意义，则把它从真机工具面移除。

### L-4 ip 归一化两侧不一致：尾随空格会让宿主多弹一次窗 `[两者]`
**位置**：宿主严格相等 [lib/index.js:298](lib/index.js)（`ip === SIM_IP`，**不 trim**）↔ python 会 trim 后接受并**改写** [python/ur_worker.py:4473-4480](python/ur_worker.py)（`str(raw).strip() == SIM_IP` → `params["ip"] = SIM_IP`）。
**结论**：**不构成绕过**（方向是 fail-closed：带空格 → 宿主判为"真机" → 弹窗；即使被批准，python 仍走仿真）。但后果是真故障体验：`" 127.0.0.1"` 与 `"127.0.0.1"` 行为不同，在 approval=never 的会话里表现为"命令被拒"，极易被误诊为 worker 故障。
**修法**：宿主侧也归一化（`const norm = (v) => typeof v === 'string' ? v.trim() : v`，在 `sanitizeArgs` 后对 `ip` 统一处理），并加一条测试覆盖 `' 127.0.0.1'` / `'127.0.0.1\n'` / `'127.0.0.1 '` 三种写法。

### L-5 `pendingMotion` 是单槽：重叠审批时"先看后动"的预览会错位 `[两者]`（仅当审批真会触发时才有意义）
**位置**：[lib/pending-motion.js:154-171](lib/pending-motion.js)（`current` 单变量 + token 匹配）、读口在 [lib/twin-routes.js:407](lib/twin-routes.js)。
**条件与影响**：A `begin` → B `begin`（覆盖）→ B `end`（清空）→ 此时 **A 仍在等人点确认，但面板上的待审批目标已经消失**。方向是 fail-visible（少显示，不是假装安全），所以不是漏洞；但"先看后动"的承诺在并发/重叠时失效，而模型在同一回合里发多条运动指令是常态。
**修法**：`current` 改成 `Map<token, preview>`，`read()` 返回数组（或"最近一条 + 未结束计数"）；TTL 逐条清理。

### L-6 门禁缺失时的报错文案把"关掉门禁"列为第一选项 `[两者]`
**位置**：[lib/index.js:127-129](lib/index.js) —— `"...可设 requireApprovalForMotion=false 禁用，或补装 @deepseek-ai/dsh-user-approval"`。
**影响**：这是唯一一道人工确认（在真机部署里），文案却在教调用方（也就是模型）走捷径关掉它；模型会把这句话原样转述给用户。
**修法**：调换顺序并加约束，例如 `"…请先补装审批服务；确需关闭请由人工修改插件配置 requireApprovalForMotion=false（不建议在真机部署中关闭）"`。同时建议在 `apply()` 里当 `requireApprovalForMotion===false` 时打一条 `logger.warn` 落盘留痕。

### L-7 `simHandler` 是唯一的 HTTP→worker 写路径：必须永远只调三个字面量 op `[仿真]`（护栏）
**位置**：[lib/index.js:1839-1868](lib/index.js)。当前实现是安全的：只构造 `{model,preset,speed_scaling}` 三个白名单键（[1851-1857](lib/index.js)），只调 `'sim_start'`/`'sim_stop'`/`'sim_status'` 三个字面量，**不转发请求体里的 op**；`speed_scaling` 另有 python 侧 `_clamp_speed` 兜底到 `[0.01,1.0]`（[python/ur_sim.py:750-757](python/ur_sim.py)），未知型号走 `SIM_UNKNOWN_MODEL`。
**风险**：这是全插件唯一"外部输入能驱动 worker"的地方。它一旦被泛化成"按请求体转发 op"（为了减少工具面重复代码，这是很自然的下一步重构），就等于"任何能过宿主令牌围栏的本机进程都能开动机械臂"。
**修法**：在这里加一条单元测试断言（读 `lib/index.js` 源码，断言该 handler 内出现的 `worker.call('…'` 字面量集合恰为这三个），并在函数头写死这条不变量 —— 与 M-2 的思路相同：**把不变量变成会红的断言**。

---

## 已验证**不是**问题（避免你重复劳动）

| 检查项 | 证据 |
|---|---|
| `op`/`id`/`_timeout_ms` 参数注入（H-1 历史洞） | [lib/index.js:490-500](lib/index.js) 按工具声明的参数表白名单过滤；回归测试 [test/approval-gate.test.mjs:305-332](test/approval-gate.test.mjs) 覆盖（含"受门禁工具也不能被改派"的对称面） |
| 审批门 fail-closed / 重叠审批复用 | [lib/index.js:143](lib/index.js) 只认 `allowed-once`；无"已批准"共享标记；宿主 `OUTCOMES` 里缺 answerer → `unavailable` → 视为拒绝（`dsh-user-approval` 语义一致） |
| 真机地址被拒且**无副作用** | [test/sim-only.test.mjs:60-64](test/sim-only.test.mjs) 断言 `SIM_BADARG` **且**"被拒的调用不得顺手开仿真" |
| 路径穿越 | [lib/twin-routes.js:48](lib/twin-routes.js) `^[a-z0-9]+$` 表达不了 `/`、`.`、`..`；[766-771](lib/twin-routes.js) 另有 `startsWith(root+sep)` 兜底（作者自己注明"白名单放松后也拦得住"） |
| SSRF | 插件 host 半零出网请求；资产路由只读本地白名单文件；sim 是纯内存。唯一出网代码在**不可达**的真机 op 里 |
| shell/命令注入 | [python/ur_worker.py:409-424](python/ur_worker.py) 拒绝控制字符与 shell 元字符，[1375](python/ur_worker.py) 另加 `shlex.quote` |
| CSV/CSRF（唯一写路由） | [lib/index.js:1816-1822](lib/index.js) 要求 Origin 存在且与 Host 同源 + `content-type: application/json`；[1625-1645](lib/index.js) 另有 `sec-fetch-site: cross-site` 拒绝；跨站表单发不出 JSON，fetch 过不了 preflight |
| 协议行注入 / NaN | payload 展开顺序洞已被白名单堵死；[python/ur_worker.py:4313](python/ur_worker.py) `allow_nan=False` 防非法 JSON；推送行用"无 id"区分且先于响应匹配（[lib/worker.js:380-383](lib/worker.js)） |
| 日志注入与磁盘放大 | 用户值走 `%r`（repr 转义换行）；日志有 8 MB×2 上限 + 线程安全滚动（[python/ur_worker.py:128-190](python/ur_worker.py)） |
| 环境变量泄漏 | [lib/worker.js:36-46](lib/worker.js) 剔除 `DSH_*` 与 `KEY|PASSWORD|SECRET|TOKEN`；仅 `DSH_URSIM_TWIN_PUSH` 显式放行（附理由） |
| 子进程侧鉴权 | 宿主 [app/lib/webserver.js:42-54](C:/Program%20Files/Nonead%20DSH%20Desktop/resources/app/lib/webserver.js) 对**每一个**注册路由（含插件路由）套 `x-dsh-desktop-renderer` 令牌判定；插件围栏是第二道 |
| 二进制许可 | `THIRD_PARTY_NOTICES.md` 已逐型号标注 BSD-3 与 UR「Graphical Documentation」两类，并说明 5 个新型号**已随包分发**（合规声明完整，非漏洞） |

**一句话总结**：这个版本的"碰不到真机"我信得过（三层闸逐条查过，唯一缺口是守卫写成开断言 M-2）；真正需要在接真机前修的是 **H-1（7 个物理副作用 op 未门禁）+ H-2（豁免由模型自授）+ H-3（读路由能饿死停止指令）**，加上 **M-1（脚本盲批）**。

**已写记忆**：今日日志新增本轮只读审计条目；项目笔记追加"安全审计结论（2026-10-13）"，含三层闸的位置、"审批门在仿真-only 下等于不生效"这一结论、`ursim_connect` 不登记 `simIps` 的 fail-closed 事实、state/stream 钉死不一致、以及宿主 `DesktopWebServer.permits()` 令牌层这条宿主侧事实 —— 供后续会话直接引用，不必重查。

## 软件架构师
# dsh-nonead-ursim 架构与可维护性审计（只读，未修改任何文件）

## 结论摘要

这个仓库的**设计意图与注释质量远高于同类插件**：失败降级策略、跨语言契约、门禁脚本、42 个测试文件都是真实存在的工程约束，不是摆设。问题不在"写得差"，而在**同一个事实被复制到太多地方，且复制品之间没有机械对账**——它靠人眼和注释维持一致，规模一旦继续长就会开始静默漂移。

五条最关键的判断：

1. **不是"上帝模块"问题，是"上帝表"问题**。模块虽有 2000/4600 行，但内部边界清楚（协议层/路由层/仿真层/渲染层分得开）。真正咬人的是 **86 个工具散落在 11~12 处触点**，其中 3 处没有任何门禁保护。
2. **有 1 个门禁会在"解析失配"时静默放行**（[scripts/check-tool-params.py](scripts/check-tool-params.py)），另外 3 个用同一条正则会 FAIL——这决定了第 2 步重构必须先改门禁、再改数据。
3. **状态归属是三层各存一份，且有两份已被硬编码作废**：真机多机语义（`ips`/`AMBIGUOUS`/目标 IP）在 [lib/index.js:1717](lib/index.js#L1717) 被钉死到 `127.0.0.1` 之后整条链不可达，但宿主、客户端、UI 三处仍在维护它。
4. **"仿真态只活在子进程内存里"的补偿方案是 monkey-patch**（[lib/index.js:407](lib/index.js#L407) 包 `worker.call`），并且它的探测预算（5000 ms）**大于**孪生读预算（2500 ms），存在周期性孪生帧超时的静态隐患（推演，未实测）。
5. **扩展成本可量化**：新增机型 4 处代码 + 3 处文档；新增工具 3 处强制 + 6~9 处条件；新增可视化图层 4~6 处且全部落在同一个 2000 行函数体内。

---

## 一、实测基线

| 文件 | 行数 | 占该层比例 | 判读 |
|---|---|---|---|
| [python/ur_worker.py](python/ur_worker.py) | 4585 | 100% of Python worker | 协议+路由+真机 op+仿真 op+日志+推送线程，六种职责 |
| [lib/index.js](lib/index.js) | 1912 | — | **564–1526 行 = 963 行 = 50.4% 是工具声明表**（纯数据） |
| [src/client/twin-panel.js](src/client/twin-panel.js) | 2017 | 55% of client | 单个 `mountTwinPanel()` 函数体约 1470 行、约 40 个可变 `let` |
| [lib/twin-routes.js](lib/twin-routes.js) | 827 | — | 4 个 handler 工厂，纯逻辑可测（设计良好） |
| [python/ur_sim.py](python/ur_sim.py) | 815 | — | 运动学，边界干净 |
| [lib/client.js](lib/client.js) | 3971 行 / 667 KB | — | **被提交的构建产物**，有哈希门禁守住（设计良好） |

表规模实测：`HANDLERS` 87 键、`SIM_OPS` 31 键、`tools[]` 86 条、`APPROVAL_OPS` 47 条、`MUST_BE_GATED` 40 条、`assets/kinematics.json` 14 键、`assets/models/*.glb` 14 个。测试 42 个文件（manifest 记 28 nodeOnly + 14 pythonDependent），8 个门禁脚本接入 `npm test`。

---

## 二、① 职责边界与重复逻辑

### 2.1 "上帝模块"其实不是首要问题

三个大文件都有**已经存在的、可用的缝**：

- [lib/index.js](lib/index.js)：`makeTool()`（490–562）与 `tools[]`（564–1526）本来就该分开；`apply()` 里混着 5 件不相干的事——worker 生命周期、审批、仿真自愈、型号/连接登记、HTTP 路由挂载。
- [src/client/twin-panel.js](src/client/twin-panel.js)：`mountTwinPanel()` 内部其实已经分成清晰的小节（DOM 构建 636–873 / 场景懒创建 1063 / 数据通道看门狗 1198 / 仿真开关 1231–1471 / 连接态 1474 / 模型加载 1575 / 时间轴锚定 1679 / 轨迹 1690 / HUD 1746 / 单帧 1802 / dispose 1970）。这是"该拆但没拆"，不是"混成一团"。
- [python/ur_worker.py](python/ur_worker.py)：`route_op()`（4505）已经把"真机 op"整条隔离成**不可达**——`SIM_PASSTHROUGH_OPS`（266）之外的一切都进 `sim_dispatch()`。所以 3000 行真机实现目前是**结构性死代码**（仅 `connect`/`disconnect`/`ping`/`shutdown_worker`/`sim_*` 7 个 op 会落回 `HANDLERS`）。

### 2.2 重复逻辑清单（带行号，可直接改）

| # | 重复内容 | 位置 A | 位置 B | 风险 |
|---|---|---|---|---|
| D1 | `SIM_IP = '127.0.0.1'` | [lib/index.js:295](lib/index.js#L295) | [python/ur_worker.py:254](python/ur_worker.py#L254)、[src/client/index.js:38](src/client/index.js#L38)、[twin-panel.js:1233](src/client/twin-panel.js#L1233) | 4 份，无门禁 |
| D2 | SSE 事件名 `frame-error` / `stale` | [lib/twin-routes.js:546,549](lib/twin-routes.js#L546) | [src/client/robot/twin-stream.js:47,50](src/client/robot/twin-stream.js#L47) | 客户端注释写"保持一致"，靠人眼 |
| D3 | 失败码 `no_robot`/`robot_not_connected`/`ambiguous_robot`/… | `TWIN_CODES` [lib/twin-routes.js:64](lib/twin-routes.js#L64) | `describeDisconnected()` 的 `switch` 字面量 [twin-panel.js:187](src/client/twin-panel.js#L187) | 客户端**不能** import twin-routes（它拉 `node:fs`），所以只能复制 |
| D4 | 型号清单 | `kinematics.json`（14 键） | [convert-meshes.py:37](scripts/convert-meshes.py#L37)、[build-assets.mjs:30](scripts/build-assets.mjs#L30)、[model-contract.test.mjs:21](test/model-contract.test.mjs#L21)、[twin-panel.js:1250](src/client/twin-panel.js#L1250)、[lib/index.js:1504](lib/index.js#L1504) | 6 处，其中 twin-panel 是**手写字面量** |
| D5 | 仿真启停后的宿主登记表更新 | `makeTool.execute` 的 `sim_start` 分支 [lib/index.js:531–543](lib/index.js#L531) | `applySimEnabled()` [lib/index.js:1825–1837](lib/index.js#L1825) | **同一逻辑两份**，任何一处漏改就出现"仿真开着但面板说未连接" |
| D6 | `timeoutMs: config.commandTimeoutMs` | 37 处逐条重复 | — | 应为 `makeTool` 的默认值 |

### 2.3 可达性死代码（读者会误判"这是活的"）

- **多机器人选择链**：`TWIN_CODES.AMBIGUOUS` + `ips` 候选 [lib/twin-routes.js:278–290](lib/twin-routes.js#L278) → `state.js` 的 `ips` 字段与 `setIp()` [state.js:307](src/client/state.js#L307) → `hudRobots` 按钮渲染 [twin-panel.js:1755–1771](src/client/twin-panel.js#L1755) → `strings.js` 文案。而 [lib/index.js:1717](lib/index.js#L1717) 把 `ip` 硬钉到 `SIM_IP`，`knownIps()` 最多返回 1 项，`ips.length > 1` **永不成立**。
- **`layers.cog`**：`createCogMarker()` 已建、已挂场景、已纳入 `applyLayers()`/`dispose()`，但没有按钮、`cog: false` 恒假（[twin-panel.js:721](src/client/twin-panel.js#L721) 自述原因是缺读回 op）。
- **死导入**：`formatForce` 在 [twin-panel.js:75](src/client/twin-panel.js#L75) 被 import，全文件零调用（力的展示只走箭头）。
- **客户端持有"目标 IP"概念**：`state.setIp()` / `getIp()` 存在，但宿主忽略 `?ip=`，Python 只认回环——三层里两份是空转。

---

## 三、② 86 个工具的注册与 schema 一致性

### 3.1 新增一个工具，实测要改 11~12 处

| 触点 | 文件 | 强制? | 有门禁吗 |
|---|---|---|---|
| 1 工具声明（op/toolName/description/parameters/timeoutMs） | [lib/index.js:564–1526](lib/index.js#L564) | 必须 | — |
| 2 `APPROVAL_OPS`（若会动/改物理状态） | [lib/index.js:81–110](lib/index.js#L81) | 条件 | ✅ `check-approval-gate.py` 查"门禁项是否真实存在" |
| 3 `op_xxx()` 实现 | [python/ur_worker.py](python/ur_worker.py) | 必须 | — |
| 4 `HANDLERS{}` | [ur_worker.py:4187](python/ur_worker.py#L4187) | 必须 | ✅ `check-worker-ops.py` 双向查 |
| 5 `SIM_OPS{}` + `_sim_xxx()` | [ur_worker.py:4033](python/ur_worker.py#L4033) | 条件 | ❌ **无** |
| 6 `sim_capabilities()` 的 read/motion 名单 | [ur_worker.py:295](python/ur_worker.py#L295) | 条件 | ❌ **无** |
| 7 `MUST_BE_GATED` | [check-approval-gate.py:21](scripts/check-approval-gate.py#L21) | 条件 | 半：漏加只打印到 ungated 清单 |
| 8/9 README.md + README.zh.md 表格行与总数句 | [README.md](README.md)、[README.zh.md](README.zh.md) | 必须 | ✅ `check-doc-tools.mjs` |
| 10 `pending-motion.js` 的三张映射 | [pending-motion.js:24–41](lib/pending-motion.js#L24) | 条件 | ❌ **无** |
| 11 CHANGELOG × 2 | [CHANGELOG.md](CHANGELOG.md) | 惯例 | — |
| 12 `test-manifest.json` + 测试文件 | [test-manifest.json](test/test-manifest.json) | 条件 | ✅ `check-test-manifest.mjs` |

**实测出的三处门禁缺口**（这是本节最有价值的发现）：

- **`SIM_OPS` 无任何校验**。`check-worker-ops.py` 只比对 `HANDLERS` 与 `tools[]`。`SIM_OPS` 的键名打错一个字，`sim_dispatch()` 会走 `SIM_UNSUPPORTED` 分支（[ur_worker.py:4080](python/ur_worker.py#L4080)）——工具照常注册、照常返回一条"仿真没有这个语义"的**看似合理**的错误，没有任何测试或门禁会红。这是典型的静默降级。
- **命名空间不一致且无对账**。我实测了 `sim_capabilities()` 与 `SIM_OPS` 的交集：出现 `get_status`/`get_uptime`（工具名）对 `status`/`get_time`（op 名）两处不匹配——**能力清单写工具名，`SIM_OPS` 写 op 名**。现存代码是对的（这 2 个工具确实有仿真实现），但这意味着这一层**无法做机械对账**，只能人眼。
- **`pending-motion.js` 零覆盖**。漏登记一个运动工具，唯一症状是审批弹窗退化为 `opaque` 文字（"该动作没有单一目标位姿"）——看起来像设计如此，不像缺陷。

### 3.2 4 个门禁共用同一条脆弱正则，其中 1 个会静默放行

`check-worker-ops.py`、`check-tool-params.py`、`check-approval-gate.py`、`check-doc-tools.mjs` 都靠 `op:\s*'([a-z_0-9]+)',\s*\n\s*toolName:\s*'(ursim_…)` 解析 [lib/index.js](lib/index.js)。这个正则**要求 op 与 toolName 相邻两行、且顺序固定**。任何重排（加字段、改单行、换成生成器输出）都会让它解析到 0 个工具，后果我逐条推演过：

| 门禁 | 正则失配时的行为 |
|---|---|
| `check-worker-ops.py` | `orphan_ops` = 全部 87 个 → **FAIL**（好事） |
| `check-approval-gate.py` | 同上 → **FAIL**（好事） |
| `check-doc-tools.mjs` | 全部表格行变"陈旧" → **FAIL**（好事） |
| **`check-tool-params.py`** | `tools={}` → 循环空转 → 打印 `ops with a contract mismatch: 0 / 0` → **PASS**（❌ 静默放行） |

`check-tool-params.py` 还有一处结构性妥协：`HELPER_READS` 白名单（129–134 行）硬编码了 4 条"静态扫描跟不上共享助手"的豁免。这说明**用文本启发式做跨语言契约检查已经到极限**。

### 3.3 降低维护成本的方案（生成 + 契约测试）

**A. 抽出一份 op 注册表作为单一真源**：`lib/op-registry.js`（或 `ops.json`），每条登记 `{op, tool, summary, approval, sim, parity}`。然后**生成**派生面：`lib/index.js` 的 `tools[]`、README 表格与总数句、`pending-motion` 的映射、门禁需要的名单。收益是 11~12 处 → 1 处 + 生成器。

⚠️ **顺序风险（关键）**：4 个门禁都在正则解析 `lib/index.js`。先改数据形态会让 3 个门禁直接红、1 个静默绿。**必须先让门禁改成读注册表本身**，再动 `lib/index.js`。这一步做反了 = 审计得到反效果。

**B. 升级为真正的契约测试**（现有 `check-tool-params.py` 只查"参数名存在性"）：
- 从 schema 生成 `参数 → 必填/类型`，与 Python 侧读取方式（`p["x"]` 必填 / `p.get("x", d)` 可选 / `_bounded_int`/`_bounded_float`/`_nonneg_float` 的类型与范围）做**双向**断言。这样 `required` 与 `p[...]`、`type: integer` 与 `_bounded_int` 的错配会被抓出来——目前完全靠人。
- 断言语义：每条 `parameters` 的必填项集合 == Python 侧 `p[...]` 直读集合（把 4 条 `HELPER_READS` 白名单变成"跟随助手内部"的真实解析）。
- **最小改动下的立刻收益**：给 `check-tool-params.py` 加一行守卫 "解析到的工具数必须 ≥ 86"，把唯一的静默放行堵上（1 行，零风险）。

---

## 四、③ 孪生数据链路

### 4.1 链路上的耦合点

```
python 推送线程 20 Hz (ur_worker.py:4389, _twin_push_snapshot 零往返)
  → 协议行（无 id）→ lib/worker.js _onPush (158) → telemetry Map (113)
  → /twin/state 纯逻辑 (twin-routes.js:268) → 新鲜窗口 300ms / 回退显式读
  → SSE 100ms (twin-routes.js:589) → 客户端 twin-stream.js
  → state.js 快照 (applyBody 203) → twin-panel step() 1802 → 插值/渲染
```

| 耦合点 | 性质 | 现状评价 |
|---|---|---|
| **C1 单线程 worker 队列**（命令 vs 读） | 结构性 | 已用三重手段化解：独立推送通道（绕开 stdin 队列）、孪生读短预算 `killOnTimeout:false`（[twin-worker.js:40](lib/twin-worker.js#L40)）、`stale` 事件不静默。**这是本项目最好的设计决策** |
| **C2 SSE 复用 `createTwinStateHandler`** | 共享纯逻辑 | 良好：轮询与流语义不可能漂移（[twin-routes.js:590](lib/twin-routes.js#L590)） |
| **C3 `worker.call` 被 monkey-patch** | 隐式 | ⚠️ 见 4.3 |
| **C4 客户端 `applyBody` 的字段白名单** | 契约 | 宿主加字段客户端不认（[state.js:106](src/client/state.js#L106) 注释已自述） |
| **C5 `detail` 慢节拍在两处各写一个 2000ms** | 常量 | 宿主 `TWIN_STREAM_DETAIL_MS=2000`（[twin-routes.js:510](lib/twin-routes.js#L510)）与客户端 `detailMs=2000`（[state.js:56](src/client/state.js#L56)）无共享真源 |

### 4.2 失效模式表（按现场可观测性排序）

| 失效 | 触发 | 当前行为 | 残留风险 |
|---|---|---|---|
| 机器人运动 → 读排队 | 常态 | 推送通道继续出帧 | 已解决 |
| 推送线程停摆 | RTDE 掉线 | 300ms 新鲜窗口失效 → 回退显式读 | 已解决 |
| 会话死了仍推旧缓存 | 换机器人/断电 | 存活门（`_twin_push_snapshot` 的 `is_connected` 门）直接闭嘴 | 已解决 |
| **孪生帧每 10s 被自愈探测挤掉** | `SIM_PROBE_INTERVAL_MS` | **推演**：见 4.3 | ⚠️ 待实测 |
| 宿主重启 / 面板重挂载 | 用户操作 | SSE 无限重连 + `poke()` 自愈 | 已解决 |
| 型号缓存陈旧 | 同 IP 换型号 | 连接代次 `epoch = respawnCount:conn` 失效 | 已解决（设计精巧） |

### 4.3 新发现：孪生读预算 < 自愈探测预算（推演，未实测）

- 孪生读预算：`TWIN_READ_TIMEOUT_MS = 2500`（[twin-worker.js:40](lib/twin-worker.js#L40)）。
- 自愈探测预算：`SIM_PROBE_TIMEOUT_MS = 5000`（[lib/index.js:321](lib/index.js#L321)）。
- 孪生读包装的是**原始** `worker.call`，而 `installSimSelfHealing()` 在 [lib/index.js:407](lib/index.js#L407) 已经**就地替换**了 `worker.call`。因此孪生每一帧实际上都会走 `heal()`。
- `heal()` 在没有子进程换代、且距上次确认 > 10s 时会发一次 `sim_status`，预算 5000 ms（[lib/index.js:389](lib/index.js#L389)）。

⇒ 静态推演：**约每 10 s 有一次孪生帧在 2500 ms 预算内被 5 s 的探测阻塞**，表现为宿主回放陈旧帧 + 面板跳一次"数据已停止更新 Ns"。因为 `killOnTimeout:false`，不会杀进程（失效方向安全），但会产生周期性可见抖动。

**验证方式（无需改代码）**：
```powershell
# 观察 30s 内是否出现周期性 stale
node scripts/probe-twin-push-continuity.mjs
node scripts/probe-twin-stall-end-to-end.mjs
# 对照组：关掉 sim 自愈的触发条件（子进程换代即触发）或临时把探测预算调低后重跑
```
**修法**（择一）：① `heal()` 接受"发起者的剩余预算"作为上限，探测预算取其一半；② 孪生读显式跳过 heal（`createTwinReadWorker` 直接绑定 `rawCall`）；③ 把 `SIM_PROBE_TIMEOUT_MS` 降到 1000 以下。

### 4.4 可测性评价

**已具备**：`createTwinStateHandler` / `createTwinStreamHandler` 是纯逻辑 + 注入 `now`/`worker`/`telemetry`，完全可单测（[twin-routes.test.mjs](test/twin-routes.test.mjs) 937 行）；客户端 `EventSource`/`setTimeout` 可注入，可在 Node 里确定性测整条重连生命周期。

**缺口**（按价值排序）：
1. **`probe-*.mjs` 是手动脚本，不在 `run-tests.mjs` 的 `CHECKS` 列表里**（[run-tests.mjs:114–125](scripts/run-tests.mjs#L114) 只有 4 个 node 门禁 + 5 个 python 门禁）。这些 probe 正是"SSE 事件名不能叫 error"、"背压不静默"这类**只有真跑才暴露**的结论的证据来源，它们会随代码腐化而不报警。建议至少把 `probe-twin-stream-error-event.mjs`、`probe-twin-pump-stall.mjs` 转成带断言的测试并纳入。
2. **端到端"推送→SSE→插值→渲染"没有断言级测试**，只有 probe + `createScene` 无法在 Node 构造（[scene.js:22](src/client/robot/scene.js#L22) 如实标注）。`sceneFactory` 是可注入的，可以用假 scene 断言"收到 N 帧后 render 被调用 N 次且姿态单调推进"——这是目前唯一能自动化的端到端契约。
3. **字段策略表无测试**：`applyBody` 里三种策略（`detail` 沿用、`pendingMotion` 清空、`feedStale` 重置）靠注释表达，建议写成显式策略表 + 一条钉住它的测试。

---

## 五、④ 状态归属

### 5.1 三层各缓存了什么（实测清单）

| 层 | 状态 | 位置 | 生命周期 |
|---|---|---|---|
| **宿主（Node）** | `pending` / `telemetry` / `respawnCount` / `stderrTail` | [worker.js:99–123](lib/worker.js#L99) | worker 实例 |
| | `connectedIps` / `robotModels` / `simIps` / `simConfig` / `simProbeAt` / `simRespawnSeen` | [lib/index.js:264–430](lib/index.js#L264) | **`apply()` 闭包 → 插件重载即失效** |
| | `lastGood`（陈旧帧回放） | [twin-routes.js:254](lib/twin-routes.js#L254) | **每个 handler 私有：轮询一份、SSE 一份，互不共享** |
| | SSE 每连接的 `inFlight`/`frameErrors`/`lastDetailAt` | [twin-routes.js:634–639](lib/twin-routes.js#L634) | 每条 SSE 连接 → **面板重挂载即清零** |
| | `pendingMotion` 单例 | [pending-motion.js:200](lib/pending-motion.js#L200) | 模块级 → **跨插件实例共享** |
| **worker 子进程** | `ROBOTS` / `ROBOT_MODELS` / `ROBOT_CONN_SEQ` / **`SIMS`** | [ur_worker.py:228–273](python/ur_worker.py#L228) | 子进程内存 → **崩溃/重启即全丢** |
| | `VirtualRobot._waypoints`/`_started_at`/`speed_scaling` | [ur_sim.py:530–548](python/ur_sim.py#L530) | 同上 |
| **浏览器** | `snapshot`（唯一数据源） | [state.js:81](src/client/state.js#L81) | 客户端模块 |
| | 约 40 个可变 `let`（模型句柄、插值对、轨迹、仿真开关、图层、脏标记…） | [twin-panel.js:566–634](src/client/twin-panel.js#L566) | `mountTwinPanel` 闭包 → **面板收起即全丢** |
| | 模型缓存（带引用计数） | [loader.js:48](src/client/robot/loader.js#L48) | **模块级、进程级**，跨面板重挂载共享 |

### 5.2 语义混乱的根因

**同一事实"这台仿真机器人在不在、是什么型号"有 4 份副本，权重不同：**

| 副本 | 位置 | 权威性 |
|---|---|---|
| `SIMS`（真源） | 子进程内存 | 真实，但可静默消失 |
| `simIps` / `simConfig`（影子） | 宿主闭包 | 记忆 + 重建依据，插件重载即失效 |
| `simActive` / `simConfig` / `simModels` / `hostSimActive` / `simIpOwned`（第二影子） | 面板闭包 | 面板收起即失效，`stopSimOnDispose()` 还会**主动销毁** AI 开的仿真 |
| `SIMS[ip].model` vs `robotModels` 型号缓存 | 两处 | 靠 `epoch = respawnCount:conn` 对账 |

**这不是设计疏忽，是缺一个所有者。** `installSimSelfHealing` 的 monkey-patch 本质上是"没有 owner，所以到处打补丁"：它把"确认虚拟机器人还在"这件事塞进**每一次** `worker.call`，代价是每次调用都被加了一层不可见的延迟与一个 5 s 预算（见 4.3）。

### 5.3 架构上应如何归位

**推荐：把仿真生命周期变成宿主侧的显式 desired-state 注册器。**

```
lib/sim-registry.js（新）
  状态: { desired: {model,preset,speed_scaling} | null, observed: {model, at, childGeneration} }
  操作: ensure()  — 幂等：desired 非空且 observed 过期/换代 ⇒ 重建
        set(desired) / clear()
  调用点: 恰好 2 个 —— 工具执行前的 route 钩子、POST /twin/sim
  不再需要: monkey-patch worker.call、simProbeAt/simRespawnSeen/simHealInFlight 三个散变量
```

收益：`installSimSelfHealing`（[lib/index.js:340–411](lib/index.js#L340)，72 行 monkey-patch）替换为 ~40 行显式注册器；孪生读不再隐式承担探测成本；"重挂载/换型号"的语义变成一条可测的状态迁移（`desired=ur5e → observed=ur12e ⇒ 重建`）。

**同时需要明确一条产品决定**：面板 `autoSim` 默认**开面板即建仿真**，而 `dispose` 时**无条件销毁**（含 AI 用 `ursim_sim_start` 开的那台，[twin-panel.js:1421](src/client/twin-panel.js#L1421)）。也就是"面板是仿真的所有者"。这个决定本身合理，但必须与"AI 也能开仿真"共存——目前靠 `simIpOwned`/`hostSimActive` 两个标志做启发式判断。归位后应写成显式契约：**面板关闭是否停仿真**是一个配置项（`stopSimOnClose`），并在 UI 上说明。

---

## 六、⑤ 扩展点成本（实测）

| 扩展 | 触点 | 明细 |
|---|---|---|
| **新增机型** | **4 处代码 + 3 处文档** | ① [kinematics.json](assets/kinematics.json) 加键（links + jointLimits）② [convert-meshes.py:37](scripts/convert-meshes.py#L37) ③ [build-assets.mjs:30](scripts/build-assets.mjs#L30) ④ [model-contract.test.mjs:21](test/model-contract.test.mjs#L21) + ⑤ [twin-panel.js:1250](src/client/twin-panel.js#L1250) 手写兜底字面量 ⑥ [lib/index.js:1504](lib/index.js#L1504) 描述串 ⑦ README × 2 + [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| | ✅ Python 侧**零改动** | `ur_sim.model_ids()` / `canonical_model_name()` 从 kinematics.json 读——这一处是好的 |
| **新增工具** | **3 处强制 + 6~9 处条件** | 见 §3.1 |
| **新增可视化图层** | **4~6 处，全在同一个函数体内** | ① [overlays.js](src/client/robot/overlays.js) 加 create/dispose ② [twin-panel.js](src/client/twin-panel.js)：import + 创建(915–920) + `scene.add`(1079–1082) + `layers{}`(920) + 按钮循环(724–745) + `applyLayers()`(929) + `applyPoseToScene`/`step` 的更新点 + dispose(1997) ③ [strings.js](src/client/strings.js) 中英双语键（有对称性测试钉住）④ [styles.js](src/client/styles.js) 若需新 class ⑤ 测试 × 2 |
| **新增数据源字段** | **2 处** | 宿主 body（[twin-routes.js:385](lib/twin-routes.js#L385)）+ 客户端白名单（[state.js:203–254](src/client/state.js#L203)） |

图层扩展的 4~6 处里有 **6 处集中在 `mountTwinPanel` 的同一个闭包里**（创建、挂场景、注册开关、同步可见性、每帧更新、释放）。这正是"2000 行函数体"的实际代价：不是读不懂，是**每加一层要在一个 1470 行的作用域里找到 6 个正确的插入点**。

---

## 七、重构建议（按"先做什么"排序）

### R1 — 堵住唯一会静默放行的门禁（30 分钟，零风险）

**涉及**：[scripts/check-tool-params.py:139](scripts/check-tool-params.py#L139)
**做什么**：① 解析到 0 个工具时 `raise SystemExit(1)`（并打印"正则失配"）；② 断言工具数 ≥ 86（与 `check-doc-tools.mjs` 的口径一致）。
**收益**：把 §3.2 表里唯一的 ❌ 变成 ✅。后续任何重排 `lib/index.js` 的动作都不会静默通过。
**风险**：无。只加断言，不改判定逻辑。
**验证**：`python scripts/check-tool-params.py`（绿）；临时把 `lib/index.js` 的 `op:`/`toolName:` 顺序对调 → 应 FAIL。

---

### R2 — 把跨语言常量收进零依赖共享模块（半天，低风险）

**涉及**：[lib/twin-paths.js](lib/twin-paths.js)（已是"零 import 共享层"，扩成 `lib/twin-contract.js`）、[lib/index.js:295](lib/index.js#L295)、[lib/twin-routes.js:64,546,549](lib/twin-routes.js#L64)、[src/client/index.js:38](src/client/index.js#L38)、[src/client/twin-panel.js:187,1233](src/client/twin-panel.js#L1233)、[src/client/robot/twin-stream.js:47,50](src/client/robot/twin-stream.js#L47)
**做什么**：`SIM_IP`、`TWIN_CODES` 的 6 个值、`TWIN_STREAM_*_EVENT` 两个事件名、`TWIN_STREAM_DETAIL_MS` 挪进共享模块（host 与 client 都能 import 它，esbuild 构建期内联）。Python 侧的 `SIM_IP` 单独用一条门禁比对（跨语言无法 import）。
**收益**：消除 D1/D2/D3/C5 四组漂移点（客户端 `describeDisconnected` 的 6 个字面量、两个 SSE 事件名、`SIM_IP` 的 3 份、detail 节拍的两份）。
**风险**：低。纯常量搬迁；`lib/twin-paths.js` 的"零 import"契约必须保持（已有注释明确要求）。
**验证**：`npm run test:node`（42 文件全绿）+ 新增 `scripts/check-contract.mjs`：断言 `SIM_IP` 在 lib/、src/、python/ 三处取值一致，`TWIN_CODES` 的键集合 == 客户端 `switch` 的 case 集合。

---

### R3 — 给仿真面补门禁（半天，低风险，收益直接）

**涉及**：[scripts/check-worker-ops.py](scripts/check-worker-ops.py)、[python/ur_worker.py:295,4033](python/ur_worker.py#L295)、[lib/pending-motion.js:24–41](lib/pending-motion.js#L24)
**做什么**：① `SIM_OPS.keys() ⊆ HANDLERS.keys()`；② `SIM_OPS` 与 `sim_capabilities()` 双向对账——为此先建一份 `op ↔ toolName` 对照表（可直接从 R4 的注册表生成，或临时用 R2 的共享常量表）；③ 断言 `pending-motion` 三张映射里的每个工具名都已注册。
**收益**：消灭 §3.1 的三处 ❌。`SIM_OPS` 拼错从"静默降级"变成"构建失败"。
**风险**：低。第 ② 项现在会**故意红一次**（`get_status`/`get_uptime` vs `status`/`get_time`），这正好逼出"能力清单该用哪种命名"的决定——建议统一为工具名（面向模型/用户），在门禁里做一次映射。
**验证**：`npm test`；篡改 `SIM_OPS` 一个键名 → 应 FAIL。

---

### R4 — 抽出 op 注册表为单一真源，派生所有副本（2~3 天，中风险，**必须排在 R1/R3 之后**）

**涉及**：新建 `lib/op-registry.js`；改造 [lib/index.js:564–1526](lib/index.js#L564)（963 行 → 生成/引用）；改造 4 个正则门禁改为读注册表；README 表格由脚本生成
**做什么**：每条登记 `{op, tool, params, approval, sim, motionPreview}`，然后生成：工具声明、README 表格行与总数句、门禁名单、`pending-motion` 的映射。
**收益**：新增工具 11~12 处 → **1 处**；`lib/index.js` 从 1912 行降到约 950 行（剩 `apply()` 的编排逻辑）；4 个门禁从"文本启发式"升级为"结构化断言"，`HELPER_READS` 白名单可删。
**风险**：**中高**。① 先改门禁再改数据，顺序错了会一边红一边静默绿（见 §3.2）；② `parameters` 里 `IP()`/`numberArray()`/`MOVE_PARAMS()` 三个 DSL 助手的"省略 required"语义（[lib/index.js:173–211](lib/index.js#L173) 注释记录了两次事故）必须在生成器里逐字保留，否则工具会静默注册失败。
**验证**：`npm run check`（8 个门禁）+ `npm test`；生成前后对比 `tools[]` 的 JSON 快照应逐字段相等（新增一条 golden 测试）；启动一次宿主并比对注册日志的 `已注册 86/86`。

---

### R5 — 仿真生命周期归位为宿主侧注册器（1~2 天，中风险）

**涉及**：新建 `lib/sim-registry.js`；替换 [lib/index.js:300–432](lib/index.js#L300)（`simConfig`/`simIps`/`simProbeAt`/`simRespawnSeen`/`simHealInFlight`/`installSimSelfHealing`）；[lib/index.js:1825](lib/index.js#L1825) 的 `applySimEnabled`（与 D5 的两份合并）；顺手修 4.3 的预算倒挂
**做什么**：见 §5.3。同时把 `SIM_PROBE_TIMEOUT_MS` 降到 ≤ 发起者剩余预算的一半（或让孪生读绑定未 patch 的 `rawCall`）。
**收益**：删除 72 行 monkey-patch；"重挂载/换型号"变成可测的状态迁移；消除孪生帧每 10s 的超时抖动（需先实测确认，见 4.3 的验证命令）。
**风险**：中。自愈路径目前有 `approval-gate.test.mjs` 的 438 行覆盖（含"worker 换代后自动重建"链路），替换时必须保持这些断言；`stopSimOnDispose` 的"面板是否拥有仿真"语义需要显式化（`stopSimOnClose` 配置项）。
**验证**：`node --test test/approval-gate.test.mjs` + [scripts/probe-twin-push-continuity.mjs](scripts/probe-twin-push-continuity.mjs)（30 s 内零 stale）+ 手动：kill 掉 Python 子进程 → 下一条指令应自动重建并打日志（现有行为不得回归）。

---

### R6 — 清理不可达死代码（半天，低风险）

**涉及**：[lib/index.js:1717](lib/index.js#L1717) 的硬钉、[twin-routes.js:278–290](lib/twin-routes.js#L278) 的 AMBIGUOUS 分支、[state.js:307](src/client/state.js#L307) 的 `setIp/getIp`、[twin-panel.js:1755–1771](src/client/twin-panel.js#L1755) 的 `hudRobots`、[twin-panel.js:75](src/client/twin-panel.js#L75) 的死导入、`layers.cog` 链
**做什么**：先写一份"可达性判定"（每条注明为什么不可达），再决定**删除**还是**保留并显式标注为"真机模式预留"**。建议删除多机选择 UI 与 `setIp`（宿主已忽略 `?ip=`），保留 `AMBIGUOUS` 分支但加注释；删 `formatForce` 死导入与 `cog` 链（缺读回 op）。
**收益**：减少读者误判与维护面；`twin-panel.js` 减约 60~80 行。
**风险**：低，但有测试钉子。[twin-panel.test.mjs](test/twin-panel.test.mjs)（1780 行）与 [state.test.mjs](test/state.test.mjs) 里有 `ipCalls: ['127.0.0.1']` 之类的断言——删 `setIp` 需要同步改测试与 `applySim`/`autoEnterSim` 的调用点（4 处）。
**验证**：`npm run test:node`；GUI 手动：开面板 → 自动进仿真 → 3D 跟随 → 收起面板 → 仿真停（这是唯一无法自动化的验收，需要你 Ctrl+F5 确认）。

---

### R7 — 拆分 `twin-panel.js`（2~3 天，中风险）

**涉及**：[src/client/twin-panel.js](src/client/twin-panel.js) → `panel/dom.js`、`panel/model-lifecycle.js`、`panel/sim-bar.js`、`panel/feed-watchdog.js`、`panel/trajectory.js`、`panel/render-loop.js`
**做什么**：**按已有缝拆，不重新设计**。优先抽纯逻辑（已在文件顶部，约占 400 行，可留在原处或移入 `panel/pure.js`），再抽两个独立状态机：`sim-bar`（1231–1471，240 行）与 `trajectory`（1690–1729）。
**收益**：`mountTwinPanel` 从 ~1470 行降到 ~800 行；仿真开关的 5 个 `let` 与 3 个 `<select>` 可独立测试；新增图层的 6 个插入点收敛到 1 个 `layers` 注册表。
**风险**：中。① dispose 顺序是硬约束（`stopSimOnDispose` 必须在最前、样式 `<style>` 故意保留）；② `twin-panel.test.mjs` 有大量 DOM 结构断言（`data-ursim-twin-*` 属性与顺序），拆错会红一片——这既是风险也是安全网。
**验证**：每抽一个模块跑一次 `node --test test/twin-panel.test.mjs`；全量 `npm test`；`npm run check:static`（bundle 哈希门禁会强制重建 [lib/client.js](lib/client.js)）。

---

### R8 — 补上端到端契约（1 天，低风险）

**涉及**：[scripts/run-tests.mjs:114](scripts/run-tests.mjs#L114)（把 probe 纳入 `CHECKS`）、新建 `test/twin-e2e.test.mjs`、[test/state.test.mjs](test/state.test.mjs)
**做什么**：① 把两个关键 probe（SSE `error` 事件名、背压不静默）转成带断言的测试并纳入门禁——它们现在是**手动脚本**，会随代码腐化而不报警；② 用注入的假 `sceneFactory` 断言"收到 N 帧 → render 恰好 N 次、姿态单调推进"（绕过 WebGL 限制的可行路径）；③ 把 `applyBody` 的三种字段策略写成显式策略表 + 一条钉住它的测试。
**收益**：§4.4 的三个缺口全部可自动化；"字段漂移"从静默变可见。
**风险**：低。
**验证**：`npm test` 全绿；故意删掉 `feedStale` 的赋值 → 新测试应 FAIL。

---

## 八、明确不做 / 需要你决策

**不做（避免架构宇航员）**：

- **不拆微服务/governance 层**：这是一个单进程插件，宿主闭包 + 子进程 + 浏览器就是正确的三层。`lib/twin-paths.js` 那种"零 import 共享层"已经是对的模式。
- **不为 86 个工具做统一抽象层**：工具表的重复是**数据**重复，不是逻辑重复——R4 的生成方案（1 份数据 + N 个派生）比"抽象基类"更省。
- **不重写 `ur_worker.py` 的真机 op 层**（约 3000 行）：它已被 `route_op()` 结构性隔离为不可达。见下面的决策点。

**需要你决策的三件事**：

1. **`ur_worker.py` 里 3000 行真机 op 保留还是删除？** 现在它是"保留工具名、只报仿真不支持"策略的副产品。保留 = 发布包多 100 KB、读者多 3000 行、门禁多一层维护；删除 = 未来想接真机要重写。我倾向**保留但物理隔离**（拆成 `python/ops_real.py` + `python/ops_sim.py`，由 `main.py` 按 `ip` 路由），成本约 1 天，收益是两条链读起来互不干扰。
2. **`sim_capabilities()` 用工具名还是 op 名？** 现在混用（§3.1 实测）。建议统一为工具名（面向模型与用户），门禁里做一次映射。
3. **面板关闭是否应该停掉 AI 开的仿真？** 现在是"停"（[twin-panel.js:1415](src/client/twin-panel.js#L1415) 注释写"用户裁定"）。这会让"AI 开着仿真、用户瞄一眼面板再关掉"变成仿真消失。建议改成配置项并在 UI 上写出后果。

---

## 九、审计方法与只读声明

- **范围**：全仓 140+ 源文件按行数排序后，深读了 Node 插件层 4 个文件全部、客户端 8 个文件全部、Python 2 个文件的关键区段、8 个门禁脚本、测试清单；未读 vendored [python/URBasic/**](python/URBasic)（第三方，非本仓设计责任）。
- **证据强度**：所有行号与集合规模为实测；§4.3 的预算倒挂标注为**静态推演、未实测**，并给出了验证命令。
- **未执行任何运行时实验**：为避免产生 worker 日志、仿真进程与状态副作用，未调用 `ursim_*` 工具、未运行 probe 脚本。§4.3 与 R5 的验证需要你在真实面板上跑一次。
- **零写入**：本轮未修改、未创建、未删除任何项目文件（可用 `git status` 复核）。

**已更新记忆**：今日日志追加一条（kind=fact，记录审计结论与实测数字）；项目笔记 `MEMORY.md` 追加「架构审计基线（2026-10-13，只读，未改文件）」小节（含规模数据、单一真源缺口、门禁缺口、状态归属与死代码清单）；技能库新增一条待审批流程「对多语言/多层插件做只读架构审计并按优先级出重构建议」（`proc_pre_b20af0b513b`，未激活）。本轮未改 `lib/` 下任何文件，故按纪律不写交接账本；项目全貌（三层架构、方向、版本基线）未变，白板不重写。

## 高级开发者
我已把所有目标文件读完并做了两处实测（listener 泄漏复现、`fkChain`/轨迹路径的单帧成本量化）。下面是审计结论。

## 审计方法（可复核）

- 只读审计，未修改任何文件。
- 两个**实测**而非推测的量化点：
  - `lib/worker.js` 的 stdin listener 累积——用一个 30 次循环复刻 `proc.stdin.on('error', …)`，实测得到 `listener count = 30` 且 Node 抛出 `MaxListenersExceededWarning: 11 error listeners added to [Socket]`。
  - 面板 60fps 路径成本——单独跑 `fkChain` 与 `trajectoryPoints/trajectoryColors`：`fkChain` 约 **0.7 µs/次**，`drawTrajectory` 两次分配约 **0.024 ms/帧**。两项都在 16.7 ms 预算的千分之几，**所以我没有把它们列为优化项**（原始怀疑被自己的测量否掉了，这里如实说明）。

---

# P0 — 立刻改、收益明确、改动小

## 1. 每次 worker 调用给 `stdin` 挂一个 error 监听器且从不摘除 → 必然触发 `MaxListenersExceededWarning`

**位置**：[lib/worker.js:528-536](lib/worker.js#L528-L536) —— `call()` 里 `proc.stdin.on('error', …)`，`settle()` 只 `removeEventListener('abort', onAbort)`，从不 `removeListener('error', …)`。

**依据**：上面的复现实验。第 11 次调用即越线。

**影响**：这不是"内存泄漏警告而已"——`Error` 监听器上限被打破后 Node 只警告，但该进程里每一次调用都会永久多留一个闭包（闭包捕获 `settleReject` → 捕获 `this` 与整条 promise 链）。SSE 孪生 + 宿主工具调用一直在发请求，警告与闭包是按小时累积的。同时**诊断噪音**：`MaxListenersExceededWarning` 混进宿主日志，会把真正的故障淹掉。

**具体改法**：把 error 处理器提升到 `_spawnOnce()` 里、每个子进程只挂一次，并通过一个 per-child 的「当前在飞请求集合」把 stdin 错误定向 reject；或者在 `call()` 里用 `proc.stdin.once('error', …)` 并在 `settle()` 里摘除。前者更干净（也顺带让 `_stderrTailByProc` 的 per-child 思路在 stdin 侧对称）。

**应补测试**：`test/worker.test.mjs` 加一条——连续 25 次 `call()` 成功后断言 `proc.stdin.listenerCount('error') === 1`（或至少 `< 10`）。

---

## 2. 「关节超限」提示是死代码：面板读的是 `fkChain` 从不返回的字段

**位置**：[src/client/twin-panel.js:1777](src/client/twin-panel.js#L1777) `overLimitJoints(joints, fkResult?.jointLimits)`；而 `fkResult` 来自 [src/client/robot/fk.js:64-73](src/client/robot/fk.js#L64-L73) 的 `fkChain`，返回结构恒为 `{links, tool0}` —— **没有 `jointLimits`**。

**依据**：全仓 `jointLimits` 只有 4 处（[twin-panel.js:231](src/client/twin-panel.js#L231) JSDoc、[:258](src/client/twin-panel.js#L258) 注释、[:1777](src/client/twin-panel.js#L1777) 这一行、[fk.js:11](src/client/robot/fk.js#L11) 注释）。真正带 `jointLimits` 的是 `resolveKinematics()` 的返回值（[twin-panel.js:233-237](src/client/twin-panel.js#L233-L237) 声明了 `jointLimits?: number[][]`），而它**没有**被传给 `overLimitJoints`。所以 `limits == null` → 第一行 `return []`（[twin-panel.js:270](src/client/twin-panel.js#L270)）。

**影响**：`kinematics.json` 里每个型号都带的关节限位永远不会被用来标红——**该功能 100% 不生效**，而且测试是绿的（见下）。用户在真机/仿真上看到越限姿态时，HUD 不吭声。

**为什么测试没抓到**：`test/twin-panel.test.mjs:1173` 那条只断言"未超限时不引入后缀"，属于空过；而 [:1154](test/twin-panel.test.mjs#L1154) 只测纯函数。假 handle 记录的 `lastResult` 是 `applyFK(result)` 的原样透传（[test/twin-panel.test.mjs:267-270](test/twin-panel.test.mjs#L267-L270)），也就是真实 `fkChain` 的输出——**假件同样没有 `jointLimits`**，因此不存在能暴露该 bug 的 fixture。

**具体改法**：`overLimitJoints(joints, kin?.jointLimits)`（`kin` 在 [:1851](src/client/twin-panel.js#L1851) 已算好）。一行。

**应补测试**：沿用现有 harness，把某关节推过该型号 `jointLimits` 上限，断言 `hudJoints.textContent` 含 `S.overLimit(...)` 且 `data-ursim-twin-overlimit === 'true'`。这条测试在改前必红。

---

## 3. `loader.js` 的模型缓存有「重复加载」竞态 + 无界缓存

**位置**：[src/client/robot/loader.js:205-248](src/client/robot/loader.js#L205-L248)（`cache.get(id)` 命中检查在 `await loadGltf(...)` **之前**，但没有 in-flight 表）。

**依据**：`loadRobotModel` 在 `await` 期间不会写缓存；同一微任务窗口里两次调用（换型号抖动、两个消费方同时挂载）会各自发起一次 `GLTFLoader.loadAsync`，各自 `assemble()` 出**两套** `Group`（[:71-95](src/client/robot/loader.js#L71-L95)），只有后写的那份进缓存；`entry.refs` 永远归零不到前一份，它已 add 进场景之前被丢弃时几何体不会释放。缓存本身 `Map` 无上限，且 [makeHandle](src/client/robot/loader.js#L289-L307) 只在 refs 归零时清 key——`loadModel` 在 [twin-panel.js:1599-1602](src/client/twin-panel.js#L1599-L1602) 的"token 过期就 dispose"路径会让 refs 归零，看上去是配平的，但并发路径不配平。

**具体改法**：加一张 `pending: Map<id, Promise<entry>>`，第二次调用 `await pending`；失败时删除该键。

**应补测试**：并发两次 `loadRobotModel('ur5e')`（注入计数 `loadGltf`），断言 `loadGltf` 只被调用一次、两个 handle 的 `root` 是同一个对象、`dispose()` 两次后几何体真的被释放。

---

## 4. `respawnCount` 在 spawn 成功前就自增 → 每次失败重启都白换一次机器人型号

**位置**：[lib/worker.js:238-242](lib/worker.js#L238-L242) `_start()` 里 `start()` 先 `this.respawnCount += 1` 再 `_spawnOnce()`；而 [:191](lib/worker.js#L191) 把它拼进代次 `epoch = "${this.respawnCount}:${conn}"`。

**影响**：一次 spawn 失败（python 路径错、解释器忙）也会让代次变化 → `lib/index.js` 的 `simRespawnSeen` 判定"子进程被换过"→ 触发 `rebuild()`；`lib/twin-routes.js` 的型号缓存失效 → 重读 Dashboard 并**让客户端重新下载 1.5–3.5 MB 的 GLB 并重建网格**（[:344-357](lib/twin-routes.js#L344-L357)）。一次失败重启 = 一次无意义的模型重载。

**具体改法**：把代次来源换成「**成功 spawn 的子进程计数器**」（在 `proc.on('spawn')` 里自增），失败尝试不计数。

**应补测试**：`test/push-epoch.test.mjs` / `conn-epoch.test.mjs` 加一条——模拟一次 spawn 失败后成功，断言 `latestTelemetry(ip).epoch` 的前缀与首次成功时相同。

---

# P1 — 值钱、改动中等

## 5. 收起面板时"停仿真"的 POST 是会被页面卸载掐掉的裸 fetch

**位置**：[src/client/twin-panel.js:1436-1441](src/client/twin-panel.js#L1436-L1441)。对比 `applySim` 的 POST（[:1356](src/client/twin-panel.js#L1356)）——两者都没有 `keepalive`。

**影响**：面板收起/切换视图触发卸载，浏览器会 abort 这条 in-flight 请求 → 虚拟机器人在宿主里**继续跑**，而用户以为它停了。下一位用户/下一个 session 打开面板时 `refreshSimState` 会看到 `active:true` 并**沿用**它（[:1399-1406](src/client/twin-panel.js#L1399-L1406)）——正是"它怎么自己还开着"的成因。

**具体改法**：这一条加 `keepalive: true`（4 KB body 限制内）。`applySim` 那条不必须，但加上无害。

**应补测试**：现有 `★ 收起面板即停仿真` 那条断言 `fetch` 被调用；加一条断言 `init.keepalive === true`。改前必红。

## 6. `disposeObject3D` 无差别 dispose 材质的**每一个**对象属性

**位置**：[src/client/robot/loader.js:310-320](src/client/robot/loader.js#L310-L320)：`for (const k of Object.keys(m)) m[k]?.dispose?.()`。

**影响**：注释说"释放贴图"，但 `Object.keys` 会扫到 `userData`、`uniforms`、`defines` 等任何带 `dispose` 方法的值；更实际的风险是**共享资源误杀**：GLTFLoader 在多个 mesh 之间复用同一张纹理/同一份 `envMap`（本项目的 `scene.environment` 来自 PMREM，`RoomEnvironment` 的贴图也可能被材质引用）。一旦某个材质的 `envMap` 被 dispose，**场景里所有 PBR 金属材质同时变黑**——而这是"换型号"这条常见路径。

**具体改法**：只释放 three 已知的贴图槽位白名单（`map / normalMap / roughnessMap / metalnessMap / aoMap / emissiveMap / alphaMap / envMap`），并对共享资源引用计数。

**应补测试**：构造两个共享同一 `Texture` 的材质，`disposeObject3D` 后断言该贴图**仍可用**（或断言只调用了白名单槽位上的 dispose）。

## 7. `_killFor` 在清理 `_stderrTailByProc` **之后**才构造错误消息 → 消息时常为空

**位置**：[lib/worker.js:436-441](lib/worker.js#L436-L441) 调 `this._failAll(reason)`，而 `reason` 字符串在调之前就已拼好，用的是 `this.stderrTail`；per-child 的那份在 [:355](lib/worker.js#L355) `_stderrTailByProc.delete(proc)` 被删掉。

**影响**：正好在最需要 stderr 的场合（超时/取消导致 kill）给出**没有 stderr 的**错误消息。这与同文件 [:317-330](lib/worker.js#L317-L330) 花大力气做的 per-child stderr 是**自相矛盾**的：exit 路径拿到了可读原因，kill 路径拿不到。

**具体改法**：`_killFor` 里先 `const tail = this._stderrFor(proc)`，再 `_failAll`。

**应补测试**：让子进程往 stderr 写一行再超时，断言 reject 的 error message 含那一行。

## 8. `/twin/asset` 每次 GET 都对 1.5–3.5 MB 的 GLB 做一次同步区间的 SHA-1

**位置**：[lib/twin-routes.js:777](lib/twin-routes.js#L777) `createHash('sha1').update(body).digest('hex')`，在 `await readFile(file)` 之后、每个请求都跑，无缓存。

**影响**：即使命中 304 也要**先把整份文件读进来再哈希**——客户端每次重开面板、每次换型号、每次硬刷新都是 3–8 ms 的主线程 CPU + 3.5 MB 读盘；`update()` 是原生实现（不阻塞事件循环），但 `readFile` 的 Buffer 分配与哈希本身是纯浪费。这是**唯一**按请求付费的 O(文件大小) 操作。

**具体改法**：`Map<path, {mtimeMs, size, etag}>`，`stat` 命中即复用；文件是只读资产，产品上不会就地改。

**应补测试**：连读两次同一型号，注入的 `fs`（或 spy 一个 `createHash`）断言哈希只算一次。

## 9. `writeHud` 的语义是"每 10 Hz 把整块 HUD 全部重写"，与 `updateFeed` 的差量写法不一致

**位置**：[src/client/twin-panel.js:1746-1799](src/client/twin-panel.js#L1746-L1799)。它每 100 ms 无条件写 8 个 `textContent` + 9 个 `setAttribute`，而同一文件的 [updateFeed:1214-1222](src/client/twin-panel.js#L1214-L1222) 专门做了 `if (text !== lastFeedText)` 的差量。

**影响**：60 fps × `step()` 里有 `updateFeed` 无条件构造字符串（[:1206](src/client/twin-panel.js#L1206) `describeFeedHealth({...})`——每帧新建一个对象 + 拼字符串），10 Hz × `writeHud` 有整块 DOM 写。实测这两项都远在预算内，**所以这条不是性能发现，而是一致的工程质量问题**：同一份文件里两套风格，后续维护者会在其中一处加字段而忘了另一处的节流假设。

**具体改法**：`writeHud` 按行记录上次文本，只写变化的行（这正是 `lastFeedText` 已经证明可行的模式）；`updateFeed` 把 `describeFeedHealth` 的入参对象提升为复用对象。

## 10. 面板常驻一个 60 Hz 的 `step()`，但绝大多数帧什么事都没有

**位置**：[src/client/twin-panel.js:1950-1965](src/client/twin-panel.js#L1950-L1965) 无限 rAF 自续；`step()` 每帧都做 `state.getSnapshot()`、`applyConnection`、`updateFeed`、`isSafetyHazard`、DOM 属性写（[:1797-1798](src/client/twin-panel.js#L1797-L1798) 每帧写 `root.setAttribute`）。

**影响**：按需渲染已经做对了（`render()` 只在 dirty 时跑），但**每帧的逻辑**没省。静止时功耗/风扇是真实可感的。

**具体改法**：把帧循环降级为「事件驱动 + 低频看门狗」：`invalidate()` 里按需 `wake()`，静止且无插值窗口时以 ~10 Hz 跑 `step()`，插值窗口内回到 rAF。或者至少把 `root.setAttribute` 那两行挪进 `updateFeed`/`writeHud` 的差量里。

---

# P2 — 低收益/低风险，顺手可清

| # | 位置 | 问题 |
|---|---|---|
| 11 | [twin-panel.js:1715](src/client/twin-panel.js#L1715) | `trajectoryColors(trajectory.slice(start))` 每帧复制整个尾部数组；`trajectoryColors` 内部又 `Math.max(...finite)` 展开。建议改成接收 `(buf, fromIndex)`。实测成本 0.024 ms/帧，**收益是代码清晰度而非性能**。 |
| 12 | [twin-routes.js:785](lib/twin-routes.js#L785) | `If-None-Match` 只做 `tag.trim() === etag` 精确比较，不支持 `W/"..."` 弱校验器。浏览器一般发强 ETag，所以现实影响很小。 |
| 13 | [overlays.js:209](src/client/robot/overlays.js#L209) | `updateForceArrow` 每次 `new Vector3(...)`；[loader.js:181](src/client/robot/loader.js#L181) 的 fallback 臂 7 个 mesh 共享一个 `MeshStandardMaterial`（**正确**），但 `disposeObject3D`/`disposeOverlay` 会对同一实例 dispose 7 次（幂等，无害）。 |
| 14 | [twin-panel.js:1626-1631](src/client/twin-panel.js#L1626-L1631) | `createGhostArm(handle)` 用 `root.clone(true)`，真实 mesh 与 ghost mesh 共享 `geometry`。`disposeGhostArm` 只释放材质（**注释已正确警告**），但 `disposeObject3D(entry.root)` 会遍历到真臂 mesh 并释放共享 geometry——**只要 ghost 还挂在场景里**（dispose 顺序是 `disposeGhostArm(ghost)` 在 `handle.dispose()` 之前，[twin-panel.js:1988-1996](src/client/twin-panel.js#L1988-L1996)，所以当前顺序是安全的）。属于"顺序敏感、无断言保护"的脆弱点，建议加注释锁或测试。 |
| 15 | [ur_sim.py:676-678](python/ur_sim.py#L676-L678) | `move_cartesian_path(waypoints, v, a, now=None)` 不转发 `total_s`。当前无调用方传 `t`（`_sim_movep` 不解析 `t`），所以**是死参数**；要么删掉，要么补上并让 `_sim_movep` 解析 `t`。 |
| 16 | [ur_sim.py:580-587](python/ur_sim.py#L580-L587) | `_sample` 每次调用（20 Hz 推送 + 命令线程轮询）都 `sum(self._segment_s[1:])` 重算弧长。段数可达数百（`movel` 细分），每次 O(n)。可在 `_plan` 里把 `path_s` 缓存下来。 |
| 17 | [index.js:120](lib/index.js#L120) | `summarizeArgs` 用 `JSON.stringify(args)`，畸形参数（循环引用）会抛——已有 `try/catch` 兜住，OK。仅记录：这里也是**每次审批一次全量序列化**，`args` 可能含 6×N 数组，无上限。 |
| 18 | [twin-panel.js:1433](src/client/twin-panel.js#L1433) | `stopSimOnDispose` 的守卫是 `if (!owned && !simActive && hostSimActive !== true) return`；`hostSimActive` 只在 `refreshSimState` 里写过一次。若 AI 在面板打开**之后**才开仿真，而 `simActive`（来自帧数据）又是 false（例如那一帧 `q` 为空），卸载时不会去停它。属窄窗，但与"收起即停"的用户裁定不符。 |

---

# 测试覆盖盲区（按"漏了会不会真出事"排序）

仓里 `test/*.test.mjs` 实为 **42 个**（`test-manifest.json` 与磁盘**完全对齐**，`scripts/check-test-manifest.mjs` 在管这件事），另有 1 个 `test/ur-python-harness.py`。清单与磁盘的对账我跑过，**没有漏登记**。真正的盲区是下面这些：

1. **`lib/worker.js` 的 listener 契约**（对应发现 #1）。现有 14 条 `worker.test.mjs` 用例覆盖超时/取消/重启/BUSY，**零条**覆盖"连续调用后监听器数量"。这是本仓唯一一个"机制级、改一行即可断言"的漏测，且已经实测可复现警告。
2. **`/twin/sim` 写路由的信任围栏**（[index.js:1816-1822](lib/index.js#L1816-L1822) + [:1875-1901](lib/index.js#L1875-L1901)）。三条守卫（回环 Host、Origin 必填、`content-type: application/json`）与 4 KB body 上限**没有一条**路由级测试；`readJsonBody` 的三种失败（超限、非 JSON、空体）也没测。它在 `lib/index.js` 里，而现有 `approval-gate.test.mjs` 只测工具路径、`twin-routes.test.mjs` 只测纯 handler（该文件刻意不碰 `req/res`）。**这是本仓安全相关的最大盲区。**
3. **`UrWorker.shutdown()`**（[worker.js:559-572](lib/worker.js#L559-L572)）。`Promise.race` 里的 `setTimeout` 在 `call` 先胜出时**永不清理**，会让进程额外挂 5 s；另外 `budget ∈ (5000, 15000)` 时 `call` 的内层定时器会先于外层触发并**杀掉**子进程 → 与"优雅关闭"目的相反。无测试。
4. **`lib/index.js:1696-1723` / `2725-2752` 的路由 wrapper**。`sendJson` / `sendAssetResult` / `readJsonBody` 这三个只在 `lib/index.js` 里存在的函数没有任何直接测试（`Buffer` vs 对象的分支、`res.end(JSON.stringify(body))` 的 `undefined` body 等）。
5. **模拟器的 `dispose───setup───state` 三方不变式**（见 P2 #14）：ghost 与真臂共享 geometry，dispose 顺序一变就炸，但没有测试钉住顺序。
6. **`_sim_draw_star` 之外的空 `sim_stop` 幂等**：`_sim_stop` 与 `op_sim_stop` 的幂等性有 `sim-only.test.mjs` 覆盖，但 `ur_sim.VirtualRobot.stop()` 的**多次调用**、以及 `stop()` 之后紧接着 `move_joints` 的 `_plan` 起点锚定没有测试。
7. **`_interpolate_poses` 的 `max_steps=800` 截断**：[ur_sim.py:776](python/ur_sim.py#L776) 在 `span/step > 800` 时静默放宽步长（长 `movel` 的直线精度下降），无测试断言"截断后仍然是一条直线"。

---

# 结论：建议的落地顺序

**立刻做（各 1–10 行，收益可测）**：#1 listener 泄漏 · #2 `jointLimits` 死代码 · #3 loader 去重 · #4 代次计数位置。这四条都有"改改前必红"的测试可配。

**然后**：#5 `keepalive` · #6 材质白名单 · #7 kill 时 stderr · #8 ETag 缓存。

**不推荐做**：把 `fkChain` 或 `drawTrajectory` 的每帧分配当性能问题优化——实测分别是 0.7 µs 与 0.024 ms，**优化它们的收益低于改动引入回归的风险**。真正值得动的是 #10（静止时别跑 60 Hz 循环）。

**顺手补的最小测试集**：上面"盲区"第 1、2、3 条——一条 listener 计数、一组写路由信任围栏、一条 shutdown 预算边界（`budget=6000` 断言子进程**不被** kill）。

---

**已更新记忆**：把本次审计的六条可复用结论（listener 泄漏的复现与修法、`jointLimits` 死代码、SSE 默认值、loader 去重、`keepalive`、以及"先测量再报性能"的方法教训）写入今日日志（`dsh-nonead-ursim/.dsh-memory/`，kind=fact）。本轮为**只读审计、未改 `lib/` 下任何文件**，故未写交接账本、未重写白板。

## 技术文档工程师
我已完成全部核对（只读，未修改任何文件）。以下是按读者影响排序的文档缺陷清单。

## 核对基线（先给结论）

| 核对项 | 结果 |
|---|---|
| ① 工具数量 | **一致**：`lib/index.js` 注册 **86** 个唯一 `ursim_*`；README.md / README.zh.md 功能表均列全 86 且总数句都写 86；`test/tool-schema-dsl.test.mjs:44` `EXPECTED_TOOLS = 86`；`scripts/check-host-compat.mjs:35` 同为 86。实测 `node scripts/check-doc-tools.mjs` 全 PASS |
| ② 失效引用 | **有 7 处**（含 1 处此前未记录：`THIRD_PARTY_NOTICES.md` 根本不在发布包里） |
| ③ 安装/配置 | 键名、默认值、`files`、`engines`、`peerDependencies` 大体正确；**`engines: node>=20` 两版都没写**，另有若干与现状不符的说明 |
| ④ 中英差异 | **英文版多于中文版 3 处**（测试文件清单、两个 npm 脚本行为说明）；**中文版多于英文版 1 处**（实测输出串，且已过时） |
| ⑤ CHANGELOG 0.1.1 | 与 `438b686` 逐条**准确**（`applyPoseToScene`、隐藏未摆姿态模型、2 条回归、`test/twin-panel.test.mjs` 均在 diff 中）；缺陷在**缺失"需要重启/硬刷新"这类消费者指引**，以及 [0.1.0] 段的两处旧语义 |

---

# 文档缺陷清单

## D1 · blocker · README.md:292 / README.zh.md:279

**现状原文**：两版都写 `See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the per-model derivation list…` / `逐型号派生清单、转换参数与许可全文见 [THIRD_PARTY_NOTICES.md]`。
**实际**：该文件**存在**于仓库，但**不在发布包里**——`npm pack --dry-run --json` 实测 46 个文件、顶层只有 `CHANGELOG*.md / LICENSE / README*.md / assets / cordis.patch.yml / lib / package.json / python / requirements.txt`，`THIRD_PARTY_NOTICES.md` **未被收录**（npm 只自动附加 README/LICENSE/CHANGELOG/package.json，不附加 notices 类文件）。而 `package.json:13-29` 的 `files` 也没列它。
**影响**：安装 npm 包的用户拿到 5 个 UR「Graphical Documentation」网格，却被指到一个**包里不存在**的许可文件——这不是死链，是合规材料缺失。

**应为**：把 `THIRD_PARTY_NOTICES.md` 加进 `package.json` 的 `files`；README 的链接保持 `./THIRD_PARTY_NOTICES.md`（同包根，加进去后即有效）。

**建议措辞（英文）**
```markdown
See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) — shipped inside the package
(declared in `package.json`'s `files` list) — for the per-model derivation list, the
conversion parameters and the licence texts.
```
**建议措辞（中文）**
```markdown
逐型号派生清单、转换参数与许可全文见 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)
（该文件随包发布，已在 `package.json` 的 `files` 清单中声明）。
```

---

## D2 · blocker · README.md:47 / README.zh.md:44

**现状原文**：`the analysis is in [docs/urscript-manual-analysis.md](./docs/urscript-manual-analysis.md)` / `分析结果见 [docs/urscript-manual-analysis.md](./docs/urscript-manual-analysis.md)`。
**实际**：`docs/` 下**只有 2 个 PNG**（`model-pose-audit.png`、`twin-unposed-repro.png`），`docs/urscript-manual-analysis.md` 不存在；被引用的 `ScriptManual/` 目录在仓库里**完全不存在**（`git ls-files ScriptManual` = 0），`.gitignore:42-43` 也只忽略其 PDF。
**影响**：读者最需要复核的那份外部依据（签名/默认值/范围）点不开。

**应为**：二选一——(a) 提交 `docs/urscript-manual-analysis.md`（并把 `ScriptManual/txt/` 一并提交）；(b) 若确已删除，删掉该链接并改写为"本版依据官方手册核对，手册 PDF 因第三方版权不随仓库分发"。

**建议措辞（英文，选 b）**
```markdown
> 📚 **0.6.0 manual alignment**: this release checked signatures, defaults, ranges and deprecated
> functions against the three official UR manuals (URSoftware 3.15.4 / PolyScope 5 / PolyScope X).
> The manuals themselves are third-party copyrighted material and are **not** redistributed here;
> `scripts/pdf-extract2.py` re-extracts the text from your own copies into `ScriptManual/txt/`.
```
**建议措辞（中文，选 b）**
```markdown
> 📚 **0.6.0 的手册对齐**：本版本逐条对照三本官方手册（URSoftware 3.15.4 / PolyScope 5 /
> PolyScope X）核对了签名、默认值、参数范围与已废弃函数。手册 PDF 属第三方版权材料，
> **不随本仓库分发**；`scripts/pdf-extract2.py` 可从你自己的手册副本重新抽出文本到 `ScriptManual/txt/`。
```

---

## D3 · high · README.md:275 / README.zh.md:262

**现状原文**：`Point ursim_connect at its IP and all 86 tools plus the twin work normally` / `把 ursim_connect 指向它的 IP，86 个工具与孪生全部照常工作`。
**实际**：代码层明确**只接受 `127.0.0.1`**：`python/ur_worker.py:254 SIM_IP = "127.0.0.1"`，`:4103-4122` 对任何其他地址返回 `SIM_BADARG`；`lib/index.js:189/197` 参数说明也是"唯一合法值"。URSim 跑在 VM 里、有自己的 IP，**永远不可能是回环地址**。
**影响**：这是"照做就失败"的指引——升级/排障时按 README 操作会直接吃 `SIM_BADARG`。（同一根因也让中英两版顶部各自出现自相矛盾的句子：一边说"真机 IP 会在派发前被判非法"，一边教用户把工具指向 URSim 的 IP。）

**应为**：删掉该条，或改写为"本插件不连 URSim/真机；仿真是内建的"。若确实要保留 URSim 作为**代码库来源**的历史说明，必须明说当前版本不支持。

**建议措辞（英文）**
```markdown
- **URSim / a real controller are out of scope for this plugin.** The tool surface accepts exactly
  one address — the reserved loopback `127.0.0.1` — and rejects anything else with `SIM_BADARG`
  before dispatch (`python/ur_worker.py`), so no `ursim_*` call can reach URSim or a real robot.
  The built-in kinematics simulation is the only target; use it.
```
**建议措辞（中文）**
```markdown
- **URSim / 真机不在本插件的范围内。** 工具面只接受一个地址 —— 保留回环地址 `127.0.0.1`；
  任何其他地址都会在派发前被 `python/ur_worker.py` 判为 `SIM_BADARG`，因此没有一条 `ursim_*`
  调用能到达 URSim 或真机。唯一目标是内建的运动学仿真。
```

---

## D4 · high · README.md:42 / README.zh.md:42

**现状原文**：`Every tool except connect takes an ip argument and requires that IP to be connected first.` / `除「连接」外，所有工具都接受 ip 参数，且都要求先连接该 IP。`
**实际**：`ip` 在**全部 86 个工具里都是可选**且缺省回环（`lib/index.js:187-190` 的 `IP()` 注释写明"省略即默认 127.0.0.1"），不存在"必须先 connect 该 IP"；而且 `ursim_ping` **根本没有 `ip` 参数**（实测：85/86 个工具带 `ip`，唯一例外是 `ursim_ping`），`ursim_connect` 也已经不是"连接真机"而是"确保仿真就绪"。
**影响**：读者会以为必须先 connect、或以为 `ping` 需要地址，与仿真语义直接冲突。

**建议措辞（英文）**
```markdown
`ip` is **optional on every tool that takes one** and has exactly one legal value, the reserved
loopback address `127.0.0.1` (omitting it is the same as passing it); `ursim_ping` takes no `ip`
at all. There is no connect-a-robot step: `ursim_connect` *ensures the offline simulation is
running*, and any motion command also starts it on demand.
```
**建议措辞（中文）**
```markdown
凡是带 `ip` 的工具，`ip` 都是**可选**的，且只有一个合法取值 —— 保留回环地址 `127.0.0.1`
（省略即等同传入）；`ursim_ping` 不接受 `ip`。这里也没有"先连机器人"这一步：
`ursim_connect` 的含义是**确保离线仿真就绪**，任何运动指令也会按需自动开一台。
```

---

## D5 · high · README.md:201

**现状原文**：`Against DSH 0.1.7-rc.2 it reports 83/83 tools registered.`
**实际**：`scripts/check-host-compat.mjs:35 EXPECTED_TOOLS = 86`（注释："工具表当前规模（当前的 86 个）"），同文件 `:208-221` 的成功/失败判定与 `已注册 ${EXPECTED_TOOLS}/${EXPECTED_TOOLS}` 都是 86。83 是**离线仿真 3 个工具之前**的旧数字（`test/tool-schema-dsl.test.mjs:44` 的历史线也写着 `67 → 83；0.8.0 加离线仿真 3 个：83 → 86`）。
**影响**：同一份 README 里 :146 写 `should report 86/86`、:201 写 `83/83`，读者无法判断哪个是期望值，发布自检会把正常结果当成回归。**中文版无此句**（见 D9）。

**建议措辞（英文）**
```markdown
It checks the peer ranges against the installed versions, compiles **every** tool parameter schema with the host's real value-schema DSL (a rejected schema silently drops that tool), drives the host route registration, and validates the `dsh.client` declaration plus the client bundle's `__ModuleLoader__` id. Exit code `0` means this plugin works with that host; a successful run reports **86/86 tools registered** (the expected count is pinned in `scripts/check-host-compat.mjs`).
```

---

## D6 · medium · README.zh.md:157

**现状原文**：`名单来自 test/test-manifest.json（Python 13 / Node 27）`
**实际**：`test/test-manifest.json` 实为 **pythonDependent 14 + nodeOnly 28 = 42** 条，且与磁盘上的 **42 个 `*.test.mjs`** 一致；13 + 27 = 40 是个凑巧自洽但错误的拆分。
**影响**：按"13 个 Python 用例"估跳过数量会得到错的结果；也让 D7 的 40/36 之争更难判断。

**建议措辞（中文）**
```markdown
  名单来自 `test/test-manifest.json`（`pythonDependent` 14 / `nodeOnly` 28，共 42 个文件，
  与 `test/` 下的 `*.test.mjs` 一一对应），并由 `check:manifest` 保证"会调用 Python 的用例"不会被漏登记。
```
**建议措辞（英文，用于补入英文版，见 D9）**
```markdown
  The list comes from `test/test-manifest.json` (`pythonDependent` 14 / `nodeOnly` 28 — 42 files,
  matching the `*.test.mjs` files on disk), and `check:manifest` keeps it honest so a Python-using
  file can never be silently unlisted.
```

---

## D7 · medium · README.md:156（与 :165 自相矛盾）

**现状原文**：`npm test # run all 36 test files AND every check gate (see below), then summarise`，而 :165 又写 `**40 test files** under test/`。
**实际**：`scripts/run-tests.mjs:72-74` 枚举 `readdirSync(testDir).filter(endsWith('.test.mjs'))`，磁盘上是 **42 个**；两个数字（36 与 40）都过时，且互相打架。

**建议措辞（英文）**
```sh
npm test              # run all 42 test files AND every check gate (see below), then summarise
```
```markdown
- **42 test files** under `test/` (e2e protocol self-check, approval gate, twin routes, client
  state machine, FK, vendored-library regressions)
```
**建议措辞（中文，对应 README.zh.md:147、156 的同款数字）**
```sh
npm test              # 跑全部 42 个测试文件 **以及全部门禁脚本**，最后汇总
```
```markdown
- **42 个测试文件**（端到端协议自检、审批门禁、孪生路由、客户端状态机、FK、vendored 库回归）。
```

---

## D8 · medium · CHANGELOG.md:7 / CHANGELOG.zh.md:7

**现状原文**：`That earlier history is archived verbatim in [CHANGELOG-archive.md](./CHANGELOG-archive.md)` / `已原样归档到 [CHANGELOG-archive.zh.md](./CHANGELOG-archive.zh.md)`。
**实际**：两文件已于 2026-10-13 由 `88e4513`「docs: 移除 CHANGELOG-archive 归档文件」删除（2320 行），仓库与 `git ls-files` 均无。
**影响**：包内唯一的死链，读者点开是 404。

**建议措辞（英文）**
```markdown
The version line of this package **starts at 0.1.0**: `dsh-nonead-ursim` is an independent DSH plugin,
so it does not continue the version numbering of the code base it was separated from. The changelogs
of that earlier line (`0.1.0 → 0.8.0`) were archived as `CHANGELOG-archive.md` /
`CHANGELOG-archive.zh.md` and have since been **removed from the repository** (commit
`docs: 移除 CHANGELOG-archive 归档文件`), so no link is offered here; the tool-table history they
recorded is summarised inline in `test/tool-schema-dsl.test.mjs`.
```
**建议措辞（中文）**
```markdown
本包的版本线**从 0.1.0 开始**：`dsh-nonead-ursim` 是一个独立的 DSH 插件，不延续它从中分离出来的
那份代码库的版本编号。此前那条开发线（`0.1.0 → 0.8.0`）的更新日志曾归档为 `CHANGELOG-archive.md` /
`CHANGELOG-archive.zh.md`，这两个文件**已从仓库移除**（提交 `docs: 移除 CHANGELOG-archive 归档文件`），
因此此处不再提供链接；其中的工具表历史在 `test/tool-schema-dsl.test.mjs` 里有摘要。
```

---

## D9 · medium · ④ 中英互相遗漏（3 处英文多余 + 1 处中文多余）

| # | 位置 | 只存在于 | 内容 |
|---|---|---|---|
| a | README.md:165-167 | 英文 | 测试文件清单来源 `test/test-manifest.json` + `check:manifest` 的说明——**中文版缺**（读者无法得知名单真源） |
| b | README.md:173-182 | 英文 | 两个引用块：`scripts/pdf-extract2.py`（只用标准库抽手册文本）与 `check-client-bundle.mjs` **逐字节**比对提交产物——**中文版缺**（中文读者不知道产物落后会让检查失败） |
| c | README.md:190-192 | 英文 | 引用块：0.5.0 之前 `npm test` 只跑一次 worker ping——**中文版缺**（解释了"为什么以前绿灯不可信"） |
| d | README.zh.md:175 | 中文 | `` `npm test` 会返回 `selftest passed.` 或非零退出 ``——**英文版没有**，且**已过时**：`scripts/run-tests.mjs:152-159` 实际打印 `================ 汇总 ================` 与 `通过 N，失败 N，跳过 N`，全仓已无 `selftest passed.` 字样 |

**建议**：a/b/c 三段**照译补进 README.zh.md**（英文原文即建议措辞，逐段对应翻译）；d 中文改为：

```markdown
`npm test` 最后打印 `================ 汇总 ================` 与逐文件结果行
（`通过 N，失败 N，跳过 N`），任一失败即非零退出。若 `python` 不在 PATH，用环境变量指定：
```
（英文侧可保持现状，或对称补一句 `npm test` 打印汇总行并逐文件列出结果——已有 :184 的等价表述，故 d 只在中文侧修。）

---

## D10 · medium · CHANGELOG.md:49-51 / CHANGELOG.zh.md:42-43

**现状原文**：`**A persistent Python worker** (python/ur_worker.py, vendored URBasic) over a line-delimited JSON stdio protocol: one connect per IP, many commands, with RTDE / Dashboard / RealTime links kept alive across calls.` / `每个 IP 只 connect 一次即可持续发指令，RTDE / Dashboard / RealTime 链路跨调用保活。`
**实际**：本包是**纯仿真**（README.md:7 / README.zh.md:7 明写"不存在任何真机通道"，`lib/index.js:180-181` 同）；RTDE / Dashboard / RealTime 链路在仿真目标上根本不会建立，谈不上"保活"。
**影响**：CHANGELOG 是"这个版本能做什么"的权威清单，这句话与 README 的仿真声明直接矛盾。

**建议措辞（英文）**
```markdown
- **A persistent Python worker** (`python/ur_worker.py`, vendored `URBasic`) over a line-delimited
  JSON stdio protocol: the worker lives for the plugin's lifetime and runs one command per call,
  with every command targeting the offline kinematics simulation on the reserved loopback address.
  (The vendored RTDE / Dashboard / RealTime paths the worker still carries are **unreachable** from
  the tool surface.)
```
**建议措辞（中文）**
```markdown
- **常驻 Python worker**（`python/ur_worker.py`，vendored `URBasic`），走行分隔 JSON 的 stdio 协议：
  worker 在插件生命周期内常驻、每次调用跑一条指令，所有指令都作用于保留回环地址上的**离线运动学仿真**。
  （worker 里仍然带着的 RTDE / Dashboard / RealTime 那几条路，从工具面上**不可达**。）
```

---

## D11 · medium · CHANGELOG.md:58-62 / CHANGELOG.zh.md:48-51

**现状原文**：`**Kinematics-level offline simulation** on the reserved loopback address 127.0.0.1: ursim_sim_start / ursim_sim_stop / ursim_sim_status…` 出现在 **[0.1.0]** 的 `### Added` 里；而同一文件 :154-156 又写"独立之前的更新日志（原 `0.1.0 → 0.8.0` 开发线）已归档、不再随包发布"，:161 只把"86 个工具"归给 0.1.0。
**实际**：`test/tool-schema-dsl.test.mjs:44` 的历史线写明 `0.8.0 加离线仿真 3 个：83 → 86`——离线仿真的 3 个工具来自归档的 **0.8.0**，不是本包 0.1.0。
**影响**：读者按 [0.1.0] 段理解"哪些是本包新东西"时会得到错误结论（这正是 D5 的 83/86 混淆源头）。

**建议措辞（英文，插入 [0.1.0] 段首行之后）**
```markdown
> **Scope note.** This is the first release under the package's own version line, so this section
> summarises the whole capability set that 0.1.0 ships — including work that originally landed under
> the archived 0.8.0 line (`ursim_sim_start` / `_stop` / `_status` and the 83 → 86 tool-table
> growth). The 0.1.1 entry below lists only the changes made after that baseline.
```
**建议措辞（中文，插入 [0.1.0] 段首行之后）**
```markdown
> **范围说明。** 这是本包独立版本线的首个版本，因此本段汇总的是 0.1.0 **随包提供的整套能力**，
> 其中包含原本落在已归档的 `0.8.0` 线上、现已并入本次基线的工作（`ursim_sim_start` /
> `_stop` / `_status` 三个工具，即工具表 83 → 86 的增长）。其后的 0.1.1 段只列基线之后发生的改动。
```

---

## D12 · medium · ③ 安装/配置：`engines` 漏文档 + `verify:host` 缺省宿主说法失真

**(a) 缺 `engines`（README.md:183-188 / README.zh.md:175-179 两版都缺）**
**实际**：`package.json:94-96` 声明 `"engines": {"node": ">=20"}`；两版全文**没有任何 Node 版本要求**。Node 18 用户会在 `pnpm install` 阶段吃到引擎告警/失败，却不知道门槛从哪来。

**建议措辞（英文，加在 Install 小节开头）**
```markdown
**Prerequisites**: Node.js **20 or newer** (`package.json`'s `engines` field), plus a Python 3
interpreter with `numpy` and `paramiko` (see "Python runtime" below).
```
**建议措辞（中文）**
```markdown
**前置条件**：Node.js **20 及以上**（见 `package.json` 的 `engines` 字段），以及一个装有
`numpy`、`paramiko` 的 Python 3 解释器（见下文「Python 运行时」）。
```

**(b) 中文版缺省宿主描述失真（README.zh.md:184）**
**现状原文**：`node scripts/check-host-compat.mjs # 缺省宿主 = ../dsh-plugin-desktop/node_modules`
**实际**：`scripts/check-host-compat.mjs:54-68` 的候选顺序是 `argv[2]` → `DSH_HOST_NODE_MODULES` 环境变量 → `C:\Program Files\DSH Desktop\resources\app\node_modules` → `C:\Program Files (x86)\DSH Desktop\...`；**没有** `../dsh-plugin-desktop/node_modules` 这个候选。英文版 :197 的 `# auto-discovers a real DSH installation` 是准确的，中文版这句是错的。

**建议措辞（中文）**
```sh
node scripts/check-host-compat.mjs                 # 自动探测已安装的 DSH（也读 DSH_HOST_NODE_MODULES）
node scripts/check-host-compat.mjs <node_modules>  # 也可显式指定宿主
```

---

## D13 · low · `scripts/check-package-metadata.mjs:79-89`（门禁对"归档文件已删"无感，仍按旧事实放行）

**现状原文**：注释 `The *-archive files are the pre-independence changelog history: **kept in the repo**, excluded from the published tarball…`，`ALLOWED` 里仍列 `CHANGELOG-archive.md` / `CHANGELOG-archive.zh.md`。
**实际**：两文件已删（88e4513）。门禁实测 PASS，但 PASS 文案会把两个不存在的文件当成"允许的例外"打印出来——这是本次审计里"数字/清单已过时但门禁照样绿"的一个实例。

**建议**：把这两个名字从 `ALLOWED` 移除、注释改为"已于 88e4513 从仓库移除"，并在 `check-package-metadata.mjs` 里加一条断言：README/CHANGELOG 中出现的**仓内相对链接**必须指向真实存在的路径（可顺带自动拦住 D2/D8 这类死链）。

---

## D14 · low · THIRD_PARTY_NOTICES.md:46

**现状原文**：`用 scripts/convert-meshes.py（trimesh + pycollada + fast-simplification）离线转换`
**实际**：`scripts/convert-meshes.py:227-229` 的 `--simplify-*` 选项帮助文本标注"需 `fast-simplification`"——即**可选**依赖且 README 明说"不做抽稀"；`requirements.txt` 只装 `numpy>=1.21` / `paramiko>=2.11`。
**影响**：照抄这份依赖表会多装一个用不上的包，或让读者以为转换流程必须装它。

**建议措辞（中文）**
```markdown
用 `scripts/convert-meshes.py`（`trimesh` + `pycollada`；如需抽稀再另装可选的 `fast-simplification`，
本项目的默认转换**不做抽稀**）离线转换为**每型号一个 GLB**，输出到 `assets/models/<urXX>.glb`，随包分发。
```
**建议措辞（英文，供 THIRD_PARTY_NOTICES 增补英文段时使用）**
```markdown
converted offline with `scripts/convert-meshes.py` (`trimesh` + `pycollada`; `fast-simplification` is
only needed for the optional decimation flags, and this project's default conversion does **not**
decimate) into one GLB per model under `assets/models/<urXX>.glb`.
```

---

## D15 · low · README.zh.md:184/185 保留旧宿主示例、README.md:121 / README.zh.md:114 本地路径不一致

**现状原文**：两版方式二示例都是 `"dsh-nonead-ursim": "file:D:/MyProgram/GitLab/dsh-nonead-ursim"`。
**实际**：本仓库实际在 `D:\MyProgram\GitHub\dsh-nonead-ursim`（`git remote` 为 `git@github.com:NoneadChina/dsh-nonead-ursim.git`）。英文版 :117 还额外注明"pnpm supports `file:`"，中文版 :110 同义，措辞一致，可保留；问题只在**路径里的 `GitLab`** 与现实的 `GitHub` 不符——照抄会指向不存在的目录。

**建议措辞（英文）**
```jsonc
"dependencies": {
  "dsh-nonead-ursim": "file:D:/MyProgram/GitHub/dsh-nonead-ursim"
}
```
**建议措辞（中文）**
```jsonc
"dependencies": {
  "dsh-nonead-ursim": "file:D:/MyProgram/GitHub/dsh-nonead-ursim"
}
```
并在两版下各加一行：`（把路径换成本机克隆本仓库的位置）/ (replace with wherever you cloned this repository)`。

---

# 可以直接合并的修复顺序

1. **D1 + D2 + D8**：三处链接级缺陷（补 `files`、补/删 `docs/` 链接、删归档链接）——一次性提交即可让"点开即错"归零。
2. **D3 + D4**：两条会直接误导操作/调用的语义错误（URSim 指引、"每个工具都要 ip 且要先连接"）。
3. **D5 + D6 + D7**：三个数字（83/83 → 86/86、13/27 → 14/28、36/40 → 42）。
4. **D9**：中英互译补齐（英文 3 段 → 中文；中文 1 句过时输出 → 改）。
5. **D10 + D11**：CHANGELOG 两处旧语义 + 范围说明。
6. **D12 + D13**：`engines` 补齐、缺省宿主说法修正、门禁加链接存在性断言（能自动拦住 1 类回归）。
7. **D14 + D15**：依赖表与路径示例。

**未发现问题的部分（供你确认审计覆盖面）**：工具清单与注册表 86/86 完全一致且经 `check-doc-tools` 实测 PASS；`package.json` 的 `main`/`exports`/`peerDependencies`/`files` 与 `cordis.patch.yml` 的四个键（`pythonBin` / `commandTimeoutMs` / `connectTimeoutMs` / `requireApprovalForMotion`）在 README 中的键名与默认值**全部正确**；14 个 GLB / 20.86 MB / 35.11 → 28.27 → 20.86 MB 的体积叙事与实测 14 个文件、20.88 MB 吻合；`npm run verify:models`、`npm run analyze:models`、`npm run compress:models*`、`npm run build:client` 等脚本名全部与 `package.json:30-46` 对得上；中英两版**章节结构完全对齐**（各 14 个标题）。另核实 `docs/twin-unposed-repro.png`、`docs/model-pose-audit.png` 两图**未被任何文档引用**（无死链，但也无人看得到）。

**说明**：本次为只读审计，未修改任何文件。`check-client-bundle.mjs` 会在 `lib/` 下生成一个 `.client.rebuild-check.js`（`.gitignore:31` 已忽略，非我新增的产物；`git status` 仍为干净）。
