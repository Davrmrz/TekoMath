import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateScore, createGameSession, registerAttempt, startGame } from '../core/gameEngine.ts'
import { calculateComboBonus, getReciprocalPairId, pairMatrixCards, togglePairSelection } from './pairLogic.ts'

test('matches each trig ratio with its reciprocal in either selection order', () => {
  assert.equal(getReciprocalPairId('sin', 'csc'), 'sin-csc')
  assert.equal(getReciprocalPairId('csc', 'sin'), 'sin-csc')
  assert.equal(getReciprocalPairId('cos', 'sec'), 'cos-sec')
  assert.equal(getReciprocalPairId('tan', 'cot'), 'tan-cot')
})

test('rejects non-reciprocal and identical cards', () => {
  assert.equal(getReciprocalPairId('sin', 'cos'), null)
  assert.equal(getReciprocalPairId('sec', 'cot'), null)
  assert.equal(getReciprocalPairId('tan', 'tan'), null)
  assert.equal(pairMatrixCards.length, 6)
})

test('selection toggles cards, caps at two, and protects resolved cards', () => {
  assert.deepEqual(togglePairSelection([], 'sin'), ['sin'])
  assert.deepEqual(togglePairSelection(['sin'], 'sin'), [])
  assert.deepEqual(togglePairSelection(['sin'], 'csc'), ['sin', 'csc'])
  assert.deepEqual(togglePairSelection(['sin', 'cos'], 'tan'), ['tan'])
  assert.deepEqual(togglePairSelection([], 'sin', ['sin', 'csc']), [])
})

test('combo bonus increases with consecutive matches and is capped', () => {
  assert.equal(calculateComboBonus(1), 0)
  assert.equal(calculateComboBonus(2), 10)
  assert.equal(calculateComboBonus(3), 20)
  assert.equal(calculateComboBonus(6), 30)
})

test('combo bonus is added to shared GameSession scoring', () => {
  const exercise = {
    id: 'pair-matrix',
    topicId: 'csc',
    prompt: 'Emparejá las razones recíprocas.',
    difficulty: 'easy',
    source: 'teko',
    knownValues: {},
    unknown: 'parejas',
    expectedAnswer: 'sin-csc',
    hints: [],
  }
  let session = startGame(createGameSession({
    sessionId: 'pair-scoring-test',
    gameId: 'pair-matrix',
    topicId: 'csc',
    exercise,
    startedAt: new Date().toISOString(),
  }))

  session = registerAttempt(session, { value: 'sin:csc', submittedAt: new Date().toISOString() }, { isCorrect: true }, 'match-1')
  session = registerAttempt(session, { value: 'cos:sec', submittedAt: new Date().toISOString() }, { isCorrect: true }, 'match-2', calculateComboBonus(2))

  assert.equal(session.currentScore.points, 190)
  assert.equal(calculateScore(session.attempts).correctAnswers, 2)
})