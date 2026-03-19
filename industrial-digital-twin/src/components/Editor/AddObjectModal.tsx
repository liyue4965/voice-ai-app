import { useState } from 'react'
import { useSceneStore } from '../../stores'
import * as THREE from 'three'
import type { GeometryType, LightType } from '../../types'

type MaterialType = 'basic' | 'standard' | 'phong' | 'physical'

interface AddObjectModalProps {
  onClose: () => void
}

const geometries: { type: GeometryType; name: string; icon: string }[] = [
  { type: 'box', name: '立方体', icon: '▣' },
  { type: 'sphere', name: '球体', icon: '●' },
  { type: 'cylinder', name: '圆柱体', icon: '⬭' },
  { type: 'cone', name: '圆锥体', icon: '△' },
  { type: 'torus', name: '圆环', icon: '◎' },
  { type: 'plane', name: '平面', icon: '▭' }
]

const lights: { type: LightType; name: string; icon: string }[] = [
  { type: 'ambient', name: '环境光', icon: '💡' },
  { type: 'directional', name: '平行光', icon: '☀' },
  { type: 'point', name: '点光源', icon: '🔆' }
]

export function AddObjectModal({ onClose }: AddObjectModalProps) {
  const [activeTab, setActiveTab] = useState<'geometry' | 'light' | 'import'>('geometry')
  const [objectName, setObjectName] = useState('')
  const [selectedType, setSelectedType] = useState<string>('box')
  const [materialType, setMaterialType] = useState<MaterialType>('standard')
  const [materialColor, setMaterialColor] = useState('#4488ff')
  
  const { addObject, selectObject } = useSceneStore()

  const handleAdd = () => {
    const id = addObject({
      name: objectName || `Object_${selectedType}`,
      type: activeTab === 'light' ? 'light' : 'mesh',
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      // 直接在根级别添加 material 和 geometryType（MeshObject 的属性）
      geometryType: selectedType,
      materialType,
      material: {
        color: materialColor,
        metalness: 0.3,
        roughness: 0.5,
        opacity: 1,
        transparent: false,
        wireframe: false
      }
    } as any)
    
    selectObject(id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">添加物体</div>
        
        {/* Tab切换 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button 
            className={`toolbar-btn ${activeTab === 'geometry' ? 'active' : ''}`}
            onClick={() => setActiveTab('geometry')}
          >
            几何体
          </button>
          <button 
            className={`toolbar-btn ${activeTab === 'light' ? 'active' : ''}`}
            onClick={() => setActiveTab('light')}
          >
            光源
          </button>
          <button 
            className={`toolbar-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            导入模型
          </button>
        </div>

        {activeTab === 'geometry' && (
          <>
            {/* 几何体选择 */}
            <div className="modal-content">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  选择几何体
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {geometries.map(geo => (
                    <button
                      key={geo.type}
                      className={`toolbar-btn ${selectedType === geo.type ? 'active' : ''}`}
                      onClick={() => setSelectedType(geo.type)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 12 }}
                    >
                      <span style={{ fontSize: 20 }}>{geo.icon}</span>
                      <span style={{ fontSize: 11 }}>{geo.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  名称
                </label>
                <input
                  type="text"
                  className="property-input"
                  value={objectName}
                  onChange={e => setObjectName(e.target.value)}
                  placeholder={`Object_${selectedType}`}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  材质类型
                </label>
                <select
                  className="property-input"
                  value={materialType}
                  onChange={e => setMaterialType(e.target.value as MaterialType)}
                  style={{ width: '100%' }}
                >
                  <option value="basic">Basic (基础)</option>
                  <option value="phong">Phong (漫反射)</option>
                  <option value="standard">Standard (标准)</option>
                  <option value="physical">Physical (物理)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  材质颜色
                </label>
                <input
                  type="color"
                  value={materialColor}
                  onChange={e => setMaterialColor(e.target.value)}
                  style={{ width: '100%', height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: 4 }}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'light' && (
          <>
            <div className="modal-content">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  选择光源类型
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lights.map(light => (
                    <button
                      key={light.type}
                      className={`toolbar-btn ${selectedType === light.type ? 'active' : ''}`}
                      onClick={() => setSelectedType(light.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12 }}
                    >
                      <span style={{ fontSize: 20 }}>{light.icon}</span>
                      <span>{light.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  名称
                </label>
                <input
                  type="text"
                  className="property-input"
                  value={objectName}
                  onChange={e => setObjectName(e.target.value)}
                  placeholder={`Light_${selectedType}`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'import' && (
          <div className="modal-content">
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: 16 }}>支持导入以下格式:</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>GLTF</span>
                <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>GLB</span>
                <span style={{ background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>OBJ</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.gltf,.glb,.obj'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      // TODO: 实现模型导入
                      alert('模型导入功能开发中...')
                    }
                  }
                  input.click()
                }}
              >
                选择文件
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
