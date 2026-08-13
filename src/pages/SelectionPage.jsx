import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, BarChart2 } from 'lucide-react'
import { useAssessmentStore } from '../stores/assessmentStore.js'
import SpritleLogo from '../components/SpritleLogo.jsx'

const OPTIONS = [
  {
    type: 'lite',
    icon: Zap,
    label: 'Lite Assessment',
    time: '~1–2 minutes',
    tagline: '20 questions',
    description:
      'A focused fast-track evaluation covering your core pain points, AI readiness, and budget posture. Perfect for an initial signal before committing to the full discovery.',
    bullets: ['20 targeted questions', 'Dual score: AI Readiness + Transformation Urgency', 'Instant report with agent & workflow recommendations'],
    accent: '#15AED5',
    accentSoft: 'rgba(21,174,213,0.08)',
    accentBorder: 'rgba(21,174,213,0.25)',
  },
  {
    type: 'pro',
    icon: BarChart2,
    label: 'Pro Assessment',
    time: '~10–20 minutes',
    tagline: '40+ questions',
    description:
      'The complete AI readiness discovery — seven stages covering business context, pain points, root causes, data maturity, technology stack, compliance, and strategic readiness.',
    bullets: ['40+ questions across 7 stages', 'Full dimension breakdown & scoring', 'Detailed roadmap with phased investment estimate'],
    accent: '#82C341',
    accentSoft: 'rgba(130,195,65,0.08)',
    accentBorder: 'rgba(130,195,65,0.25)',
  },
]

export default function SelectionPage() {
  const navigate = useNavigate()
  const setConfigType = useAssessmentStore((s) => s.setConfigType)

  const handleSelect = (type) => {
    setConfigType(type)
    navigate(`/assessment?type=${type}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ds-paper)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: 'var(--ds-ink)',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--ds-ink)',
          color: '#fff',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <SpritleLogo height={26} variant="color" />
        <span
          className="font-plex-mono"
          style={{
            fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 14,
          }}
        >
          AI Readiness Discovery
        </span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

        {/* Eyebrow */}
        <p
          className="font-plex-mono"
          style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-ink-faint)', marginBottom: 12 }}
        >
          Step 1 of 2
        </p>

        {/* Heading */}
        <h1
          className="font-newsreader"
          style={{ fontSize: 38, fontWeight: 500, color: 'var(--ds-ink)', textAlign: 'center', margin: '0 0 10px', lineHeight: 1.2 }}
        >
          Choose your assessment type
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ds-ink-soft)', textAlign: 'center', marginBottom: 48, maxWidth: 500 }}>
          Both paths lead to a personalised AI readiness report. Pick the depth that fits your time today.
        </p>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            width: '100%',
            maxWidth: 760,
          }}
        >
          {OPTIONS.map(({ type, icon: Icon, label, time, tagline, description, bullets, accent, accentSoft, accentBorder }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                background: 'var(--ds-card)',
                border: `1px solid ${accentBorder}`,
                borderRadius: 16,
                padding: 28,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(22,35,43,0.12), 0 0 0 2px ${accent}`
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Accent tint strip */}
              <div style={{ position: 'absolute', inset: 0, background: accentSoft, pointerEvents: 'none' }} />

              {/* Takes badge — top right */}
              <div style={{
                position: 'absolute', top: 20, right: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
              }}>
                <span className="font-plex-mono" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-ink-faint)' }}>Takes</span>
                <span className="font-plex-mono" style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>{time}</span>
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: accentSoft,
                  border: `1px solid ${accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, position: 'relative',
                }}
              >
                <Icon size={20} color={accent} strokeWidth={2} />
              </div>

              {/* Label + tagline */}
              <div style={{ marginBottom: 10, position: 'relative' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ds-ink)', marginBottom: 4 }}>{label}</div>
                <div className="font-plex-mono" style={{ fontSize: 11, color: accent, letterSpacing: '0.06em' }}>{tagline}</div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13.5, color: 'var(--ds-ink-soft)', lineHeight: 1.65, marginBottom: 20, position: 'relative' }}>
                {description}
              </p>

              {/* Bullets */}
              <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 7, position: 'relative', width: '100%' }}>
                {bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--ds-ink-soft)' }}>
                    <span style={{ color: accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA row */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 14, fontWeight: 600, color: accent,
                  position: 'relative',
                }}
              >
                Start {label} <ArrowRight size={15} strokeWidth={2.5} />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
