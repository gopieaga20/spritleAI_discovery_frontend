import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import apiClient from '../../api/client.js'
import { resolveStageIcon } from '../../utils/stageIcons.js'

const QUESTION_TYPES = [
  'choice-grid', 'choice-row', 'multi-select', 'multi-select-ranked',
  'open-scale', 'choice-scale', 'open-number', 'open-text',
  'department-matrix', 'dynamic-branch', 'scored-4pt',
]

const TYPE_LABELS = {
  'choice-grid':         'Card Grid (2–3 column options)',
  'choice-row':          'Button Row (scale / list)',
  'multi-select':        'Multi-Select (tick boxes)',
  'multi-select-ranked': 'Ranked Multi-Select',
  'open-scale':          'Scale Slider (1–10)',
  'choice-scale':        'Labelled Scale',
  'open-number':         'Number Input',
  'open-text':           'Free Text',
  'department-matrix':   'Department Matrix',
  'dynamic-branch':      'Conditional Branch',
  'scored-4pt':          '4-Point Scoring',
}

const TYPE_HAS_CHOICES = ['choice-grid', 'choice-row', 'multi-select', 'multi-select-ranked', 'scored-4pt']

function initOptions(typeConfig) {
  const choices = typeConfig?.choices || []
  const scoreMap = typeConfig?.score_map || {}
  return choices.map((c) => ({
    label: c.label || c.value || '',
    score: scoreMap[c.value] ?? scoreMap[c.label] ?? '',
  }))
}

function emptyQuestionForm(stageId) {
  return { stage_id: stageId, prompt: '', subtext: '', question_type: 'choice-row', options: [], tags: '', branch_on: '', sort_order: '', is_active: true }
}

// ---------------------------------------------------------------------------
// OptionsEditor
// ---------------------------------------------------------------------------

