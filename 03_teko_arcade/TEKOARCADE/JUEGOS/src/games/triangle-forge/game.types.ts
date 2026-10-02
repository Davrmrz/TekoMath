import type { GameTemplateProps } from '../core/game.types'

export type TriangleForgeProps = GameTemplateProps

export interface TriangleForgeLocalState {
  answer: string
}

export interface TriangleHighlights {
  opposite: boolean
  adjacent: boolean
  hypotenuse: boolean
  angle: boolean
}