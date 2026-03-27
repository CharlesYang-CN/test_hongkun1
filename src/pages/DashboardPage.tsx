import { useNavigate } from 'react-router-dom'
import { ArrowRight, DownloadCloud, PlusSquare } from 'lucide-react'
import { QuizList } from '../components/dashboard/QuizList'
import { useQuizStore } from '../store/quizStore'

export function DashboardPage() {
  const quizzes = useQuizStore((state) => state.quizzes)
  const deleteQuiz = useQuizStore((state) => state.deleteQuiz)
  const inProgressSessions = useQuizStore((state) => state.inProgressSessions)
  const navigate = useNavigate()

  const inProgressQuizIds = Object.keys(inProgressSessions)

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quiz Builder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Build, import and manage your quizzes in one place
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Your saved quizzes are persisted in local storage with Zustand persist.
        </p>
        {inProgressQuizIds.length > 0 ? (
          <p className="mt-2 text-sm font-medium text-amber-700">
            You have {inProgressQuizIds.length} in-progress quiz{inProgressQuizIds.length > 1 ? 'zes' : ''}.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/import')}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <DownloadCloud className="h-4 w-4" />
            Import from API
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-amber-200"
          >
            <PlusSquare className="h-4 w-4" />
            Create custom quiz
          </button>
        </div>
      </section>

      <QuizList quizzes={quizzes} onDelete={deleteQuiz} inProgressQuizIds={inProgressQuizIds} />
    </div>
  )
}
