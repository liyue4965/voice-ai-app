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
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(124, 58, 237, 0.03) 50px, rgba(124, 58, 237, 0.03) 51px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        background: 'rgba(21, 21, 31, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: 48,
        width: '100%',
        maxWidth: 420,
        border: '1px solid rgba(124, 58, 237, 0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(124, 58, 237, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            fontSize: 56, 
            marginBottom: 16,
            filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.5))'
          }}>
            🎬
          </div>
          <h1 style={{ 
            color: '#fff', 
            margin: 0, 
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AI Video Generator
          </h1>
          <p style={{ 
            color: '#a1a1aa', 
            margin: '12px 0 0 0',
            fontSize: 14 
          }}>
            用 AI 创造精彩视频
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              color: '#e4e4e7', 
              marginBottom: 10,
              fontSize: 14,
              fontWeight: 500
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid rgba(124, 58, 237, 0.3)',
                background: 'rgba(10, 10, 15, 0.6)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              placeholder="请输入用户名"
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed'
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                e.target.style.boxShadow = 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ 
              display: 'block', 
              color: '#e4e4e7', 
              marginBottom: 10,
              fontSize: 14,
              fontWeight: 500
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid rgba(124, 58, 237, 0.3)',
                background: 'rgba(10, 10, 15, 0.6)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              placeholder="请输入密码"
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed'
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                e.target.style.boxShadow = 'none'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              color: '#f87171',
              fontSize: 13,
              marginBottom: 20,
              textAlign: 'center',
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: loading 
                ? 'rgba(124, 58, 237, 0.5)' 
                : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #ec4899 100%)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(124, 58, 237, 0.4)',
              transform: loading ? 'none' : 'translateY(0)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 30px rgba(124, 58, 237, 0.5)'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.4)'
            }}
          >
            {loading ? '登录中...' : '🚀 立即开始'}
          </button>
        </form>

        <div style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: 12,
          color: '#71717a'
        }}>
          © 2026 AI Video Generator. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export function checkAuth(): boolean {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  if (!isLoggedIn) return false
  
  const loginTime = parseInt(localStorage.getItem('loginTime') || '0')
  const now = Date.now()
  const EXPIRE_TIME = 24 * 60 * 60 * 1000
  
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
