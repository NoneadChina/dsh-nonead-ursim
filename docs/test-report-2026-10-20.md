# 完整功能测试报告 · 2026-10-20（v0.3.1）

被测对象：`dsh-nonead-ursim` v0.3.1（commit `1e37f23`）**加上 2026-10-20 审查修复后的工作区**
测试主机：Windows · Node v24.18.0 · Python 3.12.9 · 宿主 `@deepseek-ai/dsh` 0.2.0-rc.2
测试方式：仓库自带门禁与测试套件（四层）+ 会话内真实调用已注册工具驱动 UR12e 离线仿真

> 结论：**四层验证全部通过，0 失败、0 跳过。** 本轮另外修复了 33 项审查发现（见 §6），
> 其中 4 项会直接影响安全或可用性（速度流松手不停、只读轮询杀 worker、仿真状态跨线程撕裂、
> README 承诺与实现不符）。

## 1. 静态与契约门禁（`npm run check`）

| 门禁 | 关键结论 |
| --- | --- |
| `check:static` | `main` / `exports` / `files` 覆盖齐全；不含 `sitecustomize.py`；无硬编码作者机器绝对路径；提交的 `lib/client.js` 可由当前 `src/client/**` **逐字节重建** |
| `check:ops` | Python `HANDLERS` **90** 个 op ↔ **89** 个工具，无孤立 op、无重复；**50** 个受审批门禁 op 全部存在；schema 与 Python 读取方式**双向自洽，0 处失配**；RTDE 接收配方 87 字段、默认配方 73 字段通过；产品默认 `requireApprovalForMotion=false` 在 schema / 代码兜底 / `cordis.patch.yml` 三处一致 |
| `check:docs` | README / README.zh 表格覆盖全部 **89** 个工具，受门禁清单双向一致；**257 条相对链接全部可解析**（跳过 20 条外链/锚点）；工具矩阵（89 op：**50 门禁 / 49 仿真实现 / 6 透传 / 34 不支持**）与声明表 `docs/tool-matrix.json` **及生成物 `docs/tool-matrix.md`** 逐字节一致 |
| `check:manifest` | **48** 个测试文件被两份清单完整覆盖（Python 17 / Node 31），17 个需要 Python 的用例全部登记 |
| `check:package-metadata` | `package.json` 的 `files` 与 `main` 覆盖齐全（本轮改为**逐项精确匹配**，不再用前缀近似） |

## 2. 完整测试套件（`npm test`）

**48 个测试文件 + 11 道门禁，共 59 项，全部通过（0 失败 / 0 跳过，exit 0）。**

代表性用例规模：`twin-panel`(97) · `twin-routes`(86) · `sim-backend`(27) · `worker`(24) ·
`approval-gate`(19) · `twin-stream`(14) · `vendored-fixes`(14) · `tool-schema-dsl`(13) ·
`scene-alignment`(12) · `loader`(10) · `sim-persistence`(9) · `pending-motion`(9) ·
`strings`(8) · `texture-resize`(8) · `safety-status`(7) · `twin-io`(7) · `sim-telemetry`(4) 等。

**跳过语义（本轮修复）**：`scripts/run-tests.mjs` 过去在跳过 22 项（例如解释器缺 `numpy`）时
仍然 `exit 0`，与 README「SKIP 绝不是 PASS」的承诺相反。现在跳过会让退出码为 **2**；
确知环境缺依赖、只想跑 Node 侧时，用 `--skip-python` 或显式 `--allow-skip` 表示知情接受，
汇总里仍逐条打印 SKIP 与原因。

覆盖的功能维度：

