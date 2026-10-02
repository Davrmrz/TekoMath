import { evaluateAnswer } from '../../engine/math/answerEvaluator.ts'
import type { ExerciseDefinition } from '../../types'
import type { GameAttempt, GameExercise } from '../core/engine.types'

export interface RatioRushRoundConfig {
  topicId: string
  difficulty: ExerciseDefinition['difficulty']
  sessionId: string
  roundNumber: number
  selectedExerciseId?: string
}

export interface RatioRushRound {
  exercise: GameExercise
  choices: string[]
}

export interface RatioRushResultMetrics {
  correctAnswers: number
  incorrectAttempts: number
  totalAttempts: number
  accuracy: number
  bestCombo: number
}

export function createRatioRushRound(
  exercises: readonly ExerciseDefinition[],
  config: RatioRushRoundConfig,
): RatioRushRound | null {
  const topicExercises = exercises.filter((exercise) => exercise.topic === config.topicId)
  if (topicExercises.length === 0) return null

  const matchingDifficulty = topicExercises.filter((exercise) => exercise.difficulty === config.difficulty)
  const exercisePool = matchingDifficulty.length > 0 ? matchingDifficulty : topicExercises
  const selectedIndex = exercisePool.findIndex((exercise) => exercise.id === config.selectedExerciseId)
  const initialIndex = selectedIndex >= 0 ? selectedIndex : hashString(config.sessionId) % exercisePool.length
  const exerciseIndex = (initialIndex + Math.max(0, config.roundNumber - 1)) % exercisePool.length
  const exercise = exercisePool[exerciseIndex]
  const correctAnswer = exercise.answer.trim()
  const distinctAnswers = uniqueAnswers(topicExercises.map((item) => item.answer))
  const distractors = distinctAnswers.filter((answer) => normalize(answer) !== normalize(correctAnswer))
  const choiceSeed = `${config.sessionId}:${config.roundNumber}:choices`
  const choices = deterministicShuffle([correctAnswer, ...deterministicShuffle(distractors, choiceSeed).slice(0, 3)], choiceSeed)

  return {
    exercise: {
      id: exercise.id,
      topicId: exercise.topic,
      prompt: exercise.statement,
      difficulty: exercise.difficulty,
      source: exercise.source,
      knownValues: exercise.knownValues,
      unknown: exercise.unknown,
      expectedAnswer: correctAnswer,
      hints: exercise.hints,
    },
    choices,
  }
}

export function evaluateRatioRushAnswer(expected: string, received: string): boolean {
  const numericExpected = evaluateAnswer(expected, expected, { format: 'numeric' }).correct
  return evaluateAnswer(expected, received, { format: numericExpected ? 'numeric' : 'text' }).correct
}

export function calculateRatioRushComboBonus(combo: number): number {
  return Math.min(50, Math.max(0, Math.floor(combo) * 10))
}

export function calculateRatioRushResultMetrics(
  attempts: readonly Pick<GameAttempt, 'isCorrect'>[],
  bestCombo: number,
): RatioRushResultMetrics {
  const correctAnswers = attempts.filter((attempt) => attempt.isCorrect === true).length
  const incorrectAttempts = attempts.filter((attempt) => attempt.isCorrect === false).length
  const totalAttempts = attempts.length

  return {
    correctAnswers,
    incorrectAttempts,
    totalAttempts,
    accuracy: totalAttempts === 0 ? 0 : Math.round((correctAnswers / totalAttempts) * 100),
    bestCombo: Math.max(0, Math.floor(bestCombo)),
  }
}

export function getRemainingTimeMs(durationMs: number, startedAt: number, now: number): number {
  return Math.max(0, durationMs - Math.max(0, now - startedAt))
}

export function isRatioRushTimeExpired(remainingMs: number): boolean {
  return remainingMs <= 0
}

function uniqueAnswers(answers: readonly string[]): string[] {
  const seen = new Set<string>()
  return answers
    .map((answer) => answer.trim())
    .filter((answer) => {
      const key = normalize(answer)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function deterministicShuffle<T>(values: readonly T[], seed: string): T[] {
  const shuffled = [...values]
  let state = hashString(seed)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash >>> 0
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es')
}