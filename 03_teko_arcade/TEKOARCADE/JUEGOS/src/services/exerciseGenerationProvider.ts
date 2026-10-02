import type { Difficulty, ExerciseDefinition } from '../types'
import { getExercisesForTopic } from '../exercises/data/index.ts'
import { generateExercise } from './localExerciseGenerator.ts'
import { networkManager, type NetworkManager } from './networkManager.ts'
import {
  validateAndNormalizeExercise,
  type ExerciseGenerationRequest,
} from './exerciseGenerationValidation.ts'

export type { ExerciseGenerationRequest } from './exerciseGenerationValidation.ts'

export interface ExerciseGenerationProvider {
  generateExercise(request: ExerciseGenerationRequest): Promise<ExerciseDefinition>
}

export interface RemoteAIProviderOptions {
  endpoint: string
  fallback?: ExerciseGenerationProvider
  network?: NetworkManager
  fetcher?: typeof fetch
  timeoutMs?: number
}

export type GeminiProviderOptions = Omit<RemoteAIProviderOptions, 'endpoint'>

export const geminiExerciseGenerationEnabled =
  import.meta.env?.VITE_ENABLE_GEMINI_EXERCISES === 'true'

export class LocalScriptProvider implements ExerciseGenerationProvider {
  private sequence = 0

  async generateExercise(request: ExerciseGenerationRequest): Promise<ExerciseDefinition> {
    assertRequest(request)
    if (isGeneratableTopic(request.topic)) {
      const exercise = generateExercise({
        topic: request.topic,
        difficulty: request.difficulty,
        seed: `local-provider:${request.gameId}:${request.topic}:${request.difficulty}:${this.sequence++}`,
      })
      return validateAndNormalizeExercise(exercise, request, 'teko')
    }

    const candidates = getExercisesForTopic(request.topic)
      .filter((candidate) => candidate.difficulty === request.difficulty)
    for (const candidate of candidates) {
      try {
        return validateAndNormalizeExercise(candidate, request, 'teko')
      } catch {
        // Ignore local bank items that cannot be verified by the common validator.
      }
    }
    throw new Error(`No verifiable local exercise is available for topic ${request.topic}.`)
  }
}

export class RemoteAIProvider implements ExerciseGenerationProvider {
  private readonly endpoint: string
  private readonly fallback: ExerciseGenerationProvider
  private readonly network: NetworkManager
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: RemoteAIProviderOptions) {
    this.endpoint = options.endpoint.trim()
    if (!this.endpoint) throw new Error('Remote exercise endpoint is required.')
    this.fallback = options.fallback ?? new LocalScriptProvider()
    this.network = options.network ?? networkManager
    this.fetcher = options.fetcher ?? fetch
    this.timeoutMs = options.timeoutMs ?? 6000
  }

  async generateExercise(request: ExerciseGenerationRequest): Promise<ExerciseDefinition> {
    assertRequest(request)
    if (this.network.getState() === 'OFFLINE') return this.fallback.generateExercise(request)

    const controller = new AbortController()
    const startedAt = Date.now()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ request }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Remote exercise request failed with status ${response.status}.`)

      const rawResponse: unknown = await response.json()
      const exercise = validateAndNormalizeExercise(rawResponse, request, 'ai')
      this.network.markSuccess(Math.max(0, Date.now() - startedAt))
      return exercise
    } catch {
      this.network.markFailure()
      return this.fallback.generateExercise(request)
    } finally {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }
}

function assertRequest(request: ExerciseGenerationRequest): asserts request is ExerciseGenerationRequest & {
  difficulty: Difficulty
} {
  if (!request || typeof request !== 'object'
    || typeof request.topic !== 'string' || !request.topic.trim()
    || typeof request.gameId !== 'string' || !request.gameId.trim()
    || !(['easy', 'medium', 'hard'] as string[]).includes(request.difficulty)) {
    throw new Error('Exercise generation request is invalid.')
  }
}

function isGeneratableTopic(topic: string): topic is 'sin' | 'cos' | 'tan' {
  return topic === 'sin' || topic === 'cos' || topic === 'tan'
}

export class GeminiProvider extends RemoteAIProvider {
  constructor(options: GeminiProviderOptions = {}) {
    super({ endpoint: '/api/generate-exercise', timeoutMs: 6000, ...options })
  }
}

export function createOptionalExerciseGenerationProvider(): ExerciseGenerationProvider {
  return geminiExerciseGenerationEnabled ? new GeminiProvider() : new LocalScriptProvider()
}