function OptionsEditor({ options, onChange }) {
  const add = () => onChange([...options, { label: '', score: '' }])
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i))
  const update = (i, field, val) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)))

  return (
    <div>
      {options.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 6, marginBottom: 4, borderBottom: '1px solid var(--ds-line-soft)' }}>
          <span style={{ flex: 1, fontSize: 11, color: 'var(--ds-ink-faint)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>Label</span>
          <span style={{ width: 90, fontSize: 11, color: 'var(--ds-ink-faint)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', textAlign: 'center' }}>Score</span>
          <span style={{ width: 32 }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={opt.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="ds-input"
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={opt.score}
              onChange={(e) => update(i, 'score', e.target.value)}
              placeholder="Score"
              className="ds-input font-plex-mono"
              style={{ width: 90, textAlign: 'center' }}
            />
            <button
              onClick={() => remove(i)}
              title="Remove option"
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid var(--ds-line)',
                cursor: 'pointer', fontSize: 14, color: 'var(--ds-ink-faint)',
                transition: 'color 0.15s, border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.4)'; e.currentTarget.style.background = 'rgba(192,57,43,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-ink-faint)'; e.currentTarget.style.borderColor = 'var(--ds-line)'; e.currentTarget.style.background = 'none' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        style={{
          width: '100%', padding: '7px 0',
          border: '1px dashed var(--ds-line)',
          background: 'none', borderRadius: 8,
          fontSize: 12, color: 'var(--ds-ink-faint)', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ds-teal)'; e.currentTarget.style.color = 'var(--ds-teal)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ds-line)'; e.currentTarget.style.color = 'var(--ds-ink-faint)' }}
      >
        + Add option
      </button>
    </div>
  )
}

function emptyStageForm() {
  return { id: '', label: '', icon: '', description: '', sort_order: '', is_active: true }
}

// ---------------------------------------------------------------------------
// QuestionForm
// ---------------------------------------------------------------------------

function QuestionForm({ initial, stageId, onSave, onCancel, isSaving, industryChoices = [], industryQId = 'Q1.1' }) {
  const [form, setForm] = useState(() => ({
    ...emptyQuestionForm(stageId),
    ...initial,
    options: initial?.type_config ? initOptions(initial.type_config) : [],
  }))

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const showChoices = TYPE_HAS_CHOICES.includes(form.question_type)

  const industrySelectValue = (() => {
    if (!form.branch_on) return ''
    const idx = form.branch_on.indexOf(':')
    if (idx === -1) return ''
    const qKey = form.branch_on.slice(0, idx)
    return (qKey === industryQId || qKey === 'b_industry') ? form.branch_on.slice(idx + 1) : ''
  })()
  const handleIndustryChange = (val) => set('branch_on', val ? `${industryQId}:${val}` : '')

  const buildPayload = () => {
    const choicesStr = form.options.map((o) => o.label).filter(Boolean).join('\n')
    const scoreMap = {}
    form.options.forEach((o) => {
      if (o.label && o.score !== '' && o.score != null) scoreMap[o.label] = Number(o.score)
    })
    return {
      prompt: form.prompt,
      subtext: form.subtext,
      question_type: form.question_type,
      choices: choicesStr,
      score_map: Object.keys(scoreMap).length > 0 ? scoreMap : undefined,
      tags: form.tags,
      branch_on: form.branch_on,
      sort_order: form.sort_order || undefined,
      is_active: form.is_active,
    }
  }

  return (
    <div className="ds-subform" style={{ borderColor: 'rgba(30,122,107,0.25)', borderRadius: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="ds-label">Question Prompt *</label>
          <textarea
            rows={2}
            value={form.prompt}
            onChange={(e) => set('prompt', e.target.value)}
            className="ds-textarea"
            placeholder="Enter the question text…"
            style={{ minHeight: 'unset', height: 68, backgroundImage: 'none', lineHeight: 1.55, padding: '10px 12px' }}
          />
        </div>
        <div>
          <label className="ds-label">Helper Text</label>
          <input value={form.subtext} onChange={(e) => set('subtext', e.target.value)} className="ds-input" placeholder="Optional sub-text" />
        </div>
        <div>
          <label className="ds-label">Answer Type *</label>
          <select value={form.question_type} onChange={(e) => set('question_type', e.target.value)} className="ds-select">
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </div>

        {showChoices && (
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="ds-label" style={{ margin: 0 }}>Options &amp; Scores</label>
              <span style={{ fontSize: 11, color: 'var(--ds-ink-faint)', fontStyle: 'italic' }}>Leave score blank if n/a</span>
            </div>
            <OptionsEditor options={form.options} onChange={(opts) => set('options', opts)} />
          </div>
        )}

        <div>
          <label className="ds-label">Tags <span style={{ color: 'var(--ds-ink-faint)', textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(optional)</span></label>
          <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="ds-input" placeholder="Tag_A, Tag_B" />
        </div>
        <div>
          <label className="ds-label">Show Only for Industry</label>
          <select value={industrySelectValue} onChange={(e) => handleIndustryChange(e.target.value)} className="ds-select">
            <option value="">All industries (always show)</option>
            {industryChoices.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="ds-label">Sort Order</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} className="ds-input" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
          <input
            type="checkbox"
            id={`qactive-${form.prompt}`}
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            style={{ accentColor: 'var(--ds-teal)', width: 15, height: 15, cursor: 'pointer' }}
          />
          <label htmlFor={`qactive-${form.prompt}`} style={{ fontSize: 13, color: 'var(--ds-ink)', cursor: 'pointer' }}>Active</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ds-line-soft)' }}>
        <button
          onClick={() => onSave(buildPayload())}
          disabled={isSaving || !form.prompt.trim()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 7,
            background: (isSaving || !form.prompt.trim()) ? 'var(--ds-line)' : 'var(--ds-teal)',
            color: (isSaving || !form.prompt.trim()) ? 'var(--ds-ink-faint)' : '#fff',
            border: 'none', cursor: (isSaving || !form.prompt.trim()) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--ds-teal-dark)' }}
          onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--ds-teal)' }}
        >
          {isSaving ? 'Saving…' : '✓ Save'}
        </button>
        <button
          onClick={onCancel}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 7,
            background: 'rgba(192,57,43,0.07)', color: '#c0392b',
            border: '1px solid rgba(192,57,43,0.3)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.14)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.07)' }}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StageForm
// ---------------------------------------------------------------------------

function StageForm({ stage, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    label: stage?.label || '',
    icon: stage?.icon || '',
    description: stage?.description || '',
    sort_order: stage?.sort_order ?? '',
    is_active: stage?.is_active ?? true,
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="ds-subform" style={{ borderColor: 'rgba(219,145,48,0.3)', borderRadius: 12 }}>
      <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-amber)', marginBottom: 12, fontWeight: 600 }}>Edit Stage</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: 14 }}>
        <div style={{ gridColumn: '1/3' }}>
          <label className="ds-label">Stage Label *</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)} className="ds-input" />
        </div>
        <div>
          <label className="ds-label">Icon (emoji)</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)} className="ds-input" placeholder="🏢" maxLength={4} style={{ textAlign: 'center', fontSize: 18 }} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="ds-label">Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} className="ds-input" placeholder="Brief description of this stage…" />
        </div>
        <div>
          <label className="ds-label">Sort Order</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} className="ds-input" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--ds-teal)', width: 15, height: 15, cursor: 'pointer' }} />
          <label style={{ fontSize: 13, color: 'var(--ds-ink)', cursor: 'pointer' }}>Active</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ds-line-soft)' }}>
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.label.trim()}
          className="ds-btn ds-btn-xs"
          style={{ background: 'var(--ds-amber)', color: '#fff', border: 'none', fontWeight: 600, opacity: (isSaving || !form.label.trim()) ? 0.4 : 1 }}
        >
          {isSaving ? 'Saving…' : 'Save Stage'}
        </button>
        <button onClick={onCancel} className="ds-btn ds-btn-ghost ds-btn-xs">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AddStageForm
