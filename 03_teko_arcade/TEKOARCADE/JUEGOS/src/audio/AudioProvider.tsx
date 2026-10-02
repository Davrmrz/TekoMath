import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AUDIO_STORAGE_KEY, AudioContext } from './audioContext'
import { playAudioSound, setAudioEnabled, unlockAudio } from './audioManager'
import type { SoundId, SoundOptions } from './audio.types'

interface AudioProviderProps {
  children: ReactNode
}

function readInitialEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(AUDIO_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function soundForElement(element: HTMLElement): SoundId {
  if (element.dataset.soundId) return element.dataset.soundId as SoundId
  if (element.classList.contains('game-session-header__back')) return 'ui.back'

  if (element.classList.contains('learning-node')) {
    if (element.classList.contains('is-completed')) return 'map.node.completed'
    if (element.classList.contains('is-current')) return 'map.node.selected'
    return 'map.node.available'
  }

  if (element.tagName === 'A') return 'navigation.change'
  if (element.classList.contains('secondary-button') || element.classList.contains('language-selector__option')) {
    return 'ui.secondary'
  }
  return 'ui.click'
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [enabled, setEnabledState] = useState(readInitialEnabled)
  const pendingClickTimer = useRef<number | null>(null)

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled)
    setAudioEnabled(nextEnabled)
    if (nextEnabled) unlockAudio()
    if (!nextEnabled && pendingClickTimer.current !== null) {
      window.clearTimeout(pendingClickTimer.current)
      pendingClickTimer.current = null
    }
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, String(nextEnabled))
    } catch {
      // Keep the setting in memory if storage is unavailable.
    }
  }, [])

  const playSound = useCallback((soundId: SoundId, options?: SoundOptions) => {
    if (pendingClickTimer.current !== null) {
      window.clearTimeout(pendingClickTimer.current)
      pendingClickTimer.current = null
    }
    playAudioSound(soundId, options)
  }, [])

  const toggleEnabled = useCallback(() => setEnabled(!enabled), [enabled, setEnabled])

  useEffect(() => {
    setAudioEnabled(enabled)
  }, [enabled])

  useEffect(() => {
    const unlock = () => unlockAudio()
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest<HTMLElement>('button, a[href], [role="button"]')
      if (!control || control.dataset.soundId === 'none') return
      if (control instanceof HTMLButtonElement && control.disabled) return
      if (control.getAttribute('aria-disabled') === 'true') return

      if (pendingClickTimer.current !== null) window.clearTimeout(pendingClickTimer.current)
      const soundId = soundForElement(control)
      pendingClickTimer.current = window.setTimeout(() => {
        pendingClickTimer.current = null
        playAudioSound(soundId)
      }, 48)
    }

    document.addEventListener('pointerdown', unlock, true)
    document.addEventListener('keydown', unlock, true)
    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('pointerdown', unlock, true)
      document.removeEventListener('keydown', unlock, true)
      document.removeEventListener('click', handleClick, true)
      if (pendingClickTimer.current !== null) window.clearTimeout(pendingClickTimer.current)
    }
  }, [])

  return (
    <AudioContext.Provider value={{ enabled, setEnabled, toggleEnabled, playSound }}>
      {children}
    </AudioContext.Provider>
  )
}