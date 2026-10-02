import { Link } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { TopicDefinition, TopicProgress } from '../../types'
import { useLanguage } from '../../i18n/LanguageProvider'

interface TopicNodeProps {
  topic: TopicDefinition
  topicProgress: TopicProgress
  position: 'left' | 'center' | 'right'
  isCurrent: boolean
}

export function TopicNode({ topic, topicProgress, position, isCurrent }: TopicNodeProps) {
  const { t } = useLanguage()
  const gamesPlayed = Math.min(3, Math.max(0, topicProgress.gamesPlayed))
  const isCompleted = gamesPlayed === 3

  return (
    <div className={`map-route__step map-route__step--${position}`}>
      <Link
        to={`/tema/${topic.id}`}
        className={`learning-node${isCurrent ? ' is-current' : ''}${isCompleted ? ' is-completed' : ''}`}
        aria-label={`${t('map.goTopic', { topic: topic.name })}, ${t('map.challengeProgress', { current: gamesPlayed, total: 3 })}, ${t('map.starProgress', { current: topicProgress.stars, total: 3 })}${isCurrent ? `, ${t('map.next')}` : ''}${isCompleted ? `, ${t('map.completed')}` : ''}`}
      >
        <span
          className="learning-node__ring"
          style={{ '--node-progress': `${(gamesPlayed / 3) * 360}deg` } as CSSProperties}
          aria-hidden="true"
        >
          <span className="learning-node__core"><span className="learning-node__symbol">{topic.shortName}</span></span>
          {isCompleted ? <span className="learning-node__status-icon learning-node__status-icon--complete"><Check size={15} strokeWidth={3} /></span> : null}
          {isCurrent && !isCompleted ? <span className="learning-node__status-icon learning-node__status-icon--current" /> : null}
        </span>
        <span className="learning-node__label">{topic.name}</span>
        <span className="learning-node__progress" aria-label={t('map.challengeProgress', { current: gamesPlayed, total: 3 })}>
          <span className="learning-node__gems" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => <span key={`${topic.id}-gem-${index}`} className={index < gamesPlayed ? 'is-earned' : ''} />)}
          </span>
          <span className="learning-node__stars" aria-label={t('map.starProgress', { current: topicProgress.stars, total: 3 })}>
            {Array.from({ length: 3 }, (_, index) => <Star key={`${topic.id}-star-${index}`} size={13} strokeWidth={2.5} fill={index < topicProgress.stars ? 'currentColor' : 'transparent'} className={index < topicProgress.stars ? 'is-earned' : ''} />)}
          </span>
        </span>
      </Link>
    </div>
  )
}
