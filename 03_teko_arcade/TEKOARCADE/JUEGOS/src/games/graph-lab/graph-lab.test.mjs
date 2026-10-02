import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateGraphComboBonus, calculateGraphResultMetrics, createGraphChallenge, evaluateGraphAnswer, evaluateGraphFunction, formatGraphAngle, generateGraphPath, getGraphBounds, graphPoint } from './graphEngine.ts'

test('evaluates the supported local functions at notable angles', () => {
  assert.equal(evaluateGraphFunction('sin', Math.PI / 6), 0.49999999999999994)
  assert.equal(evaluateGraphFunction('cos', 0), 1)
  assert.equal(evaluateGraphFunction('tan', Math.PI / 4), 0.9999999999999999)
  assert.equal(evaluateGraphFunction('tan', Math.PI / 2), null)
})

test('samples SVG curves and breaks tangent at asymptotes', () => {
  const sinePath = generateGraphPath('sin')
  const tangentPath = generateGraphPath('tan')
  assert.ok(sinePath.startsWith('M'))
  assert.ok((tangentPath.match(/M/g) ?? []).length > 2)
  assert.ok(!tangentPath.includes('NaN'))
  assert.equal(getGraphBounds('sin').yMin, -1.5)
  assert.equal(graphPoint('tan', Math.PI / 2), null)
})

test('creates value, maximum, and zero-point challenges for all functions', () => {
  for (const name of ['sin', 'cos', 'tan']) {
    assert.equal(createGraphChallenge(name, 1).kind, 'value')
    assert.equal(createGraphChallenge(name, 2).kind, name === 'tan' ? 'zero' : 'maximum')
    assert.equal(createGraphChallenge(name, 3).kind, 'zero')
    assert.ok(createGraphChallenge(name, 4).answerOptions.length >= 4)
  }
  assert.ok(createGraphChallenge('tan', 3).pointOptions.every((x) => graphPoint('tan', x) !== null))
})

test('checks graph answers and formats key angles', () => {
  const valueChallenge = createGraphChallenge('sin', 1)
  const zeroChallenge = createGraphChallenge('cos', 3)
  assert.equal(evaluateGraphAnswer(valueChallenge, valueChallenge.expectedAnswer), true)
  assert.equal(evaluateGraphAnswer(valueChallenge, '9'), false)
  assert.equal(evaluateGraphAnswer(zeroChallenge, '-1.5707963267948966'), true)
  assert.equal(formatGraphAngle(Math.PI / 2), 'π/2')
})

test('calculates graph combo rewards and final attempt metrics', () => {
  assert.deepEqual([0, 1, 2, 5].map(calculateGraphComboBonus), [0, 10, 20, 40])
  assert.deepEqual(calculateGraphResultMetrics([
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