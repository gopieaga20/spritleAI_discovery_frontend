export default function ScaleInput({ scale, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {scale.map((point) => {
        const v = point.value ?? point
        const label = point.label ?? String(v)
        const selected = value === v
        return (
          <button
            key={v}
            className="ds-scale-btn"
            onClick={() => onChange(v)}
            aria-pressed={selected}
          >
            <span
              className="font-plex-mono"
              style={{
                fontSize: 18, fontWeight: 700,
                color: selected ? 'var(--ds-teal-dark)' : 'var(--ds-ink)',
              }}
            >
              {v}
            </span>
            <span
              style={{
                fontSize: 11, color: 'var(--ds-ink-soft)',
                marginTop: 4, textAlign: 'center', lineHeight: 1.3,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
