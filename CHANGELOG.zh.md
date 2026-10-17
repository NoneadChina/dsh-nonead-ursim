# 更新日志 / Changelog

本包遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

本包的版本线**从 0.1.0 开始**：`dsh-nonead-ursim` 是一个独立的 DSH 插件，不延续它从中分离出来的
那份代码库的版本编号。此前那段历史已原样归档到 `CHANGELOG-archive.zh.md`；该文件在准备 0.1.1 时
**已从本仓库移除**（可从导入源码的那个提交 `4c91704` 取回），并且从未进入过发布包。

## [0.2.4] - 2026-10-17

一次由全项目审核驱动的加固版：四个只读审查分别覆盖宿主半边、Python worker/仿真、浏览器面板、
工程与发布面。下面每条修复都配了一个在旧代码上会失败的测试。

### 修复

- **面板的寄存器行不再在约 100 ms 后消失。** `renderIo` 原用 `ioBody.textContent = …`（会移除全部子节点），
  而 `renderRegisters` 是追加一行 ⇒ 1 Hz 的 HUD 节拍把刚显示的寄存器抹掉。现在 `ioBody` 拆成两个固定
  子节点（数字位 / 寄存器），各自独立更新。
- **读类准入不再有竞态，且一帧的扇出不再超过闸门。** 原准入在 `await` 之前完成，同一 tick 的批量读能全部
  通过（8~16 个读即可占满全部槽位，把 `stopj`/`stopl`/`stop_program` 挤成 `WORKER_BUSY`）。现在准入同步
  占槽，一帧内的读串行发出（整帧只占 1 个读槽）；`readIo` 某一拍失败时回退到上一笔成功读数，不再整块
  变成错误行。
- **取消请求不再无差别杀掉 Python 子进程。** 慢审批与"尚未派发就取消"过去会拆掉空闲的 worker（真机上
  等于丢掉 RTDE 会话，而控制器仍在执行）。现在 `onAbort` 尊重 `killOnTimeout`，且只在 payload 已写入后
  才杀；超时文案明确写出"控制器侧动作可能仍在继续"。门禁类工具在宿主 deadline 上另有审批余量（下发预算
  不变）。
- **`ursim_connect` / `ursim_disconnect` 会登记它们隐式启动/停止的仿真生命周期** ⇒ 门禁的仿真目标豁免、
  面板 I/O 写路由、子进程重建后的自愈三条承诺重新与 worker 一致（两条路径也不再给出不同型号）。
- **运动失败如实上报。** 当到位确认失败（含"控制器从未开始执行脚本"）时，信封原为 `ok: true` + `data.ok: false`；
  现在为 `ok: false` 并带 `NOT_EXECUTED` / `NOT_CONNECTED` / `TIMEOUT`；成功路径逐字节未变。
- **逆解多起点兜底加了连续性门。** 兜底解可能距上一航点 5.3~6.7 rad，即仿真"已到达"却走了一条真机走不了的
  路径。现在兜底解必须在 `MAX_IK_STEP_RAD = 0.5` 内（有一次局部重解机会），否则整条以 `SIM_UNREACHABLE`
  失败。
- **worker 的 stdin 改为 UTF-8。** 中文 Windows 下 `sys.stdin` 是 GBK，非 ASCII 参数被静默损坏，回包时才
  抛 `UnicodeEncodeError`（**副作用已发生**）。现在 spawn 带 `PYTHONUTF8=1`，worker 侧也把 stdin 重配为 UTF-8。
- **`real` 模式下 `ursim_connect`/`ursim_disconnect` 可用**：保留回环地址仍表示仿真（结构性保证不变），
  白名单内其它地址现在会建立/释放真机会话，而不是报令人困惑的 `SIM_BADARG`。

### 变更

- 工具描述**按运行模式生成**：real 模式下 `ip` 标注为必填且需在白名单内（golden 更新 85 处，非描述字段零变化）。
- 两份 README 的受门禁 op 清单改由 `check-doc-tools.mjs` **与 `APPROVAL_OPS` 双向对账**，并补上原先遗漏的
  7 个 H-1 op。
- `engines.node` 改为 `>=22.15`（`verify:host` 的真实门槛）；CI 用 Node 22 + `npm ci`，不再用
  `continue-on-error` 掩盖 `verify:host`；`npm test` 跑 **11** 道门禁（新增 `tool-matrix` 与
  `check-doc-links`），两份 README 的数字更正为 48 个测试文件 / 17 Python / 31 Node。
- 新增 `package-lock.json`（提交进仓库的产物只有在 esbuild 版本被钉住时才逐字节可复现）。
- 第三方**许可全文**随包发布：MIT（URBasic、three.js）与 BSD-3-Clause（UR 图形文档）全文进
  `THIRD_PARTY_NOTICES.md`，另加 `LICENSE-AGPL-3.0.txt`。
- 安装示例不再含作者本机 GitLab 路径；绝对路径门禁能识 `X:/…`、`/home/…`、`/Users/…`，并把 vendored 里
  一条被注释掉的上游示例路径登记为有据的例外。

验证：`npm run check` exit 0；`npm test` 59/59（48 测试文件 + 11 门禁）；`verify:host` 87/87。
## [0.2.3] - 2026-10-15

### 变更

- **运动默认不再需要人工确认。** `requireApprovalForMotion` 默认值改为 `false`，门禁成为**显式开启**的能力
  （设成 `true` 即恢复）。门禁本身一字未改：开启时每一条受门禁的指令（`APPROVAL_OPS`）仍然会暂停等待确认，
  且未组合审批服务 / 无代理 / 应答不是 `allowed-once` 时依旧 **fail-closed**（拒绝且不下发）；**仿真目标**
  （`motionMode: 'sim'` + 保留回环地址）在任何情况下都豁免。
- 该默认值由**三处**共同声明、必须一致：Config schema 的 `z.boolean().default(false)`、代码兜底
  `config.requireApprovalForMotion ?? false`、随包发布的 `cordis.patch.yml`。`scripts/check-approval-gate.py`
  新增一条检查，任一处写成 `true` 即构建失败 —— 已用"临时把随包取值改成 true ⇒ exit 1 ⇒ 原样还原"验证过
  这条守卫真的会咬，产品默认不会悄悄漂移。
- README / README.zh / 面板对齐设计稿改述为"门禁可选开启"。0.1.0 段的 CHANGELOG 与带日期的审计存档属于
  历史记录，刻意未动。

验证：`npm run check` exit 0（87 工具 / 88 op）；`npm test` 57/57（0 失败 0 跳过）；
`scripts/check-host-compat.mjs` 报 87/87 个工具经宿主真实值 schema DSL 注册成功。
## [0.2.2] - 2026-10-15

### 新增

- **`ursim_run_sequence` —— 一次调用跑完整段多段轨迹。** 传入一个有序的段列表
  （`{"type":"joint","q":[…]}` / `{"type":"cartesian","pose":[…]}`）加一对 `v`/`a`（可选整段 `t`），
  它把这些段作为**一条连续轨迹**执行：离线仿真里每段转成关节航点后拼成一条折线、整条折线只排
  **一次**时间剖面（`ur_sim.VirtualRobot.run_sequence` → 恰好一次 `_plan`），所以**段与段之间不起停**
  —— 20 段是一次加速一次减速，而不是 20 次启停。直线段按 1 cm 细分并逐点求逆解（每个点以上一点为
  种子）；任何一个点无解都让**整条序列**失败，绝不悄悄跳过。
  真机路径把同样的段发成 URScript `movej`/`movel`（带 `a`/`v` 与可选交融半径 `r`）；整段 `t` 在真机
  路径上**不建模**，回包会明说（`t_ignored`）。
