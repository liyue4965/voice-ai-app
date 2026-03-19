import { useSceneStore } from '../../stores'
import type { SceneObject } from '../../types'

export function Sidebar() {
  const { sceneData, selectedObjectId, selectObject, removeObject, duplicateObject } = useSceneStore()

  const getObjectIcon = (type: SceneObject['type']) => {
    switch (type) {
      case 'mesh': return '◼'
      case 'light': return '💡'
      case 'group': return '📁'
      case 'camera': return '📷'
      default: return '○'
    }
  }

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    // 简单实现：双击删除，右键菜单可以后续扩展
  }

  const renderTree = (parentId: string | null, depth: number = 0): React.ReactNode => {
    const rootIds = parentId 
      ? (sceneData.objects[parentId] as SceneObject)?.children || []
      : sceneData.rootIds

    return rootIds.map(id => {
      const obj = sceneData.objects[id] as SceneObject
      if (!obj) return null

      const isSelected = id === selectedObjectId
      const hasChildren = obj.children.length > 0

      return (
        <div key={id}>
          <div 
            className={`scene-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={() => selectObject(id)}
            onDoubleClick={() => duplicateObject(id)}
            onContextMenu={(e) => handleContextMenu(e, id)}
          >
            <span className="scene-item-icon">
              {hasChildren ? '▶' : ''}
            </span>
            <span>{getObjectIcon(obj.type)}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {obj.name}
            </span>
            <button 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '10px'
              }}
              onClick={(e) => {
                e.stopPropagation()
                removeObject(id)
              }}
              title="删除"
            >
              ✕
            </button>
          </div>
          {hasChildren && renderTree(id, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-title">场景层级</div>
      <div className="sidebar-content">
        {sceneData.rootIds.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 20 }}>
            暂无对象<br />
            点击"添加物体"开始创建
          </div>
        ) : (
          <div className="scene-tree">
            {renderTree(null)}
          </div>
        )}
      </div>
    </div>
  )
}
