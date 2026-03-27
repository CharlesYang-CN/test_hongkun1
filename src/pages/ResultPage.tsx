import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CircleHelp, XCircle } from 'lucide-react'
import { useQuizStore } from '../store/quizStore'

export function ResultPage() {
  const lastResult = useQuizStore((state) => state.lastResult)
  const resultHistory = useQuizStore((state) => state.resultHistory)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(lastResult?.resultId ?? null)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'unanswered'>('all')

  useEffect(() => {
    if (!selectedResultId && resultHistory.length > 0) {
      setSelectedResultId(resultHistory[0].resultId)
      return
    }

    if (selectedResultId && !resultHistory.some((item) => item.resultId === selectedResultId)) {
      setSelectedResultId(resultHistory[0]?.resultId ?? null)
    }
  }, [resultHistory, selectedResultId])

  const selectedResult = resultHistory.find((item) => item.resultId === selectedResultId) ?? lastResult
  const quiz = useQuizStore((state) =>
    selectedResult ? state.getQuizById(selectedResult.quizId) : undefined,
  )

  if (!selectedResult) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Quiz Result</h1>
        <p className="mt-2 text-slate-600">No completed quiz result found.</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Back to Dashboard
        </Link>
      </section>
    )
  }

  const filteredAnswers = selectedResult.answers.filter((answer) => {
    if (reviewFilter === 'incorrect') {
      return !answer.isCorrect
    }

    if (reviewFilter === 'unanswered') {
      return !answer.userAnswer.trim()
    }

    return true
  })

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Result Summary</h1>
        <p className="mt-2 text-slate-600">{quiz ? quiz.title : 'Completed quiz'}</p>

        {resultHistory.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {resultHistory.map((item, index) => {
              const isSelected = item.resultId === selectedResult.resultId

              return (
                <button
                  key={item.resultId}
                  type="button"
                  onClick={() => setSelectedResultId(item.resultId)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  Attempt {resultHistory.length - index}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Score</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {selectedResult.score}/{selectedResult.total}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-100 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-amber-700">Accuracy</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{selectedResult.percentage}%</p>
          </div>

          <div className="rounded-2xl bg-emerald-100 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Completed At</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {new Date(selectedResult.completedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link to="/" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Back to Dashboard
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Answer Review</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={`rounded-full px-3 py-1.5 text-xs ${
                reviewFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('incorrect')}
              className={`rounded-full px-3 py-1.5 text-xs ${
                reviewFilter === 'incorrect'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Incorrect
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('unanswered')}
              className={`rounded-full px-3 py-1.5 text-xs ${
                reviewFilter === 'unanswered'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Unanswered
            </button>
          </div>
        </div>

        {filteredAnswers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            No answers under current filter.
          </div>
        ) : null}

        {filteredAnswers.map((answer, index) => {
          const isCorrect = answer.isCorrect

          return (
            <article
              key={answer.questionId}
              className={`rounded-2xl border p-4 ${
                isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-900">
                  Q{index + 1}. {answer.questionText}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-700">
                Your answer:{' '}
                <span className="font-semibold">
                  {answer.userAnswer || (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <CircleHelp className="h-3.5 w-3.5" />
                      No answer
                    </span>
                  )}
                </span>
              </p>

              <p className="mt-1 text-sm text-slate-700">
                Correct answer: <span className="font-semibold">{answer.correctAnswer}</span>
              </p>

              <div className="mt-3">
                <Link
                  to={`/play/${selectedResult.quizId}?questionId=${encodeURIComponent(answer.questionId)}`}
                  className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  Redo this question
                </Link>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