- `ursim_draw_circle` / `ursim_draw_square` / `ursim_draw_rectangle` / `ursim_draw_star` 新增可选
  `v` / `a` / `t`。此前它们的速度写死（`a=1.0, v=0.25`），想把一个图形拉长只能靠
  `ursim_sim_start(speed_scaling=…)` 把整个仿真调慢。默认值保持不变，既有调用行为与以前逐字节相同。
- `ursim_run_sequence` 纳入运动门禁（`APPROVAL_OPS` / `MUST_BE_GATED`）；待审批摘要会如实报出段数与
  段类型（关节/直线），不假装这条序列有单一目标位姿。

### 变更

- 工具表 86 → **87** 个。`docs/tool-schemas.golden.json`、`docs/tool-matrix.json`、`docs/tool-matrix.md`
  按源码重新生成；其余 81 个工具的 schema 逐字节未变。

验证：`npm run check` exit 0（87 工具 / 88 op；两份 README 的表与总数一致）；`npm test` 57/57
（0 失败 0 跳过）；`scripts/check-host-compat.mjs` 报 **87/87** 个工具经宿主真实值 schema DSL 注册成功。
## [0.2.1] - 2026-10-15

### 变更

- **数据停滞提示改为与身份行同一行。** 「数据已停止更新 …」过去独占一行，现在与「机器人 <型号> · <IP>」
  同一行、排在身份文字之后（身份行 `display: flex`，两者都不换行、超长各自省略）。两者语义没变 ——
  身份行回答"是哪一台"，提示回答"数据通道怎么样" —— 只是不再各占一行。
- 身份文字改为行内独立的 `<span data-ursim-twin-identity-text>` 子节点。这不是装饰：DOM 里给
  `textContent` 赋值会**移除该元素的全部子节点**，所以把身份文字直接写在行上，会把刚并进去的提示删掉
  （HUD 约 10 Hz 刷新，实机上等于看不到）。现在有一条面板测试按结构钉住"同一行"。

说明：版本按维护者要求直接 `0.1.17 → 0.2.1`，`0.2.0` 未单独发布。

验证：`npm run check` exit 0；`npm test` 57/57（0 失败 0 跳过）；重建产物可由 `src/client/**` 逐字节复现。
## [0.1.17] - 2026-10-15

### 修复

- **面板的 I/O 与寄存器永远读不出值。** `/state` 路由只把 `detail` 转给读取逻辑，把 `io` / `reg` /
  `from` / `count` 全丢了 —— 于是 `wantsIo` / `wantsRegisters` 恒为 false，返回的帧里根本没有
  `io` / `registers` 字段，面板那两块只能空着（或一直停在"读取中…"上）。0.1.16 修的是同一条路上的
  op **名字**，这是第二处**独立**缺陷：**一处要参数被转发，一处要名字写对。**
  URL→查询对象的翻译现在是一个**纯函数白名单** `twinStateQuery`，路由与单测共用它 —— 之前的单测都是
  **直接调用读取逻辑**、从不经过路由，这正是"面板什么都看不到、四道门却全绿"的原因。

验证：用真 worker、按路由的两种转发方式对照 —— 旧转发得到 `body.io = undefined` /
`body.registers = undefined`；新转发得到 `body.io = {digital_out[16], digital_in[16], analog_in[0,0],
simulated, note}` 与 `body.registers = {set:int, from:0, count:8, values:[0,…]}`。
`npm run check` exit 0；`npm test` 57/57。
## [0.1.16] - 2026-10-15

### 修复

- **面板的 I/O 一行永远读不出值。** `lib/twin-routes.js` 读数字输出用的 op 名是 `get_digital_out_bits`
  （照**工具**名 `ursim_get_digital_out_bits` 写的），而 worker 真正实现的是 `get_digital_output_bits`。
  一个未知 op 就足以拖垮整行：`readIo` 的四次读在 `Promise.all` 里，于是 `body.io` 退化成 `{error}`、
  面板显示"读不到"。寄存器那条宿主侧一直是好的 —— 它被同一行错误盖住了。面板测试也伪造了同一个错名，
  所以四道门全绿；现在 `check-worker-ops.py` 会把**宿主以字面量调用的每一个 op 名**（含绕过工具表的
  孪生路由）与 worker 的 `HANDLERS` 对账，这类笔误静态就能抓住。
- **动画一顿一顿，面板常驻「数据已停止更新 Ns · 正在重试」。** SSE 的 detail 慢节拍（每 2 s 一帧）在
  **帧路径**上 await 两次 worker 往返（`status` + `get_target_values`）。worker 是单线程 stdin 队列，
  机器人运动时这两次读会一直排队到 twin 读预算（2500 ms）耗尽 —— 每两秒就卡一帧，而且永不停止。
  现在详情是**有界等待**（`TWIN_DETAIL_BUDGET_MS`，400 ms）+ 上一笔缓存 + 同一台机器人去重：worker
  空闲时语义不变，读失败仍如实写 `detail.error`。
- **仿真帧不带连接代次。** 推送循环的 `conn` 取 `ROBOT_CONN_SEQ`，仿真没有这条记录 ⇒ 宿主读到
  `undefined` ⇒ 退回每 `TWIN_MODEL_TTL_MS`（10 s）重读一次型号 —— 又是一次会排在运动后面的读。
  仿真帧现在发 `round(sim.created_at, 3)`：同一次仿真内恒定，重启即变化。
- **自愈探针会杀掉正在执行运动指令的 worker。** `heal()` 的 `sim_status` 探针改为
  `killOnTimeout: false`：探针超时不等于进程死了。

### 变更（仅开发工具，不属于发布包）

- `scripts/check-client-bundle.mjs` 在比对哈希前归一化行尾：`core.autocrlf=true` 时逐字节比较会把
  CRLF 检出误判成"产物落后"（提交 blob 与重建产物其实逐字节相同），在 Windows 上产生过假红。
- `scripts/check-doc-links.mjs` 把 `python/sitecustomize.py` 记入有意缺失 —— 该文件是被**有意删除**的，
  引用它的审计报告原文为不改动证据而保留。

验证：`npm run check` exit 0；`npm test` 57/57（含 Python）；面板取数用真 worker 复跑（置位数字输出后
读回、`digital_in` / `analog_in` / 寄存器都有值）；宿主帧路径在运动期间实测（45 帧、平均 224 ms、0 帧
stale）。

## [0.1.15] - 2026-10-15

### 修复（仅开发工具，运行时无变化）

- **`npm run verify:host` 现在开箱可用。** 这条宿主 API 兼容性自审（peer 版本、用宿主**真实** DSL 编译
  全部工具 schema、路由形状、客户端装载契约）过去一跑就报"请显式传宿主 node_modules 路径"：它的候选
  路径写死了产品目录名（`C:\Program Files\DSH Desktop\…`），而本机安装目录是 `Nonead DSH Desktop`
  ⇒ 每个候选都落空，这道自审实际上从未执行过 —— 而**跑不起来的检查比查出问题更糟**，因为它挡的正是
  "工具静默消失"。现在它会扫常见安装根下任意含 DSH 的目录，**不带参数**即报 `result: 全部通过`
  （86/86 工具经宿主 DSL 注册）。
