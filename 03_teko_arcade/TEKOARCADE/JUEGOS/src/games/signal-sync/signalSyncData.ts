import type { Difficulty, ExerciseDefinition, TopicDefinition } from '../../types'

export type SignalRelation = 'ratio-formula' | 'ratio-sides' | 'expression-value' | 'concept-representation'
export type SignalSyncStatus = 'waiting' | 'selected' | 'correct' | 'incorrect' | 'next' | 'completed'
export type SignalSelectionSide = 'source' | 'target'

export interface SignalSyncMatch {
  id: string
  relation: SignalRelation
  source: string
  target: string
  exerciseId: string
}

export interface SignalSelection {
  source: string | null
  target: string | null
}

export interface SignalSyncResultMetrics {
  correctPairs: number
  incorrectAttempts: number
  totalAttempts: number
  accuracy: number
  bestCombo: number
}

export interface SignalSyncRoundConfig {
  topicId: string
  difficulty: Difficulty
  roundCount: number
  selectedExerciseId: string
}

const relationLabels: Record<SignalRelation, string> = {
  'ratio-formula': 'Razón ↔ fórmula',
  'ratio-sides': 'Razón ↔ lados',
  'expression-value': 'Expresión ↔ valor',
  'concept-representation': 'Concepto ↔ representación',
}

export function getSignalRelationLabel(relation: SignalRelation): string {
  return relationLabels[relation]
}

export function createSignalSyncDeck(
  exercises: readonly ExerciseDefinition[],
  topic: TopicDefinition,
  config: SignalSyncRoundConfig,
): SignalSyncMatch[] {
  if (topic.id !== config.topicId) return []

  const roundCount = normalizeRoundCount(config.roundCount)
  const topicExercises = exercises.filter((exercise) => exercise.topic === config.topicId)
  const difficultyExercises = topicExercises.filter((exercise) => exercise.difficulty === config.difficulty)
  const eligibleExercises = difficultyExercises.length >= roundCount ? difficultyExercises : topicExercises
  const selectedFirst = prioritizeExercises(eligibleExercises, config.selectedExerciseId, config.difficulty)
  const candidates: SignalSyncMatch[] = [{
    id: `${topic.id}-formula`,
    relation: 'ratio-formula',
    source: topic.shortName,
    target: topic.formula,
    exerciseId: config.selectedExerciseId,
  }]

  const sideCandidates: SignalSyncMatch[] = []
  for (const exercise of selectedFirst) {
    const sides = Object.entries(exercise.knownValues).filter(([key]) => isTriangleSide(key))
    if (sides.length >= 2) {
      sideCandidates.push({
        id: `${exercise.id}-sides`,
        relation: 'ratio-sides',
        source: exercise.unknown || topic.shortName,
        target: sides.map(([key, value]) => `${formatKey(key)} ${value}`).join(' · '),
        exerciseId: exercise.id,
      })
    }
  }

  const conceptCandidates = selectedFirst.filter((item) => isConceptUnknown(item.unknown)).map((exercise) => ({
      id: `${exercise.id}-concept`,
      relation: 'concept-representation',
      source: exercise.statement,
      target: exercise.answer,
      exerciseId: exercise.id,
    } satisfies SignalSyncMatch))

  const valueExercises = selectedFirst
    .filter((item) => Object.keys(item.knownValues).length > 0 && !isConceptUnknown(item.unknown))
    .sort((left, right) => Number(hasKnownRatioAndUnknownSide(right)) - Number(hasKnownRatioAndUnknownSide(left)))
  const valueCandidates = valueExercises.map((exercise) => {
    const known = Object.entries(exercise.knownValues)
      .map(([key, value]) => `${formatKey(key)} ${value}`)
      .join(' · ')
    return {
      id: `${exercise.id}-value`,
      relation: 'expression-value',
      source: `${known} → ${exercise.unknown}`,
      target: `${exercise.unknown} = ${exercise.answer}`,
      exerciseId: exercise.id,
    } satisfies SignalSyncMatch
  })

  candidates.push(...sideCandidates.slice(0, 1), ...conceptCandidates.slice(0, 1), ...valueCandidates.slice(0, 1))
  candidates.push(...sideCandidates.slice(1), ...conceptCandidates.slice(1), ...valueCandidates.slice(1))

  const unique: SignalSyncMatch[] = []
  const seenSources = new Set<string>()
  const seenTargets = new Set<string>()
  for (const candidate of candidates) {
    const sourceKey = normalize(candidate.source)
    const targetKey = normalize(candidate.target)
    if (!sourceKey || !targetKey || seenSources.has(sourceKey) || seenTargets.has(targetKey)) continue
    unique.push(candidate)
    seenSources.add(sourceKey)
    seenTargets.add(targetKey)
    if (unique.length === roundCount) break
  }

  return unique
}

