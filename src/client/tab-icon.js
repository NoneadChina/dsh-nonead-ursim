/**
 * 右侧栏卡片图标：一台四连杆协作臂（底座 → 立柱 → 大臂 → 小臂 → 腕关节）。
 *
 * 设计取舍（都在 26 px 的卡片图标实际尺寸上、用光栅化预览逐版淘汰出来的）：
 * - **只画一条臂**：卡片图标是 16 栅格、26 px 显示，一个图形只能承载一个概念。
 *   早期版本在小臂旁叠一条"虚线孪生臂"表示数字孪生，实机上两条线相距不到 3 px、
 *   圆角笔帽互相粘连，缩到 26 px 后变成两块灰疙瘩 —— 已废弃，仿真语义交给标题/描述文字。
 * - **四条线段 + 一个实心腕关节**：底座横线（落地）、立柱（J1）、大臂、小臂、末端关节球。
 *   转折只有两个，22 px 下仍能看清"站在底座上的一只手"，比完整六轴少 3 处关节糊点。
 * - **腕关节用实心圆**：描边折线的末端如果只有圆角笔帽，读者分不清是接头还是断头；
 *   一个实心小圆点明确表示"末端执行器这一侧"，也让整体轮廓有个视觉落点。
 * - **单一颜色**：`stroke`/`fill` 都用 `currentColor`，跟随宿主主题与 hover 高亮自动变色，
 *   不需要维护深浅两套配色。
 * - 16×16 视图框、1.1 线宽、圆角笔帽笔连接，与 `@deepseek-ai/dsh-client-ui-primitives`
 *   里 `*-outline` 系列产品图标同一套画法（同为 16 栅格 + `currentColor` 描边）。
 *
 * 该模块**不**静态依赖 React：图标要用宿主 shell 已装载的那一份 React 构造，
 * 由调用方把 `require('react')` 的结果传进来（与 `sidebar-native.js` 的约定一致）。
 */

/** 视图框（16 栅格，与宿主产品图标一致）。 */
export const ICON_VIEW_BOX = '0 0 16 16'

/** 描边宽度：宿主图标是 1px @16 栅格，这里取 1.1 让 22 px 下不显细。 */
export const ICON_STROKE_WIDTH = 1.1

/** 底座脚踏（落地横线）。 */
const BASE = 'M2.3 12.35H7.15'

/** 立柱（J1），从底座竖起到肩部。 */
const COLUMN = 'M4.72 12.35V9.05'

/** 大臂：肩 → 肘。 */
const UPPER_ARM = 'M4.72 9.05L8.68 3.66'

/** 小臂：肘 → 腕。 */
const FOREARM = 'M8.68 3.66L12.53 6.85'

/** 实线段的绘制顺序：底座 → 立柱 → 大臂 → 小臂。 */
export const ARM_SEGMENTS = [BASE, COLUMN, UPPER_ARM, FOREARM]

/** 腕关节圆心（= 小臂末端）。 */
export const WRIST_CENTER = { cx: 12.53, cy: 6.85 }

/** 腕关节半径：比半条线宽（0.55）大一倍多，才能在 22 px 下看出来是个点而不是加粗的线头。 */
export const WRIST_RADIUS = 1.12

/**
 * 造卡片图标组件。
 *
 * @param {object} react 宿主 React（需有 `createElement`；测试可传替身）
 * @returns {(props?: { size?: number, className?: string }) => object} React 组件
 */
export function createTabIcon(react) {
  if (!react || typeof react.createElement !== 'function') {
    throw new TypeError('createTabIcon 需要宿主的 React（createElement）')
  }
  const { createElement } = react

  const line = (d) =>
    createElement('path', {
      key: d,
      d,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: ICON_STROKE_WIDTH,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    })

  return function UrsimTabIcon({ size = 22, className } = {}) {
    return createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: ICON_VIEW_BOX,
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': 'true',
        focusable: 'false',
        className,
      },
      [
        ...ARM_SEGMENTS.map(line),
        createElement('circle', {
          key: 'wrist',
          cx: WRIST_CENTER.cx,
          cy: WRIST_CENTER.cy,
          r: WRIST_RADIUS,
          fill: 'currentColor',
          stroke: 'none',
        }),
      ],
    )
  }
}