- 本版**对发布出去插件没有任何改动**：`scripts/` 不属于发布包（见 package.json 的 `files`）。升版本号只
  是为了让这处工具修复可追溯。

## [0.1.14] - 2026-10-15

### 修复

- **代码审核：两处"同一规则、两处实现"的漂移。** 两条都是靠**扫已知的失败类型**（重复常量、调用方
  自己重实现阈值、没有调用方的能力）找出来的，不是重读 diff：
  - **回环地址写了两遍。** `lib/index.js` 有自己的一份 `SIM_IP`，`lib/twin-io.js` 又写了一份（理由
    是"避免 import 环"）。只改一处会让面板的 I/O 写**静默打到另一个地址** —— 这类漂移最难发现，因为
    两边都"看起来对"。现在地址放在零依赖模块 `lib/sim-ip.js` 里（正因为零依赖才不会成环），两个文件
    都从它 import；并有测试把写路径钉在这个真源上。
  - **面板自己重实现了模块的阈值。** 奇异点提示行用硬编码的 `hint.limitDeg > 5` 判断"是否贴限位"，
    而真正的阈值是 `manipulability.js` 的 `LIMIT_MARGIN_DEG`。修法不是"让面板 import 常量"，而是
    **让模块直接给结论**（`limitNear`）—— 规则只存在一处；边界（5° 算、5.1° 不算）由测试钉住。

### 说明

- 0.1.13 加的 `io` 写动词**当前面板里没有调用方**（用到它的 I/O 页在 0.1.14 里、已按要求回退）。
  它被**有意保留** —— 它是 0.1.13 已发布并写进 CHANGELOG 的能力 —— 但在这里记一笔，免得后来者当
  死代码删掉。

## [0.1.13] - 2026-10-15

### 新增

- **面板能写 I/O 了（设计方案 P1 的宿主半边）。** 面板原先只能通过那条唯一写路由开关仿真，现在还能写
  **数字输出**（布尔）与**模拟输出**（工程单位下的有限数，可选 `full_scale` 10 V / 20 mA）—— 正好是
  参考 I/O 页真正会写的两样东西。三条刻意的限制：
  - **只在离线仿真运行时受理**（否则 `409 SIM_NOT_RUNNING`）。面板写通道**不面向真机**：真机 I/O 仍走
    工具，那里有审批门与声明面白名单 —— 面板上多一个按钮，不能变成绕过门禁的路。
  - **参数白名单 + 当不可信输入校验**（`lib/twin-io.js`）：只认 `digital_out` / `analog_out`，`n` 必须是
    0-15 的整数（标准端 0-7 加可配置端 8-15），值的类型随种类而定。把它抽成纯模块（而不是写在路由里）
    正是为了**可单测**：路由那一层因此薄到不需要自己的测试。
  - 写这层校验时抓到两个真实的宽容点，对任何写入型接口都值得记住：`Number('')` 与 `Number(null)` 都
    等于 **0**，于是"没传端口"会被悄悄解读成"写 0 号端口"。现在两者都被拒，并有测试钉住。

## [0.1.12] - 2026-10-15

### 修复

- **断连时收尾 C1/C4 状态（0.1.11 的回归）。** 0.1.11 加了奇异点行与超限连杆着色，但断连分支只清了旧的
  HUD 行 —— 于是有两条陈旧信息会残留：风险行还挂着上一次位姿的「⚠ 奇异点 · 腕 1.2°」，而被染红的那节
  连杆**继续红着** —— 重连到另一台机器人、甚至换了型号之后仍然红，可那个关节早已不是超限的那个。现在
  行（文本、等级、title）与着色都会一并清掉，并且同时重置「上次渲染」缓存 —— 没有这个重置，下一帧会因
  "结果没变"而完全跳过重新渲染与重新着色。

## [0.1.11] - 2026-10-15

### 新增

- **奇异点与可操作度提示（路线图 C1）。** 3D 画面能显示机械臂**在哪**，却看不出**它离"动不了"还有多
  近**：UR 的腕部奇异点（第 5 关节 ≈ 0，腕部三轴共线）在画面上和普通位姿一模一样，可到了那里逆解
  会发散、笛卡尔指令会突然要求关节高速旋转。现在 HUD 里多一行，给出三样东西，全部在客户端用**画面
  同一份正解**算出：**腕角**、**归一化可操作度** `|det J| / 臂展³`、以及**离最近关节限位的余量**
  （越过 near 阈值转琥珀、越过 at 阈值转红）。
  - 雅可比用的是**解析几何雅可比**（位置行 `z × (p_end − p)`、角速度行 `z`，直接读 `fkChain` 的
    连杆矩阵）—— 不做数值微分，也不额外求 FK。
  - 阈值是**标定出来的，不是拍脑袋**：`scripts/calibrate-manipulability.mjs` 在 14 个型号上各采样
    4000 个位姿并扫描腕角。标定过程中有两个值得记住的发现：**只用位置**雅可比**完全看不见** UR 的
    腕部奇异（`|q5|` 从 0.5° 到 90°，σ_min/臂展 只从 0.2766 变到 0.2413 —— 退化在角速度行里）；以及
    关节轴若取 `links[i-1]` 而不是 `links[i]`，会丢掉那个 90° 的固定变换，让 `det J` 恒为 0。最终
    阈值（`at = 0.001`、`near = 0.004`）落在"普通位姿分别有 3% 与 10% 会命中"的位置。
- **超限关节在 3D 里着色（路线图 C4）。** HUD 早就会说"J2 超限"，可画面上六根长得差不多的连杆看不出
  是**哪一节**。现在对应那节会被染红。材质在**第一次着色时克隆**（GLB 材质在多实例间共享，染红一个
  面板不能把另一个也染红），关节回到限位内时把原来的自发光值逐字段还原。

## [0.1.10] - 2026-10-14

### 新增

- **仿真态落盘：跨宿主重启存活（路线图 E2）。** 宿主一直记着"应该有一台什么仿真"，以便在 Python
  子进程被替换时重建它 —— 但那份记忆只在进程内，于是**重开 DSH 或重载插件**就把它弄丢了，自愈
  也无从谈起（表现是"刚才还开着，现在一切从头开始，而且没有任何说明"）。现在它写到磁盘：
  `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`，原子写（临时文件 + rename），可用
  `simStateFile` 改路径、`persistSimState` 关闭（默认开）。
  - 落盘的是**意图**而不是"最后一帧画面"：`enabled: true` 加型号、起始姿态与速度倍率。关掉仿真时
    写的是 `enabled: false`，所以**用户明确关掉的仿真同样跨重启保持关闭** —— 这与进程内自愈原本
    就承诺的语义一致。而上次还开着的，加载时会再建一台（一次 `sim_start`，有日志）。
  - 落盘是加分项，绝不让插件挂掉：数据目录只读、文件不存在、JSON 损坏、格式版本不认识、或
    `enabled: true` 却没有型号 —— 全部降级成"没有记忆"（后两种各留一条告警）；写入全程 try/catch，
    失败只记日志。
  - `GET /nonead-ursim/twin/sim` 现在还返回 `remembered` 与 `restore_error`，恢复失败时面板会在仿真
    栏里说明原因，不再留下"这里为什么没有仿真？"无人回答。

