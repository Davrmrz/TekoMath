import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAnswer } from '../engine/math/answerEvaluator.ts'
import { generatedExerciseProvider, generateExercise, generateExercises } from './localExerciseGenerator.ts'

test('generates repeatable valid ExerciseDefinitions with a seed', () => {
  const options = { topic: 'sin', difficulty: 'easy', seed: 'repeatable-seed' }
  const first = generateExercise(options)
  const second = generateExercise(options)

  assert.deepEqual(first, second)
  assert.equal(first.topic, 'sin')
  assert.equal(first.difficulty, 'easy')
  assert.equal(first.source, 'teko')
  assert.ok(first.statement.length > 0)
  assert.ok(first.solution.length > 0)
  assert.ok(first.hints.length > 0)
  assert.equal(typeof first.metadata.solution, 'string')
  assert.equal(evaluateAnswer(first.answer, first.answer, { format: 'numeric' }).correct, true)
})

test('generates calculable and coherent exercises for every initial topic and difficulty', () => {
  for (const topic of ['sin', 'cos', 'tan']) {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const exercise = generateExercise({ topic, difficulty, seed: `${topic}:${difficulty}` })
      const opposite = exercise.metadata.triangleOpposite
      const adjacent = exercise.metadata.triangleAdjacent
      const hypotenuse = exercise.metadata.triangleHypotenuse

      assert.equal(opposite ** 2 + adjacent ** 2, hypotenuse ** 2)
      assert.ok(opposite > 0 && adjacent > 0 && hypotenuse > 0)
      assert.ok(Number.isFinite(exercise.metadata.numericAnswer))
      assert.equal(evaluateAnswer(exercise.answer, exercise.answer, { format: 'numeric' }).correct, true)
      assert.ok(exercise.metadata.solution.length > 0)
      assert.ok(exercise.solution.length > 0)

      const ratioSides = topic === 'sin'
        ? opposite / hypotenuse
        : topic === 'cos'
          ? adjacent / hypotenuse
          : opposite / adjacent
      assert.ok(Math.abs(ratioSides - exercise.metadata.ratioValue) < 1e-9)
      if (difficulty === 'easy') assert.ok(Math.abs(Number(exercise.metadata.numericAnswer) - ratioSides) < 1e-9)
      else assert.ok([opposite, adjacent, hypotenuse].includes(Number(exercise.metadata.numericAnswer)))
    }
  }
})

test('batch generation is deterministic but produces distinct seeded exercises', () => {
  const first = generateExercises({ topic: 'cos', difficulty: 'medium', seed: 42, count: 8 })
  const second = generateExercises({ topic: 'cos', difficulty: 'medium', seed: 42, count: 8 })

  assert.deepEqual(first, second)
  assert.equal(new Set(first.map((exercise) => exercise.id)).size, first.length)
  assert.ok(new Set(first.map((exercise) => exercise.answer)).size > 1)
})

test('offline provider only generates the initial supported topics', () => {
  assert.equal(generatedExerciseProvider.getExercise('tan').topic, 'tan')
  assert.equal(generatedExerciseProvider.getExercises('sin').length, 5)
  assert.equal(generatedExerciseProvider.getExercise('csc'), null)
  assert.deepEqual(generatedExerciseProvider.getExercises('cot'), [])
})

test('rejects unsupported topics and invalid batch counts', () => {
  assert.throws(() => generateExercise({ topic: 'csc', difficulty: 'easy', seed: 1 }), /Unsupported topic/)
  assert.throws(() => generateExercises({ topic: 'sin', difficulty: 'easy', seed: 1, count: 0 }), /count must be/)
})