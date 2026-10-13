/**
 * src/client/robot/scene.js — three.js 场景/相机/光照/OrbitControls 装配。
 *
 * 与 `loader.js` 分离的原因：本模块只负责"渲染容器"，模型装配与 FK 归 loader / twin-panel。
 *
 * ## 世界坐标 = UR 基座坐标（Z 向上）
 * 机器人各连杆姿态是 FK 直接算出的**基座系**坐标（UR 基座 X 向前、Y 向左、Z 向上），
 * `applyFK()` 把它们原样写进各装配组。所以场景必须让**世界坐标系与基座坐标系重合**：
 *   - 网格**平面 = 基座平面**（XY 面，z=0）：`GridHelper` 默认躺在 XZ 面、法线 +Y，
 *     故绕 X 轴转 +90° 把法线转到 +Z（见 `createBaseGrid()`）；
 *   - `camera.up = +Z`，否则 OrbitControls 会把 Z 当"侧向"、视角整体歪掉。
 * **不要**反过来把机器人根节点旋转去迁就 Y 向上的世界：那会破坏"基座 X/Y/Z = 世界 X/Y/Z"。
 *
 * ## 尺度必须跟着机型走（0.6.3）
 * 内置型号的链路长度从 UR3（≈0.94 m）到 UR20/UR8long（≈2.4 m）相差 2.6 倍。以前相机位置、
 * `controls.target`、min/max distance 与基座网格**全部按 ~0.8 m 的臂写死**，于是换一台大臂就
 * 一开面板贴脸、换一台小臂又离得老远，网格也盖不住基座以外的范围。现在这些量一律由
 * `fitTo()` 从**模型包围盒**推导：`fitDistanceFor()` / `gridExtentFor()` 是纯函数（可单测），
 * `fitTo()` / `setViewPreset()` 只做装配。
 *
 * ## 测试缺口（如实标注）
 * `WebGLRenderer` 需要真实 WebGL 上下文，**Node 下无法构造**，故 `createScene()` 本身**不做单测**；
 * 但网格朝向这一条契约已抽成 `createBaseGrid()`（由 `test/scene-alignment.test.mjs` 覆盖），
 * 取景距离与网格尺度的换算抽成 `fitDistanceFor()` / `gridExtentFor()`（同一个测试文件覆盖）。
 * 其余视觉与交互（光照、阻尼）交由 GUI 手动验收。
 */

import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * 基座网格的主题配色（`center` = 中心轴线，`grid` = 普通网格线）。
 *
 * 浅色主题不能沿用深色线：`0x334455` 在白底上会糊成一团深灰，既看不出方向也压过机器人本体。
 * 深色两值就是 0.6.3 以来一直在用的那对，浅色两值是它的镜像亮度。
 */
export const GRID_COLORS = Object.freeze({
  light: Object.freeze({ center: 0x9aa7b4, grid: 0xc9d3dd }),
  dark: Object.freeze({ center: 0x334455, grid: 0x223344 }),
})

/**
 * 基座网格：平面与**基座平面 XY** 重合（z=0），网格的 X/Y 方向与基座 X/Y 重合。
 *
 * `GridHelper` 默认在 XZ 面（法线 +Y）；绕 X 轴 `+π/2` 后法线变为 +Z ⇒ 落在 XY 面。
 *
 * @param {number} [size=2] 网格边长（米）
 * @param {number} [divisions=20] 分格数（每格 size/divisions 米）
 * @param {{center: number, grid: number}} [colors=GRID_COLORS.dark] 主题配色（见 `GRID_COLORS`）
 * @returns {GridHelper} 已摆正的网格（直接 add 进场景即可）
 */
export function createBaseGrid(size = 2, divisions = 20, colors = GRID_COLORS.dark) {
  const palette = colors ?? GRID_COLORS.dark
  const grid = new GridHelper(size, divisions, palette.center, palette.grid)
  grid.name = 'base_grid'
  grid.rotation.x = Math.PI / 2
  // 尺寸/分格记在 userData 上：`replaceGrid()` 靠它们判断"要不要重建网格"，
  // `paintBaseGrid()` 靠分格数还原"哪一条是中心轴线"。
  grid.userData.size = size
  grid.userData.divisions = divisions
  return grid
}