- **工具面**：89/89 工具注册、参数 schema 只使用宿主 DSL 支持的关键字、黄金快照（名称/描述/schema 不得漂移）、op↔handler 跨语言契约。
- **审批门禁**：批准前绝不下发、批准后下发、载荷指纹绑定、fail-closed（无审批服务/无 agent/异常）、仿真目标豁免、真机模式白名单。
- **执行器**：协议往返、子进程崩溃恢复、超时 kill 与 `killOnTimeout:false`、读/命令分闸准入、在飞上限、中文参数往返、**面板只读轮询不杀 worker**。
- **仿真后端**：Python 正解与客户端 `fk.js` **逐元素一致**；沿轴位移精确、画圆闭合；`run_sequence` 整条折线共用一条时间剖面；旋转插值走**球面插值**（终点姿态精确）；不支持指令明确回报 `SIM_UNSUPPORTED`。
- **面板与路由**：SSE 流生命周期、背压、陈旧帧回放、I/O 与寄存器分片、能力清单、水印、可达范围、奇异点提示；`POST /twin/jog` 的 8 种 mode、守卫顺序（405 → 403 信任围栏 → 403 `SIM_ONLY` → 400 解析 → 派发）、速度流看门狗。
- **模型资产**：14 个型号 GLB 均存在，节点名与顺序符合 `LINK_MESH_NODES`，相邻连杆装配间隙与运动学链量级一致。

## 3. 附加验收

| 命令 | 结论 |
| --- | --- |
| `npm run verify:host` | 4 个 peer 依赖均满足；**89/89 工具经宿主真实 schema DSL 注册成功**；**6** 条 twin 路由（`stream` / `state` / `asset` / `models` / `sim` / `jog`）齐全；`dsh.client` 声明与客户端 bundle 一致 |
| `npm run verify:models` | 14 个 `.glb` 全部 `[OK]`，合计 20.86 MB，损坏 0，节点数均 7 |
| `npm run test:python` | `urbasic: true`、`numpy 2.1.3`、`paramiko 5.0.0`、两份 RTDE 配方存在 |
| `npm pack --dry-run` | 51 个文件，tarball 15.5 MB / 解包 23.8 MB（`lib/client.js.map` 已排除），内含 AGPL 许可证副本 |

## 4. 会话内端到端冒烟（真实调用已注册工具）

目标：`127.0.0.1` 上的离线仿真 UR12e（upright，速度倍率 1.00）。

| 功能面 | 观测结果 |
| --- | --- |
| 生命周期 | `ping` → `sim_status` → `sim_stop` → `sim_status`（inactive）→ `sim_start` 全部正确 |
| 读回 | 型号 / 安全模式 / 程序状态 / 目标值 / 关节 / 遥测均自洽；遥测带 `estimated: true` 与估算说明 |
| 运动 | `movej`（关节到位且读回一致）、`movel`（z +0.05 m）、`movec`（三点圆弧）、`move_x`（+0.02 m 精确）、`move_optimized`（a/v 按能力比例换算）、`run_sequence`（2 段不停顿）、`draw_circle`（4 个共圆途经点 / 18 步）、`wait_steady` 均成功 |
| 面板控制 | `POST /twin/jog` 的 `step` / `rotate` / `pose` / `joint` / `home` / `speed` / `velocity`（带 `ttl_ms` 看门狗）/ `stop` 全部生效；非仿真目标一律 `403 SIM_ONLY`；松手后速度流在 400 ms 内自行停下 |
| I/O | `set_digital_out(std, 3, true)` → `get_digital_out_bits` 第 3 位为 `true`；`"false"` 字符串被拒绝（不再被 `bool()` 反转） |
| 寄存器 | `get_int_register` / `get_bit_register` 返回初值并说明"没有写入口" |
| 不支持指令 | `get_safety_status` → 明确 `SIM_UNSUPPORTED`，不伪装成功 |
| 参数与目标校验 | 真机 IP 在仿真模式下被拒（`SIM_BADARG`）；`movej` 传 5 维 `q` → `ValueError` 明确拒绝；`jog_rotate` 超过 π 拒绝；`delta_rad=0`、非法轴名、`set_speed_scaling` 的 NaN 一律 fail-closed |

## 5. 说明与边界（均非缺陷）

