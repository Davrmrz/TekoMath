import type { GameTemplateConfig } from '../core/game.types'

export interface SignalSyncGameConfig extends GameTemplateConfig {
  minimumPairs: number
  maximumPairs: number
}

export const signalSyncConfig: SignalSyncGameConfig = {
  rounds: 4,
  minimumPairs: 3,
  maximumPairs: 5,
  instruction: 'Sincronizá señal y canal',
  activityLabel: 'Sincronización',
}