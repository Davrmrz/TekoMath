import { useContext, useEffect, useRef } from 'react'
import { AudioContext } from './audioContext'
import type { SoundId } from './audio.types'

export function useSound() {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useSound must be used inside AudioProvider.')
  return context
}

export function useSoundMilestone<T extends HTMLElement = HTMLElement>(soundId: SoundId) {
  const { playSound } = useSound()
  const elementRef = useRef<T | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      playSound(soundId)
      observer.disconnect()
    }, { threshold: 0.55 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [playSound, soundId])

  return elementRef
}