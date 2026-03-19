import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface PreviewProps {
  sceneData: any
  onExit: () => void
}

type ViewMode = 'orbit' | 'firstPerson' | 'flythrough'

export function Preview({ sceneData, onExit }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<any>(null)
  const frameIdRef = useRef<number>(0)
  
  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [showStats, setShowStats] = useState(true)
  const [fps, setFps] = useState(0)
  const [info, setInfo] = useState({ objects: 0, triangles: 0 })
  
  const lastTimeRef = useRef(performance.now())
  const framesRef = useRef(0)

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!containerRef.current) return

    // 检查 WebGL 支持
    try {
      const canvas = document.createElement('canvas')
      if (!window.WebGLRenderingContext || (!canvas.getContext('webgl') && !canvas.getContext('experimental-webgl'))) {
        containerRef.current.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #a0a0a0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
            background: #0a0a14;
          ">
            <div style="font-size: 48px; margin-bottom: 20px;">🖥️</div>
            <div style="font-size: 18px; margin-bottom: 12px; color: #eee;">WebGL 不可用</div>
            <div style="font-size: 13px; line-height: 1.6; max-width: 400px;">
              预览功能需要 WebGL 支持。<br><br>
              请尝试：<br>
              • 使用 Chrome、Firefox 或 Edge 浏览器<br>
              • 启用硬件加速<br>
              • 在有 GPU 的电脑上运行<br><br>
              <button onclick="history.back()" style="
                padding: 8px 16px;
                background: #e94560;
                border: none;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-size: 13px;
              ">返回编辑器</button>
            </div>
          </div>
        `
        return
      }
    } catch (e) {
      console.error('WebGL check failed:', e)
    }

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // 场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(sceneData.settings?.backgroundColor || '#0a0a14')
    sceneRef.current = scene

    // 相机
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(10, 10, 10)
    cameraRef.current = camera

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 控制器
    const orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.05
    orbitControls.target.set(0, 0, 0)
    controlsRef.current = orbitControls

    // 光照
    setupLights(scene)

    // 辅助网格
    if (sceneData.settings?.gridHelper) {
      const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
      scene.add(grid)
    }

    // 坐标轴
    if (sceneData.settings?.axesHelper) {
      const axes = new THREE.AxesHelper(5)
      scene.add(axes)
    }

    // 创建场景对象
    createSceneObjects(scene, sceneData)

    // 统计信息
    let totalObjects = 0
    let totalTriangles = 0
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        totalObjects++
        if (obj.geometry) {
          const geo = obj.geometry
          if (geo.index) {
            totalTriangles += geo.index.count / 3
          } else if (geo.attributes?.position) {
            totalTriangles += geo.attributes.position.count / 3
          }
        }
      }
    })
    setInfo({ objects: totalObjects, triangles: Math.floor(totalTriangles) })

    // 渲染循环
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      
      // FPS 计算
      framesRef.current++
      const now = performance.now()
      if (now - lastTimeRef.current >= 1000) {
        setFps(framesRef.current)
        framesRef.current = 0
        lastTimeRef.current = now
      }

      // 更新控制器
      if (viewMode === 'orbit' && orbitControls) {
        orbitControls.update()
      }

      renderer.render(scene, camera)
    }
    animate()

    // 窗口大小调整
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameIdRef.current)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // 切换视图模式
  useEffect(() => {
    if (!cameraRef.current || !rendererRef.current || !containerRef.current) return

    // 清理旧控制器
    if (controlsRef.current) {
      if (controlsRef.current instanceof OrbitControls) {
        controlsRef.current.dispose()
      } else if (controlsRef.current instanceof PointerLockControls) {
        controlsRef.current.dispose()
      }
    }

    const camera = cameraRef.current
    const renderer = rendererRef.current
    const container = containerRef.current

    if (viewMode === 'orbit') {
      const orbitControls = new OrbitControls(camera, renderer.domElement)
      orbitControls.enableDamping = true
      orbitControls.dampingFactor = 0.05
      controlsRef.current = orbitControls
    } else if (viewMode === 'firstPerson') {
      const pointerControls = new PointerLockControls(camera, renderer.domElement)
      controlsRef.current = pointerControls
      pointerControls.lock()
    }
  }, [viewMode])

  const setupLights = (scene: THREE.Scene) => {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffffff, 1)
    directional.position.set(10, 20, 10)
    directional.castShadow = true
    directional.shadow.mapSize.width = 2048
    directional.shadow.mapSize.height = 2048
    scene.add(directional)

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
    fill.position.set(-10, 5, -10)
    scene.add(fill)
  }

  const createSceneObjects = (scene: THREE.Scene, data: any) => {
    const objectMap = new Map<string, THREE.Object3D>()

    // 先创建所有对象
    Object.values(data.objects).forEach((obj: any) => {
      let mesh: THREE.Object3D | null = null

      if (obj.type === 'mesh') {
        const geometry = createGeometry(obj.geometryType || 'box', obj.geometry || {})
        const material = createMaterial(obj.materialType || 'standard', obj.material || {}) as any
        mesh = new THREE.Mesh(geometry, material)
        if (obj.material?.wireframe) {
          material.wireframe = true
        }
      } else if (obj.type === 'light') {
        mesh = createLight(obj)
      } else if (obj.type === 'group') {
        mesh = new THREE.Group()
      }

      if (mesh) {
        mesh.name = obj.name
        mesh.position.set(
          obj.position?.x || 0,
          obj.position?.y || 0,
          obj.position?.z || 0
        )
        mesh.rotation.set(
          obj.rotation?.x || 0,
          obj.rotation?.y || 0,
          obj.rotation?.z || 0
        )
        mesh.scale.set(
          obj.scale?.x || 1,
          obj.scale?.y || 1,
          obj.scale?.z || 1
        )
        mesh.visible = obj.visible !== false
        scene.add(mesh)
        objectMap.set(obj.id, mesh)
      }
    })

    // 设置父子关系
    Object.values(data.objects).forEach((obj: any) => {
      if (obj.parentId && objectMap.has(obj.parentId)) {
        const parent = objectMap.get(obj.parentId)
        const child = objectMap.get(obj.id)
        if (parent && child && parent instanceof THREE.Group) {
          parent.add(child)
        }
      }
    })
  }

  const createGeometry = (type: string, params: any): THREE.BufferGeometry => {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(params.width || 1, params.height || 1, params.depth || 1)
      case 'sphere':
        return new THREE.SphereGeometry(params.radius || 0.5, 32, 32)
      case 'cylinder':
        return new THREE.CylinderGeometry(params.radius || 0.5, params.radius || 0.5, params.height || 1, 32)
      case 'cone':
        return new THREE.ConeGeometry(params.radius || 0.5, params.height || 1, 32)
      case 'torus':
        return new THREE.TorusGeometry(params.radius || 0.5, params.tube || 0.2, 16, 32)
      case 'plane':
        return new THREE.PlaneGeometry(params.width || 1, params.height || 1)
      default:
        return new THREE.BoxGeometry(1, 1, 1)
    }
  }

  const createMaterial = (type: string, params: any): THREE.Material => {
    const color = new THREE.Color(params.color || '#888888')
    
    switch (type) {
      case 'basic':
        return new THREE.MeshBasicMaterial({ color, wireframe: params.wireframe || false })
      case 'phong':
        return new THREE.MeshPhongMaterial({
          color,
          emissive: new THREE.Color(params.emissive || '#000000'),
          shininess: params.roughness ? (1 - params.roughness) * 100 : 30,
          transparent: params.transparent || false,
          opacity: params.opacity ?? 1
        })
      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          color,
          metalness: params.metalness ?? 0,
          roughness: params.roughness ?? 0.5,
          transmission: params.transparent ? (params.opacity ?? 0.5) : 0,
          transparent: params.transparent || false,
          opacity: params.opacity ?? 1
        })
      default:
        return new THREE.MeshStandardMaterial({
          color,
          metalness: params.metalness ?? 0,
          roughness: params.roughness ?? 0.5,
          transparent: params.transparent || false,
          opacity: params.opacity ?? 1
        })
    }
  }

  const createLight = (obj: any): THREE.Light => {
    switch (obj.lightType) {
      case 'ambient':
        return new THREE.AmbientLight(obj.color, obj.intensity)
      case 'directional':
        return new THREE.DirectionalLight(obj.color, obj.intensity)
      case 'point':
        return new THREE.PointLight(obj.color, obj.intensity, obj.distance || 100)
      default:
        return new THREE.AmbientLight(0xffffff, 0.5)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a14' }}>
      {/* 顶部工具栏 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: 'rgba(22, 33, 62, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ color: '#eee', fontWeight: 600 }}>预览模式</span>
        
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
        
        {/* 视图模式切换 */}
        <button
          onClick={() => setViewMode('orbit')}
          style={{
            padding: '6px 12px',
            background: viewMode === 'orbit' ? '#e94560' : 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            color: '#eee',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          🖐 轨道
        </button>
        <button
          onClick={() => setViewMode('firstPerson')}
          style={{
            padding: '6px 12px',
            background: viewMode === 'firstPerson' ? '#e94560' : 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            color: '#eee',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          👤 第一人称
        </button>

        <div style={{ flex: 1 }} />
        
        {/* 全屏按钮 */}
        <button
          onClick={toggleFullscreen}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            color: '#eee',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ⛶ 全屏
        </button>
        
        {/* 退出按钮 */}
        <button
          onClick={onExit}
          style={{
            padding: '6px 16px',
            background: '#e94560',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600
          }}
        >
          退出预览
        </button>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        background: 'rgba(22, 33, 62, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 24,
        zIndex: 100,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11,
        color: '#a0a0a0'
      }}>
        <span>🖥 渲染器: WebGL</span>
        <span>📐 物体: {info.objects}</span>
        <span>🔺 面数: {info.triangles.toLocaleString()}</span>
        <span>⚡ FPS: {fps}</span>
        <span style={{ marginLeft: 'auto' }}>{sceneData.name || '未命名场景'}</span>
      </div>

      {/* 第一人称模式提示 */}
      {viewMode === 'firstPerson' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          点击画面锁定鼠标<br />
          WASD 移动 | ESC 退出
        </div>
      )}
    </div>
  )
}
