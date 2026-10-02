import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sinExercises } from '../../exercises/data/sin.ts'
import { createTriangleForgeExerciseSet, evaluateTriangleForgeAnswer, getAnswerInputMode, getTriangleHighlights, toTriangleForgeExercise } from './gameLogic.ts'

test('starts with the selected bank exercise and builds exactly three rounds', () => {
  const selected = toTriangleForgeExercise(sinExercises[2])
  const rounds = createTriangleForgeExerciseSet(selected, sinExercises)

  assert.equal(rounds.length, 3)
  assert.equal(rounds[0].id, selected.id)
  assert.equal(new Set(rounds.map((exercise) => exercise.id)).size, 3)
})

test('falls back to the local bank for an exercise without a bank answer', () => {
  const custom = { ...toTriangleForgeExercise(sinExercises[0]), id: 'custom' }
  const rounds = createTriangleForgeExerciseSet(custom, sinExercises)

  assert.equal(rounds[0].id, sinExercises[0].id)
  assert.equal(rounds.length, 3)
})

test('evaluates numeric and text answers offline without revealing the solution on errors', () => {
  const numeric = toTriangleForgeExercise(sinExercises[0])
  const text = toTriangleForgeExercise(sinExercises[1])

  assert.equal(evaluateTriangleForgeAnswer(numeric, '3/5').isCorrect, true)
  assert.equal(evaluateTriangleForgeAnswer(text, 'SIN').isCorrect, true)
  assert.equal(getAnswerInputMode(numeric), 'decimal')
  assert.equal(getAnswerInputMode(text), 'text')
  const incorrect = evaluateTriangleForgeAnswer(numeric, '0.7')
  assert.equal(incorrect.isCorrect, false)
  assert.equal(incorrect.message?.includes(numeric.expectedAnswer), false)
})

test('highlights sides according to the unknown and trigonometric topic', () => {
  const sine = getTriangleHighlights(toTriangleForgeExercise(sinExercises[0]))
  const hypotenuse = getTriangleHighlights(toTriangleForgeExercise(sinExercises[2]))

  assert.deepEqual(sine, { opposite: true, adjacent: false, hypotenuse: true, angle: true })
  assert.deepEqual(hypotenuse, { opposite: false, adjacent: false, hypotenuse: true, angle: false })
})