// ---------------------------------------------------------------------------

function AddStageForm({ onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(emptyStageForm())
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="ds-subform" style={{ borderColor: 'rgba(26,122,46,0.3)', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a2e', marginBottom: 12, fontWeight: 600 }}>New Stage</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 14 }}>
        <div>
          <label className="ds-label">Stage ID (slug) *</label>
          <input value={form.id} onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="ds-input font-plex-mono" placeholder="my-stage" />
        </div>
        <div>
          <label className="ds-label">Label *</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)} className="ds-input" />
        </div>
        <div>
          <label className="ds-label">Icon</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)} className="ds-input" placeholder="🏢" maxLength={4} style={{ textAlign: 'center', fontSize: 18 }} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="ds-label">Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} className="ds-input" placeholder="Brief description of this stage…" />
        </div>
        <div>
          <label className="ds-label">Sort Order</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} className="ds-input" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ds-line-soft)' }}>
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.id || !form.label}
          className="ds-btn ds-btn-xs"
          style={{ background: '#1a7a2e', color: '#fff', border: 'none', fontWeight: 600, opacity: (isSaving || !form.id || !form.label) ? 0.4 : 1 }}
        >
          {isSaving ? 'Creating…' : 'Create Stage'}
        </button>
        <button onClick={onCancel} className="ds-btn ds-btn-ghost ds-btn-xs">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StageCard
// ---------------------------------------------------------------------------

