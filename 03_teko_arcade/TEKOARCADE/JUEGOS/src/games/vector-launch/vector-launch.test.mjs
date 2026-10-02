import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cosExercises } from '../../exercises/data/cos.ts'
import { sinExercises } from '../../exercises/data/sin.ts'
import { tanExercises } from '../../exercises/data/tan.ts'
import { calculateVectorComboBonus, calculateVectorResultMetrics, createVectorLaunchChallenges, evaluateVectorAnswer } from './vectorLaunchEngine.ts'
import { createVectorLaunchScene } from './vectorLaunchVisual.ts'

test('adapts bank exercises into angle, known component, and target component challenges', () => {
  const challenge = createVectorLaunchChallenges(sinExercises, 'sin', 'medium', 'session-a', 5, 'sin-03')[0]

  assert.equal(challenge.exercise.id, 'sin-03')
  assert.equal(challenge.angleDegrees, 53.13010235415598)
  assert.equal(challenge.knownComponent, 'catetoOpuesto')
  assert.equal(challenge.knownValue, 24)
  assert.equal(challenge.targetComponent, 'hipotenusa')
  assert.equal(challenge.expectedValue, 30)
  assert.equal(challenge.horizontalComponent, 18)
  assert.equal(challenge.verticalComponent, 24)
})

test('evaluates numeric answers and gives correct or failed launch ratios', () => {
  const challenge = createVectorLaunchChallenges(cosExercises, 'cos', 'medium', 'session-b', 5, 'cos-03')[0]

  assert.deepEqual(evaluateVectorAnswer(challenge, '20'), { correct: true, travelRatio: 1 })
  assert.deepEqual(evaluateVectorAnswer(challenge, '10'), { correct: false, travelRatio: 0.5 })
})

test('builds distinct bank-backed rounds deterministically by topic and difficulty', () => {
  const rounds = createVectorLaunchChallenges(tanExercises, 'tan', 'medium', 'session-c', 5, 'tan-03')
  const repeated = createVectorLaunchChallenges(tanExercises, 'tan', 'medium', 'session-c', 5, 'tan-03')

  assert.deepEqual(rounds, repeated)
  assert.equal(rounds.length, 5)
  assert.equal(rounds[0].exercise.id, 'tan-03')
})

test('creates an SVG scene with the target at the expected component endpoint', () => {
  const challenge = createVectorLaunchChallenges(sinExercises, 'sin', 'medium', 'session-a', 1, 'sin-03')[0]
  const correct = createVectorLaunchScene(challenge)
  const failed = createVectorLaunchScene(challenge, 0.5)

  assert.deepEqual(correct.landing, correct.target)
  assert.ok(failed.landing.x < failed.target.x)
  assert.ok(failed.landing.y > failed.target.y)
})

test('rewards combos and calculates final score metrics', () => {
  assert.deepEqual([0, 1, 2, 5, 8].map(calculateVectorComboBonus), [0, 10, 20, 40, 40])
  assert.deepEqual(calculateVectorResultMetrics([
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