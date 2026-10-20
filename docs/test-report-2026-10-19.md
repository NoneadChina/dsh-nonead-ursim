# 完整功能测试报告 · 2026-10-19

> **历史存档（v0.2.4）。** 本报告记录的是 2026-10-19 对 v0.2.4 的回归，数字（87 工具 / 88 op /
> 48 门禁 / 用例规模）与今天的 v0.3.1 不一致，保留原文仅为可追溯。当前结论见
> [2026-10-20 报告](./test-report-2026-10-20.md)（89 工具 / 90 op / 50 门禁）。

被测对象：`dsh-nonead-ursim` v0.2.4，commit `75bee83`（与 `origin/main` 同一提交）
测试主机：Windows · Node v24.18.0 · Python 3.12.9 · 宿主 `@deepseek-ai/dsh` 0.2.0-rc.2
测试方式：仓库自带门禁与测试套件（四层）+ 会话内真实调用已注册工具驱动 UR12e 离线仿真

> 结论：**四层验证全部通过，0 失败、0 跳过、0 源码改动。**

## 1. 静态与契约门禁（`npm run check`）

| 门禁 | 关键结论 |
| --- | --- |
| `check:static` | `main` / `exports` / `files` 覆盖齐全；不含 `sitecustomize.py`；无硬编码作者机器绝对路径；提交的 `lib/client.js` 可由当前 `src/client/**` **逐字节重建**（正文 sha256 `a6375e05…`，682.9 KB） |
| `check:ops` | Python `HANDLERS` **88** 个 op ↔ **87** 个工具，无孤立 op、无重复；**48** 个受审批门禁 op 全部存在；schema 与 Python 读取方式**双向自洽，0 处失配**；RTDE 接收配方 87 字段、默认配方 73 字段通过；产品默认 `requireApprovalForMotion=false` 在 schema / 代码兜底 / `cordis.patch.yml` 三处一致 |
| `check:docs` | README / README.zh 表格覆盖全部 87 个工具，受门禁清单双向一致；**247 条相对链接全部可解析**；工具矩阵（48 门禁 / 46 仿真实现 / 6 透传 / 35 不支持）与声明表一致 |
| `check:manifest` | 48 个测试文件被两份清单完整覆盖（Python 17 / Node 31），17 个需要 Python 的用例全部登记 |

## 2. 完整测试套件（`npm test`）

**48 个测试文件 + 11 道门禁，共 59 项，全部通过（0 失败 / 0 跳过，exit 0）。**

代表性用例规模：`twin-panel`(72) · `twin-routes`(55) · `fk`(27) · `worker`(24) · `approval-gate`(19) · `state`(16) · `twin-stream`(14) · `vendored-fixes`(14) · `tool-schema-dsl`(13) · `scene-alignment`(12) · `loader`(10) · `sim-backend`(10) · `sim-persistence`(9) · `pending-motion`(9) · `safety-status`(7) · `twin-io`(7) · `texture-resize`(8) · `strings`(8) · `sim-telemetry`(4) 等。

覆盖的功能维度：

- **工具面**：87/87 工具注册、参数 schema 只使用宿主 DSL 支持的关键字、黄金快照（名称/描述/schema 不得漂移）、op↔handler 跨语言契约。
- **审批门禁**：批准前绝不下发、批准后下发、载荷指纹绑定、fail-closed（无审批服务/无 agent/异常）、仿真目标豁免、真机模式白名单。
- **执行器**：协议往返、子进程崩溃恢复、超时 kill 与 `killOnTimeout:false`、读/命令分闸准入、在飞上限、中文参数往返。
- **仿真后端**：Python 正解与客户端 `fk.js` **逐元素一致**；沿轴位移精确、画圆闭合；`run_sequence` 整条折线共用一条时间剖面；不支持指令明确回报 `SIM_UNSUPPORTED`。
- **面板与路由**：SSE 流生命周期、背压、陈旧帧回放、I/O 与寄存器分片、能力清单、水印、可达范围、奇异点提示。
- **模型资产**：14 个型号 GLB 均存在，节点名与顺序符合 `LINK_MESH_NODES`，相邻连杆装配间隙与运动学链量级一致。

