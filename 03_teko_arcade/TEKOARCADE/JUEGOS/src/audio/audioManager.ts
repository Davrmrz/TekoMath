import type { SoundId, SoundOptions, SoundTone } from './audio.types'
import { getSoundTones } from './soundRegistry'

const MASTER_GAIN = 0.52
const SOUND_COOLDOWN_MS = 45

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let enabled = true
let unlocked = false
const lastPlayedAt = new Map<SoundId, number>()

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext
  if (typeof window === 'undefined') return null

  const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextConstructor) return null

  try {
    const context = new AudioContextConstructor()
    const output = context.createGain()
    output.gain.value = MASTER_GAIN
    output.connect(context.destination)
    audioContext = context
    masterGain = output
    return context
  } catch {
    return null
  }
}

export function unlockAudio(): void {
  if (!enabled) return
  const context = getAudioContext()
  if (!context) return
  unlocked = true
  if (context.state === 'suspended') {
    try {
      void context.resume().catch(() => undefined)
    } catch {
      // Audio remains optional when the browser rejects playback.
    }
  }
}

export function setAudioEnabled(nextEnabled: boolean): void {
  enabled = nextEnabled
}

export function playAudioSound(soundId: SoundId, options?: SoundOptions): void {
  if (!enabled || !unlocked) return
  const context = getAudioContext()
  if (!context || !masterGain || context.state === 'closed') return

  const nowMs = performance.now()
  const lastPlayed = lastPlayedAt.get(soundId) ?? 0
  if (nowMs - lastPlayed < SOUND_COOLDOWN_MS) return
  lastPlayedAt.set(soundId, nowMs)

  const startAt = context.currentTime + 0.004
  for (const tone of getSoundTones(soundId, options?.variation)) {
    try {
      scheduleTone(context, masterGain, tone, startAt + (tone.delayMs ?? 0) / 1000)
    } catch {
      // A failed oscillator must not interrupt the associated UI action.
    }
  }
}

function scheduleTone(context: AudioContext, output: GainNode, tone: SoundTone, startAt: number): void {
  const oscillator = context.createOscillator()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const duration = tone.durationMs / 1000
  const peakGain = Math.min(0.22, tone.gain)

  oscillator.type = tone.waveform ?? 'sine'
  oscillator.frequency.setValueAtTime(tone.frequency, startAt)
  if (tone.endFrequency) oscillator.frequency.linearRampToValueAtTime(tone.endFrequency, startAt + duration)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2600, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(output)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.01)
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect()
    filter.disconnect()
    gain.disconnect()
  }, { once: true })
}