import { Suspense, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { gameComponentRegistry } from '../games/core/gameComponentRegistry'
import { createGameSession } from '../games/core/gameEngine'
import type { GameExercise, GameSession } from '../games/core/engine.types'
import type { ExerciseDefinition, GameSessionDefinition } from '../types'
import { getExercisesForTopic } from '../exercises/data'
import { getGameById } from '../data/gameRegistry'
import { useLanguage } from '../i18n/LanguageProvider'

export function GamePage() {
  const { t } = useLanguage()
  const { gameId } = useParams()
  const [session] = useState<GameSession | null>(() => loadEngineSession(gameId))

  const game = getGameById(gameId ?? '')

  if (!session || !game || session.gameId !== gameId) {
    return <Navigate to="/mapa" replace />
  }

  const GameTemplate = gameComponentRegistry[game.id]
  if (!GameTemplate) return <Navigate to={`/tema/${session.topicId}`} replace />

  return (
    <Suspense fallback={<div className="game-template-loading" role="status">{t('common.loading')}</div>}>
      <GameTemplate game={game} session={session} />
    </Suspense>
  )
}

function loadEngineSession(gameId?: string): GameSession | null {
  if (!gameId) return null

  try {
    const rawSession = sessionStorage.getItem('teko-juegos-session')
    if (!rawSession) return null

    const stored = JSON.parse(rawSession) as Partial<GameSessionDefinition>
    if (
      stored.gameId !== gameId ||
      typeof stored.gameId !== 'string' ||
      typeof stored.topic !== 'string' ||
      typeof stored.exercise !== 'string' ||
      typeof stored.exerciseId !== 'string' ||
      !stored.difficulty ||
      !stored.source
    ) return null

    const legacySession = stored as GameSessionDefinition
    const bankExercise = getExercisesForTopic(legacySession.topic).find((item) => item.id === legacySession.exerciseId)
    const exerciseDefinition = isExerciseDefinition(stored.exerciseDefinition)
      ? stored.exerciseDefinition
      : bankExercise ?? createSessionExercise(legacySession)
    const exercise = toGameExercise(exerciseDefinition)
    const sessionId = typeof stored.sessionId === 'string' && stored.sessionId.trim()
      ? stored.sessionId
      : globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    if (stored.sessionId !== sessionId) {
      sessionStorage.setItem('teko-juegos-session', JSON.stringify({ ...stored, sessionId }))
    }

    return createGameSession({
      sessionId,
      gameId: legacySession.gameId,
      topicId: legacySession.topic,
      exercise,
      roundCount: legacySession.roundCount,
      startedAt: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

function createSessionExercise(session: GameSessionDefinition): ExerciseDefinition {
  return {
    id: session.exerciseId,
    topic: session.topic,
    statement: session.exercise,
    difficulty: session.difficulty,
    source: session.source,
    knownValues: {},
    unknown: '',
    answer: '',
    hints: [],
  }
}

function isExerciseDefinition(value: unknown): value is ExerciseDefinition {
  if (!value || typeof value !== 'object') return false
  const exercise = value as Partial<ExerciseDefinition>
  return typeof exercise.id === 'string'
    && typeof exercise.topic === 'string'
    && typeof exercise.statement === 'string'
    && typeof exercise.difficulty === 'string'
    && typeof exercise.source === 'string'
    && typeof exercise.unknown === 'string'
    && typeof exercise.answer === 'string'
    && Array.isArray(exercise.hints)
    && typeof exercise.knownValues === 'object'
    && exercise.knownValues !== null
}

function toGameExercise(exercise: ExerciseDefinition): GameExercise {
  return {
    id: exercise.id,
    topicId: exercise.topic,
    prompt: exercise.statement,
    difficulty: exercise.difficulty,
    source: exercise.source,
    knownValues: exercise.knownValues,
    unknown: exercise.unknown,
    expectedAnswer: exercise.answer,
    hints: exercise.hints,
  }
}
