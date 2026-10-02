import { ArrowRight, Star } from 'lucide-react'
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { GameCard } from '../components/ui/GameCard'
import { getGamesForTopic } from '../data/gameRegistry'
import { getTopicById } from '../data/topics'
import { progressService } from '../services/progressService'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TranslationKey } from '../i18n/translations'

const topicDescriptionKeys: Record<string, TranslationKey> = {
  sin: 'topics.sin.description', cos: 'topics.cos.description', tan: 'topics.tan.description',
  csc: 'topics.csc.description', sec: 'topics.sec.description', cot: 'topics.cot.description',
}

export function TopicPage() {
  const { t } = useLanguage()
  const { topic } = useParams()
  const currentTopic = getTopicById(topic)

  if (!currentTopic) {
    return <Navigate to="/mapa" replace />
  }

  const games = useMemo(() => getGamesForTopic(currentTopic.id).slice(0, 3), [currentTopic.id])
  const topicProgress = progressService.getTopicProgress(currentTopic.id)
  const quickGame = games[(currentTopic.order - 1) % Math.max(games.length, 1)]
  const topicAccentMap: Record<string, string> = {
    sin: '#7d62f7',
    cos: '#8f7af8',
    tan: '#a36af7',
    csc: '#7b6cf4',
    sec: '#8a7ae8',
    cot: '#927bf1',
  }

  return (
    <section
      className="page-shell topic-page"
      style={{ ['--topic-accent' as string]: topicAccentMap[currentTopic.id] ?? '#7d62f7' }}
    >
      <div className="topic-page__header">
        <div className="topic-page__title-wrap">
          <p className="eyebrow eyebrow--compact">{t('topic.active')}</p>
          <h2>{currentTopic.name}</h2>
        </div>
        <Link to={`/preparar/${currentTopic.id}/${quickGame?.id ?? 'triangle-forge'}`} className="primary-button topic-page__cta">
          {t('topic.quickPractice')}
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="topic-page__summary">
        <div className="info-card info-card--formula">
          <div className="info-card__meta">
            <span className="label">{t('topic.formula')}</span>
            <span className="info-card__tag">{t('topic.keyConcept')}</span>
          </div>
          <strong>{currentTopic.formula}</strong>
          <p>{t(topicDescriptionKeys[currentTopic.id])}</p>
        </div>

        <div className="info-card info-card--metric">
          <span className="label">{t('topic.mastery')}</span>
          <div className="metric-row">
            <strong>{topicProgress.mastery}%</strong>
            <span className="metric-chip">{t('topic.level')}</span>
          </div>
          <div className="metric-bar">
            <span style={{ width: `${topicProgress.mastery}%` }} />
          </div>
        </div>

        <div className="info-card info-card--metric">
          <span className="label">{t('topic.stars')}</span>
          <div className="metric-row metric-row--star">
            <strong>
              <Star size={16} fill="currentColor" />
              {topicProgress.stars}/3
            </strong>
            <span className="metric-chip">{t('topic.rank')}</span>
          </div>
          <div className="stars-track" aria-label={`Estrellas ${topicProgress.stars} de 3`}>
            {Array.from({ length: 3 }, (_, index) => (
              <span key={`${currentTopic.id}-star-${index}`} className={index < topicProgress.stars ? 'is-active' : ''} />
            ))}
          </div>
        </div>

        <div className="info-card info-card--metric">
          <span className="label">{t('topic.gamesPlayed')}</span>
          <div className="metric-row">
            <strong>{topicProgress.gamesPlayed}</strong>
            <span className="metric-chip">{t('topic.played')}</span>
          </div>
          <div className="metric-mini-stat">
            <span>{t('topic.lastAttempt')}</span>
            <strong>{Math.max(0, topicProgress.bestScore)}%</strong>
          </div>
        </div>
      </div>

      <div className="section-header section-header--compact">
        <div>
          <p className="eyebrow">{t('topic.availableGames')}</p>
          <h3>{t('topic.recommendedChallenges')}</h3>
        </div>
      </div>

      <div className="game-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} topicId={currentTopic.id} topicProgress={topicProgress} />
        ))}
      </div>
    </section>
  )
}
