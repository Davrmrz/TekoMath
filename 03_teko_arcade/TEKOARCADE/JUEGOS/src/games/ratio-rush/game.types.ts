import type { GameTemplateProps } from '../core/game.types'

export type RatioRushProps = GameTemplateProps

export interface RatioRushLocalState {
  selectedOption: string | null
  combo: number
  bestCombo: number
  timeRemainingMs: number
}