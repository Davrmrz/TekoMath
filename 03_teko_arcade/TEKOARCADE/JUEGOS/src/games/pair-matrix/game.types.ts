import type { GameTemplateProps } from '../core/game.types'

export type PairMatrixProps = GameTemplateProps

export interface PairMatrixLocalState {
  selectedCards: string[]
  solvedCards: string[]
  solvedPairs: string[]
  combo: number
  bestCombo: number
  elapsedSeconds: number
}