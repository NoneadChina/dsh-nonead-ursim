# dsh-nonead-ursim

**一个让 DSH 用自然语言直接控制 Universal Robots（UR）机械臂的插件，由拓德科技（Nonead）基于自研的 nUR MCP Server 同源逻辑开发。**（[Suzhou Nonead Robot Technology Co., Ltd.](https://www.nonead.com)）

本插件与该公司的 `Nonead-Universal-Robots-MCP`（见「参考实现」一节）同源，把「用 AI 控制 UR 机器人」的能力以**原生 DSH 工具**的形式接入：插件启动一个常驻的 Python worker（内部复用 vendored 的 `URBasic` 库），工具通过该 worker 与机器人通信，`connect` 一次后即可在同一 IP 上持续发指令。

> 🧪 **默认纯仿真（0.1.0 起）**：本插件驱动**保留回环地址 `127.0.0.1` 上的运动学级虚拟 UR 机器人**，除非你显式要求更多。**默认的 `motionMode: 'sim'` 下它不存在任何真机通道**：真机 IP 会在派发**之前**被判为非法输入（`SIM_BADARG`），vendored `URBasic` 的 RTDE / Dashboard / SSH 那几条路从工具面上**不可达**。真机通道自 0.1.4 起**可以显式开启**（`motionMode: 'real'` + 白名单，见下文「真机通道（默认关闭）」一节），默认行为不因此改变。也没有"先连机器人"这一步：仿真按需自动就绪（`UR12e`、竖直收拢、倍率 100%），所以**整个使用过程不需要任何真机存在**。需要真实控制器的指令（力控、RTDE 遥测、安全状态位、程序、原始脚本、传送带、上下电/刹车/自由驱动）保留工具名，但一律如实回报 `SIM_UNSUPPORTED`，绝不会落到真机上 —— **例外是标准/工具端 I/O 与寄存器**：它们自 0.1.5 起有仿真语义（**内存态**：输出可写可读回，输入没有信号源恒为 0，寄存器没有写入口恒为初值）。下面各工具小节沿用真机代码库的原文，描述的是它们当年的语义；以本条为准。

> ⚠️ **安全提示**：本插件的目标是仿真，因此不会产生任何物理运动。各工具描述里沿用的安全警告，针对的是本插件所由派生的那份真机代码库。

> 🛡️ **运动审批门禁**：`ursim_movej` / `ursim_movel` / `ursim_movep` / `ursim_movec` / `ursim_servoj` / `ursim_move_optimized` / `ursim_move_x|y|z` / `ursim_move_tool_x|y|z` / `ur_draw_*` / `ursim_load_program` / `ursim_run_program` / `ursim_send_script` / `ursim_reset_error`；0.5.0 新增的 `ursim_set_freedrive` / `ursim_set_teach_mode` / `ursim_power_on` / `ursim_power_off` / `ursim_brake_release` / `ursim_unlock_protective_stop` / `ursim_shutdown` / `ursim_zero_ftsensor` / `ursim_set_conveyor_tracking`；0.6.0 新增的 `ursim_force_mode` / `ursim_end_force_mode` / `ursim_force_mode_settings` / `ursim_speedj` / `ursim_speedl` / `ursim_stopj` / `ursim_stopl` / `ursim_set_payload_inertia`，以及 `ursim_motion_version`、`ursim_set_payload`、`ursim_set_gravity` —— 这些会驱动机器人运动、执行程序、**或让机械臂脱离程序控制 / 失去刚性支撑**的指令，在真正下发到机器人前会**暂停等待人工确认**。交互式部署（审批策略为 `ask`）会在界面上弹出确认框；未组合审批服务、无代理、或应答不是 `allowed-once` 的调用都会**以拒绝方式安全关闭**（fail-closed），绝不会在未获批准时运动。默认值写在**代码**里（`config.requireApprovalForMotion ?? true`），因此"调用方跳过 schema 解析"这种情形也不会把门禁关掉。可用配置 `requireApprovalForMotion: false` 显式关闭此门禁。`test/approval-gate.test.mjs` 驱动真实工具注册表逐条验证上述行为，包括"多传一个 `op` 参数无法把调用改派到别的指令"。

---

## 功能一览

共 **86** 个工具（`ursim_*`）。

| 类别 | 工具（`ursim_*`） | 说明 |
|---|---|---|
| 连接 | `ursim_connect` / `ursim_disconnect` | 按 IP 连接 / 断开一台 UR 机器人 |
| 状态 | `ursim_get_status` | 一次性读取 TCP、关节、型号、序列号、版本、安全模式、运行/程序状态、电压、电流、温度、开机时长、关节电流/电压/角速度、TCP 速度与受力、速度倍率 |
| 位姿 | `ursim_get_tcp_pose` / `ursim_get_joint_pose` | 读取当前 TCP 位置 / 关节角度 |
| 目标值 | `ursim_get_target_values` | 读取「**控制器打算去哪**」：目标关节角/角速度/角加速度、目标 TCP 位姿与速度（外加实际值便于对比）。来自 RTDE 的 `target_*` 字段（0.6.0 加入接收配方），读取零代价——这是判断「指令已下发但还没执行 / 正在交融 / 被安全限速拉住」的直接依据 |
| 设备信息 | `ursim_get_robot_model` / `ursim_get_serial_number` / `ursim_get_uptime` / `ursim_get_software_version` / `ursim_get_safety_mode` / `ursim_get_safety_status` / `ursim_get_robot_mode` | 型号（含 `remote_control` 字段）/ 序列号 / 开机时长 / 软件版本 / 安全模式 / **安全与机器人状态位**（哪一类安全功能被触发，含 violation / fault；限值数值需去 PolyScope 安全页读）/ 运行状态 |
| 程序 | `ursim_get_program_state` / `ursim_load_program` / `ursim_run_program` / `ursim_stop_program` / `ursim_pause_program` / `ursim_list_programs` | 程序状态、加载、运行、停止、暂停、SSH 列表（`list_programs` 兼容真机 `/programs` 与 URSim `~/URSim_Linux-*/programs.*`；`load/run` 支持完整路径/URSim 路径与 `programs_dir`）。**运行/停止/暂停都会检查控制器应答并回带运行状态**，不再把 "could not understand" 一类拒绝当作成功 |
| 寄存器 | `ursim_get_int_register` / `ursim_get_double_register` / `ursim_get_bit_register` | 读取 Int / Double / Bool 寄存器 |
| 健康检查 | `ursim_ping` | 无需连接机器人，检测 worker/Python/URBasic 就绪 |
| I/O | `ursim_get_digital_in` / `ursim_set_digital_out` / `ursim_get_digital_in_bits` / `ursim_get_digital_out_bits` / `ursim_get_analog_in` / `ursim_set_analog_out` / `ursim_get_tool_analog_in` | 数字输入/输出（含**批量读位**、`which="tool"` 的工具端数字 I/O）、标准模拟输入/输出（**按工程单位收值**：URScript 的 `set_analog_out` 收的是相对电平 [0,1]，旧实现把 5 当成满量程；`full_scale` 可指定电流域 20）、工具端模拟输入（函数名已对照仓库内官方手册确认，参数语义未经真机验证） |
| 工具配置 | `ursim_set_tool_voltage` / `ursim_set_tcp` / `ursim_set_payload` / `ursim_set_payload_inertia` / `ursim_set_gravity` / `ursim_zero_ftsensor` / `ursim_set_tool_output_mode` / `ursim_set_tool_communication` | 工具电压（**0/12/24，旧实现调用的是 NotImplementedError 桩，从未成功过**）、TCP、负载质量/重心、**质量+重心+惯性矩阵一次设全**（`set_target_payload`，5.10+；避免 `set_payload` 重置惯性矩阵导致三者不一致）、重力方向（非水平安装用）、力/力矩传感器归零、**工具输出模式**（普通 / power 双针供电）、**工具串口（TCI/RS-485，⚠️ 启用会禁用工具模拟输入）** |
| 控制模式 / 电源 / 安全 | `ursim_set_freedrive` / `ursim_set_teach_mode` / `ursim_power_on` / `ursim_power_off` / `ursim_brake_release` / `ursim_unlock_protective_stop` / `ursim_shutdown` | 自由驱动 / 示教模式（可手动拖动机械臂）、上电 / 下电 / **释放刹车**（⚠️ 可能因重力掉落）、**只解保护性停止**（不上电、不释放刹车，与 `ursim_reset_error` 的区别）、关闭控制器 |
| 力控 | `ursim_force_mode` / `ursim_end_force_mode` / `ursim_force_mode_settings` | **力控（Force Mode）**：沿/绕选定轴柔性贴合环境并持续施加指定力/力矩。参数与手册逐条对齐：`task_frame` / `selection_vector`（1=柔性）/ `wrench` / `type`（1-3）/ `limits`（柔性轴=最大速度，刚性轴=最大偏差）/ `damping` / `gain_scaling`。脚本里按手册建议先 `sleep(0.02)` 再进力控；退出用 `ursim_end_force_mode`。⚠️ `damping`/`gain_scaling` **控制器侧无法回读**，工具只回报本次设置值，不假装读到当前值 |
| 速度控制 | `ursim_speedj` / `ursim_speedl` / `ursim_stopj` / `ursim_stopl` / `ursim_wait_steady` | 关节/TCP **速度指令**（`speedj` / `speedl`）与对应的减速停止（`stopj` / `stopl`）。⚠️ 速度指令是**开放式**的：`t=0`（默认）时"达速即返回"但机械臂**仍在运动**，必须用 stop* 或 `ursim_wait_steady` 收尾。`ursim_wait_steady` 轮询 RTDE 已有速度量判断是否真的停住（**没有**用 URScript 的 `is_steady()`——那个在力控/示教模式下恒为 false） |
| 实时遥测 | `ursim_get_runtime_telemetry` / `ursim_get_robot_voltage` / `ursim_get_robot_current` / `ursim_get_joint_temperatures` / `ursim_get_speed_scaling` / `ursim_get_tcp_force` / `ursim_get_tool_telemetry` | 关节电流/电压/角速度、TCP 线速度与受力/力矩、工具加速度计、速度倍率、整机电压电流、关节温度、工具电流/电压、I/O 电流。**这些字段本来就在 500 Hz 的 RTDE 数据流里**，读取零代价、无需改配置。单点读取（整机电压/电流、关节温度）与一次性汇总（`ursim_get_runtime_telemetry`）并存：轮询某一项时用单点，诊断时用汇总 |
| 传送带 | `ursim_get_conveyor` / `ursim_set_conveyor_tick` / `ursim_set_conveyor_tracking` | 传送带 tick 读取 / 设置、**线性或圆盘跟踪的开启与停止** |
| 运动 | `ursim_movej` / `ursim_movel` / `ursim_movep` / `ursim_movec` / `ursim_servoj` / `ursim_move_optimized` / `ursim_move_x` / `ursim_move_y` / `ursim_move_z` / `ursim_move_tool_x` / `ursim_move_tool_y` / `ursim_move_tool_z` | 关节空间 / 直线 / 路径 / **真正的圆弧**（旧实现内部把 `movetype` 写死成 `'p'`，实际发的是 `movep` 且丢弃途经点；0.6.0 起补上手册的 `mode` 参数：0 插补姿态 / 1 固定姿态）/ 连续流 / **OptiMove 平滑运动**（`optimovej`/`optimovel`，jerk 受限、振动更小；⚠️ 它的 `a`/`v` 是**能力比例** (0,1] 而不是 rad/s 或 m/s）/ 沿轴直线运动 —— `_move_*` 沿**基座**轴，`_move_tool_*` 沿**当前工具**轴（worker 侧用旋转矩阵换算，不依赖 URScript 的 `pose_trans`）。**默认 a/v 已改回官方手册值**（`movej` 1.4 / 1.05，`movel` 1.2 / 0.25；旧代码默认 `movel` v=1 m/s，是手册默认的 4 倍） |
| 运动规划 | `ursim_motion_version` / `ursim_get_freedrive_status` | 设置 **Motion Version**（手册第 14 章）与 **jerk 增益**（0.01-1.0，只作用于 jerk 受限的剖面：版本 2 的 movej/movel 与 optimovej/optimovel）：版本 2 规划时把速度/加速度**钳到硬件上限**、交融半径重叠时**动态收缩**，而不是像版本 1 那样跳过整段运动并给 "Overlapping Blends" 警告。⚠️ 新机型与 PolyScope X **只支持版本 2**；CB3 没有这个设置。⚠️ 这两个设置**没有回读通道**，只报告本次设置值。`ursim_get_freedrive_status` 读取当前姿态在 freedrive 下离**奇异点**的距离（0 正常 / 1 接近 / 2 太接近——**不是** freedrive 的开关状态），据此提示操作员换路径 |
| 绘图 | `ursim_draw_circle` / `ursim_draw_square` / `ursim_draw_rectangle` / `ursim_draw_star` | 画圆 / 正方形 / 长方形 / 五角星。**必须先观察到脚本真的在运行**才回报「执行完成」——旧实现发完立刻探测，必然看到"没在跑"，于是无论脚本是否执行都报成功 |
| 脚本 / 紧急 | `ursim_send_script` / `ursim_reset_error` | 发送 URScript（**校验执行**：哨兵注入到函数体内部/顶层语句之间并回读，「已发送」不再冒充「已执行」；含多个函数且看不出调用哪个时拒绝校验并给 `verified: null`）/ 复位错误 |
| 离线仿真 | `ursim_sim_start` / `ursim_sim_stop` / `ursim_sim_status` | **运动学级离线仿真**（0.7.0）：在保留地址 `127.0.0.1` 上创建/销毁一台虚拟 UR，让数字孪生在没有真机的情况下被驱动。`sim_start(model=..., preset=..., speed_scaling=...)` 开启后，运动类工具与位姿读回都作用于它；**默认起始姿态是 `upright`（竖直收拢）** —— 不传 `preset` 就是它，面板里换型号也会重置到它，按需自动创建的那台同样从这里开始；`sim_stop` 关闭（幂等）；`sim_status` 无副作用地读状态与能力清单。**其余指令在仿真目标上明确回报「无仿真语义」（`SIM_UNSUPPORTED`），绝不假装执行** |

除 `ursim_ping` 外，所有工具都接受 `ip` 参数。仿真目标**不需要「先连接」**：它按需就绪
（`ursim_sim_start`，或在保留回环地址上的第一条运动指令时自动创建）—— 而本版**根本不提供真机通道**。

> 📚 **0.6.0 的手册对齐**：本版本逐条对照三本官方手册（URSoftware 3.15.4 / PolyScope 5 / PolyScope X）核对了签名、默认值、参数范围与已废弃函数（手册是第三方版权材料，**不随本仓库分发**；可用 `scripts/pdf-extract2.py` 从你自己合法取得的手册重新抽取，见 `THIRD_PARTY_NOTICES.md`）。其中三处与旧实现不同的**实质修正**：① `movel`/`movej` 默认速度改回手册值；② `ursim_force_mode` 的 `damping`/`gain_scaling` 明确标注"无法回读"而不是假装能读；③ `set_target_payload` 只有在给出 `inertia` 时才使用（旧固件上自动退回 `set_payload_mass`+`set_payload_cog`）。

### 只读 3D 数字孪生

插件还内置机器人的**只读 3D 数字孪生**（three.js 渲染）：入口是**右侧栏**「开始」面板里的一张卡片，位置在「工作区文件 / 新建终端 / 浏览器」三张卡片下面；点击后 3D 视图占满右侧栏的内容区。视图订阅宿主的 **SSE 实时流**（`/twin/stream`，100 ms 一帧），始终与真机同步显示**关节姿态、TCP 坐标系与近期运动轨迹**。数字孪生**严格只读，绝不下发任何机器人指令**——它只订阅 host 的只读路由并渲染收到的数据。工具栏提供「重置视角」与等轴测/前视/侧视/俯视四个预设，且相机与基座网格按模型包围盒取景 —— UR3 与 UR20 都能正确入画；**但打开「可达范围」图层时会切换成绝对取景**（以全部内置型号里最大的那个可达上界为参考），让每个型号都在**同一把尺子**下显示：UR3 的包络（≈0.80 m）只占画面约 37%，UR20 的（≈2.17 m）正好撑满，该开关上还直接写着当前型号的上界。数值面板里还有一排**工程辅助图层**开关：可达范围包络、基座坐标系、TCP 受力，以及**「目标姿态」**——后者是真臂的**半透明克隆**（橙色=待审批目标、青色=控制器当前目标），用来对照"打算去哪"；它只在目标与当前姿态**明显不同**时才出现（重合时显示只会被误读成"画面里多了一台机器人"），随时可以关掉。数值面板还会显示 dashboard 侧状态（安全模式、机器人模式、程序状态、速度倍率、关节温度、母线电压电流），同样走这条路由、按较慢的节拍取。

**运动期间也不再停更（0.6.7 起）**：遥测改由 worker **主动推送**（20 Hz），孪生的每一帧优先读这份推送缓存、**不经过那条单线程命令队列** —— 机器人运动时，运动确认循环（`_movej_confirm` 之类）占住的是命令队列，而 RTDE 缓存由 URBasic 自己的接收线程持续更新，推送因此照常到达（协议上是一条不带 `id` 的 JSON 行，旧宿主只会把它当成匹配不上的响应，向后兼容）。缓存过期（>300 ms）或缺失时才回退到显式读；孪生的读仍只带 **2.5 s 的专用预算且超时不杀 worker**：一条只读可视化读**绝不能**把整条机器人会话（RTDE/Dashboard）带走。万一真的停滞，流里仍会推 `stale` 事件、面板写出「数据已停止更新 Ns · 正在重试」，绝不静静冻住。断线后无限重连（指数退避封顶 30 s），窗口重新可见或停滞过久时立即重试。诊断时可用 `DSH_URSIM_TWIN_PUSH=0` 关掉推送做对照。

**换机器人自动换模型（0.7.0 起）**：型号是按 IP + **连接代次**缓存的（`ROBOT_CONN_SEQ`：worker 每新建一条机器人连接就 +1，只增不减）。孪生正显示 UR3 时，如果同一个 IP 上被换成 UR10e：旧 RTDE 会话掉线 → vendored `rtde.py` 的 30 s 数据停滞看门狗收摊、`is_connected()` 转 false → 推送线程随即停推（`_twin_push_snapshot` 的存活门：绝不拿掉线前的缓存冒充实时读数）→ 宿主的显式读经 `ensure_connected` 重建会话（**新 Dashboard 连接**）并拿到 +1 的代次 → **重读型号**；客户端发现型号变了就重新加载 GLB，并**丢掉上一台机器人的插值对与轨迹**（否则新臂会从旧姿态滑过去、轨迹线还会把两台机器人的 TCP 连成一条从未发生过的直线），同时按新型号重新取景、更新可达范围包络与关节限位。切型号期间状态行显示「切换型号 ur10e…」；加载失败会按 3 s 节流重试，不会永远停在旧臂上。⚠️ **检测上限就是那 30 s**（`__dataTimeout`，vendored 库的值）：这 30 s 内孪生显示的仍是最后一笔读数（旧型号 + 旧姿态）。想立刻纠正，重新调一次 `ursim_connect`（或 `ursim_disconnect` 再连）即可 —— 那会立刻作废宿主的型号缓存。稳态下代次不变 ⇒ **一次多余的 Dashboard 往返都没有**；推送被关掉（或旧版 worker 不带代次）时按 10 s TTL 兜底重读。

**离线仿真（0.7.0 起；现在面板一打开就进）**：面板顶部是「离线仿真」控件 —— 一个开关加**型号**、**起始姿态**、**速度倍率**三个选择项。**现在打开面板会自己开一台仿真，默认 `UR12e` / 竖直收拢 / 倍率 100%**，真机连着也一样 —— 卡片一展开就是可用的。之后由 AI 直接驱动这里的模型：运动类工具作用于 `127.0.0.1` 上的**运动学虚拟机器人**，画面真的会动，而**真机一个字节都收不到**。如果仿真已经开着（AI 用 `ursim_sim_start` 开的、或另一个窗口开的），面板**沿用那一台、绝不重建** —— 重建会把那台虚拟机器人推回起始姿态。**收起面板即停仿真**，并把数据源切回"按宿主解析"。仿真态的标识做了三处冗余，因为它动起来与真机完全一样：画布左上角的紫色**「仿真」角标**、状态行的「离线仿真 · UR12e」、以及**截图水印里的"离线仿真（非真机）"**。每次切换只发一条写请求（`POST /twin/sim`），失败会回滚并写出原因 —— 而那一行**未连接时也照样可见**，自动进入失败（没装 Python、worker 起不来……）时就靠它报错与重试。开着时改型号/姿态/倍率 = 按新配置重建仿真。工具侧也能开：`ursim_sim_start(model="ur10e")`。不想自动开仿真的宿主可用 `autoSim: false` 挂载面板。

**仿真由宿主自愈**：`SIMS` 活在 Python 子进程内存里，所以子进程一旦被替换（崩溃重启、插件重载、进程被回收），那台虚拟机器人就没了。宿主因此**记住仿真配置**，在把仿真指令交给 worker 之前确认它还在（子进程代次变了立刻查，否则每 10 s 兜底查一次），丢了就按记忆重建并写一条日志 —— 不会留下"开关开着、指令却全报未连接"的自相矛盾。用户明确关掉仿真后**不会**被自愈复活；重建只发生一次，之后连续运动不再重复探测。重建后虚拟机器人**回到起始姿态**（这是重建的代价，日志里会说明）。

**仿真的能力边界（写死在代码里，不是文档承诺）**：只实现**运动学** —— 正解/逆解、关节与笛卡尔轨迹插值、位姿读回。运动类工具（`movej`/`movel`/`movep`/`movec`/`servoj`/`move_optimized`/`move_x|y|z`/`move_tool_*`/`draw_*`/`wait_steady`/`stopj`/`stopl`）与读回（`get_joint_pose`/`get_tcp_pose`/`get_robot_model`/`status`/`get_target_values` 等）都可用；**其余指令一律明确回报 `SIM_UNSUPPORTED`**（力控、RTDE 遥测、安全状态位、程序加载与执行、原始脚本、I/O、寄存器、传送带、电源/刹车/自由驱动），并附上"要去 URSim 才能真跑这些"的提示 —— 宁可说"这里没有"，也不给一个看起来能跑的结果。正解与客户端 `fk.js` **逐元素一致**（`test/sim-backend.test.mjs` 钉住），所以读回的 TCP 与画面画出来的位置永远对得上。

**面板跟随桌面端的配色主题（0.1.0 起）**：浅色 / 深色 / 跟随系统来自 DSH 自己的外观设置 —— 主题插件把解析后的快照投影到 document 上：布尔属性 `body[data-ds-dark-theme]` 加一整套 `--dsw-alias-*` 设计 token。面板因此**直接吃这些 token**（只有在宿主 token 缺失时——例如独立预览页——才退回与主题成对的本地值），于是既跟随设置、也跟随任何通过 `ctx.theme` 覆盖别名的第三方主题，**不需要任何 JS 参与**。CSS 唯一够不到的是 WebGL 侧的基座网格：它的颜色烘在几何体顶点色里，`src/client/theme.js` 盯同一个信号、`scene.js` 的 `applyTheme()` **就地**重刷网格（不重建几何体、不新建 `GridHelper`），所以切主题不会打扰相机、模型与已录轨迹。

host 侧路由（均限定 loopback 调用方）：
| 路由 | 说明 |
|---|---|
| `GET /nonead-ursim/twin/stream[?ip=<ip>]` | **SSE 实时流**（客户端默认走这条）：每 100 ms 一帧完整状态快照，另有 `stale`（这一帧读还没回来）与 `frame-error`（这一帧失败）事件 |
| `GET /nonead-ursim/twin/state[?ip=<ip>][&detail=1]` | 实时位姿（关节角 / TCP / 型号）。`detail=1` 附带 dashboard 侧状态（安全模式、运行状态、速度倍率、关节温度/电流等），位姿通道仍独立轮询，detail 失败不影响位姿 |
| `GET /nonead-ursim/twin/asset?model=<urXX>` | GLB 网格，带内容哈希 `ETag` + `immutable`，支持 `If-None-Match` → 304 |
| `GET /nonead-ursim/twin/models` | 本地实际存在的模型清单 |
| `GET /nonead-ursim/twin/sim` | 离线仿真的当前状态（是否开启、型号、起始姿态、倍率、可用型号）+ 能力清单。无副作用 |
| `POST /nonead-ursim/twin/sim` | **本插件唯一的写路由**：`{"enabled":true,"model":"ur10e","preset":"upright","speed_scaling":1}` 开仿真、`{"enabled":false}` 关。写守卫比只读路由更严（除回环信任围栏外**必须带 `Origin`**、`content-type: application/json`、请求体 ≤4 KB）。它的副作用被限制在**回环地址上的运动学虚拟机器人**，任何真机都不会因此收到指令 |

失败响应带**机器可读的 `code`**（`no_robot` / `robot_not_connected` / `ambiguous_robot` / `worker_unavailable` / `robot_error`）并回显本次解析到的 `ip`，界面据此给出不同的提示与处置建议（以前四种完全不同的故障都渲染成同一句「未连接机器人」）。读**暂时**拿不到（worker 正忙着执行运动指令是最常见的原因）时不会报 `robot_error`：宿主回放最后一笔已知读数并标记 `stale:true`（最多 30 s），孪生保留画面并显示停滞提示。

---

## 安装到 DSH profile

### 方式一：作为 bundle 手动安装

1. 在目标 profile 的 `package.json` 中把本插件加入依赖：

   ```jsonc
   // C:\Users\<you>\.dsh\profiles\web\package.json
   {
     "dependencies": {
       "dsh-nonead-ursim": "^0.1.5"
     },
     "dsh": {
       "profile": {
         "bundles": [               // 把本插件加到数组里（顺序靠后即可）
           "...",
           "dsh-nonead-ursim"
         ]
       }
     }
   }
   ```

2. 通过 `dsh plugin`（等价于在 profile 目录内跑 pnpm）安装依赖：

   ```sh
   dsh plugin --profile web install
   # 或 cd "$DSH_HOME/profiles/web" && pnpm install
   ```

3. 重启 DSH。插件的 `cordis.patch.yml` 会自动把插件行插入配置树，工具以 `ursim_*` 形式出现在模型工具列表中。

### 方式二：本地路径（开发时）

把仓库路径加入 profile 依赖（pnpm 支持 `file:`），便于在本仓库迭代：

```jsonc
"dependencies": {
  "dsh-nonead-ursim": "file:D:/MyProgram/GitLab/dsh-nonead-ursim"
}
```

---

## Python 运行时

插件需要一个可用的 Python 与若干依赖（`numpy`、`paramiko`）来启动 worker。可用 `pythonBin` 配置指向解释器：

```sh
pip install -r requirements.txt
```

`cordis.patch.yml` 中的 `pythonBin`（默认 `python`）、`commandTimeoutMs`（运动/脚本超时，默认 60000）、`connectTimeoutMs`（首次连接超时，默认 30000）都可按部署覆盖。若 `python` 不在 PATH，改成绝对路径，例如 `"C:\\Python312\\python.exe"` 或 `"/usr/bin/python3"`。

> ⚠️ **依赖必须装在 worker 用的那个解释器里（一个真实的坑）**
> `lib/worker.js` 会把 `PYTHONPATH` 指向插件的 `python/` 目录，而 CPython 启动时会 import 该目录下的
> `sitecustomize.py`（如果存在）。本仓库里曾有一个**本机私货** `python/sitecustomize.py`，它把本机
> 用户级 `site-packages` 硬编码进 `sys.path` —— 于是"本机能跑"，而换一台机器、或安装发布版
> （该文件**不在** `files` 清单里）之后，`import numpy` 直接失败，所有工具调用都会死。
> 正确做法：**给 `pythonBin` 指向的解释器装好依赖**（或指向一个 venv）。`ursim_ping` /
> `npm run test:python` 就是这条链路的自检入口；`npm run verify:host` 则用宿主真实的
> schema DSL 校验工具注册（应报告 86/86）。

---

## 健康检查 / 测试

无需连接真实机器人即可验证插件与 Python 运行时是否就绪：

```sh
npm run test:python   # python ur_worker.py --selfcheck：校验 Python/numpy/paramiko/URBasic/RTDE 配置
npm test              # 跑全部 40 个测试文件 **以及全部门禁脚本**，最后汇总
npm run test:node     # 只跑 Node 侧：跳过需要 Python 的测试文件**与门禁**
npm run check         # 只跑静态 + 跨语言门禁，不跑测试文件
npm run verify:host   # 用宿主真实的 schema DSL 校验全部工具注册与 peer 版本
npm run verify:models # 校验 14 个 GLB 的结构契约
```

`npm test` 跑两类东西，两类都必须过：

- **40 个测试文件**（端到端协议自检、审批门禁、孪生路由、客户端状态机、FK、vendored 库回归）。
  名单来自 `test/test-manifest.json`（Python 13 / Node 27），并由 `check:manifest` 保证"会调用 Python 的用例"不会被漏登记。
- **9 个门禁脚本**：`check-test-manifest` / `check-package-metadata` / `check-client-bundle` /
  `check-doc-tools`（Node），以及 `check-worker-ops` / `check-tool-params` / `check-rtde-recipe` /
  `check-approval-gate` / `check-new-ops`（Python）。解释器没有 `numpy` 时，依赖 Python 的项会以
  **SKIP + 原因**出现，绝不会显示成通过。

> 0.6.0 新增 `scripts/pdf-extract2.py`：**只用标准库**从 `ScriptManual/*.pdf` 抽文本到
> `ScriptManual/txt/*.txt`（两个 PolyScope 手册的字符码是 glyph id，必须走字体自带的
> `ToUnicode` CMap 才能解出文字）。它是本版所有签名/默认值/范围的可复核来源：
> 有疑问时重新抽取一次，直接查手册原文。

> `check-client-bundle.mjs` 会把 `src/client/**` 重新构建到临时文件并与提交的 `lib/client.js`
> **逐字节**比对：产物落后于源码（改了界面但没重建）会直接让检查失败，而不是静默发布。
> 它绝不覆盖提交产物 —— `scripts/build-client.mjs` 为此支持 `BUILD_CLIENT_OUT`。

> 0.5.0 之前 `npm test` **只跑一次 worker ping**，仓库里另外 20 多个 `*.test.mjs` 一个都不跑 ——
> 所以"npm test 绿了"完全不能说明插件是好的。现在统一由 `scripts/run-tests.mjs` 枚举执行并汇总。

`npm test` 会返回 `selftest passed.` 或非零退出。若 `python` 不在 PATH，用环境变量指定：

```sh
UR_PYTHON=C:\\Python312\\python.exe npm test
```

发布前、以及每次升级 DSH 内核后，都应跑一遍**宿主兼容自检**——它拿**已安装的宿主**校验本插件，而不是校验一份抄下来的关键字清单：

```sh
node scripts/check-host-compat.mjs                 # 缺省宿主 = ../dsh-plugin-desktop/node_modules
node scripts/check-host-compat.mjs <node_modules>  # 也可显式指定宿主
```

它会用宿主实装版本核对 peer 范围、用宿主**真实**的 value-schema DSL 编译**每一个**工具参数 schema（被拒的 schema 会让该工具静默消失）、驱动宿主路由注册，并校验 `dsh.client` 声明与客户端 bundle 的 `__ModuleLoader__` 注册 id。退出码 `0` 表示与该宿主兼容。

> 首次连接到某机器人时，`ursim_connect` 有约 20s 的 RTDE 就绪等待，超时会返回清晰错误而非卡死。

---

## 工作原理

```
DSH 模型        @deepseek-ai/dsh-tools        python/ur_worker.py          UR 机器人
  │  ursim_movej(...)  │                              │                          │
  ├────────────────►  ctx.tools.register(defineTool)                        │
  │                  │  lib/worker.js               │                          │
  │                  ├── spawn(ur_worker.py) ──────►│  import URBasic          │
  │                  │   {id,op,params} ───────────►│  RTDE+Dashboard+RTC      │
  │                  │  ◄── {message,data} ─────────┤  各 op 执行              │
  │  ◄── text ───────┤                              │                          │
```

- **`python/ur_worker.py`**：常驻 stdio JSON worker。维护 `ROBOTS` / `ROBOT_MODELS` 字典，按 IP 连接，每次调用一条指令。运动指令用「到位确认」轮询（有界），并在出错时返回结构化错误。
- **`lib/worker.js`**：按需拉起 worker 一次并保持存活，行分隔 JSON 协议配对请求/响应，带超时与取消（转发 `exec.signal`）。
- **`lib/index.js`**：Cordis 插件，导入 `defineTool` 把上述控制逻辑注册成工具；`inject: ['tools']`。

---

## 工具命名与示例

工具名稳定为 `ursim_*`，示例提示词：

> 连接 192.168.1.199，读取当前 TCP 位姿。

```
ursim_connect(ip="192.168.1.199")
ursim_get_tcp_pose(ip="192.168.1.199")
```

> 让 192.168.1.199 的 TCP 沿 Z 轴下降 20mm。

```
ursim_get_tcp_pose(ip="192.168.1.199")
ursim_move_z(ip="192.168.1.199", distance=-0.02)
```

> 绘制一个半径 50mm 的圆（竖直平面）。

```
ursim_draw_circle(ip="192.168.1.199", center=[0.3,-0.2,0.4,0,3.14,0], r=0.05)
```

---

## 参考实现

- 本插件仓库：<https://github.com/NoneadChina/dsh-nonead-ursim>

本插件与拓德科技的 [`Nonead-Universal-Robots-MCP`](https://gitee.com/nonead/Nonead-Universal-Robots-MCP)（GitHub: <https://github.com/nonead/Nonead-Universal-Robots-MCP>）同源，复用其中的 `URBasic` 库与机器人控制逻辑，由同一团队面向 DeepSeek Harness 重新封装为本插件的 `ursim_*` 工具与 stdio worker 协议。`URBasic` 为 MIT（© Tony Ke & Anthony Zhuang / Universal Robots，2009-2025）。

---

## 注意事项 / 限制

- **连接持久性**：worker 进程在插件生命周期内常驻，机器人连接按 IP 保留；worker 崩溃或 DSH 重启后需重新 `connect`。
- **远程控制模式**：部分 UR 机器人需处于「远程控制」才能执行运动/程序指令，`ursim_connect` 会报告该状态。**URSoftware 3.1–3.20 之间的 CB3 机器人默认就允许远程控制（设置层面无需额外开启）**；但 `remote_control: false` 仍说明控制器**当前**不在远程模式——本地/示教模式下 URScript 与运动指令会被静默丢弃，需在示教器上切到远程控制。其他固件（e-Series，或不在该区间的 CB3）则需先在 PolyScope 中开启 Remote Control。`ursim_get_status` 另给出 `remote_control_raw`，状态读不到时按"未知"处理而不是假装是 `false`。
- **工具端数字 I/O**：`ursim_get_digital_in` / `ursim_set_digital_out` 的 `which="tool"` 用于工具端（法兰侧）数字 I/O。工具端数字信号**不经 RTDE**：读取工具输入会经 `SendProgram` 发送一段短的 URScript 程序，**可能打断正在运行的程序**；写入工具输出则发送 URScript `write_tool_digital_out` 命令。**工具端数字输出的读回不支持**（无可靠的 `read_tool_digital_out` 表达式）。
- **关节电流**：当前 RTDE 配方未直接暴露单关节电流，故未提供 `ursim_get_joint_current`（参考实现中的该工具存在取值错误，本实现未沿用）。
- **线程/取消**：运动指令为阻塞到位的轮询，`commandTimeoutMs` 内完成；对长时间轨迹，请在描述中提醒模型设置合理超时或分步执行。
- **非安全边界**：此插件与 bash 工具同级，可驱动物理设备，务必在真实机器人上充分测试后再用于生产。
- **包体积**：发布包约 **21 MB**，几乎全部来自 **14 个 `assets/models/*.glb`** 网格；插件自身代码只有数百 KB。网格从转换脚本的原始 35.11 MB 经两步可复现瘦身（`node scripts/compress-models.mjs`；`npm run analyze:models` 可看体积构成）：先**无损**降到 28.27 MB（索引 `uint32` → `uint16` —— 这 14 个型号最大索引值仅 24228 —— 并删掉没有任何材质读取的非标准属性 `_color`；顶点位置、UV、贴图与索引序列**逐字节/逐值不变**，脚本在写盘前自证），再经一次**明确决策的有损**处理降到 20.86 MB：5 个新型号里**共 8 张** 2048×2048 底色 PNG（ur15 ×1、ur18 ×2、ur20 ×1、ur30 ×2、ur8long ×2）用块平均降到 1024×1024（`--texture-size 1024`）。孪生面板实际只有几百像素宽，同区域 1:1 对比看不出差别。几何精度未动（Ruling 24）；`test/model-contract.test.mjs` 守住体积区间。若只想砍掉整个型号，可用 `python scripts/convert-meshes.py --only <型号…>` 重新生成子集。
- **未知型号回退**：若某机器人没有内置网格（未知或定制型号字符串），会**回退到近似几何体渲染而不报错**，数字孪生不会因未知型号失败。
- **不接机器人时能不能驱动孪生？——能，但有明确边界（0.7.0 起）**：
  - **插件内建的运动学仿真**：`ursim_sim_start(model="ur10e")` 或面板上的「离线仿真」开关打开后，运动类工具与位姿读回都作用于 `127.0.0.1` 上的虚拟机器人，孪生跟着动 —— **不需要任何真机或 URSim**。
  - **它能做什么**：关节/直线/路径/圆弧/沿轴/绘图等**到位型运动**（含速度倍率、起始姿态选择）、关节角与 TCP 位姿读回、`ursim_wait_steady`/`stopj`/`stopl`；逆解用多起点数值解，不可达会**明确拒绝**而不是给一个近似姿态。
  - **它不能做什么（也不会假装）**：力控、RTDE 遥测（温度/电流/电压/受力）、安全状态位、程序加载与执行、原始脚本、传送带、电源/刹车/自由驱动 —— 这些是**控制器的行为**，没有控制器就没有语义，调用会返回 `SIM_UNSUPPORTED`。速度指令（`speedj`/`speedl`）同样不支持：开放式速度需要持续积分与减速模型，半套模型比没有更危险。**例外是标准/工具端 I/O 与寄存器**（0.1.5 起有仿真语义）：输出写进内存态并可读回，输入没有信号源恒为 0，寄存器没有写入口恒为初值 —— 这几条返回值里都带 `note` 说明。
  - **它也不是安全评估工具**：没有动力学、没有安全功能、时间只是近似（`a`/`v` 决定每段时长，不做 jerk 限幅），所以**不能**用它验证碰撞、节拍或安全距离。
  - **想要全套语义（含 URSim）时**：URSim 是 UR 官方的免费模拟控制器（跑在 VM 里，对外就是一台真控制器）。自 0.1.4 起可以把它当成"一台机器人"驱动 —— **显式开启真机通道**（`motionMode: 'real'` 并把它的 IP 写进 `realRobotIps`），这时 86 个工具与孪生全部照常工作（已兼容 `~/URSim_Linux-*/programs.*` 布局）。默认的 `sim` 模式下该 IP 会在派发前被判为非法输入（`SIM_BADARG`）。
  - **为什么仿真地址是 127.0.0.1**：真机的 RTDE(30003)/Dashboard(29999) 跑在控制器上，本机回环上不可能出现一台真 UR —— 于是"仿真碰不到真机"是**结构性**保证；配合 worker 侧的保留地址守卫，即使宿主侧的登记状态漂了，指向该地址的指令也只会得到一句拒绝。
- **资产管线**：网格由 `python scripts/convert-meshes.py` 生成，其结构契约（每个 GLB 含 7 个固定命名节点、贴图内嵌）由 `python scripts/verify-models.py` 校验（也暴露为 `npm run verify:models`）。

---

## 第三方资产与许可

除插件自身代码外，本包还随附 14 个机器人网格 `assets/models/*.glb`（约 21 MB）与 `assets/kinematics.json`，全部派生自 Universal Robots 的 [`Universal_Robots_ROS2_Description`](https://github.com/UniversalRobots/Universal_Robots_ROS2_Description)（`humble` 分支，获取日期 2026-09-21）。

许可按型号分为两类，同一型号内不会混用：

- **BSD-3-Clause**（9 款）：`ur3`、`ur5`、`ur10`、`ur3e`、`ur5e`、`ur7e`、`ur10e`、`ur12e`、`ur16e`——同时涵盖 `assets/kinematics.json` 所派生的运动学与关节限位配置。
- **UR「Graphical Documentation」条款**（5 款）：`ur8long`、`ur15`、`ur18`、`ur20`、`ur30`。这 5 款的网格**不是** BSD-3-Clause，而属于 UR 的「Graphical Documentation」，其使用受 UR 的 *Terms and Conditions for use of Graphical Documentation* 约束——该条款不符合 OSI 开源定义，但**允许**在若干限制下使用、修改与分享。相关疑问请联系 <legal@universal-robots.com>。

客户端 3D 渲染基于 [three.js](https://threejs.org/)（MIT）；[esbuild](https://esbuild.github.io/)（MIT）仅用于构建期。

逐型号派生清单、转换参数与许可全文见 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。

---

## 真机通道（默认关闭）

本版**可以**驱动真控制器，但必须由使用者显式开启：

```yaml
motionMode: 'real'               # 默认 'sim' —— 不配它就碰不到任何真机
realRobotIps: '192.168.1.10'     # 逗号分隔的白名单；留空则任何目标都被拒
```

- **`sim`（默认）是结构性保证，不是策略。** worker 在派发**之前**就拒绝保留回环地址以外的任何
  地址，因此 RTDE / Dashboard / SSH / 远程控制那一整套代码**不可达** —— 不是"有但不用"。
- **`real` 还必须配白名单。** 白名单外的目标在**宿主侧**就被拒绝，根本到不了 worker；白名单留空
  等于拒绝一切（fail-closed），而开启 `real` 却没写白名单时插件会明确 warning。
- **两种模式下仿真都仍然可用**，且保留回环地址**永远**表示那台虚拟机器人 —— 绝不交给真机实现
  （否则"把真控制器端口转发到环回"就会变成一条绕回来的路）。
- **`real` 模式下不存在任何审批豁免**：每一条受门禁的指令都要人确认，包括指向仿真的那些。这一条
  同时关掉了审计的 H-2 —— 从前"豁免"是宿主侧、模型自己能用 `ursim_sim_start` 置位的状态；现在它
  来自人写下的配置值。
- 指向真机之前，请先读 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) 与本文档顶部的安全提示。

## License

本项目采用**区分用户的双重许可 (User-Segmented Dual Licensing)** 模式：

- **AGPLv3**：适用于**个人用户**及**10人及以下企业/组织**（开源；详见 <https://www.gnu.org/licenses/agpl-3.0.html>）。
- **商业许可证（必须）**：适用于**超过10人**的组织，或任何需要规避 AGPLv3 源代码公开义务（如 SaaS / 闭源分发）的用户。

完整条款见 [LICENSE](./LICENSE)。商业授权请联系 [service@nonead.com](mailto:service@nonead.com)。

`python/URBasic`（vendored）仍沿用其自身 **MIT** 许可（© Anthony Zhuang / Universal Robots，2009-2025）。
