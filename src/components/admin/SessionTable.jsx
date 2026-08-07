import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

const TIER_COLOR = {
  Nascent: 'text-red-400 bg-red-500/10',
  Emerging: 'text-orange-400 bg-orange-500/10',
  Advanced: 'text-blue-400 bg-blue-500/10',
  Leader: 'text-green-400 bg-green-500/10',
}

export default function SessionTable({ onSelect }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => apiClient.get('/admin/sessions/').then((r) => r.data),
  })

  if (isLoading) return <div className="text-slate-400 text-sm p-4 animate-pulse">Loading sessions…</div>
  if (isError) return <div className="text-red-400 text-sm p-4">Failed to load sessions.</div>

  const sessions = data?.results ?? data ?? []

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Company</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Email</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Industry</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Score</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Tier</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No sessions yet.</td>
            </tr>
          )}
          {sessions.map((s) => (
            <tr
              key={s.id}
              onClick={() => onSelect(s)}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-white font-medium">{s.company_name || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{s.client_email || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{s.industry || '—'}</td>
              <td className="px-4 py-3 text-white font-bold">{s.overall_score ?? '—'}</td>
              <td className="px-4 py-3">
                {s.readiness_tier ? (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TIER_COLOR[s.readiness_tier] || ''}`}>
                    {s.readiness_tier}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'In progress'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
