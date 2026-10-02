import { evaluateAnswer } from '../../engine/math/answerEvaluator.ts'
import type { Difficulty, ExerciseDefinition } from '../../types'
import type { GameAttempt, GameExercise } from '../core/engine.types'

export type VectorComponent = 'catetoOpuesto' | 'catetoAdyacente' | 'hipotenusa'

export interface VectorChallenge {
  exercise: GameExercise
  angleDegrees: number
  knownComponent: VectorComponent
  knownValue: number
  targetComponent: VectorComponent
  expectedValue: number
  horizontalComponent: number
  verticalComponent: number
}

export interface VectorEvaluation {
  correct: boolean
  travelRatio: number
}

export interface VectorResultMetrics {
  correctAnswers: number
  incorrectAttempts: number
  totalAttempts: number
  accuracy: number
  bestCombo: number
}

const componentLabels: Record<VectorComponent, string> = {
  catetoOpuesto: 'cateto opuesto',
  catetoAdyacente: 'cateto adyacente',
  hipotenusa: 'hipotenusa',
}

export function getVectorComponentLabel(component: VectorComponent): string {
  return componentLabels[component]
}

export function createVectorLaunchChallenges(
  exercises: readonly ExerciseDefinition[],
  topicId: string,
  difficulty: Difficulty,
  sessionId: string,
  roundCount: number,
  selectedExerciseId?: string,
): VectorChallenge[] {
  const topicExercises = exercises.filter((exercise) => exercise.topic === topicId)
  const allChallenges = topicExercises.flatMap((exercise) => {
    const challenge = createVectorChallenge(exercise)
    return challenge ? [challenge] : []
  })
  const matchingDifficulty = allChallenges.filter((challenge) => challenge.exercise.difficulty === difficulty)
  const pool = matchingDifficulty.length > 0 ? matchingDifficulty : allChallenges
  if (pool.length === 0 || roundCount <= 0) return []

  const selectedIndex = pool.findIndex((challenge) => challenge.exercise.id === selectedExerciseId)
  const offset = selectedIndex >= 0 ? selectedIndex : hashString(sessionId) % pool.length
  return Array.from({ length: roundCount }, (_, index) => pool[(offset + index) % pool.length])
}

export function evaluateVectorAnswer(challenge: VectorChallenge, answer: string): VectorEvaluation {
  const evaluation = evaluateAnswer(challenge.exercise.expectedAnswer, answer, { format: 'numeric' })
  const expected = challenge.expectedValue
  const received = evaluation.normalizedReceived === null ? expected * 0.4 : Number(evaluation.normalizedReceived)
  const ratio = Number.isFinite(received) && expected > 0 ? received / expected : 0.4

  return {
    correct: evaluation.correct,
    travelRatio: Math.min(1.4, Math.max(0.15, ratio)),
  }
}

export function calculateVectorComboBonus(combo: number): number {
  return Math.min(40, Math.max(0, Math.floor(combo) * 10))
}

