import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cscExercises } from '../../exercises/data/csc.ts'
import { sinExercises } from '../../exercises/data/sin.ts'
import { calculateRatioRushComboBonus, calculateRatioRushResultMetrics, createRatioRushRound, evaluateRatioRushAnswer, getRemainingTimeMs, isRatioRushTimeExpired } from './ratioRushEngine.ts'

test('builds repeatable multiple-choice rounds from local exercises and difficulty', () => {
  const config = { topicId: 'sin', difficulty: 'easy', sessionId: 'seed-a', roundNumber: 1, selectedExerciseId: 'sin-01' }
  const first = createRatioRushRound(sinExercises, config)
  const repeated = createRatioRushRound(sinExercises, config)

  assert.deepEqual(first, repeated)
  assert.equal(first.exercise.id, 'sin-01')
  assert.equal(first.choices.length, 4)
  assert.ok(first.choices.includes(first.exercise.expectedAnswer))
})

test('falls back to exact local text matching for concepts and recurring decimal answers', () => {
  assert.equal(evaluateRatioRushAnswer('sin', 'SIN'), true)
  assert.equal(evaluateRatioRushAnswer('1.666...', '1.666...'), true)
  assert.equal(evaluateRatioRushAnswer('1.666...', '1.67'), false)
  assert.ok(createRatioRushRound(cscExercises, {
    topicId: 'csc', difficulty: 'easy', sessionId: 'seed-b', roundNumber: 1, selectedExerciseId: 'csc-01',
  }).choices.includes('1.666...'))
})

test('rewards consecutive correct answers with a capped combo bonus', () => {
  assert.deepEqual([0, 1, 2, 5, 9].map(calculateRatioRushComboBonus), [0, 10, 20, 50, 50])
})

test('calculates completed, incorrect, total, and accuracy metrics', () => {
  assert.deepEqual(calculateRatioRushResultMetrics([
    { isCorrect: true },
    { isCorrect: false },
    { isCorrect: true },
  ], 2), {
    correctAnswers: 2,
    incorrectAttempts: 1,
    totalAttempts: 3,
    accuracy: 67,
    bestCombo: 2,
  })
})

test('expires at 60 seconds without allowing negative remaining time', () => {
  const remaining = getRemainingTimeMs(60_000, 10_000, 69_999)
  assert.equal(remaining, 1)
  assert.equal(isRatioRushTimeExpired(remaining), false)
  assert.equal(getRemainingTimeMs(60_000, 10_000, 70_000), 0)
  assert.equal(isRatioRushTimeExpired(0), true)
})