## [0.1.9] - 2026-10-14

### 新增

- **面板里的 I/O 与寄存器读数。** 补上最后一处"有功能没入口"：仿真自 0.1.5 起就有 I/O 与寄存器的内存
  态、`ursim_get_digital_out_bits` 等也读得到，但面板里什么都看不到。现在展开新的 **「I/O 与寄存器」**
  折叠块即可读到 16 路数字输出、16 路数字输入、两路模拟输入（位串按 `00000000 00000001` 渲染，正好是
  标准端与可配置端两段），以及 int / double / bit 寄存器各 8 个值。
  - **按需读**：折叠着时一个请求都不发；展开时数字位一次请求、每片寄存器各一次，之后数字位以 1 Hz 刷新
    （只要它保持展开）。寄存器是**逐下标 getter**（int 全读 24 次、bit 全读 64 次），所以只在展开那一刻
    读一次，而不是跟着定时器跑。
  - 宿主侧不新增路由，而是在**已有的** `twin/state` 上加两个可选通道（`io=1` 与
    `reg=<集合>&from=&count=`，`count` 上限 16）：那条路由已经解决了 ip 解析、读信任围栏，以及"加分通道
    失败只写自己的 `{error}`、不带走位姿通道"这三件事。
  - 它**只走 RTDE 侧的读法**（`get_digital_out_bits` / `get_digital_input_bits` / `get_analog_in`）：
    `get_digital_in` 的 `which="tool"` 会发一段可能打断正在运行程序的 URScript，只读面板不能造成这种
    副作用。仿真下该块还会写明"输入没有信号源（恒 0）"，不让那些 0 冒充信号。

## [0.1.8] - 2026-10-14

### 新增

- **面板现在显示当前模式（P0，安全相关）。** 左上角那枚角标过去**只在仿真运行时**才出现，于是"没有
  角标"读起来就像"什么都不会动"—— 而 `motionMode: 'real'` 下指令确实会打到真机。现在是**三态指示**：
  驱动虚拟机器人时紫色 `仿真`；只要配置了真机模式就常显红色 **`真机模式 · <允许的 IP>`**（**断连时
  也显示**，且白名单为空时明确写出"全部拒绝"）；什么都不在驱动时是中性 `未连接`。
  `GET /nonead-ursim/twin/sim` 相应增加 `motion_mode` 与 `real_robots` 两个字段供客户端渲染。
- **遥测行：估算标注 + 两项从未画出来的读数（P1）。** `joint_currents` 与 `tcp_speed` 一直在 `detail`
  里传到客户端，却没人渲染；现在各有一行（TCP 速度取线速度模长）。并且只要宿主标了
  `telemetry_estimated`，这几行就带 **`（估算）`** 后缀 —— 界面不能把估算值画成与测量值同形，这正是
  工具回复里已经做到的诚实性。
- **仿真的能力边界在面板里可读（P2）。** 仿真控件下面多了一行可展开的说明，列出每个桶各有多少项
  （运动 / 读回 / I/O 与寄存器 / 遥测 / 不支持），完整清单在悬停提示里；数据本来就在 `twin/sim`
  响应里。

## [0.1.7] - 2026-10-14

### 变更

- **术语统一为「仿真面板」**（中英一致）：`twin panel` / `digital twin` → `simulation panel` /
  `simulation`，中文「孪生」→「仿真」，覆盖文档、工具描述与界面文案。**内部标识符有意不动** ——
  `lib/twin-*.js`、`/twin/*` 路由、`ursim-twin` DOM 命名空间是线路与 DOM 契约，改名收益为零、却要动
  客户端产物；`docs/audit-2026-10-13-four-experts.md` 也保持原文，改专家写下的记录等于篡改证据。
- **侧边栏卡片图标换成机械臂**：旧的画的是"一栋带旋钮的房子"，现在画底座横板 → 立柱 → 斜向上大臂
  → 腕部下垂的两指夹爪，两个关节点用圆圈标出；沿用原来的 26 px 槽位与强调色。

### 新增

- **`check-tool-params.py` 两侧都改成真解析（路线图 D2）。** schema 侧过去是从 `lib/tool-defs.js` 里
  **当文本**抠的（要求两个字段相邻两行的正则、手工数括号找参数块、以及一条"解析到 86 个工具了吗"
  的守卫来兜住"解析可能什么都没找到"这件事）。现在读 `docs/tool-schemas.golden.json`（注册面快照）
  —— 本版起它带上每个工具的 **`op`**，这正是让 schema 与 `HANDLERS` 对上的桥。Python 侧仍是 `ast`
  解析，且认得代码里实际存在的形态：转发给 helper（`_axis_move(p, …)`）、`_sim_require(p, "k", …)`、
  `_vec` 与 `_float_list` 的键位置差异、`str(p.get("k", "")).lower()` 的枚举分派链，以及
  "缺省即拒绝"与"存在才拒绝"两种守卫的区别。
- 断言从两类变成三类：**声明 ↔ 读取**（原有）、**必填 ↔ 是否真的强制**（标了 required 却静默取默认值、
  以及硬读却没标 required）、**类型 ↔ 取值方式**（`boolean`↔`bool`、`integer`↔`int`/`_bounded_int`、
  `number`↔`float`/`_bounded_float`、`array`↔向量 helper）。**范围有意不比对**：快照里的区间是散文
  （"端口号：std 0-7、config 8-15"），没有可比的结构。静态分析证不了的（必填的第二个方向、条件必填）
  一律作为 **note** 列出，而不是悄悄吸收。

### 修复

- **两个工具把 int 寄存器声明成了 `number`**（`ursim_send_script`、`ursim_draw_circle`），而句柄用
  `_bounded_int` 校验 —— schema 承诺了一个带小数的寄存器号，worker 会拒绝。由新的类型断言发现。
- **`ursim_set_tool_output_mode.mode` 不再默认成 `1`（power）。** schema 把 `mode` 标为必填，句柄却
  静默默认到"把工具数字输出针复用为附加电源"的那一档 —— 这是本插件里唯一可能损坏法兰上所接器件的
  设置。缺 `mode` 现在明确报 `BADARG`。

## [0.1.6] - 2026-10-14

### 新增

- **仿真的遥测（路线图 B1）。** 五个此前一律回报 `SIM_UNSUPPORTED` 的 op 现在返回**估算值**：
  `get_runtime_telemetry`（关节电流/电压/速度、TCP 速度与受力、工具加速度计、动量、整机电压/电流、
  关节温度），以及单值读口 `get_robot_current`、`get_robot_voltage`、`get_joint_temperatures`、
  `get_tcp_force`。
  - 估算方法＝**有限差分 + 量级模型**：关节速度/加速度来自相邻两次采样，力矩/电流/电压由它们推出，
    温度以约 60 s 的时间常数向「环境 + 负载温升」收敛，TCP 受力取名义负载的惯性力加重力反力。
  - **每一条返回值都带 `estimated: true` 与 `note`。** 这里没有控制器也没有动力学，遥测读数只可能是
    估算 —— 把它当测量值呈现，才是这个功能唯一真正危险的做法。
  - 同一组六个字段（`robot_voltage`、`robot_current`、`joint_temperatures`、`joint_currents`、
    `tcp_force`、`tcp_speed`）现在也进了 `ursim_get_status`，并带 `telemetry_estimated: true`。这一条
    是必要的：**仿真面板的 detail 通道读的是 `status`，不是 `get_runtime_telemetry`**（见
    `lib/twin-routes.js` 的 `body.detail`）—— 不加这一步，那一行在仿真里仍然是空的。
