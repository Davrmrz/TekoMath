import { evaluateAnswer } from '../engine/math/answerEvaluator.ts'
import type { Difficulty, ExerciseDefinition } from '../types'

export interface ExerciseGenerationRequest {
  topic: string
  difficulty: Difficulty
  gameId: string
  context?: unknown
}

const safeTextLimits = {
  id: 100,
  statement: 500,
  unknown: 100,
  answer: 120,
  solution: 1600,
  hint: 300,
} as const

export function validateAndNormalizeExercise(
  value: unknown,
  request: ExerciseGenerationRequest,
  source: ExerciseDefinition['source'],
): ExerciseDefinition {
  if (!isRecord(value)) throw new Error('Exercise response must be an object.')
  if (value.topic !== request.topic || value.difficulty !== request.difficulty) {
    throw new Error('Exercise response does not match the requested topic and difficulty.')
  }

  const id = normalizeSafeText(value.id, safeTextLimits.id, 'id')
  const statement = normalizeSafeText(value.statement, safeTextLimits.statement, 'statement')
  const unknown = normalizeSafeText(value.unknown, safeTextLimits.unknown, 'unknown')
  const answer = normalizeSafeText(value.answer, safeTextLimits.answer, 'answer')
  const solution = value.solution === undefined
    ? undefined
    : normalizeSafeText(value.solution, safeTextLimits.solution, 'solution')
  if (!Array.isArray(value.hints) || value.hints.length < 1 || value.hints.length > 8) {
    throw new Error('Exercise response must contain between one and eight hints.')
  }

  const hints = value.hints.map((hint) => normalizeSafeText(hint, safeTextLimits.hint, 'hint'))
  const knownValues = normalizeKnownValues(value.knownValues)
  const metadata = normalizeMetadata(value.metadata)
  const normalized: ExerciseDefinition = {
    id,
    topic: request.topic,
    statement,
    difficulty: request.difficulty,
    source,
    knownValues,
    unknown,
    answer,
    ...(solution ? { solution } : {}),
    hints,
    ...(metadata ? { metadata } : {}),
  }

  validateExerciseMathematics(normalized)
  return normalized
}

function validateExerciseMathematics(exercise: ExerciseDefinition): void {
  const sides = readTriangleSides(exercise.knownValues)
  validateProvidedMathFacts(sides, exercise.knownValues, exercise.id)
  validateTriangleMetadata(exercise)

  const targetFunction = findFunction(exercise.unknown)
  if (targetFunction) {
    const expected = calculateFunction(targetFunction, sides, exercise.knownValues)
    assertAnswerMatches(exercise.answer, expected, exercise.id)
    return
  }

  const targetSide = findSide(exercise.unknown)
  if (targetSide) {
    const expected = calculateSide(targetSide, sides, exercise.knownValues)
    assertAnswerMatches(exercise.answer, expected, exercise.id)
    return
  }

  const unknown = canonicalize(exercise.unknown)
  if (unknown === 'razon' || unknown === 'funcion') {
    const expected = inferFunctionName(exercise, sides)
    if (!expected || canonicalize(exercise.answer) !== expected) {
      throw new Error(`Exercise ${exercise.id} has an unverifiable function answer.`)
    }
    return
  }

  throw new Error(`Exercise ${exercise.id} has no supported mathematical target.`)
}

function calculateFunction(
  target: string,
  sides: Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>>,
  knownValues: Record<string, number | string>,
): number {
  const { opposite, adjacent, hypotenuse } = sides
  const fromSides: Record<string, number | undefined> = {
    sin: opposite !== undefined && hypotenuse ? opposite / hypotenuse : undefined,
    cos: adjacent !== undefined && hypotenuse ? adjacent / hypotenuse : undefined,
    tan: opposite !== undefined && adjacent ? opposite / adjacent : undefined,
    csc: opposite !== undefined && hypotenuse ? hypotenuse / opposite : undefined,
    sec: adjacent !== undefined && hypotenuse ? hypotenuse / adjacent : undefined,
    cot: opposite !== undefined && adjacent ? adjacent / opposite : undefined,
  }
  if (Number.isFinite(fromSides[target])) return fromSides[target] as number

  const values = readFunctionValues(knownValues)
  const reciprocal: Record<string, string> = { sin: 'csc', csc: 'sin', cos: 'sec', sec: 'cos', tan: 'cot', cot: 'tan' }
  const direct = values[target]
  if (direct !== undefined) return direct
  const inverse = values[reciprocal[target]]
  if (inverse !== undefined && inverse !== 0) return 1 / inverse
  throw new Error(`Exercise target ${target} cannot be calculated from known values.`)
}

