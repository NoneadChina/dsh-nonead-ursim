/**
 * dsh-nonead-ursim — 89 个工具的**声明面**（单一真源）。
 *
 * © 2026 拓德科技 / Suzhou Nonead Robot Technology Co., Ltd. — https://www.nonead.com
 *
 * 这个模块只有**数据与纯函数**：参数 DSL 助手 + `tools` 声明数组。它们以前长在 `lib/index.js` 里，
 * 让那个文件同时承担"注册与运行时策略"和"963 行工具表"两件事 —— 于是新增一个工具要在同一文件
 * 里翻上千米，而门禁只能靠正则去猜。现在声明面在这里，运行时面在 `lib/index.js`。
 *
 * ⚠️ 改动本文件**必须**先读 `docs/tool-schemas.golden.json` 的契约：
 *   `test/tool-schema-dsl.test.mjs` 会逐字节比对每个工具的名称/描述/参数 schema。
 *   有意的契约变更用 `URSIM_WRITE_GOLDEN=1 node --test test/tool-schema-dsl.test.mjs`
 *   重新生成快照，并把差异写进 CHANGELOG。
 */

import z from '@deepseek-ai/schemastery';

export function textOutput(extra = {}) {
  return {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: value }],
    ...extra,
  };
}

/**
 * 数组参数。第三个实参决定它在 schema 里是否**必填**：它曾经被硬编码成 `true`，于是任何
 * "文档说可选、Python 也有默认值"的数组参数（`force_mode.task_frame` / `wrench` / `limits`、
 * `set_payload_inertia.inertia`）都变成了**必填** —— 模型不给就被拒掉，而 Python 侧那些默认值
 * 永远走不到（`set_payload_inertia` 文档里写的"不给 inertia 就退回
 * `set_payload_mass`+`set_payload_cog`"因此完全不可达）。
 *
 * ⚠️ `required: false` **不是**这个 DSL 表达"可选"的方式：属性上只要出现 `required` 就必须为
 * `true`（`dsh-tools` 的 schema 编译器报 `required must be true when present`），写成 `false`
 * 会让**该工具整个注册失败**、只在日志留一行 warning，工具从模型视野里静默消失。
 * 可选 = **省略** `required`，所以这里只在必须为 true 时才写上它。
 */
export function numberArray(items = { type: 'number' }, description = '', required = true) {
  return { type: 'array', items, ...(required ? { required: true } : {}), ...(description ? { description } : {}) };
}

/**
 * 所有工具的 `ip` 参数：**可选**，但它的**描述必须随运行模式变化**（P1 #4）。
 *
 * 工具描述是模型看到的**唯一契约**。它以前写死"本插件不连真机"：在默认的 `sim` 模式下
 * 这是对的（省略即 `127.0.0.1`，传别的地址被 worker 以 `SIM_BADARG` 拒绝）；但在 `real`
 * 模式（`motionMode: 'real'` + `realRobotIps` 白名单）下，Python 的 `_pin_sim_ip()` 对**缺 ip**
 * 直接回 `BADARG`，模型照旧描述省略 ip ⇒ 每条指令都失败，甚至直接回答"本插件不连真机"。
 *
 * 现在由 `buildTools(config)` 按 `config.motionMode` 分两段生成：
 *   - `sim`：措辞保持原样（仅点明"sim 模式下"），省略即保留回环地址；
 *   - `real`：**必须显式给出目标 IP**，且必须在 `realRobotIps` 白名单内，缺 ip 会被拒绝。
 *
 * ⚠️ 只改 description，类型与必填性一个字不动：`ip` 在两种模式下仍然**省略 `required`**
 * （显式 `required: false` 会让整个工具静默注册失败，见上面的 DSL 说明）。
 */
const IP_DESCRIPTION_SIM =
  '仿真机器人地址，可省略（默认且唯一合法值为保留回环地址 127.0.0.1；sim 模式下本插件不连真机）';
const IP_DESCRIPTION_REAL =
  '机器人地址，**必须显式给出**目标 IP（real 模式下缺 ip 会被拒绝），且目标必须在配置的 ' +
  '`realRobotIps` 白名单内；保留回环地址 127.0.0.1 在 real 模式下仍表示离线仿真。';

/** 按运行模式返回 `ip` 参数的描述（`realMode` 为真即 `motionMode: 'real'`）。 */
export function ipDescription(realMode) {
  return realMode ? IP_DESCRIPTION_REAL : IP_DESCRIPTION_SIM;
}

/** `ip` 参数声明。默认按 `sim` 模式生成；`buildTools()` 会按配置显式传模式。 */
export const IP = (realMode = false) => ({ type: 'string', description: ipDescription(realMode) });
/**
 * 离线仿真工具的可选目标地址。
 *
 * ⚠️ **不能**写成 `required: true`：值 schema DSL 里"可选"就是**省略 required**，而写
 * `required: false` 会让整个工具静默注册失败（见上面的 DSL 说明）。缺省即保留回环地址。
 */
export const OPTIONAL_SIM_IP = () => ({ type: 'string', description: '仿真地址（固定为保留回环地址 127.0.0.1），可省略' });
export const AXIS_MOTION_DISTANCE = () => ({ type: 'number', required: true, description: '沿该轴移动的距离（米），正负号表示方向' });
export const MOVE_PARAMS = () => ({
  // ⚠️ DSH 1.5.3 起，「值 schema DSL」只接受这些关键字：
  //   description / title / default / examples / type / oneOf / properties /
  //   additionalProperties / items / enum / const / required
  // `minimum` / `maximum` / `exclusiveMinimum` 等约束关键字**不再被接受**：一旦使用，
  // 该工具会**整个注册失败**，只在日志留一行 warning，工具从模型视野里静默消失。
  // ⇒ 数值范围一律写进 description（模型据此判断），真正的强制校验在
  //   python/ur_worker.py（`_nonneg_float` / `_bounded_int` / `_bounded_float`），那里才是权威。
  a: { type: 'number', description: '加速度，必须 >0；不指定时按官方手册的 movej=1.4 / movel=1.2 取默认' },
  v: { type: 'number', description: '速度，必须 >0；不指定时按官方手册的 movej=1.05 rad/s / movel=0.25 m/s 取默认' },
  t: { type: 'number', description: '移动时长（秒），≥0，默认 0；t>0 时**优先于 a/v**（手册明确：给了 t 就忽略 a/v）' },
  r: { type: 'number', description: '交融半径（米），≥0，默认 0；>0 时机械臂不在该点停住而直接圆滑过渡' },
});

/** 全部 ursim_* 工具的声明（op / toolName / description / parameters / timeoutMs）。 */
/**
 * 构造全部工具声明。
 *
 * ⚠️ 为什么是**工厂**而不是常量：声明里的 `timeoutMs` 取自配置（`config.commandTimeoutMs` /
 * `config.connectTimeoutMs`）。它以前能直接读到，只因为整个数组长在 `apply()` 里、靠闭包拿到
 * 形参；搬成独立模块后必须显式传进来 —— 这是这次搬运里**唯一**不是纯搬家的改动。
 *
 * @param {{commandTimeoutMs?: number, connectTimeoutMs?: number, motionMode?: string}} config 插件配置
 * @returns {Array<object>} 89 个工具声明
 */
