import type { ProgressSnapshot } from '../types'

export type LocalMissionStatus = 'new' | 'active' | 'completed' | 'claimed'

export interface LocalMission {
  id: string
  title: string
  description: string
  topicId?: string
  current: number
  target: number
  rewardXp: number
  status: LocalMissionStatus
}

interface MissionRule {
  id: string
  title: string
  description: string
  topicId?: string
  target: number
  rewardXp: number
  measure: (progress: ProgressSnapshot) => number
}

const missionRules: MissionRule[] = [
  {
    id: 'games-2',
    title: 'Completar 2 partidas',
    description: 'Cerrá dos partidas de cualquier juego.',
    target: 2,
    rewardXp: 20,
    measure: (progress) => hasCompleteHistory(progress) ? progress.gameHistory.length : progress.gamesPlayed,
  },
  {
    id: 'correct-5',
    title: 'Resolver 5 ejercicios',
    description: 'Sumá cinco respuestas correctas.',
    target: 5,
    rewardXp: 25,
    measure: (progress) => historyHasAnswerCounts(progress) ? sumHistory(progress, 'correctAnswers') : progress.correctAnswers,
  },
  {
    id: 'combo-3',
    title: 'Conseguir 3 correctas consecutivas',
    description: 'Mantené una racha de tres aciertos en una partida.',
    target: 3,
    rewardXp: 15,
    measure: (progress) => Math.max(0, ...progress.gameHistory.map((game) => game.bestCombo ?? 0)),
  },
  {
    id: 'practice-sin',
    title: 'Practicar Seno',
    description: 'Completá una partida del tema Seno.',
    topicId: 'sin',
    target: 1,
    rewardXp: 20,
    measure: (progress) => hasCompleteHistory(progress)
      ? progress.gameHistory.filter((game) => game.topicId === 'sin').length
      : progress.topicProgress.sin?.gamesPlayed ?? 0,
  },
  {
    id: 'xp-50',
    title: 'Ganar 50 XP',
    description: 'Acumulá 50 XP en tu progreso.',
    target: 50,
    rewardXp: 30,
    measure: (progress) => progress.xp,
  },
]

export function generateLocalMissions(progress: ProgressSnapshot): LocalMission[] {
  const claimed = new Set(progress.claimedMissionRewards ?? [])
  return missionRules.map((rule) => {
    const current = Math.max(0, Math.floor(rule.measure(progress)))
    const completed = current >= rule.target
    const isClaimed = claimed.has(rule.id)
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      ...(rule.topicId ? { topicId: rule.topicId } : {}),
      current: Math.min(current, rule.target),
      target: rule.target,
      rewardXp: rule.rewardXp,
      status: isClaimed ? 'claimed' : completed ? 'completed' : current > 0 ? 'active' : 'new',
    }
  })
}

function historyHasAnswerCounts(progress: ProgressSnapshot): boolean {
  return hasCompleteHistory(progress)
    && progress.gameHistory.every((game) => typeof game.correctAnswers === 'number')
}

function hasCompleteHistory(progress: ProgressSnapshot): boolean {
  return progress.gameHistory.length > 0 && progress.gameHistory.length >= progress.gamesPlayed
}

function sumHistory(progress: ProgressSnapshot, field: 'correctAnswers'): number {
  return progress.gameHistory.reduce((sum, game) => sum + (game[field] ?? 0), 0)
}