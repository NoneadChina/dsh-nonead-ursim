# 完整功能测试报告 · 2026-10-28（v0.3.12）

被测对象：`dsh-nonead-ursim` v0.3.12（commit `e6cd212`，工作区干净）
测试主机：Windows · Node v24.11.0 · Python 3.12.9（uv 环境）· 宿主 `@deepseek-ai/dsh` 0.2.0-rc.2
测试方式：仓库自带门禁与测试套件（四层）+ 宿主兼容自检 + 模型资产校验 + 发布包清单

> 结论：**门禁、测试套件、宿主兼容、模型资产、发布包五项全部通过，0 失败、0 跳过。**
> 本轮**没有**做会话内端到端冒烟，原因见 §5.1：本机宿主进程的 `python` 指向 Windows Store
> 存根，仿真 worker 直接以 `code=9009` 退出。这是测试主机的 Python 配置问题，不是插件缺陷，
> 但必须如实记录 —— 0.3.9 那份报告里的端到端表格不代表本版复测过。

## 1. 静态与契约门禁（`npm run check`）

| 门禁 | 关键结论 |
| --- | --- |
| `check:static` | `main` / `exports` / `files` 覆盖齐全；不含 `sitecustomize.py`；无硬编码作者机器绝对路径；提交的 `lib/client.js` 可由当前 `src/client/**` **逐字节重建**（正文 sha256 `5883fd28…`，801.3 KB，仅 sourceMappingURL 注释不同） |
| `check:ops` | Python `HANDLERS` **90** 个 op ↔ **89** 个工具；**50** 个受审批门禁 op 全部存在；schema 与 Python 读取方式**双向自洽，0 处失配**；RTDE 接收配方 87 字段、默认配方 73 字段通过 |
| `check:docs` | README / README.zh 表格覆盖全部 **89** 个工具，受门禁清单双向一致；**257 条相对链接全部可解析**（跳过 24 条外链/锚点）；工具矩阵（89 op：**50 门禁 / 49 仿真实现 / 6 透传 / 34 不支持**）与声明表 `docs/tool-matrix.json` 及生成物 `docs/tool-matrix.md` 一致 |
| `check:manifest` | **48** 个测试文件被两份清单完整覆盖（Python 17 / Node 31），17 个需要 Python 的用例全部登记 |
| `check:package-metadata` | `package.json` 的 `files` 与 `main` 覆盖齐全；版本号 0.3.12 与 `package-lock.json` 两处根条目一致 |

## 2. 完整测试套件（`npm test`）

**48 个测试文件 + 11 道门禁，共 59 项，全部通过（0 失败 / 0 跳过，exit 0）。**

本轮改变了 i18n 的层数与体积，相关用例：

- `strings.test.mjs`（**10 条**，本轮从 3 条扩到 10 条）：8 套文案键集合逐一对称且值类型一致；枚举表（安全模式 / 机器人模式 / 程序状态）8 套键一致且无空串；所有插值键在每种语言都能产出文本且不丢型号 / IP / 关节名 / 电压；西文语言（en/es/fr/de/pt/ru）不残留中文；`detectLocale` 优先读 `<html lang>`、其次 `__DSH_LOCALE__`、最后 `navigator.language`；`liveStrings` 在 `<html lang>` 变化后立刻返回新语言。
- `check-client-bundle`：`lib/client.js` 727.2 KB → 801.3 KB（新增 6 套词典）后仍可由 `src/client/**` 逐字节重建。
- `check-doc-tools` / `tool-matrix` / `check-doc-links`：工具表与受门禁清单未受影响，257 条链接全部可解析。

跳过语义保持不变：解释器缺 `numpy` / `paramiko` 时，依赖 Python 的项以 **SKIP + 原因**出现，且退出码为 **2**（跳过不是通过）。

## 3. 附加验收

