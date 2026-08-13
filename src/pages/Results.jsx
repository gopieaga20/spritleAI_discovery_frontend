import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
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

  @page { margin: 1cm 1.5cm; size: A4; }

  /* Force the browser to print background colours and images */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  body { background: #fff !important; color: #16232b !important; }

  .no-print   { display: none !important; }
  .print-only { display: block !important; }

  /* Lift any blur gate (unverified state) — target only elements with an explicit blur() filter */
  .print-page [style*="blur("] { filter: none !important; }

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
   * Remove transition: print snapshots DOM before animation ends.
   * Do NOT override background-color — bars use score-based inline colors.
   * ──────────────────────────────────────────────────────────────── */
  .ds-bar-fill {
    transition: none !important;
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

function getScoreColor(score) {
  if (score <= 30) return '#c0392b'
  if (score <= 60) return '#DB9130'
  if (score <= 80) return '#15AED5'
  return '#1a7a2e'
}

const TIER_META = {
  Nascent: { color: '#c0392b', bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.25)', label: 'Nascent', desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
  Emerging: { color: '#d35400', bg: 'rgba(211,84,0,0.06)', border: 'rgba(211,84,0,0.25)', label: 'Emerging', desc: 'You have building blocks in place. Targeted pilots will accelerate your journey.' },
  Advanced: { color: '#1E7A6B', bg: 'rgba(30,122,107,0.06)', border: 'rgba(30,122,107,0.25)', label: 'Advanced', desc: 'Strong AI capability. You are ready for scaled automation and intelligent workflows.' },
  Leader: { color: '#1a7a2e', bg: 'rgba(26,122,46,0.06)', border: 'rgba(26,122,46,0.25)', label: 'Leader', desc: 'You are operating at the frontier of enterprise AI. Focus on value capture and competitive differentiation.' },
  'AI-Native Ready': { color: '#1a7a2e', bg: 'rgba(26,122,46,0.06)', border: 'rgba(26,122,46,0.25)', label: 'AI-Native Ready', desc: 'Your organisation is primed for full AI adoption. Focus on scaling high-impact use cases across all functions.' },
  'Advancing': { color: '#1E7A6B', bg: 'rgba(30,122,107,0.06)', border: 'rgba(30,122,107,0.25)', label: 'Advancing', desc: 'Strong foundations in place. Targeted investments in data and tooling will unlock the next level.' },
  'Early / Exploratory': { color: '#c0392b', bg: 'rgba(192,57,43,0.06)', border: 'rgba(192,57,43,0.25)', label: 'Early / Exploratory', desc: 'AI adoption is at an early stage. Focus on foundational data and process improvements.' },
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

function InfoTooltip({ lines }) {
  const [visible, setVisible] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'default' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, borderRadius: '50%',
        background: 'var(--ds-line)', color: 'var(--ds-ink-soft)',
        fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
        flexShrink: 0, lineHeight: 1, userSelect: 'none',
      }}>i</span>
      {visible && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ds-ink)', color: '#fff',
          borderRadius: 8, padding: '8px 12px',
          width: 220, zIndex: 100,
          boxShadow: '0 4px 16px rgba(22,35,43,0.25)',
          pointerEvents: 'none',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{ margin: i === 0 ? '0 0 4px' : 0, fontSize: 11, lineHeight: 1.55, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)' }}>
              {line}
            </p>
          ))}
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--ds-ink)',
          }} />
        </div>
      )}
    </span>
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

function RoadmapItem({ item, blurred }) {
  return (
    <div className="print-item" style={{ borderRadius: 10, background: item._bg, border: `1px solid ${item._border}`, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-ink)', lineHeight: 1.35 }}>{item.name}</span>
        <span className="font-plex-mono" style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, color: item._color }}>{item.priority_score.toFixed(1)}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginBottom: 8, lineHeight: 1.5, filter: blurred ? 'blur(4px)' : 'none', userSelect: blurred ? 'none' : 'auto', transition: 'filter 0.3s' }}>{item.description}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ds-ink-soft)', filter: blurred ? 'blur(4px)' : 'none', userSelect: blurred ? 'none' : 'auto', transition: 'filter 0.3s' }}>
        {item.implementation_effort_months && <span>⏱ {item.implementation_effort_months}</span>}
        {item.est_cost_low_usd != null && item.est_cost_high_usd != null && (
          <span>💰 ${(item.est_cost_low_usd / 1000).toFixed(0)}K–${(item.est_cost_high_usd / 1000).toFixed(0)}K</span>
        )}
      </div>
    </div>
  )
}

