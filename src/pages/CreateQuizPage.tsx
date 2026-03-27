import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useQuizStore } from '../store/quizStore'
import { createId } from '../utils/id'
import type { Question, QuestionType, Quiz } from '../types/quiz'

interface DraftQuestion {
  id: string
  type: QuestionType
  difficulty: 'easy' | 'medium' | 'hard'
  questionText: string
  correctAnswer: string
  incorrectAnswers: string[]
}

function createDraftQuestion(): DraftQuestion {
  return {
    id: createId(),
    type: 'multiple',
    difficulty: 'easy',
    questionText: '',
    correctAnswer: '',
    incorrectAnswers: ['', '', ''],
  }
}

export function CreateQuizPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<DraftQuestion[]>([createDraftQuestion()])
  const [error, setError] = useState('')

  const addQuiz = useQuizStore((state) => state.addQuiz)
  const navigate = useNavigate()

  function addQuestion() {
    setQuestions((prev) => [...prev, createDraftQuestion()])
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((question) => question.id !== id))
  }

  function updateQuestion(id: string, updater: (question: DraftQuestion) => DraftQuestion) {
    setQuestions((prev) => prev.map((question) => (question.id === id ? updater(question) : question)))
  }

  function addIncorrectAnswer(id: string) {
    updateQuestion(id, (question) => ({
      ...question,
      incorrectAnswers: [...question.incorrectAnswers, ''],
    }))
  }

  function removeIncorrectAnswer(id: string, index: number) {
    updateQuestion(id, (question) => ({
      ...question,
      incorrectAnswers: question.incorrectAnswers.filter((_, answerIndex) => answerIndex !== index),
    }))
  }

  function normalizeQuestion(question: DraftQuestion): Question {
    if (question.type === 'boolean') {
      const normalizedCorrect = question.correctAnswer === 'False' ? 'False' : 'True'
      return {
        id: createId(),
        type: question.type,
        difficulty: question.difficulty,
        questionText: question.questionText.trim(),
        correctAnswer: normalizedCorrect,
        incorrectAnswers: [normalizedCorrect === 'True' ? 'False' : 'True'],
      }
    }

    if (question.type === 'short-answer') {
      return {
        id: createId(),
        type: question.type,
        difficulty: question.difficulty,
        questionText: question.questionText.trim(),
        correctAnswer: question.correctAnswer.trim(),
        incorrectAnswers: [],
      }
    }

    return {
      id: createId(),
      type: question.type,
      difficulty: question.difficulty,
      questionText: question.questionText.trim(),
      correctAnswer: question.correctAnswer.trim(),
      incorrectAnswers: question.incorrectAnswers.map((answer) => answer.trim()).filter(Boolean),
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a quiz title.')
      return
    }

    if (questions.length === 0) {
      setError('Please add at least one question.')
      return
    }

    const hasMissingQuestionText = questions.some((question) => !question.questionText.trim())
    if (hasMissingQuestionText) {
      setError('Each question needs text.')
      return
    }

    const hasMissingCorrectAnswer = questions.some((question) => !question.correctAnswer.trim())
    if (hasMissingCorrectAnswer) {
      setError('Each question needs a correct answer.')
      return
    }

    const hasInvalidMultiple = questions.some(
      (question) => question.type === 'multiple' && question.incorrectAnswers.map((answer) => answer.trim()).filter(Boolean).length === 0,
    )

    if (hasInvalidMultiple) {
      setError('Multiple choice questions need at least one incorrect answer.')
      return
    }

    const quiz: Quiz = {
      id: createId(),
      title: title.trim(),
      description: description.trim(),
      source: 'CUSTOM',
      questions: questions.map(normalizeQuestion),
      createdAt: new Date().toISOString(),
    }

    addQuiz(quiz)
    navigate('/')
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Custom Builder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your own quiz</h1>
        <p className="mt-2 text-slate-600">Question forms are conditionally rendered by question type.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Quiz title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        {questions.map((question, index) => (
          <article key={question.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Question {index + 1}</h2>
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length === 1}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                Type
                <select
                  value={question.type}
                  onChange={(event) => {
                    const nextType = event.target.value as QuestionType
                    updateQuestion(question.id, (prev) => ({
                      ...prev,
                      type: nextType,
                      correctAnswer: nextType === 'boolean' ? 'True' : prev.correctAnswer,
                      incorrectAnswers:
                        nextType === 'multiple' ? prev.incorrectAnswers.length > 0 ? prev.incorrectAnswers : ['', '', ''] : [],
                    }))
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="multiple">Multiple choice</option>
                  <option value="boolean">True / False</option>
                  <option value="short-answer">Short answer</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Difficulty
                <select
                  value={question.difficulty}
                  onChange={(event) =>
                    updateQuestion(question.id, (prev) => ({
                      ...prev,
                      difficulty: event.target.value as DraftQuestion['difficulty'],
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="md:col-span-3 flex flex-col gap-1 text-sm">
                Question text
                <input
                  value={question.questionText}
                  onChange={(event) =>
                    updateQuestion(question.id, (prev) => ({
                      ...prev,
                      questionText: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </label>
            </div>

            <div className="mt-4 space-y-3">
              {question.type === 'boolean' && (
                <label className="flex flex-col gap-1 text-sm">
                  Correct answer
                  <select
                    value={question.correctAnswer || 'True'}
                    onChange={(event) =>
                      updateQuestion(question.id, (prev) => ({
                        ...prev,
                        correctAnswer: event.target.value,
                      }))
                    }
                    className="max-w-xs rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </label>
              )}

              {question.type === 'short-answer' && (
                <label className="flex flex-col gap-1 text-sm">
                  Correct answer
                  <input
                    value={question.correctAnswer}
                    onChange={(event) =>
                      updateQuestion(question.id, (prev) => ({
                        ...prev,
                        correctAnswer: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
              )}

              {question.type === 'multiple' && (
                <div className="space-y-3">
                  <label className="flex flex-col gap-1 text-sm">
                    Correct answer
                    <input
                      value={question.correctAnswer}
                      onChange={(event) =>
                        updateQuestion(question.id, (prev) => ({
                          ...prev,
                          correctAnswer: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2"
                      required
                    />
                  </label>

                  {question.incorrectAnswers.map((answer, answerIndex) => (
                    <div key={`${question.id}-incorrect-${answerIndex}`} className="flex items-center gap-2">
                      <input
                        value={answer}
                        onChange={(event) =>
                          updateQuestion(question.id, (prev) => ({
                            ...prev,
                            incorrectAnswers: prev.incorrectAnswers.map((item, itemIndex) =>
                              itemIndex === answerIndex ? event.target.value : item,
                            ),
                          }))
                        }
                        placeholder={`Incorrect answer ${answerIndex + 1}`}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeIncorrectAnswer(question.id, answerIndex)}
                        className="rounded-lg border border-slate-300 p-2"
                        aria-label="Remove incorrect answer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addIncorrectAnswer(question.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add incorrect answer
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
        <button type="submit" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">
          Save Custom Quiz
        </button>
      </div>
    </form>
  )
}
