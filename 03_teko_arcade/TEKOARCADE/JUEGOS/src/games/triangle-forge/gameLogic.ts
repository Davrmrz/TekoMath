import { evaluateAnswer } from '../../engine/math/answerEvaluator.ts'
import type { ExerciseDefinition } from '../../types'
import type { AttemptEvaluation, GameExercise } from '../core/engine.types'
import type { TriangleHighlights } from './game.types'

export function toTriangleForgeExercise(exercise: ExerciseDefinition): GameExercise {
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

export function createTriangleForgeExerciseSet(
  selectedExercise: GameExercise,
  bank: readonly ExerciseDefinition[],
  rounds = 3,
): GameExercise[] {
  const available = bank.map(toTriangleForgeExercise)
  const selected = available.find((exercise) => exercise.id === selectedExercise.id)
    ?? available[0]
    ?? selectedExercise
  const ordered = [selected, ...available.filter((exercise) => exercise.id !== selected.id)]

  return Array.from({ length: rounds }, (_, index) => ordered[index % ordered.length])
}

export function evaluateTriangleForgeAnswer(exercise: GameExercise, answer: string): AttemptEvaluation {
  const evaluation = evaluateAnswer(exercise.expectedAnswer, answer)

  return {
    isCorrect: evaluation.correct,
    message: evaluation.correct
      ? '¡Correcto! El cálculo coincide.'
      : 'No es correcto. Revisá los datos y probá otra vez.',
  }
}

export function getAnswerInputMode(exercise: GameExercise): 'decimal' | 'text' {
  return ['razon', 'funcion', 'expresion'].includes(normalize(exercise.unknown)) ? 'text' : 'decimal'
}

export function getTriangleHighlights(exercise: GameExercise): TriangleHighlights {
  const unknown = normalize(exercise.unknown)
  const topic = normalize(exercise.topicId)
  const angle = /angulo|angle|theta|θ/.test(unknown)

  if (/hipotenusa|hypotenuse/.test(unknown)) {
    return { opposite: false, adjacent: false, hypotenuse: true, angle }
  }
  if (/opuesto|opposite/.test(unknown)) {
    return { opposite: true, adjacent: false, hypotenuse: false, angle }
  }
  if (/adyacente|adjacent/.test(unknown)) {
    return { opposite: false, adjacent: true, hypotenuse: false, angle }
  }

  if (topic === 'sin' || topic === 'csc') {
    return { opposite: true, adjacent: false, hypotenuse: true, angle }
  }
  if (topic === 'cos' || topic === 'sec') {
    return { opposite: false, adjacent: true, hypotenuse: true, angle }
  }
  if (topic === 'tan' || topic === 'cot') {
    return { opposite: true, adjacent: true, hypotenuse: false, angle }
  }
  return { opposite: false, adjacent: false, hypotenuse: false, angle }
}

export function getKnownSideValue(exercise: GameExercise, side: keyof Omit<TriangleHighlights, 'angle'>): string | undefined {
  const aliases: Record<typeof side, string[]> = {
    opposite: ['opuesto', 'opposite'],
    adjacent: ['adyacente', 'adjacent'],
    hypotenuse: ['hipotenusa', 'hypotenuse'],
  }
  const entry = Object.entries(exercise.knownValues).find(([key]) =>
    aliases[side].some((alias) => normalize(key).includes(alias)),
  )

  return entry ? String(entry[1]) : undefined
}

export function getKnownAngleValue(exercise: GameExercise): string | undefined {
  const entry = Object.entries(exercise.knownValues).find(([key]) => /angulo|angle|theta|θ/.test(normalize(key)))
  return entry ? String(entry[1]) : undefined
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}