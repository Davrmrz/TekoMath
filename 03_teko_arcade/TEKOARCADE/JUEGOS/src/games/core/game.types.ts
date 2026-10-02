import type { ReactNode } from 'react'
import type { GameDefinition } from '../../types'
import type { CompletionReason, GameFeedback, GameResult, GameSession, GameSessionStatus } from './engine.types'

export type GameTemplatePhase = GameSessionStatus
export type GameFeedbackKind = GameFeedback['kind']

export interface GameTemplateConfig {
  rounds: number
  instruction: string
  activityLabel: string
}

export interface GameTemplateProps {
  game: GameDefinition
  session: GameSession
}

export interface GameTemplateState {
  phase: GameTemplatePhase
  round: number
  rounds: number
  attempts: number
  score: number
  bestCombo?: number
  isFinalRound?: boolean
  isPaused: boolean
  feedback: GameFeedback | null
  result: GameResult | null
  start: () => void
  togglePause: () => void
  checkAnswer: (answer: string | number, ready: boolean) => void
  showHint: () => void
  continueRound: () => void
  abandon: (reason?: CompletionReason) => void
}

export interface GameTemplateFrameProps extends GameTemplateProps {
  config: GameTemplateConfig
  state: GameTemplateState
  interactionReady: boolean
  playerAnswer: string | number
  children: ReactNode
}