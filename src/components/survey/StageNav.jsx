import { Check } from 'lucide-react'
import { resolveStageIcon } from '../../utils/stageIcons.js'

export default function StageNav({ stages, currentIndex, onSelect }) {
  return (
    <nav
      className="ds-sidebar"
      style={{
        width: 272,
        flexShrink: 0,
        background: 'var(--ds-ink)',
        color: '#fff',
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <p
        className="ds-sidebar-label font-plex-mono"
        style={{
          fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)', margin: '0 0 18px 4px',
        }}
      >
        Discovery Path
      </p>

      <ul className="ds-navlist" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stages.map((stage, idx) => {
          const isDone = idx < currentIndex
          const isActive = idx === currentIndex
          const canClick = isDone

          return (
            <li
              key={stage.id}
              className="ds-navitem"
              style={{ position: 'relative', display: 'flex' }}
            >
              {/* Vertical connector line */}
              {idx < stages.length - 1 && (
                <span
                  className="ds-navline"
                  style={{
                    position: 'absolute', left: 14, top: 30, bottom: -4,
                    width: 1, background: 'rgba(255,255,255,0.14)',
                  }}
                />
              )}

              <button
                className="ds-nav-btn"
                onClick={() => canClick && onSelect(idx)}
                style={{ cursor: canClick ? 'pointer' : 'default' }}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Circular node */}
                <span
                  className={isActive ? 'ds-node-ring' : ''}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    border: isDone
                      ? '1.5px solid var(--ds-teal)'
                      : isActive
                      ? '1.5px solid var(--ds-amber)'
                      : '1.5px solid rgba(255,255,255,0.22)',
                    background: isDone
                      ? 'var(--ds-teal)'
                      : isActive
                      ? 'rgba(219,145,48,0.12)'
                      : 'transparent',
                    color: isDone ? '#fff' : isActive ? 'var(--ds-amber)' : 'rgba(255,255,255,0.45)',
                    fontSize: 13,
                  }}
                >
                  {isDone
                    ? <Check size={14} strokeWidth={3} />
                    : stage.icon || resolveStageIcon(stage.id, stage.label)
                  }
                </span>

                {/* Label */}
                <span className="ds-navtext" style={{ paddingTop: 4 }}>
                  <span
                    className="font-plex-mono"
                    style={{
                      fontSize: 10, display: 'block', marginBottom: 2,
                      color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      fontSize: 13.5, fontWeight: 500, lineHeight: 1.3,
                      color: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {stage.label}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div
        className="ds-sidebar-foot font-plex-mono"
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        <b style={{ color: '#fff', fontWeight: 600 }}>{currentIndex}</b>
        {' / '}{stages.length} completed
      </div>
    </nav>
  )
}
