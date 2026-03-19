import { useEditorUIStore, useSceneStore } from '../../stores'

interface ToolbarProps {
  onPreview?: () => void
  onManager?: () => void
  onLogout?: () => void
}

export function Toolbar({ onPreview, onManager, onLogout }: ToolbarProps) {
  const { activeTool, setActiveTool, openModal } = useEditorUIStore()
  const { clearScene, getSceneData } = useSceneStore()

  const handleSave = () => {
    const data = getSceneData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            useSceneStore.getState().loadScene(data)
          } catch (err) {
            alert('加载失败: 无效的JSON文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="toolbar">
      <button className="toolbar-btn" onClick={() => openModal('addObject')}>
        + 添加物体
      </button>
      
      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
      
      <button 
        className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => setActiveTool('select')}
        title="选择 (V)"
      >
        ⊹ 选择
      </button>
      <button 
        className={`toolbar-btn ${activeTool === 'move' ? 'active' : ''}`}
        onClick={() => setActiveTool('move')}
        title="移动 (G)"
      >
        ↔ 移动
      </button>
      <button 
        className={`toolbar-btn ${activeTool === 'rotate' ? 'active' : ''}`}
        onClick={() => setActiveTool('rotate')}
        title="旋转 (R)"
      >
        ⟳ 旋转
      </button>
      <button 
        className={`toolbar-btn ${activeTool === 'scale' ? 'active' : ''}`}
        onClick={() => setActiveTool('scale')}
        title="缩放 (S)"
      >
        ⤢ 缩放
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
      
      <button className="toolbar-btn" onClick={() => openModal('aiGenerate')}>
        🤖 AI生成
      </button>
      <button className="toolbar-btn" onClick={() => openModal('dataSource')}>
        📡 数据源
      </button>
      <button className="toolbar-btn" onClick={onManager} style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
        ⚙️ 管理中心
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
      
      <button className="toolbar-btn" onClick={handleSave}>
        💾 保存
      </button>
      <button className="toolbar-btn" onClick={handleLoad}>
        📂 加载
      </button>
      <button className="toolbar-btn" onClick={() => openModal('export')}>
        📤 导出
      </button>
      <button className="toolbar-btn" onClick={onPreview} style={{ background: '#4ade80', borderColor: '#4ade80' }}>
        ▶ 预览
      </button>
      <button className="toolbar-btn" onClick={clearScene}>
        🗑️ 清空
      </button>
      {onLogout && (
        <button 
          className="toolbar-btn" 
          onClick={onLogout}
          style={{ marginLeft: 'auto', background: '#ef4444', borderColor: '#ef4444' }}
        >
          🚪 退出登录
        </button>
      )}
    </div>
  )
}
