export default function StageNav({ stages, currentIndex, onSelect }) {
  return (
    <nav className="flex flex-col w-56 flex-shrink-0 border-r border-white/10 bg-[#0b0e17] overflow-y-auto py-4">
      {stages.map((stage, idx) => {
        const done = idx < currentIndex
        const active = idx === currentIndex
        return (
          <button
            key={stage.id}
            onClick={() => done && onSelect(idx)}
            className={[
              'flex items-center gap-3 px-4 py-3 text-xs font-semibold text-left border-l-2 transition-colors w-full',
              active
                ? 'border-blue-500 text-white bg-white/5'
                : done
                ? 'border-transparent text-green-400 cursor-pointer hover:bg-white/5 hover:text-white'
                : 'border-transparent text-slate-500 cursor-not-allowed',
            ].join(' ')}
          >
            <span className="text-base flex-shrink-0">{stage.icon}</span>
            <span className="leading-snug truncate">{stage.label}</span>
            {done && <span className="ml-auto text-green-400 flex-shrink-0">✓</span>}
          </button>
        )
      })}
    </nav>
  )
}
