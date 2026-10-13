/**
 * 数字孪生的路径常量 —— **零 import 的共享模块**（Ruling 22）。
 *
 * 为什么单独一个文件、而不是直接写进 `lib/twin-routes.js`：
 *   host 半的 `lib/twin-routes.js` 需要 `node:fs`（资产路由要读 GLB）。客户端半由
 *   esbuild 打进浏览器 bundle，**一旦 import 到 `node:fs` 就会解析失败或把 Node 内置模块
 *   带进浏览器**。把路径常量抽到这个零依赖文件后：
 *     - host：`lib/twin-routes.js` 从本文件 import / re-export；
 *     - client：`src/client/state.js` 构建期 `import` 本文件，esbuild 直接内联两个字符串。
 *   ⇒ 两边共用**同一份真源**，不可能漂移，也不需要额外的"漂移守卫"测试。
 *
 * 本文件必须永远保持零 import。
 */

/** 只读状态轮询路由（host 注册，client 轮询）。 */
export const TWIN_STATE_PATH = '/nonead-ursim/twin/state';

/** 模型资产路由（host 注册，client 取 GLB）。 */
export const TWIN_ASSET_PATH = '/nonead-ursim/twin/asset';

/** 可用模型清单路由（host 注册，client 用于模型切换/离线预览）。 */
export const TWIN_MODELS_PATH = '/nonead-ursim/twin/models';

/**
 * 实时状态**流**路由（Server-Sent Events；清单第 20 条）。
 *
 * 与 `TWIN_STATE_PATH` 的 10 Hz 轮询并存但**互斥使用**：客户端要么轮询、要么订阅流。
 * DSH 的 `webServer` 明确支持"handler 自己持有整个响应生命周期"（类型定义里就写了
 * `may hold the response open, e.g. SSE`），所以这条路由不需要任何上游改动。
 */
export const TWIN_STREAM_PATH = '/nonead-ursim/twin/stream';

/**
 * 离线仿真配置路由：`GET` 读当前状态，**`POST` 开关仿真**（0.7.0）。
 *
 * ⚠️ 这是本插件**唯一**的写路由，也是孪生面板第一次发出写请求。它的副作用被刻意压到最小：
 * 只能创建/销毁一个**回环地址上的运动学虚拟机器人**（`127.0.0.1`），绝不向任何真机下发指令。
 * 面板的仿真开关就是调它；除此之外孪生仍然只读。
 */
export const TWIN_SIM_PATH = '/nonead-ursim/twin/sim';
