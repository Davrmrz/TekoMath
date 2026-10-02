import { evaluateAnswer } from '../engine/math/answerEvaluator.ts'
import type { Difficulty, ExerciseDefinition, OfflineExerciseProvider } from '../types'

export type GeneratableTopic = 'sin' | 'cos' | 'tan'
export type ExerciseSeed = string | number

export interface GenerateExerciseOptions {
  topic: GeneratableTopic
  difficulty: Difficulty
  seed?: ExerciseSeed
}

export interface GenerateExercisesOptions extends GenerateExerciseOptions {
  count: number
}

interface TriangleTriple {
  opposite: number
  adjacent: number
  hypotenuse: number
}

interface RatioDefinition {
  numerator: keyof TriangleTriple
  denominator: keyof TriangleTriple
  symbol: string
  spanishName: string
  numeratorLabel: string
  denominatorLabel: string
}

interface ExerciseDraft {
  statement: string
  knownValues: Record<string, number | string>
  unknown: string
  answer: string
  solution: string
  hints: string[]
  ratioValue: number
  triangle: TriangleTriple
}

const triples: TriangleTriple[] = [
  { opposite: 3, adjacent: 4, hypotenuse: 5 },
  { opposite: 5, adjacent: 12, hypotenuse: 13 },
  { opposite: 8, adjacent: 15, hypotenuse: 17 },
  { opposite: 7, adjacent: 24, hypotenuse: 25 },
  { opposite: 20, adjacent: 21, hypotenuse: 29 },
]

const ratioDefinitions: Record<GeneratableTopic, RatioDefinition> = {
  sin: {
    numerator: 'opposite',
    denominator: 'hypotenuse',
    symbol: 'sin',
    spanishName: 'seno',
    numeratorLabel: 'cateto opuesto',
    denominatorLabel: 'hipotenusa',
  },
  cos: {
    numerator: 'adjacent',
    denominator: 'hypotenuse',
    symbol: 'cos',
    spanishName: 'coseno',
    numeratorLabel: 'cateto adyacente',
    denominatorLabel: 'hipotenusa',
  },
  tan: {
    numerator: 'opposite',
    denominator: 'adjacent',
    symbol: 'tan',
    spanishName: 'tangente',
    numeratorLabel: 'cateto opuesto',
    denominatorLabel: 'cateto adyacente',
  },
}

let unseededSequence = 0

export function generateExercise(options: GenerateExerciseOptions): ExerciseDefinition {
  assertOptions(options)
  const seed = options.seed ?? `local-${Date.now()}-${unseededSequence++}`
  const random = createSeededRandom(seed)
  const ratio = ratioDefinitions[options.topic]
  const triple = triples[random.integer(triples.length)]
  const scale = options.difficulty === 'easy' ? 1 : random.integer(2, 5)
  const scaledTriangle = scaleTriangle(triple, scale)
  const ratioValue = scaledTriangle[ratio.numerator] / scaledTriangle[ratio.denominator]
  const draft = options.difficulty === 'easy'
    ? createRatioDraft(ratio, scaledTriangle, ratioValue)
    : options.difficulty === 'medium'
      ? createSideSolveDraft(ratio, scaledTriangle, ratioValue)
      : createScaledSideDraft(options.topic, ratio, scaledTriangle, random)
  const id = `generated-${options.topic}-${options.difficulty}-${hashSeed(String(seed)).toString(36)}`
  const exercise: ExerciseDefinition = {
    id,
    topic: options.topic,
    statement: draft.statement,
    difficulty: options.difficulty,
    source: 'teko',
    knownValues: draft.knownValues,
    unknown: draft.unknown,
    answer: draft.answer,
    solution: draft.solution,
    hints: draft.hints,
    metadata: {
      generator: 'local-rules-v1',
      seed: String(seed),
      template: options.difficulty,
      solution: draft.solution,
      numericAnswer: answerToNumber(draft.answer),
      ratio: options.topic,
      ratioValue: Number(draft.ratioValue.toFixed(12)),
      triangleOpposite: draft.triangle.opposite,
      triangleAdjacent: draft.triangle.adjacent,
      triangleHypotenuse: draft.triangle.hypotenuse,
    },
  }

  assertValidGeneratedExercise(exercise)
  return exercise
}

export function generateExercises(options: GenerateExercisesOptions): ExerciseDefinition[] {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 100) {
    throw new RangeError('count must be an integer between 1 and 100.')
  }
  const baseSeed = options.seed ?? `local-${Date.now()}-${unseededSequence++}`
  return Array.from({ length: options.count }, (_, index) => generateExercise({
    ...options,
    seed: `${String(baseSeed)}:${index}`,
  }))
}

