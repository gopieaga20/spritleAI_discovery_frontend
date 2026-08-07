import { create } from 'zustand'

export const useAssessmentStore = create((set, get) => ({
  sessionId: null,
  currentStageIndex: 0,
  currentQuestionIndex: 0,
  answers: {},       // { questionKey: value }
  notesDict: {},     // { questionKey: noteText }
  stageMap: {},      // { questionKey: stageId }
  painFlags: [],     // derived pain flag ids (tracked locally for branch logic)

  setSessionId: (id) => set({ sessionId: id }),

  setAnswer: (questionKey, value, stageId) =>
    set((s) => ({
      answers: { ...s.answers, [questionKey]: value },
      stageMap: stageId ? { ...s.stageMap, [questionKey]: stageId } : s.stageMap,
    })),

  setNote: (questionKey, text) =>
    set((s) => ({ notesDict: { ...s.notesDict, [questionKey]: text } })),

  addPainFlag: (flagId) =>
    set((s) =>
      s.painFlags.includes(flagId) ? {} : { painFlags: [...s.painFlags, flagId] }
    ),

  removePainFlag: (flagId) =>
    set((s) => ({ painFlags: s.painFlags.filter((f) => f !== flagId) })),

  nextQuestion: (stageCount, questionsInStage) => {
    const { currentStageIndex, currentQuestionIndex } = get()
    if (currentQuestionIndex < questionsInStage - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    } else if (currentStageIndex < stageCount - 1) {
      set({ currentStageIndex: currentStageIndex + 1, currentQuestionIndex: 0 })
    }
  },

  prevQuestion: () => {
    const { currentStageIndex, currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    } else if (currentStageIndex > 0) {
      set({ currentStageIndex: currentStageIndex - 1, currentQuestionIndex: 0 })
    }
  },

  goToStage: (idx) => set({ currentStageIndex: idx, currentQuestionIndex: 0 }),

  reset: () =>
    set({
      sessionId: null,
      currentStageIndex: 0,
      currentQuestionIndex: 0,
      answers: {},
      notesDict: {},
      stageMap: {},
      painFlags: [],
    }),
}))
