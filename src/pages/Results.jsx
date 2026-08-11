import { useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SpritleLogo from '../components/SpritleLogo.jsx'
import apiClient from '../api/client.js'
import OtpModal from '../components/survey/OtpModal.jsx'

const PRINT_STYLES = `
/* Hidden on screen, visible only in print */
.print-only { display: none; }

@media print {
  /*
   * Re-anchor ALL design tokens to explicit light values.
   * This means every element using var(--ds-*) inline styles automatically
   * gets correct print colours without needing !important overrides.
   */
  :root {
    --ds-paper: #ffffff;
    --ds-card: #ffffff;
    --ds-ink: #16232b;
    --ds-ink-soft: #567382;
    --ds-ink-faint: #8a9ba8;
    --ds-line: #dde4e2;
    --ds-line-soft: #eeebe4;
    --ds-teal: #1E7A6B;
    --ds-teal-dark: #175E53;
    --ds-teal-soft: #e8f4f1;
    --bg: #ffffff;
  }

  @page { margin: 1.5cm; size: A4; }

  /* Force the browser to print background colours and images */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  body { background: #fff !important; color: #16232b !important; }

  .no-print   { display: none !important; }
  .print-only { display: block !important; }

  /* Lift any blur gate (unverified state) */
  .print-page [style*="blur"] { filter: none !important; }

  .print-page {
    background: #fff !important;
    color: #16232b !important;
    padding-bottom: 0 !important;
    min-height: 0 !important;
  }

  .print-card {
    border: 1px solid #dde4e2 !important;
    background: #fff !important;
    margin-bottom: 16px !important;
    break-inside: avoid;
    page-break-inside: avoid;
    border-radius: 12px !important;
    padding: 20px !important;
  }

  .print-item { break-inside: avoid; page-break-inside: avoid; }

  /* ── Progress bars ──────────────────────────────────────────────
   * 1. Remove transition: print snapshots the DOM before animation ends,
   *    so bars would appear at 0% width without this.
   * 2. Set a default fill colour for bars that have no inline backgroundColor
   *    (e.g. KB section bars only pass a width, not a colour).
   * ──────────────────────────────────────────────────────────────── */
  .ds-bar-fill {
    transition: none !important;
    background-color: #1E7A6B !important;
  }
  .ds-bar-track,
  .dim-bar-track { background: #dde4e2 !important; }

  /* Coloured sub-cards — keep their tinted backgrounds */
  .pain-item   { border: 1px solid #fca5a5 !important; background: #fff5f5 !important; }
  .sol-item    { border: 1px solid #bfdbfe !important; background: #eff6ff !important; }
  .answer-item { border: 1px solid #dde4e2 !important; background: #f8f5f0 !important; }

  /* SVG score gauge */
  .print-gauge circle:first-child { stroke: #dde4e2 !important; }
  .print-gauge text               { fill: #16232b !important; }
  .print-gauge text:last-child    { fill: #567382 !important; }

  /* Section headings */
  .ds-section-heading,
  h2.section-title {
    color: #16232b !important;
    border-bottom: 1px solid #dde4e2 !important;
    padding-bottom: 8px !important;
    margin-bottom: 16px !important;
  }

  /* Metric boxes */
  .metric-box { border: 1px solid #dde4e2 !important; background: #f8f5f0 !important; }
}
`

const TIER_META = {
  Nascent:  { color: '#c0392b', bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.25)', label: 'Nascent',  desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
  Emerging: { color: '#d35400', bg: 'rgba(211,84,0,0.06)',   border: 'rgba(211,84,0,0.25)',   label: 'Emerging', desc: 'You have building blocks in place. Targeted pilots will accelerate your journey.' },
  Advanced: { color: '#1E7A6B', bg: 'rgba(30,122,107,0.06)', border: 'rgba(30,122,107,0.25)', label: 'Advanced', desc: 'Strong AI capability. You are ready for scaled automation and intelligent workflows.' },
  Leader:   { color: '#1a7a2e', bg: 'rgba(26,122,46,0.06)',  border: 'rgba(26,122,46,0.25)',  label: 'Leader',   desc: 'You are operating at the frontier of enterprise AI. Focus on value capture and competitive differentiation.' },
  'AI-Native Ready':    { color: '#1a7a2e', bg: 'rgba(26,122,46,0.06)',  border: 'rgba(26,122,46,0.25)',  label: 'AI-Native Ready',    desc: 'Your organisation is primed for full AI adoption. Focus on scaling high-impact use cases across all functions.' },
  'Advancing':          { color: '#1E7A6B', bg: 'rgba(30,122,107,0.06)', border: 'rgba(30,122,107,0.25)', label: 'Advancing',          desc: 'Strong foundations in place. Targeted investments in data and tooling will unlock the next level.' },
  'Early / Exploratory':{ color: '#c0392b', bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.25)', label: 'Early / Exploratory', desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
}

function ScoreGauge({ score, tierColor }) {
  const radius = 80
  const circ = 2 * Math.PI * radius
  const filled = (score / 100) * circ
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto print-gauge">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--ds-line)" strokeWidth="16" />
      <circle
        cx="100" cy="100" r={radius} fill="none"
        stroke={tierColor} strokeWidth="16"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
      />
      <text x="100" y="95" textAnchor="middle" fill="var(--ds-ink)" fontSize="36" fontWeight="bold" fontFamily="'IBM Plex Mono', monospace">{score}</text>
      <text x="100" y="120" textAnchor="middle" fill="var(--ds-ink-soft)" fontSize="13" fontFamily="'IBM Plex Sans', sans-serif">/100</text>
    </svg>
  )
}

