import { localExerciseParser } from '../engine/parser/localExerciseParser.ts'
import type { Difficulty, ExerciseDefinition, SourceType } from '../types'
import { validateAndNormalizeExercise } from './exerciseGenerationValidation.ts'

export interface ResolveTaskExerciseOptions {
  topic?: string
  difficulty: Difficulty
  source: Extract<SourceType, 'user-text' | 'user-image'>
}

export function detectTaskTopic(input: string, topicOverride?: string): string | undefined {
  return topicOverride ?? detectExplicitTopic(input) ?? localExerciseParser(input).detectedTopic
}

const numberPattern = '(-?\\d+(?:[.,]\\d+)?)'
const sidePatterns: Record<string, RegExp[]> = {
  catetoOpuesto: [
    new RegExp(`(?:cateto\\s+)?opuesto\\s*(?:mide|es|de|=|:)??\\s*${numberPattern}`, 'i'),
    new RegExp(`${numberPattern}\\s*(?:cm\\s*)?(?:de\\s+)?(?:cateto\\s+)?opuesto`, 'i'),
  ],
  catetoAdyacente: [
    new RegExp(`(?:cateto\\s+)?adyacente\\s*(?:mide|es|de|=|:)??\\s*${numberPattern}`, 'i'),
    new RegExp(`${numberPattern}\\s*(?:cm\\s*)?(?:de\\s+)?(?:cateto\\s+)?adyacente`, 'i'),
  ],
  hipotenusa: [
    new RegExp(`hipotenusa\\s*(?:mide|es|de|=|:)??\\s*${numberPattern}`, 'i'),
    new RegExp(`${numberPattern}\\s*(?:cm\\s*)?(?:de\\s+)?hipotenusa`, 'i'),
  ],
}

export function resolveTaskExercise(
  input: string,
  options: ResolveTaskExerciseOptions,
): ExerciseDefinition | null {
  const statement = input.normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!statement || statement.length > 1200) return null

  const topic = detectTaskTopic(statement, options.topic)
  if (!topic) return null

  const knownValues = extractKnownValues(statement)
  const unknown = inferUnknown(statement, topic, knownValues)
  const expected = calculateExpected(unknown, knownValues)
  if (expected === null) return null

  const exercise: ExerciseDefinition = {
    id: `task-${hashText(`${topic}:${statement}`)}`,
    topic,
    statement,
    difficulty: options.difficulty,
    source: options.source,
    knownValues,
    unknown,
    answer: formatAnswer(expected),
    solution: `${unknown} = ${formatAnswer(expected)}. Resultado calculado a partir de los datos reconocidos.`,
    hints: ['Identificá la razón trigonométrica y los lados conocidos.', 'Sustituí los valores y despejá la incógnita.'],
    metadata: { taskParser: 'local-rules-v1' },
  }

  try {
    return validateAndNormalizeExercise(exercise, {
      topic,
      difficulty: options.difficulty,
      gameId: 'task-practice',
    }, options.source)
  } catch {
    return null
  }
}

function extractKnownValues(text: string): Record<string, number | string> {
  const knownValues: Record<string, number | string> = {}
  for (const [key, patterns] of Object.entries(sidePatterns)) {
    const match = patterns.map((pattern) => text.match(pattern)).find(Boolean)
    if (match) knownValues[key] = parseNumber(match[1] ?? match[2])
  }

  const ratioPattern = /\b(sen|sin|seno|cos|coseno|tan|tangente|csc|cosecante|sec|secante|cot|cotangente)\s*(?:\([^)]*\))?\s*(?:\(\s*\))?\s*(?:=|es|vale)\s*(-?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?)/gi
  for (const match of text.matchAll(ratioPattern)) {
    const functionName = normalizeFunction(match[1])
    if (functionName) knownValues[`${functionName}Alpha`] = parseNumber(match[2])
  }
  return knownValues
}

function inferUnknown(
  text: string,
  topic: string,
  knownValues: Record<string, number | string>,
): string {
  const question = text.split(/[?¿]/).filter(Boolean).at(-1) ?? text
  const normalizedQuestion = normalizeText(question)
  const sideTargets: [RegExp, string][] = [
    [/\bhipotenusa\b/, 'hipotenusa'],
    [/\b(?:cateto\s+)?opuesto\b/, 'catetoOpuesto'],
    [/\b(?:cateto\s+)?adyacente\b/, 'catetoAdyacente'],
  ]
  for (const [pattern, target] of sideTargets) {
    if (pattern.test(normalizedQuestion) && knownValues[target] === undefined) return target
  }

  const targetFunction = normalizedQuestion.match(/\b(csc|cosecante|sec|secante|cot|cotangente|sin|sen|seno|cos|coseno|tan|tangente)\b/)
  if (targetFunction) {
    const functionName = normalizeFunction(targetFunction[1])
    if (functionName) return `${functionName}(θ)`
  }

  if (knownValues.catetoOpuesto !== undefined && knownValues.hipotenusa !== undefined
    || knownValues.catetoAdyacente !== undefined && knownValues.hipotenusa !== undefined
    || knownValues.catetoOpuesto !== undefined && knownValues.catetoAdyacente !== undefined) {
    return `${topic}(θ)`
  }
  if (knownValues[`${topic}Alpha`] !== undefined) {
    const topicFunction = normalizeFunction(topic)
    const sidesToFind = topicFunction === 'sin'
      ? ['hipotenusa', 'catetoOpuesto']
      : topicFunction === 'cos'
        ? ['hipotenusa', 'catetoAdyacente']
        : topicFunction === 'tan'
          ? ['catetoAdyacente', 'catetoOpuesto']
          : []
    return sidesToFind.find((side) => knownValues[side] === undefined) ?? `${topic}(θ)`
  }
  return `${topic}(θ)`
}

