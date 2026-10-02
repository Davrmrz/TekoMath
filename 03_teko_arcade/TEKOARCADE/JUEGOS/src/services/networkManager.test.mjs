import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NetworkManager } from './networkManager.ts'

test('navigator offline always selects OFFLINE', async () => {
  const manager = new NetworkManager({ isOnline: () => false })
  const health = await manager.healthCheck()

  assert.equal(manager.getState(), 'OFFLINE')
  assert.equal(health.online, false)
  assert.equal(health.apiAvailable, false)
  assert.equal(health.latency, null)
})

test('navigator online without a configured health endpoint remains ONLINE_POOR', async () => {
  const manager = new NetworkManager({ isOnline: () => true })
  const health = await manager.healthCheck()

  assert.equal(health.state, 'ONLINE_POOR')
  assert.equal(health.apiAvailable, false)
  assert.equal(health.latency, null)
})

test('classifies successful health checks by measured latency', async () => {
  let now = 100
  const fast = new NetworkManager({
    healthUrl: '/health',
    isOnline: () => true,
    now: () => now += 40,
    fetcher: async () => ({ ok: true }),
  })
  const fastHealth = await fast.healthCheck()

  assert.equal(fastHealth.state, 'ONLINE_GOOD')
  assert.equal(fastHealth.apiAvailable, true)
  assert.equal(fastHealth.latency, 40)

  let slowNow = 0
  const slow = new NetworkManager({
    healthUrl: '/health',
    goodLatencyMs: 100,
    isOnline: () => true,
    now: () => {
      slowNow += slowNow === 0 ? 1 : 180
      return slowNow
    },
    fetcher: async () => ({ ok: true }),
  })
  assert.equal((await slow.healthCheck()).state, 'ONLINE_POOR')
})

test('tracks recent provider failures and demotes ONLINE_GOOD', () => {
  let currentTime = 1000
  const manager = new NetworkManager({ isOnline: () => true, now: () => currentTime })
  manager.markSuccess(10)
  assert.equal(manager.getState(), 'ONLINE_GOOD')

  manager.markFailure()
  assert.equal(manager.getState(), 'ONLINE_POOR')
  assert.equal(manager.getHealth().recentFailures, 1)

  currentTime += 31_000
  assert.equal(manager.getHealth().recentFailures, 0)
})

test('times out health requests and records them as recent failures', async () => {
  const manager = new NetworkManager({
    healthUrl: '/health',
    timeoutMs: 0,
    isOnline: () => true,
    fetcher: () => new Promise(() => undefined),
  })
  const health = await manager.healthCheck()

  assert.equal(health.state, 'ONLINE_POOR')
  assert.equal(health.apiAvailable, false)
  assert.equal(health.recentFailures, 1)
})