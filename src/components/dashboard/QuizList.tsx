import { Link } from 'react-router-dom'
import { BookOpenCheck, Bot, Trash2, UserPen } from 'lucide-react'
import type { Quiz } from '../../types/quiz'

interface QuizListProps {
  quizzes: Quiz[]
  onDelete: (id: string) => void
  inProgressQuizIds: string[]
}

function SourceBadge({ source }: { source: Quiz['source'] }) {
  const isApi = source === 'API'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        isApi ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isApi ? <Bot className="h-3.5 w-3.5" /> : <UserPen className="h-3.5 w-3.5" />}
      {source}
    </span>
  )
}

export function QuizList({ quizzes, onDelete, inProgressQuizIds }: QuizListProps) {
  const inProgressSet = new Set(inProgressQuizIds)

  if (quizzes.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
        <h2 className="text-xl font-semibold">No quiz yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          Import from Open Trivia DB or create your own custom quiz.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => {
        const hasInProgress = inProgressSet.has(quiz.id)

        return (
        <article
          key={quiz.id}
          className="group rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <SourceBadge source={quiz.source} />
            <button
              type="button"
              onClick={() => onDelete(quiz.id)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
              aria-label={`Delete ${quiz.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-4 line-clamp-2 text-lg font-semibold tracking-tight">{quiz.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{quiz.description || 'No description'}</p>

          <div className="mt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm text-slate-600">
              <BookOpenCheck className="h-4 w-4" />
              {quiz.questions.length} questions
            </span>
            <Link
              to={`/play/${quiz.id}`}
              className={`rounded-full px-4 py-2 text-sm font-medium text-white transition ${
                hasInProgress ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-900 hover:bg-slate-700'
              }`}
            >
              {hasInProgress ? 'Continue' : 'Play'}
            </Link>
          </div>
        </article>
        )
      })}
    </section>
  )
}
