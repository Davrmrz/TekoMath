import type {
  AttemptEvaluation,
  CompletionReason,
  CreateGameSessionInput,
  GameAttempt,
  GameFeedback,
  GameResult,
  GameScore,
  GameSession,
  PlayerAnswer,
} from './engine.types'

const EMPTY_SCORE: GameScore = {
  points: 0,
  correctAnswers: 0,
  evaluatedAttempts: 0,
  totalAttempts: 0,
  accuracy: 0,
}

export function createGameSession(input: CreateGameSessionInput): GameSession {
  return {
    sessionId: input.sessionId,
    gameId: input.gameId,
    topicId: input.topicId,
    exerciseId: input.exercise.id,
    roundCount: input.roundCount,
    exercise: input.exercise,
    startedAt: input.startedAt,
    status: 'ready',
    attempts: [],
    hintsUsed: 0,
    currentScore: { ...EMPTY_SCORE },
    currentFeedback: null,
    result: null,
  }
}

export function startGame(session: GameSession): GameSession {
  assertSessionOpen(session)
  if (session.status !== 'ready') throw new Error(`Cannot start a session in ${session.status} state.`)
  return { ...session, status: 'playing', currentFeedback: null }
}

export function registerAttempt(
  session: GameSession,
  answer: PlayerAnswer,
  evaluation: AttemptEvaluation,
  attemptId: string,
  scoreBonus = 0,
): GameSession {
  assertSessionOpen(session)
  if (session.status !== 'playing' && session.status !== 'feedback') {
    throw new Error(`Cannot register an attempt in ${session.status} state.`)
  }
  if (String(answer.value).trim().length === 0) throw new Error('An answer value is required.')

  const attemptNumber = session.attempts.length + 1
  const kind = evaluation.isCorrect === null ? 'pending' : evaluation.isCorrect ? 'correct' : 'incorrect'
  const feedback: GameFeedback = {
    kind,
    message: evaluation.message ?? defaultFeedbackMessage(kind),
    ...(evaluation.isCorrect === false ? { expectedAnswer: session.exercise.expectedAnswer } : {}),
  }
  const scoreAwarded = evaluation.isCorrect
    ? Math.max(25, 100 - (attemptNumber - 1) * 20 - session.hintsUsed * 15) + Math.max(0, scoreBonus)
    : 0
  const attempt: GameAttempt = {
    attemptId,
    attemptNumber,
    answer,
    isCorrect: evaluation.isCorrect,
    feedback,
    scoreAwarded,
  }
  const attempts = [...session.attempts, attempt]

  return {
    ...session,
    status: 'feedback',
    attempts,
    currentScore: calculateScore(attempts),
    currentFeedback: feedback,
  }
}

export function useHint(session: GameSession, message?: string): GameSession {
  assertSessionOpen(session)
  if (session.status !== 'playing' && session.status !== 'feedback') {
    throw new Error(`Cannot use a hint in ${session.status} state.`)
  }

  return {
    ...session,
    status: 'feedback',
    hintsUsed: session.hintsUsed + 1,
    currentFeedback: {
      kind: 'hint',
      message: message ?? session.exercise.hints[session.hintsUsed] ?? 'No hay más pistas para este ejercicio.',
    },
  }
}

export function resumeGame(session: GameSession): GameSession {
  assertSessionOpen(session)
  if (session.status !== 'feedback') throw new Error(`Cannot resume a session in ${session.status} state.`)
  return { ...session, status: 'playing', currentFeedback: null }
}

export function calculateScore(attempts: readonly GameAttempt[]): GameScore {
  const evaluated = attempts.filter((attempt) => attempt.isCorrect !== null)
  const correctAnswers = evaluated.filter((attempt) => attempt.isCorrect === true).length
  const points = attempts.reduce((sum, attempt) => sum + attempt.scoreAwarded, 0)

  return {
    points,
    correctAnswers,
    evaluatedAttempts: evaluated.length,
    totalAttempts: attempts.length,
    accuracy: evaluated.length === 0 ? 0 : Math.round((correctAnswers / evaluated.length) * 100),
  }
}

export function calculateStars(score: GameScore, hintsUsed = 0): number {
  if (score.correctAnswers === 0 || score.evaluatedAttempts === 0) return 0
  if (score.accuracy >= 90 && hintsUsed === 0) return 3
  if (score.accuracy >= 65) return 2
  return 1
}

export function finishGame(
  session: GameSession,
  completionReason: CompletionReason,
  finishedAt: string,
): { session: GameSession; result: GameResult } {
  assertSessionOpen(session)
  const currentScore = calculateScore(session.attempts)
  const lastEvaluatedAttempt = [...session.attempts].reverse().find((attempt) => attempt.isCorrect !== null)
  const result: GameResult = {
    correct: lastEvaluatedAttempt?.isCorrect === true,
    attempts: session.attempts.length,
    accuracy: currentScore.accuracy,
    score: currentScore.points,
    xpEarned: 0,
    stars: calculateStars(currentScore, session.hintsUsed),
    hintsUsed: session.hintsUsed,
    duration: Math.max(0, Date.parse(finishedAt) - Date.parse(session.startedAt)),
    completionReason,
  }
  const status = completionReason === 'completed' || completionReason === 'time-expired' ? 'completed' : 'abandoned'
  const nextSession: GameSession = { ...session, status, currentScore, currentFeedback: null, result }

  return { session: nextSession, result }
}

function assertSessionOpen(session: GameSession): void {
  if (session.status === 'completed' || session.status === 'abandoned') {
    throw new Error(`Session ${session.sessionId} is already closed.`)
  }
}

function defaultFeedbackMessage(kind: GameFeedback['kind']): string {
  if (kind === 'correct') return 'Respuesta correcta.'
  if (kind === 'incorrect') return 'Respuesta incorrecta.'
  if (kind === 'hint') return 'Pista disponible.'
  return 'Respuesta registrada. Evaluación pendiente.'
}