import { Flame, Zap } from 'lucide-react'
import { topics } from '../data/topics'
import { progressService } from '../services/progressService'
import { TopicNode } from '../components/ui/TopicNode'
import { MapCheckpoint, MapChest, MapReward } from '../components/map/MapIncentives'
import { useLanguage } from '../i18n/LanguageProvider'

const routePositions = ['left', 'right', 'center'] as const

function MapTrail({ inverse = false }: { inverse?: boolean }) {
  const path = inverse
     ? 'M75 77 C75 125 50 125 50 192 C50 246 25 246 25 306 C50 360 50 360 50 425 C50 480 50 480 50 545 C50 610 50 610 50 674'
    : 'M25 77 C25 120 50 120 50 171 C50 220 75 220 75 271 C75 323 50 323 50 374 C50 426 25 426 25 478 C25 535 50 535 50 588'

  return (
    <svg className="map-route__trail" viewBox="0 0 100 720" preserveAspectRatio="none" aria-hidden="true">
      <path className="map-route__trail-bed" d={path} />
      <path className="map-route__trail-line" d={path} />
    </svg>
  )
}

export function LearningMapPage() {
  const { t } = useLanguage()
  const progress = progressService.getUserProgress()
  const primaryWorld = topics.filter((topic) => topic.category === 'principal')
  const inverseWorld = topics.filter((topic) => topic.category === 'inverse')
  const completedChallenges = topics.reduce(
    (sum, topic) => sum + Math.min(3, Math.max(0, progress.topicProgress[topic.id].gamesPlayed)),
    0,
  )
  const totalChallenges = topics.length * 3
  const currentTopic = topics.find((topic) => progress.topicProgress[topic.id].gamesPlayed < 3)?.id
    ?? progress.lastTopic
  const renderTopicNode = (topic: (typeof topics)[number], position: 'left' | 'center' | 'right') => (
    <TopicNode
      key={topic.id}
      topic={topic}
      topicProgress={progress.topicProgress[topic.id]}
      position={position}
      isCurrent={topic.id === currentTopic}
    />
  )

  return (
    <section className="page-shell map-page">
      <header className="map-journey-header">
        <div className="map-journey-header__title">
          <p className="eyebrow">{t('map.title')}</p>
          <h2>{t('map.route')}</h2>
        </div>
        <div className="map-journey-header__stats">
          <div className="map-stat map-stat--xp" aria-label={`${progress.xp} XP`}><Zap size={14} aria-hidden="true" /><strong>{progress.xp}</strong></div>
          <div className="map-stat map-stat--streak" aria-label={`Racha de ${progress.streak} días`}><Flame size={14} aria-hidden="true" /><strong>{progress.streak}</strong></div>
        </div>
        <div
          className="map-journey-progress"
          role="progressbar"
          aria-label={t('map.progress')}
          aria-valuemin={0}
          aria-valuemax={totalChallenges}
          aria-valuenow={completedChallenges}
        >
          <div className="map-journey-progress__track"><span style={{ width: `${(completedChallenges / totalChallenges) * 100}%` }} /></div>
        </div>
      </header>

      <div className="adventure-map">
        <section className="map-chapter map-chapter--main" aria-labelledby="main-chapter-title">
          <header className="map-chapter__header">
            <span className="map-chapter__number">01</span>
            <h3 id="main-chapter-title">{t('map.primaryReasons')}</h3>
          </header>

          <div className="map-route">
            <MapTrail />
            {primaryWorld[0] ? renderTopicNode(primaryWorld[0], routePositions[0]) : null}
            <MapReward amount={15} label={t('map.firstAdvance')} />
            {primaryWorld[1] ? renderTopicNode(primaryWorld[1], routePositions[1]) : null}
            <MapChest amount={25} />
            {primaryWorld[2] ? renderTopicNode(primaryWorld[2], routePositions[2]) : null}
            <MapCheckpoint title={t('map.checkpoint')} subtitle={t('map.mainReview')} />
          </div>
        </section>

        <section className="map-chapter map-chapter--inverse" aria-labelledby="inverse-chapter-title">
          <header className="map-chapter__header">
            <span className="map-chapter__number">02</span>
            <h3 id="inverse-chapter-title">{t('map.inverseReasons')}</h3>
          </header>

          <div className="map-route map-route--inverse">
            <MapTrail inverse />
            {inverseWorld[0] ? renderTopicNode(inverseWorld[0], 'right') : null}
            <MapReward amount={30} label={t('map.practiceStreak')} />
            {inverseWorld[1] ? renderTopicNode(inverseWorld[1], 'left') : null}
            <MapChest amount={40} />
            {inverseWorld[2] ? renderTopicNode(inverseWorld[2], 'center') : null}
            <MapCheckpoint title={t('map.finalChallenge')} subtitle={t('map.finishRoute')} final />
          </div>
        </section>
      </div>
    </section>
  )
}
