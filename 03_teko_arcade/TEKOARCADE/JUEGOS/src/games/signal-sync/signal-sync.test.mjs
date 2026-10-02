import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cosExercises } from '../../exercises/data/cos.ts'
import { cotExercises } from '../../exercises/data/cot.ts'
import { cscExercises } from '../../exercises/data/csc.ts'
import { secExercises } from '../../exercises/data/sec.ts'
import { sinExercises } from '../../exercises/data/sin.ts'
import { tanExercises } from '../../exercises/data/tan.ts'
import { getTopicById } from '../../data/topics.ts'
import { createGameSession, registerAttempt, startGame } from '../core/gameEngine.ts'
import { calculateSignalComboBonus, calculateSignalSyncResultMetrics, createSignalSyncDeck, getSignalSyncStatus, isSignalMatch, isSignalSyncComplete, normalizeRoundCount, selectSignalCard } from './signalSyncData.ts'

function buildDeck(exercises, roundCount = 4, difficulty = 'easy') {
  const topic = getTopicById(exercises[0].topic)
  return createSignalSyncDeck(exercises, topic, {
    topicId: topic.id,
    difficulty,
    roundCount,
    selectedExerciseId: exercises[0].id,
  })
}

test('adapts the exercise bank into formula, sides, concept, and value matches', () => {
  const deck = buildDeck(sinExercises)

  assert.deepEqual(deck.map((match) => match.relation), [
    'ratio-formula',
    'ratio-sides',
    'concept-representation',
    'expression-value',
  ])
  assert.equal(deck[0].target, 'sin(θ) = opuesto / hipotenusa')
  assert.match(deck[1].target, /cateto opuesto 6.*hipotenusa 10/)
  assert.equal(deck[2].target, 'sin')
  assert.equal(deck[3].target, 'hipotenusa = 30')
})

test('selects and resolves matching cards without allowing solved pairs to return', () => {
  const first = selectSignalCard({ source: null, target: null }, 'source', 'sin-01', [])
  const both = selectSignalCard(first, 'target', 'sin-01', [])

  assert.equal(isSignalMatch(both), true)
  assert.deepEqual(selectSignalCard(both, 'source', 'sin-01', ['sin-01']), both)
  assert.deepEqual(selectSignalCard(both, 'source', 'sin-01', []), { source: null, target: 'sin-01' })
  assert.equal(isSignalMatch({ source: 'sin-01', target: 'cos-01' }), false)
})

test('reports all requested interaction states', () => {
  const status = (phase, source = null, target = null, feedbackKind = null, solvedPairs = 0) => getSignalSyncStatus({
    phase,
    selection: { source, target },
    feedbackKind,
    solvedPairs,
    totalPairs: 4,
  })

  assert.equal(status('ready'), 'waiting')
  assert.equal(status('playing', 'sin-01'), 'selected')
  assert.equal(status('feedback', 'sin-01', 'sin-01', 'correct'), 'correct')
  assert.equal(status('feedback', 'sin-01', 'cos-01', 'incorrect'), 'incorrect')
  assert.equal(status('playing', null, null, null, 1), 'next')
  assert.equal(status('completed'), 'completed')
})

test('increments consecutive-match bonuses with a cap', () => {
  assert.deepEqual([1, 2, 3, 6].map(calculateSignalComboBonus), [0, 10, 20, 30])
})

test('adds Signal Sync combo bonuses to shared session scoring', () => {
  const exercise = {
    id: 'signal-sync-test',
    topicId: 'sin',
    prompt: 'Asociá las representaciones.',
    difficulty: 'easy',
    source: 'teko',
    knownValues: {},
    unknown: 'asociacion',
    expectedAnswer: '',
    hints: [],
  }
  let session = startGame(createGameSession({
    sessionId: 'signal-sync-scoring-test',
    gameId: 'signal-sync',
    topicId: 'sin',
    exercise,
    startedAt: new Date().toISOString(),
  }))

  session = registerAttempt(session, { value: 'ratio:formula', submittedAt: new Date().toISOString() }, { isCorrect: true }, 'signal-match-1')
  session = registerAttempt(session, { value: 'concept:representation', submittedAt: new Date().toISOString() }, { isCorrect: true }, 'signal-match-2', calculateSignalComboBonus(2))

  assert.equal(session.currentScore.points, 190)
  assert.equal(session.currentScore.correctAnswers, 2)
})

test('calculates completion, correct pairs, incorrect attempts, and accuracy', () => {
  const metrics = calculateSignalSyncResultMetrics([
    { isCorrect: true },
    { isCorrect: false },
    { isCorrect: true },
    { isCorrect: null },
  ], 3)

  assert.equal(isSignalSyncComplete(3, 3), true)
  assert.equal(isSignalSyncComplete(2, 3), false)
  assert.deepEqual(metrics, {
    correctPairs: 2,
    incorrectAttempts: 1,
    totalAttempts: 4,
    accuracy: 50,
    bestCombo: 3,
  })
})

test('builds five varied offline associations for all six topic banks', () => {
  const banks = [sinExercises, cosExercises, tanExercises, cscExercises, secExercises, cotExercises]

  for (const exercises of banks) {
    const deck = buildDeck(exercises, 5)

    assert.equal(deck.length, 5, exercises[0].topic)
    assert.equal(new Set(deck.map((match) => match.source.toLocaleLowerCase())).size, 5, exercises[0].topic)
    assert.equal(new Set(deck.map((match) => match.target.toLocaleLowerCase())).size, 5, exercises[0].topic)
  }
})

test('uses topic difficulty when enough local exercises exist and clamps pair count to three through five', () => {
  const easyDeck = buildDeck(sinExercises, 3, 'easy')

  assert.equal(easyDeck.length, 3)
  assert.equal(easyDeck.some((match) => match.exerciseId === 'sin-03'), false)
  assert.equal(normalizeRoundCount(1), 3)
  assert.equal(normalizeRoundCount(4), 4)
  assert.equal(normalizeRoundCount(9), 5)
})