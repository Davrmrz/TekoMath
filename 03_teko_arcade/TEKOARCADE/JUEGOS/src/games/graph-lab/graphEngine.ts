import { evaluateAnswer } from '../../engine/math/answerEvaluator.ts'
import type { GameAttempt } from '../core/engine.types'

export type GraphFunctionName = 'sin' | 'cos' | 'tan'
export type GraphChallengeKind = 'value' | 'maximum' | 'zero'

export interface GraphBounds {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface GraphPoint {
  x: number
  y: number
  value: number
}

export interface GraphChoice {
  value: number
  label: string
}

export interface GraphResultMetrics {
  correctAnswers: number
  incorrectAttempts: number
  totalAttempts: number
  accuracy: number
  bestCombo: number
}

export interface GraphChallenge {
  id: string
  functionName: GraphFunctionName
  kind: GraphChallengeKind
  prompt: string
  queryX: number | null
  answerOptions: GraphChoice[]
  pointOptions: number[]
  expectedAnswer: string
  hints: string[]
}

export const graphFunctions: GraphFunctionName[] = ['sin', 'cos', 'tan']

export function getGraphBounds(functionName: GraphFunctionName): GraphBounds {
  return {
    width: 600,
    height: 320,
    left: 48,
    right: 584,
    top: 18,
    bottom: 280,
    xMin: -2 * Math.PI,
    xMax: 2 * Math.PI,
    yMin: functionName === 'tan' ? -2 : -1.5,
    yMax: functionName === 'tan' ? 2 : 1.5,
  }
}

export function evaluateGraphFunction(functionName: GraphFunctionName, x: number): number | null {
  if (functionName === 'sin') return Math.sin(x)
  if (functionName === 'cos') return Math.cos(x)
  const cosine = Math.cos(x)
  if (Math.abs(cosine) < 1e-8) return null
  return Math.tan(x)
}

export function graphPoint(functionName: GraphFunctionName, x: number): GraphPoint | null {
  const bounds = getGraphBounds(functionName)
  const value = evaluateGraphFunction(functionName, x)
  if (value === null || value < bounds.yMin || value > bounds.yMax) return null
  return {
    x: mapX(x, bounds),
    y: mapY(value, bounds),
    value,
  }
}

export function generateGraphPath(functionName: GraphFunctionName, samples = 480): string {
  const bounds = getGraphBounds(functionName)
  const segments: string[] = []
  let previousValue: number | null = null
  let penDown = false

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples
    const xValue = bounds.xMin + ratio * (bounds.xMax - bounds.xMin)
    const value = evaluateGraphFunction(functionName, xValue)
    if (value === null || value < bounds.yMin || value > bounds.yMax || (previousValue !== null && Math.abs(value - previousValue) > 1.25)) {
      penDown = false
      previousValue = value
      continue
    }

    const command = penDown ? 'L' : 'M'
    segments.push(`${command}${mapX(xValue, bounds).toFixed(2)},${mapY(value, bounds).toFixed(2)}`)
    penDown = true
    previousValue = value
  }

  return segments.join(' ')
}

export function createGraphChallenge(functionName: GraphFunctionName, roundNumber: number): GraphChallenge {
  const round = ((roundNumber - 1) % 4) + 1
  if (round === 1 || round === 4) {
    const queryX = round === 1 ? Math.PI / 6 : Math.PI / 4
    const correctValue = evaluateGraphFunction(functionName, queryX) ?? 0
    const roundedAnswer = roundValue(correctValue)
    return {
      id: `${functionName}-value-${round}`,
      functionName,
      kind: 'value',
      prompt: `¿Cuál es el valor en x = ${formatGraphAngle(queryX)}?`,
      queryX,
      answerOptions: createValueChoices(roundedAnswer),
      pointOptions: [],
      expectedAnswer: String(roundedAnswer),
      hints: ['Ubicá x en el eje horizontal y leé la altura de la curva.'],
    }
  }

  const kind: GraphChallengeKind = round === 2 && functionName !== 'tan' ? 'maximum' : 'zero'
  const pointOptions = getPointOptions(functionName, kind)
  const expectedX = getExpectedPoint(functionName, kind)
  return {
    id: `${functionName}-${kind}-${round}`,
    functionName,
    kind,
    prompt: kind === 'maximum' ? 'Seleccioná el x del máximo.' : 'Identificá un cero de la función.',
    queryX: null,
    answerOptions: [],
    pointOptions,
    expectedAnswer: String(expectedX),
    hints: [kind === 'maximum' ? 'Buscá el punto más alto de la curva.' : 'Un cero es donde la curva cruza el eje x.'],
  }
}

