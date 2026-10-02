export type TopicCategory = 'principal' | 'inverse'

export type SourceType = 'teko' | 'user-text' | 'user-image' | 'teacher' | 'ai'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type GameResult = 'pending' | 'success' | 'partial' | 'failed'

export type NetworkState = 'OFFLINE' | 'ONLINE_POOR' | 'ONLINE_GOOD'

export interface TopicDefinition {
  id: string
  name: string
  shortName: string
  description: string
  order: number
  formula: string
  category: TopicCategory
}

export interface ExerciseDefinition {
  id: string
  topic: string
  statement: string
  difficulty: Difficulty
  source: SourceType
  knownValues: Record<string, number | string>
  unknown: string
  answer: string
  solution?: string
  hints: string[]
  metadata?: Record<string, string | number | boolean | undefined>
}

export interface GameDefinition {
  id: string
  name: string
  description: string
  supportedTopics: string[]
  difficulty: Difficulty
  icon: string
}

export interface TopicProgress {
  mastery: number
  stars: number
  gamesPlayed: number
  accuracy: number
  correctAnswers: number
  answersAttempted: number
  bestScore: number
  lastPlayed: string
}

export interface GameHistoryEntry {
  sessionId: string
  gameId: string
  topicId: string
  timestamp: string
  score: number
  accuracy: number
  xp: number
  stars: number
  correctAnswers?: number
  attempts?: number
  bestCombo?: number
}

export interface UserProgress {
  xp: number
  streak: number
  correctAnswers: number
  answersAttempted: number
  lastActiveDate: string
  lastTopic: string
  lastGame: string
  topicProgress: Record<string, TopicProgress>
  gameHistory: GameHistoryEntry[]
  claimedMissionRewards: string[]
}

export interface GameSessionDefinition {
  sessionId?: string
  roundCount?: number
  exerciseDefinition?: ExerciseDefinition
  user: string
  topic: string
  exercise: string
  exerciseId: string
  gameId: string
  source: SourceType
  mode: 'online' | 'offline'
  date: string
  result: GameResult
  difficulty: Difficulty
}

export interface ProgressSnapshot extends UserProgress {
  stars: number
  mastery: number
  accuracy: number
  gamesPlayed: number
  commonErrors: string[]
}

export interface OfflineExerciseProvider {
  getExercise(topic: string): ExerciseDefinition | null
  getExercises(topic: string): ExerciseDefinition[]
}

export interface OnlineExerciseProvider {
  getExercise(topic: string): Promise<ExerciseDefinition | null>
  getExercises(topic: string): Promise<ExerciseDefinition[]>
}

export interface NetworkHealth {
  state: NetworkState
  online: boolean
  latency: number | null
  apiAvailable: boolean
  recentFailures: number
}
