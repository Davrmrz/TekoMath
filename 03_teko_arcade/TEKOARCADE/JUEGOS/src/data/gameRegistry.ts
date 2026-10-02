import type { GameDefinition } from '../types'

export const gameRegistry: GameDefinition[] = [
  {
    id: 'triangle-forge',
    name: 'Triangle Forge',
    description: 'Construye triángulos y ajusta razones con precisión.',
    supportedTopics: ['sin', 'cos', 'tan'],
    difficulty: 'easy',
    icon: '△',
  },
  {
    id: 'signal-sync',
    name: 'Signal Sync',
    description: 'Relaciona señales y valores trigonométricos.',
    supportedTopics: ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'],
    difficulty: 'medium',
    icon: '◌',
  },
  {
    id: 'vector-launch',
    name: 'Vector Launch',
    description: 'Lanza vectores en función de ángulos y componentes.',
    supportedTopics: ['sin', 'cos', 'tan'],
    difficulty: 'hard',
    icon: '↗',
  },
  {
    id: 'pair-matrix',
    name: 'Pair Matrix',
    description: 'Conecta pares recíprocos y expresiones equivalentes.',
    supportedTopics: ['csc', 'sec', 'cot'],
    difficulty: 'easy',
    icon: '◫',
  },
  {
    id: 'ratio-rush',
    name: 'Ratio Rush',
    description: 'Resuelve retos de rapidez con proporciones trigonométricas.',
    supportedTopics: ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'],
    difficulty: 'medium',
    icon: '✦',
  },
  {
    id: 'graph-lab',
    name: 'Graph Lab',
    description: 'Explora gráficas y patrones de funciones trigonométricas.',
    supportedTopics: ['sin', 'cos', 'tan'],
    difficulty: 'hard',
    icon: '◎',
  },
]

export function getGamesForTopic(topicId: string): GameDefinition[] {
  return gameRegistry.filter((game) => game.supportedTopics.includes(topicId))
}

export function getGameById(gameId: string): GameDefinition | undefined {
  return gameRegistry.find((game) => game.id === gameId)
}