/**
 * 就地重刷网格线颜色（**不**重建 `GridHelper`）。
 *
 * 为什么必须"就地"：`GridHelper` 把两条颜色烘进几何体的 `color` 顶点属性，材质是
 * `vertexColors: true` 的 `LineBasicMaterial` —— 改 `material.color` 一点用都没有。
 * 重建网格也能换色，但那会在主题切换（用户点一下设置）时多一次几何体/材质的创建与释放，
 * 且会让"网格只经 `createBaseGrid()` 创建"这条契约变得难以断言。
 *
 * 顶点布局按 three 的 `GridHelper` 源码：对 `i` 从 0 到 `divisions` 每步写 **4 个顶点**
 * （一条 X 向线 + 一条 Z 向线，同色），且 `i === divisions / 2` 那一条用 `color1`（中心轴）。
 *
 * @param {object} grid `createBaseGrid()` 的产物（需要 `userData.divisions`）
 * @param {{center: number, grid: number}} [colors] 主题配色
 * @returns {boolean} 是否真的写入（网格缺几何体/分格数时返回 false）
 */
export function paintBaseGrid(grid, colors = GRID_COLORS.dark) {
  const palette = colors ?? GRID_COLORS.dark
  const attribute = grid?.geometry?.getAttribute?.('color')
  const divisions = grid?.userData?.divisions
  if (!attribute || !Number.isFinite(divisions) || divisions <= 0) return false

  const center = divisions / 2
  const centerColor = new Color(palette.center)
  const gridColor = new Color(palette.grid)
  let painted = false
  for (let i = 0; i <= divisions; i++) {
    const color = i === center ? centerColor : gridColor
    for (let v = 0; v < 4; v++) {
      const index = i * 4 + v
      if (index >= attribute.count) break
      attribute.setXYZ(index, color.r, color.g, color.b)
      painted = true
    }
  }
  attribute.needsUpdate = true
  return painted
}

/**
 * 视角预设：相机相对**取景中心**的方向（会被归一化）。
 *
 * 俯视刻意留一点点水平偏移：`camera.up` 是 +Z，正上方看下去时视线与 up 平行，
 * 叉积退化会让 OrbitControls 的方位角抖动甚至翻转。
 */
/**
 * 相机的初始参数（纯数据，便于单测与统一调整）。
 *
 * `position` 是**取景前**的缺省机位；`fitTo()` 之后相机会被重新摆到按包围球算出的距离上。
 */
export const CAMERA_SPEC = Object.freeze({
  fov: 45,
  near: 0.01,
  far: 100,
  position: Object.freeze([0.8, -0.8, 0.6]),
})

/**
 * 初始光照参数（纯数据）。
 *
 * 强度是按"UR 的 GLB 是 PBR 金属 + 已开 ACES tone mapping + 有 IBL 环境贴图"调过的：
 * 环境贴图负责金属反射，这两盏灯负责方向感与阴影侧补光。
 */
export const SCENE_LIGHTING = Object.freeze({
  ambientIntensity: 0.8,
  directionalIntensity: 1.2,
  directionalPosition: Object.freeze([1, 2, 1]),
})

export const VIEW_PRESETS = {
  iso: { label: '等轴测', direction: [1, -1, 0.8] },
  front: { label: '前视', direction: [0, -1, 0] },
  side: { label: '侧视', direction: [1, 0, 0] },
  top: { label: '俯视', direction: [0.02, -0.02, 1] },
}

/** 默认预设（也是"重置视角"用的那个）。 */
export const DEFAULT_VIEW_PRESET = 'iso'

/** 取景时把包围球放大一点，免得机械臂贴着画布边缘。 */
export const FIT_PADDING = 1.25

/**
 * 让半径为 `radius` 的包围球正好落进视锥所需的相机距离（米）。
 *
 * 垂直与水平两个方向都要装得下，取更远的那个；再用 `padding` 留边。
 * `aspect` 非法（0/NaN）时只按垂直视场算。
 *
 * @param {number} radius 包围球半径（米）
 * @param {number} [fovDeg=45] 垂直视场角（度）
 * @param {number} [aspect=1] 视口宽高比
 * @param {number} [padding=FIT_PADDING] 留边系数（>0）
 * @returns {number} 相机到取景中心的距离（米）
 */
export function fitDistanceFor(radius, fovDeg = 45, aspect = 1, padding = FIT_PADDING) {
  const r = Number.isFinite(radius) && radius > 0 ? radius : 1
  const fov = Number.isFinite(fovDeg) && fovDeg > 0 && fovDeg < 180 ? fovDeg : 45
  const vFov = (fov * Math.PI) / 180
  const vertical = r / Math.sin(vFov / 2)
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * ratio)
  const horizontal = r / Math.sin(hFov / 2)
  const pad = Number.isFinite(padding) && padding > 0 ? padding : FIT_PADDING
  return Math.max(vertical, horizontal) * pad
}

