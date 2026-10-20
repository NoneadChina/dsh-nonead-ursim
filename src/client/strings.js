/**
 * 客户端文案表（清单第 15 条：i18n）。
 *
 * ## 为什么是自建而不是用 `@deepseek-ai/dsh-client-locale`
 *
 * 该包**没有安装**，harness 里也不存在同名包；`dsh-community-market` 与
 * `dsh-nonead-client-skin` 里只有一句 `import type {} from '@deepseek-ai/dsh-client-locale/client'`
 * —— 那是**类型增强**，没有任何实际调用可供参照。赌一个看不见的 API 风险太高，所以
 * 这里自建一张表：结构简单、可单测、零依赖。
 *
 * ## 与既有导出的关系
 *
 * `twin-panel.js` 里的 `STATUS_*` 等常量有大量既有测试断言它们。所以那些常量**保持原样**
 * （中文），而**运行时**走本表的 `stringsFor(locale)`。这样双语可用、断言不破。
 *
 * ## 结构约定
 *
 * `zh` 与 `en` 必须是**完全对称**的键集合（有测试钉住），带插值的键写成函数。
 */

/** 中文文案（也是缺省语言）。 */
export const zh = {
  /* ---- 连接状态（STATUS_* 的运行时对应） ---- */
  statusDisconnected: '未连接机器人',
  statusLoading: '已连接 · 正在加载模型…',
  statusConnected: '已连接',
  statusFallbackSuffix: '（无内置模型，使用近似几何体）',
  statusErrorPrefix: '渲染异常：',
  statusLoadFailed: '模型加载失败：',
  statusLoadRetrying: '（正在重试）',
  statusSwitchingModel: (model) => `切换型号 ${model}…`,
  statusNoWebgl: '当前环境不支持 WebGL：已切换为纯数值模式（关节角与 TCP 仍会更新）',
  statusIncomplete: '机器人未返回完整的关节角',
  statusContextLost: '3D 上下文丢失（GPU 重置）—— 收起并重新展开面板可恢复',
  statusSafetyHint: '机器人可能已停止，请检查示教器',

  /* ---- 未连接原因 ---- */
  disconnectNeverConnected: '未连接机器人：还没有成功执行过 ursim_connect',
  disconnectReason: (reason) => `机器人未连接${reason ? `：${reason}` : ''}`,
  disconnectAmbiguous: (candidates) => `检测到多台已连接机器人，请指定机器人 IP${candidates}`,
  disconnectCandidates: (ips) => (Array.isArray(ips) && ips.length > 0 ? `（候选：${ips.join('、')}）` : ''),
  disconnectWorkerDown: (reason) => `UR 控制进程不可用${reason ? `：${reason}` : ''}（可运行 ursim_ping 自检 Python 依赖）`,
  disconnectReadFailed: (reason) => `读取机器人状态失败${reason ? `：${reason}` : ''}`,

  /* ---- 读数前缀 ---- */
  jointsPrefix: '关节角 (°)',
  tcpPrefix: 'TCP(米/轴角弧度)',
  queryFailed: '查询失败',
  detailStatusFailed: (error) => `状态查询失败：${error}`,
  detailSafety: (mode) => `安全 ${mode}`,
  detailRobotMode: (mode) => `模式 ${mode}`,
  detailProgram: (state) => `程序 ${state}`,
  detailSpeed: (value) => `速度 ${value}`,
  detailRunning: '运行中',
  detailTempsPrefix: '温度(°C)',
  detailTemps: (row) => `温度(°C)  ${row}`,
  detailBus: (voltage, current) => `母线 ${voltage} V  ${current} A`,

  /* ---- 关节限位 ---- */
  overLimit: (joints) => `⚠ 超限 ${joints}`,

  /* ---- 机器人模式枚举（与 python 侧字符串一一对应） ---- */
  safetyMode: {
    NORMAL: '正常',
    REDUCED: '缩减模式',
    PROTECTIVE_STOP: '保护性停止',
    SAFEGUARD_STOP: '安全停止',
    EMERGENCY_STOP: '急停',
    SYSTEM_EMERGENCY_STOP: '系统急停',
    ROBOT_EMERGENCY_STOP: '机器人急停',
    RECOVERY: '恢复中',
    VIOLATION: '违反安全限制',
    FAULT: '故障',
    AUTOMATIC_MODE_SAFEGUARD_STOP: '自动模式安全停止',
    SYSTEM_THREE_POSITION_ENABLING_STOP: '三位使能停止',
  },
  robotMode: {
    POWER_OFF: '已下电',
    POWER_ON: '已上电',
    IDLE: '空闲',
    BACKDRIVE: '拖动',
    RUNNING: '运行中',
    BOOTING: '启动中',
    CONFIRM_SAFETY: '待确认安全',
    DISCONNECTED: '未连接',
    NO_CONTROLLER: '无控制器',
  },
  programState: {
    STOPPED: '已停止',
    PLAYING: '运行中',
    PAUSED: '已暂停',
  },

  /* ---- 视角预设（与 VIEW_BUTTONS / VIEW_PRESETS 的 key 对应） ---- */
  viewReset: '重置视角',
  viewIso: '等轴测',
  viewFront: '前视',
  viewSide: '侧视',
  viewTop: '俯视',

  /* ---- HUD 与工具条 ---- */
  identity: (model, ip) => `机器人  ${[model, ip].filter(Boolean).join('  ·  ')}`,
  pendingPrefix: '待审批',
  canvasLabel: '机器人数字仿真 3D 视图；可用方向键切换视角',
  hudLabel: '机器人实时读数',
  layerReach: '可达范围',
  layerBase: '基座系',
  layerForce: '受力',
  layerGhost: '目标姿态',
  screenshot: '截图',
  screenshotLabel: '导出带水印的截图',
  trajectoryClear: '清轨迹',
  trajectoryPause: '暂停轨迹',
  trajectoryResume: '继续记录',
  trajectoryExport: '导出轨迹',

  /* ---- 右侧 dock 入口 ---- */
  dockLabel: 'NoneadURSim',
  dockDescription: '机器人实时仿真视图',
  dockCollapse: '收起',

  /* ---- 离线仿真（0.7.0） ---- */
  simTitle: '离线仿真',
  simToggleOn: '开启仿真',
  simToggleOff: '关闭仿真',
  simUses: '开启后由 AI 直接驱动这里的模型：运动类工具会动这台虚拟机器人，真机不受影响。',
  simModelLabel: '型号',
  simPresetLabel: '起始姿态',
  simSpeedLabel: '起始倍率',
  simPresetZero: '全零位',
  simPresetUpright: '竖直收拢',
  simPresetReach: '侧伸',
  simBadge: '仿真',
  simBadgeTitle: '离线仿真中的虚拟机器人 —— 不是真机读数，不会有真机动作',
  /* ---- 当前模式指示（P0）：仿真中 / 真机模式 / 未连接 ---- */
  modeBadgeIdle: '未连接',
  modeBadgeIdleTitle: '既没有运行仿真，也没有连接机器人 —— 当前没有任何东西会被驱动',
  realModeBadge: (ips) => `真机模式 · 允许 ${ips}`,
  realModeBadgeEmpty: '真机模式 · 白名单为空（全部拒绝）',
  realModeBadgeTitle: '真机模式（motionMode: real）：指令会发往白名单里的真控制器 —— 这不是仿真',
  /* ---- 遥测行（P1）：估算标注 + 补两行读数 ---- */
  detailCurrentsPrefix: '电流(A)',
  detailTcpSpeed: (speed) => `TCP 速度 ${speed} m/s`,
  detailEstimatedSuffix: '（估算）',
  /* ---- 仿真能力清单（P2）---- */
  simCapsSummary: '仿真能做什么 / 不能做什么',
  simCapsBucket: (label, count) => `${label} ${count} 项`,
  simCapsCannot: (count) => `不支持 ${count} 类`,
  simCapsMotion: '运动',
  simCapsRead: '读回',
  simCapsIo: 'I/O 与寄存器',
  simCapsTelemetry: '遥测',
  /* ---- 跨重启恢复仿真（0.1.10，路线图 E2）---- */
  simRestoreFailed: (reason) => `上次的仿真未能恢复：${reason}（可在这里重新开启）`,
  /* ---- 奇异点与可操作度提示（0.1.11，路线图 C1）---- */
  riskOk: '正常',
  riskNear: '⚠ 接近奇异点',
  riskAt: '⚠ 奇异点',
  riskWrist: (deg) => `腕 ${deg}°`,
  riskManip: (value) => `可操作度 ${value}`,
  riskLimit: (joint, deg) => `J${joint} 距限位 ${deg}°`,
  riskTitle: '奇异点判据：第 5 关节角（腕部共线时趋 0）+ 归一化可操作度 |det J|/臂展³ + 离关节限位的余量',
  /* ---- I/O 与寄存器读数（0.1.9）---- */
  ioSummary: 'I/O 与寄存器',
  ioDigitalOut: (bits) => `数字输出  ${bits}`,
  ioDigitalIn: (bits) => `数字输入  ${bits}`,
  ioAnalogIn: (a, b) => `模拟输入  ${a} / ${b} V`,
  ioRegisters: (set, from, values) => `${set} 寄存器 [${from}…]  ${values}`,
  ioReading: '读取中…',
  ioFailed: (error) => `读取失败：${error}`,
  ioSimInputNote: '仿真没有输入信号源：输入恒为 0，寄存器恒为初值。',
  simApplying: '正在切换仿真…',
  simFailed: (reason) => `仿真开关失败：${reason}`,
  simUnsupported: '仿真只实现运动学（运动类工具 + 位姿读回）；其余指令会明确回报「无仿真语义」。',
  // 收起面板会销毁面板（dispose 里停掉这台仿真）：必须在收起**之前**说出来，否则虚拟机器人
  // 突然停了，用户只会以为是自己碰坏了什么。
  simCollapseStops: '收起面板会停止这台仿真。',
  simActiveStatus: (model) => `离线仿真 · ${model}`,
  simWatermark: '离线仿真（非真机）',
  /* ---- 左轨点动控件（feat/twin-control-panel）---- */
  controlsTcpPosition: 'TCP 位置（mm）',
  controlsTcpOrientation: 'TCP 方向（°）',
  controlsHome: '回零',
  controlsHomeTitle: '回零：六关节到 [0°, -90°, 0°, -90°, 0°, 0°]',
  controlsStepMm: '步长 mm',
  controlsStepDeg: '步长 °',
  controlsStepMmOptionTitle: (value) => `步长 ${value} mm`,
  controlsStepDegOptionTitle: (value) => `步长 ${value}°`,
  controlsFrame: '参考系',
  /** 位姿行右侧那一列的标题（附件图用「坐标系」，与「参考系」同义；新面板按附件图排版）。 */
  controlsFrameTitle: '坐标系',
  controlsFrameTool: '工具系',
  controlsFrameBase: '基座系',
  controlsFrameOptionTitle: (name) => `切换到${name}点动`,
  controlsJogPositionTitle: (frame, axis, sign, mm) =>
    `沿${frame} ${axis} 轴${sign > 0 ? '正' : '负'}方向移动 ${mm} mm`,
  controlsJogRotateTitle: (frame, axis, sign, deg) =>
    `绕${frame} ${axis} 轴${sign > 0 ? '正' : '负'}方向旋转 ${deg}°`,
  controlsDisabledDisconnected: '未连接机器人：点动控件不可用',
  controlsDisabledSimOnly: '仅离线仿真可点动：真机请用工具调用（受审批门禁保护）',
  controlsDisabledStale: '数据通道停滞：控件已暂停，恢复后自动解禁',
  controlsCommandFailed: (reason) => `点动失败：${reason}`,
  /* ---- 右轨位姿 / 关节控件（设计 §5）---- */
  controlsToolPosition: 'TCP 位姿',
  controlsToolPositionTitle: 'TCP 位姿：X/Y/Z 单位 mm，RX/RY/RZ 单位 rad；回车或失焦下发一条 pose',
  controlsSummary: (x, y, z) => `TCP: ${x}, ${y}, ${z} m`,
  controlsSummaryTitle: '机器人当前 TCP 位置（米）',
  controlsJoints: '关节',
  controlsJointsTitle: '拖动滑块只在本地预览（不发命令），松手才下发一条 movej；◀ ▶ 每次 1°',
  controlsJointStepTitle: (name, delta) => `${name} 关节${delta > 0 ? '正向' : '负向'}微调 1°`,
  controlsJointBase: '机座',
  controlsJointShoulder: '肩部',
  controlsJointElbow: '肘部',
  controlsJointWrist1: '手腕 1',
  controlsJointWrist2: '手腕 2',
  controlsJointWrist3: '手腕 3',
  controlsJointValue: (deg) => `${deg.toFixed(1)}°`,
  controlsInvalidRollback: '数值无效：已回滚到最新一帧',
  controlsRejectedCommand: '宿主拒绝了这次命令',
  controlsNoPoseData: '尚无位姿数据',
  // 提交被拒（busy）与 stop 发送失败：以前都是静默的，现在必须有一句话（P2）。
  controlsBusyRetry: '上一条命令还在飞行中：这次没有下发，请稍后重试',
  controlsStopFailed: (reason) => `停止指令发送失败：${reason}`,
}