function calculateExpected(
  unknown: string,
  knownValues: Record<string, number | string>,
): number | null {
  const sides = {
    opposite: numericValue(knownValues.catetoOpuesto),
    adjacent: numericValue(knownValues.catetoAdyacente),
    hypotenuse: numericValue(knownValues.hipotenusa),
  }
  const targetFunction = normalizeFunction(unknown)
  const functionValues = Object.fromEntries(Object.entries(knownValues)
    .map(([key, value]) => [functionPrefix(key), numericValue(value)] as const)
    .filter(([name]) => name !== undefined)
    .map(([name, value]) => [name, value])) as Record<string, number | undefined>

  if (targetFunction) {
    const { opposite, adjacent, hypotenuse } = sides
    const fromSides: Record<string, number | undefined> = {
      sin: opposite !== undefined && hypotenuse ? opposite / hypotenuse : undefined,
      cos: adjacent !== undefined && hypotenuse ? adjacent / hypotenuse : undefined,
      tan: opposite !== undefined && adjacent ? opposite / adjacent : undefined,
      csc: opposite !== undefined && hypotenuse ? hypotenuse / opposite : undefined,
      sec: adjacent !== undefined && hypotenuse ? hypotenuse / adjacent : undefined,
      cot: opposite !== undefined && adjacent ? adjacent / opposite : undefined,
    }
    const knownRatio = functionValues[targetFunction]
      ?? reciprocalFunction(targetFunction, functionValues)
    const result = fromSides[targetFunction] ?? knownRatio
    return result !== undefined && Number.isFinite(result) && result > 0 ? result : null
  }

  const targetSide = unknown === 'catetoOpuesto' ? 'opposite'
    : unknown === 'catetoAdyacente' ? 'adjacent'
      : unknown === 'hipotenusa' ? 'hypotenuse' : null
  if (!targetSide) return null
  const sin = functionValues.sin ?? functionValues.sen ?? functionValues.seno
  const cos = functionValues.cos ?? functionValues.coseno
  const tan = functionValues.tan ?? functionValues.tangente
  const { opposite, adjacent, hypotenuse } = sides
  const result = targetSide === 'opposite'
    ? sin !== undefined && hypotenuse !== undefined ? sin * hypotenuse
      : tan !== undefined && adjacent !== undefined ? tan * adjacent
        : adjacent !== undefined && hypotenuse !== undefined && hypotenuse > adjacent ? Math.sqrt(hypotenuse ** 2 - adjacent ** 2) : undefined
    : targetSide === 'adjacent'
      ? cos !== undefined && hypotenuse !== undefined ? cos * hypotenuse
        : tan !== undefined && opposite !== undefined && tan !== 0 ? opposite / tan
          : opposite !== undefined && hypotenuse !== undefined && hypotenuse > opposite ? Math.sqrt(hypotenuse ** 2 - opposite ** 2) : undefined
      : sin !== undefined && opposite !== undefined && sin !== 0 ? opposite / sin
        : cos !== undefined && adjacent !== undefined && cos !== 0 ? adjacent / cos
          : opposite !== undefined && adjacent !== undefined ? Math.sqrt(opposite ** 2 + adjacent ** 2) : undefined
  return result !== undefined && Number.isFinite(result) && result > 0 ? result : null
}

function reciprocalFunction(target: string, values: Record<string, number | undefined>): number | undefined {
  const reciprocal: Record<string, string> = { sin: 'csc', csc: 'sin', cos: 'sec', sec: 'cos', tan: 'cot', cot: 'tan' }
  const value = values[reciprocal[target]]
  return value !== undefined && value !== 0 ? 1 / value : undefined
}

function normalizeFunction(value: string): string | undefined {
  const normalized = normalizeText(value).replace(/[^a-z]/g, '')
  const functions: Record<string, string> = {
    seno: 'sin', sen: 'sin', sin: 'sin',
    coseno: 'cos', cos: 'cos',
    tangente: 'tan', tan: 'tan',
    cosecante: 'csc', csc: 'csc',
    secante: 'sec', sec: 'sec',
    cotangente: 'cot', cot: 'cot',
  }
  return functions[normalized]
}

function functionPrefix(value: string): string | undefined {
  const normalized = normalizeText(value).replace(/[^a-z]/g, '')
  const prefix = ['cosecante', 'secante', 'cotangente', 'seno', 'coseno', 'tangente', 'csc', 'sec', 'cot', 'sin', 'sen', 'cos', 'tan']
    .find((name) => normalized.startsWith(name))
  return prefix ? normalizeFunction(prefix) : undefined
}

function numericValue(value: number | string | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const fraction = value.replace(',', '.').match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (fraction) {
    const denominator = Number(fraction[2])
    return denominator === 0 ? undefined : Number(fraction[1]) / denominator
  }
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseNumber(value: string | undefined): number {
  if (!value) return Number.NaN
  const parsed = numericValue(value)
  return parsed ?? Number.NaN
}

function formatAnswer(value: number): string {
  return Number(value.toPrecision(10)).toString()
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function hashText(value: string): string {
  let hash = 2166136261
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return (hash >>> 0).toString(36)
}

function detectExplicitTopic(text: string): string | undefined {
  const normalized = normalizeText(text)
  const topics: [string, RegExp][] = [
    ['csc', /\b(?:csc|cosecante)\b/],
    ['sec', /\b(?:sec|secante)\b/],
    ['cot', /\b(?:cot|cotangente)\b/],
    ['sin', /\b(?:sin|sen|seno)\b/],
    ['cos', /\b(?:cos|coseno)\b/],
    ['tan', /\b(?:tan|tangente)\b/],
  ]
  return topics.find(([, pattern]) => pattern.test(normalized))?.[0]
}