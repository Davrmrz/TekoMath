import type { GameTemplateProps } from '../core/game.types'
import type { SignalSelection, SignalSyncStatus } from './signalSyncData'

export type SignalSyncProps = GameTemplateProps

export interface SignalSyncLocalState {
  selection: SignalSelection
  solvedPairIds: string[]
  combo: number
  bestCombo: number
  status: SignalSyncStatus
}