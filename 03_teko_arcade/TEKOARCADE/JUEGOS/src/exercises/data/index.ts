import type { ExerciseDefinition } from '../../types'
import { cosExercises } from './cos.ts'
import { cotExercises } from './cot.ts'
import { cscExercises } from './csc.ts'
import { secExercises } from './sec.ts'
import { sinExercises } from './sin.ts'
import { tanExercises } from './tan.ts'
import { generateExercises, type GeneratableTopic } from '../../services/localExerciseGenerator.ts'
import type { Difficulty } from '../../types'

export const exerciseBank: Record<string, ExerciseDefinition[]> = {
  sin: sinExercises,
  cos: cosExercises,
  tan: tanExercises,
  csc: cscExercises,
  sec: secExercises,
  cot: cotExercises,
}

export function getExercisesForTopic(topic: string): ExerciseDefinition[] {
  const bankExercises = exerciseBank[topic]
  if (bankExercises?.length) return bankExercises
  if (topic === 'sin' || topic === 'cos' || topic === 'tan') {
    return generateExercises({
      topic: topic as GeneratableTopic,
      difficulty: 'easy' satisfies Difficulty,
      count: 5,
      seed: `offline-fallback:${topic}`,
    })
  }
  return []
}