/**
 * 按包围球半径选基座网格的边长与分格数：够覆盖机器人，又不会小到看不出尺度。
 *
 * 边长取"直径 × 1.5"向上取整到一个整齐的数（0.5 的倍数），分格固定每格 ≈0.1 m，
 * 并钳在 [8, 40] 之间（太少看不出方向，太多在远处会摩尔纹）。
 *
 * @param {number} radius 包围球半径（米）
 * @returns {{size: number, divisions: number}}
 */
export function gridExtentFor(radius) {
  const r = Number.isFinite(radius) && radius > 0 ? radius : 1
  const raw = r * 2 * 1.5
  const size = Math.max(0.5, Math.ceil(raw * 2) / 2) // 0.5 m 的倍数
  const divisions = Math.min(40, Math.max(8, Math.round(size / 0.1)))
  return { size, divisions }
}

/**
 * 在给定 canvas 上装配渲染场景。
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options]
 * @param {number} [options.maxPixelRatio=2] 设备像素比上限（HiDPI 清晰度 / 填充率的折中）
 * @param {'light'|'dark'} [options.theme='dark'] 当前主题（由 `src/client/theme.js` 的
 *        `resolveTheme()` 判定）。只影响基座网格线颜色 —— 画布本身是 `alpha: true`，
 *        背景由面板 CSS 负责，所以主题切换时 WebGL 侧只需要重刷这一处。
 * @param {(canvas: HTMLCanvasElement) => object} [options.rendererFactory]
 *        渲染器工厂，**仅供单测注入**（真实路径用 `WebGLRenderer`）。
 * @returns {{renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera,
 *            controls: OrbitControls, grid: GridHelper, resize: () => boolean, render: () => void,
 *            fitTo: (object: object, options?: {padding?: number}) => boolean,
 *            setViewPreset: (name: string) => boolean,
 *            applyTheme: (theme: string) => boolean,
 *            onCameraChange: (listener: () => void) => void,
 *            dispose: () => void}}
 */
