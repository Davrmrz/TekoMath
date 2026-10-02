import type { ComponentType } from 'react'
import type { GameTemplateProps } from './game.types'
import { TriangleForgeGame } from '../triangle-forge/Game'
import { SignalSyncGame } from '../signal-sync/Game'
import { VectorLaunchGame } from '../vector-launch/Game'
import { PairMatrixGame } from '../pair-matrix/Game'
import { RatioRushGame } from '../ratio-rush/Game'
import { GraphLabGame } from '../graph-lab/Game'

export const gameComponentRegistry: Record<string, ComponentType<GameTemplateProps>> = {
  'triangle-forge': TriangleForgeGame,
  'signal-sync': SignalSyncGame,
  'vector-launch': VectorLaunchGame,
  'pair-matrix': PairMatrixGame,
  'ratio-rush': RatioRushGame,
  'graph-lab': GraphLabGame,
}