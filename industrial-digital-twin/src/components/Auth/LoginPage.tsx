import { useState } from 'react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    if (username === 'admin' && password === 'edpfnt+00') {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('loginTime', Date.now().toString())
      onLogin()
    } else {
      setError('用户名或密码错误')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: 20
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ 
            color: '#fff', 
            margin: 0, 
            fontSize: 24,
            fontWeight: 600 
          }}>
            工业数字孪生
          </h1>
          <p style={{ 
            color: '#a0a0a0', 
            margin: '8px 0 0 0',
            fontSize: 14 
          }}>
            请登录您的账户
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              color: '#ccc', 
              marginBottom: 8,
              fontSize: 14 
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              color: '#ccc', 
              marginBottom: 8,
              fontSize: 14 
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div style={{
              color: '#ff6b6b',
              fontSize: 13,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#4a4a6a' : '#4f46e5',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 12,
          color: '#666'
        }}>
          © 2026 工业数字孪生系统
        </div>
      </div>
    </div>
  )
}

export function checkAuth(): boolean {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  if (!isLoggedIn) return false
  
  // 检查登录是否过期（24小时）
  const loginTime = parseInt(localStorage.getItem('loginTime') || '0')
  const now = Date.now()
  const EXPIRE_TIME = 24 * 60 * 60 * 1000 // 24小时
  
  if (now - loginTime > EXPIRE_TIME) {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('loginTime')
    return false
  }
  
  return true
}

export function logout() {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('loginTime')
  window.location.reload()
}
