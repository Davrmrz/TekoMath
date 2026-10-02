export type SoundId =
  | 'ui.click'
  | 'ui.secondary'
  | 'ui.back'
  | 'ui.open'
  | 'ui.close'
  | 'navigation.change'
  | 'game.correct'
  | 'game.incorrect'
  | 'game.hint'
  | 'game.start'
  | 'game.complete'
  | 'reward.xp'
  | 'reward.star'
  | 'reward.chest'
  | 'mission.complete'
  | 'mission.claim'
  | 'progress.levelUp'
  | 'assistant.open'
  | 'assistant.close'
  | 'map.node.available'
  | 'map.node.selected'
  | 'map.node.completed'
  | 'map.checkpoint'
  | 'map.finalChallenge'

export interface SoundOptions {
  variation?: number
}

export interface SoundTone {
  frequency: number
  endFrequency?: number
  durationMs: number
  gain: number
  waveform?: OscillatorType
  delayMs?: number
}

export interface AudioContextValue {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  toggleEnabled: () => void
  playSound: (soundId: SoundId, options?: SoundOptions) => void
}