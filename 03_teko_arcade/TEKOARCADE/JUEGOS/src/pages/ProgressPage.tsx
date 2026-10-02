import { Activity, Award, Flame, TrendingUp } from 'lucide-react'
import { getGameById } from '../data/gameRegistry'
import { topics } from '../data/topics'
import { calculateProgressAnalytics } from '../services/progressAnalytics'
import { progressService } from '../services/progressService'
import { useLanguage } from '../i18n/LanguageProvider'
import type { Language } from '../i18n/types'

export function ProgressPage() {
  const { language, t } = useLanguage()
  const dateLocale: Record<Language, string> = { es: 'es', es_py: 'es-PY', jopara: 'es-PY' }
  const progress = progressService.getProgress()
  const analytics = calculateProgressAnalytics(progress)
  const masteryTopics = topics.map((topic) => ({
    name: topic.name,
    percent: analytics.topicProgress[topic.id].mastery,
    accuracy: analytics.topicProgress[topic.id].accuracy,
    stars: analytics.topicProgress[topic.id].stars,
    games: analytics.topicProgress[topic.id].gamesPlayed,
  }))
  const recentGames = [...progress.gameHistory]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 5)
  const xpSegments = Array.from({ length: 10 }, (_, index) => index < Math.floor((analytics.xp % 100) / 10))
  const streakDots = Array.from({ length: 6 }, (_, index) => index < Math.min(analytics.streak, 6))
  const masterySegments = Array.from({ length: 10 }, (_, index) => index < Math.round(analytics.mastery / 10))

  return (
    <section className="page-shell progress-page">
      <header className="progress-header">
        <div className="progress-header__copy">
          <p className="eyebrow">{t('progress.title')}</p>
          <h2>{t('progress.subtitle')}</h2>
          <p className="progress-header__subtitle">{t('progress.summary', { games: analytics.gamesPlayed, correct: analytics.correctAnswers, attempts: analytics.answersAttempted, accuracy: analytics.accuracy, stars: analytics.stars })}</p>
        </div>
      </header>

      <div className="progress-grid">
        <article className="progress-stat progress-stat--xp">
          <div className="progress-stat__header">
            <div className="progress-stat__icon progress-stat__icon--purple">
              <TrendingUp size={18} />
            </div>
            <span className="panel-label">{t('progress.totalXp')}</span>
          </div>

          <div className="progress-stat__value-row">
            <strong>{analytics.xp}</strong>
            <span className="progress-stat__level">{t('progress.level', { level: Math.floor(analytics.xp / 100) + 1 })}</span>
          </div>

          <div className="progress-stat__segments" aria-label={t('progress.levelProgress', { current: analytics.xp % 100 })}>
            {xpSegments.map((filled, index) => (
              <span key={index} className={filled ? 'is-filled' : ''} />
            ))}
          </div>
        </article>

        <article className="progress-stat progress-stat--streak">
          <div className="progress-stat__header">
            <div className="progress-stat__icon progress-stat__icon--orange">
              <Flame size={18} />
            </div>
            <span className="panel-label">{t('progress.streak')}</span>
          </div>

          <div className="progress-stat__value-row progress-stat__value-row--stacked">
            <div className="progress-stat__flame-value">
              <Flame size={20} />
              <strong>{t('progress.streakCount', { days: analytics.streak })}</strong>
            </div>
          </div>

          <div className="progress-stat__dots" aria-label={t('progress.streakCount', { days: analytics.streak })}>
            {streakDots.map((active, index) => (
              <span key={index} className={active ? 'is-active' : ''} />
            ))}
          </div>
        </article>

        <article className="progress-stat progress-stat--achievements">
          <div className="progress-stat__header">
            <div className="progress-stat__icon progress-stat__icon--green">
              <Award size={18} />
            </div>
            <span className="panel-label">{t('progress.generalMastery')}</span>
          </div>

          <div className="progress-stat__value-row">
            <strong>{analytics.mastery}%</strong>
          </div>

          <div className="progress-stat__segments" aria-label={t('progress.masteryPercent', { value: analytics.mastery })}>
            {masterySegments.map((filled, index) => <span key={index} className={filled ? 'is-filled' : ''} />)}
          </div>
        </article>
      </div>

      <section className="progress-panel">
        <div className="progress-panel__header">
            <p className="eyebrow eyebrow--compact">{t('progress.topicMastery')}</p>
        </div>

        <div className="topic-list">
          {masteryTopics.map((topic) => (
            <article className="topic-card" key={topic.name}>
              <div className="topic-card__header">
                <span>{topic.name}</span>
                <strong>{topic.percent}%</strong>
              </div>

              <div className="segment-bar" aria-label={t('progress.topicPercent', { topic: topic.name, value: topic.percent })}>
                {Array.from({ length: 10 }, (_, index) => (
                  <span key={index} className={index < Math.round(topic.percent / 10) ? 'is-filled' : ''} />
                ))}
              </div>

              <div className="topic-card__meta">
                <span className="topic-stars">{'★'.repeat(topic.stars)}{'☆'.repeat(3 - topic.stars)}</span>
                <small>{t('progress.accuracyGames', { accuracy: topic.accuracy, games: topic.games })}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="progress-panel progress-panel--compact">
          <div className="progress-panel__header">
            <p className="eyebrow eyebrow--compact">{t('progress.recentGames')}</p>
          </div>

          <div className="progress-history-list">
            {recentGames.length > 0 ? recentGames.map((game) => (
              <article className="progress-history-item" key={game.sessionId}>
                <Activity size={16} aria-hidden="true" />
                <div className="progress-history-item__copy">
                  <strong>{getGameById(game.gameId)?.name ?? game.gameId}</strong>
                  <span>{topics.find((topic) => topic.id === game.topicId)?.name ?? game.topicId} · {new Date(game.timestamp).toLocaleDateString(dateLocale[language])}</span>
                </div>
                <div className="progress-history-item__result">
                  <strong>{game.accuracy}%</strong>
                  <span>{t('progress.historyScore', { xp: game.xp })} · {'★'.repeat(game.stars)}{'☆'.repeat(3 - game.stars)}</span>
                </div>
              </article>
            )) : (
              <p className="progress-history-empty">{t('progress.historyEmpty')}</p>
            )}
          </div>
      </section>
    </section>
  )
}
