import type { GameTemplateConfig } from '../core/game.types'

interface RatioRushConfig extends GameTemplateConfig {
  durationSeconds: number
}

export const ratioRushConfig: RatioRushConfig = {
  rounds: 1,
  instruction: 'Resolvé antes de que termine el tiempo',
  activityLabel: 'Reto rápido',
  durationSeconds: 60,
}