/** 英文文案。键集合必须与 `zh` 完全一致（有测试钉住）。 */
export const en = {
  statusDisconnected: 'Robot not connected',
  statusLoading: 'Connected · loading model…',
  statusConnected: 'Connected',
  statusFallbackSuffix: ' (no built-in model, using approximate geometry)',
  statusErrorPrefix: 'Render error: ',
  statusLoadFailed: 'Model failed to load: ',
  statusLoadRetrying: ' (retrying)',
  statusSwitchingModel: (model) => `switching to ${model}…`,
  statusNoWebgl: 'WebGL is unavailable here: switched to numeric-only mode (joint angles and TCP keep updating)',
  statusIncomplete: 'The robot did not return a full set of joint angles',
  statusContextLost: '3D context lost (GPU reset) — collapse and reopen the panel to recover',
  statusSafetyHint: 'The robot may have stopped; check the teach pendant',

  disconnectNeverConnected: 'Robot not connected: ursim_connect has never succeeded',
  disconnectReason: (reason) => `Robot not connected${reason ? `: ${reason}` : ''}`,
  disconnectAmbiguous: (candidates) => `More than one robot is connected; specify the robot IP${candidates}`,
  disconnectCandidates: (ips) => (Array.isArray(ips) && ips.length > 0 ? ` (candidates: ${ips.join(', ')})` : ''),
  disconnectWorkerDown: (reason) => `The UR control process is unavailable${reason ? `: ${reason}` : ''} (run ursim_ping to check the Python dependencies)`,
  disconnectReadFailed: (reason) => `Failed to read the robot state${reason ? `: ${reason}` : ''}`,

  jointsPrefix: 'Joint angles (°)',
  tcpPrefix: 'TCP (m / axis-angle rad)',
  queryFailed: 'query failed',
  detailStatusFailed: (error) => `Status query failed: ${error}`,
  detailSafety: (mode) => `Safety ${mode}`,
  detailRobotMode: (mode) => `Mode ${mode}`,
  detailProgram: (state) => `Program ${state}`,
  detailSpeed: (value) => `Speed ${value}`,
  detailRunning: 'Running',
  detailTempsPrefix: 'Temp (°C)',
  detailTemps: (row) => `Temp (°C)  ${row}`,
  detailBus: (voltage, current) => `Bus ${voltage} V  ${current} A`,

  overLimit: (joints) => `⚠ over limit ${joints}`,

  safetyMode: {
    NORMAL: 'Normal',
    REDUCED: 'Reduced',
    PROTECTIVE_STOP: 'Protective stop',
    SAFEGUARD_STOP: 'Safeguard stop',
    EMERGENCY_STOP: 'Emergency stop',
    SYSTEM_EMERGENCY_STOP: 'System emergency stop',
    ROBOT_EMERGENCY_STOP: 'Robot emergency stop',
    RECOVERY: 'Recovery',
    VIOLATION: 'Safety violation',
    FAULT: 'Fault',
    AUTOMATIC_MODE_SAFEGUARD_STOP: 'Automatic-mode safeguard stop',
    SYSTEM_THREE_POSITION_ENABLING_STOP: 'Three-position enabling stop',
  },
  robotMode: {
    POWER_OFF: 'Power off',
    POWER_ON: 'Power on',
    IDLE: 'Idle',
    BACKDRIVE: 'Backdrive',
    RUNNING: 'Running',
    BOOTING: 'Booting',
    CONFIRM_SAFETY: 'Confirm safety',
    DISCONNECTED: 'Disconnected',
    NO_CONTROLLER: 'No controller',
  },
  programState: {
    STOPPED: 'Stopped',
    PLAYING: 'Playing',
    PAUSED: 'Paused',
  },

  viewReset: 'Reset view',
  viewIso: 'Isometric',
  viewFront: 'Front',
  viewSide: 'Side',
  viewTop: 'Top',

  identity: (model, ip) => `Robot  ${[model, ip].filter(Boolean).join('  ·  ')}`,
  pendingPrefix: 'Pending approval',
  canvasLabel: 'Robot simulation 3D view; arrow keys switch the view',
  hudLabel: 'Live robot readouts',
  layerReach: 'Reach',
  layerBase: 'Base frame',
  layerForce: 'Force',
  layerGhost: 'Target pose',
  screenshot: 'Screenshot',
  screenshotLabel: 'Export a watermarked screenshot',
  trajectoryClear: 'Clear path',
  trajectoryPause: 'Pause path',
  trajectoryResume: 'Resume path',
  trajectoryExport: 'Export path',

  dockLabel: 'NoneadURSim',
  dockDescription: 'Live robot simulation view',
  dockCollapse: 'Collapse',

  /* ---- Offline simulation (0.7.0) ---- */
  simTitle: 'Offline simulation',
  simToggleOn: 'Start simulation',
  simToggleOff: 'Stop simulation',
  simUses: 'While on, the AI drives the model right here: motion tools move this virtual robot and no real robot is affected.',
  simModelLabel: 'Model',
  simPresetLabel: 'Start pose',
  simSpeedLabel: 'Start speed scaling',
  simPresetZero: 'Zero pose',
  simPresetUpright: 'Upright',
  simPresetReach: 'Reach',
  simBadge: 'SIMULATION',
  simBadgeTitle: 'Virtual robot in offline simulation — not a real robot reading, no real motion',
  /* ---- current-mode indicator (P0): simulated / real mode / idle ---- */
  modeBadgeIdle: 'NOT CONNECTED',
  modeBadgeIdleTitle: 'No simulation is running and no robot is connected — nothing is being driven',
  realModeBadge: (ips) => `REAL MODE · ${ips}`,
  realModeBadgeEmpty: 'REAL MODE · allow-list empty (everything refused)',
  realModeBadgeTitle:
    'Real-robot mode (motionMode: real): commands go to the controllers in the allow-list — this is not a simulation',
  /* ---- telemetry rows (P1): estimation label + two missing readings ---- */
  detailCurrentsPrefix: 'Current (A)',
  detailTcpSpeed: (speed) => `TCP speed ${speed} m/s`,
  detailEstimatedSuffix: ' (estimated)',
  /* ---- simulation capability list (P2) ---- */
  simCapsSummary: 'What the simulation can and cannot do',
  simCapsBucket: (label, count) => `${label}: ${count}`,
  simCapsCannot: (count) => `not simulated: ${count}`,
  simCapsMotion: 'Motion',
  simCapsRead: 'Readback',
  simCapsIo: 'I/O & registers',
  simCapsTelemetry: 'Telemetry',
  /* ---- restoring the simulation across restarts (0.1.10, roadmap E2) ---- */
  simRestoreFailed: (reason) => `The previous simulation could not be restored: ${reason} (switch it on here to retry)`,
  /* ---- singularity and manipulability hints (0.1.11, roadmap C1) ---- */
  riskOk: 'OK',
  riskNear: '⚠ near singularity',
  riskAt: '⚠ at singularity',
  riskWrist: (deg) => `wrist ${deg}°`,
  riskManip: (value) => `manipulability ${value}`,
  riskLimit: (joint, deg) => `J${joint} is ${deg}° from its limit`,
  riskTitle:
    'Singularity criteria: joint 5 angle (goes to 0 when the wrist axes line up) + normalised manipulability |det J|/reach³ + distance to the joint limits',
  /* ---- I/O and register readout (0.1.9) ---- */
  ioSummary: 'I/O & registers',
  ioDigitalOut: (bits) => `Digital out  ${bits}`,
  ioDigitalIn: (bits) => `Digital in   ${bits}`,
  ioAnalogIn: (a, b) => `Analog in    ${a} / ${b} V`,
  ioRegisters: (set, from, values) => `${set} registers [${from}…]  ${values}`,
  ioReading: 'reading…',
  ioFailed: (error) => `read failed: ${error}`,
  ioSimInputNote: 'The simulation has no input source: inputs stay 0 and registers stay at their initial values.',
  simApplying: 'Switching simulation…',
  simFailed: (reason) => `Simulation switch failed: ${reason}`,
  simUnsupported: 'The simulation implements kinematics only (motion tools + pose readback); every other command reports "no simulation semantics".',
  simCollapseStops: 'Collapsing the panel stops this simulation.',
  simActiveStatus: (model) => `Offline simulation · ${model}`,
  simWatermark: 'Offline simulation (not a real robot)',
  /* ---- left-rail jog controls (feat/twin-control-panel) ---- */
  controlsTcpPosition: 'TCP position (mm)',
  controlsTcpOrientation: 'TCP orientation (°)',
  controlsHome: 'Home',
  controlsHomeTitle: 'Home: all six joints to [0°, -90°, 0°, -90°, 0°, 0°]',
  controlsStepMm: 'Step mm',
  controlsStepDeg: 'Step °',
  controlsStepMmOptionTitle: (value) => `Step ${value} mm`,
  controlsStepDegOptionTitle: (value) => `Step ${value}°`,
  controlsFrame: 'Frame',
  controlsFrameTitle: 'Frame',
  controlsFrameTool: 'Tool',
  controlsFrameBase: 'Base',
  controlsFrameOptionTitle: (name) => `Jog in the ${name} frame`,
  controlsJogPositionTitle: (frame, axis, sign, mm) =>
    `Move ${mm} mm along the ${frame} ${axis} axis (${sign > 0 ? 'positive' : 'negative'} direction)`,
  controlsJogRotateTitle: (frame, axis, sign, deg) =>
    `Rotate ${deg}° about the ${frame} ${axis} axis (${sign > 0 ? 'positive' : 'negative'} direction)`,
  controlsDisabledDisconnected: 'Robot not connected: jog controls are unavailable',
  controlsDisabledSimOnly:
    'Jogging works in the offline simulation only: use the tools for a real robot (guarded by approval)',
  controlsDisabledStale: 'The data feed stalled: controls are paused and re-enable automatically',
  controlsCommandFailed: (reason) => `Jog failed: ${reason}`,
  /* ---- right-rail pose / joint controls (design §5) ---- */
  controlsToolPosition: 'TCP pose',
  controlsToolPositionTitle: 'TCP pose: X/Y/Z in mm, RX/RY/RZ in rad; press Enter or blur to send one pose command',
  controlsSummary: (x, y, z) => `TCP: ${x}, ${y}, ${z} m`,
  controlsSummaryTitle: 'Current TCP position (m)',
  controlsJoints: 'Joints',
  controlsJointsTitle: 'Dragging a slider previews locally only (no command); release sends one movej; ◀ ▶ step by 1°',
  controlsJointStepTitle: (name, delta) => `${name} joint: ${delta > 0 ? '+1°' : '−1°'}`,
  controlsJointBase: 'Base',
  controlsJointShoulder: 'Shoulder',
  controlsJointElbow: 'Elbow',
  controlsJointWrist1: 'Wrist 1',
  controlsJointWrist2: 'Wrist 2',
  controlsJointWrist3: 'Wrist 3',
  controlsJointValue: (deg) => `${deg.toFixed(1)}°`,
  controlsInvalidRollback: 'Invalid value: rolled back to the latest frame',
  controlsRejectedCommand: 'The host rejected this command',
  controlsNoPoseData: 'No pose data yet',
  controlsBusyRetry: 'The previous command is still in flight: nothing was sent, please retry',
  controlsStopFailed: (reason) => `Failed to send the stop command: ${reason}`,
}

