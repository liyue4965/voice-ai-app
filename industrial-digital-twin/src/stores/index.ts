import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as THREE from 'three'
import type { SceneObject, MeshObject, SceneData, SceneSettings, DataSource, DataBinding, GeometryType, MeshMaterial } from '../types'

// 扩展的对象输入类型（包含 Mesh 属性）
interface SceneObjectInput {
  id?: string
  name?: string
  type?: 'mesh' | 'light' | 'group' | 'camera' | 'helper'
  visible?: boolean
  locked?: boolean
  position?: THREE.Vector3
  rotation?: THREE.Euler
  scale?: THREE.Vector3
  parentId?: string | null
  metadata?: Record<string, any>
  // Mesh 特有属性
  geometryType?: GeometryType
  materialType?: 'basic' | 'standard' | 'phong' | 'physical'
  material?: MeshMaterial
}

interface SceneState {
  // 场景数据
  sceneData: SceneData
  selectedObjectId: string | null
  
  // 操作方法
  addObject: (obj: SceneObjectInput) => string
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  selectObject: (id: string | null) => void
  duplicateObject: (id: string) => string | null
  
  // 场景操作
  clearScene: () => void
  loadScene: (data: SceneData) => void
  getSceneData: () => SceneData
  
  // 辅助方法
  getObject: (id: string) => SceneObject | undefined
  getObjectChildren: (id: string) => SceneObject[]
}

const defaultSettings: SceneSettings = {
  backgroundColor: '#0a0a14',
  gridHelper: true,
  axesHelper: true
}

const createDefaultScene = (): SceneData => ({
  id: uuidv4(),
  name: '未命名场景',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  objects: {},
  rootIds: [],
  settings: defaultSettings
})

export const useSceneStore = create<SceneState>((set, get) => ({
  sceneData: createDefaultScene(),
  selectedObjectId: null,

  addObject: (obj) => {
    const id = uuidv4()
    
    // 基础对象属性
    const baseProps = {
      id,
      name: obj.name || `Object_${id.slice(0, 4)}`,
      type: obj.type || 'mesh',
      visible: obj.visible !== undefined ? obj.visible : true,
      locked: obj.locked || false,
      position: obj.position || new THREE.Vector3(0, 0, 0),
      rotation: obj.rotation || new THREE.Euler(0, 0, 0),
      scale: obj.scale || new THREE.Vector3(1, 1, 1),
      parentId: obj.parentId || null,
      children: [],
      metadata: obj.metadata || {}
    }
    
    // 如果是 mesh 类型，添加 geometryType, materialType, material
    let newObj: SceneObject
    if (obj.type === 'mesh') {
      newObj = {
        ...baseProps,
        geometryType: obj.geometryType || 'box',
        materialType: obj.materialType || 'standard',
        material: obj.material || { color: '#888888', metalness: 0, roughness: 0.5, opacity: 1, transparent: false, wireframe: false }
      } as MeshObject
    } else {
      newObj = baseProps
    }

    set((state) => {
      const newObjects = { ...state.sceneData.objects, [id]: newObj }
      const newRootIds = newObj.parentId 
        ? [...state.sceneData.rootIds] 
        : [...state.sceneData.rootIds, id]
      
      // 更新父对象的children
      if (newObj.parentId && newObjects[newObj.parentId]) {
        const parent = newObjects[newObj.parentId] as SceneObject
        newObjects[newObj.parentId] = {
          ...parent,
          children: [...parent.children, id]
        }
      }

      return {
        sceneData: {
          ...state.sceneData,
          objects: newObjects,
          rootIds: newRootIds,
          updatedAt: new Date().toISOString()
        }
      }
    })

    return id
  },

  removeObject: (id) => {
    set((state) => {
      const obj = state.sceneData.objects[id] as SceneObject
      if (!obj) return state

      // 递归删除所有子对象
      const idsToDelete = new Set<string>([id])
      const collectChildren = (parentId: string) => {
        const parent = state.sceneData.objects[parentId] as SceneObject
        if (parent) {
          parent.children.forEach(childId => {
            idsToDelete.add(childId)
            collectChildren(childId)
          })
        }
      }
      collectChildren(id)

      const newObjects = { ...state.sceneData.objects }
      idsToDelete.forEach(deleteId => {
        delete newObjects[deleteId]
      })

      // 从父对象的children中移除
      Object.values(newObjects).forEach(obj => {
        const sceneObj = obj as SceneObject
        const filteredChildren = sceneObj.children.filter(cid => !idsToDelete.has(cid))
        if (filteredChildren.length !== sceneObj.children.length) {
          newObjects[sceneObj.id] = { ...sceneObj, children: filteredChildren }
        }
      })

      return {
        sceneData: {
          ...state.sceneData,
          objects: newObjects,
          rootIds: state.sceneData.rootIds.filter(rid => !idsToDelete.has(rid)),
          updatedAt: new Date().toISOString()
        },
        selectedObjectId: state.selectedObjectId && idsToDelete.has(state.selectedObjectId) 
          ? null 
          : state.selectedObjectId
      }
    })
  },

  updateObject: (id, updates) => {
    set((state) => {
      const obj = state.sceneData.objects[id]
      if (!obj) return state

      return {
        sceneData: {
          ...state.sceneData,
          objects: {
            ...state.sceneData.objects,
            [id]: { ...obj, ...updates }
          },
          updatedAt: new Date().toISOString()
        }
      }
    })
  },

  selectObject: (id) => {
    set({ selectedObjectId: id })
  },

  duplicateObject: (id) => {
    const state = get()
    const obj = state.sceneData.objects[id] as SceneObject
    if (!obj) return null

    const newId = uuidv4()
    const newObj = {
      ...obj,
      id: newId,
      name: `${obj.name}_copy`,
      children: [],
      position: new THREE.Vector3(
        obj.position.x + 1,
        obj.position.y,
        obj.position.z
      )
    }

    set((state) => ({
      sceneData: {
        ...state.sceneData,
        objects: {
          ...state.sceneData.objects,
          [newId]: newObj,
          [id]: { ...obj, children: [...obj.children, newId] }
        },
        rootIds: [...state.sceneData.rootIds, newId],
        updatedAt: new Date().toISOString()
      }
    }))

    return newId
  },

  clearScene: () => {
    set({ 
      sceneData: createDefaultScene(),
      selectedObjectId: null 
    })
  },

  loadScene: (data) => {
    set({ 
      sceneData: data,
      selectedObjectId: null 
    })
  },

  getSceneData: () => {
    return get().sceneData
  },

  getObject: (id) => {
    return get().sceneData.objects[id]
  },

  getObjectChildren: (id) => {
    const obj = get().sceneData.objects[id] as SceneObject
    if (!obj) return []
    return obj.children.map(cid => get().sceneData.objects[cid]).filter(Boolean) as SceneObject[]
  }
}))

