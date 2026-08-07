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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {choices.map((choice) => {
        const selected = value.includes(choice.value)
        const disabled = !selected && maxSelect && value.length >= maxSelect
        return (
          <button
            key={choice.value}
            onClick={() => toggle(choice.value)}
            disabled={!!disabled}
            className={[
              'flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all text-sm font-medium',
              selected
                ? 'border-blue-500 bg-blue-500/10 text-white'
                : disabled
                ? 'border-white/5 bg-white/2 text-slate-600 cursor-not-allowed'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white',
            ].join(' ')}
          >
            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${selected ? 'bg-blue-500 border-blue-500' : 'border-white/30'}`}>
              {selected && '✓'}
            </span>
            {choice.icon && <span>{choice.icon}</span>}
            <span>{choice.label}</span>
          </button>
        )
      })}
      {maxSelect && (
        <p className="col-span-full text-xs text-slate-500 mt-1">
          Select up to {maxSelect} ({value.length} selected)
        </p>
      )}
    </div>
  )
}