| 命令 | 结论 |
| --- | --- |
| `npm run verify:host` | 4 个 peer 依赖均满足（dsh 0.2.0-rc.2 / dsh-tools 0.2.0-rc.2 / cordis 4.0.4 / schemastery 3.18.4）；**89/89** 工具经宿主真实 schema DSL 注册成功；**6** 条 twin 路由（`stream` / `state` / `asset` / `models` / `sim` / `jog`）齐全；`dsh.client` 声明与客户端 bundle 一致；**note**：未检测到可用的系统 `python` |
| `npm run verify:models` | 14 个 `.glb` 全部 `[OK]`，合计 **20.86 MB**，损坏 **0**，节点数均 7，图像数 1–14 |
| `npm pack --dry-run` | **51** 个文件；tarball **15.5 MB** / 解包 **24.0 MB**；sha512 `LoCVCmxmWU8aT…`；`lib/client.js.map` 已排除，AGPL 许可证副本随包 |

## 4. 版本变更（0.3.11 → 0.3.12）

| 提交 | 内容 |
| --- | --- |
| `d09a3f6` | 面板 8 语言 i18n：新增 `src/client/locales/{ja,es,fr,de,ru,pt}.js`（各 143 键），`strings.js` 扩到 8 语言并新增 `detectLocale` / `liveStrings` / `onLocaleChange`，三个面板模块改用 `liveStrings()` |
| `ddb9980` | `.gitignore` 忽略测试临时目录 `ur-log-test-*/` |
| `03a101c` | `chore(release): 0.3.12`：版本号（`package.json` + `package-lock.json` 两处）、CHANGELOG 中英 `[0.3.12]` 段、README 中英 8 语言段 |
| `e6cd212` | `docs(readme)`：标注已发布 npm（`latest` = 0.3.12）与新安装方式 |

已发布：npm `dsh-nonead-ursim@0.3.12`（registry 时间 2026-10-28T16:10:20Z）；git 标签 `v0.3.12` = `03a101c`。

## 5. 未覆盖边界

### 5.1 会话内端到端冒烟（本轮未做）

本机宿主进程里的 `python` 解析到 Windows Store 的应用执行存根，插件按默认 `pythonBin: python`
启动 worker 时立即失败：

```
ursim_sim_start → Error: UR worker exited (code=9009, signal=?)
```

`npm run verify:host` 对此已给出 note。**这是测试主机的 Python 配置问题，不是插件缺陷**：
把插件的 `pythonBin` 指向真实解释器（例如 `D:\MyProgram\GitHub\.ursim-build-env\.tmp-venv\Scripts\python.exe`）
并重启宿主后即可复测。0.3.9 报告 §4 的端到端表格（读回 / 运动 / 面板点动 / 速度流 / I/O /
遥测 / 不支持指令拒绝 / 参数校验）**不代表本版复测过**，本版只验证到注册面与单元/集成测试层。

### 5.2 真机

仓库默认 `motionMode: 'sim'`，真机通道结构性不可达；真机路径（`motionMode: 'real'` + 白名单）
本轮同样未在真实控制器上验证。CB3 远程控制模式、RTDE 实际时序、SSH 程序上传等边界与
0.3.9 报告一致，仍是**未覆盖**。

### 5.3 说明项（非缺陷）

- README 正文提及未注册的 `ursim_get_joint_current` —— 门禁明确允许的提示项（该读数已并入 `ursim_get_status`）。
- 面板中 `JOG_SPECS` 与 `SAFETY_TEXT` 在模块加载时读文案表，切换桌面语言后需要重建控件才更新；其余文案通过 `liveStrings()` 即时切换。

## 6. 复现命令

```sh
# 门禁 + 测试（Python 依赖装在 worker 用的解释器里）
npm run check
npm test

# 宿主兼容与模型资产
npm run verify:host
npm run verify:models

# 发布包清单（不实际发布）
npm pack --dry-run
```

本轮实测环境：`PYTHON` 指向 `D:\MyProgram\GitHub\.ursim-build-env\.tmp-venv\Scripts\python.exe`
（Python 3.12.9，numpy 2.5.4 / paramiko 5.1.0），npm 缓存固定在 `D:\MyProgram\GitHub\.ursim-build-env\.tmp-npm-cache`。
