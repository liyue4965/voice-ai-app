import { useState, useEffect, useRef } from 'react'
import './App.css'
import { LoginPage, checkAuth, logout } from './components/Auth/LoginPage'

// 模拟视频生成任务
interface GenerationTask {
  id: string
  prompt: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  createdAt: Date
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [tasks, setTasks] = useState<GenerationTask[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsAuthenticated(checkAuth())
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedImage(url)
    }
  }

  const handleGenerate = () => {
    if (!prompt.trim()) {
      alert('请输入视频描述')
      return
    }

    const newTask: GenerationTask = {
      id: Date.now().toString(),
      prompt,
      status: 'generating',
      progress: 0,
      createdAt: new Date()
    }

    setTasks(prev => [newTask, ...prev])
    setIsGenerating(true)
    setPrompt('')

    // 模拟视频生成进度
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        setTasks(prev => prev.map(task => 
          task.id === newTask.id 
            ? { ...task, progress: 100, status: 'completed', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' }
            : task
        ))
        setIsGenerating(false)
      } else {
        setTasks(prev => prev.map(task => 
          task.id === newTask.id ? { ...task, progress } : task
        ))
      }
    }, 500)
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">AI Video Generator</span>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link active">创建</a>
          <a href="#" className="nav-link">我的作品</a>
          <a href="#" className="nav-link">社区</a>
          <a href="#" className="nav-link">帮助</a>
          <button className="logout-btn" onClick={handleLogout}>🚪 退出</button>
        </nav>
      </header>

      <main className="main">
        <div className="create-container">
          <div className="create-panel">
            <h1 className="page-title">创建视频</h1>
            <p className="page-desc">用文字描述或上传图片，AI 将为你生成精彩视频</p>

            {/* 图片上传区域 */}
            <div className="upload-section">
              <div 
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="上传" className="preview-image" />
                ) : (
                  <>
                    <div className="upload-icon">📁</div>
                    <p>点击上传图片（可选）</p>
                    <p className="upload-hint">支持 JPG、PNG，最大 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              {selectedImage && (
                <button 
                  className="clear-image-btn"
                  onClick={() => setSelectedImage(null)}
                >
                  ✕ 清除图片
                </button>
              )}
            </div>

            {/* Prompt 输入 */}
            <div className="input-section">
              <label className="input-label">视频描述</label>
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要的视频内容，例如：一只可爱的猫咪在草地上奔跑，阳光透过树叶洒落..."
                rows={4}
              />
              <div className="input-hint">
                描述越详细，生成效果越好
              </div>
            </div>

            {/* 参数设置 */}
            <div className="settings-section">
              <div className="setting-item">
                <label className="setting-label">画面比例</label>
                <div className="setting-options">
                  {['16:9', '9:16', '1:1', '4:3'].map(ratio => (
                    <button
                      key={ratio}
                      className={`option-btn ${aspectRatio === ratio ? 'active' : ''}`}
                      onClick={() => setAspectRatio(ratio)}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">视频时长</label>
                <div className="setting-options">
                  {['4', '8', '10'].map(d => (
                    <button
                      key={d}
                      className={`option-btn ${duration === d ? 'active' : ''}`}
                      onClick={() => setDuration(d)}
                    >
                      {d}秒
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              className={`generate-btn ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? '生成中...' : '🚀 开始生成'}
            </button>
          </div>

          {/* 历史记录 */}
          <div className="history-panel">
            <h2 className="history-title">生成历史</h2>
            {tasks.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">🎥</div>
                <p>暂无生成记录</p>
                <p className="empty-hint">开始创建你的第一个 AI 视频吧</p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-info">
                      <p className="task-prompt">{task.prompt}</p>
                      <div className="task-meta">
                        <span className="task-time">
                          {task.createdAt.toLocaleTimeString()}
                        </span>
                        <span className={`task-status ${task.status}`}>
                          {task.status === 'generating' && `生成中 ${Math.round(task.progress)}%`}
                          {task.status === 'completed' && '✓ 完成'}
                          {task.status === 'failed' && '✕ 失败'}
                          {task.status === 'pending' && '等待中'}
                        </span>
                      </div>
                      {task.status === 'generating' && (
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="task-actions">
                      {task.status === 'completed' && task.videoUrl && (
                        <button 
                          className="task-btn view"
                          onClick={() => window.open(task.videoUrl, '_blank')}
                        >
                          ▶ 查看视频
                        </button>
                      )}
                      <button 
                        className="task-btn delete"
                        onClick={() => deleteTask(task.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
