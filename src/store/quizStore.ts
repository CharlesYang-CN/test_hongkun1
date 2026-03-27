import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { InProgressSession, Quiz, QuizResult } from '../types/quiz'

interface QuizStore {
  quizzes: Quiz[]
  lastResult: QuizResult | null
  resultHistory: QuizResult[]
  inProgressSessions: Record<string, InProgressSession>
  addQuiz: (quiz: Quiz) => void
  deleteQuiz: (id: string) => void
  getQuizById: (id: string) => Quiz | undefined
  setLastResult: (result: QuizResult) => void
  clearLastResult: () => void
  saveInProgressSession: (session: InProgressSession) => void
  getInProgressSession: (quizId: string) => InProgressSession | undefined
  clearInProgressSession: (quizId: string) => void
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [],
      lastResult: null,
      resultHistory: [],
      inProgressSessions: {},
      addQuiz: (quiz) =>
        set((state) => ({
          quizzes: [quiz, ...state.quizzes],
        })),
      deleteQuiz: (id) =>
        set((state) => ({
          quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
        })),
      getQuizById: (id) => get().quizzes.find((quiz) => quiz.id === id),
      setLastResult: (result) =>
        set((state) => ({
          lastResult: result,
          resultHistory: [result, ...state.resultHistory],
        })),
      clearLastResult: () => set({ lastResult: null }),
      saveInProgressSession: (session) =>
        set((state) => ({
          inProgressSessions: {
            ...state.inProgressSessions,
            [session.quizId]: session,
          },
        })),
      getInProgressSession: (quizId) => get().inProgressSessions[quizId],
      clearInProgressSession: (quizId) =>
        set((state) => {
          const nextSessions = { ...state.inProgressSessions }
          delete nextSessions[quizId]

          return { inProgressSessions: nextSessions }
        }),
    }),
    {
      name: 'quiz-builder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quizzes: state.quizzes,
        lastResult: state.lastResult,
        resultHistory: state.resultHistory,
        inProgressSessions: state.inProgressSessions,
      }),
    },
  ),
)