// 数据源Store
interface DataState {
  sources: DataSource[]
  bindings: DataBinding[]
  
  addSource: (source: Omit<DataSource, 'id'>) => string
  removeSource: (id: string) => void
  updateSource: (id: string, updates: Partial<DataSource>) => void
  
  addBinding: (binding: Omit<DataBinding, 'id'>) => string
  removeBinding: (id: string) => void
  updateBinding: (id: string, updates: Partial<DataBinding>) => void
}

export const useDataStore = create<DataState>((set) => ({
  sources: [],
  bindings: [],

  addSource: (source) => {
    const id = uuidv4()
    set((state) => ({
      sources: [...state.sources, { ...source, id }]
    }))
    return id
  },

  removeSource: (id) => {
    set((state) => ({
      sources: state.sources.filter(s => s.id !== id),
      bindings: state.bindings.filter(b => b.sourceId !== id)
    }))
  },

  updateSource: (id, updates) => {
    set((state) => ({
      sources: state.sources.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
  },

  addBinding: (binding) => {
    const id = uuidv4()
    set((state) => ({
      bindings: [...state.bindings, { ...binding, id }]
    }))
    return id
  },

  removeBinding: (id) => {
    set((state) => ({
      bindings: state.bindings.filter(b => b.id !== id)
    }))
  },

  updateBinding: (id, updates) => {
    set((state) => ({
      bindings: state.bindings.map(b => b.id === id ? { ...b, ...updates } : b)
    }))
  }
}))

// 编辑器UI状态
interface EditorUIState {
  activeTool: 'select' | 'move' | 'rotate' | 'scale'
  showGrid: boolean
  showAxes: boolean
  isModalOpen: boolean
  modalType: string | null
  
  setActiveTool: (tool: 'select' | 'move' | 'rotate' | 'scale') => void
  toggleGrid: () => void
  toggleAxes: () => void
  openModal: (type: string) => void
  closeModal: () => void
}

export const useEditorUIStore = create<EditorUIState>((set) => ({
  activeTool: 'select',
  showGrid: true,
  showAxes: true,
  isModalOpen: false,
  modalType: null,

  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),
  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: null })
}))
