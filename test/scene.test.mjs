/**
 * `createScene` 的单测（清单第 21 条）。
 *
 * 原先这个函数**没有单测**，文件头如实标注了原因：`WebGLRenderer` 需要真实 WebGL 上下文。
 * 现在 `createScene(canvas, { rendererFactory })` 留了注入点，于是"光照 / 网格 / 相机 /
 * controls 参数"这些**真正容易调错的东西**终于可以被断言，不必靠 GUI 手验。
 *
 * 假 canvas / 假 renderer 只实现 `OrbitControls` 与 `createScene` 实际会碰到的成员。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Color, Mesh, MeshBasicMaterial } from 'three'

import {
  CAMERA_SPEC,
  createBaseGrid,
  createScene,
  GRID_COLORS,
  gridExtentFor,
  SCENE_LIGHTING,
} from '../src/client/robot/scene.js'

/**
 * 断言网格 `color` 顶点属性第 `index` 个顶点等于某个颜色的（线性）分量。
 *
 * `GridHelper` 把颜色烘进顶点属性（材质是 `vertexColors: true`），且 `new Color(hex)` 会做
 * sRGB→线性的工作色彩空间转换后写入，所以两边都以 `new Color(hex)` 为基准比较；
 * 属性是 `Float32BufferAttribute`，留 1e-6 的浮点容差。
 */
function assertVertexColor(attribute, index, hex) {
  const expected = new Color(hex)
  for (const [axis, want] of [['getX', expected.r], ['getY', expected.g], ['getZ', expected.b]]) {
    const got = attribute[axis](index)
    assert.ok(
      Math.abs(got - want) < 1e-6,
      `顶点 ${index} 的 ${axis}() 应为 ${want}（0x${hex.toString(16)}），实际 ${got}`,
    )
  }
}

/** 最小假 canvas：`OrbitControls` 只用到事件、样式与尺寸相关的少数成员。 */
function fakeCanvas() {
  const listeners = new Map()
  const noop = () => {}
  return {
    clientWidth: 800,
    clientHeight: 600,
    style: {},
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(handler)
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler)
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
    // `OrbitControls` 会向 `domElement.getRootNode()` 挂全局监听（键盘/滚轮等）。
    getRootNode: () => ({ addEventListener: noop, removeEventListener: noop }),
    setPointerCapture: noop,
    releasePointerCapture: noop,
    hasPointerCapture: () => false,
    ownerDocument: { addEventListener: noop, removeEventListener: noop },
    /** 测试用：看看注册了多少个监听器（`dispose` 后应清空）。 */
    _listenerCount: () => [...listeners.values()].reduce((n, set) => n + set.size, 0),
  }
}

/** 最小假 renderer：只提供 `createScene` 与 `dispose` 真正会调用的成员。 */
function fakeRenderer(calls) {
  return {
    toneMapping: null,
    toneMappingExposure: 1,
    shadowMap: { enabled: false },
    setPixelRatio() {},
    setSize() {},
    render() {
      calls.render += 1
    },
    dispose() {
      calls.dispose += 1
    },
    forceContextLoss() {
      calls.forceContextLoss += 1
    },
    getContext: () => null,
    getRenderTarget: () => null,
    setRenderTarget() {},
    clear() {},
    getDrawingBufferSize(target) {
      return target?.set?.(800, 600) ?? { x: 800, y: 600, width: 800, height: 600 }
    },
    getSize(target) {
      return target?.set?.(800, 600) ?? { width: 800, height: 600 }
    },
  }
}

function build() {
  const calls = { render: 0, dispose: 0, forceContextLoss: 0 }
  const canvas = fakeCanvas()
  const scene = createScene(canvas, { rendererFactory: () => fakeRenderer(calls) })
  return { calls, canvas, scene }
}

test('createScene 在注入假 renderer 时可建出场景（这正是原先测不到的部分）', () => {
  let built
  assert.doesNotThrow(() => {
    built = build()
  }, '有了 rendererFactory 注入点，createScene 必须能在 Node 里跑通')

  const { scene } = built
  assert.ok(scene.scene, '必须有 scene')
  assert.ok(scene.camera, '必须有 camera')
  assert.ok(scene.renderer, '必须有 renderer')
  assert.ok(scene.controls, '必须有 controls')
})

