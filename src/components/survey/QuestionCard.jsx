import OptionPicker from './OptionPicker.jsx'
import MultiSelect from './MultiSelect.jsx'
import ScaleInput from './ScaleInput.jsx'
import OpenText from './OpenText.jsx'

export default function QuestionCard({ question, value, onChange, onNote, note }) {
  if (!question) return null

  const renderInput = () => {
    switch (question.question_type) {
      case 'choice-grid':
      case 'choice-row':
        return (
          <OptionPicker
            choices={question.type_config?.choices || []}
            scoreMap={question.type_config?.score_map || {}}
            value={value}
            onChange={onChange}
            layout={question.question_type === 'choice-row' ? 'row' : 'grid'}
          />
        )
      case 'multi-select':
      case 'multi-select-ranked':
        return (
          <MultiSelect
            choices={question.type_config?.choices || []}
            scoreMap={question.type_config?.score_map || {}}
            value={value || []}
            onChange={onChange}
            maxSelect={question.type_config?.maxSelect}
          />
        )
      case 'open-scale':
      case 'choice-scale':
      case 'scored-4pt':
        return (
          <ScaleInput
            scale={question.type_config?.scale || []}
            value={value}
            onChange={onChange}
          />
        )
      case 'open-number':
        return (
          <input
            type="number"
            min={0}
            value={value ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={`Enter ${question.type_config?.unit || 'value'}`}
            className="w-full max-w-xs rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500"
          />
        )
      case 'open-text':
      default:
        return <OpenText value={value || ''} onChange={onChange} />
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-[#0f172a] p-7 shadow-2xl mb-8">
      <span className="block text-2xl font-extrabold text-white leading-snug mb-2">
        {question.prompt}
      </span>
      {question.subtext && (
        <span className="block text-sm text-slate-400 mb-5 leading-relaxed">
          {question.subtext}
        </span>
      )}
      {renderInput()}
      {/* Optional note field */}
      <div className="mt-5">
        <label className="block text-xs text-slate-500 mb-1">Add a note (optional)</label>
        <textarea
          value={note || ''}
          onChange={(e) => onNote && onNote(e.target.value)}
          rows={2}
          placeholder="Any additional context..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-300 resize-none focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>
  )
}
