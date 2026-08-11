import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

function SectionLabel({ children }) {
  return (
    <h3
      className="font-plex-mono"
      style={{
        fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--ds-ink-faint)', marginBottom: 12,
      }}
    >
      {children}
    </h3>
  )
}

function MiniBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--ds-ink-soft)', width: 112, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div className="ds-bar-track" style={{ flex: 1 }}>
        <div className="ds-bar-fill" style={{ width: `${value}%`, backgroundColor: color || 'var(--ds-teal)' }} />
      </div>
      <span className="font-plex-mono" style={{ fontSize: 11, color: 'var(--ds-ink-faint)', width: 28, textAlign: 'right' }}>
        {Math.round(value)}
      </span>
    </div>
  )
}

export default function SessionDetail({ session, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-session', session.id],
    queryFn: () => apiClient.get(`/admin/sessions/${session.id}/`).then((r) => r.data),
    enabled: !!session.id,
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(22,35,43,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--ds-card)',
          borderLeft: '1px solid var(--ds-line)',
          overflowY: 'auto',
          fontFamily: "'IBM Plex Sans', sans-serif",
          color: 'var(--ds-ink)',
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--ds-line)',
            position: 'sticky', top: 0,
            background: 'var(--ds-card)', zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{session.company_name || 'Session Detail'}</div>
            <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 2 }}>{session.client_email}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {session.session_id && (
              <a
                href={`/results/${session.session_id}?view=admin`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12, color: 'var(--ds-teal)',
                  border: '1px solid rgba(30,122,107,0.3)',
                  borderRadius: 6, padding: '4px 10px',
                  textDecoration: 'none', transition: 'border-color 0.15s',
                }}
              >
                View Report ↗
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                fontSize: 18, color: 'var(--ds-ink-faint)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="font-plex-mono" style={{ padding: 24, color: 'var(--ds-ink-faint)', fontSize: 13 }}>
            Loading…
          </p>
        ) : !data ? (
          <p style={{ padding: 24, color: '#c0392b', fontSize: 13 }}>Failed to load detail.</p>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Summary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Score', value: data.overall_score ?? '—' },
                { label: 'Tier', value: data.readiness_tier || '—' },
                { label: 'Automation', value: `${data.automation_potential ?? 0}%` },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: 'var(--ds-paper)', border: '1px solid var(--ds-line)',
                    borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Dimension breakdown */}
            {data.dimension_scores?.length > 0 && (
              <div>
                <SectionLabel>Dimension Breakdown</SectionLabel>
                {data.dimension_scores.map((d) => (
                  <MiniBar key={d.dimension_id} label={d.label || d.dimension_id} value={d.raw_score} color={d.color} />
                ))}
              </div>
            )}

            {/* KB Readiness */}
            {data.kb_result && (
              <div>
                <SectionLabel>Industry AI Readiness</SectionLabel>
                <div
                  style={{
                    background: 'var(--ds-paper)', border: '1px solid var(--ds-line)',
                    borderRadius: 10, padding: 16, marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{data.kb_result.readiness_tier_label}</span>
                    <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ds-teal)' }}>{data.kb_result.overall_readiness_score}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, marginBottom: 12 }}>
                    <div style={{ color: 'var(--ds-ink-soft)' }}>
                      Org Size: <strong style={{ color: 'var(--ds-ink)' }}>{data.kb_result.org_size_band}</strong>
                    </div>
                    <div style={{ color: 'var(--ds-ink-soft)' }}>
                      Complexity: <strong style={{ color: 'var(--ds-ink)' }}>{data.kb_result.complexity_tier}</strong>
                    </div>
                    {data.kb_result.estimated_cost_low != null && (
                      <div style={{ color: 'var(--ds-ink-soft)', gridColumn: '1/-1' }}>
                        Cost:{' '}
                        <strong style={{ color: 'var(--ds-ink)' }}>
                          ${data.kb_result.estimated_cost_low?.toLocaleString()} – ${data.kb_result.estimated_cost_high?.toLocaleString()}
                        </strong>
                        {' · '}Payback:{' '}
                        <strong style={{ color: 'var(--ds-ink)' }}>
                          {data.kb_result.payback_low_months}–{data.kb_result.payback_high_months} months
                        </strong>
                      </div>
                    )}
                  </div>
                  {Object.entries(data.kb_result.section_scores || {}).map(([name, sv]) => (
                    <MiniBar key={name} label={name} value={sv.raw_score} color="var(--ds-teal)" />
                  ))}
                </div>
                {data.kb_result.key_strengths?.length > 0 && (
                  <p style={{ fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#1a7a2e', fontWeight: 600 }}>Strengths: </span>
                    <span style={{ color: 'var(--ds-ink-soft)' }}>{data.kb_result.key_strengths.join(', ')}</span>
                  </p>
                )}
                {data.kb_result.key_gaps?.length > 0 && (
                  <p style={{ fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#d35400', fontWeight: 600 }}>Gaps: </span>
                    <span style={{ color: 'var(--ds-ink-soft)' }}>{data.kb_result.key_gaps.join(', ')}</span>
                  </p>
                )}
                {data.kb_result.critical_risks?.length > 0 && (
                  <p style={{ fontSize: 12 }}>
                    <span style={{ color: '#c0392b', fontWeight: 600 }}>Critical Risks: </span>
                    <span style={{ color: 'var(--ds-ink-soft)' }}>{data.kb_result.critical_risks.join('; ')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Recommended agents */}
            {data.agents?.length > 0 && (
              <div>
                <SectionLabel>Recommended AI Agents</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.agents.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        background: 'var(--ds-paper)', border: '1px solid var(--ds-line)',
                        borderRadius: 8, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{a.icon || '🤖'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)' }}>{a.category} · Phase {a.phase}</div>
                      </div>
                      <span className="font-plex-mono" style={{ fontSize: 11, color: 'var(--ds-ink-faint)' }}>#{a.rank}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain flags */}
            {data.pain_flags?.length > 0 && (
              <div>
                <SectionLabel>Key Challenges</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.pain_flags.map((f) => (
                    <span
                      key={f.id}
                      style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20,
                        color: '#c0392b',
                        background: 'rgba(192,57,43,0.07)',
                        border: '1px solid rgba(192,57,43,0.2)',
                      }}
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment snapshot */}
            {data.answers?.length > 0 && (
              <div>
                <SectionLabel>Assessment Snapshot</SectionLabel>
                {(() => {
                  const STAGE_ORDER = ['business', 'pain', 'rootcause', 'data', 'technology', 'compliance', 'readiness', 'output']
                  const groups = {}
                  const labelMap = {}
                  data.answers.forEach((a) => {
                    const key = a.stage_key || 'other'
                    if (!groups[key]) groups[key] = []
                    groups[key].push(a)
                    labelMap[key] = a.stage_label || a.stage_key || 'Other'
                  })
                  const ordered = [
                    ...STAGE_ORDER.filter((k) => groups[k]),
                    ...Object.keys(groups).filter((k) => !STAGE_ORDER.includes(k)),
                  ]
                  return ordered.map((stageKey) => (
                    <div key={stageKey} style={{ marginBottom: 20 }}>
                      <div
                        className="font-plex-mono"
                        style={{
                          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'var(--ds-teal)', fontWeight: 600,
                          borderBottom: '1px solid var(--ds-line-soft)', paddingBottom: 6, marginBottom: 10,
                        }}
                      >
                        {labelMap[stageKey]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {groups[stageKey].map((a, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'var(--ds-paper)', border: '1px solid var(--ds-line-soft)',
                              borderRadius: 8, padding: '10px 14px',
                            }}
                          >
                            <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginBottom: 3, lineHeight: 1.4 }}>
                              {a.question_prompt || a.question_key}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {a.answer_label || String(a.answer_value ?? '—')}
                            </div>
                            {a.note_text && (
                              <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', fontStyle: 'italic', marginTop: 4 }}>
                                {a.note_text}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
