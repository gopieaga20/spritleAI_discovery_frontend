import { useState } from 'react'
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
    <div className="min-h-screen bg-[#0b0e17] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-[#0f172a]">
        <span className="text-2xl">⚡</span>
        <span className="font-bold text-white text-base">Spritle AI Discovery</span>
        <span className="ml-1 text-xs text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
          Admin
        </span>
        <button
          onClick={() => logout.mutate()}
          className="ml-auto text-xs text-slate-400 hover:text-white border border-white/15 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-white/10 bg-[#0b0e17] px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-3 text-sm font-semibold border-b-2 transition-colors mr-2',
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'Sessions' && (
          <SessionTable onSelect={(s) => setSelectedSession(s)} />
        )}
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
