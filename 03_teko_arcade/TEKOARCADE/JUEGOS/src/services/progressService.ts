import type { GameHistoryEntry, ProgressSnapshot, TopicProgress, UserProgress } from '../types'

const STORAGE_KEY = 'teko-juegos-progress-v1'

const buildDefaultTopicProgress = (): Record<string, TopicProgress> => ({
  sin: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
  cos: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
  tan: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
  csc: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
  sec: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
  cot: { mastery: 0, stars: 0, gamesPlayed: 0, accuracy: 0, correctAnswers: 0, answersAttempted: 0, bestScore: 0, lastPlayed: '' },
})

const createDefaultUserProgress = (): UserProgress => ({
  xp: 0,
  streak: 0,
  correctAnswers: 0,
  answersAttempted: 0,
  lastActiveDate: '',
  lastTopic: 'sin',
  lastGame: 'triangle-forge',
  topicProgress: buildDefaultTopicProgress(),
  gameHistory: [],
  claimedMissionRewards: [],
})

const createDefaultSnapshot = (): ProgressSnapshot => ({
  ...createDefaultUserProgress(),
  stars: 0,
  mastery: 0,
  accuracy: 0,
  gamesPlayed: 0,
  commonErrors: ['signos', 'despeje', 'ángulos complementarios'],
})

const safeStorage = {
  get(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    return window.localStorage.getItem(STORAGE_KEY)
  },
  set(value: string): void {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, value)
  },
  remove(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  },
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function percentage(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0
}

function normalizeTopicProgress(value: Partial<TopicProgress> | undefined, fallback: TopicProgress): TopicProgress {
  return {
    ...fallback,
    ...value,
    mastery: percentage(value?.mastery),
    stars: Math.min(3, nonNegativeInteger(value?.stars)),
    gamesPlayed: nonNegativeInteger(value?.gamesPlayed),
    accuracy: percentage(value?.accuracy),
    correctAnswers: nonNegativeInteger(value?.correctAnswers),
    answersAttempted: nonNegativeInteger(value?.answersAttempted),
    bestScore: percentage(value?.bestScore),
    lastPlayed: typeof value?.lastPlayed === 'string' ? value.lastPlayed : '',
  }
}

function normalizeHistory(value: unknown): GameHistoryEntry[] {
  if (!Array.isArray(value)) return []

  return value.filter((entry): entry is GameHistoryEntry => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<GameHistoryEntry>
    return typeof candidate.sessionId === 'string'
      && typeof candidate.gameId === 'string'
      && typeof candidate.topicId === 'string'
      && typeof candidate.timestamp === 'string'
      && typeof candidate.score === 'number'
      && typeof candidate.accuracy === 'number'
      && typeof candidate.xp === 'number'
      && typeof candidate.stars === 'number'
  })
}

const normalizeUserProgress = (value?: Partial<UserProgress>): UserProgress => {
  const fallback = createDefaultUserProgress()
  const merged = { ...fallback, ...value }
  const defaultTopics = buildDefaultTopicProgress()
  const topicIds = new Set([...Object.keys(defaultTopics), ...Object.keys(value?.topicProgress ?? {})])
  merged.topicProgress = Object.fromEntries([...topicIds].map((topic) => [
    topic,
    normalizeTopicProgress(value?.topicProgress?.[topic], defaultTopics[topic] ?? {
      mastery: 0,
      stars: 0,
      gamesPlayed: 0,
      accuracy: 0,
      correctAnswers: 0,
      answersAttempted: 0,
      bestScore: 0,
      lastPlayed: '',
    }),
  ]))
  merged.xp = nonNegativeInteger(value?.xp)
  merged.streak = nonNegativeInteger(value?.streak)
  merged.correctAnswers = nonNegativeInteger(value?.correctAnswers)
  merged.answersAttempted = nonNegativeInteger(value?.answersAttempted)
  merged.gameHistory = normalizeHistory(value?.gameHistory)
  merged.claimedMissionRewards = Array.isArray(value?.claimedMissionRewards)
    ? [...new Set(value.claimedMissionRewards.filter((id): id is string => typeof id === 'string' && id.length > 0))]
    : []
  merged.lastActiveDate = typeof value?.lastActiveDate === 'string' ? value.lastActiveDate : ''
  merged.lastTopic = typeof value?.lastTopic === 'string' ? value.lastTopic : fallback.lastTopic
  merged.lastGame = typeof value?.lastGame === 'string' ? value.lastGame : fallback.lastGame

  return merged
}

