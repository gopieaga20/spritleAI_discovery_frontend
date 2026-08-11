import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

export default function LeadList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => apiClient.get('/admin/leads/').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <p className="font-plex-mono" style={{ color: 'var(--ds-ink-faint)', fontSize: 13, padding: 16 }}>
        Loading leads…
      </p>
    )
  }
  if (isError) {
    return <p style={{ color: '#c0392b', fontSize: 13, padding: 16 }}>Failed to load leads.</p>
  }

  const leads = data?.results ?? data ?? []

  return (
    <div className="ds-content-card" style={{ overflowX: 'auto' }}>
      <table className="ds-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Verified</th>
            <th>Signed up</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{ textAlign: 'center', color: 'var(--ds-ink-faint)', padding: '32px 16px' }}
              >
                No leads yet.
              </td>
            </tr>
          )}
          {leads.map((lead) => (
            <tr key={lead.id} style={{ cursor: 'default' }}>
              <td style={{ fontWeight: 600 }}>{lead.full_name || '—'}</td>
              <td style={{ color: 'var(--ds-ink-soft)' }}>{lead.email}</td>
              <td style={{ color: 'var(--ds-ink-soft)' }}>{lead.company_name || '—'}</td>
              <td>
                <span
                  className="font-plex-mono"
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    color: lead.is_verified ? '#1a7a2e' : '#a05c00',
                    background: lead.is_verified ? 'rgba(26,122,46,0.08)' : 'rgba(160,92,0,0.08)',
                    border: lead.is_verified ? '1px solid rgba(26,122,46,0.2)' : '1px solid rgba(160,92,0,0.2)',
                  }}
                >
                  {lead.is_verified ? 'Verified' : 'Pending'}
                </span>
              </td>
              <td
                className="font-plex-mono"
                style={{ fontSize: 12, color: 'var(--ds-ink-faint)' }}
              >
                {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
