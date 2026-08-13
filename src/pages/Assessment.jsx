import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAssessmentStore } from '../stores/assessmentStore.js'
import { useConfig } from '../hooks/useConfig.js'
import StageNav from '../components/survey/StageNav.jsx'
import QuestionCard from '../components/survey/QuestionCard.jsx'
import SpritleLogo from '../components/SpritleLogo.jsx'
import apiClient from '../api/client.js'

const PULSE_BEATS = 14
const PULSE_BEAT_WIDTH = 90
const PULSE_VIEW_W = PULSE_BEATS * PULSE_BEAT_WIDTH
const PULSE_VIEW_H = 50

function buildPulsePath(beats, w) {
  let d = 'M0 25'
  for (let i = 0; i < beats; i++) {
    const x = i * w
    d += ` L${x + 18} 25 L${x + 27} 6 L${x + 36} 44 L${x + 45} 18 L${x + 54} 25 L${x + w} 25`
  }
  return d
}
const PULSE_D = buildPulsePath(PULSE_BEATS, PULSE_BEAT_WIDTH)

export default function Assessment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const storedConfigType = useAssessmentStore((s) => s.configType)
  const setConfigType = useAssessmentStore((s) => s.setConfigType)

  // URL param takes precedence — survives page refresh
  const urlType = searchParams.get('type')
  const configType = (urlType === 'lite' || urlType === 'pro') ? urlType : storedConfigType

  // Keep store in sync so submission payload is correct
  useEffect(() => {
    if (urlType === 'lite' || urlType === 'pro') {
      setConfigType(urlType)
    }
  }, [urlType])
  const currentStageIndex = useAssessmentStore((s) => s.currentStageIndex)
  const currentQuestionIndex = useAssessmentStore((s) => s.currentQuestionIndex)
  const answers = useAssessmentStore((s) => s.answers)
  const notesDict = useAssessmentStore((s) => s.notesDict)
  const goToStage = useAssessmentStore((s) => s.goToStage)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const setNote = useAssessmentStore((s) => s.setNote)
  const reset = useAssessmentStore((s) => s.reset)

  const { data: config, isLoading, isError } = useConfig(configType)

  const norm = (s) => (s == null ? '' : String(s)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const isVisible = (q) => {
    if (!q.branch_on) return true
    const colonIdx = q.branch_on.indexOf(':')
    if (colonIdx !== -1) {
      const qKey = q.branch_on.slice(0, colonIdx)
      const expected = q.branch_on.slice(colonIdx + 1)
      const actual = answers[qKey]
      return actual === expected || norm(actual) === norm(expected)
    }
    const parentStageNum = q.branch_on.match(/^Q(\d+)/)?.[1]
    const thisStageNum = q.id.match(/^Q(\d+)/)?.[1]
    if (parentStageNum && thisStageNum && parentStageNum !== thisStageNum) return true
    return q.branch_on in answers
  }

  const goNextQ = () => useAssessmentStore.setState((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 }))
  const goPrevQ = () => useAssessmentStore.setState((s) => ({ currentQuestionIndex: s.currentQuestionIndex - 1 }))

  const submitMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/sessions/', payload),
    onSuccess: (res) => { reset(); navigate(`/results/${res.data.id}`) },
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ds-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-plex-mono" style={{ color: 'var(--ds-ink-soft)', fontSize: 13 }}>Loading assessment…</span>
      </div>
    )
  }

  if (isError || !config?.stages?.length) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ds-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#c0392b', fontSize: 13 }}>Failed to load assessment. Please refresh the page.</span>
      </div>
    )
  }

  const stages = config.stages
  const currentStage = stages[currentStageIndex]
  const questions = (currentStage?.questions || []).filter(isVisible)
  const safeIndex = Math.min(currentQuestionIndex, Math.max(0, questions.length - 1))
  const currentQuestion = questions[safeIndex]
  const isLastStage = currentStageIndex === stages.length - 1
  const isLastQuestion = currentQuestionIndex >= questions.length - 1
  const currentAnswer = answers[currentQuestion?.id]

  const REQUIRES_ANSWER = ['choice-row', 'multi-select', 'choice-scale', 'scored-4pt']
  const needsAnswer = currentQuestion && REQUIRES_ANSWER.includes(currentQuestion.question_type)
  const canProceed = !needsAnswer || currentAnswer != null

  const totalQuestions = stages.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
  const completedCount =
    stages.slice(0, currentStageIndex).reduce((sum, s) => sum + (s.questions?.length || 0), 0) +
    (currentQuestionIndex || 0)
  const progressPct = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0

  const stageNavItems = stages.map((s) => ({ id: s.id, label: s.label, icon: s.icon }))

  const handleNext = () => {
    const painKey = currentQuestion?.pain_key || currentQuestion?.tags
    if (painKey && currentAnswer != null) {
      useAssessmentStore.getState().addPainFlag(painKey)
    }
    if (isLastQuestion) {
      if (isLastStage) {
        const { stageMap } = useAssessmentStore.getState()
        const answersPayload = Object.entries(answers).map(([question_key, answer_value]) => ({
          question_key,
          stage_key: stageMap[question_key] || '',
          answer_value,
          note_text: notesDict[question_key] || '',
        }))
        submitMutation.mutate({ config_type: configType, answers: answersPayload })
      } else {
        goToStage(currentStageIndex + 1)
      }
    } else {
      goNextQ()
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) goPrevQ()
    else if (currentStageIndex > 0) goToStage(currentStageIndex - 1)
  }

  const isAtStart = currentStageIndex === 0 && currentQuestionIndex === 0

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--ds-paper)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: 'var(--ds-ink)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--ds-ink)',
          color: '#fff',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <SpritleLogo height={26} variant="color" />
          <span
            className="font-plex-mono"
            style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 14 }}
          >
            AI Readiness Discovery
          </span>
          <span
            className="font-plex-mono"
            style={{
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#fff', fontWeight: 600,
              background: configType === 'lite' ? '#15AED5' : '#82C341',
              borderRadius: 10, padding: '2px 8px',
            }}
          >
            {configType === 'lite' ? 'Lite' : 'Pro'}
          </span>
        </div>

        {/* Heartbeat pulse progress */}
        <div style={{ flex: 1, position: 'relative', height: 30, minWidth: 120 }}>
          <svg
            viewBox={`0 0 ${PULSE_VIEW_W} ${PULSE_VIEW_H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >
            <defs>
              <clipPath id="pulse-progress-clip">
                <rect
                  x={0} y={0}
                  width={(progressPct / 100) * PULSE_VIEW_W}
                  height={PULSE_VIEW_H}
                  style={{ transition: 'width 0.6s ease' }}
                />
              </clipPath>
            </defs>
            {/* Remaining (initial) — Spritle blue */}
            <path d={PULSE_D} fill="none" stroke="#15AED5" strokeWidth={2} opacity={0.5} />
            {/* Progress (completed) — Spritle green, clipped to left portion */}
            <path
              d={PULSE_D}
              fill="none"
              stroke="#82C341"
              strokeWidth={2.5}
              clipPath="url(#pulse-progress-clip)"
              style={{ filter: 'drop-shadow(0 0 5px rgba(130,195,65,0.8))' }}
            />
          </svg>
          <div
            className="ds-pulse-dot"
            style={{
              position: 'absolute', top: '50%',
              width: 9, height: 9, borderRadius: '50%',
              background: '#82C341',
              transform: 'translate(-50%, -50%)',
              left: `${progressPct}%`,
              transition: 'left 0.6s ease',
              boxShadow: '0 0 0 4px rgba(130,195,65,0.3)',
            }}
          />
        </div>

        {/* Percent counter */}
        <div className="font-plex-mono" style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, minWidth: 44, textAlign: 'right' }}>
          {progressPct}
          <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: 11 }}>%</span>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="ds-body" style={{ display: 'flex', flex: 1, alignItems: 'stretch', overflow: 'hidden' }}>
        <StageNav
          stages={stageNavItems}
          currentIndex={currentStageIndex}
          onSelect={(idx) => goToStage(idx)}
        />

        <main className="ds-main" style={{ flex: 1, overflowY: 'auto', padding: '29px 48px 24px' }}>
          <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
            {currentQuestion ? (
              <>
                {/* Eyebrow */}
                <p
                  className="font-plex-mono"
                  style={{
                    fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--ds-ink-soft)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    margin: '0 0 10px',
                  }}
                >
                  <span
                    style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--ds-amber)', display: 'inline-block', flexShrink: 0,
                    }}
                  />
                  Section {String(currentStageIndex + 1).padStart(2, '0')} /{' '}
                  {String(stages.length).padStart(2, '0')} · {currentStage.label}
                </p>

                {/* Question heading */}
                <h1
                  className="font-newsreader ds-question-heading"
                  style={{
                    fontWeight: 500,
                    fontSize: currentQuestion.prompt.length > 90 ? 26 : currentQuestion.prompt.length > 55 ? 31 : 38,
                    lineHeight: 1.22,
                    margin: '0 0 14px',
                  }}
                >
                  {currentQuestion.prompt}
                </h1>

                {currentQuestion.subtext && (
                  <p style={{ color: 'var(--ds-ink-soft)', fontSize: 16, margin: '0 0 12px' }}>
                    {currentQuestion.subtext}
                  </p>
                )}

                {/* Answer card */}
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={(val) => setAnswer(currentQuestion.id, val, currentStage.id)}
                  note={notesDict[currentQuestion?.id]}
                  onNote={(val) => setNote(currentQuestion.id, val)}
                />

                {/* Footer nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 19 }}>
                  <button
                    className="ds-btn ds-btn-ghost"
                    onClick={handleBack}
                    disabled={isAtStart}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  {!canProceed && (
                    <span style={{ fontSize: 12, color: 'var(--ds-ink-faint)' }}>
                      Select an option to continue
                    </span>
                  )}

                  <button
                    className="ds-btn ds-btn-solid"
                    onClick={handleNext}
                    disabled={submitMutation.isPending || !canProceed}
                  >
                    {submitMutation.isPending
                      ? 'Submitting…'
                      : isLastStage && isLastQuestion
                        ? 'Complete discovery'
                        : 'Next'}
                    {!submitMutation.isPending && <ArrowRight size={16} />}
                  </button>
                </div>

                {submitMutation.isError && (
                  <p style={{ color: '#c0392b', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
                    {submitMutation.error?.response?.data?.detail || 'Submission failed. Please try again.'}
                  </p>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--ds-ink-faint)', fontSize: 14 }}>No questions in this stage.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