export function calculateVectorResultMetrics(
  attempts: readonly Pick<GameAttempt, 'isCorrect'>[],
  bestCombo: number,
): VectorResultMetrics {
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

function createVectorChallenge(exercise: ExerciseDefinition): VectorChallenge | null {
  const targetComponent = parseComponent(exercise.unknown)
  const expectedAnswer = evaluateAnswer(exercise.answer, exercise.answer, { format: 'numeric' })
  const expectedValue = expectedAnswer.normalizedExpected === null ? Number.NaN : Number(expectedAnswer.normalizedExpected)
  if (!targetComponent || !Number.isFinite(expectedValue) || expectedValue <= 0) return null

  const knownSides = new Map<VectorComponent, number>()
  for (const [key, value] of Object.entries(exercise.knownValues)) {
    const component = parseComponent(key)
    const numericValue = typeof value === 'number' ? value : Number(value)
    if (component && Number.isFinite(numericValue) && numericValue > 0) knownSides.set(component, numericValue)
  }

  const angle = resolveAngle(exercise, knownSides)
  const knownComponent = chooseKnownComponent(targetComponent, knownSides)
  const knownValue = knownComponent ? knownSides.get(knownComponent) : undefined
  if (angle === null || !knownComponent || knownValue === undefined) return null

  const dimensions = resolveComponents(targetComponent, expectedValue, knownComponent, knownValue)
  if (!dimensions || !Number.isFinite(dimensions.horizontal) || !Number.isFinite(dimensions.vertical)) return null

  return {
    exercise: {
      id: exercise.id,
      topicId: exercise.topic,
      prompt: exercise.statement,
      difficulty: exercise.difficulty,
      source: exercise.source,
      knownValues: exercise.knownValues,
      unknown: exercise.unknown,
      expectedAnswer: exercise.answer,
      hints: exercise.hints,
    },
    angleDegrees: angle,
    knownComponent,
    knownValue,
    targetComponent,
    expectedValue,
    horizontalComponent: dimensions.horizontal,
    verticalComponent: dimensions.vertical,
  }
}

function resolveAngle(exercise: ExerciseDefinition, sides: ReadonlyMap<VectorComponent, number>): number | null {
  const angleEntry = Object.entries(exercise.knownValues).find(([key]) => /angulo/i.test(key))
  const explicitAngle = angleEntry ? Number(angleEntry[1]) : Number.NaN
  if (Number.isFinite(explicitAngle) && explicitAngle > 0 && explicitAngle < 90) return explicitAngle

  const ratioEntry = Object.entries(exercise.knownValues).find(([key]) => /sin|sen|cos|tan/i.test(key))
  const topic = ratioEntry ? functionName(ratioEntry[0]) : exercise.topic
  const ratioValue = ratioEntry
    ? Number(ratioEntry[1])
    : deriveRatio(exercise.topic, sides)
  if (!topic || !Number.isFinite(ratioValue) || ratioValue <= 0) return null

  const radians = topic === 'sin'
    ? Math.asin(ratioValue)
    : topic === 'cos'
      ? Math.acos(ratioValue)
      : Math.atan(ratioValue)
  const degrees = radians * 180 / Math.PI
  return Number.isFinite(degrees) && degrees > 0 && degrees < 90 ? degrees : null
}

function chooseKnownComponent(target: VectorComponent, sides: ReadonlyMap<VectorComponent, number>): VectorComponent | null {
  const preferred: Record<VectorComponent, VectorComponent[]> = {
    hipotenusa: ['catetoOpuesto', 'catetoAdyacente'],
    catetoOpuesto: ['catetoAdyacente', 'hipotenusa'],
    catetoAdyacente: ['catetoOpuesto', 'hipotenusa'],
  }
  return preferred[target].find((component) => sides.has(component)) ?? null
}

function resolveComponents(
  target: VectorComponent,
  expected: number,
  known: VectorComponent,
  knownValue: number,
): { horizontal: number; vertical: number } | null {
  if (target === 'hipotenusa') {
    if (known === 'catetoOpuesto' && expected > knownValue) {
      return { horizontal: Math.sqrt(expected ** 2 - knownValue ** 2), vertical: knownValue }
    }
    if (known === 'catetoAdyacente' && expected > knownValue) {
      return { horizontal: knownValue, vertical: Math.sqrt(expected ** 2 - knownValue ** 2) }
    }
  }
  if (target === 'catetoOpuesto') {
    if (known === 'catetoAdyacente') return { horizontal: knownValue, vertical: expected }
    if (known === 'hipotenusa' && knownValue > expected) {
      return { horizontal: Math.sqrt(knownValue ** 2 - expected ** 2), vertical: expected }
    }
  }
  if (target === 'catetoAdyacente') {
    if (known === 'catetoOpuesto') return { horizontal: expected, vertical: knownValue }
    if (known === 'hipotenusa' && knownValue > expected) {
      return { horizontal: expected, vertical: Math.sqrt(knownValue ** 2 - expected ** 2) }
    }
  }
  return null
}

function deriveRatio(topicId: string, sides: ReadonlyMap<VectorComponent, number>): number {
  if (topicId === 'sin') {
    const opposite = sides.get('catetoOpuesto')
    const hypotenuse = sides.get('hipotenusa')
    return opposite && hypotenuse ? opposite / hypotenuse : Number.NaN
  }
  if (topicId === 'cos') {
    const adjacent = sides.get('catetoAdyacente')
    const hypotenuse = sides.get('hipotenusa')
    return adjacent && hypotenuse ? adjacent / hypotenuse : Number.NaN
  }
  if (topicId === 'tan') {
    const opposite = sides.get('catetoOpuesto')
    const adjacent = sides.get('catetoAdyacente')
    return opposite && adjacent ? opposite / adjacent : Number.NaN
  }
  return Number.NaN
}

function functionName(key: string): 'sin' | 'cos' | 'tan' | null {
  const normalized = key.toLocaleLowerCase('es')
  if (/sin|sen/.test(normalized)) return 'sin'
  if (/cos/.test(normalized)) return 'cos'
  if (/tan/.test(normalized)) return 'tan'
  return null
}

function parseComponent(value: string): VectorComponent | null {
  const normalized = value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/hipotenusa/.test(normalized)) return 'hipotenusa'
  if (/opuesto/.test(normalized)) return 'catetoOpuesto'
  if (/adyacente/.test(normalized)) return 'catetoAdyacente'
  return null
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return hash >>> 0
}