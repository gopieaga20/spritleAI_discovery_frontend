import { useState } from 'react'
import SpritleLogo from '../components/SpritleLogo.jsx'
import { useLogout } from '../hooks/useAuth.js'
import SessionTable from '../components/admin/SessionTable.jsx'
import SessionDetail from '../components/admin/SessionDetail.jsx'
import LeadList from '../components/admin/LeadList.jsx'
import ConfigManager from '../components/admin/ConfigManager.jsx'

const TABS = ['Sessions', 'Leads', 'Config']

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('Sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const logout = useLogout()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ds-paper)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: 'var(--ds-ink)',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--ds-ink)',
          color: '#fff',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <SpritleLogo height={22} variant="color" />
          <span
            className="font-plex-mono"
            style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 14 }}
          >
            AI Readiness Discovery
          </span>
          <span
            className="font-plex-mono"
            style={{
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12, padding: '2px 8px',
            }}
          >
            Admin
          </span>
        </div>

        <button
          onClick={() => logout.mutate()}
          style={{
            marginLeft: 'auto',
            fontSize: 12, fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 7, padding: '6px 14px',
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'color 0.15s ease',
          }}
        >
          Sign out
        </button>
      </header>

      {/* Tab bar */}
      <nav
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--ds-line)',
          background: 'var(--ds-card)',
          padding: '0 28px',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`ds-tab${activeTab === tab ? ' is-active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: 28, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {activeTab === 'Sessions' && <SessionTable onSelect={(s) => setSelectedSession(s)} />}
        {activeTab === 'Leads' && <LeadList />}
        {activeTab === 'Config' && <ConfigManager />}
      </main>

      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}