- 新增测试 `test/sim-telemetry.test.mjs`：运动在后台线程里跑，主线程采样遥测并断言速度、电流、TCP
  速度都非零（这就是"面板遥测行有值"这条用户可见结论），同时断言诚实性标记与 `status` 里的字段。

### 变更

- `ursim_sim_status` 的能力清单把遥测从 `not_simulated` 移到新的 `telemetry` 键，并在 note 里写明这些
  值是估算。
- 两份 README 不再把 RTDE 遥测列为"仿真做不到"的事。

## [0.1.5] - 2026-10-14

### 新增

- **仿真的 I/O 与寄存器（路线图 B3）。** 九个此前一律回报 `SIM_UNSUPPORTED` 的 op 现在有了仿真语义，
  于是"置位 → 读回 → 断言"这类教学/演示脚本终于写得出来：`set_digital_out` / `get_digital_out_bits`
  （std 0-7、config 8-15 沿用 UR 的全局编号、tool 0-1）、`get_digital_in` / `get_digital_input_bits`、
  `set_analog_out` / `get_analog_in`，以及 `get_int_register` / `get_double_register` / `get_bit_register`。
  - 状态在**内存**里、挂在虚拟机器人**实例**上：`sim_stop` + `sim_start`（或子进程被替换后宿主的自愈
    重建）都会回到初始态 —— 与「控制器重启」同义，且不需要任何额外清理代码。
  - **输入没有生产者**（没有任何工具能设置输入）、**寄存器没有写入口**（本插件只提供读寄存器的工具），
    因此两者恒为初值 —— 且每一条这样的返回值都用 `note` 写明原因，而不是悄悄回一个 0。
  - 参数校验不放松：端口越界照样被拒；而**必填参数缺失**现在明确报 `BADARG`（真机句柄那里抛的是
    `KeyError`，表现出来是一句看不出原因的失败）。

### 变更

- `ursim_sim_status` 的能力清单把 I/O 与寄存器从 `not_simulated` 移到新的 `io` 键，并在 note 里写明
  内存态语义。
- **两份 README 的能力描述重新与代码一致**：顶部横幅与「它不能做什么」清单不再声称 I/O 与寄存器不受
  支持；URSim 那一段改为说明"要怎么才能驱动它"（开启真机通道），而不是"本版做不到"。

## [0.1.4] - 2026-10-14

### 新增

- **真机通道回来了 —— 默认关闭，且必须配白名单（路线图 A）。** 两个新配置键：`motionMode`
  （`'sim'` | `'real'`）与 `realRobotIps`（逗号分隔的白名单）。默认的 `sim` 模式下行为**毫无变化**：
  worker 仍然在派发前拒绝除保留回环地址以外的任何地址。`real` 模式下，白名单外的目标在**宿主侧**
  就被拒绝、根本到不了 worker；白名单留空等于拒绝一切（fail-closed）；开启 `real` 却没写白名单时会
  明确 warning。
  - **`real` 模式下不存在任何审批豁免**：每一条受门禁的指令都要人确认，包括指向仿真的那些。这一条
    结构性关掉了审计的 H-2 —— 从前「豁免」是宿主侧、模型自己能用 `ursim_sim_start` 置位的状态；现在
    它来自人写下的配置值。
  - 保留回环地址在**两种模式**下都表示那台虚拟机器人，绝不交给真机实现 —— 否则「把真控制器端口转发
    到环回」这条审计点名的路径就被重新打开了。
  - 它依赖的前置修复（H-3 读类分闸、M-1 审批载荷绑定）已在 0.1.3 发布。
- **CI**（`.github/workflows/ci.yml`）：Ubuntu **与** Windows 双平台跑全量测试，并显式重建客户端产物
  后用 `git diff --exit-code` 校验。`verify:host` 只报告不阻断 —— 它比对的是**已安装宿主**的版本，
  而宿主包不由本仓库发布。
- **`scripts/check-doc-links.mjs`**（已接进 `check:docs`）：本仓库 Markdown 里的每一条相对链接都必须
  能解析。这一条断言就能自动拦住审计里的 D2 与 D8 那类死链；三条刻意缺失的目标已连同理由登记。

## [0.1.3] - 2026-10-13

以下全部来自对 0.1.2 代码库的四位专家审计（原文收录在
[`docs/audit-2026-10-13-four-experts.md`](./docs/audit-2026-10-13-four-experts.md)）以及审计给出的后续建议。
**纯仿真的契约没有任何变化**：`ip` 仍然只意味着那个保留回环地址，也仍然没有真机通道。

### 修复

- **仿真的读请求可能把停止指令饿死（H-3）。** 仿真读与命令共用一个单线程 worker，在飞上限 8，准入规则是
  「总数 ≥ 上限即 BUSY」。每一路 SSE 订阅都有自己的帧泵，于是 **8 路订阅就能把 8 个槽位全部占满** ——
  `stopj` / `stopl` / `end_force_mode` 随后**在宿主侧就被拒**，根本到不了 worker：而这恰恰是机器人正在运动、
  最需要它停下来的时刻。现在读类走自己的闸门（`class: 'twin-read'`，上限 3），为命令类**保留至少 5 个槽位**；
  `/twin/stream` 另外限制最多 4 路并发订阅，超额明确回 `503`，而不是让所有订阅互相饿死。
- **`send_script` 让人类批准一份自己看不到的脚本（M-1）。** 审批提示把载荷截断在 240 字符，第 241 个字符
  之后的一切都是"没看就签"。现在给出行数 / 字节数 / 开头三行，并在审批理由里带上**载荷指纹**（sha256 前 16 位），
  审批通过后重新计算比对：若载荷在人类决策期间被改动，指令一律取消、绝不下发。绑定刻意做在**整个载荷**上而不是
  脚本文本上 —— `sanitizeArgs()` 是浅拷贝，嵌套数组（`force_mode` 的 `task_frame`、`selection_vector`、
  `wrench`）与调用方共享引用，在审批窗口里**确实可以被改掉**。
- **`list_programs` 内置了硬编码 SSH 凭据。** 默认口令 `root/easybot` 已移除（口令必须显式提供，缺失即明确报错），
  `paramiko.AutoAddPolicy()` 改为 `RejectPolicy()` —— 旧策略**无差别接受任何主机密钥**，等于让这条要在控制器上
  执行命令的通道对中间人透明。
- **模型加载器可能把同一个网格拉两次。** 同一 await 窗口里的两次调用会各自 `GLTFLoader.loadAsync` 并各自装配
  一组，只有后写的那份进缓存，先做的那份则在从未被释放的情况下被丢弃。现在有 in-flight 表（第二个调用方等同一份
  promise），引用计数统一由调用方持有，缓存也有上限（`MAX_CACHED_MODELS`），且只逐出没有活引用的条目。
