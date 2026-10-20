/**
 * src/client/styles.js — 数字仿真面板的样式（**JS 字符串**，不是 .css 文件）。
 *
 * ## Ruling 28（为什么要用字符串注入）
 * 客户端产物只有单个 `client.js`，shell **不会**加载同目录的任何 `.css`。
 * esbuild 默认把 `import './x.css'` 输出成**独立文件**（`client.css`），shell 不加载它
 * ⇒ 样式静默全丢（不报错、不失败，只是没样式）。既定做法（本机已装插件
 * `@linxin666/dsh-client-ui-task-board`、`dsh-dream-skin`）是
 * `document.createElement('style')` + `textContent = <CSS 字符串>` 注入。
 * ⇒ 本模块导出 CSS 字符串与幂等的 `injectStyles()`，**不要**新增 `.css` 文件。
 *
 * ## 幂等
 * `injectStyles()` 以固定 id 复用已存在的 `<style>`：多次挂载（大视图反复开关、
 * 缩略图 + 大视图并存）只注入一份样式，也不会互相覆盖。样式是**共享**资源，
 * 故面板 `dispose()` **不**移除它（另一个实例可能还在用，而且移除后无法再复用）。
 *
 * ## 主题（浅色 / 深色 / 跟随系统）
 * 面板配色**不再写死**，取值分两级（见 `.ursim-twin-panel` 的变量块）：
 *   ① 宿主 DSH 注入的 `--dsw-alias-*` 设计 token —— 有它就用它。宿主的 token 本身就随
 *      `body[data-ds-dark-theme]` 翻转，所以面板自动跟随设置里的主题，也自动跟随任何通过
 *      `ctx.theme` 覆盖别名的第三方主题；
 *   ② 宿主 token 缺失时（独立预览页、单测的假 DOM）退回本地成对值：默认浅色，
 *      `body[data-ds-dark-theme]` 存在时换深色。该属性是宿主主题的**唯一布尔信号**，
 *      与 `theme.js` / `scene.js` 用的是同一个（WebGL 网格线的颜色由那边负责）。
 * 因此新增/修改颜色**一律走 `--ursim-*` 变量**，不要在规则里写死色值。
 */

/** 注入用的 `<style>` 元素 id（幂等复用的键）。 */
export const TWIN_STYLE_ID = 'dsh-ursim-twin-styles'

/** `<style>` 上的标记属性（便于宿主/测试识别来源）。 */
export const TWIN_STYLE_ATTR = 'data-dsh-ursim-twin-style'

