import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

export default function LeadList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => apiClient.get('/admin/leads/').then((r) => r.data),
  })

  if (isLoading) return <div className="text-slate-400 text-sm p-4 animate-pulse">Loading leads…</div>
  if (isError) return <div className="text-red-400 text-sm p-4">Failed to load leads.</div>

  const leads = data?.results ?? data ?? []

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Name</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Email</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Company</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Verified</th>
            <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold">Signed up</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No leads yet.</td>
            </tr>
          )}
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-white font-medium">{lead.full_name || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{lead.email}</td>
              <td className="px-4 py-3 text-slate-400">{lead.company_name || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    lead.is_verified
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-yellow-400 bg-yellow-500/10'
                  }`}
                >
                  {lead.is_verified ? 'Verified' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
