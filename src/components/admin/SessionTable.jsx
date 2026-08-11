import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

const TIER_STYLE = {
  Nascent:  { color: '#c0392b', background: 'rgba(192,57,43,0.08)',  border: '1px solid rgba(192,57,43,0.2)' },
  Emerging: { color: '#d35400', background: 'rgba(211,84,0,0.08)',   border: '1px solid rgba(211,84,0,0.2)' },
  Advanced: { color: '#1E7A6B', background: 'rgba(30,122,107,0.08)', border: '1px solid rgba(30,122,107,0.25)' },
  Leader:   { color: '#1a7a2e', background: 'rgba(26,122,46,0.08)',  border: '1px solid rgba(26,122,46,0.2)' },
}

export default function SessionTable({ onSelect }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => apiClient.get('/admin/sessions/').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <p className="font-plex-mono" style={{ color: 'var(--ds-ink-faint)', fontSize: 13, padding: 16 }}>
        Loading sessions…
      </p>
    )
  }
  if (isError) {
    return <p style={{ color: '#c0392b', fontSize: 13, padding: 16 }}>Failed to load sessions.</p>
  }

  const sessions = data?.results ?? data ?? []

  return (
    <div className="ds-content-card" style={{ overflowX: 'auto' }}>
      <table className="ds-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Email</th>
            <th>Industry</th>
            <th>Score</th>
            <th>Tier</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{ textAlign: 'center', color: 'var(--ds-ink-faint)', padding: '32px 16px' }}
              >
                No sessions yet.
              </td>
            </tr>
          )}
          {sessions.map((s) => (
            <tr key={s.id} onClick={() => onSelect(s)}>
              <td style={{ fontWeight: 600 }}>{s.company_name || '—'}</td>
              <td style={{ color: 'var(--ds-ink-soft)' }}>{s.client_email || '—'}</td>
              <td style={{ color: 'var(--ds-ink-soft)' }}>{s.industry || '—'}</td>
              <td style={{ fontWeight: 700 }}>{s.overall_score ?? '—'}</td>
              <td>
                {s.readiness_tier ? (
                  <span
                    className="font-plex-mono"
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 20,
                      ...(TIER_STYLE[s.readiness_tier] || { color: 'var(--ds-ink-soft)', background: 'var(--ds-paper)', border: '1px solid var(--ds-line)' }),
                    }}
                  >
                    {s.readiness_tier}
                  </span>
                ) : '—'}
              </td>
              <td
                className="font-plex-mono"
                style={{ fontSize: 12, color: 'var(--ds-ink-faint)' }}
              >
                {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'In progress'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
