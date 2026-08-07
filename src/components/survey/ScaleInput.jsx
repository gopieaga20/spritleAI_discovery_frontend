export default function ScaleInput({ scale, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {scale.map((point) => {
        const v = point.value ?? point
        const label = point.label ?? String(v)
        const selected = value === v
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={[
              'flex flex-col items-center rounded-xl border px-5 py-3 min-w-[72px] transition-all text-sm font-semibold',
              selected
                ? 'border-blue-500 bg-blue-500/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white',
            ].join(' ')}
          >
            <span className="text-lg font-bold">{v}</span>
            <span className="text-xs text-slate-500 mt-1 text-center leading-tight">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
