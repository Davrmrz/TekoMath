import type { GameTemplateProps } from '../core/game.types'

export type VectorLaunchProps = GameTemplateProps

export interface VectorLaunchLocalState {
  answer: string
  travelRatio: number | null
  launchCorrect: boolean | null
  animationKey: number
  combo: number
  bestCombo: number
}