const normalizeSnapshot = (value?: Partial<ProgressSnapshot>): ProgressSnapshot => {
  const normalized = normalizeUserProgress(value)
  const topicValues = Object.values(normalized.topicProgress)
  const totalMastery = topicValues.length
    ? Math.round(topicValues.reduce((sum, item) => sum + item.mastery, 0) / topicValues.length)
    : 0
  const totalGames = topicValues.reduce((sum, item) => sum + item.gamesPlayed, 0)
  const totalStars = topicValues.reduce((sum, item) => sum + item.stars, 0)
  const playedGames = topicValues.reduce((sum, item) => sum + item.gamesPlayed, 0)
  const totalAccuracy = playedGames
    ? Math.round(topicValues.reduce((sum, item) => sum + item.accuracy * item.gamesPlayed, 0) / playedGames)
    : 0

  return {
    ...normalized,
    stars: totalStars,
    mastery: totalMastery,
    accuracy: totalAccuracy,
    gamesPlayed: totalGames,
    commonErrors: value?.commonErrors ?? ['signos', 'despeje', 'ángulos complementarios'],
  }
}

export const progressService = {
  getUserProgress(): UserProgress {
    const raw = safeStorage.get()

    if (!raw) {
      return createDefaultUserProgress()
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserProgress>
      return normalizeUserProgress(parsed)
    } catch {
      return createDefaultUserProgress()
    }
  },

  getProgress(): ProgressSnapshot {
    const raw = safeStorage.get()

    if (!raw) {
      return createDefaultSnapshot()
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>
      return normalizeSnapshot(parsed)
    } catch {
      return createDefaultSnapshot()
    }
  },

  getTopicProgress(topic: string): TopicProgress {
    const userProgress = this.getUserProgress()
    const fallback = buildDefaultTopicProgress()[topic] ?? {
      mastery: 0,
      stars: 0,
      gamesPlayed: 0,
      accuracy: 0,
      bestScore: 0,
      lastPlayed: '',
    }

    return { ...fallback, ...(userProgress.topicProgress?.[topic] ?? {}) }
  },

  recordFinishedGame(input: {
    sessionId: string
    gameId: string
    topicId: string
    timestamp: string
    score: number
    accuracy: number
    xp: number
    stars: number
    correctAnswers: number
    attempts: number
    bestCombo?: number
  }): { progress: UserProgress; recorded: boolean } {
    const sessionId = input.sessionId.trim()
    if (!sessionId) throw new Error('A finished game session requires a sessionId.')

    const current = this.getUserProgress()
    if (current.gameHistory.some((game) => game.sessionId === sessionId)) {
      return { progress: current, recorded: false }
    }

    const parsedTimestamp = new Date(input.timestamp)
    const timestamp = Number.isNaN(parsedTimestamp.getTime()) ? new Date().toISOString() : parsedTimestamp.toISOString()
    const topic = current.topicProgress[input.topicId] ?? normalizeTopicProgress(undefined, {
      mastery: 0,
      stars: 0,
      gamesPlayed: 0,
      accuracy: 0,
      correctAnswers: 0,
      answersAttempted: 0,
      bestScore: 0,
      lastPlayed: '',
    })
    const attempts = nonNegativeInteger(input.attempts)
    const correctAnswers = Math.min(attempts, nonNegativeInteger(input.correctAnswers))
    const gameAccuracy = percentage(input.accuracy)
    const gamesPlayed = topic.gamesPlayed + 1
    const nextTopic: TopicProgress = {
      ...topic,
      gamesPlayed,
      correctAnswers: topic.correctAnswers + correctAnswers,
      answersAttempted: topic.answersAttempted + attempts,
      accuracy: Math.round((topic.accuracy * topic.gamesPlayed + gameAccuracy) / gamesPlayed),
      mastery: Math.round((topic.mastery * topic.gamesPlayed + gameAccuracy) / gamesPlayed),
      stars: Math.max(topic.stars, Math.min(3, nonNegativeInteger(input.stars))),
      bestScore: Math.max(topic.bestScore, gameAccuracy),
      lastPlayed: timestamp,
    }
    const historyEntry: GameHistoryEntry = {
      sessionId,
      gameId: input.gameId,
      topicId: input.topicId,
      timestamp,
      score: nonNegativeInteger(input.score),
      accuracy: gameAccuracy,
      xp: nonNegativeInteger(input.xp),
      stars: Math.min(3, nonNegativeInteger(input.stars)),
      correctAnswers,
      attempts,
      bestCombo: nonNegativeInteger(input.bestCombo),
    }

    current.topicProgress[input.topicId] = nextTopic
    current.correctAnswers += correctAnswers
    current.answersAttempted += attempts
    current.xp += historyEntry.xp
    current.lastGame = input.gameId
    current.lastTopic = input.topicId
    current.streak = updateStreak(current.streak, current.lastActiveDate, timestamp)
    current.lastActiveDate = timestamp
    current.gameHistory.push(historyEntry)

    const snapshot = normalizeSnapshot(current)
    safeStorage.set(JSON.stringify(snapshot))
    return { progress: snapshot, recorded: true }
  },

  claimMissionReward(missionId: string, amount: number): { progress: UserProgress; claimed: boolean } {
    const rewardId = missionId.trim()
    if (!rewardId) throw new Error('A mission reward requires an id.')

    const current = this.getUserProgress()
    if (current.claimedMissionRewards.includes(rewardId)) return { progress: current, claimed: false }

    current.claimedMissionRewards.push(rewardId)
    current.xp += nonNegativeInteger(amount)
    const snapshot = normalizeSnapshot(current)
    safeStorage.set(JSON.stringify(snapshot))
    return { progress: snapshot, claimed: true }
  },

  updateTopicProgress(topic: string, data: Partial<TopicProgress>): UserProgress {
    const current = this.getUserProgress()
    const currentTopic = this.getTopicProgress(topic)
    const nextTopic = { ...currentTopic, ...data }

    current.topicProgress[topic] = nextTopic
    const nextSnapshot = normalizeSnapshot(current)
    safeStorage.set(JSON.stringify(nextSnapshot))

    return current
  },

  addXP(amount: number): UserProgress {
    const current = this.getUserProgress()
    current.xp = Math.max(0, current.xp + amount)
    current.lastActiveDate = new Date().toISOString()

    safeStorage.set(JSON.stringify(normalizeSnapshot(current)))
    return current
  },

  setLastActivity(topic: string, game: string): UserProgress {
    const current = this.getUserProgress()
    current.lastTopic = topic
    current.lastGame = game
    current.lastActiveDate = new Date().toISOString()

    safeStorage.set(JSON.stringify(normalizeSnapshot(current)))
    return current
  },

  saveProgress(progress: Partial<ProgressSnapshot>): ProgressSnapshot {
    const next = normalizeSnapshot({ ...this.getProgress(), ...progress })
    safeStorage.set(JSON.stringify(next))
    return next
  },

  resetProgress(): ProgressSnapshot {
    const defaults = createDefaultSnapshot()
    safeStorage.remove()
    return defaults
  },
}

function updateStreak(streak: number, lastActiveDate: string, timestamp: string): number {
  if (!lastActiveDate) return 1
  const previous = new Date(lastActiveDate)
  const current = new Date(timestamp)
  if (Number.isNaN(previous.getTime())) return 1

  const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  const difference = dayNumber(current) - dayNumber(previous)
  if (difference === 0) return Math.max(1, streak)
  return difference === 1 ? streak + 1 : 1
}
