import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { toShuffledAnswerOptions } from '../services/triviaApi'
import { useQuizStore } from '../store/quizStore'
import type { QuizAnswerDetail } from '../types/quiz'
import { createId } from '../utils/id'

export function PlayQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const quiz = useQuizStore((state) => (quizId ? state.getQuizById(quizId) : undefined))
  const setLastResult = useQuizStore((state) => state.setLastResult)
  const getInProgressSession = useQuizStore((state) => state.getInProgressSession)
  const saveInProgressSession = useQuizStore((state) => state.saveInProgressSession)
  const clearInProgressSession = useQuizStore((state) => state.clearInProgressSession)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const hasHydratedSession = useRef(false)

  const optionsByQuestionId = useMemo(() => {
    if (!quiz) {
      return {}
    }

    return quiz.questions.reduce<Record<string, string[]>>((accumulator, question) => {
      accumulator[question.id] = toShuffledAnswerOptions(question)
      return accumulator
    }, {})
  }, [quiz])

  useEffect(() => {
    if (!quiz || hasHydratedSession.current) {
      return
    }

    const session = getInProgressSession(quiz.id)
    if (session) {
      const boundedIndex = Math.min(
        Math.max(session.currentQuestionIndex, 0),
        Math.max(quiz.questions.length - 1, 0),
      )

      setCurrentQuestionIndex(boundedIndex)
      setUserAnswers(session.userAnswers)
    }

    hasHydratedSession.current = true
  }, [getInProgressSession, quiz])

  useEffect(() => {
    if (!quiz || !hasHydratedSession.current) {
      return
    }

    saveInProgressSession({
      quizId: quiz.id,
      currentQuestionIndex,
      userAnswers,
      updatedAt: new Date().toISOString(),
    })
  }, [currentQuestionIndex, quiz, saveInProgressSession, userAnswers])

  useEffect(() => {
    if (!quiz) {
      return
    }

    const targetQuestionId = searchParams.get('questionId')
    if (!targetQuestionId) {
      return
    }

    const targetIndex = quiz.questions.findIndex((question) => question.id === targetQuestionId)
    if (targetIndex < 0) {
      return
    }

    setCurrentQuestionIndex(targetIndex)
  }, [quiz, searchParams])

  if (!quiz) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Quiz Player</h1>
        <p className="mt-2 text-slate-600">Quiz not found.</p>
      </section>
    )
  }

  const resolvedQuiz = quiz

  const totalQuestions = resolvedQuiz.questions.length
  const currentQuestion = resolvedQuiz.questions[currentQuestionIndex]
  const currentAnswer = userAnswers[currentQuestion.id] ?? ''
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  function setAnswer(value: string) {
    setUserAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }))
  }

  function goPrevious() {
    if (isFirstQuestion) {
      return
    }

    setCurrentQuestionIndex((previous) => previous - 1)
  }

  function goNext() {
    if (isLastQuestion) {
      return
    }

    setCurrentQuestionIndex((previous) => previous + 1)
  }

  function scoreAnswer(questionId: string, answer: string): boolean {
    const question = resolvedQuiz.questions.find((item) => item.id === questionId)

    if (!question) {
      return false
    }

    if (question.type === 'short-answer') {
      return answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    }

    return answer === question.correctAnswer
  }

  function handleSubmit() {
    const answerDetails: QuizAnswerDetail[] = resolvedQuiz.questions.map((question) => {
      const userAnswer = userAnswers[question.id] ?? ''
      const isCorrect = scoreAnswer(question.id, userAnswer)

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.type,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      }
    })

    const score = answerDetails.filter((item) => item.isCorrect).length
    const percentage = totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100)

    setLastResult({
      resultId: createId(),
      quizId: resolvedQuiz.id,
      score,
      total: totalQuestions,
      percentage,
      answers: answerDetails,
      completedAt: new Date().toISOString(),
    })

    clearInProgressSession(resolvedQuiz.id)

    navigate('/result')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">{resolvedQuiz.title}</h1>
        <p className="mt-2 text-slate-600">
          {resolvedQuiz.description || 'Answer all questions and submit at the end.'}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            {currentQuestion.type} / {currentQuestion.difficulty}
          </p>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">{currentQuestion.questionText}</h2>

        {currentQuestion.type === 'short-answer' ? (
          <label className="mt-5 block text-sm">
            Your answer
            <input
              value={currentAnswer}
              onChange={(event) => setAnswer(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900"
              placeholder="Type your answer"
            />
          </label>
        ) : (
          <div className="mt-5 grid gap-3">
            {optionsByQuestionId[currentQuestion.id]?.map((option) => {
              const checked = currentAnswer === option

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={checked}
                    onChange={() => setAnswer(option)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isFirstQuestion}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Submit
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
