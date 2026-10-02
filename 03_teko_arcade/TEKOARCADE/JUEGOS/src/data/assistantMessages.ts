export type AssistantContext = 'home' | 'map' | 'missions' | 'task' | 'progress' | 'topic' | 'setup' | 'game'
export type AssistantTopicKey = 'sin' | 'cos' | 'tan' | 'csc' | 'sec' | 'cot'
export type AssistantPose = 'doubt' | 'study' | 'success' | 'tip' | 'progress'

export interface AssistantMessage {
  text: string
  pose: AssistantPose
}

type TopicAssistantMessages = Record<AssistantTopicKey, AssistantMessage[]>

export const assistantMessages: Record<Exclude<AssistantContext, 'topic'>, AssistantMessage[]> & {
  topic: TopicAssistantMessages
} = {
  home: [
    { text: '¡Mba’éichapa! Ko’ápe oñepyrũ nde aventura matemática.', pose: 'tip' },
    { text: 'Eñembosarái ha eaprende; peteĩteĩ paso nepytyvõta.', pose: 'success' },
    { text: 'Eiporavo mba’épa rembohováise ko árape.', pose: 'doubt' },
  ],
  map: [
    { text: 'Eiporavo peteĩ tema ha ehasa nde ritmo-pe.', pose: 'tip' },
    { text: 'Rejapóvo peteĩ desafío, embojoapyta nde ruta-pe.', pose: 'progress' },
    { text: 'Emaña porã umi checkpoint rehe; ohechaukáta nde avance.', pose: 'study' },
  ],
  missions: [
    { text: 'Emohu’ã peteĩ reto ha eipyhy ne recompensa.', pose: 'success' },
    { text: 'Ejapo michĩmi michĩmi, ha remohu’ãta ko misión.', pose: 'tip' },
    { text: 'Ehecha mba’e misiónpa ikatu rejapo ko’ág̃a.', pose: 'doubt' },
  ],
  task: [
    { text: 'Ehai nde tarea térã ehupi foto ñañepyrũ hag̃ua.', pose: 'study' },
    { text: 'Jajepy’amongeta mbeguekatúpe pe ejercicio rehe.', pose: 'tip' },
  ],
  progress: [
    { text: 'Ehecha mba’éichapa reavanza peteĩteĩ partida ndive.', pose: 'progress' },
    { text: 'Umi estrella ha XP ohechauka nde esfuerzo.', pose: 'success' },
    { text: 'Esegíkena; nde práctica omombarete umi razón.', pose: 'tip' },
  ],
  setup: [
    { text: 'Eiporavo peteĩ reto ha ñañembosarái.', pose: 'tip' },
    { text: 'Eiporavo nde dificultad ha eñembosako’i.', pose: 'study' },
  ],
  game: [
    { text: 'Jaha mbeguekatúpe. Ikatu rejerure peteĩ pista.', pose: 'study' },
    { text: 'Emaña umi dato rehe ha eiporavo ne estrategia.', pose: 'doubt' },
    { text: '¡Eñeha’ã jey! Peteĩ respuesta vai ndepytyvõ avei reñemoarandu hag̃ua.', pose: 'success' },
  ],
  topic: {
    sin: [
      { text: 'Seno ombojoaju cateto opuesto ha hipotenusa.', pose: 'study' },
      { text: 'Eipuru pe fórmula ha ehecha mba’épa reikotevẽ.', pose: 'tip' },
    ],
    cos: [
      { text: 'Coseno ombojoaju cateto adyacente ha hipotenusa.', pose: 'study' },
      { text: 'Emañáke mba’e lado oĩ pe ángulo ykére.', pose: 'doubt' },
    ],
    tan: [
      { text: 'Tangente ha’e cateto opuesto dividido cateto adyacente.', pose: 'study' },
      { text: 'Eipuru umi cateto ha ejuhu nde razón.', pose: 'tip' },
    ],
    csc: [
      { text: 'Cosecante ha’e seno recíproca.', pose: 'study' },
      { text: 'Eikalkula seno raẽ, upéi eheka pe inversa.', pose: 'tip' },
    ],
    sec: [
      { text: 'Secante ha’e coseno recíproca.', pose: 'study' },
      { text: 'Coseno rehegua valor reheve ikatu rejuhu secante.', pose: 'tip' },
    ],
    cot: [
      { text: 'Cotangente ha’e tangente recíproca.', pose: 'study' },
      { text: 'Eipuru cateto adyacente ha opuesto rejuhu hag̃ua cotangente.', pose: 'tip' },
    ],
  },
}

export function getAssistantMessages(pathname: string): AssistantMessage[] {
  const context = getAssistantContext(pathname)
  if (context === 'topic') {
    const topic = getAssistantTopic(pathname)
    return topic ? assistantMessages.topic[topic] : assistantMessages.map
  }
  return assistantMessages[context]
}

export function getAssistantContextKey(pathname: string): string {
  const context = getAssistantContext(pathname)
  return context === 'topic' ? `${context}:${getAssistantTopic(pathname) ?? 'map'}` : context
}

export function getAssistantContext(pathname: string): AssistantContext {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/mapa')) return 'map'
  if (pathname.startsWith('/misiones')) return 'missions'
  if (pathname.startsWith('/mi-tarea')) return 'task'
  if (pathname.startsWith('/progreso')) return 'progress'
  if (pathname.startsWith('/preparar/')) return 'setup'
  if (pathname.startsWith('/juego/')) return 'game'
  if (pathname.startsWith('/tema/')) return 'topic'
  return 'home'
}

export function getAssistantTopic(pathname: string): AssistantTopicKey | null {
  const match = pathname.match(/^\/tema\/([^/]+)/)
  if (!match) return null
  const topic = match[1] as AssistantTopicKey
  return topic in assistantMessages.topic ? topic : null
}

export function getAssistantPosition(pathname: string): string {
  if (pathname === '/') return 'home-top'
  if (pathname.startsWith('/mapa')) return 'map-side'
  if (pathname.startsWith('/misiones')) return 'missions-top'
  if (pathname.startsWith('/mi-tarea')) return 'task-side'
  if (pathname.startsWith('/progreso')) return 'progress-top'
  if (pathname.startsWith('/tema/')) return 'topic-side'
  if (pathname.startsWith('/preparar/')) return 'setup-side'
  if (pathname.startsWith('/juego/')) return 'game-hint'
  return 'home-top'
}