1. `README` 正文提及未注册的 `ursim_get_joint_current` —— 门禁明确允许的提示项（该读数已并入 `ursim_get_status`）。
2. `check-tool-params` 对 10 个**条件必填**参数给出 note（如 `conveyor_tracking.*`、`set_payload.cog`），不属于失配（`mismatched_ops: 0`）。
3. 部分 Python 门禁在 Windows GBK 代码页下控制台中文显示为乱码，只是显示问题，判定仍为 PASS。
4. **真机专属路径未验证**：力控、安全状态位、程序加载与执行、原始 URScript、传送带跟踪需要有真控制器才能验，本报告仅由单元/契约测试覆盖。
5. 测试不修改任何源码；检查产物（`lib/.client.rebuild-check*`、`scripts/.tmp-*`）由脚本自行清理。

## 6. 本轮审查修复（2026-10-20，v0.3.1 之后、未发布）

按层归类的 33 项修复，全部有对应测试或门禁钉住：

- **Python 仿真/worker（15 项）**：仿真状态加 `RLock`（消除推送线程与命令线程的撕裂帧/双积分）；`jog_rotate` 增量上界 π；顺时针圆弧 `u_frac` 被钳 0；`respond()` 序列化失败不再杀死 worker；stdin 解码 `errors="replace"`；`set_digital_out` 严格布尔（`"false"` 不再被当成 true）；沿轴距离 `isfinite` 校验；`_sim_settle` 超时后冻结而非继续运动；`_sim_movec` 的 `mode=1` 如实标注未建模；`list_programs` 加载 known_hosts、失败也关连接；`stop()` 后 `is_steady` 立即可真；`speedj_probe` 无副作用采样；旋转插值改为球面插值（终点姿态精确，跨 ±π 不再走长路）；`snapshot`/`target_snapshot` 同锁。
- **宿主 `lib/`（11 项）**：只读轮询与 I/O 写改走 `killOnTimeout:false`（不再为一次 GET 杀掉仿真内存态或真机 RTDE 会话）；`disconnect` 仅在目标是仿真 IP 时清仿真登记；connect 仅在仿真 IP 上补问 `sim_status`；`POST /twin/sim` 对非对象 body / 非布尔 `enabled` 回 400（不再静默关仿真）；路由 catch 按错误状态码回包；`sendJson` 防已关闭 socket；`_onLine` 的 `null` 行守卫；重启定时器跟踪 + dispose 后不再 spawn；`spawn` 加 `windowsHide`；shutdown 定时器 `unref`/清理；读闸门与 SSE 并发数对齐；`wait_steady`/`run_sequence`/`speedj`/`speedl` 的宿主超时按参数上调。
- **面板 `src/client/`（10 项）**：窗口级 `pointerup`/`blur`/`visibilitychange` 兜底（松手一定停速度流）；busy 时的位姿/关节提交给出可见拒绝并保留输入；错误行驻留 5 秒；HUD 行 `aria-live` 降噪；`:focus-visible` 轮廓；关节 ± 按钮放大到 32px（gap 12px）；位姿输入严格十进制（拒绝 `0x10`/`1e3`）；窄栏响应式（`@container` 819/729）；`refreshIo` 请求令牌去乱序；mode 角标去重。
- **文档与门禁（7 项）**：README 路由表补 `POST /twin/jog` 并修掉 3 单元格畸形行；`0.6.0` / `5.0` / `^0.2.4` 等不存在的版本引用改为事实表述；`run-tests.mjs` 跳过即非 0 退出；`check-package-metadata` 精确匹配；`check-new-ops` 补 `jog_rotate` / `set_speed_scaling` 正反用例；`tool-matrix` 校验 `.md` 生成物；`package.json` 补 AGPL 副本、排除 sourcemap、`prepublishOnly` 跑完整检查与测试。

## 7. 复现

```powershell
npm run check            # 静态与契约门禁
npm test                 # 48 个测试文件 + 11 道门禁 = 59 项
npm run verify:host      # 宿主兼容与真实 DSL 注册
npm run verify:models    # 模型资产完整性
npm run test:python      # worker 自检（Python 依赖）
```

发布前回归固定使用以上五条；仿真不覆盖真机力控/安全位/程序执行，发布前需真机补验。

工具分类与审批门禁见 [工具矩阵](./tool-matrix.md)；版本变更见 [CHANGELOG](../CHANGELOG.md)；
上一版（v0.2.4）的完整记录见 [2026-10-19 报告](./test-report-2026-10-19.md)。
