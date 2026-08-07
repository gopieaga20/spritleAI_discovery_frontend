import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initOptions(typeConfig) {
  const choices = typeConfig?.choices || []
  const scoreMap = typeConfig?.score_map || {}
  return choices.map((c) => ({
    label: c.label || c.value || '',
    score: scoreMap[c.value] ?? scoreMap[c.label] ?? '',
  }))
}

function emptyQuestionForm(stageId) {
  return { stage_id: stageId, prompt: '', subtext: '', question_type: 'choice-row', options: [], pain_key: '', branch_on: '', sort_order: '', is_active: true }
}

// ---------------------------------------------------------------------------
// Options editor — per-row label + score inputs
// ---------------------------------------------------------------------------

function OptionsEditor({ options, onChange }) {
  const add = () => onChange([...options, { label: '', score: '' }])
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i))
  const update = (i, field, val) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)))

  return (
    <div>
      <div className="space-y-1.5 mb-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <input
              type="number"
              value={opt.score}
              onChange={(e) => update(i, 'score', e.target.value)}
              placeholder="Score"
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-center"
            />
            <button
              onClick={() => remove(i)}
              className="text-slate-500 hover:text-red-400 text-base leading-none px-1 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="w-full py-1.5 border border-dashed border-white/15 hover:border-blue-500/30 text-slate-500 hover:text-blue-400 rounded-lg text-xs transition-colors"
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
// Question edit / add form
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
      pain_key: form.pain_key,
      branch_on: form.branch_on,
      sort_order: form.sort_order || undefined,
      is_active: form.is_active,
    }
  }

  return (
    <div className="bg-[#0b0e17] border border-blue-500/20 rounded-xl p-4 mt-2 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Question prompt *</label>
          <textarea
            rows={2}
            value={form.prompt}
            onChange={(e) => set('prompt', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            placeholder="Enter the question text…"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Helper text</label>
          <input
            value={form.subtext}
            onChange={(e) => set('subtext', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            placeholder="Optional sub-text shown below the question"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Answer type *</label>
          <select
            value={form.question_type}
            onChange={(e) => set('question_type', e.target.value)}
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </div>

        {showChoices && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">Options &amp; Scores</label>
              <span className="text-xs text-slate-600">Label → Score (leave score blank if n/a)</span>
            </div>
            <OptionsEditor options={form.options} onChange={(opts) => set('options', opts)} />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tags <span className="text-slate-600">(optional)</span></label>
          <input
            value={form.pain_key}
            onChange={(e) => set('pain_key', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            placeholder="e.g. Scheduling_Automation,No_Show"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Show only for industry</label>
          <select
            value={industrySelectValue}
            onChange={(e) => handleIndustryChange(e.target.value)}
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All industries (always show)</option>
            {industryChoices.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id={`active-${form.prompt}`}
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="accent-blue-500"
          />
          <label htmlFor={`active-${form.prompt}`} className="text-sm text-slate-300">Active</label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(buildPayload())}
          disabled={isSaving || !form.prompt.trim()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 border border-white/10 text-slate-400 hover:text-white text-sm rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage edit form (inline in header)
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
    <div className="bg-[#0b0e17] border border-yellow-500/20 rounded-xl p-4 mt-3 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Stage label *</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Icon (emoji)</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            placeholder="🏢" maxLength={4} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Sort order</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-blue-500" />
          <label className="text-sm text-slate-300">Active</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={isSaving || !form.label.trim()}
          className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
          {isSaving ? 'Saving…' : 'Save Stage'}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 border border-white/10 text-slate-400 hover:text-white text-sm rounded-lg transition-colors">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Stage form
// ---------------------------------------------------------------------------

function AddStageForm({ onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(emptyStageForm())
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="border border-green-500/20 rounded-xl p-4 bg-[#0b0e17] mb-4">
      <div className="text-sm font-semibold text-green-400 mb-3">New Stage</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Stage ID (slug) *</label>
          <input value={form.id} onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            placeholder="my-stage" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Label *</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Icon</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            placeholder="🏢" maxLength={4} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Description</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Sort order</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onSave(form)} disabled={isSaving || !form.id || !form.label}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
          {isSaving ? 'Creating…' : 'Create Stage'}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 border border-white/10 text-slate-400 hover:text-white text-sm rounded-lg">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage card with question list
// ---------------------------------------------------------------------------

function StageCard({ stage, qc, industryChoices, industryQId }) {
  const [expanded, setExpanded] = useState(false)
  const [editingStage, setEditingStage] = useState(false)
  const [editingQId, setEditingQId] = useState(null)
  const [addingQ, setAddingQ] = useState(false)

  const updateStage = useMutation({
    mutationFn: (data) => apiClient.put(`/admin/config/stages/${stage.id}/`, data).then((r) => r.data),
    onSuccess: () => { setEditingStage(false); qc.invalidateQueries({ queryKey: ['admin-config'] }) },
  })

  const updateQ = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/config/questions/${id}/`, data).then((r) => r.data),
    onSuccess: () => { setEditingQId(null); qc.invalidateQueries({ queryKey: ['admin-config'] }) },
  })

  const deleteQ = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/config/questions/${id}/`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-config'] }),
  })

  const addQ = useMutation({
    mutationFn: (data) => apiClient.post('/admin/config/questions/', data).then((r) => r.data),
    onSuccess: () => { setAddingQ(false); qc.invalidateQueries({ queryKey: ['admin-config'] }) },
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
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] overflow-hidden mb-4">
      {/* Stage header */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <span className="text-xl">{stage.icon || '📋'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{stage.label}</span>
                <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5">
                  {activeQs.length} questions
                </span>
                {inactiveCount > 0 && (
                  <span className="text-xs text-slate-600">{inactiveCount} hidden</span>
                )}
                {!stage.is_active && (
                  <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-2 py-0.5">Inactive</span>
                )}
              </div>
              {stage.description && <div className="text-xs text-slate-500 mt-0.5">{stage.description}</div>}
            </div>
            <span className="text-slate-500 text-sm">{expanded ? '▲' : '▼'}</span>
          </button>
          <button
            onClick={() => setEditingStage((e) => !e)}
            className="text-xs text-slate-400 hover:text-yellow-400 border border-white/10 hover:border-yellow-500/30 rounded px-2 py-1 transition-colors ml-2"
          >
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
        <div className="border-t border-white/5 px-5 pb-4">
          {activeQs.length === 0 && !addingQ && (
            <div className="text-slate-600 text-sm py-4 text-center">No active questions in this stage.</div>
          )}

          {activeQs.map((q, idx) => (
            <div key={q.id}>
              {/* Question row */}
              <div className={`flex items-start gap-3 py-3 ${idx > 0 ? 'border-t border-white/5' : 'border-t border-white/5 mt-1'}`}>
                <span className="text-xs text-slate-600 w-5 pt-0.5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white leading-snug">{q.prompt}</div>
                  {q.subtext && <div className="text-xs text-slate-500 mt-0.5">{q.subtext}</div>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-white/5 border border-white/10 text-slate-400 rounded px-1.5 py-0.5">{TYPE_LABELS[q.question_type] || q.question_type}</span>
                    {q.pain_key && <span className="text-xs text-orange-400/70">{q.pain_key}</span>}
                  </div>
                  {q.type_config?.choices?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {q.type_config.choices.map((c) => {
                        const scoreMap = q.type_config.score_map || {}
                        const hasScores = Object.keys(scoreMap).length > 0
                        const score = hasScores ? (scoreMap[c.value] ?? scoreMap[c.label] ?? null) : null
                        const colorCls = score == null
                          ? 'text-slate-500 border-white/10 bg-white/5'
                          : score >= 80
                          ? 'text-green-400 border-green-500/30 bg-green-500/10'
                          : score >= 50
                          ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          : 'text-red-400 border-red-500/30 bg-red-500/10'
                        return (
                          <span key={c.value} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${colorCls}`}>
                            {c.label}
                            {score != null && <span className="font-bold">{score}</span>}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingQId(editingQId === q.id ? null : q.id)}
                    className="text-xs text-slate-400 hover:text-blue-400 border border-white/10 hover:border-blue-500/30 rounded px-2 py-1 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(q)}
                    disabled={deleteQ.isPending}
                    className="text-xs text-slate-600 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded px-2 py-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingQId === q.id && (
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
            </div>
          ))}

          {/* Add question */}
          {addingQ ? (
            <div className="mt-3">
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
              className="mt-3 w-full py-2 border border-dashed border-white/15 hover:border-blue-500/30 text-slate-500 hover:text-blue-400 rounded-xl text-sm transition-colors"
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
// Import tab
// ---------------------------------------------------------------------------

function ImportTab({ qc }) {
  const fileRef = useRef(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const importMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('file', file)
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
      const res = await apiClient.get('/admin/config/import/', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'survey_import_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore — browser will show its own error if network fails
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-white">Import Survey Config</h3>
        <button
          onClick={handleDownloadTemplate}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {downloading ? '…' : '↓'} Download Template
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        Upload an <span className="text-white">.xlsx</span> or <span className="text-white">.json</span> file to add questions.
        Existing questions (matched by prompt text) are skipped — import is additive only.
      </p>

      {/* Expected columns info */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Expected Excel columns</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {['Stage', 'Question', 'Question_Type', 'Choices', 'Subtext', 'Pain_Key', 'Branch_On'].map((col) => (
            <div key={col} className="font-mono text-blue-300">{col}</div>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-3">
          Stage values: <span className="font-mono text-slate-300">business · pain · rootcause · data · technology · compliance · readiness · output</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Choices: pipe-separated — <span className="font-mono text-slate-300">Option A | Option B | Option C</span>
        </div>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-white/15 hover:border-blue-500/40 rounded-2xl p-10 text-center cursor-pointer transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-3xl mb-2">📂</div>
        <div className="text-sm text-slate-300 font-medium">Click to choose a file</div>
        <div className="text-xs text-slate-500 mt-1">Accepts .xlsx or .json</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.json" className="hidden" onChange={handleFile} />
      </div>

      {importMutation.isPending && (
        <div className="mt-4 text-sm text-blue-400 animate-pulse">Importing…</div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {result && (
        <div className="mt-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-4">
          <div className="font-semibold text-green-400 mb-2">Import complete</div>
          <div className="text-sm text-slate-300 space-y-1">
            <div>Total processed: <span className="font-bold text-white">{result.total}</span></div>
            <div>Created: <span className="font-bold text-green-300">{result.created}</span></div>
            <div>Skipped (already exist): <span className="font-bold text-slate-400">{result.skipped}</span></div>
            <div>Stages touched: <span className="font-mono text-slate-300">{result.stages?.join(', ')}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ConfigManager component
// ---------------------------------------------------------------------------

export default function ConfigManager() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('stages')
  const [addingStage, setAddingStage] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => apiClient.get('/admin/config/').then((r) => r.data),
  })

  const createStage = useMutation({
    mutationFn: (d) => apiClient.post('/admin/config/stages/', d).then((r) => r.data),
    onSuccess: () => { setAddingStage(false); qc.invalidateQueries({ queryKey: ['admin-config'] }) },
  })

  const stages = data?.stages || []

  // Extract industry choices from Q1.1 (or legacy b_industry) for the QuestionForm dropdown
  const { industryChoices, industryQId } = (() => {
    for (const stage of stages) {
      const q = (stage.questions || []).find((q) => q.id === 'Q1.1' || q.id === 'b_industry')
      if (q) return { industryChoices: q.type_config?.choices || [], industryQId: q.id }
    }
    return { industryChoices: [], industryQId: 'Q1.1' }
  })()

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-0">
        {[['stages', 'Survey Stages'], ['import', 'Import']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Survey Stages tab */}
      {tab === 'stages' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">{stages.length} stages</div>
            <button
              onClick={() => setAddingStage((s) => !s)}
              className="text-xs font-semibold text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg px-3 py-1.5 transition-colors"
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

          {isLoading && <div className="text-slate-400 text-sm animate-pulse">Loading config…</div>}
          {isError && <div className="text-red-400 text-sm">Failed to load config.</div>}

          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} qc={qc} industryChoices={industryChoices} industryQId={industryQId} />
          ))}
        </div>
      )}

      {/* Import tab */}
      {tab === 'import' && <ImportTab qc={qc} />}
    </div>
  )
}
