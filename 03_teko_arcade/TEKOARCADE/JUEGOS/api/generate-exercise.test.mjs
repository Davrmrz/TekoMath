import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateExercise } from '../src/services/localExerciseGenerator.ts'
import { createGeminiExerciseHandler } from './generate-exercise.ts'

const generationRequest = { topic: 'sin', difficulty: 'easy', gameId: 'triangle-forge' }

function makeExercise(seed = 'api-valid') {
  const generated = generateExercise({ ...generationRequest, seed })
  const exercise = { ...generated }
  delete exercise.metadata
  delete exercise.source
  return {
    ...exercise,
    knownValues: Object.fromEntries(Object.entries(exercise.knownValues).map(([key, value]) => [key, String(value)])),
  }
}

function createRequest(overrides = {}) {
  const { headers = {}, ...requestOverrides } = overrides
  return {
    method: 'POST',
    headers: {
      host: 'teko.test',
      origin: 'https://teko.test',
      'x-forwarded-proto': 'https',
      'content-type': 'application/json',
      'x-forwarded-for': '192.0.2.44',
      ...headers,
    },
    body: { request: generationRequest },
    ...requestOverrides,
  }
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body },
  }
}

function fakeGeminiResponse(value) {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

test('endpoint requests structured JSON with server-only credentials and validates before returning', async () => {
  const exercise = makeExercise()
  const logs = []
  let requestInit
  const handler = createGeminiExerciseHandler({
    apiKey: () => 'server-only-secret',
    fetcher: async (_url, init) => {
      requestInit = init
      return fakeGeminiResponse(exercise)
    },
    logger: (event) => logs.push(event),
  })
  const response = createResponse()

  await handler(createRequest(), response)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.source, 'ai')
  assert.equal(response.body.answer, exercise.answer)
  assert.equal(requestInit.headers['x-goog-api-key'], 'server-only-secret')
  const sentBody = JSON.parse(requestInit.body)
  assert.equal(sentBody.generationConfig.responseMimeType, 'application/json')
  assert.equal(sentBody.generationConfig.responseSchema.type, 'OBJECT')
  assert.equal(JSON.stringify(response.body).includes('server-only-secret'), false)
  assert.equal(JSON.stringify(logs).includes('server-only-secret'), false)
  assert.deepEqual(logs[0].event, 'generation_succeeded')
})

test('invalid model JSON, incorrect math, and upstream failures return safe errors', async () => {
  const invalidResponses = [
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{invalid' }] } }] }), { status: 200 }),
    fakeGeminiResponse({ ...makeExercise('wrong-math'), answer: '999' }),
    new Response('upstream secret detail', { status: 503 }),
  ]

  for (const upstreamResponse of invalidResponses) {
    const logs = []
    const handler = createGeminiExerciseHandler({
      apiKey: () => 'secret',
      fetcher: async () => upstreamResponse,
      logger: (event) => logs.push(event),
    })
    const response = createResponse()
    await handler(createRequest(), response)

    assert.ok(response.statusCode >= 500)
    assert.deepEqual(response.body, { error: 'Remote generation failed.' })
    assert.equal(JSON.stringify(logs).includes('upstream secret detail'), false)
  }
})

test('endpoint rejects cross-origin requests and missing server configuration', async () => {
  let calls = 0
  const handler = createGeminiExerciseHandler({
    apiKey: () => undefined,
    fetcher: async () => { calls += 1; return fakeGeminiResponse(makeExercise()) },
    logger: () => undefined,
  })
  const rejectedOrigin = createResponse()
  await handler(createRequest({ headers: { origin: 'https://attacker.test' } }), rejectedOrigin)
  assert.equal(rejectedOrigin.statusCode, 403)

  const rejectedScheme = createResponse()
  await handler(createRequest({ headers: { origin: 'http://teko.test', 'x-forwarded-for': '192.0.2.46' } }), rejectedScheme)
  assert.equal(rejectedScheme.statusCode, 403)

  const missingConfiguration = createResponse()
  await handler(createRequest({ headers: { 'x-forwarded-for': '192.0.2.45' } }), missingConfiguration)
  assert.equal(missingConfiguration.statusCode, 503)
  assert.equal(calls, 0)
})

test('upstream timeout is bounded and logged without response data', async () => {
  const logs = []
  const handler = createGeminiExerciseHandler({
    apiKey: () => 'secret',
    timeoutMs: 1,
    fetcher: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')))
    }),
    logger: (event) => logs.push(event),
  })
  const response = createResponse()

  await handler(createRequest(), response)

  assert.equal(response.statusCode, 504)
  assert.equal(logs[0].reason, 'timeout')
})

test('endpoint rate limits repeated requests from the same client', async () => {
  const handler = createGeminiExerciseHandler({
    apiKey: () => 'secret',
    fetcher: async () => fakeGeminiResponse(makeExercise('rate-limit')),
    logger: () => undefined,
  })
  let response
  for (let index = 0; index < 13; index += 1) {
    response = createResponse()
    await handler(createRequest(), response)
  }
  assert.equal(response.statusCode, 429)
})