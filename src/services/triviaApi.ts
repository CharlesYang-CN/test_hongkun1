import type { Question, QuestionType, QuizDifficulty } from '../types/quiz'
import { decodeBase64 } from '../utils/decodeBase64'
import { shuffleArray } from '../utils/shuffleArray'

const TRIVIA_API_BASE = 'https://opentdb.com'
const TOKEN_STORAGE_KEY = 'quiz-builder-trivia-token'

interface TriviaTokenRecord {
  token: string
  createdAt: string
}

interface TriviaCategory {
  id: number
  name: string
}

interface TriviaCategoriesResponse {
  trivia_categories: TriviaCategory[]
}

interface TriviaApiQuestion {
  category: string
  type: 'multiple' | 'boolean'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

interface TriviaQuestionsResponse {
  response_code: number
  results: TriviaApiQuestion[]
}

interface TriviaTokenResponse {
  response_code: number
  token: string
}

interface TriviaCategoryCountResponse {
  category_id: number
  category_question_count: {
    total_question_count?: number
    total_easy_question_count?: number
    total_medium_question_count?: number
    total_hard_question_count?: number
    total_multiple_choice_question_count?: number
    total_true_false_question_count?: number
    total_question_count_multiple?: number
    total_question_count_boolean?: number
  }
}

export interface FetchTriviaQuestionsParams {
  amount: number
  category?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  type?: 'multiple' | 'boolean'
}

export async function fetchCategories(): Promise<TriviaCategory[]> {
  const response = await fetch(`${TRIVIA_API_BASE}/api_category.php`)

  if (!response.ok) {
    throw new Error('Failed to fetch trivia categories.')
  }

  const data = (await response.json()) as TriviaCategoriesResponse
  return data.trivia_categories ?? []
}

export async function fetchTriviaQuestions(
  params: FetchTriviaQuestionsParams,
): Promise<Question[]> {
  return fetchTriviaQuestionsInternal(params, 0)
}

async function fetchTriviaQuestionsInternal(
  params: FetchTriviaQuestionsParams,
  retryCount: number,
): Promise<Question[]> {
  const searchParams = new URLSearchParams({
    amount: String(params.amount),
    encode: 'base64',
  })

  const token = await ensureTriviaToken()
  if (token) {
    searchParams.set('token', token)
  }

  if (params.category) {
    searchParams.set('category', String(params.category))
  }

  if (params.difficulty) {
    searchParams.set('difficulty', params.difficulty)
  }

  if (params.type) {
    searchParams.set('type', params.type)
  }

  const response = await fetch(`${TRIVIA_API_BASE}/api.php?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch trivia questions.')
  }

  const payload = (await response.json()) as TriviaQuestionsResponse

  if (payload.response_code === 3 && retryCount < 1) {
    clearStoredTriviaToken()
    return fetchTriviaQuestionsInternal(params, retryCount + 1)
  }

  if (payload.response_code === 4 && retryCount < 1) {
    if (token) {
      await resetTriviaSessionToken(token)
    } else {
      clearStoredTriviaToken()
    }

    return fetchTriviaQuestionsInternal(params, retryCount + 1)
  }

  assertResponseCode(payload.response_code)

  return payload.results.map(adaptApiQuestionToQuestion)
}

function assertResponseCode(responseCode: number): void {
  if (responseCode === 1) {
    throw new Error('No results for this query. Please reduce amount or change filters.')
  }

  if (responseCode === 5) {
    throw new Error('Rate limit exceeded. Please wait a few seconds and try again.')
  }

  if (responseCode === 3) {
    throw new Error('Trivia session token is invalid. Please retry import.')
  }

  if (responseCode === 4) {
    throw new Error('Trivia session token is exhausted. Please retry import to refresh token.')
  }

  if (responseCode !== 0) {
    throw new Error(`Open Trivia API returned response_code=${responseCode}.`)
  }
}

export async function fetchEstimatedAvailableQuestions(
  params: Omit<FetchTriviaQuestionsParams, 'amount'>,
): Promise<number | null> {
  if (!params.category) {
    return null
  }

  const response = await fetch(
    `${TRIVIA_API_BASE}/api_count.php?category=${params.category}`,
  )

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as TriviaCategoryCountResponse
  const counts = payload.category_question_count
  if (!counts) {
    return null
  }

  const total = counts.total_question_count ?? 0
  const byDifficulty = {
    easy: counts.total_easy_question_count ?? total,
    medium: counts.total_medium_question_count ?? total,
    hard: counts.total_hard_question_count ?? total,
  }

  const multipleCount =
    counts.total_multiple_choice_question_count ?? counts.total_question_count_multiple ?? total
  const booleanCount =
    counts.total_true_false_question_count ?? counts.total_question_count_boolean ?? total

  const byType = {
    multiple: multipleCount,
    boolean: booleanCount,
  }

  let available = total

  if (params.difficulty) {
    available = Math.min(available, byDifficulty[params.difficulty])
  }

  if (params.type) {
    available = Math.min(available, byType[params.type])
  }

  return Math.max(0, available)
}

async function ensureTriviaToken(): Promise<string | null> {
  const stored = getStoredTriviaToken()
  if (stored) {
    return stored
  }

  const token = await requestTriviaSessionToken()
  return token
}

function getStoredTriviaToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as TriviaTokenRecord
    return parsed.token || null
  } catch {
    return null
  }
}

function setStoredTriviaToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const payload: TriviaTokenRecord = {
    token,
    createdAt: new Date().toISOString(),
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload))
}

function clearStoredTriviaToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

async function requestTriviaSessionToken(): Promise<string> {
  const response = await fetch(`${TRIVIA_API_BASE}/api_token.php?command=request`)
  if (!response.ok) {
    throw new Error('Failed to request trivia session token.')
  }

  const payload = (await response.json()) as TriviaTokenResponse
  if (payload.response_code !== 0 || !payload.token) {
    throw new Error('Failed to request trivia session token.')
  }

  setStoredTriviaToken(payload.token)
  return payload.token
}

export async function resetTriviaSessionToken(token?: string): Promise<void> {
  const currentToken = token ?? getStoredTriviaToken()
  if (!currentToken) {
    await requestTriviaSessionToken()
    return
  }

  const response = await fetch(
    `${TRIVIA_API_BASE}/api_token.php?command=reset&token=${currentToken}`,
  )

  if (!response.ok) {
    throw new Error('Failed to reset trivia session token.')
  }

  const payload = (await response.json()) as TriviaTokenResponse
  if (payload.response_code !== 0) {
    clearStoredTriviaToken()
    await requestTriviaSessionToken()
    return
  }

  setStoredTriviaToken(currentToken)
}

function adaptApiQuestionToQuestion(apiQuestion: TriviaApiQuestion): Question {
  const decodedType = decodeBase64(apiQuestion.type)
  const decodedDifficulty = decodeBase64(apiQuestion.difficulty)
  const correctAnswer = decodeBase64(apiQuestion.correct_answer)
  const incorrectAnswers = apiQuestion.incorrect_answers.map((answer) =>
    decodeBase64(answer),
  )

  return {
    id: createQuestionId(),
    type: normalizeQuestionType(decodedType),
    difficulty: normalizeDifficulty(decodedDifficulty),
    questionText: decodeBase64(apiQuestion.question),
    correctAnswer,
    incorrectAnswers,
  }
}

export function toShuffledAnswerOptions(question: Question): string[] {
  if (question.type === 'short-answer') {
    return []
  }

  return shuffleArray([question.correctAnswer, ...question.incorrectAnswers])
}

function normalizeQuestionType(value: string): QuestionType {
  return value === 'boolean' ? 'boolean' : 'multiple'
}

function normalizeDifficulty(value: string): QuizDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value
  }

  return 'mixed'
}

function createQuestionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export type { TriviaCategory }