- **`disposeObject3D` 会释放材质的每一个属性。** 任何带 `dispose` 的字段都会被释放，包括 `envMap` —— 它一旦被
  设置就指向**场景共享**的 PMREM 环境贴图：释放它会让**全场 PBR 材质同时变黑**，而换型号正是走这条路径。现在改为
  一份"模型自有贴图槽位"白名单，`envMap` 有意排除在外。
- **`/twin/asset` 每个请求都要读一遍并重算整个 GLB 的 SHA-1** —— 连 `304` 路径也不例外，而浏览器每次打开面板都会
  重验一次。现在用 `size + mtimeMs` 作失效判据（网格会被就地重生成，只按名字缓存不够），命中即从内存返回。
- **静止帧每秒重算了 60 次姿态。** 只有新采样（10 Hz）与紧随其后的那一小段插值窗口携带信息；其余帧的结果与上一帧
  **逐位相同**（`interpolateAt` 在窗口外会钳到当前采样）。这些帧现在直接复用上一次的 FK 结果，不再重跑插值、
  正运动学、矩阵写入与轨迹重绘。窗口**刚结束**的那一帧仍照常计算，所以画面上的姿态会**精确收敛**到控制器最近报出的
  那一笔。
- **门禁可能死在遗留的临时文件上。** `check-new-ops.py` 用裸 `os.remove` 清理草稿日志，于是被上一轮进程占用的
  残留文件（Windows `WinError 32`）会让整条门禁崩掉。现在清理失败可以容忍 —— 草稿文件不该有能力让门禁失败。

### 变更

- **工具声明表搬到 `lib/tool-defs.js`**（`lib/index.js` 从 1977 行降到 957 行）：963 行声明表与 6 个参数 DSL
  助手移出，`index.js` 只负责注册与运行时策略。声明面变成工厂 `buildTools(config)`，因为每个工具的 `timeoutMs`
  取自配置，而数组以前是靠外层闭包读到它的。旧的读取位置有 10 处（4 个门禁、2 个脚本、4 个测试）已同步更新；
  这次搬运的"无行为变化"由下面两个黄金文件证明 —— 它们在搬运前后**逐字节不变**。
- **每个 op 现在都必须声明自己的分类。** `docs/tool-matrix.json` 逐条写明：该 op 是否受人工审批门禁、
  仿真会怎么处理它（`simulated` / `passthrough` / `unsupported`）；`docs/tool-matrix.md` 是可读矩阵。
  `scripts/tool-matrix.mjs`（已接进 `check:docs`）会在出现未声明的 op、声明与 `APPROVAL_OPS` 或 worker 的
  `SIM_OPS` / `SIM_PASSTHROUGH_OPS` 不一致、或残留陈旧条目时失败。此前这两个决定都是**沉默的默认值** ——
  H-1（七个带物理副作用的 op 落在审批门禁之外）正是这样长期没被发现的。
- 文档：两份 README 不再声称"除 `connect` 外所有工具都接受 `ip` 且需要先连接"（只有 `ursim_ping` 不接受 `ip`；
  仿真目标也不需要先 `connect`）；两份 CHANGELOG 的首段不再指向已被删除的归档文件。

### 新增

- **`docs/tool-schemas.golden.json` + 黄金快照测试。** 既有门禁只比对参数**名字**与 Python 实读是否一致、
  以及工具是否出现在 README 表格里 —— **都不覆盖类型、默认值、`required` 与描述文案**，所以搬 1300 行声明时
  把 `type: 'number'` 变成 `'string'` 不会有任何门禁报错。快照记录每个工具的名称、描述、超时与参数 schema
  （规范化后），失败时给出**字段级 diff**。已用变异证明：该类型改动让 `check-tool-params.py` 保持绿色，
  而快照指名全部 6 个受影响工具。
- 有意的契约变更用 `URSIM_WRITE_GOLDEN=1 node --test test/tool-schema-dsl.test.mjs` 重新生成快照。

## [0.1.2] - 2026-10-13

对 0.1.1 代码库做了四位专家的全面审计（安全、架构、实现质量、文档；原文收录在
[`docs/audit-2026-10-13-four-experts.md`](./docs/audit-2026-10-13-four-experts.md)），找出九处值得
立刻修的缺陷。本版就是这第一批。**纯仿真的契约没有任何变化。**

### 修复

- **worker 每次调用都往 `stdin` 挂一个 `error` 监听器且从不摘除。** 第 11 次调用即触发 Node 的
  `MaxListenersExceededWarning`，而且每次调用都往流上永久留一个闭包。现在**每个子进程只挂一次**；
  管道断了会失败该孩子在飞的**全部**请求，而不是只有最后写入的那一个。回归：连续 20 次调用后
  监听器数恒为 1。
- **被 kill 的 worker 丢失了 stderr。** `_killFor()` 在 `_failAll()` 已经清掉 per-child stderr 尾部
  **之后**才拼错误消息，于是最需要原因的那条（"进程已被终止"）通常没有原因。现在先取尾部。
- **`respawnCount` 在 spawn 成功前自增**，一次失败重启就会让宿主以为"子进程被换过"：它会重建仿真，
  并让每个挂着的面板重新下载并重建 1.5–3.5 MB 的 GLB。计数器现在记在 `spawn` 事件上。
- **带首尾空白的 IP 被当成真机。** 宿主侧的仿真判定是对保留回环地址的严格相等，而 Python 侧会
  trim，于是 `" 127.0.0.1"` 会弹人工审批 —— 在 `approval=never` 的会话里表现为"命令被拒"，
  极易被误诊成 worker 故障。工具参数现在在进审批门之前归一化。
- **七个带物理副作用的 op 此前无需审批即可下发**：`set_tcp`（改写此后**每一次运动**的参考系）、
  `set_tool_output_mode` / `set_tool_voltage` / `tool_communication`（工具法兰针脚语义；打开 TCI 会
  禁用工具端模拟输入）、`set_digital_out` / `set_analog_out`（会致动夹爪、传送带、焊机）与
  `set_conveyor_tick`。仿真目标本就不走这道门，所以该改动只作用于**真机部署** —— 那正是需要它生效
  的地方。`check-approval-gate.py` 与审批门测试现在断言这些家族成组移动。
- **仿真的"关节超限"提示从未生效。** `writeHud()` 传的是 `fkResult?.jointLimits`，而 `fkChain()`
  从来没有这个字段，于是 `overLimitJoints()` 拿到 `undefined` 直接返回：功能 100% 死掉，测试却是绿的。
  限位现在取自运动学表，并有一条把它推过 J2 上限的回归测试。
- **面板收起时停仿真的写请求会被浏览器 abort。** 那条请求恰恰是在页面卸载过程中发出的，现在带上
  `keepalive: true`；否则面板关掉之后虚拟机器人还在宿主里继续跑。

### 变更

- `scripts/check-tool-params.py` 现在解析到少于 86 个工具就失败 —— 以前正则失效会打印 `0 / 0` 然后通过。
- `test/sim-only.test.mjs` 把 `SIM_PASSTHROUGH_OPS` 断言为**闭集**（此前只断言"包含"）：这个 frozenset
  是"哪些 op 能落到真机实现"的唯一开关。

## [0.1.1] - 2026-10-13

### 修复