function calculateSide(
  target: 'opposite' | 'adjacent' | 'hypotenuse',
  sides: Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>>,
  knownValues: Record<string, number | string>,
): number {
  const values = readFunctionValues(knownValues)
  const ratios = {
    sin: values.sin ?? values.sen,
    cos: values.cos,
    tan: values.tan,
  }
  const { opposite, adjacent, hypotenuse } = sides
  const calculations: Record<typeof target, number | undefined> = {
    opposite: ratios.sin !== undefined && hypotenuse !== undefined
      ? ratios.sin * hypotenuse
      : ratios.tan !== undefined && adjacent !== undefined
        ? ratios.tan * adjacent
        : adjacent !== undefined && hypotenuse !== undefined && hypotenuse > adjacent
          ? Math.sqrt(hypotenuse ** 2 - adjacent ** 2)
          : undefined,
    adjacent: ratios.cos !== undefined && hypotenuse !== undefined
      ? ratios.cos * hypotenuse
      : ratios.tan !== undefined && opposite !== undefined && ratios.tan !== 0
        ? opposite / ratios.tan
        : opposite !== undefined && hypotenuse !== undefined && hypotenuse > opposite
          ? Math.sqrt(hypotenuse ** 2 - opposite ** 2)
          : undefined,
    hypotenuse: ratios.sin !== undefined && opposite !== undefined && ratios.sin !== 0
      ? opposite / ratios.sin
      : ratios.cos !== undefined && adjacent !== undefined && ratios.cos !== 0
        ? adjacent / ratios.cos
        : opposite !== undefined && adjacent !== undefined
          ? Math.sqrt(opposite ** 2 + adjacent ** 2)
          : undefined,
  }
  const expected = calculations[target]
  if (expected === undefined || !Number.isFinite(expected)) {
    throw new Error(`Exercise side ${target} cannot be calculated from known values.`)
  }
  return expected
}

function inferFunctionName(
  exercise: ExerciseDefinition,
  sides: Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>>,
): string | undefined {
  const { opposite, adjacent, hypotenuse } = sides
  const normalizedTopic = canonicalize(exercise.topic)
  if (canonicalize(exercise.unknown) === 'funcion') {
    const reciprocal: Record<string, string> = { sin: 'csc', sen: 'csc', cos: 'sec', tan: 'cot' }
    return reciprocal[normalizedTopic]
  }
  if (opposite !== undefined && hypotenuse !== undefined) return 'sin'
  if (adjacent !== undefined && hypotenuse !== undefined) return 'cos'
  if (opposite !== undefined && adjacent !== undefined) return 'tan'
  return undefined
}

function validateTriangleMetadata(exercise: ExerciseDefinition): void {
  const metadata = exercise.metadata
  if (!metadata || !('triangleOpposite' in metadata)) return
  const opposite = Number(metadata.triangleOpposite)
  const adjacent = Number(metadata.triangleAdjacent)
  const hypotenuse = Number(metadata.triangleHypotenuse)
  if (![opposite, adjacent, hypotenuse].every((side) => Number.isFinite(side) && side > 0)) {
    throw new Error(`Exercise ${exercise.id} has invalid triangle metadata.`)
  }
  if (Math.abs(opposite ** 2 + adjacent ** 2 - hypotenuse ** 2) > 1e-8) {
    throw new Error(`Exercise ${exercise.id} has an incoherent right triangle.`)
  }
  const knownSides = readTriangleSides(exercise.knownValues)
  if ((knownSides.opposite !== undefined && knownSides.opposite !== opposite)
    || (knownSides.adjacent !== undefined && knownSides.adjacent !== adjacent)
    || (knownSides.hypotenuse !== undefined && knownSides.hypotenuse !== hypotenuse)) {
    throw new Error(`Exercise ${exercise.id} has conflicting triangle metadata.`)
  }
  if (metadata.ratioValue !== undefined) {
    const ratio = exercise.topic === 'sin' || exercise.topic === 'csc'
      ? opposite / hypotenuse
      : exercise.topic === 'cos' || exercise.topic === 'sec'
        ? adjacent / hypotenuse
        : opposite / adjacent
    const expected = exercise.topic === 'csc' || exercise.topic === 'sec' || exercise.topic === 'cot'
      ? 1 / ratio
      : ratio
    if (!Number.isFinite(Number(metadata.ratioValue)) || Math.abs(Number(metadata.ratioValue) - expected) > 1e-8) {
      throw new Error(`Exercise ${exercise.id} has inconsistent ratio metadata.`)
    }
  }
}

