import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

export default function SessionDetail({ session, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-session', session.id],
    queryFn: () => apiClient.get(`/admin/sessions/${session.id}/`).then((r) => r.data),
    enabled: !!session.id,
  })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-lg bg-[#0f172a] border-l border-white/10 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0f172a]">
          <div>
            <div className="font-bold text-white">{session.company_name || 'Session Detail'}</div>
            <div className="text-xs text-slate-400">{session.client_email}</div>
          </div>
          <div className="flex items-center gap-2">
            {session.session_id && (
              <a
                href={`/results/${session.session_id}?view=admin`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded px-2 py-1 transition-colors"
              >
                View Full Report ↗
              </a>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl ml-1">✕</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : !data ? (
          <div className="p-6 text-red-400 text-sm">Failed to load detail.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Summary metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Score', value: data.overall_score ?? '—' },
                { label: 'Tier', value: data.readiness_tier || '—' },
                { label: 'Automation', value: `${data.automation_potential ?? 0}%` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-center">
                  <div className="text-lg font-bold text-white">{m.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Dimension scores */}
            {data.dimension_scores?.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Dimension Breakdown</h3>
                {data.dimension_scores.map((d) => (
                  <div key={d.dimension_id} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-300 w-28 truncate">{d.label || d.dimension_id}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full" style={{ width: `${d.raw_score}%`, backgroundColor: d.color || '#3b82f6' }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{Math.round(d.raw_score)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* KB Readiness Result */}
            {data.kb_result && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Industry AI Readiness</h3>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{data.kb_result.readiness_tier_label}</span>
                    <span className="text-2xl font-extrabold text-blue-400">{data.kb_result.overall_readiness_score}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="text-slate-400">Org Size: <span className="text-white">{data.kb_result.org_size_band}</span></div>
                    <div className="text-slate-400">Complexity: <span className="text-white">{data.kb_result.complexity_tier}</span></div>
                    {data.kb_result.estimated_cost_low != null && (
                      <div className="text-slate-400 col-span-2">
                        Cost: <span className="text-white">${data.kb_result.estimated_cost_low?.toLocaleString()} – ${data.kb_result.estimated_cost_high?.toLocaleString()}</span>
                        {' · '}Payback: <span className="text-white">{data.kb_result.payback_low_months}–{data.kb_result.payback_high_months} months</span>
                      </div>
                    )}
                  </div>
                  {Object.entries(data.kb_result.section_scores || {}).map(([name, sv]) => (
                    <div key={name} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-slate-400 w-36 truncate">{name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${sv.raw_score}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{Math.round(sv.raw_score)}</span>
                    </div>
                  ))}
                </div>
                {data.kb_result.key_strengths?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-green-400 font-semibold">Strengths: </span>
                    <span className="text-xs text-slate-300">{data.kb_result.key_strengths.join(', ')}</span>
                  </div>
                )}
                {data.kb_result.key_gaps?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-orange-400 font-semibold">Gaps: </span>
                    <span className="text-xs text-slate-300">{data.kb_result.key_gaps.join(', ')}</span>
                  </div>
                )}
                {data.kb_result.critical_risks?.length > 0 && (
                  <div>
                    <span className="text-xs text-red-400 font-semibold">Critical Risks: </span>
                    <span className="text-xs text-slate-300">{data.kb_result.critical_risks.join('; ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Agents */}
            {data.agents?.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Recommended AI Agents</h3>
                <div className="space-y-2">
                  {data.agents.map((a) => (
                    <div key={a.id} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-3">
                      <span className="text-lg">{a.icon || '🤖'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{a.name}</div>
                        <div className="text-xs text-slate-400">{a.category} · Phase {a.phase}</div>
                      </div>
                      <span className="text-xs text-slate-500">#{a.rank}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain flags */}
            {data.pain_flags?.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Key Challenges Identified</h3>
                <div className="flex flex-wrap gap-2">
                  {data.pain_flags.map((f) => (
                    <span key={f.id} className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 rounded-full px-2 py-1">
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Answers grouped by stage in survey order */}
            {data.answers?.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3">Assessment Snapshot</h3>
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
                    <div key={stageKey} className="mb-5">
                      <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                        {labelMap[stageKey]}
                      </div>
                      <div className="space-y-2">
                        {groups[stageKey].map((a, i) => (
                          <div key={i} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                            <div className="text-xs text-slate-400 mb-0.5 leading-snug">
                              {a.question_prompt || a.question_key}
                            </div>
                            <div className="text-sm text-white font-medium">
                              {a.answer_label || String(a.answer_value ?? '—')}
                            </div>
                            {a.note_text && (
                              <div className="text-xs text-slate-500 italic mt-1">{a.note_text}</div>
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