export function normalizeRoundCount(roundCount: number): number {
  const requested = Number.isFinite(roundCount) ? Math.floor(roundCount) : 4
  return Math.min(5, Math.max(3, requested))
}

export function selectSignalCard(
  selection: SignalSelection,
  side: SignalSelectionSide,
  pairId: string,
  solvedPairIds: readonly string[],
): SignalSelection {
  if (solvedPairIds.includes(pairId)) return selection
  return { ...selection, [side]: selection[side] === pairId ? null : pairId }
}

export function isSignalMatch(selection: SignalSelection): boolean {
  return selection.source !== null && selection.source === selection.target
}

export function isSignalSyncComplete(solvedPairs: number, totalPairs: number): boolean {
  return totalPairs > 0 && solvedPairs >= totalPairs
}

export function calculateSignalSyncResultMetrics(
  attempts: readonly { isCorrect: boolean | null }[],
  bestCombo: number,
): SignalSyncResultMetrics {
  const correctPairs = attempts.filter((attempt) => attempt.isCorrect === true).length
  const incorrectAttempts = attempts.filter((attempt) => attempt.isCorrect === false).length
  const totalAttempts = attempts.length

  return {
    correctPairs,
    incorrectAttempts,
    totalAttempts,
    accuracy: totalAttempts === 0 ? 0 : Math.round((correctPairs / totalAttempts) * 100),
    bestCombo: Math.max(0, Math.floor(bestCombo)),
  }
}

export function calculateSignalComboBonus(combo: number): number {
  return Math.min(30, Math.max(0, Math.floor(combo - 1) * 10))
}

export function getSignalSyncStatus(input: {
  phase: string
  selection: SignalSelection
  feedbackKind: string | null
  solvedPairs: number
  totalPairs: number
}): SignalSyncStatus {
  if (input.phase === 'completed' || input.phase === 'abandoned') return 'completed'
  if (input.feedbackKind === 'correct') return 'correct'
  if (input.feedbackKind === 'incorrect') return 'incorrect'
  if (input.phase === 'ready') return 'waiting'
  if (input.selection.source || input.selection.target) return 'selected'
  if (input.solvedPairs > 0 && input.solvedPairs < input.totalPairs) return 'next'
  return 'waiting'
}

function isTriangleSide(key: string): boolean {
  return /opuesto|adyacente|hipotenusa/i.test(key)
}

function hasKnownRatioAndUnknownSide(exercise: ExerciseDefinition): boolean {
  return isTriangleSide(exercise.unknown)
    && Object.keys(exercise.knownValues).some((key) => /sin|sen|cos|tan|csc|sec|cot/i.test(key))
}

function isConceptUnknown(unknown: string): boolean {
  return ['razon', 'funcion', 'expresion'].includes(normalize(unknown))
}

function formatKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLocaleLowerCase('es')
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es')
}

function prioritizeExercises(
  exercises: readonly ExerciseDefinition[],
  selectedExerciseId: string,
  difficulty: Difficulty,
): ExerciseDefinition[] {
  const selected = exercises.filter((exercise) => exercise.id === selectedExerciseId)
  const sameDifficulty = exercises.filter((exercise) => exercise.difficulty === difficulty)
  const ordered = [...selected, ...sameDifficulty, ...exercises]
  const seen = new Set<string>()
  return ordered.filter((exercise) => {
    if (seen.has(exercise.id)) return false
    seen.add(exercise.id)
    return true
  })
}