/** 支持的语言。 */
export const SUPPORTED_LOCALES = Object.freeze(['zh', 'en'])

/** 缺省语言（拿不到任何线索时用中文 —— 产品的主用户群）。 */
export const DEFAULT_LOCALE = 'zh'

/**
 * 把一个 BCP-47 语言标签规整成受支持的语言。
 *
 * 只认主语言子标签（`zh-CN` → `zh`、`en-US` → `en`）；繁体（`zh-TW`/`zh-Hant`）也先归到
 * `zh` —— 有繁体词条时再细化，但**绝不能因为认不出就退回英文**（那对中文用户是退化）。
 *
 * @param {string} tag 例如 `navigator.language`
 * @returns {'zh'|'en'} 受支持的语言
 */
export function resolveLocale(tag) {
  if (typeof tag !== 'string' || tag.trim() === '') return DEFAULT_LOCALE
  const primary = tag.trim().toLowerCase().split(/[-_]/u)[0]
  return SUPPORTED_LOCALES.includes(primary) ? primary : DEFAULT_LOCALE
}

/**
 * 取某个语言的文案表；语言不可识别时回退缺省语言。
 *
 * @param {string} locale
 * @returns {typeof zh}
 */
export function stringsFor(locale) {
  return resolveLocale(locale) === 'en' ? en : zh
}

/**
 * 按运行环境的语言线索取文案表。
 *
 * @param {object} [env] 注入点（测试用）；缺省读 `globalThis.navigator`
 * @returns {typeof zh}
 */
export function activeStrings(env) {
  const navigatorLike = env ?? globalThis.navigator
  return stringsFor(navigatorLike?.language)
}
