export interface PairMatrixCard {
  id: string
  label: string
  kind: 'Razón' | 'Recíproca'
}

export const pairMatrixCards: PairMatrixCard[] = [
  { id: 'sec', label: 'sec', kind: 'Recíproca' },
  { id: 'sin', label: 'sin', kind: 'Razón' },
  { id: 'cot', label: 'cot', kind: 'Recíproca' },
  { id: 'cos', label: 'cos', kind: 'Razón' },
  { id: 'csc', label: 'csc', kind: 'Recíproca' },
  { id: 'tan', label: 'tan', kind: 'Razón' },
]

const reciprocalPairs = [
  ['sin', 'csc'],
  ['cos', 'sec'],
  ['tan', 'cot'],
] as const

export function getReciprocalPairId(first: string, second: string): string | null {
  const pair = reciprocalPairs.find(([left, right]) =>
    (first === left && second === right) || (first === right && second === left),
  )

  return pair ? pair.join('-') : null
}

export function togglePairSelection(
  selected: readonly string[],
  cardId: string,
  solvedCards: readonly string[] = [],
): string[] {
  if (solvedCards.includes(cardId)) return [...selected]
  if (selected.includes(cardId)) return selected.filter((selectedId) => selectedId !== cardId)
  return selected.length === 2 ? [cardId] : [...selected, cardId]
}

export function calculateComboBonus(combo: number): number {
  return Math.min(30, Math.max(0, Math.floor(combo - 1) * 10))
}