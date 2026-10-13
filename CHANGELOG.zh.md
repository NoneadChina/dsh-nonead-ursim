# 更新日志 / Changelog

本包遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

本包的版本线**从 0.1.0 开始**：`dsh-nonead-ursim` 是一个独立的 DSH 插件，不延续它从中分离出来的
那份代码库的版本编号。此前那段历史已原样归档到
[`CHANGELOG-archive.zh.md`](./CHANGELOG-archive.zh.md)；它**不属于**本包，并已通过 `package.json`
的 `files` 白名单排除在发布包之外。

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
- **只读 3D 数字孪生**（three.js），入口是**右栏「开始」面板**中的一张卡片：关节位姿、TCP 坐标系
  与近期轨迹、工程图层开关，以及仪表盘侧数值读数。它**严格只读**，绝不向机器人下发指令。
  遥测由 worker 以 20 Hz **主动推送**，孪生优先读该缓存，因此机器人运动时画面不会卡住；
  孪生读取使用**专用预算且 `killOnTimeout:false`**，可视化读取永远不会掐掉机器人会话。
- **运动学级离线仿真**，落在保留的回环地址 `127.0.0.1`：`ursim_sim_start` / `ursim_sim_stop` /
  `ursim_sim_status` 驱动一台虚拟机器人，其正解与客户端的 `fk.js` **逐元素一致**；逆解为带多种初值的
  阻尼最小二乘，解不出就报"不可达"，绝不返回近似位姿。没有仿真语义的指令一律回报
  `SIM_UNSUPPORTED`，而不是给一个看起来合理的结果。
- **5 条 host 路由**（均限制为回环调用方），前缀 `/nonead-ursim/twin/…`：`stream`（SSE，客户端默认）、
  `state`、`asset`、`models`、`sim` —— 其中 `sim` 是本插件**唯一**的写路由，其副作用被限制为回环地址上的
  一台运动学虚拟机器人。
- **发布门禁**：`npm run check`（static / ops / docs / manifest）与 `npm test`，含 `test/test-manifest.json`
  登记的 Python 依赖用例对账。
- **孪生面板跟随桌面端的配色主题**（浅色 / 深色 / 跟随系统）：面板 CSS 改为建立在宿主的 `--dsw-alias-*`
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
  零再重新加速：0.5 m 的运动变成 ~50 次微型启停（肉眼就是一顿一顿，孪生相邻两帧的关节速度也近乎随机）。在 20 Hz
  孪生节拍下实测一条 0.5 m `movel`：近似静止帧从 ~52 降到 **3**，巡航速度波动 <1.5%，相邻帧速度突跳不超过
  0.02 rad/s per 50 ms，总时长从 ~9 s 降到 3.7 s。`test/sim-motion-smooth.test.mjs` 把结构与这些数字都钉住。
  - 顺带修掉：走完一条上百段的折线原来靠逐段浮点相减，末点会差一点点（画圆闭合差 2.6e-5 而不是 4e-7）。
    `_sample()` 现在一旦走完全程就原样返回终点。
- **本插件改为纯仿真：不存在任何真机通道。** 所有工具都作用于保留回环地址上的虚拟机器人；真机 IP 会在
  worker 里、**派发之前**就被判为**非法输入**（`SIM_BADARG`）—— 这正是让 RTDE / Dashboard / SSH / 远程控制
  探测那几条路**不可达**（而不是"有但不用"）的关键。调用不再需要"先连机器人"这一步：`route_op()` 会按需
  开一台 `UR12e` 仿真（竖直收拢、倍率 100%）再派发，所以直接发运动指令就能动。`ursim_connect` 变成"确保仿真
  在跑"，`ursim_disconnect` 变成"停掉它"（幂等）；`ip` 参数在所有工具上都可选，且只接受 `127.0.0.1`。孪生路由
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
  - 孪生路由前缀 `/dsh-nonead-ur` → **`/nonead-ursim`**（`/nonead-ursim/twin/{state,asset,models,stream,sim}`）；
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
