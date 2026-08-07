export default function OptionPicker({ choices, value, onChange, layout = 'grid', scoreMap = {} }) {
  const gridClass = layout === 'row'
    ? 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-2 sm:grid-cols-3 gap-3'

  const isOddCount = choices.length % 2 !== 0

  return (
    <div className={gridClass}>
      {choices.map((choice, i) => {
        const selected = value === choice.value
        const isLastOdd = layout === 'row' && isOddCount && i === choices.length - 1
        return (
          <button
            key={choice.value}
            onClick={() => onChange(choice.value)}
            className={[
              'flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all text-sm font-medium',
              selected
                ? 'border-blue-500 bg-blue-500/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white',
              isLastOdd ? 'col-span-2 max-w-[calc(50%-6px)] mx-auto w-full' : '',
            ].join(' ')}
          >
            {choice.icon && <span className="text-xl">{choice.icon}</span>}
            <span>{choice.label}</span>
            {choice.sub && <span className="text-xs text-slate-500">{choice.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}
