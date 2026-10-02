export type AnswerFormat = 'auto' | 'numeric' | 'percentage' | 'text'

export type AnswerEvaluationReason =
  | 'correct'
  | 'incorrect'
  | 'text-mismatch'
  | 'invalid-input'
  | 'invalid-expected'
  | 'unsupported-format'
  | 'division-by-zero'

export interface AnswerEvaluationOptions {
  format?: AnswerFormat
  absoluteTolerance?: number
  relativeTolerance?: number
  caseSensitive?: boolean
}

export interface AnswerEvaluationResult {
  correct: boolean
  normalizedExpected: string | null
  normalizedReceived: string | null
  difference?: number
  reason: AnswerEvaluationReason
}

interface ParsedNumber {
  value: number
  normalized: string
}

type ParseResult = { parsed: ParsedNumber } | { error: 'invalid' | 'division-by-zero' }

const DEFAULT_ABSOLUTE_TOLERANCE = 1e-9
const DEFAULT_RELATIVE_TOLERANCE = 1e-9

export function evaluateAnswer(
  expected: string | number,
  received: string | number,
  options: AnswerEvaluationOptions = {},
): AnswerEvaluationResult {
  const expectedText = String(expected).trim()
  const receivedText = String(received).trim()
  const explicitFormat = options.format ?? 'auto'
  const autoExpected = parseNumeric(expected, false)
  const inferredFormat = explicitFormat === 'auto'
    ? ('parsed' in autoExpected || looksNumeric(expectedText) ? 'numeric' : 'text')
    : explicitFormat

  if (inferredFormat === 'text') {
    return evaluateText(expectedText, receivedText, options.caseSensitive ?? false)
  }

  const percentageExpected = inferredFormat === 'percentage' || expectedText.endsWith('%')
  const expectedResult = parseNumeric(expected, inferredFormat === 'percentage')
  if ('error' in expectedResult) {
    return {
      correct: false,
      normalizedExpected: null,
      normalizedReceived: null,
      reason: expectedResult.error === 'division-by-zero' ? 'division-by-zero' : 'invalid-expected',
    }
  }

  const standardReceived = parseNumeric(received, false)
  const percentReceived = percentageExpected && !receivedText.endsWith('%')
    ? parseNumeric(received, true)
    : null

  const receivedCandidates = [standardReceived, ...(percentReceived ? [percentReceived] : [])]
  const parsedCandidates = receivedCandidates.flatMap((candidate) => 'parsed' in candidate ? [candidate.parsed] : [])
  if (parsedCandidates.length === 0) {
    const divisionByZero = receivedCandidates.some((candidate) => 'error' in candidate && candidate.error === 'division-by-zero')
    return {
      correct: false,
      normalizedExpected: expectedResult.parsed.normalized,
      normalizedReceived: null,
      reason: divisionByZero ? 'division-by-zero' : 'invalid-input',
    }
  }

  const receivedResult = parsedCandidates
    .map((parsed) => ({ parsed, difference: Math.abs(expectedResult.parsed.value - parsed.value) }))
    .sort((left, right) => left.difference - right.difference)[0]
  const absoluteTolerance = validTolerance(options.absoluteTolerance, DEFAULT_ABSOLUTE_TOLERANCE)
  const relativeTolerance = validTolerance(options.relativeTolerance, DEFAULT_RELATIVE_TOLERANCE)
  const allowedDifference = Math.max(absoluteTolerance, relativeTolerance * Math.abs(expectedResult.parsed.value))
  const correct = receivedResult.difference <= allowedDifference

  return {
    correct,
    normalizedExpected: expectedResult.parsed.normalized,
    normalizedReceived: receivedResult.parsed.normalized,
    difference: receivedResult.difference,
    reason: correct ? 'correct' : 'incorrect',
  }
}

function evaluateText(expected: string, received: string, caseSensitive: boolean): AnswerEvaluationResult {
  const normalizedExpected = normalizeText(expected, caseSensitive)
  const normalizedReceived = normalizeText(received, caseSensitive)
  const correct = normalizedExpected.length > 0 && normalizedExpected === normalizedReceived

  return {
    correct,
    normalizedExpected,
    normalizedReceived,
    reason: correct ? 'correct' : 'text-mismatch',
  }
}

function parseNumeric(input: string | number, assumePercentage: boolean): ParseResult {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return { error: 'invalid' }
    const value = assumePercentage ? input / 100 : input
    return { parsed: { value, normalized: normalizeNumber(value) } }
  }

  let source = input
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
  if (!source) return { error: 'invalid' }

  const hasPercentSign = source.endsWith('%')
  if (hasPercentSign) source = source.slice(0, -1)

  const fractionMatch = source.match(/^([+-]?\d+)\/([+-]?\d+)$/)
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1])
    const denominator = Number(fractionMatch[2])
    if (denominator === 0) return { error: 'division-by-zero' }
    const fractionValue = numerator / denominator
    const value = hasPercentSign || assumePercentage ? fractionValue / 100 : fractionValue
    return { parsed: { value, normalized: normalizeNumber(value) } }
  }

  if (source.includes(',') && source.includes('.')) return { error: 'invalid' }
  const decimalSource = source.replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(decimalSource)) return { error: 'invalid' }

  const numericValue = Number(decimalSource)
  if (!Number.isFinite(numericValue)) return { error: 'invalid' }
  const value = hasPercentSign || assumePercentage ? numericValue / 100 : numericValue
  return { parsed: { value, normalized: normalizeNumber(value) } }
}

function normalizeText(value: string, caseSensitive: boolean): string {
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  return caseSensitive ? normalized : normalized.toLocaleLowerCase('es')
}

function normalizeNumber(value: number): string {
  return Object.is(value, -0) ? '0' : Number(value.toPrecision(14)).toString()
}

function looksNumeric(value: string): boolean {
  return /^[+\-−]?(?:\d|[.,]\d)/.test(value) || /^[+\-−]?\d+\s*\/\s*\d/.test(value)
}

function validTolerance(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback
}