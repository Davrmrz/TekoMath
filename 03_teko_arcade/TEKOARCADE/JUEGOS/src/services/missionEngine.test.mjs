import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateLocalMissions } from './missionEngine.ts'

function makeProgress(overrides = {}) {
  const emptyTopic = { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' }
  return {
    xp: 0,
    streak: 0,
    correctAnswers: 0,
    answersAttempted: 0,
    lastActiveDate: '',
    lastTopic: 'sin',
    lastGame: 'triangle-forge',
    topicProgress: { sin: { ...emptyTopic }, cos: { ...emptyTopic }, tan: { ...emptyTopic }, csc: { ...emptyTopic }, sec: { ...emptyTopic }, cot: { ...emptyTopic } },
    gameHistory: [],
    claimedMissionRewards: [],
    stars: 0,
    mastery: 0,
    accuracy: 0,
    gamesPlayed: 0,
    commonErrors: [],
    ...overrides,
  }
}

test('generates deterministic missions from real history and XP rules', () => {
  const progress = makeProgress({
    xp: 45,
    gamesPlayed: 2,
    correctAnswers: 7,
    gameHistory: [
      { sessionId: 'one', gameId: 'vector-launch', topicId: 'sin', timestamp: '2026-09-26', score: 110, accuracy: 75, xp: 11, stars: 2, correctAnswers: 3, attempts: 4, bestCombo: 3 },
      { sessionId: 'two', gameId: 'graph-lab', topicId: 'cos', timestamp: '2026-09-26', score: 200, accuracy: 80, xp: 20, stars: 2, correctAnswers: 4, attempts: 5, bestCombo: 2 },
    ],
  })
  const missions = generateLocalMissions(progress)

  assert.deepEqual(missions.map((mission) => mission.id), ['games-2', 'correct-5', 'combo-3', 'practice-sin', 'xp-50'])
  assert.equal(missions.find((mission) => mission.id === 'games-2').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'correct-5').current, 5)
  assert.equal(missions.find((mission) => mission.id === 'combo-3').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'practice-sin').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'xp-50').status, 'active')
  assert.deepEqual(generateLocalMissions(progress), missions)
})

test('uses legacy progress aggregates when old history has no detail fields', () => {
  const missions = generateLocalMissions(makeProgress({
    xp: 50,
    gamesPlayed: 2,
    correctAnswers: 5,
    topicProgress: { sin: { mastery: 70, stars: 2, gamesPlayed: 1, accuracy: 70, correctAnswers: 2, answersAttempted: 3, bestScore: 70, lastPlayed: '' } },
    gameHistory: [{ sessionId: 'legacy', gameId: 'triangle-forge', topicId: 'cos', timestamp: '2025-01-01', score: 80, accuracy: 70, xp: 8, stars: 2 }],
  }))

  assert.equal(missions.find((mission) => mission.id === 'correct-5').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'games-2').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'practice-sin').status, 'completed')
  assert.equal(missions.find((mission) => mission.id === 'xp-50').status, 'completed')
})

test('marks claimed mission rules as claimed', () => {
  const mission = generateLocalMissions(makeProgress({ gamesPlayed: 2, claimedMissionRewards: ['games-2'] }))
    .find((item) => item.id === 'games-2')

  assert.equal(mission.status, 'claimed')
})