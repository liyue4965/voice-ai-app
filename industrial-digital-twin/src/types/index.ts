import * as THREE from 'three'

// 场景对象类型
export type SceneObjectType = 
  | 'group'
  | 'mesh'
  | 'light'
  | 'camera'
  | 'helper'

// 几何体类型
export type GeometryType = 
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'
  | 'custom'

// 光源类型
export type LightType = 
  | 'ambient'
  | 'directional'
  | 'point'
  | 'spot'

// 场景对象接口
export interface SceneObject {
  id: string
  name: string
  type: SceneObjectType
  visible: boolean
  locked: boolean
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  parentId: string | null
  children: string[]
  metadata: Record<string, any>
}

// 网格对象（包含材质和几何体）
export interface MeshObject extends SceneObject {
  type: 'mesh'
  geometryType: GeometryType
  materialType: 'basic' | 'standard' | 'phong' | 'physical'
  material: MeshMaterial
  geometry?: GeometryData
}

export interface MeshMaterial {
  color: string
  emissive?: string
  metalness?: number
  roughness: number
  opacity: number
  transparent: boolean
  wireframe: boolean
}

export interface GeometryData {
  width?: number
  height?: number
  depth?: number
  radius?: number
  segments?: number
}

// 光源对象
export interface LightObject extends SceneObject {
  type: 'light'
  lightType: LightType
  color: string
  intensity: number
  distance?: number
  decay?: number
  castShadow: boolean
}

// 场景数据
export interface SceneData {
  id: string
  name: string
  version: string
  createdAt: string
  updatedAt: string
  objects: Record<string, SceneObject | MeshObject | LightObject>
  rootIds: string[]
  settings: SceneSettings
}

export interface SceneSettings {
  backgroundColor: string
  fog?: {
    color: string
    near: number
    far: number
  }
  gridHelper: boolean
  axesHelper: boolean
}

// 数据源
export interface DataSource {
  id: string
  name: string
  type: 'rest' | 'websocket' | 'mqtt'
  url: string
  pollingInterval?: number
  headers?: Record<string, string>
  enabled: boolean
}

// 数据绑定
export interface DataBinding {
  id: string
  sourceId: string
  targetObjectId: string
  targetProperty: string
  expression: string
  enabled: boolean
}

// AI生成请求
export interface AIGenerateRequest {
  imageData?: string
  prompt?: string
  style?: 'realistic' | 'cartoon' | 'technical'
}

// 导出配置
export interface ExportConfig {
  type: 'html' | 'web'
  includeDataBindings: boolean
  minify: boolean
  compress: boolean
}