- **姿态数据一断，仿真不再画出一台"没摆姿态"的机械臂。** 装配完成但还没写入姿态的模型，7 个连杆网格
  会各自留在自己的连杆坐标系里叠在基座原点 —— 两根长管并排躺着、法兰盘落在基座旁边；而面板过去
  恰好会在姿态通道短暂断流时把它显示出来（仿真被重建、worker 被重挂载时，仿真状态路由会返回
  `q: []`，于是 `if (kin && joints)` 整块跳过姿态写入，新装入的模型就永久停在装配态）。
  现在 `loadModel()` 会在换型号时**立刻**用**最近一次已知关节角**给新模型摆姿态；而一次姿态都还没
  收到过的模型会**先藏起来**，直到第一帧姿态到达 —— 装配态从此不会出现在画面上。姿态写入、TCP 坐标
  gizmo 与受力箭头现在共用一个入口（`applyPoseToScene`），"这个模型已经有姿态"因此成为面板可以依赖
  的状态。`test/twin-panel.test.mjs` 新增两条回归测试分别兜住这两半（换型号那一帧没有 `q`；首次加载
  时尚无任何 `q`）。

## [0.1.0] - 2026-10-12

**`dsh-nonead-ursim`** 作为独立插件的首个版本。

### 新增

- **86 个原生 DSH 工具（`ursim_*`）**，覆盖 Universal Robots 协作机械臂，经 `@deepseek-ai/dsh-tools`
  注册：连接（`ursim_connect` / `ursim_disconnect`）、状态 / 位姿 / 目标值 / 设备信息、程序、寄存器、
  健康检查、数字与模拟 I/O、工具配置（TCP、负载、重力、力/力矩归零、工具电压与通信）、
  控制模式 / 上下电 / 安全（freedrive、示教模式、释放刹车、解除保护性停止、关机）、**力控**、
  **速度控制**（`speedj`/`speedl` 及配套停止与 `wait_steady`）、**RTDE 实时遥测**（关节电流/电压/角速度、
  TCP 速度与受力、温度、母线电压电流、速度倍率、工具遥测）、传送带 tick 与传送带跟踪、
  运动（`movej`/`movel`/`movep`/`movec`/`servoj`/OptiMove/基座轴与工具轴移动）、
  运动规划（`motion_version`、`get_freedrive_status`）、绘图，以及原始脚本下发 / 错误复位。
- **fail-closed 的运动审批门禁**：所有会驱动机器人运动、执行程序、让机械臂脱离程序控制或
  失去刚性支撑的指令，都会在真正下发到机器人前**暂停等待人工确认**。默认值写在**代码**里
  （`config.requireApprovalForMotion ?? true`），因此跳过 schema 解析的调用方也关不掉它。
  `test/approval-gate.test.mjs` 驱动真实工具注册表逐条验证，包括"多传一个 `op` 参数无法把调用改派"。
- **常驻 Python worker**（`python/ur_worker.py`，vendored `URBasic`），走行分隔 JSON 的 stdio 协议：
  每个 IP 只 `connect` 一次即可持续发指令，RTDE / Dashboard / RealTime 链路跨调用保活。
- **只读 3D 数字仿真**（three.js），入口是**右栏「开始」面板**中的一张卡片：关节位姿、TCP 坐标系
  与近期轨迹、工程图层开关，以及仪表盘侧数值读数。它**严格只读**，绝不向机器人下发指令。
  遥测由 worker 以 20 Hz **主动推送**，仿真优先读该缓存，因此机器人运动时画面不会卡住；
  仿真读取使用**专用预算且 `killOnTimeout:false`**，可视化读取永远不会掐掉机器人会话。
- **运动学级离线仿真**，落在保留的回环地址 `127.0.0.1`：`ursim_sim_start` / `ursim_sim_stop` /
  `ursim_sim_status` 驱动一台虚拟机器人，其正解与客户端的 `fk.js` **逐元素一致**；逆解为带多种初值的
  阻尼最小二乘，解不出就报"不可达"，绝不返回近似位姿。没有仿真语义的指令一律回报
  `SIM_UNSUPPORTED`，而不是给一个看起来合理的结果。
- **5 条 host 路由**（均限制为回环调用方），前缀 `/nonead-ursim/twin/…`：`stream`（SSE，客户端默认）、
  `state`、`asset`、`models`、`sim` —— 其中 `sim` 是本插件**唯一**的写路由，其副作用被限制为回环地址上的
  一台运动学虚拟机器人。
- **发布门禁**：`npm run check`（static / ops / docs / manifest）与 `npm test`，含 `test/test-manifest.json`
  登记的 Python 依赖用例对账。
- **仿真面板跟随桌面端的配色主题**（浅色 / 深色 / 跟随系统）：面板 CSS 改为建立在宿主的 `--dsw-alias-*`
  设计 token 上（宿主 token 缺失时退回与主题成对的本地值），因此跟随 DSH 的外观设置、也跟随任何覆盖这些
  别名的第三方主题，且不需要 JS 参与。WebGL 侧的基座网格颜色烘在几何体顶点色里、CSS 够不到，由新增的
  `src/client/theme.js` 解析并监听同一个信号（`body[data-ds-dark-theme]`），`scene.js` 的 `applyTheme()`
  **就地**重刷（不重建几何体、不新建 `GridHelper`）。
- **面板打开时自己进入离线仿真**（`UR12e` / 竖直收拢 / 倍率 100%），真机连着也一样；**收起面板即停仿真**
  并把数据源切回"按宿主解析"。已经开着的仿真（AI 用 `ursim_sim_start` 开的、或另一个窗口开的）**沿用、绝不重建**
  —— 重建会把那台虚拟机器人推回起始姿态。仿真开关行**不再随连接态隐藏**：自动进入失败（没装 Python、
  worker 起不来……）时，那一行是唯一能看到原因、也是唯一能重试的入口。不想要这套默认行为的宿主可用
  `autoSim: false` 挂载面板。
- **修复：可达范围包络在所有型号上都是一个 1 m 的球。** `linkLengthsFromKinematics()` 当初是按"7 个行主序
  4×4 矩阵"写的（单测也一直只喂这个形状），而 `assets/kinematics.json` 里实际是 **6 个
  `{x, y, z, roll, pitch, yaw}` 相对变换** —— 于是生产路径上它返回 `null`，
  `reachRadiusFromKinematics()` 也返回 `null`，`reachSphere.scale.setScalar()` 那行**从没执行过**：
  包络一直停在**单位半径**，14 个型号当然一样大（"不管加载什么型号，可达范围好像都一样大"）。
  现在它吃真实形状（每段长度 = 平移分量模长），得到文档里那组上界 —— UR3 ≈0.80 m … UR20 ≈2.17 m。
  同一个 `null` 也让回退臂在所有型号上都用 UR3 量级的长度，一并修掉。
- **「可达范围」图层改成绝对取景，机型大小终于可比。** 按型号自适应取景（为了 UR3 不至于小到看不见、
  UR20 不至于出画）同时把可达范围的差异"归一化"掉了 —— 每个型号都撑满画面，正是上面那条反馈的成因。
  现在打开**可达范围**图层会改用固定参考取景（`fitTo(..., { minRadius })` = 全部内置型号里最大的那台
  UR20 的上界），所有型号共用**同一把尺子**、基座网格也变成固定刻度；该开关上直接写着当前型号的上界
  （`可达范围 1.32 m`），换型号时跟着更新。
