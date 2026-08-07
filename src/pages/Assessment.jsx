import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAssessmentStore } from '../stores/assessmentStore.js'
import { useConfig } from '../hooks/useConfig.js'
import StageNav from '../components/survey/StageNav.jsx'
import QuestionCard from '../components/survey/QuestionCard.jsx'
import apiClient from '../api/client.js'

export default function Assessment() {
  const navigate = useNavigate()
  const { data: config, isLoading, isError } = useConfig()

  const currentStageIndex = useAssessmentStore((s) => s.currentStageIndex)
  const currentQuestionIndex = useAssessmentStore((s) => s.currentQuestionIndex)
  const answers = useAssessmentStore((s) => s.answers)
  const notesDict = useAssessmentStore((s) => s.notesDict)
  const painFlags = useAssessmentStore((s) => s.painFlags)
  const goToStage = useAssessmentStore((s) => s.goToStage)
  const setAnswer = useAssessmentStore((s) => s.setAnswer)
  const setNote = useAssessmentStore((s) => s.setNote)
  const reset = useAssessmentStore((s) => s.reset)

  const isVisible = (q) => {
    if (!q.branch_on) return true
    const colonIdx = q.branch_on.indexOf(':')
    if (colonIdx !== -1) {
      const qKey = q.branch_on.slice(0, colonIdx)
      const expected = q.branch_on.slice(colonIdx + 1)
      const actual = answers[qKey]
      return actual === expected || String(actual) === expected
    }
    return painFlags.includes(q.branch_on)
  }

  const goNextQ = () => useAssessmentStore.setState((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 }))
  const goPrevQ = () => useAssessmentStore.setState((s) => ({ currentQuestionIndex: s.currentQuestionIndex - 1 }))

  const submitMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/sessions/', payload),
    onSuccess: (res) => {
      reset()
      navigate(`/results/${res.data.id}`)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading assessment…</div>
      </div>
    )
  }

  if (isError || !config?.stages?.length) {
    return (
      <div className="min-h-screen bg-[#0b0e17] flex items-center justify-center">
        <div className="text-red-400 text-sm">Failed to load assessment. Please refresh the page.</div>
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

  const stageNavItems = stages.map((s) => ({ id: s.id, label: s.label, icon: s.icon }))

  const handleNext = () => {
    // Trigger pain flag if this question has a pain_key and an answer
    if (currentQuestion?.pain_key && currentAnswer != null) {
      useAssessmentStore.getState().addPainFlag(currentQuestion.pain_key)
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
        submitMutation.mutate({ answers: answersPayload })
      } else {
        goToStage(currentStageIndex + 1)
      }
    } else {
      goNextQ()
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      goPrevQ()
    } else if (currentStageIndex > 0) {
      goToStage(currentStageIndex - 1)
    }
  }

  const totalQuestions = stages.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
  const answeredCount = Object.keys(answers).length
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0b0e17] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-[#0b0e17] z-10">
        <span className="text-2xl">⚡</span>
        <span className="font-bold text-white text-base">Spritle AI Discovery</span>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
          <span>{answeredCount} / {totalQuestions} answered</span>
          <div className="w-28 h-1.5 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <StageNav
          stages={stageNavItems}
          currentIndex={currentStageIndex}
          onSelect={(idx) => goToStage(idx)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-3xl mx-auto">
            {/* Question */}
            {currentQuestion ? (
              <>
                <div className="text-xs text-slate-500 mb-3">
                  Question {safeIndex + 1} of {questions.length}
                </div>
                <QuestionCard
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={(val) => setAnswer(currentQuestion.id, val, currentStage.id)}
                  note={notesDict[currentQuestion?.id]}
                  onNote={(val) => setNote(currentQuestion.id, val)}
                />
              </>
            ) : (
              <div className="text-slate-500 text-sm">No questions in this stage.</div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleBack}
                disabled={currentStageIndex === 0 && currentQuestionIndex === 0}
                className="px-5 py-2.5 rounded-lg border border-white/15 text-sm text-slate-300 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Back
              </button>

              <button
                onClick={handleNext}
                disabled={submitMutation.isPending}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {submitMutation.isPending
                  ? 'Submitting…'
                  : isLastStage && isLastQuestion
                  ? 'View Results →'
                  : 'Next →'}
              </button>
            </div>

            {submitMutation.isError && (
              <p className="text-red-400 text-xs mt-4 text-center">
                {submitMutation.error?.response?.data?.detail || 'Submission failed. Please try again.'}
              </p>
            )}
          </div>
        </main>
      </div>

    </div>
  )
}
