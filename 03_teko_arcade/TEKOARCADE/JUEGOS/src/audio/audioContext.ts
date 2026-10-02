import { createContext } from 'react'
import type { AudioContextValue } from './audio.types'

export const AUDIO_STORAGE_KEY = 'teko-sfx-enabled'
export const AudioContext = createContext<AudioContextValue | null>(null)