export type ParserStatus = 'VALID' | 'PARTIAL' | 'UNSUPPORTED'

export interface LocalExerciseParseResult {
  status: ParserStatus
  detectedTopic?: string
  topicLabel?: string
  values: string[]
  normalizedText: string
}

const topicPatterns: Record<string, RegExp[]> = {
  sin: [/\bsin\b/, /\bseno\b/, /\bcateto\s+opuesto\b/, /\bopuesto\b.*\bhipotenusa\b/],
  cos: [/\bcos\b/, /\bcoseno\b/, /\bcateto\s+adyacente\b/, /\badyacente\b.*\bhipotenusa\b/],
  tan: [/\btan\b/, /\btangente\b/, /\bopuesto\s*\/\s*adyacente\b/, /\bcateto\s+opuesto\b.*\bcateto\s+adyacente\b/],
  csc: [/\bcsc\b/, /\bcosecante\b/, /\breciproca\s+del\s+seno\b/, /\bhipotenusa\b.*\bopuesto\b/],
  sec: [/\bsec\b/, /\bsecante\b/, /\breciproca\s+del\s+coseno\b/, /\bhipotenusa\b.*\badyacente\b/],
  cot: [/\bcot\b/, /\bcotangente\b/, /\breciproca\s+de\s+la\s+tangente\b/, /\badyacente\b.*\bopuesto\b/],
}

const topicLabels: Record<string, string> = {
  sin: 'Seno',
  cos: 'Coseno',
  tan: 'Tangente',
  csc: 'Cosecante',
  sec: 'Secante',
  cot: 'Cotangente',
}

export function localExerciseParser(input: string): LocalExerciseParseResult {
  const normalizedText = input.trim()

  if (!normalizedText) {
    return {
      status: 'UNSUPPORTED',
      values: [],
      normalizedText,
    }
  }

  const lowerText = normalizedText.toLowerCase()
  const numbers = normalizedText.match(/-?\d+(?:[.,]\d+)?/g) ?? []
  const foundTopics = Object.entries(topicPatterns)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(lowerText)))
    .map(([topic]) => topic)

  const detectedTopic = foundTopics[0]
  const values = numbers.map((value) => value.replace(',', '.'))

  if (!detectedTopic && values.length === 0) {
    return {
      status: 'UNSUPPORTED',
      values,
      normalizedText,
    }
  }

  if (!detectedTopic) {
    return {
      status: 'PARTIAL',
      values,
      normalizedText,
    }
  }

  if (values.length === 0) {
    return {
      status: 'PARTIAL',
      detectedTopic,
      topicLabel: topicLabels[detectedTopic],
      values,
      normalizedText,
    }
  }

  return {
    status: 'VALID',
    detectedTopic,
    topicLabel: topicLabels[detectedTopic],
    values,
    normalizedText,
  }
}