export function buildTools(config = {}) {
  /**
   * 运行模式（P1 #4）：声明面里的 `ip` / `ursim_connect` / `ursim_disconnect` 描述必须随模式
   * 变化 —— 工具描述是模型**唯一**的契约，real 部署里写"本插件不连真机"会直接误导模型。
   *
   * 归一化与 `lib/index.js` 的 `motionMode` 一致：只有显式 `'real'` 才是真机模式，其余
   * （缺省 / 未知字符串）一律按 `sim`（默认最安全）。
   */
  const realMode = config?.motionMode === 'real';
  /**
   * ⚠️ 这里刻意**遮蔽**模块级的 `IP`：下面 89 个工具全部写 `IP()`，由这个局部绑定统一注入
   * 当前模式的描述 —— 调用点一个都不用改，也不可能有哪个漏掉模式。
   */
  const IP = () => ({ type: 'string', description: ipDescription(realMode) });
  /** `ursim_connect`：sim 模式是"确保离线仿真在跑"，real 模式是"建立真机会话"。 */
  const connectDescription = realMode
    ? '确保**目标真机**已连接：按显式给出的 `ip` 建立**真机会话**并返回它的当前状态' +
      '（real 模式下缺 ip 会被拒绝，白名单 `realRobotIps` 之外的地址会在派发前被拒绝）。' +
      '`ursim_disconnect` 释放该会话；保留回环地址 127.0.0.1 仍表示离线仿真。'
    : '确保**离线仿真**机器人就绪：仿真没开就按默认型号 UR12e（全零位、速度倍率 100%）自动开一台，' +
      '并返回它的当前状态。sim 模式下本插件不连真机，任何控制动作前都**不需要**先连真机；' +
      '`ip` 可省略（唯一合法值是保留回环地址 127.0.0.1）。';
  /** `ursim_disconnect`：sim 模式是"停掉虚拟机器人"，real 模式是"释放真机会话"。 */
  const disconnectDescription = realMode
    ? '释放**真机会话**（幂等）：断开显式给出的 `ip` 对应的机器人连接，释放它的 RTDE / Dashboard 会话。' +
      'real 模式下缺 ip 会被拒绝；保留回环地址 127.0.0.1 仍表示停止离线仿真。'
    : '停止并释放**离线仿真**机器人（幂等）。sim 模式下本插件没有真机，' +
      '"断开"的对应动作就是把这台虚拟机器人收掉；`ip` 可省略。';
  return [
    {
      op: 'connect',
      toolName: 'ursim_connect',
      description: connectDescription,
      parameters: { ip: IP() },
      timeoutMs: config.connectTimeoutMs,
    },
    {
      op: 'disconnect',
      toolName: 'ursim_disconnect',
      description: disconnectDescription,
      parameters: { ip: IP() },
    },
    {
      op: 'status',
      toolName: 'ursim_get_status',
      description:
        '一次性读取指定机器人当前的关键状态：TCP 位置、关节角度、型号、序列号、软件版本、安全模式、运行状态、程序状态、电压、电流、关节温度与开机时长。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_tcp_pose',
      toolName: 'ursim_get_tcp_pose',
      description: '读取指定机器人的当前 TCP（末端）位置，6 维向量 [x,y,z,rx,ry,rz]。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_joint_pose',
      toolName: 'ursim_get_joint_pose',
      description: '读取指定机器人的当前六个关节角度（弧度）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_robot_model',
      toolName: 'ursim_get_robot_model',
      description: '读取指定机器人的型号，并附带是否处于远程控制模式（remote_control 字段）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_serial_number',
      toolName: 'ursim_get_serial_number',
      description: '读取指定机器人的序列号。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_time',
      toolName: 'ursim_get_uptime',
      description: '读取指定机器人的开机时长（秒）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_software_version',
      toolName: 'ursim_get_software_version',
      description: '读取指定机器人的 Polyscope 软件版本。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_safety_mode',
      toolName: 'ursim_get_safety_mode',
      description: '读取指定机器人的安全模式。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_safety_status',
      toolName: 'ursim_get_safety_status',
      description:
        '读取安全/机器人**状态位**与安全模式：能指出是哪一类安全功能被触发（protective stop / safeguard / ' +
        'violation / fault / stopped_due_to_safety ...），是运动撞到安全限值后定位原因的首选工具。' +
        '⚠️ 限值**数值**（力/力矩/功率/动量/速度等上限）不经 RTDE/dashboard 暴露，插件读不到——' +
        '需在 PolyScope 的「设置 → 安全 → 安全限值」页对照（本工具会一并说明这一点）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_robot_mode',
      toolName: 'ursim_get_robot_mode',
      description: '读取指定机器人的运行状态（robotmode）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_program_state',
      toolName: 'ursim_get_program_state',
      description: '读取指定机器人当前加载的程序及其执行状态。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_robot_voltage',
      toolName: 'ursim_get_robot_voltage',
      description: '读取指定机器人的主电压（伏特）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_robot_current',
      toolName: 'ursim_get_robot_current',
      description: '读取指定机器人的主电流（安培）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_joint_temperatures',
      toolName: 'ursim_get_joint_temperatures',
      description: '读取指定机器人六个关节的温度（摄氏度）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_int_register',
      toolName: 'ursim_get_int_register',
      description: '读取指定机器人 Int 寄存器（下标 0-23）的值。',
      parameters: {
        ip: IP(),
        index: { type: 'integer', required: true, description: '寄存器下标，范围 [0,23]' },
      },
    },
    {
      op: 'get_double_register',
      toolName: 'ursim_get_double_register',
      description: '读取指定机器人 Double 寄存器（下标 0-23）的值。',
      parameters: {
        ip: IP(),
        index: { type: 'integer', required: true, description: '寄存器下标，范围 [0,23]' },
      },
    },
    {
      op: 'get_bit_register',
      toolName: 'ursim_get_bit_register',
      description: '读取指定机器人 Bool 寄存器（下标 0-63）的位。',
      parameters: {
        ip: IP(),
        index: { type: 'integer', required: true, description: '寄存器下标，范围 [0,63]' },
      },
    },
    {
      op: 'list_programs',
      toolName: 'ursim_list_programs',
      description: '通过 SSH 读取机器人的 .urp 程序列表。优先扫描 /programs（真机默认）；若不存在则自动探测 ~/URSim_Linux-*/programs.*/*.urp（URSim）；也可用 programs_dir 覆盖。**必须显式提供 password**：本插件不再内置默认口令，且未知主机密钥会被直接拒绝。',
      parameters: {
        ip: IP(),
        username: { type: 'string', description: 'SSH 用户名，默认 root' },
        password: { type: 'string', description: 'SSH 密码，**必填**（不再有默认值）' },
        programs_dir: { type: 'string', description: '覆盖要扫描 .urp 的目录（可选）' },
      },
    },
    {
      op: 'send_script',
      toolName: 'ursim_send_script',
      description:
        '向指定机器人发送一段 URScript 脚本并执行（用于自定义动作、I/O、逻辑等）。' +
        '⚠️ 本工具会**校验执行结果**：在「真正会被执行的那段代码」前后各注入一行哨兵写寄存器并回读——' +
        '脚本含 `def … end` 时注入到**函数体内部**（第一句/最后一句，绝不拼到顶层，否则会把脚本变成' +
        '「函数体不跑、顶层照跑」并报出假阳性）；纯语句脚本才用顶层注入。结论分三种：' +
        '「已执行完毕」/「已开始执行但未在预算内结束」/「连起始哨兵都没观察到（控制器很可能根本没执行，' +
        '最常见原因是未处于远程控制模式：本地/示教器模式下 URScript 会被静默丢弃）」。' +
        '**不要仅凭「已发送」就认为动作生效**。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        script: { type: 'string', required: true, description: 'URScript 脚本内容' },
        verify: {
          type: 'boolean',
          default: true,
          description:
            '是否做执行校验（默认 true）。传 false 时只发送不校验，返回的 verified 为 null——' +
            '那表示"未确认"，不等于成功；脚本本身是阻塞/长动作时可用它跳过',
        },
        register: {
          type: 'integer',
          description:
            '用哪个 int 输出寄存器做哨兵（0-23，默认 23）。注意该寄存器的旧值会被覆盖，' +
            '脚本运行期间也不要把它当自己的数据寄存器用',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'movej',
      toolName: 'ursim_movej',
      description:
        '让指定机器人的每个关节都转到指定弧度（关节空间运动）。q 为 6 个弧度。⚠️ 会驱动机械臂运动，请确保机器人可见且无人员/障碍物。',
      parameters: {
        ip: IP(),
        q: numberArray({ type: 'number' }, '六个关节目标角度（弧度）：[q0,q1,q2,q3,q4,q5]'),
        ...MOVE_PARAMS(),
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'movel',
      toolName: 'ursim_movel',
      description:
        '让指定机器人的 TCP 直线移动到目标位置（笛卡尔空间直线运动）。pose 为 6 维 [x,y,z,rx,ry,rz]。⚠️ 会驱动机械臂运动，请确保机器人可见且无人员/障碍物。',
      parameters: {
        ip: IP(),
        pose: numberArray({ type: 'number' }, '目标 TCP 位置：[x,y,z,rx,ry,rz]'),
        ...MOVE_PARAMS(),
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_x',
      toolName: 'ursim_move_x',
      description: '让指定机器人的 TCP 沿基座 X 轴移动指定距离（直线）。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_y',
      toolName: 'ursim_move_y',
      description: '让指定机器人的 TCP 沿基座 Y 轴移动指定距离（直线）。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_z',
      toolName: 'ursim_move_z',
      description: '让指定机器人的 TCP 沿基座 Z 轴移动指定距离（直线）。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_tool_x',
      toolName: 'ursim_move_tool_x',
      description:
        '让指定机器人的 TCP 沿**工具坐标系** X 轴移动指定距离（直线）。与 ursim_move_x 的区别：那个是基座方向，这个是当前工具朝向的方向——工具斜着的时候两者完全不同。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_tool_y',
      toolName: 'ursim_move_tool_y',
      description:
        '让指定机器人的 TCP 沿**工具坐标系** Y 轴移动指定距离（直线）。与 ursim_move_y 的区别：那个是基座方向，这个是当前工具朝向的方向。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_tool_z',
      toolName: 'ursim_move_tool_z',
      description:
        '让指定机器人的 TCP 沿**工具坐标系** Z 轴移动指定距离（直线，工具 Z 正向通常是从法兰指向工具末端）。与 ursim_move_z 的区别：那个是基座方向，这个是当前工具朝向的方向。⚠️ 会驱动机械臂运动。',
      parameters: { ip: IP(), distance: AXIS_MOTION_DISTANCE() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'draw_circle',
      toolName: 'ursim_draw_circle',
      description:
        '让指定机器人以给定圆心与半径画一个圆。coordinate 为 "z"（竖直平面，与基座垂直）或其它（水平平面）。' +
        '可选 v/a 决定运动速度（**不传时与从前完全一致**：a=1、v=0.25），`t` 只有仿真建模' +
        '（真机路径按逐段 a/v 走，t 被忽略且回包里会说明）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        center: numberArray({ type: 'number' }, '圆心 TCP 位置：[x,y,z,rx,ry,rz]'),
        r: { type: 'number', required: true, description: '半径（米，必须 >0）' },
        coordinate: { type: 'string', description: '平面："z" 或其它，默认 "z"' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25（与加这个参数之前写死的值相同）' },
        a: { type: 'number', description: '加速度，必须 >0，默认 1.0（与加这个参数之前写死的值相同）' },
        t: {
          type: 'number',
          description:
            '整条轨迹的时长（秒），≥0，默认 0 = 用 a/v。**只有仿真建模**；真机路径按逐段 a/v 走，t 被忽略且回包里会说明',
        },
        register: {
          type: 'integer',
          description:
            '用哪个 int 输出寄存器做「脚本是否被执行」的哨兵（0-23，默认 23）。该寄存器旧值会被覆盖；' +
            '控制器未执行该脚本时会立刻报 NOT_EXECUTED，而不是干等到超时',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'draw_square',
      toolName: 'ursim_draw_square',
      description:
        '让指定机器人以给定起点与边长画一个正方形。' +
        '可选 v/a 决定运动速度（**不传时与从前完全一致**：a=1、v=0.25），`t` 只有仿真建模' +
        '（真机路径按逐段 a/v 走，t 被忽略且回包里会说明）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        origin: numberArray({ type: 'number' }, '起点 TCP 位置：[x,y,z,rx,ry,rz]'),
        border: { type: 'number', required: true, description: '边长（米，必须 >0）' },
        coordinate: { type: 'string', description: '平面："z" 或其它，默认 "z"' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25（与加这个参数之前写死的值相同）' },
        a: { type: 'number', description: '加速度，必须 >0，默认 1.0（与加这个参数之前写死的值相同）' },
        t: {
          type: 'number',
          description:
            '整条轨迹的时长（秒），≥0，默认 0 = 用 a/v。**只有仿真建模**；真机路径按逐段 a/v 走，t 被忽略且回包里会说明',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'draw_rectangle',
      toolName: 'ursim_draw_rectangle',
      description:
        '让指定机器人以给定起点、宽和高画一个长方形。' +
        '可选 v/a 决定运动速度（**不传时与从前完全一致**：a=1、v=0.25），`t` 只有仿真建模' +
        '（真机路径按逐段 a/v 走，t 被忽略且回包里会说明）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        origin: numberArray({ type: 'number' }, '起点 TCP 位置：[x,y,z,rx,ry,rz]'),
        width: { type: 'number', required: true, description: '长（米，必须 >0）' },
        height: { type: 'number', required: true, description: '宽（米，必须 >0）' },
        coordinate: { type: 'string', description: '平面："z" 或其它，默认 "z"' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25（与加这个参数之前写死的值相同）' },
        a: { type: 'number', description: '加速度，必须 >0，默认 1.0（与加这个参数之前写死的值相同）' },
        t: {
          type: 'number',
          description:
            '整条轨迹的时长（秒），≥0，默认 0 = 用 a/v。**只有仿真建模**；真机路径按逐段 a/v 走，t 被忽略且回包里会说明',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'draw_star',
      toolName: 'ursim_draw_star',
      description:
        '让指定机器人以给定中心与边长画一个五角星（pentagram）。center 为其中心位姿；side 为每条边长度（米）。' +
        '可选 v/a 决定运动速度（**不传时与从前完全一致**：a=1、v=0.25），`t` 只有仿真建模' +
        '（真机路径按逐段 a/v 走，t 被忽略且回包里会说明）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        center: numberArray({ type: 'number' }, '中心 TCP 位置：[x,y,z,rx,ry,rz]'),
        side: { type: 'number', required: true, description: '边长（米，必须 >0）' },
        coordinate: { type: 'string', description: '平面："z"（竖直 y-z）或其它（水平 x-y）；默认水平' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25（与加这个参数之前写死的值相同）' },
        a: { type: 'number', description: '加速度，必须 >0，默认 1.0（与加这个参数之前写死的值相同）' },
        t: {
          type: 'number',
          description:
            '整条轨迹的时长（秒），≥0，默认 0 = 用 a/v。**只有仿真建模**；真机路径按逐段 a/v 走，t 被忽略且回包里会说明',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'load_program',
      toolName: 'ursim_load_program',
      description: '加载指定机器人的一个 UR 程序（.urp）。加载后需再用 run 启动。program_name 可传文件名或完整/URSim 路径，可用 programs_dir 拼接。',
      parameters: {
        ip: IP(),
        program_name: { type: 'string', required: true, description: '程序名（.urp）或完整/相对路径（如 URSim 路径）' },
        programs_dir: { type: 'string', description: '程序目录（可选）；program_name 为纯文件名时用其拼接为路径' },
      },
    },
    {
      op: 'run_program',
      toolName: 'ursim_run_program',
      description: '运行指定机器人当前加载的程序；若提供 program_name 则先加载再运行。program_name 可传文件名或完整/URSim 路径，可用 programs_dir 拼接。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        program_name: { type: 'string', description: '可选：程序名（.urp）或路径；不传则运行当前加载的程序' },
        programs_dir: { type: 'string', description: '程序目录（可选）；program_name 为纯文件名时用其拼接为路径' },
      },
    },
    {
      op: 'stop_program',
      toolName: 'ursim_stop_program',
      description: '停止指定机器人当前运行的程序。',
      parameters: { ip: IP() },
    },
    {
      op: 'pause_program',
      toolName: 'ursim_pause_program',
      description: '暂停指定机器人当前运行的程序。',
      parameters: { ip: IP() },
    },
    {
      op: 'reset_error',
      toolName: 'ursim_reset_error',
      description: '复位指定机器人的错误并释放刹车（若需要则先上电）。⚠️ 复位后机械臂可能保持当前姿态，操作前确认安全。',
      parameters: { ip: IP() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'ping',
      toolName: 'ursim_ping',
      description: '健康检查：确认 UR 控制 worker 进程存活、Python 依赖与 vendored URBasic 就绪（无需连接机器人）。',
      parameters: {},
    },
    {
      op: 'get_digital_in',
      toolName: 'ursim_get_digital_in',
      description: '读取指定机器人某路数字输入。which 为 std(默认)/config/tool。注意：tool 端数字输入不经 RTDE，通过 URScript 读取（会发送一段短程序到机器人，可能打断正在运行的程序）。',
      parameters: {
        ip: IP(),
        which: { type: 'string', description: '输入类型：std(默认)/config/tool' },
        n: { type: 'integer', required: true, description: '端口号：std 0-7、config 8-15、tool 0-1' },
      },
    },
    {
      op: 'set_digital_out',
      toolName: 'ursim_set_digital_out',
      description: '设置指定机器人某路数字输出为高/低。⚠️ 会触发机器人 I/O。',
      parameters: {
        ip: IP(),
        which: { type: 'string', description: '输出类型：std(默认)/config/tool' },
        n: { type: 'integer', required: true, description: '端口号：std 0-7、config 8-15、tool 0-1' },
        value: { type: 'boolean', required: true, description: 'true 高电平 / false 低电平' },
      },
    },
    {
      op: 'get_analog_in',
      toolName: 'ursim_get_analog_in',
      description: '读取指定机器人的标准模拟输入值。',
      parameters: {
        ip: IP(),
        n: { type: 'integer', required: true, description: '端口号（0 或 1）' },
      },
    },
    {
      op: 'set_analog_out',
      toolName: 'ursim_set_analog_out',
      description:
        '设置指定机器人的标准模拟输出值，**按工程单位**（默认伏特）收值：URScript 的 `set_analog_out(n, f)` 收的是相对电平 [0,1]，' +
        '本工具按 `full_scale` 换算后下发，并把换算前后的值与回读值都返回，便于核对。' +
        '⚠️ 端口是**电压域**时 `full_scale=10`（默认），是**电流域**时必须显式给 `full_scale=20`，否则 10 以上的工程值会被拒绝。',
      parameters: {
        ip: IP(),
        n: { type: 'integer', required: true, description: '端口号（0 或 1）' },
        value: { type: 'number', required: true, description: '输出值（工程单位：伏特 0-10，或电流域 0-20）' },
        full_scale: {
          type: 'number',
          description: '满量程：电压域 10（默认），电流域 20 —— 决定 value 如何换算成 URScript 的相对电平',
        },
      },
    },
    {
      op: 'set_tool_voltage',
      toolName: 'ursim_set_tool_voltage',
      description: '设置指定机器人的工具电压（0V / 12V / 24V）。',
      parameters: {
        ip: IP(),
        voltage: { type: 'integer', required: true, description: '工具电压：0/12/24' },
      },
    },
    {
      op: 'set_tcp',
      toolName: 'ursim_set_tcp',
      description: '设置指定机器人的 TCP（工具中心点），6 维位姿 [x,y,z,rx,ry,rz]。',
      parameters: {
        ip: IP(),
        pose: numberArray({ type: 'number' }, 'TCP 位姿：[x,y,z,rx,ry,rz]'),
      },
    },
    {
      op: 'set_payload',
      toolName: 'ursim_set_payload',
      description: '设置指定机器人的负载质量（kg）与重心（cog，3 维）。',
      parameters: {
        ip: IP(),
        mass: { type: 'number', required: true, description: '负载质量（kg）' },
        cog: { type: 'array', items: { type: 'number' }, description: '重心 [x,y,z]，默认 [0,0,0]' },
      },
    },
    {
      op: 'movep',
      toolName: 'ursim_movep',
      description: '让指定机器人沿路径移动到目标位姿（带交融）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        pose: numberArray({ type: 'number' }, '目标 TCP 位姿：[x,y,z,rx,ry,rz]'),
        a: { type: 'number', description: '加速度，必须 >0，默认 1.2' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25' },
        r: { type: 'number', description: '交融半径，≥0，默认 0' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'movec',
      toolName: 'ursim_movec',
      description: '让指定机器人做圆弧运动（经 via 点到达 to 点）。⚠️ 会驱动机械臂运动。mode=0（默认）沿途插补姿态，mode=1 姿态相对圆弧切线保持不变（固定姿态圆弧）。',
      parameters: {
        ip: IP(),
        pose_via: numberArray({ type: 'number' }, '途经点 TCP 位姿：[x,y,z,rx,ry,rz]（手册：只用到位置）'),
        pose_to: numberArray({ type: 'number' }, '目标 TCP 位姿：[x,y,z,rx,ry,rz]'),
        a: { type: 'number', description: '加速度，必须 >0，默认 1.2' },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25' },
        r: { type: 'number', description: '交融半径，≥0，默认 0' },
        mode: { type: 'integer', description: '0 插补姿态（默认）/ 1 固定姿态（相对圆弧切线）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    /*
     * 多段连续运动（0.2.2）。存在的理由是**段间不停顿**：仿真侧把每段转成关节航点后拼成
     * **一条**折线，只调用一次 `ur_sim.VirtualRobot._plan`（"整条折线共用一条时间剖面"），
     * 所以 20 段也只是一次加速—一次减速；逐段调用 movej/movel 会是 20 次起停。
     *
     * ⚠️ 真机路径与仿真路径**不等价**，工具描述里逐条写明了：真机发的是一串
     * movej/movel（每段各带 a/v，按 r 过渡），整段时长 t 在真机上没有对应物。
     */
    {
      op: 'run_sequence',
      toolName: 'ursim_run_sequence',
      description:
        '**一条命令跑完整段多段轨迹**：按顺序走完 segments 里的每一段，段与段之间**不停顿**。' +
        '每段是一个对象，只有两种形态：`{"type":"joint","q":[q0,q1,q2,q3,q4,q5]}`（关节空间，弧度，按最短路径）' +
        '或 `{"type":"cartesian","pose":[x,y,z,rx,ry,rz]}`（从上一点直线过去；米 / 旋转向量弧度，' +
        '按 1 cm 细分并逐点求逆解）。序列本体（必填）示例：' +
        '[{"type":"joint","q":[0,-1.5708,1.5708,-1.5708,-1.5708,0]},' +
        '{"type":"cartesian","pose":[0.3,0,0.4,0,3.1416,0]}]。' +
        '★ 仿真路径把**所有段拼成一条折线、只规划一次**，整条轨迹共用一条时间剖面 —— 所以段间不会各自起停；' +
        '`t>0` 时整段时长就是 t。' +
        '⚠️ 真机路径发出去的是一串 `movej`/`movel`（每段各带 a/v），控制器在每个途经点按 `r` 过渡：' +
        '`r=0`（默认）时是**逐段起停**，并且**整段时长 `t` 在真机上不建模**（回包里会明说已忽略）。' +
        '⚠️ 任一段的任一细分点逆解不出来就**整条序列失败**（仿真不会跳过那一段继续走）。' +
        '⚠️ 会驱动机械臂运动，请确保机器人可见且无人员/障碍物。',
      parameters: {
        ip: IP(),
        segments: {
          type: 'array',
          required: true,
          description:
            '要按顺序连续走过的段（至少一段，必填）。每段是 `{"type":"joint","q":[6 个弧度]}` 或 ' +
            '`{"type":"cartesian","pose":[x,y,z,rx,ry,rz]}`；type 只有这两个取值，不认别名。',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: {
                type: 'string',
                required: true,
                description: '"joint"（关节段，读 q）或 "cartesian"（直线段，读 pose）',
              },
              q: numberArray({ type: 'number' }, 'joint 段的六个关节目标角（弧度）', false),
              pose: numberArray({ type: 'number' },
                'cartesian 段的目标 TCP 位姿 [x,y,z,rx,ry,rz]（米 / 旋转向量弧度）', false),
            },
          },
        },
        v: { type: 'number', description: '速度，必须 >0，默认 0.25（movel 的手册默认值；关节段也用这一对）' },
        a: { type: 'number', description: '加速度，必须 >0，默认 1.2（movel 的手册默认值；关节段也用这一对）' },
        t: {
          type: 'number',
          description:
            '整段时长（秒），≥0，默认 0 = 用 a/v。**只有仿真建模**（整条折线共用一条时间剖面）；' +
            '真机路径按逐段 a/v 走，t 被忽略且回包里会说明',
        },
        r: {
          type: 'number',
          description:
            '交融半径（米），≥0，默认 0。**只有真机生效**（每段途经点的圆滑过渡；0 = 逐段起停）；' +
            '仿真按精确途经点走，不建模 r',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'servoj',
      toolName: 'ursim_servoj',
      description: '向指定机器人下发一个 servoj 连续流关节目标（在线控制单步，需在循环里持续下发以平滑跟踪）。⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        q: numberArray({ type: 'number' }, '六个目标关节角（弧度）'),
        t: { type: 'number', description: '控制时长（秒），≥0，默认 0.008' },
        lookahead_time: { type: 'number', description: '前瞻时间，范围 0.03-0.2，默认 0.1' },
        gain: { type: 'integer', description: '比例增益，范围 100-2000，默认 100' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    // 面板控制轨（0.2.5）：绕轴**增量**旋转 TCP。几何与仿真共用 `_jog_rotate_target`，
    // 所以"同一句话"在真机与仿真里算出的是同一个目标位姿。
    {
      op: 'jog_rotate',
      toolName: 'ursim_jog_rotate',
      description:
        '绕指定轴**增量**旋转 TCP：`axis` 只认 rx / ry / rz；`frame="tool"`（默认）绕**工具自身**轴、' +
        '`frame="base"` 绕**基座**轴（rx/ry/rz ↔ 基座 x/y/z）。`delta_rad` 为非零有限弧度。' +
        '真机与仿真**共用同一份几何**（同一套旋转合成 ⇒ 同一个目标位姿），TCP 位置保持不变。' +
        '⚠️ 会驱动机械臂运动。',
      parameters: {
        ip: IP(),
        axis: {
          type: 'string',
          enum: ['rx', 'ry', 'rz'],
          required: true,
          description: '旋转轴：rx / ry / rz（不是 x/y/z —— 那三个在别的工具里表示平移）',
        },
        delta_rad: {
          type: 'number',
          required: true,
          description: '增量旋转角（弧度），必须是非零有限数值；正负号按右手定则决定方向',
        },
        frame: {
          type: 'string',
          enum: ['tool', 'base'],
          default: 'tool',
          description: '参考系：tool（默认，绕工具自身轴）/ base（绕基座轴，rx/ry/rz ↔ 基座 x/y/z）',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'get_digital_input_bits',
      toolName: 'ursim_get_digital_in_bits',
      description: '批量读取指定机器人的数字输入位（std 0-7 + config 8-15）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_digital_output_bits',
      toolName: 'ursim_get_digital_out_bits',
      description: '批量读取指定机器人的数字输出位（std 0-7 + config 8-15）。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_conveyor',
      toolName: 'ursim_get_conveyor',
      description:
        '读取指定机器人的传送带 tick 计数。' +
        '工具数字输入不经 RTDE，这里的 tick 也只能靠控制器执行一段 URScript 取回，所以本工具会' +
        '**自证那段脚本真的被执行过**：先在 int 哨兵寄存器上写一个记号，再让脚本把 tick 写进 ' +
        'double 寄存器，并在首尾各写一个哨兵。三种结局分开报 —— 完整执行（给 tick 值）、' +
        '执行到一半（不给值）、压根没执行（不给值并说明原因）。' +
        '之所以必须如此：脚本被控制器**在加载期拒收**时一行都不会执行，也不会置"程序执行错误"' +
        '标志，旧实现于是照样回读寄存器，把从没被写过的值当成 tick 报出去（历史上它长期静默返回 0）。' +
        '⚠️ 该 int 与 double 寄存器的旧值会被覆盖。',
      parameters: {
        ip: IP(),
        register: { type: 'integer', description: '哨兵用的 int 输出寄存器编号（0-23），默认 20' },
        payload_register: { type: 'integer', description: '写 tick 用的 double 输出寄存器编号（0-23），默认 0' },
      },
    },
    {
      op: 'set_conveyor_tick',
      toolName: 'ursim_set_conveyor_tick',
      description: '设置指定机器人的传送带 tick 计数（及可选编码器分辨率）。',
      parameters: {
        ip: IP(),
        tick_count: { type: 'integer', required: true, description: '目标 tick 数' },
        absolute_encoder_resolution: { type: 'integer', description: '绝对编码器分辨率，默认 0' },
      },
    },
    // ── 0.5.0 新增能力 ─────────────────────────────────────────────────────
    // 控制模式 / 电源 / 安全。全部在 APPROVAL_OPS 里：它们都能让机械臂脱离程序的
    // 控制、或失去刚性支撑（见该集合的注释）。
    {
      op: 'set_freedrive',
      toolName: 'ursim_set_freedrive',
      description:
        '开启/关闭**自由驱动（freedrive）**：开启后可**用手直接拖动机械臂**（重力被补偿，拖起来有"漂浮"感）。' +
        '⚠️ 会接管控制模式：开启期间运动指令不会执行；请确认机械臂周围无人、无夹伤风险，' +
        '退出方式是在示教器/面板上停止程序（或调用本工具 enable=false）。',
      parameters: {
        ip: IP(),
        enabled: { type: 'boolean', default: true, description: 'true 开启（默认），false 结束并恢复正常位置控制' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'set_teach_mode',
      toolName: 'ursim_set_teach_mode',
      description:
        '开启/关闭**示教模式（teach）**：与 freedrive 类似，用于手动示教路径点。⚠️ 同样会接管控制模式；enable=false 结束。',
      parameters: {
        ip: IP(),
        enabled: { type: 'boolean', default: true, description: 'true 开启（默认），false 结束' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'power_on',
      toolName: 'ursim_power_on',
      description: '给指定机器人上电（使能电机/抱闸）。⚠️ 上电后机械臂立即具备刚性，请确认当前姿态与周围环境安全。',
      parameters: { ip: IP() },
    },
    {
      op: 'power_off',
      toolName: 'ursim_power_off',
      description: '给指定机器人下电。⚠️ 下电后机械臂**失去刚性支撑**，可能因重力下落——务必先托住或确认姿态安全。',
      parameters: { ip: IP() },
    },
    {
      op: 'brake_release',
      toolName: 'ursim_brake_release',
      description: '释放指定机器人的刹车。⚠️ 释放后机械臂**可能在重力作用下掉落**：请先托住机械臂，并确认下方无人、无障碍物。',
      parameters: { ip: IP() },
    },
    {
      op: 'unlock_protective_stop',
      toolName: 'ursim_unlock_protective_stop',
      description:
        '只解除指定机器人的**保护性停止**（并关闭安全弹窗），**不做上电、不释放刹车**。' +
        '与 ursim_reset_error 的区别：那个会顺带上电 + 释放刹车（可能让机械臂动起来），这个只清安全状态。' +
        '解除后会重新读取安全状态位并一并返回，便于确认结果。',
      parameters: { ip: IP() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'shutdown',
      toolName: 'ursim_shutdown',
      description: '关闭指定机器人的控制器（相当于在面板上关机）。⚠️ 关闭后需人工到现场重新上电，请勿在程序运行中调用。',
      parameters: { ip: IP() },
    },
    // 实时遥测（字段本来就在 RTDE 数据流里，读取零代价）
    {
      op: 'get_runtime_telemetry',
      toolName: 'ursim_get_runtime_telemetry',
      description:
        '一次读取指定机器人的**实时遥测**：关节电流/电压/角速度、TCP 线速度与受力/力矩、工具加速度计、速度倍率、' +
        '整机电压电流、关节温度。这些量本来就在 500 Hz 的 RTDE 数据流里、读取零代价且不需要改配置；' +
        '适合判断"是不是撞了/卡了"（电流与力矩同时飙升）或"是不是被速度倍率限住了"。',
      parameters: { ip: IP() },
    },
    {
      op: 'get_speed_scaling',
      toolName: 'ursim_get_speed_scaling',
      description: '读取指定机器人当前的速度倍率（0-1）。程序"看起来在跑但很慢"时，先看它是否被面板上的速度滑块压住了。',
      parameters: { ip: IP() },
    },
    // 面板控制轨（0.2.5）：原地改速度倍率。仿真侧**不重建**实例（位姿与关节角不变）；
    // 真机侧发 `set_speed_slider`，回读的是控制器**实测**值，静止时读 0 属正常。
    {
      op: 'set_speed_scaling',
      toolName: 'ursim_set_speed_scaling',
      description:
        '设置速度倍率（1%–100%，即 0.01–1.0；越界会被**钳到**该区间，客户端原始值仍会随回包返回）。' +
        '仿真侧**原地修改运行中的实例、不重建**（位姿与关节角保持不变，新倍率从下一段运动开始生效）；' +
        '真机侧发 URScript `set_speed_slider` 并读回控制器**实测**值 —— 机器人静止时实测读 0 属正常，' +
        '**不是**「未生效」的证据。⚠️ 影响此后所有运动的速度。',
      parameters: {
        ip: IP(),
        fraction: {
          type: 'number',
          required: true,
          description: '速度倍率 0.01–1.0（1%–100%）；越界会被钳到该区间，NaN/Infinity 与非数值会被拒绝',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'get_tcp_force',
      toolName: 'ursim_get_tcp_force',
      description: '读取指定机器人 TCP 处的受力与力矩 [Fx,Fy,Fz,Tx,Ty,Tz]（来自 RTDE），可用于碰撞/卡阻的辅助判断。',
      parameters: { ip: IP() },
    },
    // 配置 / 工具端 I/O / 传送带跟踪
    {
      op: 'set_gravity',
      toolName: 'ursim_set_gravity',
      description:
        '设置指定机器人的**重力方向**（3 维向量，会先归一化）。只在机器人**非水平安装**（侧装/倒装）时才需要；' +
        '⚠️ 设错会让重力补偿方向反掉（松手后下坠或上飘）。水平安装通常不需要改。',
      parameters: {
        ip: IP(),
        direction: numberArray({ type: 'number' }, '重力方向向量 [x,y,z]（例如"重力朝下"为 [0,0,-1]）'),
      },
    },
    {
      op: 'zero_ftsensor',
      toolName: 'ursim_zero_ftsensor',
      description:
        '把指定机器人的力/力矩传感器读数归零。⚠️ 归零瞬间机械臂应处于"不受外力"的状态（否则零点会带偏），归零后受力读数的基准随之改变。',
      parameters: { ip: IP() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'get_tool_analog_in',
      toolName: 'ursim_get_tool_analog_in',
      description:
        '读取指定机器人工具端的模拟输入（0/1）。工具模拟输入不经 RTDE，需发一段短 URScript 并把结果写进输出寄存器回读，' +
        '**会打断正在运行的程序**；读不到的场合会如实报失败并说明可能原因（含可换 read_register 再试）。',
      parameters: {
        ip: IP(),
        n: { type: 'integer', required: true, description: '工具模拟输入端口号（0 或 1）' },
        read_register: { type: 'integer', description: '回读用的 double 输出寄存器编号（0-23，默认 22）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'conveyor_tracking',
      toolName: 'ursim_set_conveyor_tracking',
      description:
        '**传送带跟踪**（按官方手册重写；旧版的每个实参都在错误的位置）。action：' +
        '"setup_pulse"（把控制器脉冲解码器挂到编码器：需 decoder_type 1-4 + encoder_a/encoder_b 引脚）、' +
        '"setup_absolute"（外部喂计数值：range_id 0-4，可选 tick_count）、' +
        '"linear"（线性跟踪：需 direction 方向位姿 + ticks_per_meter）、' +
        '"circular"（圆盘跟踪：需 center 圆心位姿 + ticks_per_revolution + 可选 rotate_tool）、' +
        '"stop"（停止）。典型顺序：先 setup_pulse 或 setup_absolute 一次，再 linear/circular，结束时 stop。' +
        '⚠️ 会改变运动学行为——开启后机械臂会跟随传送带运动，请先确认周围安全。' +
        '⚠️ **未经真机验证**：签名与量纲已逐条对照手册，但跟踪行为需要真带编码器的传送带才能确认；' +
        '返回值的 `hardware_verified` 恒为 false，请先在 URSim 上试。' +
        '⚠️ 编码器引脚范围随固件不同：CB3(3.x) 是数字输入 0-3，e-Series / PolyScope X 是 8-11。',
      parameters: {
        ip: IP(),
        action: {
          type: 'string',
          required: true,
          description: '"setup_pulse" / "setup_absolute" / "linear" / "circular" / "stop"',
        },
        encoder_index: { type: 'integer', description: '编码器编号（手册：只能 0 或 1，默认 0）' },
        decoder_type: { type: 'integer', description: 'setup_pulse 的解码方式：1 正交（默认）/ 2 升降沿 / 3 升沿 / 4 降沿' },
        encoder_a: { type: 'integer', description: 'setup_pulse 的编码器 A 引脚（CB3 0-3；e-Series 8-11）' },
        encoder_b: { type: 'integer', description: 'setup_pulse 的编码器 B 引脚（CB3 0-3；e-Series 8-11）' },
        range_id: { type: 'integer', description: 'setup_absolute 的计数范围：0=32 位有符号（默认）… 4=32 位无符号' },
        tick_count: { type: 'integer', description: 'setup_absolute 可选的初始计数值（encoder_set_tick_count）' },
        direction: numberArray({ type: 'number' }, 'linear 的传送带方向位姿（基座系，例如 x 轴方向 [1,0,0,0,0,0]）', false),
        ticks_per_meter: { type: 'number', description: 'linear 的每米脉冲数（>0；编码器走过 1 米的脉冲数）' },
        center: numberArray({ type: 'number' }, 'circular 的圆心位姿（基座系，例如 [0.5,0.5,0,0,0,0]）', false),
        ticks_per_revolution: { type: 'number', description: 'circular 的每转脉冲数（>0）' },
        rotate_tool: { type: 'boolean', description: 'circular：工具是否随传送带旋转（默认 false = 保持轨迹给出的姿态）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    // ── 0.6.0 新增能力 ─────────────────────────────────────────────────────
    // 逐条依据仓库内三本官方手册（URSoftware 3.15.4 / PolyScope 5 / PolyScope X）：
    //   force_mode           Poly5 15.12、PolyScope X 15.11
    //   end_force_mode       Poly5 15.8、PolyScope X 15.7
    //   force_mode_set_*     Poly5 15.16/15.17、PolyScope X 15.15/15.14
    //   speedj/speedl        Poly5 15.48/15.49、PolyScope X 15.47/15.48
    //   stopj/stopl          Poly5 15.51/15.52、PolyScope X 15.50/15.51
    //   is_steady            Poly5 16.39（本插件改用 RTDE 速度量实现，见 ursim_wait_steady）
    //   target_*             Poly5 16.24/16.25/16.30（改用 RTDE 的 target_* 字段）
    //   set_tool_communication  Poly5 18.50、PolyScope X 18.50
    //   set_tool_output_mode    Poly5 18.52、PolyScope X 18.52
    //   set_target_payload      PolyScope X 16.52（5.10+ 才有；CB3 上退回 set_payload_*）
    {
      op: 'force_mode',
      toolName: 'ursim_force_mode',
      description:
        '让指定机器人进入**力控（Force Mode）**：机器人沿/绕你选的轴"柔性"贴合环境，并持续施加指定的力/力矩。' +
        '参数严格按手册：task_frame（6 维位姿，力坐标系）、selection_vector（6 个 0/1，1=该轴柔性）、' +
        'wrench（6 维期望力/力矩，对刚性轴表示"抵消多大的外力"）、type（1/2/3，力坐标系的变换方式）、' +
        'limits（6 维：柔性轴=最大 TCP 速度，刚性轴=最大位置偏差）、可选 damping（0-1）与 gain_scaling（0-2）。' +
        '⚠️ 力控会持续压向环境：务必确认工件/夹具能承受该力，并保持急停在手边。' +
        '⚠️ 力控是**持续状态**：退出请调用 ursim_end_force_mode，或在示教器上停止程序。' +
        '手册建议进入前先 sleep 0.02s 并避免沿柔性轴的快速运动（本工具已在脚本里插入了该 sleep）。',
      parameters: {
        ip: IP(),
        // 下面三个数组在 Python 侧都有默认值（ur_worker.py:2101-2106），所以是可选参数；
        // `numberArray` 的第三个实参给 `false` 即省略 `required`（不可写作 `required: false`，
        // 那个键一旦出现就必须为 true，否则本工具整个注册失败）。
        task_frame: numberArray({ type: 'number' }, '力坐标系位姿 [x,y,z,rx,ry,rz]（相对基座，默认全 0 = 基座系）', false),
        selection_vector: {
          type: 'array',
          items: { type: 'integer' },
          description: '6 个 0/1，1 表示该轴柔性（默认 [0,0,1,0,0,0] = 沿 z 柔性）',
        },
        wrench: numberArray({ type: 'number' }, '6 维力/力矩 [Fx,Fy,Fz,Tx,Ty,Tz]（N / N·m，默认全 0）', false),
        type: { type: 'integer', description: '力坐标系解释方式：1 / 2（默认）/ 3' },
        limits: numberArray({ type: 'number' }, '6 维限制（柔性轴=最大速度，刚性轴=最大偏差；默认 [2,2,1.5,1,1,1]）', false),
        damping: { type: 'number', description: '阻尼 0-1（默认 0.005；越大无外力时减速越快）' },
        gain_scaling: { type: 'number', description: '增益缩放 0-2（默认 1；>1 可能让力控不稳定）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'end_force_mode',
      toolName: 'ursim_end_force_mode',
      description:
        '退出指定机器人的**力控模式**（URScript `end_force_mode()`），恢复正常位置控制。' +
        '程序停止时控制器也会自动退出力控，所以这个工具用于"程序还在跑但想主动退力控"的场合。',
      parameters: { ip: IP() },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'force_mode_settings',
      toolName: 'ursim_force_mode_settings',
      description:
        '设置力控的 damping（0-1）与 gain_scaling（0-2）。⚠️ 这两个值**控制器侧无法回读**：' +
        '本工具只回报本次设置的值，不会假装读到了"当前值"；手册也要求它们在**进入力控之前**设置才生效。',
      parameters: {
        ip: IP(),
        damping: { type: 'number', description: '阻尼 0-1（默认 0.005）' },
        gain_scaling: { type: 'number', description: '增益缩放 0-2（默认 1）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'speedj',
      toolName: 'ursim_speedj',
      description:
        '**关节速度控制**：让指定机器人线性加速到给定的关节角速度并保持（URScript `speedj(qd, a, t)`）。' +
        '⚠️ 这是速度指令、不是位置指令：机器人会一直以该速度转动，直到 ursim_stopj / 新的运动指令 / 安全停止。' +
        't>0 时函数在 t 秒后返回，t=0（默认）时在达到目标速度后返回——**两种情况机器人都还在动**。' +
        '请用 ursim_wait_steady 或 ursim_stopj 收尾，并务必确认终点方向的行程足够。',
      parameters: {
        ip: IP(),
        qd: numberArray({ type: 'number' }, '六个关节的目标角速度（rad/s）'),
        a: { type: 'number', description: '关节加速度（rad/s²，必须 >0，默认 0.5）' },
        t: { type: 'number', description: '运行时长（秒，≥0，默认 0 = 达速后立即返回，机械臂继续运动）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'speedl',
      toolName: 'ursim_speedl',
      description:
        '**TCP 速度控制**：让指定机器人线性加速到给定的 TCP 速度并保持（URScript `speedl(xd, a, t, aRot)`）。' +
        '⚠️ 这是本插件"放得最开"的运动指令：它绕过位置轨迹规划，直接给笛卡尔速度；' +
        '机器人会一直以该速度运动，直到 ursim_stopl / 新指令 / 安全停止。t=0（默认）表示达速后返回但**仍在运动**。' +
        'aRot 省略时旋转加速度按 a 处理（=手册默认 `aRot=\'a\'`）。',
      parameters: {
        ip: IP(),
        xd: numberArray({ type: 'number' }, 'TCP 目标速度 [vx,vy,vz,ωx,ωy,ωz]（m/s 与 rad/s）'),
        a: { type: 'number', description: '加速度（m/s²，必须 >0，默认 0.5）' },
        t: { type: 'number', description: '运行时长（秒，≥0，默认 0 = 达速后立即返回，机械臂继续运动）' },
        a_rot: { type: 'number', description: '旋转加速度（rad/s²，>0；省略则按 a 处理）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'stopj',
      toolName: 'ursim_stopj',
      description: '让指定机器人**关节空间减速到零**（URScript `stopj(a)`）。speedj 之后的标准收尾动作。',
      parameters: {
        ip: IP(),
        a: { type: 'number', description: '关节减速度（rad/s²，必须 >0，默认 2）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'stopl',
      toolName: 'ursim_stopl',
      description: '让指定机器人**TCP 速度减速到零**（URScript `stopl(a, aRot)`）。speedl 之后的标准收尾动作。',
      parameters: {
        ip: IP(),
        a: { type: 'number', description: '减速度（必须 >0，默认 0.5）' },
        a_rot: { type: 'number', description: '旋转减速度（>0；省略则按 a 处理）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'wait_steady',
      toolName: 'ursim_wait_steady',
      description:
        '等待指定机器人**完全静止**后再返回（对应用户手册里的"等待机器人静止"语义）。' +
        '实现方式是轮询 RTDE 里已有的 TCP 速度与关节角速度（零额外往返），' +
        '**不是**发 URScript 的 is_steady()——那个表达式在力控/示教模式下恒为 false，反而会误导。' +
        '适合在 speedj/speedl/力控之后确认"确实停下来了"。超时不会报错，而是如实回报 steady=false 与当时的实测速度。',
      parameters: {
        ip: IP(),
        timeout_s: { type: 'number', description: '最长等待时间（秒，0.1-300，默认 10）' },
        linear_tolerance: { type: 'number', description: 'TCP 线速度静止阈值（m/s，默认 0.005）' },
        angular_tolerance: { type: 'number', description: 'TCP 角速度静止阈值（rad/s，默认 0.01）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'get_target_values',
      toolName: 'ursim_get_target_values',
      description:
        '读取指定机器人"**控制器打算去哪**"：目标关节角/角速度/角加速度与目标 TCP 位姿/速度，并同时给出实际关节角与实际 TCP 位姿。' +
        '与"实际值"的差值是判断"指令已下发但尚未执行 / 正在交融 / 被安全限速拉住"的直接依据。' +
        '数据来自 RTDE 的 target_* 字段（已在接收配方里），读取零代价。',
      parameters: { ip: IP() },
    },
    {
      op: 'tool_communication',
      toolName: 'ursim_set_tool_communication',
      description:
        '开关指定机器人工具法兰的**串口通信接口（TCI, RS-485）**，用于夹爪/拧紧枪等工具免外接走线。' +
        '参数对照手册 set_tool_communication(enabled, baud_rate, parity, stop_bits, rx_idle_chars, tx_idle_chars)。' +
        '⚠️ 手册明确警告：**启用 TCI 会禁用工具端的模拟输入**（那两路被复用成串口）。',
      parameters: {
        ip: IP(),
        enabled: { type: 'boolean', default: true, description: 'true 启用（默认），false 关闭' },
        baud_rate: {
          type: 'integer',
          description: '波特率：9600/19200/38400/57600/115200/1000000/2000000/5000000（默认 115200）',
        },
        parity: { type: 'integer', description: '校验位：0 无 / 1 奇 / 2 偶（默认 2）' },
        stop_bits: { type: 'integer', description: '停止位：1 或 2（默认 1）' },
        rx_idle_chars: { type: 'number', description: 'RX idle chars（1.0-40.0，默认 1.0）' },
        tx_idle_chars: { type: 'number', description: 'TX idle chars（0.0-40.0，默认 3.5）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'set_tool_output_mode',
      toolName: 'ursim_set_tool_output_mode',
      description:
        '设置指定机器人工具输出的模式：1 = power（双针供电模式，两路数字输出被用作附加电源）/ 0 = 普通数字输出。' +
        '⚠️ 改这个会改变工具法兰上针脚的电平语义，接错可能损坏工具。',
      parameters: {
        ip: IP(),
        mode: { type: 'integer', required: true, description: '0 普通 / 1 power（双针供电）' },
      },
    },
    {
      op: 'set_payload_inertia',
      toolName: 'ursim_set_payload_inertia',
      description:
        '一次性设置负载的**质量 + 重心 + 惯性矩阵**（PolyScope 5.10 起的 `set_target_payload`）。' +
        '⚠️ 相比如今已被手册标为 deprecated 的 ursim_set_payload（它会把惯性矩阵**重置**），' +
        '这个工具不会让质量/重心/惯量三者互相不一致；手册要求 Ixx/Iyy/Izz 非负、每个元素 |I|≤133 kg·m²。' +
        '⚠️ 设置负载会**自动把力/力矩测量归零**（等效 zero_ftsensor），因此请在真正需要用力的场合之前设置。' +
        'transition_time>0 可让负载切换时机器人不"跳"一下（抓/放重物有用）。' +
        'CB3（URSoftware 3.x）没有 `set_target_payload`：**没给 inertia 时**会依次发 `set_payload_mass` + ' +
        '`set_payload_cog`（而不是 `set_payload(m, cog)`——后者会重置惯性矩阵），这两条在所有版本上都存在。',
      parameters: {
        ip: IP(),
        mass: { type: 'number', required: true, description: '负载质量（kg，≥0）' },
        cog: numberArray({ type: 'number' }, '重心 [x,y,z]（米，相对工具法兰）'),
        inertia: numberArray(
          { type: 'number' },
          '惯性矩阵（行主序 9 个数，kg·m²），可选；给了才走 set_target_payload',
          false,
        ),
        transition_time: { type: 'number', description: '负载切换过渡时间（秒，默认 0）' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'move_optimized',
      toolName: 'ursim_move_optimized',
      description:
        '**OptiMove 平滑运动**（手册 Poly5 15.32/15.33、PolyScope X 15.31/15.32）：与 ursim_movej/ursim_movel 目标相同，' +
        '但用 jerk 受限的速度剖面，运动更平顺、振动更小。' +
        '⚠️ a/v 不是 rad/s 或 m/s，而是"机器人能力的一个比例"，范围 (0, 1]：1 = 该构型下能达到的最快。' +
        '手册提示：a/v 的绝对速度取决于当时构型，因此同一组数值在不同工作区间的实际速度不同。' +
        'goal_type="joints" 时 goal 是六关节角（等价 optimovej）；"pose" 时 goal 是六维基座位姿（等价 optimovel）。' +
        '手册支持的 struct{pose,frame} 与世界模型对象名**本工具不支持**（需要 PolyScope 侧对象，脚本写错只会得到运行期报错），' +
        '传 frame 会被明确拒绝。⚠️ 会驱动机械臂运动，且请确认机器人当前静止。',
      parameters: {
        ip: IP(),
        goal_type: { type: 'string', required: true, description: '"joints"（关节角，等价 optimovej）/ "pose"（基座位姿，等价 optimovel）' },
        goal: numberArray({ type: 'number' }, '目标：joints 时为六关节角（rad），pose 时为 [x,y,z,rx,ry,rz]'),
        a: { type: 'number', description: '加速度**比例** (0,1]，默认 0.3（1 = 该构型下最快）' },
        v: { type: 'number', description: '速度**比例** (0,1]，默认 0.3' },
        r: { type: 'number', description: '交融半径（米），≥0，默认 0' },
        // 声明它是为了让拒绝**可达**：Python 侧明确拒绝这个参数（需要 PolyScope 侧坐标系/
        // 世界模型对象，写错只会换来控制器一句运行期报错）。不声明的话模型永远传不进来，
        // 那条清晰的错误信息就成了死代码（`scripts/check-tool-params.py` 会抓到这种不一致）。
        frame: {
          type: 'string',
          description: '不支持：手册的 struct{pose,frame} 形态需要 PolyScope 侧坐标系；传了会被明确拒绝',
        },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'motion_version',
      toolName: 'ursim_motion_version',
      description:
        '设置 **Motion Version**（手册第 14 章）与/或 **jerk 增益**。' +
        'Motion Version：版本 1 与旧版 PolyScope 的运动剖面相同；版本 2 在规划时把速度/加速度' +
        '**钳到硬件上限**，交融半径重叠时**动态收缩**而不是跳过整段运动（版本 1 会跳过并给 ' +
        '"Overlapping Blends" 警告）。⚠️ 手册明确：**新机型与 PolyScope X 只支持版本 2**，CB3 没有这个设置。' +
        'jerk_gain_scaling（0.01-1.0，默认 1.0）：只影响 **jerk 受限**的剖面，即版本 2 的 movej/movel ' +
        '与 optimovej/optimovel（= 本插件的 ursim_move_optimized）；需要更平滑的运动就调小。' +
        '⚠️ 这两个设置**都没有回读通道**，返回值只报告本次设置的值，不假装读到当前值。',
      parameters: {
        ip: IP(),
        version: { type: 'integer', description: 'Motion Version：1 或 2；省略则不改' },
        jerk_gain_scaling: { type: 'number', description: 'jerk 增益 0.01-1.0（1.0 = 默认，越小越平滑）；省略则不改' },
      },
    },
    {
      op: 'get_freedrive_status',
      toolName: 'ursim_get_freedrive_status',
      description:
        '读取当前姿态在 **freedrive（手动拖动）** 下离**奇异点**有多远（PolyScope X 15.20）。' +
        '返回 0 = 正常、1 = 接近奇异点、2 = 太接近（拖动阻力明显变大）。' +
        '⚠️ 注意它**不是**"freedrive 开没开"的状态位，而是受限 freedrive 的可用性提示：' +
        '手册建议据此让操作员换一条路径，或改用不受限的 freedrive。' +
        '实现上需要控制器执行 URScript 表达式并把它写进一个输出寄存器（默认 21 号 int 寄存器，旧值会被覆盖）；' +
        '较老的 PolyScope（早于引入该函数的版本）上读不到，会如实报失败并说明原因。',
      parameters: {
        ip: IP(),
        register: { type: 'integer', description: '回读用的 int 输出寄存器编号（0-23），默认 21' },
      },
      timeoutMs: config.commandTimeoutMs,
    },
    {
      op: 'get_tool_telemetry',
      toolName: 'ursim_get_tool_telemetry',
      description:
        '读取指定机器人工具端的**电气遥测**：工具输出电流（A）、工具输出电压（V）、I/O 电流（A）。' +
        '来自 RTDE 数据流，读取零代价；可用于判断工具是否真的在上电/耗电（例如夹爪没动时电流为 0）。' +
        '（手册里还有 get_tool_temp()，但当前 RTDE 配方不含对应字段，故本工具不提供该值。）',
      parameters: { ip: IP() },
    },
    /*
     * 离线仿真（运动学级，0.7.0）。
     *
     * 把 `ip` 指向保留的回环地址 `127.0.0.1` 后，运动类工具与位姿读回会作用于一个**虚拟
     * 机器人**：数字仿真里的模型真的会动，而任何真机都不会收到一个字节。其余指令在仿真目标
     * 上会明确返回「无仿真语义」（`SIM_UNSUPPORTED`），不会给一个看起来能跑的结果。
     */
    {
      op: 'sim_start',
      toolName: 'ursim_sim_start',
      description:
        '开启**离线仿真**（运动学级）：在保留地址 127.0.0.1 上创建一台虚拟 UR 机器人，' +
        '让数字仿真里的模型在没有真机的情况下被驱动。必须指定 model（内置型号之一，如 ur5e/ur10e/ur20）。' +
        '开启后，所有 ursim_* 调用都要带 ip="127.0.0.1"。' +
        '仿真只实现**运动学**：运动类工具（movej/movel/movep/movec/run_sequence/servoj/move_x|y|z/move_tool_*/draw_*/' +
        'move_optimized/wait_steady/stopj/stopl）与位姿读回；' +
        '力控、RTDE 遥测、安全状态位、程序加载与执行、原始脚本、I/O、寄存器、传送带、电源与刹车等' +
        '都没有仿真语义，会明确回报而不是假装执行。真机连接不受影响。',
      parameters: {
        model: { type: 'string', required: true, description: '机器人型号 id（内置：ur3/ur3e/ur5/ur5e/ur7e/ur10/ur10e/ur12e/ur16e/ur8long/ur15/ur18/ur20/ur30）' },
        preset: { type: 'string', description: '起始关节姿态预设：upright（竖直收拢，默认）/ zero（全零，整条臂平伸）/ reach（侧伸）' },
        speed_scaling: { type: 'number', description: '速度倍率 0.01–1.0（默认 1.0）；它直接缩放每段运动的时长，对应真机的 Speed Scaling' },
        ip: OPTIONAL_SIM_IP(),
      },
    },
    {
      op: 'sim_stop',
      toolName: 'ursim_sim_stop',
      description:
        '关闭**离线仿真**并释放虚拟机器人（幂等：本来没开也返回成功）。' +
        '关闭后仿真会回到真机（若已连接）或显示未连接状态。',
      parameters: { ip: OPTIONAL_SIM_IP() },
    },
    {
      op: 'sim_status',
      toolName: 'ursim_sim_status',
      description:
        '读取**离线仿真**的当前状态：是否开启、型号、当前关节角、速度倍率，以及仿真支持/不支持的能力清单。' +
        '无副作用，可随时调用。',
      parameters: { ip: OPTIONAL_SIM_IP() },
    },
  ];
}