function DimensionBar({ name, raw, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--ds-ink-soft)' }}>{name}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-ink)', fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(raw)}%</span>
      </div>
      <div className="ds-bar-track dim-bar-track">
        <div className="ds-bar-fill" style={{ width: `${raw}%`, backgroundColor: color || 'var(--ds-teal)' }} />
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
      <div style={{ minHeight: '100vh', background: 'var(--ds-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p className="font-plex-mono" style={{ color: 'var(--ds-ink-faint)', fontSize: 13 }}>Loading your results…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ds-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ color: '#c0392b', fontSize: 13 }}>Could not load results. The link may be invalid.</p>
      </div>
    )
  }

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

  const card = {
    background: 'var(--ds-card)',
    border: '1px solid var(--ds-line)',
    borderRadius: 16,
    padding: 28,
  }

  return (
    <>
    <div className="print-page" style={{ minHeight: '100vh', background: 'var(--ds-paper)', paddingBottom: 80, fontFamily: "'IBM Plex Sans', sans-serif", color: 'var(--ds-ink)' }}>
      <style>{PRINT_STYLES}</style>

      {/* Header */}
      <div className="no-print" style={{ background: 'var(--ds-ink)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <SpritleLogo height={22} variant="color" />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 16 }}>AI Readiness Report</span>
        <button
          onClick={() => window.print()}
          className="ds-btn"
          style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '5px 14px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ↓ Download PDF
        </button>
      </div>

      {/* Print-only header */}
      <div className="print-only" style={{ padding: '0 16px 16px', marginBottom: 24, borderBottom: '2px solid var(--ds-line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
          {/* Left — brand */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SpritleLogo height={20} variant="color" />
          </div>
          {/* Center — report title */}
          <div className="font-newsreader" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ds-ink)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            AI Readiness Report — Confidential
          </div>
          {/* Right — company name */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-ink-soft)', textAlign: 'right' }}>
            {data.company_name || ''}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

        {/* Score section */}
        <div
          className="score-header print-card"
          style={{
            ...card,
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 32,
            background: tier.bg, border: `1px solid ${tier.border}`,
            flexWrap: 'wrap',
          }}
        >
          <ScoreGauge score={displayScore} tierColor={tier.color} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-ink-faint)', marginBottom: 6 }}>
              Overall AI Readiness
            </div>
            <div className="tier-label font-newsreader" style={{ fontSize: 36, fontWeight: 700, color: tier.color, lineHeight: 1.1, marginBottom: 8 }}>{tier.label}</div>
            <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>{tier.desc}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.automation_potential ?? 0}%</div>
                <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 3 }}>Automation Potential</div>
              </div>
              <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.opportunity_index ?? 0}</div>
                <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 3 }}>Opportunity Index</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report sections — blurred until verified */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, filter: verified ? 'none' : 'blur(5px)', pointerEvents: verified ? 'auto' : 'none', userSelect: verified ? 'auto' : 'none' }}>

            {/* 1. Dimension Breakdown */}
            {data.dimension_scores?.length > 0 && (
              <div style={card} className="print-card">
                <h2 className="ds-section-heading section-title font-newsreader">Dimension Breakdown</h2>
                {data.dimension_scores.map((d) => (
                  <DimensionBar key={d.dimension_id} name={d.label || d.dimension_id} raw={d.raw_score} color={d.color} />
                ))}
              </div>
            )}

            {/* 2. Industry AI Readiness (KB) */}
            {data.kb_result && (
              <>
                <div className="print-card" style={{ ...card, border: `1px solid rgba(30,122,107,0.3)`, background: 'rgba(30,122,107,0.04)' }}>
                  <h2 className="ds-section-heading section-title font-newsreader">Industry AI Readiness</h2>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="font-plex-mono" style={{ fontSize: 48, fontWeight: 800, color: 'var(--ds-teal)', lineHeight: 1 }}>{data.kb_result.overall_readiness_score}</div>
                      <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 4 }}>/100 readiness score</div>
                      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--ds-teal)' }}>{data.kb_result.readiness_tier_label}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {Object.entries(data.kb_result.section_scores || {}).map(([name, sv]) => (
                        <div key={name} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: 'var(--ds-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{name}</span>
                            <span className="font-plex-mono" style={{ color: 'var(--ds-ink)', fontWeight: 600 }}>{Math.round(sv.raw_score)}</span>
                          </div>
                          <div className="ds-bar-track"><div className="ds-bar-fill" style={{ width: `${sv.raw_score}%`, backgroundColor: 'var(--ds-teal)' }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
                    {data.kb_result.key_strengths?.length > 0 && (
                      <div style={{ borderRadius: 10, background: 'rgba(26,122,46,0.06)', border: '1px solid rgba(26,122,46,0.2)', padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a7a2e', marginBottom: 8 }}>✦ Key Strengths</div>
                        {data.kb_result.key_strengths.map((s) => (
                          <div key={s} style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.5, marginBottom: 4 }}>{s}</div>
                        ))}
                      </div>
                    )}
                    {data.kb_result.key_gaps?.length > 0 && (
                      <div style={{ borderRadius: 10, background: 'rgba(211,84,0,0.06)', border: '1px solid rgba(211,84,0,0.2)', padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#d35400', marginBottom: 8 }}>△ Key Gaps</div>
                        {data.kb_result.key_gaps.map((g) => (
                          <div key={g} style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.5, marginBottom: 4 }}>{g}</div>
                        ))}
                      </div>
                    )}
                    {data.kb_result.critical_risks?.length > 0 && (
                      <div style={{ borderRadius: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', marginBottom: 8 }}>⚠ Critical Risks</div>
                        {data.kb_result.critical_risks.map((r) => (
                          <div key={r} style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.5, marginBottom: 4 }}>{r}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {data.kb_result.estimated_cost_low != null && (
                  <div style={card} className="print-card">
                    <h2 className="ds-section-heading section-title font-newsreader">Implementation Estimate</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 4 }}>
                      <div className="metric-box" style={{ background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                        <div className="font-plex-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-ink)' }}>
                          ${(data.kb_result.estimated_cost_low / 1000).toFixed(0)}K – ${(data.kb_result.estimated_cost_high / 1000).toFixed(0)}K
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 4 }}>Estimated Investment</div>
                      </div>
                      <div className="metric-box" style={{ background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                        <div className="font-plex-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.kb_result.payback_low_months}–{data.kb_result.payback_high_months} months</div>
                        <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 4 }}>Expected Payback</div>
                      </div>
                      <div className="metric-box" style={{ background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                        <div className="font-plex-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.kb_result.org_size_band}</div>
                        <div style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 4 }}>{data.kb_result.complexity_tier} Complexity</div>
                      </div>
                    </div>
                  </div>
                )}

                {(data.kb_result.phase1_items?.length > 0 || data.kb_result.phase2_items?.length > 0) && (
                  <div style={card} className="print-card">
                    <h2 className="ds-section-heading section-title font-newsreader">AI Agents &amp; Workflows Roadmap</h2>
                    {[
                      { label: 'Phase 1 — Quick Wins', items: data.kb_result.phase1_items, color: '#1a7a2e', bg: 'rgba(26,122,46,0.05)', border: 'rgba(26,122,46,0.2)' },
                      { label: 'Phase 2 — Scale',      items: data.kb_result.phase2_items, color: '#1E7A6B', bg: 'rgba(30,122,107,0.05)', border: 'rgba(30,122,107,0.2)' },
                      { label: 'Phase 3 — Advanced',   items: data.kb_result.phase3_items, color: '#7c3aed', bg: 'rgba(124,58,237,0.05)', border: 'rgba(124,58,237,0.2)' },
                    ].filter(({ items }) => items?.length > 0).map(({ label, items, color, bg, border }) => (
                      <div key={label} style={{ marginBottom: 24 }}>
                        <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color, fontWeight: 700, marginBottom: 12 }}>{label}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {items.map((item) => (
                            <div key={item.item_id} className="print-item" style={{ borderRadius: 10, background: bg, border: `1px solid ${border}`, padding: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-ink)', lineHeight: 1.35 }}>{item.name}</span>
                                <span className="font-plex-mono" style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>{item.priority_score.toFixed(1)}</span>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginBottom: 8, lineHeight: 1.5 }}>{item.description}</div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ds-ink-faint)' }}>
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

            {/* 3. Recommended AI Agents */}
            {data.agents?.length > 0 && (
              <div style={card} className="print-card">
                <h2 className="ds-section-heading section-title font-newsreader">Recommended AI Agents</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {data.agents.map((a) => (
                    <div key={a.id} className="print-item" style={{ borderRadius: 10, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{a.icon || '🤖'}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ds-ink)' }}>{a.name}</div>
                          <span style={{ fontSize: 11, color: '#7c3aed' }}>{a.category}</span>
                        </div>
                      </div>
                      {a.what && <p style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.55, marginBottom: 8 }}>{a.what}</p>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--ds-ink-faint)' }}>
                        {a.effort && <span>⏱ {a.effort}</span>}
                        {a.investment && <span>💰 {a.investment}</span>}
                        {a.roi_months && <span>📈 ROI in {a.roi_months}mo</span>}
                        <span style={{ marginLeft: 'auto', color: '#7c3aed', fontWeight: 600 }}>Phase {a.phase}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Key Challenges */}
            {data.pain_flags?.length > 0 && (
              <div style={card} className="print-card">
                <h2 className="ds-section-heading section-title font-newsreader">Key Challenges Identified</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {data.pain_flags.map((flag) => (
                    <div key={flag.id} className="pain-item print-item" style={{ borderRadius: 10, background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.2)', padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#c0392b', marginBottom: 4 }}>{flag.label}</div>
                      {flag.insight_message && <p style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.55 }}>{flag.insight_message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Recommended Solutions */}
            {data.solutions?.length > 0 && (
              <div style={card} className="print-card">
                <h2 className="ds-section-heading section-title font-newsreader">Recommended Solutions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {data.solutions.map((sol) => (
                    <div key={sol.id} className="sol-item print-item" style={{ borderRadius: 10, background: 'rgba(30,122,107,0.05)', border: '1px solid rgba(30,122,107,0.2)', padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ds-teal)', background: 'rgba(30,122,107,0.1)', borderRadius: 20, padding: '2px 10px' }}>{sol.category}</span>
                        <span style={{ fontSize: 11, color: 'var(--ds-ink-faint)' }}>{sol.timeline}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ds-ink)' }}>{sol.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginTop: 4 }}>Effort: {sol.effort}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Assessment Snapshot */}
            {stagesWithData.length > 0 && (
              <div className="print-card" style={{ ...card, breakBefore: 'page', pageBreakBefore: 'always' }}>
                <h2 className="ds-section-heading section-title font-newsreader">Assessment Snapshot</h2>
                {stagesWithData.map((stageKey) => (
                  <div key={stageKey} style={{ marginBottom: 24 }}>
                    <div className="font-plex-mono stage-label" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-teal)', fontWeight: 700, borderBottom: '1px solid var(--ds-line)', paddingBottom: 6, marginBottom: 10 }}>
                      {stageLabelMap[stageKey]}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                      {stageAnswers[stageKey].map((a, i) => (
                        <div key={i} className="answer-item print-item" style={{ borderRadius: 8, background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', padding: '10px 12px' }}>
                          <div className="answer-q" style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginBottom: 3, lineHeight: 1.4 }}>{a.question_prompt || a.question_key}</div>
                          <div className="answer-a" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-ink)' }}>{a.answer_label || String(a.answer_value ?? '—')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {verified && !isAdminView && (
              <div className="no-print" style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🚀</div>
                <h2 className="font-newsreader" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ds-ink)', marginBottom: 8 }}>Ready to accelerate your AI journey?</h2>
                <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>Our team at Spritle will review your results and reach out with a tailored implementation roadmap.</p>
                <span className="ds-btn ds-btn-solid" style={{ cursor: 'default', pointerEvents: 'none', display: 'inline-flex', justifyContent: 'center' }}>
                  A Spritle advisor will be in touch soon
                </span>
              </div>
            )}

            {/* Print footer */}
            <div className="print-only" style={{ textAlign: 'center', fontSize: 12, color: 'var(--ds-ink-faint)', paddingTop: 16, borderTop: '1px solid var(--ds-line)' }}>
              Generated by Spritle AI Discovery Platform · spritle.com
            </div>
          </div>

          {/* Overlay CTA */}
          {!verified && (
            <div className="no-print" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, background: 'linear-gradient(to bottom, rgba(248,245,240,0.1), rgba(248,245,240,0.75) 35%, var(--ds-paper))', zIndex: 10 }}>
              <div style={{ textAlign: 'center', maxWidth: 360, padding: '32px 28px', background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 16, boxShadow: '0 12px 40px rgba(22,35,43,0.12)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <h3 className="font-newsreader" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ds-ink)', marginBottom: 8 }}>Your full report is ready</h3>
                <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', lineHeight: 1.65, marginBottom: 24 }}>Submit your information to view the complete report</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="ds-btn ds-btn-solid"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Fill the form
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>

    {showForm && <OtpModal onVerified={handleVerified} />}
    </>
  )
}
