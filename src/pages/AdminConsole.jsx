import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SpritleLogo from '../components/SpritleLogo.jsx'
import { useLogout } from '../hooks/useAuth.js'
import SessionTable from '../components/admin/SessionTable.jsx'
import SessionDetail from '../components/admin/SessionDetail.jsx'
import LeadList from '../components/admin/LeadList.jsx'
import ConfigManager from '../components/admin/ConfigManager.jsx'
import apiClient from '../api/client.js'

const TABS = ['Sessions', 'Leads', 'Config']

const METRIC_META = {
  total_sessions:      { label: 'Sessions',   icon: '📋' },
  reports_viewed:      { label: 'Viewed',      icon: '👁' },
  reports_downloaded:  { label: 'Downloaded',  icon: '⬇' },
  total_leads:         { label: 'Leads',       icon: '🙋' },
}

function StatsStrip({ proData, liteData }) {
  const groups = [
    { label: 'Pro', icon: '📊', color: '#82C341', accentSoft: 'rgba(130,195,65,0.08)', data: proData },
    { label: 'Lite', icon: '⚡', color: '#15AED5', accentSoft: 'rgba(21,174,213,0.08)', data: liteData },
  ].filter((g) => g.data && typeof g.data === 'object')

  return (
    <div style={{
      display: 'flex', gap: 12,
      background: 'var(--ds-card)',
      border: '1px solid var(--ds-line)',
      borderRadius: 14,
      padding: '14px 18px',
      boxShadow: '0 2px 8px rgba(22,35,43,0.06)',
    }}>
      {groups.map((g, gi) => (
        <React.Fragment key={g.label}>
          {/* Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <div style={{
                background: g.color, borderRadius: 8,
                padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 13 }}>{g.icon}</span>
                <span className="font-plex-mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700 }}>
                  {g.label}
                </span>
              </div>
            </div>

            {/* Metrics inline */}
            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'nowrap' }}>
              {Object.entries(g.data).map(([k, v]) => {
                const meta = METRIC_META[k] || { label: k.replace(/_/g, ' '), icon: '•' }
                return (
                  <div key={k} style={{
                    flex: 1, minWidth: 0,
                    background: g.accentSoft,
                    border: `1px solid ${g.color}25`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    display: 'flex', flexDirection: 'column', gap: 3,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10 }}>{meta.icon}</span>
                      <span className="font-plex-mono" style={{ fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: g.color, fontWeight: 700 }}>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ds-ink)', lineHeight: 1 }}>
                      {typeof v === 'number' ? v.toLocaleString() : String(v)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider between groups */}
          {gi < groups.length - 1 && (
            <div style={{ width: 1, background: 'var(--ds-line)', borderRadius: 1, margin: '0 4px', flexShrink: 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('Sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const logout = useLogout()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get('/admin/stats/').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

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
      <main style={{ flex: 1, padding: 28, width: '100%' }}>
        {activeTab === 'Sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
            {/* Stats strip — Pro + Lite in one full-width row */}
            {stats && <StatsStrip proData={stats.pro} liteData={stats.lite} />}

            {/* Session table — full width below */}
            <SessionTable onSelect={(s) => setSelectedSession(s)} />
          </div>
        )}
        {activeTab === 'Leads' && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <LeadList />
          </div>
        )}
        {activeTab === 'Config' && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <ConfigManager />
          </div>
        )}
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