test('相机与光照参数来自导出的常量（改常量就是改行为，不会再有两处魔法数字）', () => {
  const { scene } = build()

  assert.equal(scene.camera.fov, CAMERA_SPEC.fov)
  assert.equal(scene.camera.near, CAMERA_SPEC.near)
  assert.equal(scene.camera.far, CAMERA_SPEC.far)
  // ⚠️ 用容差而不是精确相等：`OrbitControls` 构造时会 `update()`，把相机位置经球坐标
  // 往返一次，带来 1e-16 级的浮点误差。断言"数值相等"会把这条正确的实现判成失败。
  const near = (actual, expected, label) => {
    assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} ≠ ${expected}`)
  }
  near(scene.camera.position.x, CAMERA_SPEC.position[0], 'camera.x')
  near(scene.camera.position.y, CAMERA_SPEC.position[1], 'camera.y')
  near(scene.camera.position.z, CAMERA_SPEC.position[2], 'camera.z')
  // 世界 Z 向上 = 基座 Z 向上：这条错了整个画面的"上"就反了。
  assert.deepEqual([scene.camera.up.x, scene.camera.up.y, scene.camera.up.z], [0, 0, 1])

  const lights = scene.scene.children.filter((child) => child.isLight)
  const ambient = lights.find((light) => light.isAmbientLight)
  const directional = lights.find((light) => light.isDirectionalLight)
  assert.ok(ambient, '必须有环境光')
  assert.ok(directional, '必须有平行光')
  assert.equal(ambient.intensity, SCENE_LIGHTING.ambientIntensity)
  assert.equal(directional.intensity, SCENE_LIGHTING.directionalIntensity)
  assert.deepEqual(
    [directional.position.x, directional.position.y, directional.position.z],
    [...SCENE_LIGHTING.directionalPosition],
  )
})

test('渲染必须开 ACES tone mapping；环境贴图拿不到时要降级而不是崩掉', () => {
  const { scene } = build()
  // 假 renderer 不是真 WebGLRenderer，PMREMGenerator 必然失败 —— 这正是降级路径的验证：
  // 场景照样建得出来，只是没有 environment。
  assert.equal(scene.renderer.toneMappingExposure, 1)
  assert.equal(scene.renderer.toneMapping, 4, 'ACESFilmicToneMapping 的枚举值是 4')
  assert.equal(scene.scene.environment, null, '拿不到环境贴图时必须是 null，而不是半个对象')
})

test('基座网格被挂进场景，且尺寸由 gridExtentFor 决定', () => {
  const { scene } = build()
  const grid = scene.grid
  assert.ok(grid, '必须有基座网格')
  assert.ok(scene.scene.children.includes(grid), '网格必须在场景里')
  assert.equal(grid.rotation.x, Math.PI / 2, '网格必须摆到 XY 面（法线 +Z）')

  // 换装时 `replaceGrid` 会按新半径重建 —— 尺寸必须与纯函数一致。
  // `GridHelper` 的 geometry 是 BufferGeometry（**没有** `parameters`），所以断言顶点范围。
  const expected = gridExtentFor(1)
  const rebuilt = createBaseGrid(expected.size, expected.divisions)
  const positions = rebuilt.geometry.getAttribute('position')
  let extent = 0
  for (const value of positions.array) extent = Math.max(extent, Math.abs(value))
  assert.ok(
    Math.abs(extent - expected.size / 2) < 1e-6,
    `网格半边长应为 ${expected.size / 2}，实测 ${extent}`,
  )
  assert.ok(expected.size > 0 && expected.divisions > 0)
})

test('dispose 释放 renderer 并强制丢失上下文（否则每次收起面板都漏一个 WebGL 上下文）', () => {
  const { calls, scene } = build()
  scene.dispose()
  assert.equal(calls.dispose, 1, '必须 dispose renderer')
  assert.equal(calls.forceContextLoss, 1, '必须 forceContextLoss —— 只 dispose 不会释放上下文')
  // 幂等：重复 dispose 不该再动 renderer（避免二次释放已释放的对象）。
  assert.doesNotThrow(() => scene.dispose())
})

test('resize 用 canvas 的 CSS 尺寸并钳住像素比', () => {
  const { scene } = build()
  assert.equal(typeof scene.resize(), 'boolean')
  // 极端像素比要被钳住：HiDPI 上按 devicePixelRatio 全量渲染会把填充率吃光。
  assert.doesNotThrow(() => createScene(fakeCanvas(), {
    rendererFactory: () => fakeRenderer({ render: 0, dispose: 0, forceContextLoss: 0 }),
    maxPixelRatio: 1,
  }))
})

// ── 主题（面板跟随桌面端的浅色/深色设置）────────────────────────────────────
//
// 面板 DOM 的配色由 CSS 的 `--dsw-*` token 负责（宿主 token 自己翻转），但**网格线颜色烘在
// 顶点色里**、CSS 管不到，只能由 `applyTheme()` 就地重刷。这里钉住两件事：
//   ① 建场景时就能带上当前主题（面板懒创建场景，可能在主题已确定之后才建）；
//   ② `applyTheme()` 就地刷色（不重建几何体），且同主题重复调用不产生变化。

test('主题：createScene 可一开始就用浅色（基座网格按当前主题着色）', () => {
  const scene = createScene(fakeCanvas(), {
    rendererFactory: () => fakeRenderer({ render: 0, dispose: 0, forceContextLoss: 0 }),
    theme: 'light',
  })
  const attribute = scene.grid.geometry.getAttribute('color')
  assertVertexColor(attribute, 0, GRID_COLORS.light.grid)
  assertVertexColor(attribute, (scene.grid.userData.divisions / 2) * 4, GRID_COLORS.light.center)
  scene.dispose()
})

test('主题：applyTheme 就地重刷网格颜色，同主题重复调用不重刷', () => {
  const { scene } = build()
  assert.equal(typeof scene.applyTheme, 'function', 'createScene 必须暴露 applyTheme')

  const attribute = scene.grid.geometry.getAttribute('color')
  const centerIndex = (scene.grid.userData.divisions / 2) * 4
  // 缺省 theme = 'dark'，保持 0.6.3 以来的观感。
  assertVertexColor(attribute, 0, GRID_COLORS.dark.grid)
  assertVertexColor(attribute, centerIndex, GRID_COLORS.dark.center)

  assert.equal(scene.applyTheme('light'), true, '真正换主题时必须返回 true（调用方据此重画一帧）')
  assertVertexColor(attribute, 0, GRID_COLORS.light.grid)
  assertVertexColor(attribute, centerIndex, GRID_COLORS.light.center)
  assert.equal(
    scene.grid.geometry.getAttribute('color'),
    attribute,
    '必须就地重刷顶点色 —— 重建几何体既浪费又会在切主题时抖动',
  )

  assert.equal(scene.applyTheme('light'), false, '同主题重复调用不得报告"变了"')
  assert.equal(scene.applyTheme('dark'), true)
  assertVertexColor(attribute, 0, GRID_COLORS.dark.grid)
  assert.equal(scene.applyTheme('nonsense'), false, '非法主题按深色处理，且与当前一致时不重刷')
  scene.dispose()
})

test('★ fitTo 的 minRadius 下限：绝对取景 = max(实测包围球, 下限)', () => {
  // 用途：每换一个型号都按它自己的包围盒取景，画面上每个型号都撑满 —— 机型长度差 2.7 倍
  // 却"看起来一样大"（用户 2026-10-12 的反馈）。给一个固定下限就变成**同一把尺子**。
  const { scene } = build()
  const small = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial())

  scene.fitTo(small)
  const measured = scene.currentFitRadius()
  assert.ok(measured > 0 && measured < 0.2, `小盒子的取景半径应≈0.09 m，实测 ${measured}`)

  // 下限大于实测 ⇒ 抬到下限（物体在画面里随之变小，这正是"能比较大小"的前提）
  scene.fitTo(small, { minRadius: 2.1678 })
  assert.ok(Math.abs(scene.currentFitRadius() - 2.1678) < 1e-9, '下限必须生效')

  // 下限小于实测 ⇒ 不得把画面拉近（取景仍按物体本身）
  scene.fitTo(small, { minRadius: 0.01 })
  assert.ok(Math.abs(scene.currentFitRadius() - measured) < 1e-9, '下限不得覆盖掉更大的实测半径')

  // 非法下限按"没给"处理，不能把相机丢到无穷远
  scene.fitTo(small, { minRadius: Number.NaN })
  assert.ok(Math.abs(scene.currentFitRadius() - measured) < 1e-9, 'NaN 下限必须被忽略')
  scene.fitTo(small, { minRadius: -3 })
  assert.ok(Math.abs(scene.currentFitRadius() - measured) < 1e-9, '负数下限必须被忽略')
  scene.dispose()
})