export function evaluateGraphAnswer(challenge: GraphChallenge, answer: string): boolean {
  return evaluateAnswer(challenge.expectedAnswer, answer, {
    format: 'numeric',
    absoluteTolerance: 0.001,
    relativeTolerance: 0,
  }).correct
}

export function calculateGraphComboBonus(combo: number): number {
  return Math.min(40, Math.max(0, Math.floor(combo) * 10))
}

export function calculateGraphResultMetrics(
  attempts: readonly Pick<GameAttempt, 'isCorrect'>[],
  bestCombo: number,
): GraphResultMetrics {
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

export function formatGraphAngle(value: number): string {
  const candidates: Array<[number, string]> = [
    [-2, '-2π'], [-1.5, '-3π/2'], [-1, '-π'], [-0.75, '-3π/4'], [-0.5, '-π/2'], [-1 / 3, '-π/3'],
    [0, '0'], [1 / 3, 'π/3'], [0.5, 'π/2'], [0.75, '3π/4'], [1, 'π'], [1.5, '3π/2'], [2, '2π'],
  ]
  const multiple = value / Math.PI
  return candidates.find(([candidate]) => Math.abs(candidate - multiple) < 1e-7)?.[1] ?? value.toFixed(2)
}

function getExpectedPoint(functionName: GraphFunctionName, kind: 'maximum' | 'zero'): number {
  if (kind === 'maximum') return functionName === 'sin' ? Math.PI / 2 : 0
  return functionName === 'cos' ? -Math.PI / 2 : 0
}

function getPointOptions(functionName: GraphFunctionName, kind: 'maximum' | 'zero'): number[] {
  if (kind === 'maximum') {
    return functionName === 'sin'
      ? [-Math.PI, -Math.PI / 2, Math.PI / 2, Math.PI]
      : [-Math.PI, -Math.PI / 2, 0, Math.PI / 2]
  }
  if (functionName === 'cos') return [-Math.PI, -Math.PI / 2, 0, Math.PI / 3]
  if (functionName === 'tan') return [-Math.PI / 4, 0, Math.PI / 4, Math.PI / 3]
  return [-Math.PI / 2, 0, Math.PI / 2, Math.PI / 3]
}

function createValueChoices(correctValue: number): GraphChoice[] {
  const pool = [-1, 0, 0.5, Math.SQRT1_2, Math.sqrt(3) / 2, 1, Math.sqrt(3)]
  const distractors = pool.filter((value) => Math.abs(value - correctValue) > 0.04).slice(0, 3)
  const values = [correctValue, ...distractors]
  return deterministicShuffle(values, correctValue.toFixed(3)).map((value) => ({
    value,
    label: String(roundValue(value)),
  }))
}

function deterministicShuffle<T>(values: readonly T[], seed: string): T[] {
  const shuffled = [...values]
  let hash = 0
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0
    const target = hash % (index + 1)
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

function roundValue(value: number): number {
  return Number(value.toFixed(3))
}

function mapX(value: number, bounds: GraphBounds): number {
  return bounds.left + ((value - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (bounds.right - bounds.left)
}

function mapY(value: number, bounds: GraphBounds): number {
  return bounds.bottom - ((value - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (bounds.bottom - bounds.top)
}