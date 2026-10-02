import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAnswer } from './answerEvaluator.ts'
import { cosExercises } from '../../exercises/data/cos.ts'
import { cotExercises } from '../../exercises/data/cot.ts'
import { cscExercises } from '../../exercises/data/csc.ts'
import { secExercises } from '../../exercises/data/sec.ts'
import { sinExercises } from '../../exercises/data/sin.ts'
import { tanExercises } from '../../exercises/data/tan.ts'

test('accepts integer, negative, decimal point and decimal comma equivalents', () => {
  assert.equal(evaluateAnswer(12, '12').correct, true)
  assert.equal(evaluateAnswer(-2.5, '-2,5').correct, true)
  assert.equal(evaluateAnswer('0,5', '0.5').correct, true)
})

test('accepts simple fractions and equivalent decimal values', () => {
  assert.equal(evaluateAnswer('1/2', '0.5').correct, true)
  assert.equal(evaluateAnswer('8/6', '4/3').correct, true)
  assert.equal(evaluateAnswer('-3/4', '-0,75').correct, true)
})

test('normalizes percentages when the expected format is a percentage', () => {
  assert.equal(evaluateAnswer('50%', '0.5').correct, true)
  assert.equal(evaluateAnswer('50%', '50').correct, true)
  assert.equal(evaluateAnswer(50, 0.5, { format: 'percentage' }).correct, true)
})

test('applies absolute and relative numeric tolerances', () => {
  assert.equal(evaluateAnswer(1, 1.0005, { absoluteTolerance: 0.001, relativeTolerance: 0 }).correct, true)
  assert.equal(evaluateAnswer(100, 100.0009, { absoluteTolerance: 0, relativeTolerance: 1e-5 }).correct, true)
  assert.equal(evaluateAnswer(100, 100.01, { absoluteTolerance: 0, relativeTolerance: 1e-5 }).correct, false)
})

test('reports incorrect values and invalid denominators distinctly', () => {
  assert.equal(evaluateAnswer('3/5', '0.7').reason, 'incorrect')
  assert.equal(evaluateAnswer('1/0', '1').reason, 'division-by-zero')
  assert.equal(evaluateAnswer('4', 'abc').reason, 'invalid-input')
})

test('supports exact text answers case-insensitively', () => {
  assert.equal(evaluateAnswer('sin', ' SIN ', { format: 'text' }).correct, true)
  assert.equal(evaluateAnswer('sin(θ) = 5/13', 'SIN(θ)=5/13', { format: 'text' }).correct, false)
  assert.equal(evaluateAnswer('sin(θ) = 5/13', 'sin(θ) = 5/13', { format: 'text' }).correct, true)
})

test('audits all 30 bank answers and identifies the recurring-decimal target', () => {
  const exerciseBank = [...sinExercises, ...cosExercises, ...tanExercises, ...cscExercises, ...secExercises, ...cotExercises]
  assert.equal(exerciseBank.length, 30)

  const textTargets = new Set(['razon', 'funcion', 'expresion'])
  const numericAnswers = exerciseBank.filter((exercise) => !textTargets.has(exercise.unknown))
  const invalidNumericTargets = numericAnswers
    .filter((exercise) => !evaluateAnswer(exercise.answer, exercise.answer, { format: 'numeric' }).correct)
    .map((exercise) => exercise.id)

  assert.deepEqual(invalidNumericTargets, ['csc-01'])
  assert.equal(evaluateAnswer('sin(θ) = 5/13', 'sin(θ) = 5/13', { format: 'text' }).correct, true)
})