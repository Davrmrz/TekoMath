import {
  getAssistantContext,
  getAssistantMessages,
  getAssistantPosition,
} from '../../data/assistantMessages'
import type { AssistantMessage } from '../../data/assistantMessages'

export type AssistantState = 'idle' | 'thinking' | 'happy' | 'hint' | 'celebrate'

export class AssistantController {
  static getContext(pathname: string) {
    return getAssistantContext(pathname)
  }

  static getPosition(pathname: string) {
    return getAssistantPosition(pathname)
  }

  static getState(pathname: string): AssistantState {
    const context = this.getContext(pathname)

    if (context === 'map') return 'idle'
    if (context === 'missions') return 'happy'
    if (context === 'task') return 'thinking'
    if (context === 'progress') return 'thinking'
    if (context === 'setup') return 'thinking'
    if (context === 'game') return 'hint'
    if (context === 'topic') return 'happy'
    return 'idle'
  }

  static getMessage(pathname: string, previousText?: string): AssistantMessage {
    const messages = getAssistantMessages(pathname)
    if (!messages.length) return { text: '', pose: 'tip' }
    return messages.find((message) => message.text !== previousText) ?? messages[0]
  }
}
