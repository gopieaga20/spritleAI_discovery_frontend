export default function OptionPicker({ choices, value, onChange, layout = 'grid', scoreMap = {} }) {
  return (
    <div
      className="ds-options-grid"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
    >
      {choices.map((choice, i) => {
        const selected = value === choice.value
        const isLastOdd = choices.length % 2 !== 0 && i === choices.length - 1
        return (
          <button
            key={choice.value}
            className="ds-option"
            onClick={() => onChange(choice.value)}
            aria-pressed={selected}
            style={isLastOdd ? { gridColumn: '1 / -1', maxWidth: 'calc(50% - 6px)' } : {}}
          >
            <span className="ds-radio">
              {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
            </span>
            {choice.icon && <span style={{ fontSize: '1.1em', flexShrink: 0 }}>{choice.icon}</span>}
            <span>{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}
