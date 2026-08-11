import { Check } from 'lucide-react'

export default function MultiSelect({ choices, value = [], onChange, maxSelect, scoreMap = {} }) {
  const toggle = (v) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v))
    } else {
      if (maxSelect && value.length >= maxSelect) return
      onChange([...value, v])
    }
  }

  return (
    <div>
      <div
        className="ds-options-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      >
        {choices.map((choice) => {
          const selected = value.includes(choice.value)
          const disabled = !selected && maxSelect && value.length >= maxSelect
          return (
            <button
              key={choice.value}
              className="ds-option"
              onClick={() => toggle(choice.value)}
              aria-pressed={selected}
              disabled={!!disabled}
              style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <span className="ds-checkbox">
                {selected && <Check size={11} strokeWidth={3} color="#fff" />}
              </span>
              {choice.icon && <span style={{ fontSize: '1.1em', flexShrink: 0 }}>{choice.icon}</span>}
              <span>{choice.label}</span>
            </button>
          )
        })}
      </div>

      {maxSelect && (
        <p
          className="font-plex-mono"
          style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginTop: 10 }}
        >
          Select up to {maxSelect} · {value.length} selected
        </p>
      )}
    </div>
  )
}