function validateProvidedMathFacts(
  sides: Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>>,
  knownValues: Record<string, number | string>,
  id: string,
): void {
  const { opposite, adjacent, hypotenuse } = sides
  for (const side of Object.values(sides)) {
    if (side !== undefined && side <= 0) throw new Error(`Exercise ${id} has a non-positive side length.`)
  }
  if ((opposite !== undefined && hypotenuse !== undefined && hypotenuse <= opposite)
    || (adjacent !== undefined && hypotenuse !== undefined && hypotenuse <= adjacent)) {
    throw new Error(`Exercise ${id} has a side longer than its hypotenuse.`)
  }
  if (opposite !== undefined && adjacent !== undefined && hypotenuse !== undefined
    && !approximatelyEqual(opposite ** 2 + adjacent ** 2, hypotenuse ** 2)) {
    throw new Error(`Exercise ${id} has inconsistent known triangle sides.`)
  }

  const functionValues = readFunctionValues(knownValues)
  const domainChecks: Record<string, (value: number) => boolean> = {
    sin: (value) => value > 0 && value <= 1,
    sen: (value) => value > 0 && value <= 1,
    cos: (value) => value > 0 && value <= 1,
    csc: (value) => value >= 1,
    sec: (value) => value >= 1,
    tan: (value) => value > 0,
    cot: (value) => value > 0,
  }
  for (const [name, value] of Object.entries(functionValues)) {
    if (!domainChecks[name]?.(value)) throw new Error(`Exercise ${id} has an invalid ${name} value.`)
  }

  const computedFromSides: Record<string, number | undefined> = {
    sin: opposite !== undefined && hypotenuse !== undefined ? opposite / hypotenuse : undefined,
    sen: opposite !== undefined && hypotenuse !== undefined ? opposite / hypotenuse : undefined,
    cos: adjacent !== undefined && hypotenuse !== undefined ? adjacent / hypotenuse : undefined,
    tan: opposite !== undefined && adjacent !== undefined ? opposite / adjacent : undefined,
    csc: opposite !== undefined && hypotenuse !== undefined ? hypotenuse / opposite : undefined,
    sec: adjacent !== undefined && hypotenuse !== undefined ? hypotenuse / adjacent : undefined,
    cot: opposite !== undefined && adjacent !== undefined ? adjacent / opposite : undefined,
  }
  for (const [name, value] of Object.entries(functionValues)) {
    const fromSides = computedFromSides[name]
    if (fromSides !== undefined && !approximatelyEqual(value, fromSides)) {
      throw new Error(`Exercise ${id} has conflicting known sides and ratios.`)
    }
  }

  for (const [first, second] of [['sin', 'csc'], ['sen', 'csc'], ['cos', 'sec'], ['tan', 'cot']]) {
    if (functionValues[first] !== undefined && functionValues[second] !== undefined
      && !approximatelyEqual(functionValues[first] * functionValues[second], 1)) {
      throw new Error(`Exercise ${id} has conflicting reciprocal ratios.`)
    }
  }
}

function assertAnswerMatches(answer: string, expected: number, id: string): void {
  if (!Number.isFinite(expected) || expected <= 0) throw new Error(`Exercise ${id} has an invalid mathematical result.`)
  const answerIsValid = evaluateAnswer(expected, answer, { format: 'numeric', absoluteTolerance: 1e-7 }).correct
  if (!answerIsValid) throw new Error(`Exercise ${id} has a mathematically incorrect answer.`)
}

function approximatelyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) <= 1e-8 * Math.max(1, Math.abs(first), Math.abs(second))
}

function readTriangleSides(
  knownValues: Record<string, number | string>,
): Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>> {
  const result: Partial<Record<'opposite' | 'adjacent' | 'hypotenuse', number>> = {}
  for (const [key, value] of Object.entries(knownValues)) {
    const side = findSide(key)
    if (side) result[side] = parseNumericValue(value)
  }
  return result
}

function readFunctionValues(knownValues: Record<string, number | string>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(knownValues)) {
    const functionName = findFunction(key)
    if (functionName) result[functionName] = parseNumericValue(value)
    if (canonicalize(key).startsWith('sen')) result.sen = parseNumericValue(value)
  }
  return result
}

function findSide(value: string): 'opposite' | 'adjacent' | 'hypotenuse' | undefined {
  const key = canonicalize(value)
  if (key.includes('opuesto') || key.includes('opposite')) return 'opposite'
  if (key.includes('adyacente') || key.includes('adjacent')) return 'adjacent'
  if (key.includes('hipotenusa') || key.includes('hypotenuse')) return 'hypotenuse'
  return undefined
}

function findFunction(value: string): string | undefined {
  const key = canonicalize(value).replace(/[^a-z]/g, '')
  const match = key.match(/csc|cosec|sec|cot|sin|sen|cos|tan/)
  if (!match) return undefined
  if (match[0] === 'cosec') return 'csc'
  if (match[0] === 'sen') return 'sin'
  return match[0]
}

function normalizeKnownValues(value: unknown): Record<string, number | string> {
  if (!isRecord(value) || Object.keys(value).length > 12) throw new Error('Exercise knownValues schema is invalid.')
  const normalized: Record<string, number | string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!/^[\p{L}\p{N}_ -]{1,40}$/u.test(key)) throw new Error('Exercise knownValues contains an invalid key.')
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) throw new Error('Exercise knownValues contains a non-finite number.')
      normalized[key.normalize('NFC').trim()] = entry
    } else {
      normalized[key.normalize('NFC').trim()] = normalizeSafeText(entry, 120, 'known value')
    }
  }
  return normalized
}

function normalizeMetadata(value: unknown): ExerciseDefinition['metadata'] {
  if (value === undefined) return undefined
  if (!isRecord(value) || Object.keys(value).length > 24) throw new Error('Exercise metadata schema is invalid.')
  const metadata: NonNullable<ExerciseDefinition['metadata']> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!/^[\w-]{1,40}$/.test(key)) throw new Error('Exercise metadata contains an invalid key.')
    if (typeof entry === 'string') metadata[key] = normalizeSafeText(entry, 300, 'metadata')
    else if (typeof entry === 'number' && Number.isFinite(entry)) metadata[key] = entry
    else if (typeof entry === 'boolean' || entry === undefined) metadata[key] = entry
    else throw new Error('Exercise metadata contains an invalid value.')
  }
  return metadata
}

function normalizeSafeText(value: unknown, maxLength: number, field: string): string {
  if (typeof value !== 'string') throw new Error(`Exercise ${field} must be text.`)
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!normalized || normalized.length > maxLength) throw new Error(`Exercise ${field} has an invalid length.`)
  const hasUnsafeControlCharacter = [...normalized].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127
  })
  if (hasUnsafeControlCharacter
    || /<\/?[a-z][^>]*>/i.test(normalized)
    || /\b(?:javascript|data):/i.test(normalized)
    || /https?:\/\//i.test(normalized)) {
    throw new Error(`Exercise ${field} contains unsafe content.`)
  }
  return normalized
}

function parseNumericValue(value: string | number): number {
  const source = String(value).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '')
  const fraction = source.match(/^([+-]?\d+)\/([+-]?\d+)$/)
  if (fraction) {
    const numerator = Number(fraction[1])
    const denominator = Number(fraction[2])
    if (denominator === 0) throw new Error('Exercise contains a zero denominator.')
    return numerator / denominator
  }
  const decimal = source.replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(decimal)) throw new Error('Exercise contains a non-numeric known value.')
  const parsed = Number(decimal)
  if (!Number.isFinite(parsed)) throw new Error('Exercise contains a non-finite known value.')
  return parsed
}

function canonicalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}