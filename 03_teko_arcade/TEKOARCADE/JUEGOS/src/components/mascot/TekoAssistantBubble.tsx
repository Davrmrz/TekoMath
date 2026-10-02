import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  type AssistantMessage,
  getAssistantContext,
  getAssistantContextKey,
  getAssistantMessages,
} from '../../data/assistantMessages'
import { useSound } from '../../audio/useSound'
import { TekoMascot } from './TekoMascot'

export function TekoAssistantBubble() {
  const { playSound } = useSound()
  const { pathname } = useLocation()
  const context = getAssistantContext(pathname)
  const contextKey = getAssistantContextKey(pathname)
  const timer = useRef<number | null>(null)
  const messageCursor = useRef({ contextKey: '', index: -1 })
  const [messageRevision, setMessageRevision] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [messageEntry, setMessageEntry] = useState<AssistantMessage | null>(null)
  const message = messageEntry?.text ?? ''
  const pose = messageEntry?.pose ?? 'tip'

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const showMessage = useCallback(() => {
    const messages = getAssistantMessages(pathname)
    if (!messages.length) return
    if (messageCursor.current.contextKey !== contextKey) {
      messageCursor.current = { contextKey, index: -1 }
    }
    const nextIndex = (messageCursor.current.index + 1) % messages.length
    const nextMessage = messages[nextIndex]
    if (!nextMessage) return
    messageCursor.current.index = nextIndex
    setMessageEntry(nextMessage)
    setMessageRevision((revision) => revision + 1)
    setIsOpen(true)
    clearTimer()
    timer.current = window.setTimeout(() => setIsOpen(false), 3200)
  }, [clearTimer, contextKey, pathname])

  useEffect(() => {
    const updateScrollState = () => {
      const scrolled = window.scrollY > 180
      setIsScrolled(scrolled)
      if (scrolled) {
        clearTimer()
        setIsOpen(false)
      }
    }

    updateScrollState()
    if (window.scrollY <= 180) showMessage()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => {
      clearTimer()
      window.removeEventListener('scroll', updateScrollState)
    }
  }, [clearTimer, pathname, showMessage])

  return (
    <div className={`teko-assistant${isScrolled ? ' is-scrolled' : ''}`} data-context={context}>
      <div
        className={`teko-assistant__message${isOpen ? ' is-visible' : ''}`}
        aria-live="polite"
        aria-hidden={!isOpen}
      >
        <p key={messageRevision}>{message}</p>
      </div>
      <TekoMascot
        pose={pose}
        compact
        expanded={isOpen}
        label="Tejucito"
        onClick={() => {
          playSound('assistant.open')
          showMessage()
        }}
      />
    </div>
  )
}