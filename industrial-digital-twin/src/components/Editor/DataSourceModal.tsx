import { useState } from 'react'
import { useDataStore } from '../../stores'

interface DataSourceModalProps {
  onClose: () => void
}

export function DataSourceModal({ onClose }: DataSourceModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'rest' | 'websocket' | 'mqtt'>('rest')
  const [url, setUrl] = useState('')
  const [pollingInterval, setPollingInterval] = useState(5000)

  const { addSource } = useDataStore()

  const handleAdd = () => {
    if (!name || !url) {
      alert('请填写完整信息')
      return
    }

    addSource({
      name,
      type,
      url,
      pollingInterval: type === 'rest' ? pollingInterval : undefined,
      enabled: true
    })

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">添加数据源</div>
        
        <div className="modal-content">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              数据源类型
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`toolbar-btn ${type === 'rest' ? 'active' : ''}`}
                onClick={() => setType('rest')}
                style={{ flex: 1 }}
              >
                REST API
              </button>
              <button 
                className={`toolbar-btn ${type === 'websocket' ? 'active' : ''}`}
                onClick={() => setType('websocket')}
                style={{ flex: 1 }}
              >
                WebSocket
              </button>
              <button 
                className={`toolbar-btn ${type === 'mqtt' ? 'active' : ''}`}
                onClick={() => setType('mqtt')}
                style={{ flex: 1 }}
              >
                MQTT
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              名称
            </label>
            <input
              type="text"
              className="property-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="数据源名称"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              地址
            </label>
            <input
              type="text"
              className="property-input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={
                type === 'rest' ? 'https://api.example.com/data' :
                type === 'websocket' ? 'wss://ws.example.com' :
                'mqtt://broker.example.com:1883'
              }
              style={{ width: '100%' }}
            />
          </div>

          {type === 'rest' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                轮询间隔 (毫秒)
              </label>
              <input
                type="number"
                className="property-input"
                value={pollingInterval}
                onChange={e => setPollingInterval(parseInt(e.target.value) || 5000)}
                min={1000}
                step={1000}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

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
