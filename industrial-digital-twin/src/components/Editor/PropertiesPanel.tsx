import { useState, useEffect } from 'react'
import { useSceneStore } from '../../stores'
import type { SceneObject, MeshObject, LightObject, MeshMaterial } from '../../types'
import * as THREE from 'three'

interface PropertiesPanelProps {
  object: SceneObject
}

export function PropertiesPanel({ object }: PropertiesPanelProps) {
  const { updateObject } = useSceneStore()
  
  // 确保值是原始类型
  const getNumber = (val: any) => {
    if (typeof val === 'number') return val
    if (val && typeof val === 'object' && 'isVector3' in val) return (val as THREE.Vector3).x
    if (val && typeof val === 'object' && 'isEuler' in val) return (val as THREE.Euler).x
    return 0
  }
  
  const [localValues, setLocalValues] = useState({
    name: String(object.name || ''),
    position: { x: getNumber(object.position), y: getNumber(object.position), z: getNumber(object.position) },
    rotation: { x: getNumber(object.rotation), y: getNumber(object.rotation), z: getNumber(object.rotation) },
    scale: { x: getNumber(object.scale) || 1, y: getNumber(object.scale) || 1, z: getNumber(object.scale) || 1 },
    visible: Boolean(object.visible)
  })

  useEffect(() => {
    setLocalValues({
      name: String(object.name || ''),
      position: { x: getNumber(object.position), y: getNumber(object.position), z: getNumber(object.position) },
      rotation: { x: getNumber(object.rotation), y: getNumber(object.rotation), z: getNumber(object.rotation) },
      scale: { x: getNumber(object.scale) || 1, y: getNumber(object.scale) || 1, z: getNumber(object.scale) || 1 },
      visible: Boolean(object.visible)
    })
  }, [object.id])

  const handleChange = (field: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [field]: value }))
  }

  const handleBlur = () => {
    // 提交更改
    updateObject(object.id, {
      name: localValues.name,
      position: new THREE.Vector3(
        localValues.position.x,
        localValues.position.y,
        localValues.position.z
      ),
      rotation: new THREE.Euler(
        localValues.rotation.x,
        localValues.rotation.y,
        localValues.rotation.z
      ),
      scale: new THREE.Vector3(
        localValues.scale.x,
        localValues.scale.y,
        localValues.scale.z
      ),
      visible: localValues.visible
    })
  }

  const isMesh = object.type === 'mesh'
  const isLight = object.type === 'light'

  return (
    <div className="properties-panel">
      <div className="sidebar-title">属性</div>
      <div className="sidebar-content">
        {/* 基本信息 */}
        <div className="property-group">
          <div className="property-group-title">基本信息</div>
          <div className="property-row">
            <label className="property-label">名称</label>
            <input
              type="text"
              className="property-input"
              value={localValues.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={handleBlur}
            />
          </div>
          <div className="property-row">
            <label className="property-label">类型</label>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {object.type}
              {isMesh && ` (${(object as MeshObject).geometryType})`}
              {isLight && ` (${(object as LightObject).lightType})`}
            </span>
          </div>
          <div className="property-row">
            <label className="property-label">可见</label>
            <input
              type="checkbox"
              checked={localValues.visible}
              onChange={(e) => {
                handleChange('visible', e.target.checked)
                updateObject(object.id, { visible: e.target.checked })
              }}
            />
          </div>
        </div>

        {/* 变换 */}
        <div className="property-group">
          <div className="property-group-title">变换</div>
          
          <div className="property-row">
            <label className="property-label">位置</label>
            <div className="property-vector">
              <input
                type="number"
                className="property-input"
                value={localValues.position.x}
                onChange={(e) => handleChange('position', { ...localValues.position, x: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.position.y}
                onChange={(e) => handleChange('position', { ...localValues.position, y: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.position.z}
                onChange={(e) => handleChange('position', { ...localValues.position, z: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
            </div>
          </div>

          <div className="property-row">
            <label className="property-label">旋转</label>
            <div className="property-vector">
              <input
                type="number"
                className="property-input"
                value={localValues.rotation.x}
                onChange={(e) => handleChange('rotation', { ...localValues.rotation, x: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.rotation.y}
                onChange={(e) => handleChange('rotation', { ...localValues.rotation, y: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.rotation.z}
                onChange={(e) => handleChange('rotation', { ...localValues.rotation, z: parseFloat(e.target.value) || 0 })}
                onBlur={handleBlur}
                step="0.1"
              />
            </div>
          </div>

          <div className="property-row">
            <label className="property-label">缩放</label>
            <div className="property-vector">
              <input
                type="number"
                className="property-input"
                value={localValues.scale.x}
                onChange={(e) => handleChange('scale', { ...localValues.scale, x: parseFloat(e.target.value) || 1 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.scale.y}
                onChange={(e) => handleChange('scale', { ...localValues.scale, y: parseFloat(e.target.value) || 1 })}
                onBlur={handleBlur}
                step="0.1"
              />
              <input
                type="number"
                className="property-input"
                value={localValues.scale.z}
                onChange={(e) => handleChange('scale', { ...localValues.scale, z: parseFloat(e.target.value) || 1 })}
                onBlur={handleBlur}
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* 材质属性（仅网格） */}
        {isMesh && (
          <MaterialProperties object={object as MeshObject} />
        )}

        {/* 光源属性（仅光源） */}
        {isLight && (
          <LightProperties object={object as LightObject} />
        )}
      </div>
    </div>
  )
}

function MaterialProperties({ object }: { object: MeshObject }) {
  const { updateObject } = useSceneStore()
  const material = object.material

  const updateMaterial = (updates: Partial<MeshMaterial>) => {
    updateObject(object.id, {
      material: { ...material, ...updates }
    } as any)
  }

  return (
    <div className="property-group">
      <div className="property-group-title">材质</div>
      
      <div className="property-row">
        <label className="property-label">颜色</label>
        <input
          type="color"
          className="property-input"
          value={material.color}
          onChange={(e) => updateMaterial({ color: e.target.value })}
          style={{ padding: 0, height: 28 }}
        />
      </div>

      <div className="property-row">
        <label className="property-label">自发光</label>
        <input
          type="color"
          className="property-input"
          value={material.emissive || '#000000'}
          onChange={(e) => updateMaterial({ emissive: e.target.value })}
          style={{ padding: 0, height: 28 }}
        />
      </div>

      <div className="property-row">
        <label className="property-label">金属度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={material.metalness ?? 0}
          onChange={(e) => updateMaterial({ metalness: parseFloat(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ width: 40, textAlign: 'right', fontSize: 11 }}>
          {((material.metalness ?? 0) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="property-row">
        <label className="property-label">粗糙度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={material.roughness ?? 0.5}
          onChange={(e) => updateMaterial({ roughness: parseFloat(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ width: 40, textAlign: 'right', fontSize: 11 }}>
          {((material.roughness ?? 0.5) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="property-row">
        <label className="property-label">透明度</label>
        <input
          type="checkbox"
          checked={material.transparent}
          onChange={(e) => updateMaterial({ transparent: e.target.checked })}
        />
        {material.transparent && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={material.opacity ?? 1}
            onChange={(e) => updateMaterial({ opacity: parseFloat(e.target.value) })}
            style={{ flex: 1 }}
          />
        )}
      </div>

      <div className="property-row">
        <label className="property-label">线框</label>
        <input
          type="checkbox"
          checked={material.wireframe}
          onChange={(e) => updateMaterial({ wireframe: e.target.checked })}
        />
      </div>
    </div>
  )
}

function LightProperties({ object }: { object: LightObject }) {
  const { updateObject } = useSceneStore()

  return (
    <div className="property-group">
      <div className="property-group-title">光源</div>
      
      <div className="property-row">
        <label className="property-label">颜色</label>
        <input
          type="color"
          className="property-input"
          value={object.color}
          onChange={(e) => updateObject(object.id, { color: e.target.value } as any)}
          style={{ padding: 0, height: 28 }}
        />
      </div>

      <div className="property-row">
        <label className="property-label">强度</label>
        <input
          type="number"
          className="property-input"
          value={object.intensity}
          onChange={(e) => updateObject(object.id, { intensity: parseFloat(e.target.value) } as any)}
          step="0.1"
          min="0"
        />
      </div>

      {object.lightType === 'point' && (
        <div className="property-row">
          <label className="property-label">距离</label>
          <input
            type="number"
            className="property-input"
            value={object.distance || 100}
            onChange={(e) => updateObject(object.id, { distance: parseFloat(e.target.value) } as any)}
            step="1"
            min="0"
          />
        </div>
      )}

      <div className="property-row">
        <label className="property-label">阴影</label>
        <input
          type="checkbox"
          checked={object.castShadow}
          onChange={(e) => updateObject(object.id, { castShadow: e.target.checked } as any)}
        />
      </div>
    </div>
  )
}
