import type { SoundId, SoundTone } from './audio.types'

export const soundRegistry: Record<SoundId, readonly SoundTone[]> = {
  'ui.click': [{ frequency: 255, endFrequency: 220, durationMs: 42, gain: 0.18, waveform: 'triangle' }],
  'ui.secondary': [{ frequency: 385, endFrequency: 330, durationMs: 38, gain: 0.12, waveform: 'sine' }],
  'ui.back': [{ frequency: 370, endFrequency: 245, durationMs: 72, gain: 0.13, waveform: 'triangle' }],
  'ui.open': [
    { frequency: 300, endFrequency: 440, durationMs: 75, gain: 0.12, waveform: 'sine' },
    { frequency: 590, durationMs: 55, gain: 0.07, delayMs: 25, waveform: 'sine' },
  ],
  'ui.close': [{ frequency: 330, endFrequency: 250, durationMs: 52, gain: 0.1, waveform: 'sine' }],
  'navigation.change': [{ frequency: 245, endFrequency: 390, durationMs: 125, gain: 0.1, waveform: 'sine' }],
  'game.correct': [
    { frequency: 330, endFrequency: 400, durationMs: 105, gain: 0.13, waveform: 'triangle' },
    { frequency: 495, durationMs: 125, gain: 0.08, delayMs: 38, waveform: 'sine' },
    { frequency: 620, durationMs: 135, gain: 0.06, delayMs: 48, waveform: 'sine' },
  ],
  'game.incorrect': [{ frequency: 255, endFrequency: 205, durationMs: 105, gain: 0.1, waveform: 'sine' }],
  'game.hint': [
    { frequency: 430, endFrequency: 570, durationMs: 100, gain: 0.09, waveform: 'sine' },
    { frequency: 680, durationMs: 90, gain: 0.045, delayMs: 45, waveform: 'sine' },
  ],
  'game.start': [
    { frequency: 295, endFrequency: 385, durationMs: 85, gain: 0.1, waveform: 'triangle' },
    { frequency: 440, endFrequency: 520, durationMs: 95, gain: 0.075, delayMs: 55, waveform: 'sine' },
  ],
  'game.complete': [
    { frequency: 392, durationMs: 190, gain: 0.11, waveform: 'triangle' },
    { frequency: 494, durationMs: 205, gain: 0.085, delayMs: 42, waveform: 'sine' },
    { frequency: 587, durationMs: 220, gain: 0.065, delayMs: 82, waveform: 'sine' },
  ],
  'reward.xp': [
    { frequency: 520, endFrequency: 635, durationMs: 82, gain: 0.09, waveform: 'sine' },
    { frequency: 760, durationMs: 95, gain: 0.055, delayMs: 42, waveform: 'sine' },
  ],
  'reward.star': [{ frequency: 690, endFrequency: 820, durationMs: 115, gain: 0.09, waveform: 'sine' }],
  'reward.chest': [
    { frequency: 210, endFrequency: 280, durationMs: 65, gain: 0.12, waveform: 'triangle' },
    { frequency: 455, endFrequency: 620, durationMs: 110, gain: 0.075, delayMs: 50, waveform: 'sine' },
    { frequency: 740, durationMs: 125, gain: 0.045, delayMs: 105, waveform: 'sine' },
  ],
  'mission.complete': [
    { frequency: 350, endFrequency: 465, durationMs: 105, gain: 0.1, waveform: 'triangle' },
    { frequency: 590, durationMs: 125, gain: 0.06, delayMs: 55, waveform: 'sine' },
  ],
  'mission.claim': [
    { frequency: 420, endFrequency: 560, durationMs: 90, gain: 0.1, waveform: 'triangle' },
    { frequency: 680, durationMs: 115, gain: 0.055, delayMs: 48, waveform: 'sine' },
  ],
  'progress.levelUp': [
    { frequency: 330, endFrequency: 440, durationMs: 110, gain: 0.1, waveform: 'triangle' },
    { frequency: 494, durationMs: 130, gain: 0.075, delayMs: 65, waveform: 'sine' },
    { frequency: 660, durationMs: 150, gain: 0.055, delayMs: 130, waveform: 'sine' },
  ],
  'assistant.open': [{ frequency: 355, endFrequency: 490, durationMs: 88, gain: 0.1, waveform: 'sine' }],
  'assistant.close': [{ frequency: 480, endFrequency: 335, durationMs: 78, gain: 0.085, waveform: 'sine' }],
  'map.node.available': [{ frequency: 340, endFrequency: 470, durationMs: 92, gain: 0.09, waveform: 'sine' }],
  'map.node.selected': [
    { frequency: 205, endFrequency: 285, durationMs: 58, gain: 0.14, waveform: 'triangle' },
    { frequency: 440, durationMs: 68, gain: 0.045, delayMs: 36, waveform: 'sine' },
  ],
  'map.node.completed': [
    { frequency: 390, endFrequency: 480, durationMs: 90, gain: 0.1, waveform: 'triangle' },
    { frequency: 620, durationMs: 105, gain: 0.055, delayMs: 42, waveform: 'sine' },
  ],
  'map.checkpoint': [
    { frequency: 300, endFrequency: 400, durationMs: 105, gain: 0.1, waveform: 'triangle' },
    { frequency: 500, durationMs: 125, gain: 0.07, delayMs: 52, waveform: 'sine' },
  ],
  'map.finalChallenge': [
    { frequency: 345, endFrequency: 450, durationMs: 110, gain: 0.1, waveform: 'triangle' },
    { frequency: 550, durationMs: 130, gain: 0.07, delayMs: 55, waveform: 'sine' },
    { frequency: 685, durationMs: 145, gain: 0.05, delayMs: 105, waveform: 'sine' },
  ],
}

export function getSoundTones(soundId: SoundId, variation = 1): readonly SoundTone[] {
  if (soundId === 'reward.star') {
    const semitone = Math.max(0, Math.min(2, Math.floor(variation) - 1))
    const frequency = 690 * 2 ** (semitone / 12)
    return [{ frequency, endFrequency: frequency * 1.19, durationMs: 115, gain: 0.09, waveform: 'sine' }]
  }
  if (soundId === 'game.complete' && variation > 1) {
    return soundRegistry[soundId].map((tone) => ({
      ...tone,
      frequency: tone.frequency * 1.06,
      ...(tone.endFrequency ? { endFrequency: tone.endFrequency * 1.06 } : {}),
    }))
  }
  return soundRegistry[soundId]
}