function StageCard({ stage, qc, industryChoices, industryQId, configType }) {
  const [expanded, setExpanded] = useState(false)
  const [editingStage, setEditingStage] = useState(false)
  const [editingQId, setEditingQId] = useState(null)
  const [addingQ, setAddingQ] = useState(false)
  const [headerHovered, setHeaderHovered] = useState(false)

  const configParam = configType === 'lite' ? '?config_type=lite' : ''
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-config', configType] })

  const updateStage = useMutation({
    mutationFn: (data) => apiClient.put(`/admin/config/stages/${stage.id}/${configParam}`, data).then((r) => r.data),
    onSuccess: () => { setEditingStage(false); invalidate() },
  })

  const updateQ = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/config/questions/${id}/${configParam}`, data).then((r) => r.data),
    onSuccess: () => { setEditingQId(null); invalidate() },
  })

  const deleteQ = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/config/questions/${id}/${configParam}`).then((r) => r.data),
    onSuccess: () => invalidate(),
  })

  const addQ = useMutation({
    mutationFn: (data) => apiClient.post(`/admin/config/questions/${configParam}`, data).then((r) => r.data),
    onSuccess: () => { setAddingQ(false); invalidate() },
  })

  const activeQs = (stage.questions || []).filter((q) => q.is_active !== false || editingQId === q.id)
  const inactiveCount = (stage.questions || []).length - activeQs.length

  const handleSaveQ = (payload) => {
    if (editingQId) updateQ.mutate({ id: editingQId, data: payload })
  }

  const handleAddQ = (payload) => {
    addQ.mutate({ stage_id: stage.id, ...payload })
  }

  const confirmDelete = (q) => {
    if (window.confirm(`Deactivate question?\n\n"${q.prompt}"`)) {
      deleteQ.mutate(q.id)
    }
  }

  return (
    <div className="ds-content-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
      {/* Stage header */}
      <div
        style={{
          padding: '16px 20px',
          background: headerHovered ? 'rgba(0,0,0,0.018)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            {/* Icon in teal circle */}
            <span style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              background: 'rgba(30,122,107,0.09)',
              border: '1px solid rgba(30,122,107,0.15)',
            }}>
              {stage.icon || resolveStageIcon(stage.id, stage.label)}
            </span>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ds-ink)' }}>{stage.label}</span>
                <span className="font-plex-mono" style={{ fontSize: 10, color: 'var(--ds-teal)', background: 'rgba(30,122,107,0.08)', border: '1px solid rgba(30,122,107,0.2)', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
                  {activeQs.length} questions
                </span>
                {inactiveCount > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--ds-ink-faint)' }}>{inactiveCount} hidden</span>
                )}
                {!stage.is_active && (
                  <span className="font-plex-mono" style={{ fontSize: 10, color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 20, padding: '2px 8px' }}>Inactive</span>
                )}
              </div>
              {stage.description && <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 3, lineHeight: 1.5 }}>{stage.description}</div>}
            </div>

            {/* Chevron toggle */}
            <span style={{ color: 'var(--ds-ink-faint)', display: 'flex', alignItems: 'center', marginRight: 4 }}>
              {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </span>
          </button>

          {/* Edit Stage button */}
          <button
            onClick={() => setEditingStage((e) => !e)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: editingStage ? 'var(--ds-amber)' : 'var(--ds-ink-soft)',
              border: `1px solid ${editingStage ? 'var(--ds-amber)' : 'var(--ds-line)'}`,
              borderRadius: 8, padding: '5px 12px',
              background: editingStage ? 'rgba(219,145,48,0.06)' : 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.15s, border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { if (!editingStage) { e.currentTarget.style.color = 'var(--ds-amber)'; e.currentTarget.style.borderColor = 'var(--ds-amber)' } }}
            onMouseLeave={(e) => { if (!editingStage) { e.currentTarget.style.color = 'var(--ds-ink-soft)'; e.currentTarget.style.borderColor = 'var(--ds-line)' } }}
          >
            <Pencil size={12} />
            Edit Stage
          </button>
        </div>

        {editingStage && (
          <StageForm
            stage={stage}
            onSave={(data) => updateStage.mutate(data)}
            onCancel={() => setEditingStage(false)}
            isSaving={updateStage.isPending}
          />
        )}
      </div>

      {/* Questions list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--ds-line)', padding: '8px 20px 20px' }}>
          {activeQs.length === 0 && !addingQ && (
            <div style={{ fontSize: 13, color: 'var(--ds-ink-faint)', padding: '20px 0', textAlign: 'center' }}>No active questions in this stage.</div>
          )}

          {activeQs.map((q, idx) => (
            <QuestionRow
              key={q.id}
              q={q}
              idx={idx}
              isFirst={idx === 0}
              isEditing={editingQId === q.id}
              onEdit={() => setEditingQId(editingQId === q.id ? null : q.id)}
              onDelete={() => confirmDelete(q)}
              isDeleting={deleteQ.isPending}
              editForm={editingQId === q.id && (
                <QuestionForm
                  initial={q}
                  stageId={stage.id}
                  onSave={handleSaveQ}
                  onCancel={() => setEditingQId(null)}
                  isSaving={updateQ.isPending}
                  industryChoices={industryChoices}
                  industryQId={industryQId}
                />
              )}
            />
          ))}

          {addingQ ? (
            <div style={{ marginTop: 14 }}>
              <QuestionForm
                initial={emptyQuestionForm(stage.id)}
                stageId={stage.id}
                onSave={handleAddQ}
                onCancel={() => setAddingQ(false)}
                isSaving={addQ.isPending}
                industryChoices={industryChoices}
                industryQId={industryQId}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingQ(true)}
              style={{
                marginTop: 14, width: '100%', padding: '9px 0',
                border: '1px dashed var(--ds-line)', borderRadius: 10,
                fontSize: 13, color: 'var(--ds-ink-faint)',
                background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ds-teal)'; e.currentTarget.style.color = 'var(--ds-teal)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ds-line)'; e.currentTarget.style.color = 'var(--ds-ink-faint)' }}
            >
              + Add Question
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// QuestionRow (extracted for cleaner hover state management)
// ---------------------------------------------------------------------------

function QuestionRow({ q, idx, isFirst, isEditing, onEdit, onDelete, isDeleting, editForm }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 10px',
          marginLeft: -10, marginRight: -10,
          borderTop: isFirst ? 'none' : '1px solid var(--ds-line-soft)',
          borderRadius: 8,
          background: hovered ? 'rgba(0,0,0,0.022)' : 'transparent',
          transition: 'background 0.12s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Circle number */}
        <span style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--ds-paper)', border: '1px solid var(--ds-line)',
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          color: 'var(--ds-ink-faint)', marginTop: 1,
        }}>
          {idx + 1}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ds-ink)', lineHeight: 1.5, fontWeight: 500 }}>{q.prompt}</div>
          {q.subtext && <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 2 }}>{q.subtext}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
            <span className="font-plex-mono" style={{ fontSize: 10, background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', color: 'var(--ds-ink-soft)', borderRadius: 5, padding: '2px 7px' }}>
              {TYPE_LABELS[q.question_type] || q.question_type}
            </span>
            {q.tags && (
              <span style={{ fontSize: 11, color: 'var(--ds-amber)', fontWeight: 500, background: 'rgba(219,145,48,0.08)', borderRadius: 4, padding: '1px 6px' }}>
                {q.tags}
              </span>
            )}
          </div>
          {q.type_config?.choices?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {q.type_config.choices.map((c) => {
                const scoreMap = q.type_config.score_map || {}
                const hasScores = Object.keys(scoreMap).length > 0
                const score = hasScores ? (scoreMap[c.value] ?? scoreMap[c.label] ?? null) : null
                const chipStyle = score == null
                  ? { color: 'var(--ds-ink-soft)', border: '1px solid var(--ds-line)', background: 'var(--ds-paper)' }
                  : score >= 80
                  ? { color: '#1a7a2e', border: '1px solid rgba(26,122,46,0.3)', background: 'rgba(26,122,46,0.07)' }
                  : score >= 50
                  ? { color: '#a05c00', border: '1px solid rgba(160,92,0,0.3)', background: 'rgba(160,92,0,0.07)' }
                  : { color: '#c0392b', border: '1px solid rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.07)' }
                return (
                  <span key={c.value} className="font-plex-mono" style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, ...chipStyle }}>
                    {c.label}
                    {score != null && <b style={{ fontWeight: 700 }}>{score}</b>}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={onEdit}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600,
              color: isEditing ? '#fff' : 'var(--ds-teal)',
              border: '1px solid var(--ds-teal)',
              borderRadius: 7, padding: '4px 10px',
              background: isEditing ? 'var(--ds-teal)' : 'rgba(30,122,107,0.07)',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { if (!isEditing) { e.currentTarget.style.background = 'rgba(30,122,107,0.15)' } }}
            onMouseLeave={(e) => { if (!isEditing) { e.currentTarget.style.background = 'rgba(30,122,107,0.07)' } }}
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Deactivate question"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#c0392b',
              border: '1px solid rgba(192,57,43,0.35)',
              background: 'rgba(192,57,43,0.07)', cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.15)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.07)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.35)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {editForm && <div style={{ marginBottom: 4 }}>{editForm}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ImportTab
// ---------------------------------------------------------------------------

function ImportTab({ qc, configType }) {
  const fileRef = useRef(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const importMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('config_type', configType)
      return apiClient.post('/admin/config/import/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-config'] })
    },
    onError: (err) => {
      setError(err?.response?.data?.detail || 'Import failed.')
      setResult(null)
    },
  })

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setError(null)
    importMutation.mutate(file)
    e.target.value = ''
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const res = await apiClient.get(`/admin/config/import/?config_type=${configType}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey_import_template_${configType}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 className="ds-section-heading font-newsreader" style={{ margin: 0 }}>Import Survey Config</h3>
        <button
          onClick={handleDownloadTemplate}
          disabled={downloading}
          className="ds-btn ds-btn-ghost ds-btn-xs"
          style={{ opacity: downloading ? 0.5 : 1 }}
        >
          {downloading ? '…' : '↓'} Download Template
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ds-ink-soft)', marginBottom: 20, lineHeight: 1.65 }}>
        Upload an <strong>.xlsx</strong> or <strong>.json</strong> file to add or update questions.
        New questions are created; existing ones (matched by prompt text) are updated if any column has changed.
      </p>

      <div style={{ borderRadius: 10, background: 'var(--ds-paper)', border: '1px solid var(--ds-line)', padding: 16, marginBottom: 20 }}>
        <div className="font-plex-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-ink-faint)', marginBottom: 10 }}>Expected Excel columns</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 16px' }}>
          {['Stage', 'Question', 'Question_Type', 'Choices', 'Score_Map', 'Tags', 'Subtext', 'Show_For_Industry', 'Branch_On'].map((col) => (
            <div key={col} className="font-plex-mono" style={{ fontSize: 12, color: 'var(--ds-teal)' }}>{col}</div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginTop: 12, lineHeight: 1.6 }}>
          Stage values: <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)' }}>business · pain · rootcause · data · technology · compliance · readiness · output</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginTop: 4 }}>
          Choices: pipe-separated — <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)' }}>Option A | Option B | Option C</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginTop: 4 }}>
          Score_Map: <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)' }}>Option A:3 | Option B:2 | Option C:1</span> · Show_For_Industry: e.g. <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)' }}>Healthcare</span>
        </div>
      </div>

      <div
        style={{
          border: '2px dashed var(--ds-line)', borderRadius: 14,
          padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onClick={() => fileRef.current?.click()}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ds-teal)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ds-line)'}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ds-ink)' }}>Click to choose a file</div>
        <div style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginTop: 4 }}>Accepts .xlsx or .json</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.json" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {importMutation.isPending && (
        <p className="font-plex-mono" style={{ marginTop: 16, fontSize: 13, color: 'var(--ds-teal)' }}>Importing…</p>
      )}

      {error && (
        <div style={{ marginTop: 16, borderRadius: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', padding: '12px 16px', fontSize: 13, color: '#c0392b' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: 16, borderRadius: 10, background: 'rgba(26,122,46,0.06)', border: '1px solid rgba(26,122,46,0.2)', padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, color: '#1a7a2e', marginBottom: 8 }}>Import complete</div>
          <div style={{ fontSize: 13, color: 'var(--ds-ink-soft)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Total processed: <strong style={{ color: 'var(--ds-ink)' }}>{result.total}</strong></div>
            <div>Created: <strong style={{ color: '#1a7a2e' }}>{result.created}</strong></div>
            {result.updated > 0 && <div>Updated: <strong style={{ color: 'var(--ds-teal)' }}>{result.updated}</strong></div>}
            <div>Skipped (no changes): <strong style={{ color: 'var(--ds-ink-faint)' }}>{result.skipped}</strong></div>
            <div>Stages touched: <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)' }}>{result.stages?.join(', ')}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ConfigManager
// ---------------------------------------------------------------------------

export default function ConfigManager() {
  const qc = useQueryClient()
  const [configType, setConfigType] = useState('pro')
  const [tab, setTab] = useState('stages')
  const [addingStage, setAddingStage] = useState(false)

  const configParam = configType === 'lite' ? '?config_type=lite' : ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-config', configType],
    queryFn: () => apiClient.get(`/admin/config/${configParam}`).then((r) => r.data),
  })

  const createStage = useMutation({
    mutationFn: (d) => apiClient.post(`/admin/config/stages/${configParam}`, d).then((r) => r.data),
    onSuccess: () => { setAddingStage(false); qc.invalidateQueries({ queryKey: ['admin-config', configType] }) },
  })

  const stages = data?.stages || []
  const scoring = data?.scoring || []

  const { industryChoices, industryQId } = (() => {
    // Pro: Q1.1 | Lite: BU1 — fall back to Domain_Root tag for any other naming
    const targetId = configType === 'lite' ? 'BU1' : 'Q1.1'
    for (const stage of stages) {
      const q = (stage.questions || []).find((q) =>
        q.id === targetId ||
        q.id === 'b_industry' ||
        (q.tags && q.tags.split(',').map((t) => t.trim()).includes('Domain_Root'))
      )
      if (q) return { industryChoices: q.type_config?.choices || [], industryQId: q.id }
    }
    return { industryChoices: [], industryQId: targetId }
  })()

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: 'var(--ds-ink)' }}>

      {/* Pro / Lite toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
        <span style={{ fontSize: 12, color: 'var(--ds-ink-faint)', marginRight: 4 }}>Config:</span>
        {[['pro', 'Pro', '#82C341', 'rgba(130,195,65,0.12)', 'rgba(130,195,65,0.4)'],
          ['lite', 'Lite', '#15AED5', 'rgba(21,174,213,0.12)', 'rgba(21,174,213,0.4)']].map(([val, label, color, bg, border]) => (
          <button
            key={val}
            onClick={() => { setConfigType(val); setAddingStage(false) }}
            className="font-plex-mono"
            style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '5px 16px', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
              border: configType === val ? `1.5px solid ${border}` : '1px solid var(--ds-line)',
              background: configType === val ? bg : 'transparent',
              color: configType === val ? color : 'var(--ds-ink-faint)',
              fontWeight: configType === val ? 700 : 400,
            }}
          >
            {label}
          </button>
        ))}
        <span className="font-plex-mono" style={{ fontSize: 11, color: 'var(--ds-ink-faint)', marginLeft: 4 }}>
          {configType === 'lite' ? '6 stages · ~20 questions' : '7 stages · 40+ questions'}
        </span>
      </div>

      {/* Sub-tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ds-line)', marginBottom: 24 }}>
        {[['stages', 'Survey Stages'], /* ['scoring', 'Scoring'], */ ['import', 'Import']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`ds-tab${tab === key ? ' is-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Survey Stages tab */}
      {tab === 'stages' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--ds-ink-soft)' }}>
              <b style={{ color: 'var(--ds-ink)' }}>{stages.length}</b> stages
            </span>
            <button
              onClick={() => setAddingStage((s) => !s)}
              className="ds-btn ds-btn-ghost ds-btn-xs"
              style={{ color: '#1a7a2e', borderColor: 'rgba(26,122,46,0.3)' }}
            >
              + Add Stage
            </button>
          </div>

          {addingStage && (
            <AddStageForm
              onSave={(d) => createStage.mutate(d)}
              onCancel={() => setAddingStage(false)}
              isSaving={createStage.isPending}
            />
          )}

          {isLoading && <p className="font-plex-mono" style={{ color: 'var(--ds-ink-faint)', fontSize: 13 }}>Loading config…</p>}
          {isError && <p style={{ color: '#c0392b', fontSize: 13 }}>Failed to load config.</p>}

          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} qc={qc} industryChoices={industryChoices} industryQId={industryQId} configType={configType} />
          ))}
        </div>
      )}

      {/* Scoring tab */}
      {tab === 'scoring' && (
        <div>
          {isLoading && <p className="font-plex-mono" style={{ color: 'var(--ds-ink-faint)', fontSize: 13 }}>Loading scoring…</p>}
          {isError && <p style={{ color: '#c0392b', fontSize: 13 }}>Failed to load scoring.</p>}
          {!isLoading && scoring.length === 0 && (
            <p style={{ color: 'var(--ds-ink-faint)', fontSize: 13 }}>No scoring dimensions configured.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {scoring.map((dim) => (
              <div key={dim.id} className="ds-content-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--ds-line)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, backgroundColor: dim.color || 'var(--ds-teal)' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ds-ink)' }}>{dim.label}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--ds-ink-faint)' }}>weight {dim.weight}</span>
                  </div>
                  <span className="font-plex-mono" style={{ fontSize: 10, color: 'var(--ds-teal)', background: 'rgba(30,122,107,0.08)', border: '1px solid rgba(30,122,107,0.2)', borderRadius: 20, padding: '2px 8px' }}>
                    {dim.questions.length} questions
                  </span>
                </div>
                <div style={{ padding: '4px 20px' }}>
                  {dim.questions.map((sq, idx) => (
                    <div key={sq.id} style={{ padding: '12px 0', borderBottom: idx < dim.questions.length - 1 ? '1px solid var(--ds-line-soft)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span className="font-plex-mono" style={{ fontSize: 11, color: 'var(--ds-ink-faint)', width: 18, paddingTop: 1, flexShrink: 0 }}>{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div className="font-plex-mono" style={{ fontSize: 10, color: 'var(--ds-ink-faint)', marginBottom: 3 }}>{sq.id}</div>
                          <div style={{ fontSize: 13, color: 'var(--ds-ink)', lineHeight: 1.45 }}>{sq.question_text}</div>
                          {sq.label && sq.label !== sq.question_text && (
                            <div style={{ fontSize: 12, color: 'var(--ds-ink-soft)', marginTop: 2 }}>{sq.label}</div>
                          )}
                          {sq.options?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {sq.options.map((opt, i) => (
                                <span key={i} className="font-plex-mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px solid var(--ds-line)', background: 'var(--ds-paper)', color: 'var(--ds-ink-soft)' }}>
                                  {i}pt: {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'import' && <ImportTab qc={qc} configType={configType} />}
    </div>
  )
}
