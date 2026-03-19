import { useState } from 'react'
import { useDataStore, useSceneStore } from '../../stores'

interface DataPanelProps {
  onTabChange?: () => void
}

export function DataPanel({ onTabChange }: DataPanelProps) {
  const { sources, bindings, removeSource, addBinding, removeBinding } = useDataStore()
  const { sceneData, selectedObjectId } = useSceneStore()
  const [activeTab, setActiveTab] = useState<'sources' | 'bindings'>('sources')

  return (
    <div className="properties-panel">
      <div className="sidebar-title">数据绑定</div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'sources' ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12
          }}
          onClick={() => setActiveTab('sources')}
        >
          数据源
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'bindings' ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12
          }}
          onClick={() => setActiveTab('bindings')}
        >
          绑定
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'sources' ? (
          <>
            {sources.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                暂无数据源<br />
                添加数据源以连接实时数据
              </div>
            ) : (
              sources.map(source => (
                <div key={source.id} className="data-source-item">
                  <div className="data-source-header">
                    <span className="data-source-name">{source.name}</span>
                    <span className="data-source-type">{source.type.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {source.url}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '4px 8px', fontSize: 11 }}
                      onClick={() => {
                        // 测试连接
                        console.log('Test connection:', source)
                      }}
                    >
                      测试
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '4px 8px', fontSize: 11 }}
                      onClick={() => removeSource(source.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {bindings.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                暂无绑定<br />
                选择对象后可创建数据绑定
              </div>
            ) : (
              bindings.map(binding => {
                const source = sources.find(s => s.id === binding.sourceId)
                const targetObj = sceneData.objects[binding.targetObjectId]
                return (
                  <div key={binding.id} className="data-source-item">
                    <div className="data-source-header">
                      <span className="data-source-name">{targetObj?.name || '未知对象'}</span>
                      <span className="data-source-type">{binding.targetProperty}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {source?.name} → {binding.expression}
                    </div>
                    <button 
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '4px 8px', fontSize: 11 }}
                      onClick={() => removeBinding(binding.id)}
                    >
                      删除绑定
                    </button>
                  </div>
                )
              })
            )}
          </>
        )}

        {activeTab === 'sources' && (
          <button 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => useEditorUIStore.getState().openModal('dataSource')}
          >
            + 添加数据源
          </button>
        )}

        {activeTab === 'bindings' && selectedObjectId && sources.length > 0 && (
          <button 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              const targetProperty = prompt('请输入目标属性 (position.x, scale.y, material.color等):')
              if (targetProperty) {
                const expression = prompt('请输入表达式 (例如: data.value * 2):')
                if (expression) {
                  addBinding({
                    sourceId: sources[0].id,
                    targetObjectId: selectedObjectId,
                    targetProperty,
                    expression,
                    enabled: true
                  })
                }
              }
            }}
          >
            + 创建绑定
          </button>
        )}
      </div>
    </div>
  )
}

// 需要导入EditorUIStore
import { useEditorUIStore } from '../../stores'
