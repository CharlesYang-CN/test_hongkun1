export type QuestionType = 'multiple' | 'boolean' | 'short-answer'

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

export interface Question {
  id: string
  type: QuestionType
  difficulty: QuizDifficulty
  questionText: string
  correctAnswer: string
  incorrectAnswers: string[]
}

export interface Quiz {
  id: string
  title: string
  description: string
  source: 'API' | 'CUSTOM'
  questions: Question[]
  createdAt: string
}

export interface QuizAnswerDetail {
  questionId: string
  questionText: string
  questionType: QuestionType
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export interface QuizResult {
  resultId: string
  quizId: string
  score: number
  total: number
  percentage: number
  answers: QuizAnswerDetail[]
  completedAt: string
}

export interface InProgressSession {
  quizId: string
  currentQuestionIndex: number
  userAnswers: Record<string, string>
  updatedAt: string
}
