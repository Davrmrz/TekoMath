import type { Difficulty, ExerciseDefinition, OnlineExerciseProvider } from '../types'
import { getExercisesForTopic } from '../exercises/data/index.ts'
import { generateExercises } from './localExerciseGenerator.ts'
import { networkManager, type NetworkManager } from './networkManager.ts'

export interface ResolveExercisesOptions {
  difficulty?: Difficulty
  count?: number
  seed?: string | number
  onlineProvider?: OnlineExerciseProvider
  onlineTimeoutMs?: number
}

export interface ExerciseResolution {
  exercises: ExerciseDefinition[]
  source: 'local'
  onlineRefresh: Promise<ExerciseDefinition[]> | null
}

export interface ExerciseResolverDependencies {
  network?: NetworkManager
  getLocalExercises?: (topic: string) => ExerciseDefinition[]
  now?: () => number
}

export function resolveExercises(
  topic: string,
  options: ResolveExercisesOptions = {},
  dependencies: ExerciseResolverDependencies = {},
): ExerciseResolution {
  const difficulty = options.difficulty ?? 'easy'
  const count = options.count ?? 5
  const network = dependencies.network ?? networkManager
  const getLocal = dependencies.getLocalExercises ?? getExercisesForTopic
  const localExercises = getLocal(topic)
  const local = localExercises.filter((exercise) => exercise.difficulty === difficulty)
  const fallback = (local.length > 0 ? local : localExercises).slice(0, count)
  const localExercisesToUse = fallback.length > 0
    ? fallback
    : generateFallback(topic, difficulty, count, options.seed)

  if (!options.onlineProvider || network.getState() !== 'ONLINE_GOOD') {
    return { exercises: localExercisesToUse, source: 'local', onlineRefresh: null }
  }

  return {
    exercises: localExercisesToUse,
    source: 'local',
    onlineRefresh: refreshOnlineExercises(
      topic,
      difficulty,
      options.onlineProvider,
      network,
      options.onlineTimeoutMs ?? 1500,
      dependencies.now ?? (() => Date.now()),
      localExercisesToUse,
    ),
  }
}

async function refreshOnlineExercises(
  topic: string,
  difficulty: Difficulty,
  provider: OnlineExerciseProvider,
  network: NetworkManager,
  timeoutMs: number,
  now: () => number,
  fallback: ExerciseDefinition[],
): Promise<ExerciseDefinition[]> {
  const controller = new AbortController()
  const startedAt = now()
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error('Online exercise request timed out.'))
    }, timeoutMs)
  })

  try {
    const response = await Promise.race([
      provider.getExercises(topic),
      timeout,
    ])
    const topicExercises = response.filter((exercise) => exercise.topic === topic)
    const matchingDifficulty = topicExercises.filter((exercise) => exercise.difficulty === difficulty)
    const selected = matchingDifficulty.length > 0 ? matchingDifficulty : topicExercises
    if (selected.length === 0) throw new Error('Online provider returned no exercises for the requested topic.')

    network.markSuccess(Math.max(0, now() - startedAt))
    return selected
  } catch {
    network.markFailure()
    return fallback
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    controller.abort()
  }
}

function generateFallback(
  topic: string,
  difficulty: Difficulty,
  count: number,
  seed?: string | number,
): ExerciseDefinition[] {
  if (topic !== 'sin' && topic !== 'cos' && topic !== 'tan') return []
  return generateExercises({ topic, difficulty, count: Math.min(100, Math.max(1, count)), seed })
}