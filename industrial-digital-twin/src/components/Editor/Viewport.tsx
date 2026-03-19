import { useEffect, useRef } from 'react'
import { Engine } from '../../core/Engine'
import { useSceneStore, useEditorUIStore } from '../../stores'
import * as THREE from 'three'
import type { MeshObject, LightObject, GeometryType, MeshMaterial } from '../../types'

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  
  const { sceneData, selectedObjectId, selectObject, updateObject, addObject, getObject } = useSceneStore()
  const { activeTool } = useEditorUIStore()

  // 初始化引擎
  useEffect(() => {
    if (!containerRef.current) return

    try {
      const engine = new Engine(containerRef.current)
      engineRef.current = engine

      // 选择变化回调
      engine.onSelectionChange = (id) => {
        selectObject(id)
      }
    } catch (e) {
      console.error('Engine initialization failed:', e)
    }

    return () => {
      engineRef.current?.dispose()
    }
  }, [])

  // 同步场景数据到引擎
  useEffect(() => {
    if (!engineRef.current) return
    const engine = engineRef.current

    // 遍历场景对象并更新
    Object.entries(sceneData.objects).forEach(([id, obj]) => {
      let threeObj = engine.getObject(id)
      
      if (!threeObj) {
        // 创建新对象
        if (obj.type === 'mesh') {
          const meshObj = obj as MeshObject
          const geometry = engine.createGeometry(
            meshObj.geometryType || 'box',
            meshObj.geometry as any || {}
          )
          const material = engine.createMaterial(
            meshObj.materialType || 'standard',
            meshObj.material || {}
          )
          threeObj = new THREE.Mesh(geometry, material as THREE.Material)
        } else if (obj.type === 'light') {
          const lightObj = obj as LightObject
          let light: THREE.Light
          
          switch (lightObj.lightType) {
            case 'ambient':
              light = new THREE.AmbientLight(lightObj.color, lightObj.intensity)
              break
            case 'directional':
              light = new THREE.DirectionalLight(lightObj.color, lightObj.intensity)
              break
            case 'point':
              light = new THREE.PointLight(lightObj.color, lightObj.intensity, lightObj.distance)
              break
            default:
              light = new THREE.AmbientLight(0xffffff, 0.5)
          }
          threeObj = light
        } else if (obj.type === 'group') {
          threeObj = new THREE.Group()
        }

        if (threeObj) {
          engine.addObject(id, threeObj)
        }
      }

      // 更新对象属性
      if (threeObj) {
        engine.updateObjectProperty(id, 'name', obj.name)
        engine.updateObjectProperty(id, 'position', obj.position)
        engine.updateObjectProperty(id, 'rotation', obj.rotation)
        engine.updateObjectProperty(id, 'scale', obj.scale)
        engine.updateObjectProperty(id, 'visible', obj.visible)
      }
    })

    // 处理删除的对象
    const engineObjects = new Set<string>()
    Object.keys(sceneData.objects).forEach(id => engineObjects.add(id))
    
    // 这里可以添加删除逻辑，但需要更复杂的同步机制

  }, [sceneData.objects])

  // 选中对象时附加变换控制器
  useEffect(() => {
    if (!engineRef.current) return
    
    if (selectedObjectId) {
      engineRef.current.selectObject(selectedObjectId)
    } else {
      engineRef.current.selectObject(null)
    }
  }, [selectedObjectId])

  // 工具模式变化
  useEffect(() => {
    if (!engineRef.current) return
    
    switch (activeTool) {
      case 'move':
        engineRef.current.setTransformMode('translate')
        break
      case 'rotate':
        engineRef.current.setTransformMode('rotate')
        break
      case 'scale':
        engineRef.current.setTransformMode('scale')
        break
      default:
        engineRef.current.selectObject(null)
    }
  }, [activeTool])

  // 变换控制器变化时同步到store
  useEffect(() => {
    if (!engineRef.current || !selectedObjectId) return

    const engine = engineRef.current
    const obj = sceneData.objects[selectedObjectId]
    if (!obj) return

    const checkTransform = () => {
      const threeObj = engine.getObject(selectedObjectId)
      if (threeObj) {
        // 检查是否有显著变化
        const posChanged = !threeObj.position.equals(obj.position)
        const rotChanged = !threeObj.rotation.equals(obj.rotation)
        const scaleChanged = !threeObj.scale.equals(obj.scale)

        if (posChanged || rotChanged || scaleChanged) {
          updateObject(selectedObjectId, {
            position: threeObj.position.clone(),
            rotation: threeObj.rotation.clone(),
            scale: threeObj.scale.clone()
          })
        }
      }
      requestAnimationFrame(checkTransform)
    }

    const frameId = requestAnimationFrame(checkTransform)
    return () => cancelAnimationFrame(frameId)
  }, [selectedObjectId])

  return (
    <div className="viewport" ref={containerRef}>
      <div className="viewport-toolbar">
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '4px 8px' }}>
          3D视口
        </span>
      </div>
    </div>
  )
}
