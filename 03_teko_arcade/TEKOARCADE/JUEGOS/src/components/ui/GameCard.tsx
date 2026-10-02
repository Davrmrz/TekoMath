import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { GameDefinition, TopicProgress } from '../../types'
import { ProgressBar } from './ProgressBar'
import { StarRating } from './StarRating'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { TranslationKey } from '../../i18n/translations'

const descriptionKeys: Record<string, TranslationKey> = {
  'triangle-forge': 'games.triangle-forge.description',
  'signal-sync': 'games.signal-sync.description',
  'vector-launch': 'games.vector-launch.description',
  'pair-matrix': 'games.pair-matrix.description',
  'ratio-rush': 'games.ratio-rush.description',
  'graph-lab': 'games.graph-lab.description',
}

interface GameCardProps {
  game: GameDefinition
  topicId: string
  topicProgress: TopicProgress
}

export function GameCard({ game, topicId, topicProgress }: GameCardProps) {
  const { t } = useLanguage()
  const route = `/preparar/${topicId}/${game.id}`

  return (
    <article className="game-card">
      <div className="game-card__header">
        <div className="game-card__icon">{game.icon}</div>
        <span className="difficulty-pill">{t(`difficulty.${game.difficulty}` as TranslationKey)}</span>
      </div>

      <div className="game-card__body">
        <h4>{game.name}</h4>
        <p>{t(descriptionKeys[game.id] ?? 'games.triangle-forge.description')}</p>
      </div>

      <div className="game-card__stats">
        <div className="game-card__stat">
          <Star size={12} />
          <span>{topicProgress.stars}/3</span>
        </div>
        <div className="game-card__stat">
          <span>{t('gameCard.best')}</span>
          <strong>{Math.max(0, topicProgress.bestScore)}%</strong>
        </div>
      </div>

      <div className="game-card__progress">
        <span>{t('gameCard.mastery')}</span>
        <ProgressBar value={topicProgress.mastery} compact />
      </div>

      <div className="game-card__footer">
        <div className="game-card__meta">
          <span>{t('gameCard.games')}</span>
          <strong>{topicProgress.gamesPlayed}</strong>
        </div>
        <Link to={route} className="secondary-button">
          {t('gameCard.choose')}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="game-card__stars">
        <StarRating value={topicProgress.stars} max={3} size={12} />
      </div>
    </article>
  )
}
