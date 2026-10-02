import { useState } from 'react'
import {
  finishGame,
  registerAttempt,
  resumeGame,
  startGame,
  useHint as applyHint,
} from './gameEngine'
import type { CompletionReason, GameSession } from './engine.types'
import type { GameTemplateState } from './game.types'

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestamp(): string {
  return new Date().toISOString()
}

export function useGameTemplate(initialSession: GameSession, rounds = 5): GameTemplateState {
  const [session, setSession] = useState(initialSession)
  const [round, setRound] = useState(1)
  const [isPaused, setIsPaused] = useState(false)

  const start = () => {
    setIsPaused(false)
    setSession((current) => startGame(current))
  }

  const togglePause = () => setIsPaused((paused) => !paused)

  const checkAnswer = (answerValue: string | number, ready: boolean) => {
    if (!ready || session.status !== 'playing' || isPaused) return
    setSession((current) => registerAttempt(current, { value: answerValue, submittedAt: timestamp() }, {
      isCorrect: null,
      message: 'Respuesta registrada. La evaluación matemática se conectará en la siguiente etapa.',
    }, localId('attempt')))
  }

  const showHint = () => {
    if (session.status !== 'playing' || isPaused) return
    setSession((current) => applyHint(current))
  }

  const continueRound = () => {
    if (round >= rounds) {
      setSession((current) => finishGame(current, 'completed', timestamp()).session)
      return
    }
    setRound((value) => value + 1)
    setSession((current) => resumeGame(current))
  }

  const abandon = (reason: CompletionReason = 'user-exit') => {
    if (session.status === 'completed' || session.status === 'abandoned') return
    setSession((current) => finishGame(current, reason, timestamp()).session)
  }

  return {
    phase: session.status,
    round,
    rounds,
    attempts: session.attempts.length,
    score: session.currentScore.points,
    isPaused,
    feedback: session.currentFeedback,
    result: session.result,
    start,
    togglePause,
    checkAnswer,
    showHint,
    continueRound,
    abandon,
  }
}