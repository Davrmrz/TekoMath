import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAnswer } from '../engine/math/answerEvaluator.ts'
import { resolveTaskExercise } from './taskExerciseResolver.ts'

test('resolves a written trig exercise into a validated ExerciseDefinition', () => {
  const exercise = resolveTaskExercise(
    'Calculá seno(θ) si el cateto opuesto mide 6 y la hipotenusa 10.',
    { difficulty: 'easy', source: 'user-text' },
  )

  assert.ok(exercise)
  assert.equal(exercise.topic, 'sin')
  assert.equal(exercise.source, 'user-text')
  assert.equal(exercise.knownValues.catetoOpuesto, 6)
  assert.equal(exercise.knownValues.hipotenusa, 10)
  assert.equal(evaluateAnswer('0.6', exercise.answer, { format: 'numeric' }).correct, true)
  assert.ok(exercise.solution)
  assert.ok(exercise.hints.length > 0)
})

test('solves for a side from a known ratio and supports comma decimals', () => {
  const exercise = resolveTaskExercise(
    'Si seno(α) = 0,8 y el cateto opuesto mide 24, ¿cuánto mide la hipotenusa?',
    { difficulty: 'medium', source: 'user-text' },
  )

  assert.ok(exercise)
  assert.equal(exercise.unknown, 'hipotenusa')
  assert.equal(exercise.answer, '30')
})

test('manual topic can make otherwise unclassified text locally solvable', () => {
  const exercise = resolveTaskExercise(
    'Calculá la razón con cateto opuesto 5 y cateto adyacente 12.',
    { topic: 'tan', difficulty: 'easy', source: 'user-image' },
  )

  assert.ok(exercise)
  assert.equal(exercise.topic, 'tan')
  assert.equal(exercise.source, 'user-image')
  assert.equal(exercise.answer, '0.4166666667')
})

test('explicit manual topic takes precedence over parser topic detection', () => {
  const exercise = resolveTaskExercise(
    'Calculá la razón si el cateto opuesto mide 6, el adyacente 8 y la hipotenusa 10.',
    { topic: 'cos', difficulty: 'easy', source: 'user-text' },
  )

  assert.ok(exercise)
  assert.equal(exercise.topic, 'cos')
  assert.equal(exercise.unknown, 'cos(θ)')
  assert.equal(exercise.answer, '0.8')
})

test('an explicit function in the task wins over side-word parser heuristics', () => {
  const exercise = resolveTaskExercise(
    'Calculá cos(θ) si el cateto opuesto mide 6, el adyacente 8 y la hipotenusa 10.',
    { difficulty: 'easy', source: 'user-text' },
  )

  assert.ok(exercise)
  assert.equal(exercise.topic, 'cos')
  assert.equal(exercise.answer, '0.8')
})

test('returns null when the statement cannot produce a verifiable answer', () => {
  assert.equal(resolveTaskExercise('Ayudame con esta tarea.', { difficulty: 'easy', source: 'user-text' }), null)
  assert.equal(resolveTaskExercise(
    'Calculá seno(θ) con cateto opuesto 6, adyacente 8 e hipotenusa 11.',
    { difficulty: 'easy', source: 'user-text' },
  ), null)
})