import type { TopicDefinition } from '../types'

export const topics: TopicDefinition[] = [
  {
    id: 'sin',
    name: 'Seno',
    shortName: 'sin',
    description: 'Razón entre el cateto opuesto y la hipotenusa.',
    order: 1,
    formula: 'sin(θ) = opuesto / hipotenusa',
    category: 'principal',
  },
  {
    id: 'cos',
    name: 'Coseno',
    shortName: 'cos',
    description: 'Razón entre el cateto adyacente y la hipotenusa.',
    order: 2,
    formula: 'cos(θ) = adyacente / hipotenusa',
    category: 'principal',
  },
  {
    id: 'tan',
    name: 'Tangente',
    shortName: 'tan',
    description: 'Razón entre el cateto opuesto y el adyacente.',
    order: 3,
    formula: 'tan(θ) = opuesto / adyacente',
    category: 'principal',
  },
  {
    id: 'csc',
    name: 'Cosecante',
    shortName: 'csc',
    description: 'Recíproca del seno.',
    order: 4,
    formula: 'csc(θ) = 1 / sin(θ)',
    category: 'inverse',
  },
  {
    id: 'sec',
    name: 'Secante',
    shortName: 'sec',
    description: 'Recíproca del coseno.',
    order: 5,
    formula: 'sec(θ) = 1 / cos(θ)',
    category: 'inverse',
  },
  {
    id: 'cot',
    name: 'Cotangente',
    shortName: 'cot',
    description: 'Recíproca de la tangente.',
    order: 6,
    formula: 'cot(θ) = 1 / tan(θ)',
    category: 'inverse',
  },
]

export const topicLookup = new Map(topics.map((topic) => [topic.id, topic]))

export function getTopicById(topicId?: string | null): TopicDefinition | undefined {
  if (!topicId) {
    return undefined
  }

  return topicLookup.get(topicId)
}
