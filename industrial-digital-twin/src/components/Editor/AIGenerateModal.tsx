import { useState, useRef } from 'react'
import { useSceneStore } from '../../stores'
import * as THREE from 'three'

interface AIGenerateModalProps {
  onClose: () => void
}

export function AIGenerateModal({ onClose }: AIGenerateModalProps) {
  const [mode, setMode] = useState<'image' | 'text'>('image')
  const [prompt, setPrompt] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addObject, selectObject } = useSceneStore()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (mode === 'image' && !imagePreview) {
      alert('请先上传图片')
      return
    }
    if (mode === 'text' && !prompt) {
      alert('请输入描述')
      return
    }

    setIsGenerating(true)
    setStatus('AI生成功能开发中...')

    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 这里应该调用真实的AI API
    // 1. 图片转场景描述 (使用SD API)
    // 2. 场景描述转3D (使用Mesh生成API)
    
    // 暂时创建一个示例场景
    setStatus('生成演示场景...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 创建一些基础物体作为演示
    const floorId = addObject({
      name: '地面',
      type: 'mesh',
      position: new THREE.Vector3(0, -0.5, 0),
      scale: new THREE.Vector3(10, 0.1, 10),
      metadata: {
        geometryType: 'box',
        materialType: 'standard',
        material: {
          color: '#333344',
          metalness: 0.2,
          roughness: 0.8,
          opacity: 1,
          transparent: false,
          wireframe: false
        }
      }
    } as any)

    const machineId = addObject({
      name: '工业机器',
      type: 'mesh',
      position: new THREE.Vector3(0, 0.5, 0),
      metadata: {
        geometryType: 'box',
        materialType: 'standard',
        material: {
          color: '#e94560',
          metalness: 0.6,
          roughness: 0.3,
          opacity: 1,
          transparent: false,
          wireframe: false
        }
      }
    } as any)

    const machineTopId = addObject({
      name: '机器顶部',
      type: 'mesh',
      position: new THREE.Vector3(0, 1.2, 0),
      metadata: {
        geometryType: 'cylinder',
        geometry: { radius: 0.3, height: 0.4 },
        materialType: 'standard',
        material: {
          color: '#4488ff',
          metalness: 0.8,
          roughness: 0.2,
          opacity: 1,
          transparent: false,
          wireframe: false
        }
      }
    } as any)

    const lightId = addObject({
      name: '工作灯',
      type: 'light',
      lightType: 'point',
      position: new THREE.Vector3(2, 3, 2),
      color: '#ffaa44',
      intensity: 1,
      distance: 10,
      castShadow: true
    } as any)

    selectObject(machineId)
    setStatus('生成完成!')
    setIsGenerating(false)
    
    setTimeout(() => {
      onClose()
    }, 500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 500 }}>
        <div className="modal-title">🤖 AI 生成 3D 场景</div>
        
        {/* 模式选择 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button 
            className={`toolbar-btn ${mode === 'image' ? 'active' : ''}`}
            onClick={() => setMode('image')}
            style={{ flex: 1 }}
          >
            🖼️ 设计图生成
          </button>
          <button 
            className={`toolbar-btn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
            style={{ flex: 1 }}
          >
            ✏️ 文字描述生成
          </button>
        </div>

        <div className="modal-content">
          {mode === 'image' ? (
            <>
              <div 
                style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: 8, 
                  padding: 40, 
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: 16
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} 
                  />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div>点击上传设计图</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>支持 PNG, JPG (最大 10MB)</div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                AI 将分析设计图，识别工业设备布局，生成对应的 3D 场景
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  场景描述
                </label>
                <textarea
                  className="property-input"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="例如：创建一个工业车间，包含一台加工中心、传送带、检测设备和物料架，地面采用防滑材质..."
                  style={{ 
                    width: '100%', 
                    height: 120, 
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                提示：描述越详细，生成效果越好。可以指定设备类型、布局、光照等因素。
              </div>
            </>
          )}

          {isGenerating && (
            <div style={{ 
              marginTop: 20, 
              padding: 16, 
              background: 'var(--bg-tertiary)', 
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: 8 }}>⏳ {status}</div>
              <div style={{ 
                height: 4, 
                background: 'var(--border)', 
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--accent)',
                  animation: 'loading 1.5s ease-in-out infinite',
                  width: '60%'
                }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isGenerating}>
            取消
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate}
            disabled={isGenerating || (mode === 'image' && !imagePreview) || (mode === 'text' && !prompt)}
          >
            {isGenerating ? '生成中...' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