/** 面板样式表（单一真源；改样式只改这里）。 */
export const TWIN_CSS = `
.ursim-twin-panel {
  /* ── 主题层 ──────────────────────────────────────────────────────────────
     左值 = 宿主 token（随主题自动翻转）；右值 = 本地回退（独立页面/假 DOM）。
     下面 body[data-ds-dark-theme] 那条只改**回退值**：宿主 token 存在时两处都解析成
     同一个宿主值，所以深色块不会与宿主主题打架。 */
  --ursim-canvas-inner: var(--dsw-alias-bg-layer-1, #fbfcfe);
  --ursim-canvas-outer: var(--dsw-alias-bg-base, #e9edf2);
  --ursim-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --ursim-chrome: var(--dsw-alias-bg-layer-1, #ffffff);
  --ursim-input-bg: var(--dsw-alias-bg-base, #ffffff);
  --ursim-text: var(--dsw-alias-label-primary, #1f2328);
  --ursim-text-secondary: var(--dsw-alias-label-secondary, #59636e);
  --ursim-text-tertiary: var(--dsw-alias-label-tertiary, #818b98);
  --ursim-border-subtle: var(--dsw-alias-border-l1, #e6eaef);
  --ursim-border: var(--dsw-alias-border-l2, #d1d9e0);
  --ursim-hover-bg: var(--dsw-alias-interactive-bg-hover, #eef1f4);
  --ursim-accent: var(--dsw-alias-state-business-primary, #0969da);
  --ursim-ok: var(--dsw-alias-state-success-primary, #1a7f37);
  --ursim-warn: var(--dsw-alias-state-warn-primary, #9a6700);
  --ursim-danger: var(--dsw-alias-state-error-primary, #cf222e);
  /* 下面这一组宿主没有对应 token：用本地成对值，深色块里换掉。
     强调色/紫色底上的文字也必须跟着换 —— 浅色主题的强调色深、要白字；
     深色主题的强调色浅、要深字。 */
  --ursim-accent-ink: #ffffff;
  --ursim-pending: #bc4c00;
  --ursim-sim: #8250df;
  --ursim-sim-ink: #ffffff;

  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  /* 容器查询的锚点（见文件末尾的 @container）：面板宽度取决于宿主右栏，而不是 viewport，
     所以"窄了就降列宽"必须按**面板自身**的宽度判断。 */
  container-type: inline-size;
  background: radial-gradient(circle at 50% 25%, var(--ursim-canvas-inner) 0%, var(--ursim-canvas-outer) 72%);
  color: var(--ursim-text);
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace;
}
body[data-ds-dark-theme] .ursim-twin-panel {
  --ursim-canvas-inner: var(--dsw-alias-bg-layer-1, #161b22);
  --ursim-canvas-outer: var(--dsw-alias-bg-base, #0b0f14);
  --ursim-surface: var(--dsw-alias-bg-layer-1, #161b22);
  --ursim-chrome: var(--dsw-alias-bg-layer-1, #0d1117);
  --ursim-input-bg: var(--dsw-alias-bg-base, #0d1117);
  --ursim-text: var(--dsw-alias-label-primary, #c9d1d9);
  --ursim-text-secondary: var(--dsw-alias-label-secondary, #8b949e);
  --ursim-text-tertiary: var(--dsw-alias-label-tertiary, #6e7681);
  --ursim-border-subtle: var(--dsw-alias-border-l1, #21262d);
  --ursim-border: var(--dsw-alias-border-l2, #30363d);
  --ursim-hover-bg: var(--dsw-alias-interactive-bg-hover, #21262d);
  --ursim-accent: var(--dsw-alias-state-business-primary, #58a6ff);
  --ursim-ok: var(--dsw-alias-state-success-primary, #3fb950);
  --ursim-warn: var(--dsw-alias-state-warn-primary, #d29922);
  --ursim-danger: var(--dsw-alias-state-error-primary, #f85149);
  --ursim-accent-ink: #0d1117;
  --ursim-pending: #ffa657;
  --ursim-sim: #a371f7;
  --ursim-sim-ink: #0d1117;
}
.ursim-twin-view {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}
/* ── 两栏骨架与可收起控制轨（feat/twin-control-panel；2026-10-20 合并为单轨）────
   这里是控制轨静态样式的**唯一真源**（以前写在 JS 的 inline 上）。运行期只剩一个动态量：
   stage.style.gridTemplateColumns —— 它的唯一拼法是 twin-controls.js 的 stageColumns()，
   因为列宽取决于控制轨是否收起。收起态本身落在 data-collapsed 属性上，正文显隐由下面的
   CSS 决定，不靠 JS 改 style.display。
   ⚠️ 不要在这里写死列宽：.ursim-twin-stage 的 grid 模板由面板按状态写入 inline。 */
.ursim-twin-stage {
  display: grid;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.ursim-twin-rail {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  min-width: 0;
  box-sizing: border-box;
  /* 半透明 chrome：与工具栏/HUD 同一套质感。 */
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
/* 控制轨贴在画布右侧：用 data-* 取值而不是再传一个 class（属性仍是 side 语义，
   将来若要恢复一条左侧轨，加一条 [data-ursim-twin-rail='left'] 规则即可）。 */
.ursim-twin-rail[data-ursim-twin-rail='right'] { border-left: 1px solid var(--ursim-border-subtle); }
.ursim-twin-rail-toggle {
  flex: 0 0 auto;
  height: 24px;
  padding: 0;
  /* font: inherit 会重置 font-size/line-height，所以这两条必须写在它后面。 */
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
  cursor: pointer;
}
.ursim-twin-rail-body {
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  padding: 6px 6px 8px;
}
/* 收起后正文必须彻底让位（不能只靠 overflow 藏：那样仍能滚出内容），把手保留。 */
.ursim-twin-rail[data-collapsed='true'] .ursim-twin-rail-body { display: none; }
/*
 * 视角工具栏。以前面板里唯一的控件是一个画布 —— OrbitControls 允许把相机推进机械臂内部或
 * 推到看不见的地方，而"重置"只能靠收起面板再展开。这排按钮补上那个缺口。
 */
.ursim-twin-toolbar {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ursim-border-subtle);
  /* 半透明 chrome：3D 画面从下面透出来一点，与宿主的浮层质感一致。 */
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
.ursim-twin-toolbar-button {
  flex: 0 0 auto;
  padding: 2px 8px;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  background: var(--ursim-surface);
  color: var(--ursim-text);
  font: inherit;
  cursor: pointer;
}
.ursim-twin-toolbar-button:hover { border-color: var(--ursim-accent); color: var(--ursim-accent); }
.ursim-twin-toolbar-button:active { background: var(--ursim-hover-bg); }
.ursim-twin-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}
/*
 * 键盘焦点必须可见（P2）：以前全文只有上面那条 outline:none，Tab 走一圈完全看不出焦点落在
 * 哪个按钮/输入框上 —— 而这里每个按钮都会真下发命令。只在 :focus-visible 时画环：鼠标点击
 * 不出现，键盘导航必出现。画布用负 offset，否则环会被 .ursim-twin-panel 的 overflow 裁掉。
 */
.ursim-twin-canvas:focus-visible {
  outline: 2px solid var(--ursim-accent);
  outline-offset: -2px;
}
.ursim-twin-toolbar-button:focus-visible,
.ursim-twin-rail-toggle:focus-visible,
.ursim-twin-layer-toggle:focus-visible,
.ursim-twin-sim-toggle:focus-visible,
.ursim-twin-sim select:focus-visible,
.ursim-twin-io-summary:focus-visible,
.ursim-twin-sim-caps-summary:focus-visible,
.ursim-twin-ctl-button:focus-visible,
.ursim-twin-ctl-seg-button:focus-visible,
.ursim-twin-ctl-step:focus-visible,
.ursim-twin-ctl-pose-input:focus-visible,
.ursim-twin-ctl-joint-range:focus-visible {
  outline: 2px solid var(--ursim-accent);
  outline-offset: 2px;
}
.ursim-twin-hud {
  flex: 0 0 auto;
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-top: 1px solid var(--ursim-border-subtle);
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
.ursim-twin-hud-row {
  overflow: hidden;
  white-space: pre;
  text-overflow: ellipsis;
  color: var(--ursim-text-secondary);
}
.ursim-twin-status {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-top: 1px solid var(--ursim-border-subtle);
  color: var(--ursim-text-secondary);
}
.ursim-twin-error {
  flex: 0 0 auto;
  padding: 0 10px 6px;
  color: var(--ursim-danger);
  white-space: pre-wrap;
}
.ursim-twin-panel[data-ursim-twin-connected='true'] .ursim-twin-status { color: var(--ursim-ok); }
/* 安全状态异常时压过上面那条绿色：同等特异性，靠**写在后面**取胜，不要上移这两条。 */
.ursim-twin-panel[data-ursim-twin-hazard='true'] .ursim-twin-status { color: var(--ursim-danger); }
.ursim-twin-hud-row[data-ursim-twin-hazard='true'] { color: var(--ursim-danger); }
/* 关节超出 kinematics.json 的限位：和"安全异常"用同一个警示色，但只染那一行。 */
.ursim-twin-hud-row[data-ursim-twin-overlimit='true'] { color: var(--ursim-danger); }
/* 待审批的运动目标：与幽灵臂的"待审批"橙色一致，让 HUD 文字与 3D 里的假臂对得上。
   空的时候（没有审批）这一行不染色，也就看不出占位。 */
.ursim-twin-hud-row[data-ursim-twin-pending]:not(:empty) { color: var(--ursim-pending); }
/* 工程辅助图层的开关（清单第 9 条）：克制的小按钮，激活态用实心强调色，一眼看出哪些图层开着。 */
.ursim-twin-layer-toggle {
  margin-right: 6px;
  padding: 1px 6px;
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
}
.ursim-twin-layer-toggle[aria-pressed='true'] {
  color: var(--ursim-accent-ink);
  background: var(--ursim-accent);
  border-color: var(--ursim-accent);
}
/* 身份行（机型 + IP）比读数更重要，给它正常前景色而不是注释灰。
   身份文字是这一行自己的文本节点，**数据通道健康度作为第二个 flex 项跟在它后面、同一行显示**
   （用户要求：停滞提示要排在"机器人 <型号> · <IP>"后面、两者同一行）。两者都不换行、超长各自省略。 */
.ursim-twin-hud-row[data-ursim-twin-identity] {
  display: flex;
  gap: 8px;
  align-items: baseline;
  color: var(--ursim-text);
}
/* flex 项默认可收缩，但要 min-width: 0 才会真的省略，而不是把整行撑破。 */
.ursim-twin-hud-row[data-ursim-twin-identity] > [data-ursim-twin-feed] { min-width: 0; }
/* 数据通道健康度（0.6.6）：停滞/重连必须一眼可见 —— 画面停住时用户要能分清
   "机器人停了"与"数据停了"，所以这一行用警示色（黄=停滞/重连中，红=通道不可用）。 */
.ursim-twin-hud-row[data-ursim-twin-feed-state='stale'] { color: var(--ursim-warn); }
.ursim-twin-hud-row[data-ursim-twin-feed-state='retrying'] { color: var(--ursim-warn); }
/* ── 离线仿真（0.7.0）─────────────────────────────────────────────────────
   仿真态必须**一眼可见**：角标压在最上面、开关与选择项单独一行、状态色改用紫色系
   （与"已连接"的绿、"异常"的红/黄都不同），免得任何人把虚拟机器人当成真机。 */
.ursim-twin-sim {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--ursim-border);
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-sim-toggle {
  padding: 2px 8px;
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
}
.ursim-twin-sim-toggle[aria-pressed='true'] {
  color: var(--ursim-sim-ink);
  background: var(--ursim-sim);
  border-color: var(--ursim-sim);
}
.ursim-twin-sim-toggle:disabled { opacity: 0.55; cursor: progress; }
.ursim-twin-sim select {
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text);
  background: var(--ursim-input-bg);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  padding: 1px 4px;
}
.ursim-twin-sim select:disabled { opacity: 0.55; }
.ursim-twin-sim-note { flex: 1 1 100%; color: var(--ursim-text-tertiary); }
.ursim-twin-sim-error { flex: 1 1 100%; color: var(--ursim-danger); }
/* 角标：盖在 3D 视图左上角，跟着画布一起缩放不留缝。 */
.ursim-twin-sim-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ursim-sim-ink);
  background: var(--ursim-sim);
  border-radius: 4px;
  pointer-events: none;
}
.ursim-twin-panel[data-ursim-twin-sim='true'] .ursim-twin-view { outline: 1px solid var(--ursim-sim); outline-offset: -1px; }
.ursim-twin-panel[data-ursim-twin-sim='true'] .ursim-twin-status { color: var(--ursim-sim); }
/* 模式角标的三态（P0）：仿真中沿用上面的紫色；**真机模式红色且常显**（这是操作员最该一眼看到的
   事 —— 从前真机模式下什么标识都没有，而"没有角标"读起来就是"安全"）；未连接走中性灰。 */
.ursim-twin-sim-badge[data-ursim-twin-mode='real'] {
  color: #ffffff;
  background: var(--ursim-danger);
}
.ursim-twin-sim-badge[data-ursim-twin-mode='idle'] {
  color: var(--ursim-text-secondary);
  background: var(--ursim-hover-bg);
  border: 1px solid var(--ursim-border-subtle);
}
/* 仿真能力清单（P2）：折叠态只有一行摘要。 */
.ursim-twin-sim-caps {
  flex: 1 1 100%;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-sim-caps-summary { cursor: pointer; }
.ursim-twin-sim-caps-body { margin: 2px 0 0 12px; line-height: 1.5; }
/* 奇异点提示行（0.1.11，C1）：near 走警告色、at 走危险色，与「⚠ 超限」同一套语义。 */
.ursim-twin-hud-row[data-ursim-twin-risk='near'] { color: var(--ursim-warn); }
.ursim-twin-hud-row[data-ursim-twin-risk='at'] { color: var(--ursim-danger); font-weight: 600; }
/* I/O 与寄存器读数（0.1.9）：等宽 + 保留换行，位串才对齐。 */
.ursim-twin-io {
  flex: 1 1 100%;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-io-summary { cursor: pointer; }
.ursim-twin-io-body {
  margin: 2px 0 0 12px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
}
/* ── 控制轨（2026-10-20 合并为单条右轨，轨宽 700px）─────────────────────────
   布局按用户给的参照图自上而下：
     只读读数行 → TCP 位姿六格（X/Y/Z 一行、RX/RY/RZ 一行）+ 右侧「坐标系」竖排两档
     → 两块方向盘（TCP 位置 / TCP 方向）+ 右侧两档步长竖排 → 六行关节（◀ 滑块 ▶ 角度）。
   主区是两列 grid：左列（位姿 + 方向盘）自适应，右列固定 172px（坐标系 + 步长），
   对应参照图右侧那条竖带 —— 坐标系与步长必须落在同一列，否则两者左右会错开。
   状态只走属性：按钮可用性交给 disabled、档位交给 aria-pressed、整块状态交给
   data-ursim-ctl-state —— 这里没有任何 inline 样式，运行期也不写 style.*。 */
.ursim-twin-rail-body[data-ursim-twin-rail-body='right'] {
  padding: 8px 10px;
}
.ursim-twin-ctl-note {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ursim-warn);
}
.ursim-twin-ctl-note:empty { display: none; }
.ursim-twin-ctl-error {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ursim-danger);
  white-space: pre-wrap;
}
.ursim-twin-ctl-error:empty { display: none; }
/* 顶部只读读数（TCP 米制三元组）：等宽数字，放不下就省略，不换行。 */
.ursim-twin-ctl-summary {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ursim-text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ursim-twin-ctl-summary:empty { display: none; }
/* 主区两列：左 = 位姿 + 方向盘，右 = 坐标系 + 步长。 */
.ursim-twin-ctl-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 172px;
  gap: 10px;
  align-items: start;
  margin: 0 0 8px;
}
.ursim-twin-ctl-primary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.ursim-twin-ctl-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.ursim-twin-ctl-section { margin: 0; min-width: 0; }
.ursim-twin-ctl-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
/* 点动行：位置盘 | 方向盘（与参照图一致，两块盘并排）。 */
.ursim-twin-ctl-jog {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.ursim-twin-ctl-pad {
  display: grid;
  /* 3 × 64 + 2 × 6 = 204：两盘并排 2 × 204 + 10 = 418 ≤ 左列可用宽度（700 − 1 边框 −
     20 内边距 − 172 右列 − 10 列间距 ≈ 497）。 */
  grid-template-columns: repeat(3, 64px);
  grid-template-rows: repeat(3, 64px);
  gap: 6px;
  justify-content: start;
}
.ursim-twin-ctl-cell { display: block; }
.ursim-twin-ctl-button {
  width: 64px;
  height: 64px;
  padding: 0;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 6px;
  cursor: pointer;
  /* 触屏上不要 300 ms 双击缩放延迟：点动要求"按下即动"。 */
  touch-action: manipulation;
}
.ursim-twin-ctl-button:hover:not(:disabled) {
  border-color: var(--ursim-accent);
  color: var(--ursim-accent);
}
.ursim-twin-ctl-button:active:not(:disabled) { background: var(--ursim-hover-bg); }
.ursim-twin-ctl-button:disabled { opacity: 0.45; cursor: not-allowed; }
/* busy（命令在途）不落 disabled —— 被禁用的按钮收不到 pointerup，会把长按掐断。
   这里只用 aria-disabled 把"这一拍不会发出去"表达出来，按钮仍可接收指针事件。 */
.ursim-twin-ctl-button[aria-disabled='true'] { opacity: 0.55; cursor: progress; }
/* Z / RZ 行：两枚按钮各占半条盘宽，高度比圆盘钮矮。 */
.ursim-twin-ctl-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.ursim-twin-ctl-row .ursim-twin-ctl-button {
  flex: 1 1 0;
  width: auto;
  height: 38px;
}
/* 分段控件：横向（步长在右侧列时改为竖排，见下面 .ursim-twin-ctl-stepcol）。 */
.ursim-twin-ctl-seg {
  display: flex;
  height: 30px;
  margin: 0;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  overflow: hidden;
}
.ursim-twin-ctl-seg-button {
  flex: 1 1 0;
  min-width: 0;
  height: 30px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text-secondary);
  background: var(--ursim-surface);
  border: 0;
  border-right: 1px solid var(--ursim-border-subtle);
  cursor: pointer;
}
.ursim-twin-ctl-seg-button:last-child { border-right: 0; border-bottom: 0; }
.ursim-twin-ctl-seg-button[aria-pressed='true'] {
  color: var(--ursim-accent-ink);
  background: var(--ursim-accent);
}
.ursim-twin-ctl-seg-button:disabled { opacity: 0.45; cursor: not-allowed; }
/* 坐标系：竖排两档（工具系 / 基座系）。 */
.ursim-twin-ctl-frame { min-width: 0; }
.ursim-twin-ctl-frame .ursim-twin-ctl-seg {
  flex-direction: column;
  height: auto;
}
.ursim-twin-ctl-frame .ursim-twin-ctl-seg-button {
  flex: 0 0 34px;
  height: 34px;
  border-right: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
}
/* 步长：两列（mm / °），每列内部竖排三档。 */
.ursim-twin-ctl-steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}
.ursim-twin-ctl-stepcol { min-width: 0; }
.ursim-twin-ctl-stepcol .ursim-twin-ctl-seg {
  flex-direction: column;
  height: auto;
}
.ursim-twin-ctl-stepcol .ursim-twin-ctl-seg-button {
  flex: 0 0 28px;
  height: 28px;
  border-right: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
}
/* TCP 位姿六格：3 列 × 2 行（X/Y/Z mm，RX/RY/RZ rad）。 */
.ursim-twin-ctl-pose {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 8px;
  margin: 0;
}
.ursim-twin-ctl-pose-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  min-width: 0;
}
.ursim-twin-ctl-pose-label {
  flex: 0 0 26px;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-ctl-pose-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  padding: 0 6px;
  font: inherit;
  font-size: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
}
.ursim-twin-ctl-pose-input:disabled { opacity: 0.45; cursor: not-allowed; }
/* 关节：名称 56 + ◀ 32 + 滑块 + ▶ 32 + 角度 64，行高 34。 */
.ursim-twin-ctl-joint-row {
  display: grid;
  grid-template-columns: 56px 32px minmax(0, 1fr) 32px 64px;
  align-items: center;
  /* 间隙 10px：◀ / ▶ 每枚都真下发 1°，贴太近时误触一次机械臂就动。 */
  gap: 10px;
  height: 34px;
}
.ursim-twin-ctl-joint-name {
  font-size: 11px;
  color: var(--ursim-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ursim-twin-ctl-step {
  /* 命中区 32×32：这是"每点一次真下发 1°"的按钮，再小在触屏/触控板上容易点偏。 */
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
  touch-action: manipulation;
}
.ursim-twin-ctl-step:hover:not(:disabled) {
  border-color: var(--ursim-accent);
  color: var(--ursim-accent);
}
.ursim-twin-ctl-step:disabled { opacity: 0.45; cursor: not-allowed; }
.ursim-twin-ctl-joint-range {
  width: 100%;
  min-width: 0;
}
.ursim-twin-ctl-joint-range:disabled { opacity: 0.45; }
.ursim-twin-ctl-joint-value {
  font-size: 12px;
  text-align: right;
  color: var(--ursim-text-secondary);
  font-variant-numeric: tabular-nums;
}
/* 失败标红：统一由 data-ursim-invalid 驱动，下一帧成功自动消失。 */
.ursim-twin-ctl-pose-input[data-ursim-invalid='true'],
.ursim-twin-ctl-joint-range[data-ursim-invalid='true'] {
  border-color: var(--ursim-danger);
  color: var(--ursim-danger);
}
.ursim-twin-ctl-joint-range[data-ursim-invalid='true'] {
  outline: 1px solid var(--ursim-danger);
  outline-offset: 1px;
}
.ursim-twin-ctl-joint-value[data-ursim-invalid='true'] { color: var(--ursim-danger); }
/*
 * 长按点动的"速度流"模式（P2）。
 *
 * data-ursim-jog-mode 由 twin-controls.js 在长按 250 ms 后从 step 切到 velocity —— 那是唯一
 * 说明"现在不是一步一动，而是在持续往下发速度"的信号。以前只写属性、没有任何样式：手指按着
 * 的时候界面毫无变化，用户无从判断松手会不会立刻停。这里给点动板描边 + 按钮变色，让"正在连续
 * 运动"在余光里也看得见（松手即回 step，描边随之消失）。
 */
[data-ursim-jog-mode='velocity'] .ursim-twin-ctl-pad {
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--ursim-warn);
}
[data-ursim-jog-mode='velocity'] .ursim-twin-ctl-button {
  border-color: var(--ursim-warn);
}
/*
 * 窄面板（P2 容错）。
 *
 * 单条轨固定 700px、中间 3D 列最少 280px，因此面板宽度不足 ≈ 980px 时整条轨会掉出可视区。
 * 这里不改列宽（inline 的 grid-template-columns 由 stageColumns() 拼出，测试按它断言，
 * 塞进样式会让"列宽"出现两个真源），而是允许横向滚动：控件还在，只是要划一下。
 */
@container (max-width: 999px) {
  .ursim-twin-stage { overflow-x: auto; }
}
`.trim()

/**
 * 幂等地把面板样式注入文档头部。
 *
 * @param {Document} [doc=globalThis.document] 目标文档（注入点，Node 无 DOM 时传假对象）
 * @returns {Element|null} 已存在或新建的 `<style>` 元素；无可用 DOM 时返回 `null`（不抛错）
 */
export function injectStyles(doc = globalThis.document) {
  if (!doc || typeof doc.createElement !== 'function') return null

  const existing = typeof doc.getElementById === 'function' ? doc.getElementById(TWIN_STYLE_ID) : null
  if (existing) return existing

  const style = doc.createElement('style')
  style.id = TWIN_STYLE_ID
  if (typeof style.setAttribute === 'function') style.setAttribute(TWIN_STYLE_ATTR, '')
  style.textContent = TWIN_CSS

  const host = doc.head ?? doc.documentElement ?? doc.body ?? null
  host?.appendChild?.(style)
  return style
}
