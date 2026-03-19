import { useState } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { Viewport } from './Viewport'
import { PropertiesPanel } from './PropertiesPanel'
import { DataPanel } from './DataPanel'
import { AddObjectModal } from './AddObjectModal'
import { DataSourceModal } from './DataSourceModal'
import { AIGenerateModal } from './AIGenerateModal'
import { ExportModal } from './ExportModal'
import { Preview } from '../Preview/Preview'
import { ManagerPanel } from '../Manager/ManagerPanel'
import { useSceneStore, useEditorUIStore } from '../../stores'
import type { SceneObject } from '../../types'

interface EditorProps {
  onLogout?: () => void
}

export function Editor({ onLogout }: EditorProps) {
  const { sceneData, selectedObjectId } = useSceneStore()
  const { isModalOpen, modalType, closeModal } = useEditorUIStore()
  const [activePanel, setActivePanel] = useState<'properties' | 'data'>('properties')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [managerTab, setManagerTab] = useState('project')

  // 获取选中对象
  const selectedObject = selectedObjectId 
    ? sceneData.objects[selectedObjectId] as SceneObject | undefined 
    : undefined

  // 预览模式
  if (isPreviewMode) {
    return (
      <Preview 
        sceneData={sceneData} 
        onExit={() => setIsPreviewMode(false)} 
      />
    )
  }

  // 管理中心模式
  if (showManager) {
    return (
      <ManagerPanel 
        onClose={() => setShowManager(false)} 
        activeTab={managerTab}
        onTabChange={setManagerTab}
      />
    )
  }

  return (
    <>
      <Toolbar 
        onPreview={() => setIsPreviewMode(true)} 
        onManager={() => setShowManager(true)}
        onLogout={onLogout}
      />
      <div className="main-content">
        <Sidebar />
        <Viewport />
        {selectedObjectId && activePanel === 'properties' ? (
          <PropertiesPanel object={selectedObject} />
        ) : (
          <DataPanel onTabChange={() => setActivePanel('properties')} />
        )}
      </div>
      <StatusBar />

      {/* Modals */}
      {isModalOpen && modalType === 'addObject' && (
        <AddObjectModal onClose={closeModal} />
      )}
      {isModalOpen && modalType === 'dataSource' && (
        <DataSourceModal onClose={closeModal} />
      )}
      {isModalOpen && modalType === 'aiGenerate' && (
        <AIGenerateModal onClose={closeModal} />
      )}
      {isModalOpen && modalType === 'export' && (
        <ExportModal onClose={closeModal} />
      )}
    </>
  )
}

function StatusBar() {
  const { sceneData, selectedObjectId } = useSceneStore()
  const objectCount = Object.keys(sceneData.objects).length
  
  return (
    <div className="status-bar">
      <span className="status-item">
        对象: {objectCount}
      </span>
      <span className="status-item">
        选中: {selectedObjectId || '无'}
      </span>
      <span className="status-item">
        场景: {sceneData.name}
      </span>
      <span className="status-item" style={{ marginLeft: 'auto' }}>
        工业仿真数字孪生编辑器 v1.0.0
      </span>
    </div>
  )
}
