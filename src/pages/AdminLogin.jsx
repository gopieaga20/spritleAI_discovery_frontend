import { useState } from 'react'
import SpritleLogo from '../components/SpritleLogo.jsx'
import { useLogin } from '../hooks/useAuth.js'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login.mutateAsync({ username, password })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ds-paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <SpritleLogo height={36} variant="color" />
          </div>
          <h1
            className="font-newsreader"
            style={{ fontSize: 26, fontWeight: 500, color: 'var(--ds-ink)', margin: '0 0 4px' }}
          >
            Admin Console
          </h1>
          <p
            className="font-plex-mono"
            style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-ink-faint)', margin: 0 }}
          >
            AI Discovery Platform
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--ds-card)',
            border: '1px solid var(--ds-line)',
            borderRadius: 14,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div>
            <label className="ds-label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              className="ds-input"
            />
          </div>

          <div>
            <label className="ds-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="ds-input"
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: 13, color: '#c0392b',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 8, padding: '10px 14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="ds-btn ds-btn-solid"
            style={{ justifyContent: 'center', marginTop: 4 }}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