// Pro stage keys
const PRO_STAGE_ORDER = ['business', 'pain', 'rootcause', 'data', 'technology', 'compliance', 'readiness', 'output']
// Lite stage keys
const LITE_STAGE_ORDER = ['bu', 'pp', 'rc', 'ar', 'op', 'bp']

export default function Results() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAdminView = searchParams.get('view') === 'admin'
  const [verified, setVerified] = useState(isAdminView)
  const [showForm, setShowForm] = useState(false)
  const [formPurpose, setFormPurpose] = useState('download') // 'download' | 'contact'
  const [talkSubmitted, setTalkSubmitted] = useState(false)
  const [showRoadmapAll, setShowRoadmapAll] = useState(false)
  const viewedFired = useRef(false)
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
  // Trust config_type from backend; only fall back to KB field when config_type is absent AND no pro-specific fields present
  const isLite = data.config_type === 'lite' || (data.config_type == null && kb?.ai_readiness_score != null && data.automation_potential == null)
  const displayScore = kb ? Math.round(kb.overall_readiness_score) : (data.overall_score ?? 0)
  const rawTierKey = kb ? kb.readiness_tier_label : data.readiness_tier
  // Strip " (Lite)" suffix — shown as a badge instead
  const displayTierKey = rawTierKey?.replace(/\s*\(Lite\)\s*$/i, '') || rawTierKey
  const tier = TIER_META[displayTierKey] || TIER_META['Nascent']

  useEffect(() => {
    if (!data || isAdminView || viewedFired.current) return
    viewedFired.current = true
    apiClient.post(`/sessions/${sessionId}/report-viewed/`).catch(() => {})
  }, [data, isAdminView, sessionId])

  const handleVerified = async ({ email, company_name }) => {
    try {
      await apiClient.patch(`/sessions/${sessionId}/contact/`, { client_email: email, company_name })
    } catch {
      // non-critical — still unlock report
    }
    setVerified(true)
    setShowForm(false)
    if (formPurpose === 'download') {
      apiClient.post(`/sessions/${sessionId}/report-downloaded/`).catch(() => {})
      setTimeout(() => window.print(), 350)
    } else {
      setTalkSubmitted(true)
    }
  }

  const handleDownload = () => {
    setFormPurpose('download')
    if (!verified && !isAdminView) {
      setShowForm(true)
    } else {
      apiClient.post(`/sessions/${sessionId}/report-downloaded/`).catch(() => {})
      window.print()
    }
  }

  const handleTalkToUs = () => {
    setFormPurpose('contact')
    if (!verified) {
      setShowForm(true)
    } else {
      setTalkSubmitted(true)
    }
  }

  const STAGE_ORDER = isLite ? LITE_STAGE_ORDER : PRO_STAGE_ORDER
  const stageAnswers = {}
  const stageLabelMap = {}
    ; (data.answers || []).forEach((a) => {
      const key = (a.stage_key || '').toLowerCase()
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
            onClick={handleDownload}
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
              <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-ink-soft)', marginBottom: 6 }}>
                Overall AI Readiness
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <div className="tier-label font-newsreader" style={{ fontSize: 36, fontWeight: 700, color: tier.color, lineHeight: 1.1 }}>{tier.label}</div>
                <span
                  className="font-plex-mono"
                  style={{
                    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#fff', fontWeight: 600,
                    background: isLite ? '#15AED5' : '#82C341',
                    borderRadius: 10, padding: '3px 10px', flexShrink: 0,
                  }}
                >
                  {isLite ? 'Lite' : 'Pro'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>{tier.desc}</p>

              {isLite ? (
                /* Lite: two composite score tiles */
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: kb?.ai_readiness_score != null ? getScoreColor(kb.ai_readiness_score) : 'var(--ds-ink-faint)' }}>
                      {kb?.ai_readiness_score != null ? Math.round(kb.ai_readiness_score) : '—'}
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ds-ink-faint)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      AI Capability Score
                      <InfoTooltip lines={[
                        'Measures your organisation\'s current AI infrastructure and skills maturity.',
                        'Higher scores reflect strong data pipelines, tooling, and AI-ready talent.',
                      ]} />
                    </div>
                  </div>
                  <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: kb?.transformation_urgency_score != null ? getScoreColor(kb.transformation_urgency_score) : 'var(--ds-ink-soft)' }}>
                      {kb?.transformation_urgency_score != null ? Math.round(kb.transformation_urgency_score) : '—'}
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ds-ink-soft)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      Transformation Urgency
                      <InfoTooltip lines={[
                        'Reflects how pressing the need for AI-driven change is in your business context.',
                        'Higher scores indicate competitive pressure or growth opportunities demanding action.',
                      ]} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Pro: automation potential + opportunity index */
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.automation_potential ?? 0}%</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      Automation Potential
                      <InfoTooltip lines={[
                        'Percentage of your workflows that could be automated with current AI technology.',
                        'Derived from your process complexity, data availability, and technology maturity answers.',
                      ]} />
                    </div>
                  </div>
                  <div className="metric-box" style={{ background: 'var(--ds-card)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                    <div className="font-plex-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.opportunity_index ?? 0}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      Opportunity Index
                      <InfoTooltip lines={[
                        'A composite score reflecting the size and urgency of your AI opportunity.',
                        'Higher scores indicate more untapped value across cost savings, revenue, and efficiency gains.',
                      ]} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report sections */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* 1. Dimension Breakdown — commented out
            {(isLite
              ? Object.keys(data.kb_result?.section_scores || {}).length > 0
              : data.dimension_scores?.length > 0
            ) && (
              <div style={card} className="print-card">
                <h2 className="ds-section-heading section-title font-newsreader">Dimension Breakdown</h2>
                {isLite
                  ? Object.entries(data.kb_result.section_scores).map(([key, sv]) => (
                      <DimensionBar
                        key={key}
                        name={key.replace(/_/g, ' ')}
                        raw={sv.raw_score}
                      />
                    ))
                  : data.dimension_scores.map((d) => (
                      <DimensionBar key={d.dimension_id} name={d.label || d.dimension_id} raw={d.raw_score} color={d.color} />
                    ))
                }
              </div>
            )}
            */}

              {/* 2. Industry AI Readiness (KB) */}
              {data.kb_result && (
                <>
                  <div className="print-card" style={{ ...card, border: `1px solid rgba(30,122,107,0.3)`, background: 'rgba(30,122,107,0.04)' }}>
                    <h2 className="ds-section-heading section-title font-newsreader">AI Readiness for your Organization</h2>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div className="font-plex-mono" style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(data.kb_result.overall_readiness_score), lineHeight: 1 }}>{data.kb_result.overall_readiness_score}</div>
                        <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 4 }}>/100 readiness score</div>
                        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: getScoreColor(data.kb_result.overall_readiness_score) }}>{data.kb_result.readiness_tier_label}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {Object.entries(data.kb_result.section_scores || {}).map(([name, sv]) => (
                          <div key={name} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                              <span style={{ color: 'var(--ds-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{name}</span>
                              <span className="font-plex-mono" style={{ color: 'var(--ds-ink)', fontWeight: 600 }}>{Math.round(sv.raw_score)}</span>
                            </div>
                            <div className="ds-bar-track"><div className="ds-bar-fill" style={{ width: `${sv.raw_score}%`, backgroundColor: getScoreColor(sv.raw_score) }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
                      {data.kb_result.key_strengths?.length > 0 && (
                        <div style={{ borderRadius: 10, background: 'rgba(26,122,46,0.06)', border: '1px solid rgba(26,122,46,0.2)', padding: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a7a2e', marginBottom: 8 }}>✦ Key Strengths</div>
                          {data.kb_result.key_strengths.map((s) => (
                            <div key={s} style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.5, marginBottom: 4 }}>{s}</div>
                          ))}
                        </div>
                      )}
                      {data.kb_result.key_gaps?.length > 0 && (
                        <div style={{ borderRadius: 10, background: 'rgba(211,84,0,0.06)', border: '1px solid rgba(211,84,0,0.2)', padding: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#d35400', marginBottom: 8 }}>△ Key Gaps</div>
                          {data.kb_result.key_gaps.map((g) => (
                            <div key={g} style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.5, marginBottom: 4 }}>{g}</div>
                          ))}
                        </div>
                      )}
                      {data.kb_result.critical_risks?.length > 0 && (
                        <div style={{ borderRadius: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', padding: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#c0392b', marginBottom: 8 }}>⚠ Critical Risks</div>
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
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4 }}>Estimated Investment</div>
                        </div>
                        <div className="metric-box" style={{ background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                          <div className="font-plex-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.kb_result.payback_low_months}–{data.kb_result.payback_high_months} months</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4 }}>Expected Payback</div>
                        </div>
                        <div className="metric-box" style={{ background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                          <div className="font-plex-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ds-ink)' }}>{data.kb_result.org_size_band}</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-ink)', marginTop: 4 }}>{data.kb_result.complexity_tier} Complexity</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--ds-line)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          flexShrink: 0, alignSelf: 'flex-start', marginTop: 3,
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'rgba(85,102,109,0.12)', border: '1px solid rgba(85,102,109,0.3)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'var(--ds-ink-soft)',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>i</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.7 }}>
                          The numbers above offer a preliminary estimate based on your survey input. We will work together to finalize the exact details, scope, and figures during our follow-up meeting.
                        </p>
                      </div>
                    </div>
                  )}

                  {(data.kb_result.phase1_items?.length > 0 || data.kb_result.phase2_items?.length > 0 || data.kb_result.phase3_items?.length > 0) && (() => {
                    const phaseGroups = [
                      { label: 'Phase 1 — Quick Wins', items: data.kb_result.phase1_items, color: '#1a7a2e', bg: 'rgba(26,122,46,0.05)', border: 'rgba(26,122,46,0.2)' },
                      { label: 'Phase 2 — Scale', items: data.kb_result.phase2_items, color: '#1E7A6B', bg: 'rgba(30,122,107,0.05)', border: 'rgba(30,122,107,0.2)' },
                      { label: 'Phase 3 — Advanced', items: data.kb_result.phase3_items, color: '#7c3aed', bg: 'rgba(124,58,237,0.05)', border: 'rgba(124,58,237,0.2)' },
                    ].filter(({ items }) => items?.length > 0)
                    const allItems = phaseGroups.flatMap(({ items, color, bg, border }) =>
                      (items || []).map((item) => ({ ...item, _color: color, _bg: bg, _border: border }))
                    ).sort((a, b) => b.priority_score - a.priority_score)
                    const top5 = allItems.slice(0, 5)
                    return (
                      <div style={card} className="print-card">
                        <h2 className="ds-section-heading section-title font-newsreader">AI Agents &amp; Workflows Roadmap</h2>

                        {/* ── Print: Top 5 then all phases ── */}
                        <div className="print-only">
                          {/* Top 5 */}
                          <div style={{ marginBottom: 24 }}>
                            <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#DB9130', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                              ★ Top Priority Initiatives
                              <span style={{ background: 'rgba(219,145,48,0.12)', border: '1px solid rgba(219,145,48,0.3)', borderRadius: 8, padding: '1px 8px', fontSize: 10, color: '#DB9130' }}>Sorted by impact score</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                              {top5.map((item) => <RoadmapItem key={item.item_id} item={item} blurred={false} />)}
                            </div>
                          </div>
                          {/* Phase breakdown */}
                          {phaseGroups.map(({ label, items: phaseItems, color, bg, border }) => (
                            <div key={label} style={{ marginBottom: 24 }}>
                              <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color, fontWeight: 700, marginBottom: 12 }}>{label}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {phaseItems.map((item) => <RoadmapItem key={item.item_id} item={{ ...item, _color: color, _bg: bg, _border: border }} blurred={false} />)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ── Screen: blur description/cost per card when not verified ── */}
                        <div className="no-print" style={{ position: 'relative' }}>
                          <div>
                            <div style={{ marginBottom: 20 }}>
                              <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#DB9130', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                ★ Top Priority Initiatives
                                <span style={{ background: 'rgba(219,145,48,0.12)', border: '1px solid rgba(219,145,48,0.3)', borderRadius: 8, padding: '1px 8px', fontSize: 10, color: '#DB9130' }}>Sorted by impact score</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                {top5.map((item) => <RoadmapItem key={item.item_id} item={item} blurred={!verified} />)}
                              </div>
                            </div>

                            {allItems.length > 5 && verified && (
                              <div>
                                <button
                                  onClick={() => setShowRoadmapAll((v) => !v)}
                                  style={{ fontSize: 13, color: 'var(--ds-teal)', background: 'none', border: '1px solid var(--ds-line)', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: showRoadmapAll ? 16 : 0 }}
                                >
                                  {showRoadmapAll ? '▲ Show top 5 only' : `▼ View all ${allItems.length} initiatives by phase`}
                                </button>
                              </div>
                            )}

                            {showRoadmapAll && verified && (
                              <div style={{ marginTop: 16 }}>
                                {phaseGroups.map(({ label, items: phaseItems, color, bg, border }) => (
                                  <div key={label} style={{ marginBottom: 24 }}>
                                    <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color, fontWeight: 700, marginBottom: 12 }}>{label}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                                      {phaseItems.map((item) => <RoadmapItem key={item.item_id} item={{ ...item, _color: color, _bg: bg, _border: border }} blurred={false} />)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Unlock CTA below cards */}
                          {!verified && (
                            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                              <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
                                🔒 Share your details to unlock the full agent descriptions and cost estimates.
                              </p>
                              <button
                                onClick={() => { setFormPurpose('contact'); setShowForm(true) }}
                                style={{
                                  padding: '9px 22px',
                                  background: 'var(--ds-teal)', color: '#fff',
                                  border: 'none', borderRadius: 9,
                                  fontSize: 13, fontWeight: 700,
                                  cursor: 'pointer', fontFamily: 'inherit',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ds-teal-dark)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ds-teal)' }}
                              >
                                Unlock →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
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
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#7c3aed' }}>{a.category}</span>
                          </div>
                        </div>
                        {a.what && <p style={{ fontSize: 12, color: 'var(--ds-ink-soft)', lineHeight: 1.55, marginBottom: 8 }}>{a.what}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--ds-ink-soft)' }}>
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
                          <span style={{ fontSize: 12, color: 'var(--ds-ink-soft)' }}>{sol.timeline}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ds-ink)' }}>{sol.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 4 }}>Effort: {sol.effort}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Assessment Snapshot — admin only */}
              {isAdminView && stagesWithData.length > 0 && (
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

              {/* Sticky Talk to Us panel rendered outside scroll area — see below */}

              {/* Print footer */}
              <div className="print-only" style={{ textAlign: 'center', fontSize: 12, color: 'var(--ds-ink-faint)', paddingTop: 16, borderTop: '1px solid var(--ds-line)' }}>
                Generated by Spritle AI Discovery Platform · spritle.com
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Sticky Talk to Us — right side of viewport */}
      {!isAdminView && (
        <div className="no-print" style={{
          position: 'fixed', right: 12, top: '50%', transform: 'translateY(-50%)',
          width: 224, zIndex: 200,
          background: 'var(--ds-card)',
          border: '1px solid var(--ds-line)',
          borderRadius: 20,
          padding: '26px 20px',
          boxShadow: '0 8px 36px rgba(22,35,43,0.15)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 13,
        }}>
          {/* Teal accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 3, background: 'var(--ds-teal)', borderRadius: '0 0 4px 4px' }} />

          <div style={{ fontSize: 34, marginTop: 4 }}>💬</div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ds-ink)', marginBottom: 5 }}>Talk to Us</div>
            <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', lineHeight: 1.6, margin: 0 }}>
              Get a tailored roadmap from our AI experts.
            </p>
          </div>

          {talkSubmitted ? (
            <div style={{
              width: '100%', fontSize: 13, fontWeight: 600, color: '#1a7a2e',
              background: 'rgba(26,122,46,0.09)', border: '1px solid rgba(26,122,46,0.25)',
              borderRadius: 9, padding: '10px 12px', lineHeight: 1.4,
            }}>
              ✓ We'll be in touch soon!
            </div>
          ) : (
            <button
              onClick={handleTalkToUs}
              style={{
                width: '100%', padding: '11px 0',
                background: 'var(--ds-teal)', color: '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ds-teal-dark)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ds-teal)' }}
            >
              Get in touch →
            </button>
          )}

          <p style={{ fontSize: 10, color: 'var(--ds-ink-faint)', margin: 0, lineHeight: 1.5 }}>
            No commitment — free consultation
          </p>
        </div>
      )}

      {showForm && <OtpModal onVerified={handleVerified} onClose={() => setShowForm(false)} />}
    </>
  )
}