export function assertValidGeneratedExercise(exercise: ExerciseDefinition): void {
  if (!(['sin', 'cos', 'tan'] as string[]).includes(exercise.topic)) {
    throw new Error(`Unsupported generated topic: ${exercise.topic}`)
  }
  if (!exercise.statement.trim() || !exercise.answer.trim() || exercise.hints.length === 0) {
    throw new Error(`Generated exercise ${exercise.id} is missing required content.`)
  }
  const answerEvaluation = evaluateAnswer(exercise.answer, exercise.answer, { format: 'numeric' })
  if (!answerEvaluation.correct || !exercise.solution?.trim()) {
    throw new Error(`Generated exercise ${exercise.id} has a non-calculable answer.`)
  }

  const opposite = Number(exercise.metadata?.triangleOpposite)
  const adjacent = Number(exercise.metadata?.triangleAdjacent)
  const hypotenuse = Number(exercise.metadata?.triangleHypotenuse)
  if (![opposite, adjacent, hypotenuse].every((side) => Number.isFinite(side) && side > 0)) {
    throw new Error(`Generated exercise ${exercise.id} has invalid triangle sides.`)
  }
  if (opposite ** 2 + adjacent ** 2 !== hypotenuse ** 2) {
    throw new Error(`Generated exercise ${exercise.id} has an incoherent right triangle.`)
  }

  const ratio = ratioDefinitions[exercise.topic as GeneratableTopic]
  const numerator = Number(exercise.metadata?.[`triangle${capitalize(ratio.numerator)}`])
  const denominator = Number(exercise.metadata?.[`triangle${capitalize(ratio.denominator)}`])
  if (denominator <= 0 || !Number.isFinite(numerator / denominator)) {
    throw new Error(`Generated exercise ${exercise.id} has an invalid trig ratio.`)
  }
  if (Math.abs(numerator / denominator - Number(exercise.metadata?.ratioValue)) > 1e-9) {
    throw new Error(`Generated exercise ${exercise.id} has inconsistent ratio metadata.`)
  }
}

export const localExerciseGenerator = {
  generateExercise,
  generateExercises,
}

export const generatedExerciseProvider: OfflineExerciseProvider = {
  getExercise(topic: string): ExerciseDefinition | null {
    if (!isGeneratableTopic(topic)) return null
    return generateExercise({ topic, difficulty: 'easy' })
  },
  getExercises(topic: string): ExerciseDefinition[] {
    if (!isGeneratableTopic(topic)) return []
    return generateExercises({ topic, difficulty: 'easy', count: 5 })
  },
}

function createRatioDraft(
  ratio: RatioDefinition,
  triangle: TriangleTriple,
  ratioValue: number,
): ExerciseDraft {
  const numerator = triangle[ratio.numerator]
  const denominator = triangle[ratio.denominator]
  const answer = formatFraction(numerator, denominator)
  return {
    statement: `Calculá ${ratio.symbol}(θ) si el ${ratio.numeratorLabel} mide ${numerator} y el ${ratio.denominatorLabel} mide ${denominator}.`,
    knownValues: {
      [ratio.numerator === 'opposite' ? 'catetoOpuesto' : 'catetoAdyacente']: numerator,
      [ratio.denominator === 'hypotenuse' ? 'hipotenusa' : 'catetoAdyacente']: denominator,
    },
    unknown: `${ratio.symbol}(θ)`,
    answer,
    solution: `${ratio.symbol}(θ) = ${ratio.numeratorLabel} / ${ratio.denominatorLabel} = ${numerator}/${denominator} = ${answer}.`,
    hints: [`${ratio.symbol}(θ) = ${ratio.numeratorLabel} / ${ratio.denominatorLabel}.`, 'Reemplazá cada lado por su medida y simplificá la fracción.'],
    ratioValue,
    triangle,
  }
}

function createSideSolveDraft(
  ratio: RatioDefinition,
  triangle: TriangleTriple,
  ratioValue: number,
): ExerciseDraft {
  const knownValue = triangle[ratio.denominator]
  const answer = triangle[ratio.numerator]
  return {
    statement: `Si ${ratio.symbol}(θ) = ${formatFraction(answer, knownValue)} y el ${ratio.denominatorLabel} mide ${knownValue}, ¿cuánto mide el ${ratio.numeratorLabel}?`,
    knownValues: {
      [ratio.symbol]: ratioValue,
      [ratio.denominator === 'hypotenuse' ? 'hipotenusa' : 'catetoAdyacente']: knownValue,
    },
    unknown: ratio.numerator === 'opposite' ? 'catetoOpuesto' : 'catetoAdyacente',
    answer: String(answer),
    solution: `${ratio.symbol}(θ) = ${ratio.numeratorLabel} / ${ratio.denominatorLabel}; ${ratio.numeratorLabel} = ${ratioValue} × ${knownValue} = ${answer}.`,
    hints: [`Despejá ${ratio.numeratorLabel} en la fórmula de ${ratio.symbol}.`, `Multiplicá ${ratioValue} por ${knownValue}.`],
    ratioValue,
    triangle,
  }
}

