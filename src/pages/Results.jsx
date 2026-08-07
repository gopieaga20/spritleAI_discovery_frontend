import { useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client.js'
import OtpModal from '../components/survey/OtpModal.jsx'

const PRINT_STYLES = `
@media print {
  @page { margin: 1.5cm; }
  body { background: #fff !important; color: #111 !important; }
  .no-print { display: none !important; }
  .print-page { background: #fff !important; color: #111 !important; padding-bottom: 0 !important; }
  .print-card {
    border: 1px solid #e2e8f0 !important;
    background: #fff !important;
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 16px !important;
  }
  .print-card * { color: #111 !important; }
  .print-card .dim-bar-track { background: #e2e8f0 !important; }
  .print-card .pain-item { border: 1px solid #fca5a5 !important; background: #fff5f5 !important; }
  .print-card .sol-item { border: 1px solid #bfdbfe !important; background: #eff6ff !important; }
  .print-card .answer-item { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
  .print-gauge circle:first-child { stroke: #e2e8f0 !important; }
  .print-gauge text { fill: #111 !important; }
  .print-gauge text:last-child { fill: #64748b !important; }
  .score-header { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
  h2.section-title { color: #1e293b !important; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
  .stage-label { color: #2563eb !important; }
  .answer-q { color: #64748b !important; }
  .answer-a { color: #111 !important; }
  .tier-label { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .metric-box { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
}
`

const TIER_META = {
  // Catalog-based tiers
  Nascent:  { color: '#ef4444', printColor: '#dc2626', bg: 'bg-red-500/10 border-red-500/30',    label: 'Nascent',  desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
  Emerging: { color: '#f97316', printColor: '#ea580c', bg: 'bg-orange-500/10 border-orange-500/30', label: 'Emerging', desc: 'You have building blocks in place. Targeted pilots will accelerate your journey.' },
  Advanced: { color: '#3b82f6', printColor: '#2563eb', bg: 'bg-blue-500/10 border-blue-500/30',   label: 'Advanced', desc: 'Strong AI capability. You are ready for scaled automation and intelligent workflows.' },
  Leader:   { color: '#22c55e', printColor: '#16a34a', bg: 'bg-green-500/10 border-green-500/30',  label: 'Leader',   desc: 'You are operating at the frontier of enterprise AI. Focus on value capture and competitive differentiation.' },
  // KB-based tiers
  'AI-Native Ready':    { color: '#22c55e', printColor: '#16a34a', bg: 'bg-green-500/10 border-green-500/30',  label: 'AI-Native Ready',    desc: 'Your organisation is primed for full AI adoption. Focus on scaling high-impact use cases across all functions.' },
  'Advancing':          { color: '#3b82f6', printColor: '#2563eb', bg: 'bg-blue-500/10 border-blue-500/30',   label: 'Advancing',          desc: 'Strong foundations in place. Targeted investments in data and tooling will unlock the next level.' },
  'Early / Exploratory':{ color: '#ef4444', printColor: '#dc2626', bg: 'bg-red-500/10 border-red-500/30',    label: 'Early / Exploratory', desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
}

function ScoreGauge({ score, tierColor }) {
  const radius = 80
  const circ = 2 * Math.PI * radius
  const filled = (score / 100) * circ
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto print-gauge">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e293b" strokeWidth="16" />
      <circle
        cx="100" cy="100" r={radius} fill="none"
        stroke={tierColor} strokeWidth="16"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
      />
      <text x="100" y="95" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold">{score}</text>
      <text x="100" y="120" textAnchor="middle" fill="#94a3b8" fontSize="13">/100</text>
    </svg>
  )
}

function DimensionBar({ name, raw, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-300">{name}</span>
        <span className="text-sm font-semibold text-white">{Math.round(raw)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 dim-bar-track">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${raw}%`, backgroundColor: color || '#3b82f6' }} />
      </div>
    </div>
  )
}

const STAGE_ORDER = ['business', 'pain', 'rootcause', 'data', 'technology', 'compliance', 'readiness', 'output']

export default function Results() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAdminView = searchParams.get('view') === 'admin'
  const [verified, setVerified] = useState(isAdminView)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => apiClient.get(`/sessions/${sessionId}/`).then((r) => r.data),
    enabled: !!sessionId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading your results…</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
        <div className="text-red-400 text-sm">Could not load results. The link may be invalid.</div>
      </div>
    )
  }

  // Prefer KB score when available — catalog scoring requires r_* questions not yet in survey flow
  const kb = data.kb_result
  const displayScore = kb ? Math.round(kb.overall_readiness_score) : (data.overall_score ?? 0)
  const displayTierKey = kb ? kb.readiness_tier_label : data.readiness_tier
  const tier = TIER_META[displayTierKey] || TIER_META['Nascent']

  const handleVerified = async ({ email, company_name }) => {
    try {
      await apiClient.patch(`/sessions/${sessionId}/contact/`, { client_email: email, company_name })
    } catch {
      // non-critical — still unlock report
    }
    setVerified(true)
    setShowForm(false)
  }

  // Group answers by stage in survey order
  const stageAnswers = {}
  const stageLabelMap = {}
  ;(data.answers || []).forEach((a) => {
    const key = a.stage_key || ''
    if (!STAGE_ORDER.includes(key)) return
    if (!stageAnswers[key]) stageAnswers[key] = []
    stageAnswers[key].push(a)
    stageLabelMap[key] = a.stage_label || key
  })
  const stagesWithData = STAGE_ORDER.filter((k) => stageAnswers[k]?.length)

  return (
    <>
    <div className="min-h-screen bg-[#0b0e17] text-white pb-20 print-page">
      <style>{PRINT_STYLES}</style>

      {/* Header — hidden on print */}
      <div className="no-print border-b border-white/10 bg-[#0f172a] py-4 px-6 flex items-center gap-3 mb-8">
        <span className="text-2xl">⚡</span>
        <span className="font-bold text-lg">Spritle AI Discovery</span>
        <span className="ml-auto text-slate-400 text-sm mr-4">AI Readiness Report</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          ↓ Download PDF
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block px-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <span className="font-bold text-lg text-gray-900">Spritle AI Discovery</span>
        </div>
        <div className="text-sm text-gray-500">AI Readiness Report — Confidential</div>
        {data.company_name && <div className="text-sm font-semibold text-gray-700 mt-1">{data.company_name}</div>}
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8 pb-8">

        {/* Score section */}
        <div className={`rounded-2xl border p-8 flex flex-col sm:flex-row items-center gap-8 score-header print-card ${tier.bg}`}>
          <ScoreGauge score={displayScore} tierColor={tier.color} />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Overall AI Readiness</div>
            <div className="text-4xl font-extrabold mb-1 tier-label" style={{ color: tier.color }}>{tier.label}</div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">{tier.desc}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/5 rounded-lg px-4 py-2 text-center metric-box">
                <div className="text-xl font-bold text-white">{data.automation_potential ?? 0}%</div>
                <div className="text-slate-500 text-xs mt-1">Automation Potential</div>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2 text-center metric-box">
                <div className="text-xl font-bold text-white">{data.opportunity_index ?? 0}</div>
                <div className="text-slate-500 text-xs mt-1">Opportunity Index</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report sections — blurred until user submits contact info */}
        <div className="relative">
          <div className={`space-y-8 ${!verified ? 'blur-sm pointer-events-none select-none' : ''}`}>

        {/* 1. Dimension Breakdown */}
        {data.dimension_scores?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
            <h2 className="text-lg font-bold text-white mb-5 section-title">Dimension Breakdown</h2>
            {data.dimension_scores.map((d) => (
              <DimensionBar key={d.dimension_id} name={d.label || d.dimension_id} raw={d.raw_score} color={d.color} />
            ))}
          </div>
        )}

        {/* 2. Industry AI Readiness (KB) */}
        {data.kb_result && (
          <>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-7 print-card">
              <h2 className="text-lg font-bold text-white mb-5 section-title">Industry AI Readiness</h2>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-extrabold text-indigo-400">{data.kb_result.overall_readiness_score}</div>
                  <div className="text-xs text-slate-400 mt-1">/100 readiness score</div>
                  <div className="mt-2 text-sm font-semibold text-indigo-300">{data.kb_result.readiness_tier_label}</div>
                </div>
                <div className="flex-1 w-full">
                  {Object.entries(data.kb_result.section_scores || {}).map(([name, sv]) => (
                    <div key={name} className="mb-2.5">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="truncate pr-2">{name}</span>
                        <span className="text-white font-medium">{Math.round(sv.raw_score)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${sv.raw_score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {data.kb_result.key_strengths?.length > 0 && (
                  <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3">
                    <div className="text-xs font-semibold text-green-400 mb-2">✦ Key Strengths</div>
                    {data.kb_result.key_strengths.map((s) => (
                      <div key={s} className="text-xs text-slate-300 leading-snug mb-1">{s}</div>
                    ))}
                  </div>
                )}
                {data.kb_result.key_gaps?.length > 0 && (
                  <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
                    <div className="text-xs font-semibold text-orange-400 mb-2">△ Key Gaps</div>
                    {data.kb_result.key_gaps.map((g) => (
                      <div key={g} className="text-xs text-slate-300 leading-snug mb-1">{g}</div>
                    ))}
                  </div>
                )}
                {data.kb_result.critical_risks?.length > 0 && (
                  <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                    <div className="text-xs font-semibold text-red-400 mb-2">⚠ Critical Risks</div>
                    {data.kb_result.critical_risks.map((r) => (
                      <div key={r} className="text-xs text-slate-300 leading-snug mb-1">{r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {data.kb_result.estimated_cost_low != null && (
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
                <h2 className="text-lg font-bold text-white mb-4 section-title">Implementation Estimate</h2>
                <div className="grid sm:grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-5 metric-box">
                    <div className="text-xl font-bold text-white">
                      ${(data.kb_result.estimated_cost_low / 1000).toFixed(0)}K – ${(data.kb_result.estimated_cost_high / 1000).toFixed(0)}K
                    </div>
                    <div className="text-slate-500 text-xs mt-1">Estimated Investment</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-5 metric-box">
                    <div className="text-xl font-bold text-white">{data.kb_result.payback_low_months}–{data.kb_result.payback_high_months} months</div>
                    <div className="text-slate-500 text-xs mt-1">Expected Payback</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-5 metric-box">
                    <div className="text-xl font-bold text-white">{data.kb_result.org_size_band}</div>
                    <div className="text-slate-500 text-xs mt-1">Organisation Size · {data.kb_result.complexity_tier} Complexity</div>
                  </div>
                </div>
              </div>
            )}

            {(data.kb_result.phase1_items?.length > 0 || data.kb_result.phase2_items?.length > 0) && (
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
                <h2 className="text-lg font-bold text-white mb-5 section-title">AI Agents & Workflows Roadmap</h2>
                {[
                  { label: 'Phase 1 — Quick Wins', items: data.kb_result.phase1_items, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5' },
                  { label: 'Phase 2 — Scale', items: data.kb_result.phase2_items, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                  { label: 'Phase 3 — Advanced', items: data.kb_result.phase3_items, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                ].filter(({ items }) => items?.length > 0).map(({ label, items, color, border, bg }) => (
                  <div key={label} className="mb-6 last:mb-0">
                    <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${color}`}>{label}</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div key={item.item_id} className={`rounded-xl ${bg} border ${border} p-3`}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-white leading-snug">{item.name}</span>
                            <span className={`text-xs font-bold shrink-0 ${color}`}>{item.priority_score.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-slate-400 mb-2 leading-snug line-clamp-2">{item.description}</div>
                          <div className="flex gap-3 text-xs text-slate-500">
                            {item.implementation_effort_months && <span>⏱ {item.implementation_effort_months}</span>}
                            {item.est_cost_low_usd != null && (
                              <span>💰 ${(item.est_cost_low_usd / 1000).toFixed(0)}K–${(item.est_cost_high_usd / 1000).toFixed(0)}K</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 3. Recommended AI Agents (catalog-based) */}
        {data.agents?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
            <h2 className="text-lg font-bold text-white mb-4 section-title">Recommended AI Agents</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.agents.map((a) => (
                <div key={a.id} className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{a.icon || '🤖'}</span>
                    <div>
                      <div className="font-semibold text-white text-sm leading-tight">{a.name}</div>
                      <span className="text-xs text-purple-400">{a.category}</span>
                    </div>
                  </div>
                  {a.what && <p className="text-xs text-slate-400 mb-2 leading-relaxed">{a.what}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {a.effort && <span>⏱ {a.effort}</span>}
                    {a.investment && <span>💰 {a.investment}</span>}
                    {a.roi_months && <span>📈 ROI in {a.roi_months}mo</span>}
                    <span className="ml-auto text-purple-400 font-semibold">Phase {a.phase}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Key Challenges Identified */}
        {data.pain_flags?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
            <h2 className="text-lg font-bold text-white mb-4 section-title">Key Challenges Identified</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.pain_flags.map((flag) => (
                <div key={flag.id} className="rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3 pain-item">
                  <div className="font-semibold text-sm text-red-300 mb-1">{flag.label}</div>
                  {flag.insight_message && <p className="text-slate-400 text-xs leading-relaxed">{flag.insight_message}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Recommended Solutions */}
        {data.solutions?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
            <h2 className="text-lg font-bold text-white mb-4 section-title">Recommended Solutions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.solutions.map((sol) => (
                <div key={sol.id} className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 sol-item">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5">{sol.category}</span>
                    <span className="text-xs text-slate-500">{sol.timeline}</span>
                  </div>
                  <div className="font-semibold text-white text-sm">{sol.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Effort: {sol.effort}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Assessment Snapshot */}
        {stagesWithData.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-7 print-card">
            <h2 className="text-lg font-bold text-white mb-5 section-title">Assessment Snapshot</h2>
            {stagesWithData.map((stageKey) => (
              <div key={stageKey} className="mb-6 last:mb-0">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 stage-label">
                  {stageLabelMap[stageKey]}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {stageAnswers[stageKey].map((a, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 answer-item">
                      <div className="text-xs text-slate-400 mb-0.5 leading-snug answer-q">{a.question_prompt || a.question_key}</div>
                      <div className="text-sm text-white font-medium answer-a">{a.answer_label || String(a.answer_value ?? '—')}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {verified && !isAdminView && (
          <div className="no-print rounded-2xl border border-white/10 bg-[#0f172a] p-7 text-center">
            <div className="text-2xl mb-3">🚀</div>
            <h2 className="text-lg font-bold text-white mb-2">Ready to accelerate your AI journey?</h2>
            <p className="text-slate-400 text-sm mb-5">Our team at Spritle will review your results and reach out with a tailored implementation roadmap.</p>
            <span className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors cursor-default">
              A Spritle advisor will be in touch soon
            </span>
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          Generated by Spritle AI Discovery Platform · spritle.com
        </div>

          </div>{/* end blur-sm wrapper */}

          {/* Overlay CTA — shown when not yet verified */}
          {!verified && (
            <div className="absolute inset-0 flex items-start justify-center pt-20 bg-gradient-to-b from-[#0b0e17]/10 via-[#0b0e17]/70 to-[#0b0e17] z-10">
              <div className="no-print text-center max-w-sm px-6 py-8 rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-2xl">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Your full report is ready</h3>
                <p className="text-slate-400 text-sm mb-6">Submit your information to view the complete report</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 text-sm transition-colors"
                >
                  Fill the form
                </button>
              </div>
            </div>
          )}
        </div>{/* end relative wrapper */}

      </div>
    </div>

    {showForm && <OtpModal onVerified={handleVerified} />}
    </>
  )
}
