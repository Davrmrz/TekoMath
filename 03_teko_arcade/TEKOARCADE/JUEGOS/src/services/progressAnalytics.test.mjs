import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateProgressAnalytics } from './progressAnalytics.ts'

function topicProgress(overrides = {}) {
  const empty = { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' }
  return { sin: { ...empty }, cos: { ...empty }, ...overrides }
}

function makeProgress(overrides = {}) {
  return {
    xp: 70,
    streak: 4,
    correctAnswers: 20,
    answersAttempted: 25,
    lastActiveDate: '',
    lastTopic: 'sin',
    lastGame: 'triangle-forge',
    topicProgress: topicProgress(),
    gameHistory: [],
    claimedMissionRewards: [],
    stars: 0,
    mastery: 0,
    accuracy: 80,
    gamesPlayed: 0,
    commonErrors: [],
    ...overrides,
  }
}

test('derives overall and topic statistics from complete game history', () => {
  const analytics = calculateProgressAnalytics(makeProgress({
    gamesPlayed: 2,
    gameHistory: [
      { sessionId: 'one', gameId: 'graph-lab', topicId: 'sin', timestamp: '2026-09-25T10:00:00.000Z', score: 80, accuracy: 50, xp: 8, stars: 1, correctAnswers: 1, attempts: 2 },
      { sessionId: 'two', gameId: 'ratio-rush', topicId: 'sin', timestamp: '2026-09-26T10:00:00.000Z', score: 150, accuracy: 80, xp: 15, stars: 2, correctAnswers: 4, attempts: 5 },
    ],
  }))

  assert.equal(analytics.xp, 70)
  assert.equal(analytics.streak, 4)
  assert.equal(analytics.gamesPlayed, 2)
  assert.equal(analytics.correctAnswers, 5)
  assert.equal(analytics.answersAttempted, 7)
  assert.equal(analytics.accuracy, 71)
  assert.equal(analytics.mastery, 71)
  assert.equal(analytics.topicProgress.sin.stars, 2)
  assert.equal(analytics.topicProgress.sin.gamesPlayed, 2)
})

test('falls back to stored summaries for legacy or partial histories', () => {
  const analytics = calculateProgressAnalytics(makeProgress({
    gamesPlayed: 3,
    topicProgress: topicProgress({ sin: { mastery: 65, stars: 2, gamesPlayed: 3, accuracy: 65, correctAnswers: 13, answersAttempted: 20, bestScore: 80, lastPlayed: '' } }),
    gameHistory: [{ sessionId: 'old', gameId: 'triangle-forge', topicId: 'sin', timestamp: '2025-01-01', score: 50, accuracy: 60, xp: 5, stars: 1 }],
  }))

  assert.equal(analytics.gamesPlayed, 3)
  assert.equal(analytics.correctAnswers, 20)
  assert.equal(analytics.accuracy, 80)
  assert.equal(analytics.topicProgress.sin.mastery, 65)
})