## 3. 附加验收

| 命令 | 结论 |
| --- | --- |
| `npm run verify:host` | 4 个 peer 依赖均满足；**87/87 工具经宿主真实 schema DSL 注册成功**；5 条 twin 路由（`stream` / `state` / `asset` / `models` / `sim`）齐全；`dsh.client` 声明与客户端 bundle 一致 |
| `npm run verify:models` | 14 个 `.glb` 全部 `[OK]`，合计 20.86 MB，损坏 0，节点数均 7 |
| `npm run test:python` | `urbasic: true`、`numpy 2.1.3`、`paramiko 5.0.0`、两份 RTDE 配方存在 |

## 4. 会话内端到端冒烟（真实调用已注册工具）

目标：`127.0.0.1` 上的离线仿真 UR12e（upright，速度倍率 1.00）。

| 功能面 | 观测结果 |
| --- | --- |
| 生命周期 | `ping` → `sim_status` → `sim_stop` → `sim_status`（inactive）→ `sim_start` 全部正确 |
| 读回 | 型号 / 安全模式 / 程序状态 / 目标值 / 关节 / 遥测均自洽；遥测带 `estimated: true` 与估算说明 |
| 运动 | `movej`（关节到位且读回一致）、`movel`（z +0.05 m）、`movec`（三点圆弧）、`move_x`（+0.02 m 精确）、`move_optimized`（a/v 按能力比例换算）、`run_sequence`（2 段不停顿）、`draw_circle`（4 个共圆途经点 / 18 步）、`wait_steady` 均成功 |
| I/O | `set_digital_out(std, 3, true)` → `get_digital_out_bits` 第 3 位为 `true`（内存态可写可读回） |
| 寄存器 | `get_int_register` / `get_bit_register` 返回初值并说明"没有写入口" |
| 不支持指令 | `get_safety_status` → 明确 `SIM_UNSUPPORTED`，不伪装成功 |
| 参数与目标校验 | 真机 IP 在仿真模式下被拒（`SIM_BADARG` 语义）；`movej` 传 5 维 `q` → `ValueError` 明确拒绝 |

## 5. 说明与边界（均非缺陷）

1. `README` 正文提及未注册的 `ursim_get_joint_current` —— 门禁明确允许的提示项（该读数已并入 `ursim_get_status`）。
2. `check-tool-params` 对 10 个**条件必填**参数给出 note（如 `conveyor_tracking.*`、`set_payload.cog`），不属于失配（`mismatched_ops: 0`）。
3. 部分 Python 门禁在 Windows GBK 代码页下控制台中文显示为乱码，只是显示问题，判定仍为 PASS。
4. **真机专属路径未验证**：力控、安全状态位、程序加载与执行、原始 URScript、传送带跟踪需要有真控制器才能验，本报告仅由单元/契约测试覆盖。
5. 测试不修改任何源码；检查产物（`lib/.client.rebuild-check*`、`scripts/.tmp-*`）已清理，工作区干净。

## 6. 复现

```powershell
npm run check            # 静态与契约门禁
npm test                 # 48 个测试文件 + 11 道门禁 = 59 项
npm run verify:host      # 宿主兼容与真实 DSL 注册
npm run verify:models    # 模型资产完整性
npm run test:python      # worker 自检（Python 依赖）
```

发布前回归固定使用以上五条；仿真不覆盖真机力控/安全位/程序执行，发布前需真机补验。

工具分类与审批门禁见 [工具矩阵](./tool-matrix.md)；版本变更见 [CHANGELOG](../CHANGELOG.md)。

## 7. worker / 仿真层 88 个 op 全量扫测（2026-10-19 补充）

方法：从 `lib/tool-defs.js` 解析 op→toolName（87 个，无重复；第 88 个 `shutdown_worker` 无工具），
`docs/tool-schemas.golden.json` 提供参数，逐个调用 `route_op(op, params)`（passthrough 回落 `HANDLERS`），
`_timeout_ms=3000`，起点 `sim_start(ur12e / upright / 1.0x)`；结果逐条落盘 JSONL。

