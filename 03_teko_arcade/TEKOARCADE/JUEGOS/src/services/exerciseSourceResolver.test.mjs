import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NetworkManager } from './networkManager.ts'
import { resolveExercises } from './exerciseSourceResolver.ts'

const localExercise = {
  id: 'sin-local-1',
  topic: 'sin',
  statement: 'Calculá seno.',
  difficulty: 'easy',
  source: 'teko',
  knownValues: { catetoOpuesto: 3, hipotenusa: 5 },
  unknown: 'sin(θ)',
  answer: '3/5',
  solution: '3/5',
  hints: ['opuesto / hipotenusa'],
}

const onlineExercise = { ...localExercise, id: 'sin-online-1', statement: 'Seno remoto.' }

function managerWithState(state) {
  const manager = new NetworkManager({ isOnline: () => state !== 'OFFLINE' })
  if (state === 'ONLINE_GOOD') manager.markSuccess(20)
  return manager
}

test('OFFLINE and ONLINE_POOR return local exercises without calling online provider', () => {
  for (const state of ['OFFLINE', 'ONLINE_POOR']) {
    let calls = 0
    const result = resolveExercises('sin', {
      onlineProvider: { getExercises: async () => { calls += 1; return [onlineExercise] } },
    }, {
      network: managerWithState(state),
      getLocalExercises: () => [localExercise],
    })

    assert.deepEqual(result.exercises, [localExercise])
    assert.equal(result.source, 'local')
    assert.equal(result.onlineRefresh, null)
    assert.equal(calls, 0)
  }
})

test('ONLINE_GOOD returns local immediately and exposes a successful online refresh', async () => {
  let resolveProvider
  const providerPromise = new Promise((resolve) => { resolveProvider = resolve })
  const result = resolveExercises('sin', {
    onlineProvider: { getExercises: () => providerPromise },
  }, {
    network: managerWithState('ONLINE_GOOD'),
    getLocalExercises: () => [localExercise],
    now: () => 100,
  })

  assert.deepEqual(result.exercises, [localExercise])
  assert.ok(result.onlineRefresh instanceof Promise)
  resolveProvider([onlineExercise])
  assert.deepEqual(await result.onlineRefresh, [onlineExercise])
})

test('online provider rejection and timeout both fall back to local exercises', async () => {
  for (const onlineProvider of [
    { getExercises: async () => { throw new Error('offline') } },
    { getExercises: () => new Promise(() => undefined) },
  ]) {
    const manager = managerWithState('ONLINE_GOOD')
    const result = resolveExercises('sin', {
      onlineProvider,
      onlineTimeoutMs: 0,
    }, {
      network: manager,
      getLocalExercises: () => [localExercise],
    })

    assert.deepEqual(result.exercises, [localExercise])
    assert.deepEqual(await result.onlineRefresh, [localExercise])
    assert.equal(manager.getState(), 'ONLINE_POOR')
  }
})