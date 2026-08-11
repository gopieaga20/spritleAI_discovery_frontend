import { useState } from 'react'
import OptionPicker from './OptionPicker.jsx'
import MultiSelect from './MultiSelect.jsx'
import ScaleInput from './ScaleInput.jsx'
import OpenText from './OpenText.jsx'

export default function QuestionCard({ question, value, onChange, onNote, note }) {
  const [noteOpen, setNoteOpen] = useState(false)
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
            style={{
              width: '100%', maxWidth: 280,
              borderRadius: 8, border: '1px solid var(--ds-line)',
              padding: '12px 16px', fontSize: 16,
              color: 'var(--ds-ink)', background: '#fff',
              fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--ds-teal)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--ds-line)')}
          />
        )
      case 'open-text':
      default:
        return <OpenText value={value || ''} onChange={onChange} />
    }
  }

  return (
    <div
      style={{
        background: 'var(--ds-card)',
        border: '1px solid var(--ds-line)',
        borderRadius: 10,
        padding: 24,
      }}
    >
      {renderInput()}

      {/* Collapsible note field */}
      <div style={{ marginTop: 17 }}>
        {!noteOpen && !note ? (
          <button
            onClick={() => setNoteOpen(true)}
            style={{
              fontSize: 14, color: 'var(--ds-ink-faint)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              textDecoration: 'underline', textUnderlineOffset: 3,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ds-ink-soft)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ds-ink-faint)'}
          >
            + Add a note
          </button>
        ) : (
          <>
            <label
              className="font-plex-mono"
              style={{
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--ds-ink-soft)', display: 'block', marginBottom: 7,
              }}
            >
              Add a note (optional)
            </label>
            <textarea
              className="ds-textarea"
              value={note || ''}
              onChange={(e) => onNote && onNote(e.target.value)}
              rows={2}
              placeholder="Any additional context…"
              autoFocus={noteOpen && !note}
            />
          </>
        )}
      </div>
    </div>
  )
}
