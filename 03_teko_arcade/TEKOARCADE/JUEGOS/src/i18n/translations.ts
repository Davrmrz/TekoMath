import es from './locales/es'
import esPy from './locales/esPy'
import jopara from './locales/jopara'
import type { Language, TranslationParams } from './types'

export const translations = { es, es_py: esPy, jopara }
export type TranslationKey = keyof typeof es

interface ExerciseCopySource {
  id: string
  topic?: string
  topicId?: string
  difficulty?: string
  knownValues?: Record<string, number | string>
  answer?: string
  expectedAnswer?: string
}

export function translateExerciseCopy(
  exercise: ExerciseCopySource,
  part: 'prompt' | 'hint',
  language: Language,
  fallback: string,
  hintIndex = 0,
): string {
  if (/^(sin|cos|tan|csc|sec|cot)-0[1-5]$/.test(exercise.id)) {
    const suffix = part === 'prompt' ? 'prompt' : `hint.${hintIndex + 1}`
    const key = `exercise.${exercise.id}.${suffix}` as TranslationKey
    const value = translate(key, language)
    return value === key ? fallback : value
  }

  const generatedId = /^generated-(sin|cos|tan)-(easy|medium|hard)-/.exec(exercise.id)
  if (!generatedId) return fallback

  const topic = exercise.topicId ?? exercise.topic ?? generatedId[1]
  const difficulty = exercise.difficulty ?? generatedId[2]
  if (topic !== generatedId[1] || difficulty !== generatedId[2]) return fallback

  const ratios = {
    sin: { symbol: 'sin', numerator: 'catetoOpuesto', denominator: 'hipotenusa', numeratorLabel: 'cateto opuesto', denominatorLabel: 'hipotenusa', numeratorPart: 'opuesto', denominatorPart: 'hipotenusa' },
    cos: { symbol: 'cos', numerator: 'catetoAdyacente', denominator: 'hipotenusa', numeratorLabel: 'cateto adyacente', denominatorLabel: 'hipotenusa', numeratorPart: 'adyacente', denominatorPart: 'hipotenusa' },
    tan: { symbol: 'tan', numerator: 'catetoOpuesto', denominator: 'catetoAdyacente', numeratorLabel: 'cateto opuesto', denominatorLabel: 'cateto adyacente', numeratorPart: 'opuesto', denominatorPart: 'adyacente' },
  } as const
  const ratio = ratios[topic as keyof typeof ratios]
  if (!ratio) return fallback

  const values = exercise.knownValues ?? {}
  const numeratorValue = Number(values[ratio.numerator])
  const denominatorValue = Number(values[ratio.denominator])
  const answer = Number(exercise.answer ?? exercise.expectedAnswer)
  const ratioValue = Number(values[ratio.symbol]) || numeratorValue / denominatorValue
  const params: TranslationParams = {
    ratio: ratio.symbol,
    numeratorLabel: ratio.numeratorLabel,
    denominatorLabel: ratio.denominatorLabel,
    numerator: ratio.numeratorPart,
    denominator: ratio.denominatorPart,
    numeratorValue: formatExerciseNumber(numeratorValue),
    denominatorValue: formatExerciseNumber(denominatorValue),
    knownValue: formatExerciseNumber(denominatorValue),
    ratioValue: formatExerciseNumber(ratioValue),
    fraction: formatExerciseFraction(answer, denominatorValue),
  }

  if (part === 'prompt') {
    const key = `generated.${difficulty}.prompt` as TranslationKey
    return translate(key, language, params)
  }

  const hintKey = difficulty === 'easy'
    ? hintIndex === 0 ? 'generated.easy.hintFormula' : 'generated.easy.hintReplace'
    : difficulty === 'medium'
      ? hintIndex === 0 ? 'generated.medium.hintSolve' : 'generated.medium.hintMultiply'
      : hintIndex === 0 ? 'generated.hard.hintSolve' : 'generated.hard.hintMultiply'
  return translate(hintKey as TranslationKey, language, params)
}

function formatExerciseNumber(value: number): string {
  return Number.isFinite(value) ? Number(value.toFixed(4)).toString() : ''
}

function formatExerciseFraction(numerator: number, denominator: number): string {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) return ''
  let left = Math.abs(numerator)
  let right = Math.abs(denominator)
  while (right !== 0) [left, right] = [right, left % right]
  const divisor = left || 1
  return `${numerator / divisor}/${denominator / divisor}`
}

export function translate(
  key: TranslationKey,
  language: Language,
  params?: TranslationParams,
): string {
  const selected = translations[language][key]
  const fallback = language === 'jopara'
    ? translations.es_py[key] ?? translations.es[key]
    : language === 'es_py'
      ? translations.es[key]
      : undefined
  const value = selected ?? fallback

  if (selected === undefined && import.meta.env.DEV) {
    console.warn(`[i18n] Missing "${key}" in locale "${language}"; using fallback.`)
  }
  if (value === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] Missing Spanish fallback for "${key}".`)
    return key
  }

  return params
    ? value.replace(/\{(\w+)\}/g, (token, name: string) => String(params[name] ?? token))
    : value
}