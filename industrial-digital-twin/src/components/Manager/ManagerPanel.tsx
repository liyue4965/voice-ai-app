import { useState, useEffect } from 'react'
import { useSceneStore } from '../../stores'

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

interface ManagerPanelProps {
  onClose: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ManagerPanel({ onClose, activeTab, onTabChange }: ManagerPanelProps) {
  return (
    <div className="manager-panel">
      <div className="manager-header">
        <h2>管理中心</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="manager-tabs">
        <button 
          className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => onTabChange('project')}
        >
          📁 项目管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scene' ? 'active' : ''}`}
          onClick={() => onTabChange('scene')}
        >
          🖼️ 场景管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'resource' ? 'active' : ''}`}
          onClick={() => onTabChange('resource')}
        >
          📦 资源管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'download' ? 'active' : ''}`}
          onClick={() => onTabChange('download')}
        >
          📥 下载中心
        </button>
      </div>

      <div className="manager-content">
        {activeTab === 'project' && <ProjectManager />}
        {activeTab === 'scene' && <SceneManager />}
        {activeTab === 'resource' && <ResourceManager />}
        {activeTab === 'download' && <DownloadCenter />}
      </div>
    </div>
  )
}

// 项目管理
function ProjectManager() {
  const { getSceneData } = useSceneStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  useEffect(() => {
    // 从 localStorage 加载项目列表
    const saved = localStorage.getItem('digital_twin_projects')
    if (saved) {
      setProjects(JSON.parse(saved))
    }
  }, [])

  const saveProject = () => {
    const sceneData = getSceneData()
    const newProject: Project = {
      id: Date.now().toString(),
      name: sceneData.name || '未命名项目',
      description: '工业仿真数字孪生项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updated = [...projects, newProject]
    setProjects(updated)
    localStorage.setItem('digital_twin_projects', JSON.stringify(updated))
    setCurrentProject(newProject)
    alert('项目已保存！')
  }

  const loadProject = (project: Project) => {
    const savedScene = localStorage.getItem(`digital_twin_project_${project.id}`)
    if (savedScene) {
      // 加载场景数据
      alert(`加载项目: ${project.name}`)
    }
  }

  const deleteProject = (id: string) => {
    if (confirm('确定要删除这个项目吗？')) {
      const updated = projects.filter(p => p.id !== id)
      setProjects(updated)
      localStorage.setItem('digital_twin_projects', JSON.stringify(updated))
    }
  }

  return (
    <div className="manager-section">
      <div className="section-header">
        <h3>我的项目</h3>
        <button className="btn btn-primary" onClick={saveProject}>
          + 新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📁</div>
          <p>暂无项目</p>
          <p style={{ fontSize: 12, color: '#a0a0a0' }}>点击"新建项目"开始创建</p>
        </div>
      ) : (
        <div className="project-list">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-thumbnail">
                <div style={{ fontSize: 32 }}>🏭</div>
              </div>
              <div className="project-info">
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                <span className="project-date">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="project-actions">
                <button className="btn btn-secondary" onClick={() => loadProject(project)}>
                  打开
                </button>
                <button className="btn btn-danger" onClick={() => deleteProject(project.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 场景管理
function SceneManager() {
  const { getSceneData, loadScene, clearScene } = useSceneStore()
  const [scenes, setScenes] = useState<any[]>([])

  const templates = [
    { 
      id: 'factory', 
      name: '智能工厂', 
      icon: '🏭', 
      description: '工业生产线场景',
      sceneData: {
        id: 'factory-template',
        name: '智能工厂',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: {
          'floor': { id: 'floor', name: '地面', type: 'mesh', visible: true, locked: false, position: { x: 0, y: -0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 20, y: 0.1, z: 20 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#333333', metalness: 0.2, roughness: 0.8 } },
          'machine1': { id: 'machine1', name: '加工中心1', type: 'mesh', visible: true, locked: false, position: { x: -3, y: 1, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 2, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#2266cc', metalness: 0.6, roughness: 0.3 } },
          'machine2': { id: 'machine2', name: '加工中心2', type: 'mesh', visible: true, locked: false, position: { x: 3, y: 1, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 2, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#2266cc', metalness: 0.6, roughness: 0.3 } },
          'machine3': { id: 'machine3', name: '加工中心3', type: 'mesh', visible: true, locked: false, position: { x: -3, y: 1, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 2, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#2266cc', metalness: 0.6, roughness: 0.3 } },
          'machine4': { id: 'machine4', name: '加工中心4', type: 'mesh', visible: true, locked: false, position: { x: 3, y: 1, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 2, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#2266cc', metalness: 0.6, roughness: 0.3 } },
          'robot': { id: 'robot', name: '工业机器人', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 0.75, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1.5, z: 1 }, parentId: null, children: [], metadata: {}, geometryType: 'cylinder', materialType: 'standard', material: { color: '#ff6600', metalness: 0.7, roughness: 0.2 } },
          'conveyor': { id: 'conveyor', name: '传送带', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 0.3, z: 6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 8, y: 0.3, z: 1 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#555555', metalness: 0.3, roughness: 0.7 } },
        },
        rootIds: ['floor', 'machine1', 'machine2', 'machine3', 'machine4', 'robot', 'conveyor'],
        settings: { backgroundColor: '#0a0a14', gridHelper: true, axesHelper: true }
      }
    },
    { 
      id: 'city', 
      name: '智慧城市', 
      icon: '🌆', 
      description: '城市建筑与交通',
      sceneData: {
        id: 'city-template',
        name: '智慧城市',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: {
          'ground': { id: 'ground', name: '地面', type: 'mesh', visible: true, locked: false, position: { x: 0, y: -0.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 30, y: 0.1, z: 30 }, parentId: null, children: [], metadata: {}, geometryType: 'plane', materialType: 'standard', material: { color: '#2a5a2a', metalness: 0, roughness: 0.9 } },
          'building1': { id: 'building1', name: '办公楼A', type: 'mesh', visible: true, locked: false, position: { x: -5, y: 5, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3, y: 10, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#4488aa', metalness: 0.4, roughness: 0.5 } },
          'building2': { id: 'building2', name: '办公楼B', type: 'mesh', visible: true, locked: false, position: { x: 5, y: 7, z: -5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 14, z: 4 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#5588bb', metalness: 0.4, roughness: 0.5 } },
          'building3': { id: 'building3', name: '住宅楼', type: 'mesh', visible: true, locked: false, position: { x: -5, y: 4, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 8, z: 4 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#cc8855', metalness: 0.2, roughness: 0.7 } },
          'road1': { id: 'road1', name: '主干道', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 0.01, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 20, y: 0.05, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#444444', metalness: 0.1, roughness: 0.9 } },
          'road2': { id: 'road2', name: '次干道', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 0.01, z: 0 }, rotation: { x: 0, y: Math.PI/2, z: 0 }, scale: { x: 20, y: 0.05, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#444444', metalness: 0.1, roughness: 0.9 } },
        },
        rootIds: ['ground', 'building1', 'building2', 'building3', 'road1', 'road2'],
        settings: { backgroundColor: '#1a2a4a', gridHelper: true, axesHelper: true }
      }
    },
    { 
      id: 'farm', 
      name: '智慧农业', 
      icon: '🌾', 
      description: '农业大棚与农田',
      sceneData: {
        id: 'farm-template',
        name: '智慧农业',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: {
          'soil': { id: 'soil', name: '农田', type: 'mesh', visible: true, locked: false, position: { x: 0, y: -0.2, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 15, y: 0.2, z: 10 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#5c4033', metalness: 0, roughness: 0.9 } },
          'greenhouse1': { id: 'greenhouse1', name: '大棚1', type: 'mesh', visible: true, locked: false, position: { x: -4, y: 1.5, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 3, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#88ccff', metalness: 0.3, roughness: 0.2, opacity: 0.5, transparent: true } },
          'greenhouse2': { id: 'greenhouse2', name: '大棚2', type: 'mesh', visible: true, locked: false, position: { x: 4, y: 1.5, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 3, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#88ccff', metalness: 0.3, roughness: 0.2, opacity: 0.5, transparent: true } },
          'greenhouse3': { id: 'greenhouse3', name: '大棚3', type: 'mesh', visible: true, locked: false, position: { x: -4, y: 1.5, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 3, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#88ccff', metalness: 0.3, roughness: 0.2, opacity: 0.5, transparent: true } },
          'greenhouse4': { id: 'greenhouse4', name: '大棚4', type: 'mesh', visible: true, locked: false, position: { x: 4, y: 1.5, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 3, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#88ccff', metalness: 0.3, roughness: 0.2, opacity: 0.5, transparent: true } },
          'tank': { id: 'tank', name: '储水罐', type: 'mesh', visible: true, locked: false, position: { x: 6, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.5, y: 2, z: 1.5 }, parentId: null, children: [], metadata: {}, geometryType: 'cylinder', materialType: 'standard', material: { color: '#3388cc', metalness: 0.5, roughness: 0.4 } },
        },
        rootIds: ['soil', 'greenhouse1', 'greenhouse2', 'greenhouse3', 'greenhouse4', 'tank'],
        settings: { backgroundColor: '#87ceeb', gridHelper: true, axesHelper: true }
      }
    },
    { 
      id: 'warehouse', 
      name: '智能仓储', 
      icon: '🏬', 
      description: '物流仓储场景',
      sceneData: {
        id: 'warehouse-template',
        name: '智能仓储',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: {
          'floor': { id: 'floor', name: '地面', type: 'mesh', visible: true, locked: false, position: { x: 0, y: -0.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 20, y: 0.1, z: 15 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#666666', metalness: 0.2, roughness: 0.8 } },
          'shelf1': { id: 'shelf1', name: '货架A-1', type: 'mesh', visible: true, locked: false, position: { x: -6, y: 2, z: -4 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'shelf2': { id: 'shelf2', name: '货架A-2', type: 'mesh', visible: true, locked: false, position: { x: -6, y: 2, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'shelf3': { id: 'shelf3', name: '货架A-3', type: 'mesh', visible: true, locked: false, position: { x: -6, y: 2, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'shelf4': { id: 'shelf4', name: '货架B-1', type: 'mesh', visible: true, locked: false, position: { x: 6, y: 2, z: -4 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'shelf5': { id: 'shelf5', name: '货架B-2', type: 'mesh', visible: true, locked: false, position: { x: 6, y: 2, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'shelf6': { id: 'shelf6', name: '货架B-3', type: 'mesh', visible: true, locked: false, position: { x: 6, y: 2, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 4, z: 0.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ff9933', metalness: 0.4, roughness: 0.6 } },
          'forklift': { id: 'forklift', name: '叉车', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 0.5, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.5, y: 1, z: 2.5 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#ffcc00', metalness: 0.5, roughness: 0.4 } },
        },
        rootIds: ['floor', 'shelf1', 'shelf2', 'shelf3', 'shelf4', 'shelf5', 'shelf6', 'forklift'],
        settings: { backgroundColor: '#0a0a14', gridHelper: true, axesHelper: true }
      }
    },
    { 
      id: 'power', 
      name: '能源站', 
      icon: '⚡', 
      description: '电力设施监控',
      sceneData: {
        id: 'power-template',
        name: '能源站',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        objects: {
          'ground': { id: 'ground', name: '地面', type: 'mesh', visible: true, locked: false, position: { x: 0, y: -0.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 25, y: 0.1, z: 25 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#3a3a3a', metalness: 0.2, roughness: 0.9 } },
          'turbine1': { id: 'turbine1', name: '风力发电机1', type: 'mesh', visible: true, locked: false, position: { x: -6, y: 4, z: -6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 8, z: 1 }, parentId: null, children: [], metadata: {}, geometryType: 'cylinder', materialType: 'standard', material: { color: '#eeeeee', metalness: 0.6, roughness: 0.3 } },
          'turbine2': { id: 'turbine2', name: '风力发电机2', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 4, z: -6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 8, z: 1 }, parentId: null, children: [], metadata: {}, geometryType: 'cylinder', materialType: 'standard', material: { color: '#eeeeee', metalness: 0.6, roughness: 0.3 } },
          'turbine3': { id: 'turbine3', name: '风力发电机3', type: 'mesh', visible: true, locked: false, position: { x: 6, y: 4, z: -6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 8, z: 1 }, parentId: null, children: [], metadata: {}, geometryType: 'cylinder', materialType: 'standard', material: { color: '#eeeeee', metalness: 0.6, roughness: 0.3 } },
          'solar-panel1': { id: 'solar-panel1', name: '太阳能板阵列1', type: 'mesh', visible: true, locked: false, position: { x: -5, y: 1, z: 4 }, rotation: { x: -0.3, y: 0, z: 0 }, scale: { x: 4, y: 0.1, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#1a237e', metalness: 0.3, roughness: 0.2 } },
          'solar-panel2': { id: 'solar-panel2', name: '太阳能板阵列2', type: 'mesh', visible: true, locked: false, position: { x: 5, y: 1, z: 4 }, rotation: { x: -0.3, y: 0, z: 0 }, scale: { x: 4, y: 0.1, z: 3 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#1a237e', metalness: 0.3, roughness: 0.2 } },
          'transformer': { id: 'transformer', name: '变压器', type: 'mesh', visible: true, locked: false, position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 2, z: 2 }, parentId: null, children: [], metadata: {}, geometryType: 'box', materialType: 'standard', material: { color: '#555555', metalness: 0.5, roughness: 0.5 } },
        },
        rootIds: ['ground', 'turbine1', 'turbine2', 'turbine3', 'solar-panel1', 'solar-panel2', 'transformer'],
        settings: { backgroundColor: '#0a1a2a', gridHelper: true, axesHelper: true }
      }
    },
  ]

  const loadTemplate = (template: typeof templates[0]) => {
    if (confirm(`确定要加载模板 "${template.name}" 吗？当前场景将被替换。`)) {
      clearScene()
      loadScene(template.sceneData as any)
      alert(`已加载模板: ${template.name}`)
    }
  }

  const saveScene = () => {
    const sceneData = getSceneData()
    const newScene = {
      id: Date.now().toString(),
      name: sceneData.name,
      data: sceneData,
      createdAt: new Date().toISOString()
    }
    const saved = [...scenes, newScene]
    setScenes(saved)
    localStorage.setItem('digital_twin_scenes', JSON.stringify(saved))
    alert('场景已保存！')
  }

  const loadSavedScene = (scene: any) => {
    useSceneStore.getState().loadScene(scene.data)
    alert(`已加载场景: ${scene.name}`)
  }

  const deleteScene = (id: string) => {
    if (confirm('确定删除此场景？')) {
      const saved = scenes.filter(s => s.id !== id)
      setScenes(saved)
      localStorage.setItem('digital_twin_scenes', JSON.stringify(saved))
    }
  }

  return (
    <div className="manager-section">
      <div className="section-header">
        <h3>场景模板</h3>
      </div>
      <div className="template-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <div style={{ fontSize: 36 }}>{template.icon}</div>
            <h4>{template.name}</h4>
            <p>{template.description}</p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => loadTemplate(template)}
            >
              使用模板
            </button>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginTop: 24 }}>
        <h3>已保存场景</h3>
        <button className="btn btn-primary" onClick={saveScene}>
          + 保存当前场景
        </button>
      </div>
      
      {scenes.length === 0 ? (
        <div className="empty-state">
          <p>暂无保存的场景</p>
        </div>
      ) : (
        <div className="scene-list">
          {scenes.map(scene => (
            <div key={scene.id} className="scene-item">
              <span>🖼️ {scene.name}</span>
              <div>
                <button className="btn btn-secondary" onClick={() => loadSavedScene(scene)}>加载</button>
                <button className="btn btn-danger" onClick={() => deleteScene(scene.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 资源管理
function ResourceManager() {
  const [resources, setResources] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('model')

  const categories = [
    { id: 'model', name: '3D模型', icon: '📐' },
    { id: 'material', name: '材质', icon: '🎨' },
    { id: 'texture', name: '纹理', icon: '🖼️' },
    { id: 'image', name: '图片', icon: '📷' },
  ]

  const builtInModels = [
    { id: 'box', name: '立方体', icon: '▣' },
    { id: 'sphere', name: '球体', icon: '●' },
    { id: 'cylinder', name: '圆柱体', icon: '⬭' },
    { id: 'cone', name: '圆锥体', icon: '△' },
    { id: 'torus', name: '圆环', icon: '◎' },
    { id: 'plane', name: '平面', icon: '▭' },
    { id: 'pipe', name: '管道', icon: '⬢' },
    { id: 'gear', name: '齿轮', icon: '⚙️' },
  ]

  const builtInMaterials = [
    { id: 'metal', name: '金属', color: '#888888' },
    { id: 'plastic', name: '塑料', color: '#4488ff' },
    { id: 'wood', name: '木材', color: '#8B4513' },
    { id: 'glass', name: '玻璃', color: '#88ccff' },
    { id: 'concrete', name: '混凝土', color: '#808080' },
    { id: 'grass', name: '草地', color: '#228B22' },
  ]

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.gltf,.glb,.obj,.png,.jpg,.jpeg'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        alert(`选择了 ${files.length} 个文件`)
        // TODO: 处理文件上传
      }
    }
    input.click()
  }

  return (
    <div className="manager-section">
      <div className="section-header">
        <h3>资源库</h3>
        <button className="btn btn-primary" onClick={handleUpload}>
          + 上传资源
        </button>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {activeCategory === 'model' && (
        <div className="resource-grid">
          {builtInModels.map(model => (
            <div key={model.id} className="resource-card">
              <div style={{ fontSize: 36 }}>{model.icon}</div>
              <span>{model.name}</span>
            </div>
          ))}
        </div>
      )}

      {activeCategory === 'material' && (
        <div className="resource-grid">
          {builtInMaterials.map(mat => (
            <div key={mat.id} className="resource-card">
              <div style={{ 
                width: 40, 
                height: 40, 
                background: mat.color, 
                borderRadius: 4 
              }} />
              <span>{mat.name}</span>
            </div>
          ))}
        </div>
      )}

      {activeCategory === 'texture' && (
        <div className="empty-state">
          <p>暂无纹理</p>
          <p style={{ fontSize: 12, color: '#a0a0a0' }}>点击"上传资源"添加</p>
        </div>
      )}

      {activeCategory === 'image' && (
        <div className="empty-state">
          <p>暂无图片</p>
          <p style={{ fontSize: 12, color: '#a0a0a0' }}>点击"上传资源"添加</p>
        </div>
      )}
    </div>
  )
}

// 下载中心
function DownloadCenter() {
  const downloadFiles: { id: string; name: string; description: string; size: string; icon: string }[] = []

  const handleDownload = (file: typeof downloadFiles[0]) => {
    const link = document.createElement('a')
    link.href = `/downloads/${file.name}`
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="manager-section">
      <div className="section-header">
        <h3>📥 下载中心</h3>
      </div>
      
      {downloadFiles.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📥</div>
          <p>暂无下载文件</p>
          <p style={{ fontSize: 12, color: '#a0a0a0' }}>需要添加下载文件时告诉我</p>
        </div>
      ) : (
        <div className="download-list">
          {downloadFiles.map(file => (
            <div key={file.id} className="download-item">
              <div className="download-icon">{file.icon}</div>
              <div className="download-info">
                <h4>{file.name.replace('.md', '')}</h4>
                <p>{file.description}</p>
                <span className="download-size">{file.size}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload(file)}
              >
                ⬇️ 下载
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .download-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .download-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .download-icon {
          font-size: 28px;
          margin-right: 12px;
        }
        .download-info {
          flex: 1;
        }
        .download-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #eee;
        }
        .download-info p {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #a0a0a0;
        }
        .download-size {
          font-size: 11px;
          color: #666;
        }
      `}</style>
    </div>
  )
}


