import type { GameTemplateProps } from '../core/game.types'
import type { GraphFunctionName } from './graphEngine'

export type GraphLabProps = GameTemplateProps

export interface GraphLabLocalState {
  functionName: GraphFunctionName
  selectedAnswer: string | null
  combo: number
  bestCombo: number
}