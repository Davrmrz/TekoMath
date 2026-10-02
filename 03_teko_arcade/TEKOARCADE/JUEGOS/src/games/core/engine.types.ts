import type { Difficulty, SourceType } from '../../types'

export type GameSessionStatus = 'ready' | 'playing' | 'feedback' | 'completed' | 'abandoned'
export type CompletionReason = 'completed' | 'abandoned' | 'time-expired' | 'user-exit'
export type GameFeedbackKind = 'correct' | 'incorrect' | 'hint' | 'pending'

export interface GameExercise {
  id: string
  topicId: string
  prompt: string
  difficulty: Difficulty
  source: SourceType
  knownValues: Record<string, number | string>
  unknown: string
  expectedAnswer: string
  hints: string[]
}

export interface PlayerAnswer {
  value: string | number
  submittedAt: string
}

export interface GameFeedback {
  kind: GameFeedbackKind
  message: string
  expectedAnswer?: string
}

export interface GameAttempt {
  attemptId: string
  attemptNumber: number
  answer: PlayerAnswer
  isCorrect: boolean | null
  feedback: GameFeedback
  scoreAwarded: number
}

export interface GameScore {
  points: number
  correctAnswers: number
  evaluatedAttempts: number
  totalAttempts: number
  accuracy: number
}

export interface GameResult {
  correct: boolean
  attempts: number
  totalAttempts?: number
  correctAnswers?: number
  correctPairs?: number
  incorrectAttempts?: number
  bestCombo?: number
  accuracy: number
  score: number
  xpEarned: number
  stars: number
  hintsUsed: number
  duration: number
  completionReason: CompletionReason
}

export interface GameSession {
  sessionId: string
  gameId: string
  topicId: string
  exerciseId: string
  roundCount?: number
  exercise: GameExercise
  startedAt: string
  status: GameSessionStatus
  attempts: GameAttempt[]
  hintsUsed: number
  currentScore: GameScore
  currentFeedback: GameFeedback | null
  result: GameResult | null
}

export interface CreateGameSessionInput {
  sessionId: string
  gameId: string
  topicId: string
  exercise: GameExercise
  roundCount?: number
  startedAt: string
}

export interface AttemptEvaluation {
  isCorrect: boolean | null
  message?: string
}