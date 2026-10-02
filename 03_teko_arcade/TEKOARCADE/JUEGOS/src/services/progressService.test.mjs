import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { missionService } from './missionService.ts'
import { progressService } from './progressService.ts'

const storage = new Map()
const previousWindow = globalThis.window
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
}

after(() => {
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
})

test('keeps existing v1 progress and records a finished session once', () => {
  storage.set('teko-juegos-progress-v1', JSON.stringify({
    xp: 70,
    streak: 2,
    lastActiveDate: '2026-09-25T12:00:00.000Z',
    lastTopic: 'cos',
    lastGame: 'signal-sync',
    topicProgress: {
      sin: { mastery: 37, stars: 1, gamesPlayed: 2, accuracy: 75, bestScore: 80, lastPlayed: '2026-09-24T12:00:00.000Z' },
    },
  }))

  const legacy = progressService.getProgress()
  assert.equal(legacy.xp, 70)
  assert.equal(legacy.topicProgress.sin.mastery, 37)
  assert.equal(legacy.topicProgress.sin.accuracy, 75)
  assert.equal(legacy.topicProgress.sin.gamesPlayed, 2)
  assert.deepEqual(legacy.gameHistory, [])

  const finishedGame = {
    sessionId: 'session-unique-1',
    gameId: 'triangle-forge',
    topicId: 'sin',
    timestamp: '2026-09-26T12:00:00.000Z',
    score: 150,
    accuracy: 75,
    xp: 15,
    stars: 2,
    correctAnswers: 3,
    attempts: 4,
    bestCombo: 3,
  }
  const first = progressService.recordFinishedGame(finishedGame)
  const duplicate = progressService.recordFinishedGame(finishedGame)

  assert.equal(first.recorded, true)
  assert.equal(duplicate.recorded, false)
  assert.equal(first.progress.xp, 85)
  assert.equal(duplicate.progress.xp, 85)
  assert.equal(first.progress.streak, 3)
  assert.equal(first.progress.lastGame, 'triangle-forge')
  assert.equal(first.progress.lastTopic, 'sin')
  assert.equal(first.progress.correctAnswers, 3)
  assert.equal(first.progress.answersAttempted, 4)
  assert.equal(first.progress.topicProgress.sin.gamesPlayed, 3)
  assert.equal(first.progress.topicProgress.sin.accuracy, 75)
  assert.equal(first.progress.topicProgress.sin.mastery, 50)
  assert.equal(first.progress.topicProgress.sin.stars, 2)
  assert.deepEqual(first.progress.gameHistory, [{
    sessionId: 'session-unique-1',
    gameId: 'triangle-forge',
    topicId: 'sin',
    timestamp: '2026-09-26T12:00:00.000Z',
    score: 150,
    accuracy: 75,
    xp: 15,
    stars: 2,
    correctAnswers: 3,
    attempts: 4,
    bestCombo: 3,
  }])
})

test('claims a mission reward once and persists its claim with XP', () => {
  storage.clear()
  const first = progressService.claimMissionReward('sin-correctas-5', 25)
  const duplicate = progressService.claimMissionReward('sin-correctas-5', 25)

  assert.equal(first.claimed, true)
  assert.equal(duplicate.claimed, false)
  assert.equal(first.progress.xp, 25)
  assert.equal(duplicate.progress.xp, 25)
  assert.deepEqual(first.progress.claimedMissionRewards, ['sin-correctas-5'])
})

test('mission service only claims completed rules and awards their XP once', () => {
  storage.clear()
  for (const sessionId of ['mission-session-1', 'mission-session-2']) {
    progressService.recordFinishedGame({
      sessionId,
      gameId: 'graph-lab',
      topicId: 'sin',
      timestamp: '2026-09-26T12:00:00.000Z',
      score: 50,
      accuracy: 100,
      xp: 5,
      stars: 1,
      correctAnswers: 1,
      attempts: 1,
    })
  }

  assert.equal(missionService.claimReward('correct-5').claimed, false)
  assert.deepEqual(missionService.claimReward('games-2'), { claimed: true, xp: 20 })
  assert.deepEqual(missionService.claimReward('games-2'), { claimed: false, xp: 0 })
  assert.equal(progressService.getUserProgress().xp, 30)
  assert.equal(missionService.getMissions().find((mission) => mission.id === 'games-2')?.status, 'claimed')
})

test('does not increase the streak for another finished game on the same day', () => {
  storage.clear()
  progressService.recordFinishedGame({
    sessionId: 'same-day-1',
    gameId: 'triangle-forge',
    topicId: 'cos',
    timestamp: '2026-09-26T08:00:00.000Z',
    score: 100,
    accuracy: 100,
    xp: 10,
    stars: 3,
    correctAnswers: 3,
    attempts: 3,
  })
  const second = progressService.recordFinishedGame({
    sessionId: 'same-day-2',
    gameId: 'triangle-forge',
    topicId: 'cos',
    timestamp: '2026-09-26T18:00:00.000Z',
    score: 80,
    accuracy: 80,
    xp: 8,
    stars: 2,
    correctAnswers: 2,
    attempts: 3,
  })

  assert.equal(second.progress.streak, 1)
  assert.equal(second.progress.topicProgress.cos.gamesPlayed, 2)
  assert.equal(second.progress.topicProgress.cos.accuracy, 90)
  assert.equal(second.progress.gameHistory.length, 2)
})