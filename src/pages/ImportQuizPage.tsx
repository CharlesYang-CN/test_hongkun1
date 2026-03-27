import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Save, Wand2 } from 'lucide-react'
import {
  fetchCategories,
  fetchEstimatedAvailableQuestions,
  fetchTriviaQuestions,
  resetTriviaSessionToken,
  type TriviaCategory,
} from '../services/triviaApi'
import { useQuizStore } from '../store/quizStore'
import { createId } from '../utils/id'
import type { Question, Quiz } from '../types/quiz'

type WizardStep = 1 | 2 | 3

interface FormState {
  title: string
  description: string
  category: string
  difficulty: '' | 'easy' | 'medium' | 'hard'
  type: '' | 'multiple' | 'boolean'
  amount: number
}

const defaultForm: FormState = {
  title: '',
  description: '',
  category: '',
  difficulty: '',
  type: '',
  amount: 10,
}

export function ImportQuizPage() {
  const [step, setStep] = useState<WizardStep>(1)
  const [categories, setCategories] = useState<TriviaCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string>('')
  const [estimatedAvailable, setEstimatedAvailable] = useState<number | null>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)

  const addQuiz = useQuizStore((state) => state.addQuiz)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function loadCategories() {
      try {
        const categoryList = await fetchCategories()
        if (!mounted) return
        setCategories(categoryList)
      } catch {
        if (!mounted) return
        setError('Unable to load categories from Open Trivia DB.')
      } finally {
        if (mounted) {
          setLoadingCategories(false)
        }
      }
    }

    void loadCategories()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadEstimate() {
      setLoadingEstimate(true)

      try {
        const available = await fetchEstimatedAvailableQuestions({
          category: form.category ? Number(form.category) : undefined,
          difficulty: form.difficulty || undefined,
          type: form.type || undefined,
        })

        if (!mounted) {
          return
        }

        setEstimatedAvailable(available)
      } finally {
        if (mounted) {
          setLoadingEstimate(false)
        }
      }
    }

    void loadEstimate()

    return () => {
      mounted = false
    }
  }, [form.category, form.difficulty, form.type])

  const stepLabel = useMemo(
    () => ({
      1: 'Step 1: Filters',
      2: 'Step 2: Loading / Error',
      3: 'Step 3: Preview & Save',
    }),
    [],
  )

  async function runImport() {
    if (form.amount < 1 || form.amount > 50) {
      setError('Amount must be between 1 and 50.')
      setStep(1)
      return
    }

    if (estimatedAvailable !== null && form.amount > estimatedAvailable) {
      setError(
        `Estimated available questions for current filters: ${estimatedAvailable}. Please reduce amount or broaden filters.`,
      )
      setStep(1)
      return
    }

    setStep(2)
    setError('')

    try {
      const questions = await fetchTriviaQuestions({
        amount: form.amount,
        category: form.category ? Number(form.category) : undefined,
        difficulty: form.difficulty || undefined,
        type: form.type || undefined,
      })

      setPreviewQuestions(questions)
      setStep(3)
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Failed to import questions.'
      setError(message)
      setStep(2)
    }
  }

  function saveQuiz() {
    const now = new Date().toISOString()
    const selectedCategoryName = categories.find((item) => String(item.id) === form.category)?.name

    const quiz: Quiz = {
      id: createId(),
      title: form.title || `API Quiz ${new Date().toLocaleDateString()}`,
      description: form.description || (selectedCategoryName ? `Category: ${selectedCategoryName}` : 'Imported from Open Trivia DB'),
      source: 'API',
      questions: previewQuestions,
      createdAt: now,
    }

    addQuiz(quiz)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Import Wizard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Import from Open Trivia DB</h1>
        <p className="mt-2 text-slate-600">
          {stepLabel[step]} - base64 decode and API response code handling are already wired.
        </p>
      </section>

      {step === 1 && (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          {loadingCategories ? (
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading categories...
            </div>
          ) : (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                void runImport()
              }}
            >
              <label className="flex flex-col gap-1 text-sm">
                Quiz title (optional)
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Description (optional)
                <input
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Any category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Difficulty
                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      difficulty: event.target.value as FormState['difficulty'],
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Type
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as FormState['type'],
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="boolean">True / False</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Amount (1-50)
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.amount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: Number(event.target.value),
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="md:col-span-2">
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {loadingEstimate ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Estimating available questions...
                    </span>
                  ) : estimatedAvailable === null ? (
                    'Availability estimate: select a category to see a more accurate number.'
                  ) : (
                    <span>
                      Availability estimate for current filters: <strong>{estimatedAvailable}</strong>
                    </span>
                  )}
                </div>

                {error ? (
                  <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <Wand2 className="h-4 w-4" />
                  Fetch questions
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          {!error ? (
            <div className="flex items-center gap-3 text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading questions...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Import failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void runImport()
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void resetTriviaSessionToken()
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm"
                >
                  Reset token
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm"
                >
                  Back to filters
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">{previewQuestions.length} questions ready to save</p>
          </div>

          <div className="grid gap-3">
            {previewQuestions.map((question, index) => (
              <article key={question.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  Q{index + 1} - {question.type} - {question.difficulty}
                </p>
                <h3 className="mt-1 font-medium">{question.questionText}</h3>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveQuiz}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <Save className="h-4 w-4" />
              Save quiz
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm"
            >
              Edit filters
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