function createScaledSideDraft(
  topic: GeneratableTopic,
  ratio: RatioDefinition,
  triangle: TriangleTriple,
  random: SeededRandom,
): ExerciseDraft {
  const scale = random.integer(2, 5)
  const scaled = scaleTriangle(triangle, scale)
  const knownComponent = ratio.denominator
  const targetComponent = ratio.numerator
  const knownValue = scaled[knownComponent]
  const answer = scaled[targetComponent]
  const ratioValue = answer / knownValue
  return {
    statement: `Una rampa forma un triángulo rectángulo con ${ratio.denominatorLabel} de ${knownValue}. Si ${ratio.symbol}(θ) = ${formatDecimal(ratioValue)}, calculá el ${ratio.numeratorLabel}.`,
    knownValues: {
      angulo: angleForTopic(topic, ratioValue),
      [ratio.symbol]: ratioValue,
      [knownComponent === 'hypotenuse' ? 'hipotenusa' : knownComponent === 'opposite' ? 'catetoOpuesto' : 'catetoAdyacente']: knownValue,
    },
    unknown: targetComponent === 'opposite' ? 'catetoOpuesto' : targetComponent === 'adjacent' ? 'catetoAdyacente' : 'hipotenusa',
    answer: String(answer),
    solution: `${ratio.symbol}(θ) = ${ratio.numeratorLabel} / ${ratio.denominatorLabel}; ${ratio.numeratorLabel} = ${formatDecimal(ratioValue)} × ${knownValue} = ${answer}.`,
    hints: [`Despejá ${ratio.numeratorLabel} en la relación ${ratio.symbol}(θ).`, 'Multiplicá la razón por el lado conocido.'],
    ratioValue,
    triangle: scaled,
  }
}

function angleForTopic(topic: GeneratableTopic, ratio: number): number {
  const radians = topic === 'sin' ? Math.asin(ratio) : topic === 'cos' ? Math.acos(ratio) : Math.atan(ratio)
  return Number((radians * 180 / Math.PI).toFixed(2))
}

function scaleTriangle(triangle: TriangleTriple, scale: number): TriangleTriple {
  return {
    opposite: triangle.opposite * scale,
    adjacent: triangle.adjacent * scale,
    hypotenuse: triangle.hypotenuse * scale,
  }
}

function formatFraction(numerator: number, denominator: number): string {
  const divisor = greatestCommonDivisor(numerator, denominator)
  return `${numerator / divisor}/${denominator / divisor}`
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(4)).toString()
}

function greatestCommonDivisor(first: number, second: number): number {
  let left = Math.abs(first)
  let right = Math.abs(second)
  while (right !== 0) [left, right] = [right, left % right]
  return left || 1
}

function isGeneratableTopic(topic: string): topic is GeneratableTopic {
  return topic === 'sin' || topic === 'cos' || topic === 'tan'
}

function capitalize(value: string): string {
  return value[0].toUpperCase() + value.slice(1)
}

interface SeededRandom {
  integer(minimumOrMaximum: number, maximumExclusive?: number): number
}

function createSeededRandom(seed: ExerciseSeed): SeededRandom {
  let state = hashSeed(String(seed)) || 0x6d2b79f5
  return {
    integer(minimumOrMaximum, maximum) {
      const minimum = maximum === undefined ? 0 : minimumOrMaximum
      const maximumExclusive = maximum === undefined ? minimumOrMaximum : maximum
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return minimum + (state % (maximumExclusive - minimum))
    },
  }
}

function answerToNumber(answer: string): number {
  const fraction = answer.match(/^(-?\d+)\/(\d+)$/)
  if (fraction) return Number(fraction[1]) / Number(fraction[2])
  return Number(answer)
}

function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619)
  return hash >>> 0
}

function assertOptions(options: GenerateExerciseOptions): void {
  if (!isGeneratableTopic(options.topic)) throw new RangeError(`Unsupported topic: ${options.topic}`)
  if (!['easy', 'medium', 'hard'].includes(options.difficulty)) throw new RangeError(`Unsupported difficulty: ${options.difficulty}`)
}