export function createScene(canvas, { maxPixelRatio = 2, rendererFactory, theme = 'dark' } = {}) {
  // `rendererFactory` 是给**单测**留的注入点：真实 `WebGLRenderer` 需要 WebGL 上下文，
  // 而 Node 里没有。注入一个假 renderer 之后，本函数剩下的部分（光照、网格、相机、
  // controls 参数）就都能被断言了 —— 这正是清单第 21 条要解决的"createScene 无单测"。
  const renderer = typeof rendererFactory === 'function'
    ? rendererFactory(canvas)
    : new WebGLRenderer({ canvas, antialias: true, alpha: true })
  /*
   * 电影级 tone mapping + 一张程序生成的环境贴图（IBL）。
   *
   * UR 的 GLB 是 PBR 金属材质：只给平行光 + 环境光时，金属没有可反射的环境，会渲染成
   * 一片发灰发平的塑料。`RoomEnvironment` 是 three 自带的程序化房间，**不需要下载任何
   * HDR 资源**就能给出可信的金属反射 —— 对一个随包分发的桌面应用来说这点很重要。
   */
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const scene = new Scene()
  let environment = null
  let pmrem = null
  try {
    // ⚠️ `PMREMGenerator` 的**构造**本身就需要真实 renderer（它要读渲染目标能力），
    // 所以它必须和 `fromScene` 一起待在 try 里。放在外面的话，注入假 renderer 的单测
    // 会在这里直接抛错，"没有浮点渲染目标就退回纯灯光"这条降级路径也就永远走不到。
    pmrem = new PMREMGenerator(renderer)
    environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = environment.texture
  } catch {
    // 没有浮点渲染目标等扩展的环境（或单测里的假 renderer）：退回纯灯光，绝不能因此建不出场景。
    environment = null
    pmrem = null
  }
  const camera = new PerspectiveCamera(CAMERA_SPEC.fov, 1, CAMERA_SPEC.near, CAMERA_SPEC.far)
  camera.up.set(0, 0, 1) // 世界 Z 向上 = 基座 Z 向上
  camera.position.set(...CAMERA_SPEC.position)

  let currentTheme = theme === 'light' ? 'light' : 'dark'
  let gridColors = GRID_COLORS[currentTheme] ?? GRID_COLORS.dark
  let grid = createBaseGrid(2, 20, gridColors)
  scene.add(new AmbientLight(0xffffff, SCENE_LIGHTING.ambientIntensity))
  const dir = new DirectionalLight(0xffffff, SCENE_LIGHTING.directionalIntensity)
  dir.position.set(...SCENE_LIGHTING.directionalPosition)
  scene.add(dir)
  scene.add(grid)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.target.set(0, 0, 0.3)
  // 没有这两条时用户可以把相机缩到机械臂内部、或推到看不见的地方，且没有任何办法回来
  // （只能收起再展开面板）。真实区间由 `fitTo()` 按机型覆盖，这里只是 `fitTo()` 之前的兜底。
  controls.minDistance = 0.15
  controls.maxDistance = 6

  /**
   * 最近一次 `fitTo()` 的结果。`setViewPreset()` 只改相机方向、不改这个中心与半径，
   * 所以"重置视角"和四个预设切换都能落在同一个画面上，不会越切越偏。
   * @type {{center: Vector3, radius: number, padding: number}|null}
   */
  let fit = null

  /** 相机被动过的通知口（面板据此把"该重画一帧"标脏，见 twin-panel 的按需渲染）。 */
  const cameraChangeListeners = new Set()
  controls.addEventListener?.('change', () => {
    for (const listener of cameraChangeListeners) {
      try {
        listener()
      } catch {
        /* 监听者自身的问题不得影响控制器 */
      }
    }
  })

  /** 换掉基座网格：旧的要释放几何体/材质，否则每次换机型都会漏一份。 */
  function replaceGrid(radius) {
    const { size, divisions } = gridExtentFor(radius)
    if (grid?.userData?.size === size && grid?.userData?.divisions === divisions) return
    if (grid) {
      scene.remove(grid)
      try {
        grid.geometry?.dispose?.()
        grid.material?.dispose?.()
      } catch {
        /* 释放失败不应影响后续 */
      }
    }
    // 用**当前主题**的配色重建：换机型与切主题共用同一条创建路径，颜色不会各自漂移。
    grid = createBaseGrid(size, divisions, gridColors)
    grid.userData.size = size
    grid.userData.divisions = divisions
    scene.add(grid)
  }

  /**
   * 切换到另一个主题：就地重刷网格线颜色。
   *
   * 只重刷颜色、不重建场景，也不碰相机/模型 —— 调用方（面板）在主题变化时调用它即可。
   * 面板 CSS 那一半由 `body[data-ds-dark-theme]` 自动完成，这里只补 WebGL 侧读不到 CSS 的部分。
   *
   * @param {'light'|'dark'} next
   * @returns {boolean} 是否真的换了（同主题重复调用返回 false，调用方可据此跳过重画）
   */
  function applyTheme(next) {
    const wanted = next === 'light' ? 'light' : 'dark'
    if (wanted === currentTheme) return false
    currentTheme = wanted
    gridColors = GRID_COLORS[currentTheme] ?? GRID_COLORS.dark
    if (grid) paintBaseGrid(grid, gridColors)
    return true
  }

  /**
   * 视口尺寸（CSS 像素）→ 渲染尺寸。
   *
   * **必须设 devicePixelRatio**：three 的默认 `_pixelRatio` 是 1，不设置的话在 HiDPI 屏上
   * 画面会按 CSS 像素渲染再被拉伸 ⇒ 明显发虚。
   *
   * @returns {boolean} 是否真的按新尺寸渲染（尺寸为 0 时返回 false，调用方可据此重试）
   */
  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas
    if (w === 0 || h === 0) return false
    const dpr = Math.min(
      maxPixelRatio,
      Math.max(1, (typeof globalThis !== 'undefined' && globalThis.devicePixelRatio) || 1),
    )
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    return true
  }

  /**
   * 把相机对准一个物体：从它的包围盒推出取景中心与半径，再按当前视口摆到默认预设上。
   *
   * 为什么用**当前**包围盒而不是机型的理论可达范围：用户点"重置视角"时想看的是
   * "眼下这台机器人"，而不是一个巨大的空球。包围盒退化（模型还没摆好姿态 / 空节点）时
   * 退回一个 0.5 m 的球，保证仍然能看到东西、而不是把相机丢到无穷远。
   *
   * `minRadius` 是**绝对取景**的下限：给了它，取景半径取 `max(实测包围球, minRadius)`。
   * 用途是"同一把尺子"—— 每换一个型号都按它自己的包围盒取景，画面上每个型号都撑满，
   * **机型大小与可达范围的差异就永远看不见**（用户 2026-10-12 反馈的正是这个）。
   * 调用方在需要横向比较时传入一个固定的参考半径即可，网格也会随之变成固定刻度。
   *
   * @param {object} object 已装配的模型根（`handle.root`）
   * @param {{padding?: number, minRadius?: number}} [options]
   * @returns {boolean} 是否成功取景（物体为空/无几何时为 false）
   */
  function fitTo(object, { padding = FIT_PADDING, minRadius = 0 } = {}) {
    if (!object) return false
    object.updateMatrixWorld?.(true)
    let sphere = null
    try {
      const box = new Box3().setFromObject(object)
      if (!box.isEmpty()) sphere = box.getBoundingSphere(new Sphere())
    } catch {
      sphere = null
    }
    const measured = sphere && Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 0.5
    const floor = Number.isFinite(minRadius) && minRadius > 0 ? minRadius : 0
    const radius = Math.max(measured, floor)
    const center = sphere ? sphere.center.clone() : new Vector3(0, 0, 0.3)
    fit = { center, radius, padding }
    replaceGrid(radius)
    controls.minDistance = radius * 0.15
    controls.maxDistance = radius * 12
    camera.near = Math.max(0.001, radius / 100)
    camera.far = Math.max(10, radius * 100)
    camera.updateProjectionMatrix()
    return setViewPreset(DEFAULT_VIEW_PRESET)
  }

  /**
   * 把相机放到某个预设方向上看同一个取景中心。
   *
   * @param {string} name `VIEW_PRESETS` 的键；未知键退回默认预设
   * @returns {boolean} 是否生效（还没 `fitTo()` 过时为 false，调用方据此忽略点击）
   */
  function setViewPreset(name) {
    if (fit === null) return false
    const preset = VIEW_PRESETS[name] ?? VIEW_PRESETS[DEFAULT_VIEW_PRESET]
    const direction = new Vector3(...preset.direction).normalize()
    const distance = fitDistanceFor(fit.radius, camera.fov, camera.aspect, fit.padding)
    controls.target.copy(fit.center)
    camera.position.copy(fit.center).addScaledVector(direction, distance)
    camera.lookAt(fit.center)
    controls.update()
    return true
  }

  /** 每帧调用：阻尼更新 + 渲染。 */
  function render() {
    controls.update()
    renderer.render(scene, camera)
  }

  /**
   * 释放控制器、场景内自带几何体与**渲染上下文**。
   *
   * ⚠️ `renderer.dispose()` **不会**释放 WebGL 上下文（r180 里它只丢掉内部缓存并摘掉自己
   * 装的 context-lost 监听）；必须再调 `forceContextLoss()`。否则每次展开/收起面板都会
   * 留下一个活着的上下文，浏览器上限（约 16 个）一到就开始回收最老的 —— 表现是孪生面板
   * 或其它 WebGL 视图（例如任务看板）变黑。
   *
   * `GridHelper` 自带可释放的 BufferGeometry/LineBasicMaterial，之前从未被释放。
   */
  function dispose() {
    controls.dispose()
    cameraChangeListeners.clear()
    try {
      grid?.geometry?.dispose?.()
      grid?.material?.dispose?.()
    } catch {
      /* 释放失败不应影响后续清理 */
    }
    if (grid) scene.remove(grid)
    grid = null
    // 环境贴图与 PMREM 生成器各自持有 GPU 资源；不释放的话每次展开/收起都漏一份。
    try {
      environment?.dispose?.()
      pmrem?.dispose?.()
    } catch {
      /* 释放失败不应影响后续清理 */
    }
    environment = null
    try {
      renderer.forceContextLoss?.()
    } catch {
      /* 某些环境（无扩展）不支持 */
    }
    renderer.dispose()
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    get grid() {
      return grid
    },
    /**
     * 最近一次 `fitTo()` 算出的包围球半径（米）；还没取景过时返回 0。
     *
     * 暴露它是为了让调用方按模型尺度调整自己的装饰物（例如 TCP 坐标轴的轴长）——
     * `fitTo` 的返回值刻意保持 boolean，不去改动既有的"是否生效"语义。
     */
    currentFitRadius() {
      return fit?.radius ?? 0
    },
    resize,
    render,
    fitTo,
    setViewPreset,
    applyTheme,
    onCameraChange(listener) {
      cameraChangeListeners.add(listener)
    },
    dispose,
  }
}
