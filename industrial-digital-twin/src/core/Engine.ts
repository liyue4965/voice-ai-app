import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GeometryType, MeshMaterial } from '../types'

// 检测 WebGL 支持
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (e) {
    return false
  }
}

export class Engine {
  private container: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer | null = null
  private orbitControls: OrbitControls | null = null
  private transformControls: TransformControls | null = null
  private gltfLoader!: GLTFLoader
  private webglFailed = false
  
  // 对象映射
  private objectMap: Map<string, THREE.Object3D> = new Map()
  
  // 事件回调
  public onSelectionChange: ((id: string | null) => void) | null = null
  public onObjectAdd: ((id: string, obj: THREE.Object3D) => void) | null = null
  public onObjectRemove: ((id: string) => void) | null = null
  public onRender: (() => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.gltfLoader = new GLTFLoader()
    
    // 检查 WebGL 支持
    if (!isWebGLAvailable()) {
      this.webglFailed = true
      this.showWebGLError()
      return
    }
    
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a14)
    
    // 创建相机
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(10, 10, 10)
    
    // 创建渲染器
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      })
      this.renderer.setSize(container.clientWidth, container.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1
      container.appendChild(this.renderer.domElement)
    } catch (e) {
      this.webglFailed = true
      this.showWebGLError()
      return
    }
    
    // 轨道控制器
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05
    
    // 变换控制器
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement)
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
      }
    })
    this.scene.add(this.transformControls)
    
    // 添加默认光照
    this.setupDefaultLights()
    
    // 添加辅助网格
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    this.scene.add(gridHelper)
    
    // 坐标轴
    const axesHelper = new THREE.AxesHelper(5)
    this.scene.add(axesHelper)
    
    // 窗口大小调整
    window.addEventListener('resize', this.handleResize.bind(this))
    
    // 开始渲染循环
    this.animate()
  }

  private setupDefaultLights() {
    // 环境光
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)
    
    // 主方向光
    const directional = new THREE.DirectionalLight(0xffffff, 1)
    directional.position.set(10, 20, 10)
    directional.castShadow = true
    directional.shadow.mapSize.width = 2048
    directional.shadow.mapSize.height = 2048
    this.scene.add(directional)
    
    // 补光
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
    fill.position.set(-10, 5, -10)
    this.scene.add(fill)
  }

  private handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer?.setSize(width, height)
  }

  private animate() {
    if (this.webglFailed || !this.renderer || !this.orbitControls) return
    requestAnimationFrame(this.animate.bind(this))
    this.orbitControls.update()
    this.onRender?.()
    this.renderer.render(this.scene, this.camera)
  }

  private showWebGLError() {
    this.container.innerHTML = `
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
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">🖥️</div>
        <div style="font-size: 18px; margin-bottom: 12px; color: #eee;">WebGL 不可用</div>
        <div style="font-size: 13px; line-height: 1.6; max-width: 400px;">
          您的浏览器不支持 WebGL，无法显示 3D 内容。<br><br>
          请尝试：<br>
          • 使用 Chrome、Firefox 或 Edge 浏览器<br>
          • 启用硬件加速<br>
          • 更新显卡驱动<br>
          • 在本地电脑运行本项目
        </div>
      </div>
    `
  }

  // 创建几何体
  createGeometry(type: GeometryType, params: Record<string, number> = {}): THREE.BufferGeometry {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1
        )
      case 'sphere':
        return new THREE.SphereGeometry(
          params.radius || 0.5,
          params.segments || 32,
          params.segments || 32
        )
      case 'cylinder':
        return new THREE.CylinderGeometry(
          params.radius || 0.5,
          params.radius || 0.5,
          params.height || 1,
          params.segments || 32
        )
      case 'cone':
        return new THREE.ConeGeometry(
          params.radius || 0.5,
          params.height || 1,
          params.segments || 32
        )
      case 'torus':
        return new THREE.TorusGeometry(
          params.radius || 0.5,
          params.tube || 0.2,
          params.segments || 16,
          params.segments || 32
        )
      case 'plane':
        return new THREE.PlaneGeometry(
          params.width || 1,
          params.height || 1
        )
      default:
        return new THREE.BoxGeometry(1, 1, 1)
    }
  }

  // 创建材质
  createMaterial(type: string, params: Partial<MeshMaterial>): THREE.Material {
    const color = new THREE.Color(params.color || '#888888')
    
    switch (type) {
      case 'basic':
        return new THREE.MeshBasicMaterial({ 
          color, 
          wireframe: params.wireframe || false 
        })
      case 'phong':
        return new THREE.MeshPhongMaterial({
          color,
          emissive: new THREE.Color(params.emissive || '#000000'),
          shininess: params.roughness ? (1 - params.roughness) * 100 : 30,
          transparent: params.transparent || false,
          opacity: params.opacity ?? 1
        })
      case 'standard':
        return new THREE.MeshStandardMaterial({
          color,
          metalness: params.metalness ?? 0,
          roughness: params.roughness ?? 0.5,
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
        return new THREE.MeshStandardMaterial({ color })
    }
  }

  // 添加对象到场景
  addObject(id: string, object: THREE.Object3D): void {
    this.objectMap.set(id, object)
    this.scene.add(object)
    this.onObjectAdd?.(id, object)
  }

  // 从场景移除对象
  removeObject(id: string): void {
    const object = this.objectMap.get(id)
    if (object) {
      this.scene.remove(object)
      this.objectMap.delete(id)
      this.onObjectRemove?.(id)
    }
  }

  // 获取对象
  getObject(id: string): THREE.Object3D | undefined {
    return this.objectMap.get(id)
  }

  // 选择对象
  selectObject(id: string | null): void {
    if (id) {
      const object = this.objectMap.get(id)
      if (object && this.transformControls) {
        this.transformControls.attach(object)
      }
    } else {
      this.transformControls?.detach()
    }
    this.onSelectionChange?.(id)
  }

  // 更新变换模式
  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformControls?.setMode(mode)
  }

  // 加载GLTF模型
  loadGLTF(url: string, onLoad: (gltf: THREE.Group) => void, onError?: (error: Error) => void): void {
    this.gltfLoader.load(url, (gltf) => {
      onLoad(gltf.scene)
    }, undefined, (error) => {
      onError?.(error as Error)
    })
  }

  // 导入GLTF到场景
  importGLTF(url: string): Promise<{ id: string; object: THREE.Group }> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, (gltf) => {
        const id = `gltf_${Date.now()}`
        this.addObject(id, gltf.scene)
        resolve({ id, object: gltf.scene })
      }, undefined, (error) => {
        reject(error)
      })
    })
  }

  // 更新对象属性
  updateObjectProperty(id: string, property: string, value: any): void {
    const object = this.objectMap.get(id)
    if (!object) return

    switch (property) {
      case 'position':
        if (value instanceof THREE.Vector3) {
          object.position.copy(value)
        }
        break
      case 'rotation':
        if (value instanceof THREE.Euler) {
          object.rotation.copy(value)
        }
        break
      case 'scale':
        if (value instanceof THREE.Vector3) {
          object.scale.copy(value)
        }
        break
      case 'visible':
        object.visible = value
        break
      case 'name':
        object.name = value
        break
    }
  }

  // 设置背景色
  setBackgroundColor(color: string): void {
    if (this.scene.background) {
      this.scene.background = new THREE.Color(color)
    }
  }

  // 导出场景为GLTF
  exportGLTF(onSuccess: (gltf: THREE.Scene) => void): void {
    onSuccess(this.scene)
  }

  // 获取相机
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  // 获取渲染器
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer
  }

  // 获取DOM元素
  getDomElement(): HTMLCanvasElement | null {
    return this.renderer?.domElement || null
  }

  // 销毁引擎
  dispose(): void {
    this.renderer?.dispose()
    this.orbitControls?.dispose()
    this.transformControls?.dispose()
    window.removeEventListener('resize', this.handleResize.bind(this))
  }
}
