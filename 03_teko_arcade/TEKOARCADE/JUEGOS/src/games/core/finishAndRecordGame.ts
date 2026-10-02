import { progressService } from '../../services/progressService'
import type { CompletionReason, GameResult, GameSession } from './engine.types'
import { finishGame } from './gameEngine'

type GameResultDetails = Partial<Pick<GameResult, 'correctAnswers' | 'correctPairs' | 'incorrectAttempts' | 'totalAttempts' | 'bestCombo'>>

export function finishAndRecordGame(
  session: GameSession,
  reason: CompletionReason,
  details: GameResultDetails = {},
): GameSession {
  const finishedAt = new Date().toISOString()
  const finished = finishGame(session, reason, finishedAt)
  const xpEarned = reason === 'completed' || reason === 'time-expired'
    ? Math.floor(finished.result.score / 10)
    : 0
  const result = { ...finished.result, xpEarned, ...details }
  const finalSession = { ...finished.session, result }

  if (session.status !== 'ready') {
    progressService.recordFinishedGame({
      sessionId: session.sessionId,
      gameId: session.gameId,
      topicId: session.topicId,
      timestamp: finishedAt,
      score: result.score,
      accuracy: result.accuracy,
      xp: result.xpEarned,
      stars: result.stars,
      correctAnswers: finished.session.currentScore.correctAnswers,
      attempts: result.attempts,
      bestCombo: result.bestCombo ?? 0,
    })
  }

  return finalSession
}