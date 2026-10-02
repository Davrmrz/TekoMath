import type { ProgressSnapshot, TopicProgress } from '../types'

export interface ProgressAnalytics {
  xp: number
  streak: number
  gamesPlayed: number
  correctAnswers: number
  answersAttempted: number
  accuracy: number
  mastery: number
  stars: number
  topicProgress: Record<string, TopicProgress>
}

export function calculateProgressAnalytics(progress: ProgressSnapshot): ProgressAnalytics {
  const history = progress.gameHistory
  const completeHistory = history.length > 0 && history.length >= progress.gamesPlayed
  const completeAnswerHistory = completeHistory && history.every((game) =>
    typeof game.correctAnswers === 'number' && typeof game.attempts === 'number',
  )
  const historyCorrect = completeAnswerHistory
    ? history.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0)
    : progress.correctAnswers
  const historyAttempts = completeAnswerHistory
    ? history.reduce((sum, game) => sum + (game.attempts ?? 0), 0)
    : progress.answersAttempted

  const topicProgress = Object.fromEntries(Object.entries(progress.topicProgress).map(([topicId, stored]) => {
    const topicHistory = completeHistory ? history.filter((game) => game.topicId === topicId) : []
    const hasTopicAnswers = topicHistory.length > 0 && topicHistory.every((game) =>
      typeof game.correctAnswers === 'number' && typeof game.attempts === 'number',
    )
    if (!hasTopicAnswers) return [topicId, stored]

    const correctAnswers = topicHistory.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0)
    const attempts = topicHistory.reduce((sum, game) => sum + (game.attempts ?? 0), 0)
    const accuracy = attempts === 0 ? 0 : Math.round((correctAnswers / attempts) * 100)
    return [topicId, {
      ...stored,
      gamesPlayed: topicHistory.length,
      correctAnswers,
      answersAttempted: attempts,
      accuracy,
      mastery: accuracy,
      stars: Math.max(...topicHistory.map((game) => game.stars), 0),
      bestScore: Math.max(...topicHistory.map((game) => game.accuracy), 0),
      lastPlayed: topicHistory.reduce((latest, game) => game.timestamp > latest ? game.timestamp : latest, ''),
    } satisfies TopicProgress]
  })) as Record<string, TopicProgress>

  const practicedTopics = Object.values(topicProgress).filter((topic) => topic.gamesPlayed > 0)
  const stars = Object.values(topicProgress).reduce((sum, topic) => sum + topic.stars, 0)

  return {
    xp: progress.xp,
    streak: progress.streak,
    gamesPlayed: completeHistory ? history.length : progress.gamesPlayed,
    correctAnswers: historyCorrect,
    answersAttempted: historyAttempts,
    accuracy: historyAttempts > 0
      ? Math.round((historyCorrect / historyAttempts) * 100)
      : progress.accuracy,
    mastery: practicedTopics.length > 0
      ? Math.round(practicedTopics.reduce((sum, topic) => sum + topic.mastery, 0) / practicedTopics.length)
      : progress.mastery,
    stars: stars || progress.stars,
    topicProgress,
  }
}