- **修复**：右栏入口卡片引用的 `--dsw-alias-bg-elevated` / `--dsw-alias-border-secondary` 是 DSH 设计系统里
  **不存在**的两个 token 名（全仓 0 处定义），因此其 `var()` 永远落在兜底值上，卡片在**深色主题下一直是白底**。
  现改用同级卡片在用的 `--dsw-alias-bg-layer-1` / `--dsw-alias-border-l3`。

### 变更

- **换型号会清空原有机器人，新载入的机器人从「竖直收拢」开始**。在面板里换型号现在会：① 保证上一台机器人
  从 3D 场景里消失 —— `loadModel()` 给自己的根节点打名，`removeStrayRobots()` 在新型号入画前扫掉同名残骸，
  两台机械臂不可能同时留在画面里；② 把起始姿态重置为**竖直收拢**，并同步姿态下拉，界面与仿真说法一致。
  `upright` 现在是三处"能造出一台机器人"的共同默认：工具默认（`ursim_sim_start` 不传 `preset`）、面板自动进入、
  换型号。`test/sim-only.test.mjs` 另外钉住"竖直收拢"落在全部 14 个内置型号的限位内（静默退回全零位就等于
  "换个型号姿势就变了"），`test/model-contract.test.mjs` 继续在多个姿态下检查每个型号装配出来的连杆真的相接。
- **`movel` 变成一整段平滑运动，而不是几十次启停**。Cartesian 直线仍然每 1 cm 细分、逐点逆解（这是它成为直线
  而不是弧线的原因），但**时间**不再按段各自计：整条折线共用一条速度剖面 —— 总时长由**整段行程**决定，各段时长
  按关节位移比例分配，`_sample()` 先做一次全局 smoothstep 再对 6 个关节角插值。此前每个 1 cm 途经点都要减速到
  零再重新加速：0.5 m 的运动变成 ~50 次微型启停（肉眼就是一顿一顿，仿真相邻两帧的关节速度也近乎随机）。在 20 Hz
  仿真节拍下实测一条 0.5 m `movel`：近似静止帧从 ~52 降到 **3**，巡航速度波动 <1.5%，相邻帧速度突跳不超过
  0.02 rad/s per 50 ms，总时长从 ~9 s 降到 3.7 s。`test/sim-motion-smooth.test.mjs` 把结构与这些数字都钉住。
  - 顺带修掉：走完一条上百段的折线原来靠逐段浮点相减，末点会差一点点（画圆闭合差 2.6e-5 而不是 4e-7）。
    `_sample()` 现在一旦走完全程就原样返回终点。
- **本插件改为纯仿真：不存在任何真机通道。** 所有工具都作用于保留回环地址上的虚拟机器人；真机 IP 会在
  worker 里、**派发之前**就被判为**非法输入**（`SIM_BADARG`）—— 这正是让 RTDE / Dashboard / SSH / 远程控制
  探测那几条路**不可达**（而不是"有但不用"）的关键。调用不再需要"先连机器人"这一步：`route_op()` 会按需
  开一台 `UR12e` 仿真（竖直收拢、倍率 100%）再派发，所以直接发运动指令就能动。`ursim_connect` 变成"确保仿真
  在跑"，`ursim_disconnect` 变成"停掉它"（幂等）；`ip` 参数在所有工具上都可选，且只接受 `127.0.0.1`。仿真路由
  忽略 `?ip=`、客户端恒解析保留地址，所以**取数也不可能落到真机**。仿真没有语义的指令（力控、RTDE 遥测、
  安全状态位、程序、原始脚本、I/O、寄存器、传送带、上下电/刹车/自由驱动）保留工具名，一律回报
  `SIM_UNSUPPORTED`，绝不落到真机。
  - 测试：删掉已失去前提的 `test/remote-control.test.mjs`（它测的 CB3 远程控制提示随真机通道一起移除），
    新增 **`test/sim-only.test.mjs`**，把新契约的两半都钉住 —— 结构上"只有 `SIM_PASSTHROUGH_OPS` 能落到
    `HANDLERS`"，行为上"真机地址被拒 / 自动就绪 / `SIM_UNSUPPORTED` / connect·disconnect 的仿真语义"。
  - **仍待做（删死代码，不影响行为）**：已不可达的真机实现（`python/URBasic/**`、dashboard/SSH/RTDE 辅助函数、
    `ur_worker.py` 里约 40 个真机 `op_*` 函数体）仍在树里。它们碰不到真机，但还没删。
- **包名改为 `dsh-nonead-ursim`**，所有必须与包名一致的身份随之同步：客户端 bundle 的
  `__ModuleLoader__` id（由 `scripts/build-client.mjs` 在构建期断言等于 `package.json.name`）、
  `cordis.patch.yml` 的插入行（`id: nonead-ursim`、`name: 'dsh-nonead-ursim'`），以及 `lib/index.js`
  导出的插件名。
- **侧边栏 / 右栏入口标题改为 `NoneadURSim`**，中英文一致；文案唯一真源仍是
  `src/client/strings.js` 的 `dockLabel`。
- **版本线重新从 `0.1.0` 开始。** 独立发布之前的更新日志（原先的 `0.1.0 → 0.8.0` 开发线）已归档为
  `CHANGELOG-archive.md` / `CHANGELOG-archive.zh.md`，不再随包发布。
- **整套工具/路由/界面命名空间迁到 `ursim_*` 与 `/nonead-ursim/…`，好让本插件能与它分离出来的那个
  插件同时安装。** DSH 的工具注册表与 web server 都在加载期拒绝重名（`tool "X" is already
  registered`、`webserver: duplicate exact route`），共用命名空间就意味着两者只能加载一个。已改：
  - 全部 **86 个工具**：`ur_*` → **`ursim_*`**；
  - 仿真路由前缀 `/dsh-nonead-ur` → **`/nonead-ursim`**（`/nonead-ursim/twin/{state,asset,models,stream,sim}`）；
  - 客户端的 DOM/调试命名空间 `ur-twin` → **`ursim-twin`**（样式元素 id 与标记属性、右栏入口的
    `data-*` 属性、面板 CSS 类名、three.js 对象名与截图文件名）—— 另一个插件用的正是同一个
    `dsh-ur-twin-styles` id，共用 id 会让其中一个复用另一个的 `<style>` 元素而样式全丢；
  - 调试全局 `__UR_TWIN__` / `__UR_TWIN_IP__` / `__DSH_UR_TWIN_MUTATION_HUB__` → `__URSIM_TWIN__` /
    `__URSIM_TWIN_IP__` / `__DSH_URSIM_TWIN_MUTATION_HUB__`；
  - worker 的诊断开关 `DSH_UR_TWIN_PUSH` → `DSH_URSIM_TWIN_PUSH`（并让它豁免 `lib/worker.js` 的
    `DSH_*` 环境清洗 —— 那道清洗此前让这个写在文档里的开关根本到不了 Python）。
- **刻意保持不变**，以便 Python 半继续讲同一套协议：worker 内部的 `op` 名、其 stdio 协议，以及
  vendored `URBasic` 的 API（它自带 `ur_shutdown` / `ur_power_on` / `ur_force_mode` 等同名标识符，
  必须原样保留）。
