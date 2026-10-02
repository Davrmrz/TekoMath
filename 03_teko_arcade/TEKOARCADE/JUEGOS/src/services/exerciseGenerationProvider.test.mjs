import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateExercise } from './localExerciseGenerator.ts'
import {
  GeminiProvider,
  LocalScriptProvider,
  RemoteAIProvider,
} from './exerciseGenerationProvider.ts'
import { NetworkManager } from './networkManager.ts'

const request = { topic: 'sin', difficulty: 'easy', gameId: 'triangle-forge' }

function onlineNetwork() {
  const network = new NetworkManager({ isOnline: () => true })
  network.markSuccess(10)
  return network
}

function remoteProvider(payload, options = {}) {
  return new RemoteAIProvider({
    endpoint: 'https://exercise-service.invalid/generate',
    network: onlineNetwork(),
    fetcher: async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
    }),
    ...options,
  })
}

test('local script provider returns a normalized, mathematically valid exercise', async () => {
  const exercise = await new LocalScriptProvider().generateExercise(request)

  assert.equal(exercise.source, 'teko')
  assert.equal(exercise.topic, request.topic)
  assert.equal(exercise.difficulty, request.difficulty)
  assert.match(exercise.id, /^generated-/)
  assert.ok(exercise.solution)
})

test('remote provider validates then normalizes the remote exercise', async () => {
  const raw = generateExercise({ ...request, seed: 'remote-good' })
  raw.statement = '  Calculá   sin(θ) con los lados conocidos.  '
  raw.source = 'user-image'
  raw.unexpected = 'discard this field'
  const exercise = await remoteProvider(raw).generateExercise(request)

  assert.equal(exercise.source, 'ai')
  assert.equal(exercise.statement, 'Calculá sin(θ) con los lados conocidos.')
  assert.equal('unexpected' in exercise, false)
})

test('online-poor connectivity can attempt the optional remote provider', async () => {
  const raw = generateExercise({ ...request, seed: 'poor-network-remote' })
  const network = new NetworkManager({ isOnline: () => true })
  let calls = 0
  const provider = remoteProvider(raw, {
    network,
    fetcher: async () => {
      calls += 1
      return { ok: true, status: 200, json: async () => raw }
    },
  })

  const exercise = await provider.generateExercise(request)
  assert.equal(calls, 1)
  assert.equal(exercise.source, 'ai')
})

test('Gemini provider uses only the same-origin backend endpoint', async () => {
  let calledUrl
  const provider = new GeminiProvider({
    network: onlineNetwork(),
    fetcher: async (url) => {
      calledUrl = url
      return {
        ok: true,
        status: 200,
        json: async () => generateExercise({ ...request, seed: 'gemini-endpoint' }),
      }
    },
  })

  await provider.generateExercise(request)
  assert.equal(calledUrl, '/api/generate-exercise')
})

test('invalid schema, unsafe text, and incorrect math all fall back locally', async () => {
  const valid = generateExercise({ ...request, seed: 'remote-invalid' })
  const invalidResponses = [
    null,
    { ...valid, statement: '<script>alert(1)</script>' },
    { ...valid, answer: '999' },
    { ...valid, knownValues: { ...valid.knownValues, catetoAdyacente: 2 } },
    { ...valid, difficulty: 'hard' },
  ]

  for (const payload of invalidResponses) {
    const exercise = await remoteProvider(payload).generateExercise(request)
    assert.equal(exercise.source, 'teko')
    assert.equal(exercise.topic, request.topic)
    assert.equal(exercise.difficulty, request.difficulty)
  }
})

test('offline network skips the remote transport and uses local scripts', async () => {
  let calls = 0
  const provider = remoteProvider({}, {
    network: new NetworkManager({ isOnline: () => false }),
    fetcher: async () => {
      calls += 1
      throw new Error('should not be called')
    },
  })

  const exercise = await provider.generateExercise(request)
  assert.equal(calls, 0)
  assert.equal(exercise.source, 'teko')
})

test('remote HTTP errors and client timeouts fall back to local scripts', async () => {
  const failures = [
    { fetcher: async () => ({ ok: false, status: 503, json: async () => ({}) }) },
    { fetcher: async () => { throw new Error('connection lost') } },
    {
      timeoutMs: 1,
      fetcher: (_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('request aborted')))
      }),
    },
  ]

  for (const failure of failures) {
    const exercise = await remoteProvider({}, failure).generateExercise(request)
    assert.equal(exercise.source, 'teko')
  }
})

test('local provider validates supported bank topics as well as generated topics', async () => {
  const exercise = await new LocalScriptProvider().generateExercise({
    topic: 'csc',
    difficulty: 'medium',
    gameId: 'signal-sync',
  })

  assert.equal(exercise.topic, 'csc')
  assert.equal(exercise.difficulty, 'medium')
  assert.equal(exercise.source, 'teko')
})