**结果：88/88 全部返回，0 个未捕获异常，0 条信封不一致；跑完全部 op 后 worker 仍存活（ping ok）。**

| 分类 | 数量 |
| --- | ---: |
| ok | 43 |
| SIM_UNSUPPORTED（如实拒绝，带 simulated / op / capabilities） | 35 |
| TIMEOUT（3 s 预算不足；30 s 复核后 ok） | 2 |
| SIM_UNREACHABLE（起点跨基座奇异点被连续性门拒绝；换可达起点复核后 ok） | 7 |
| SKIPPED（`shutdown_worker`；另有子进程探针验证 ok:true + exit 0） | 1 |

关键结论：

- 0.2.4 的"信封 `ok` 必须等于 `data.ok`"在 88 条返回上 **0 违规**；真实 `main()` 子进程探针同样一致
  （movej 超时 → 信封 `ok:false` + `code:TIMEOUT` + `data.ok:false`）。
- 7 个 `SIM_UNREACHABLE` 是**测试夹具的起点问题**，不是目标不可达；它恰好证明 `MAX_IK_STEP_RAD=0.5` 的
  连续性门在工作（没有这道门，仿真会在两个构型分支之间画出真机走不了的折线还报"已到达"）。
- `run_sequence`（20 段 + `t=30`）与四个 `draw_*` 的计划时长 = `t + 0.05 s`（`_MIN_SEGMENT_S` 地板，
  测试里已明文记录该常数）。

## 8. 宿主工具层冒烟（2026-10-19 补充，会话内真实调用 36 个已注册工具）

全部通过：`sim_start` / `get_status` / `get_speed_scaling` / `get_uptime` / `get_robot_model` /
`get_serial_number` / `get_joint_pose` / `get_tcp_pose`、`set_digital_out` + `get_digital_out_bits`
（写后读回 bit0=true）、`get_digital_in(_bits)`、`set_analog_out`（5 V → fraction 0.5）、`get_analog_in`、
`get_int_register` / `get_double_register` / `get_bit_register`、`get_runtime_telemetry` /
`get_joint_temperatures`、`movej` / `movel` / `movep` / `movec` / `move_x` / `move_tool_z`、
`draw_circle` / `draw_square` / `draw_rectangle` / `draw_star`（含 `t` 生效、circle steps=33、
star 外接半径 = side/(2·sin72°)）、`run_sequence`（3 段 + `t=6`，`segment_count=3`）、
`move_optimized`（a/v 折成能力比例）、`servoj`、`wait_steady`、`stopj` / `stopl`、`get_target_values`、
`get_program_state`、`sim_stop` / `sim_start`、`ping`（python 3.12.9 + urbasic true）。

无仿真语义的指令（`force_mode` / `get_safety_status` / `load_program` / `send_script` / `set_freedrive`）
全部**如实拒绝**并附完整能力清单 —— 没有"假成功"。

### 原发现的两处文案缺陷（已修，并由 test/sim-only.test.mjs 断言钉住）

1. **中**：`_sim_no_semantics` 的拒绝文案仍写"请使用 URSim……用 `ursim_connect` 指向它的 IP 即可"，
   但 sim 模式下非回环地址会被结构性拒绝（`SIM_BADARG`）⇒ **照做必失败**。该问题在
   `docs/audit-2026-10-13-four-experts.md` 一脉的 Python 面审查（M7）里已记，不在本轮修复清单内。
2. **低**：`ursim_sim_stop` 回包写"仿真会回到真机（若已连接）"，而 sim 模式下本插件不存在真机通道，
   措辞会误导。

建议：改成"本插件只做运动学仿真；URSim 需按 `motionMode=real` + `realRobotIps` 白名单接入"与
"仿真已关闭"，并在 `test/sim-only.test.mjs` 里加一条断言把措辞钉住（避免再漂）。
