import { ArrowRight, FileText, Flame, Image, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTopicById, topics } from '../data/topics'
import { missionService } from '../services/missionService'
import { progressService } from '../services/progressService'
import { useLanguage } from '../i18n/LanguageProvider'

const missionCopyKeys = {
  'games-2': ['missions.games2.title', 'missions.games2.description'],
  'correct-5': ['missions.correct5.title', 'missions.correct5.description'],
  'combo-3': ['missions.combo3.title', 'missions.combo3.description'],
  'practice-sin': ['missions.practiceSin.title', 'missions.practiceSin.description'],
  'xp-50': ['missions.xp50.title', 'missions.xp50.description'],
} as const

export function HomePage() {
  const { t } = useLanguage()
  const userProgress = progressService.getUserProgress()
  const lastTopic = getTopicById(userProgress.lastTopic) ?? topics[0]
  const topicStats = topics.map((topic) => ({
    topic,
    mastery: userProgress.topicProgress[topic.id].mastery,
  }))
  const domainAverage = Math.round(topicStats.reduce((sum, item) => sum + item.mastery, 0) / topicStats.length)
  const missions = missionService.getMissions()
  const dailyMission = missions.find((mission) => mission.status !== 'claimed') ?? missions[0]
  const missionTopic = dailyMission?.topicId ? getTopicById(dailyMission.topicId) : undefined
  const lastTopicProgress = userProgress.topicProgress[lastTopic.id]
  const hasGames = userProgress.gameHistory.length > 0
    || userProgress.correctAnswers > 0
    || Object.values(userProgress.topicProgress).some((topicProgress) => topicProgress.gamesPlayed > 0)

  return (
    <section className="page-shell hero-page">
      <div className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.title')}</h1>
          <p className="lead">
            {t('home.description')}
          </p>

          <div className="hero-actions">
            <Link to="/mapa" className="primary-button">
              {t('home.exploreMap')}
              <ArrowRight size={18} />
            </Link>
            <Link to={userProgress.lastTopic ? `/tema/${lastTopic.id}` : '/mapa'} className="secondary-button">
              {t('home.continueLearning')}
            </Link>
          </div>
        </div>

        <div className="player-status" aria-label={t('home.playerStatus')}>
          <div className="player-status__header">
            <span>{t('home.playerStatus')}</span>
            <strong>{t('home.level', { level: 1 })}</strong>
          </div>

          <div className="player-status__row player-status__row--highlight">
            <span>XP</span>
            <strong>{userProgress.xp} / 100</strong>
          </div>
          <div className="pixel-bar pixel-bar--small">
            <span style={{ width: `${Math.min(100, userProgress.xp)}%` }} />
          </div>

          <div className="player-status__row">
            <span className="player-status__label"><Flame size={15} /> {t('home.streak')}</span>
            <strong>{t('shell.streakDays', { days: userProgress.streak })}</strong>
          </div>

          <div className="player-status__row">
            <span>{t('home.mastery')}</span>
            <strong>{domainAverage}%</strong>
          </div>
          <div className="pixel-bar">
            <span style={{ width: `${domainAverage}%` }} />
          </div>
        </div>

      </div>

      <div className="task-feature-card">
        <div className="task-feature-card__content">
          <p className="eyebrow">{t('home.taskEyebrow')}</p>
          <h3>{t('home.taskQuestion')}</h3>

          <p className="task-feature-card__copy">
            {t('home.taskDescription')}
          </p>

          <Link to="/mi-tarea" className="primary-button task-feature-card__cta">
            {t('home.useTask')}
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="task-feature-card__visual" aria-hidden="true">
          <div className="task-feature-card__stack">
            <div className="task-feature-card__icon-wrap">
              <div className="task-feature-card__icon">∠</div>
              <div className="task-feature-card__mini task-feature-card__mini--one" />
              <div className="task-feature-card__mini task-feature-card__mini--two" />
            </div>

            <div className="task-feature-card__support">
              <div className="task-feature-card__modes">
                <span><FileText size={13} /> {t('home.textMode')}</span>
                <span><Image size={13} /> {t('home.imageMode')}</span>
              </div>
              <span className="task-feature-card__support-label"><Sparkles size={14} /> {t('home.taskDetects')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-grid home-grid--featured">
        <div className="feature-card feature-card--mission">
          <div className="mission-card__label">{t('home.lastProgress')}</div>

          <div className="feature-card__header feature-card__header--mission">
            <div className="feature-card__title-wrap">
              <p className="eyebrow eyebrow--compact">{t('home.continueLearning')}</p>
              <h3>{hasGames ? t('home.continueWith', { topic: lastTopic.name }) : t('home.firstPractice')}</h3>
            </div>
            <div className="reward-badge" aria-label={`${lastTopicProgress.gamesPlayed} partidas en ${lastTopic.name}`}>
              <span>{lastTopicProgress.gamesPlayed}</span>
              <small>{t('game.results.gamesPlayed')}</small>
            </div>
          </div>

          <div className="mission-card__body">
            <div className="mission-card__objective">
              <span className="label">{t('home.objective')}</span>
              <p>
                {hasGames
                  ? t('home.matchesSummary', { correct: lastTopicProgress.correctAnswers, accuracy: lastTopicProgress.accuracy })
                  : t('home.chooseLocalMission')}
              </p>
            </div>
          </div>

          <Link to={userProgress.lastTopic ? `/tema/${lastTopic.id}` : '/mapa'} className="secondary-button mission-card__cta">
            {hasGames ? t('home.continue') : t('home.exploreTopic')}
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="feature-card feature-card--quest">
          <div className="feature-card__header feature-card__header--stacked feature-card__header--quest">
            <p className="eyebrow">{t('home.localMission')}</p>
            <div className="quest-header">
              <h3>{dailyMission ? t(missionCopyKeys[dailyMission.id as keyof typeof missionCopyKeys]?.[0] ?? 'home.missionsComplete') : t('home.missionsComplete')}</h3>
              <span className={`mission-status mission-status--${dailyMission?.status === 'claimed' ? 'completed' : dailyMission?.status ?? 'new'}`}>
                {t(dailyMission ? `status.${dailyMission.status}` as 'status.new' : 'status.new')}
              </span>
            </div>
          </div>

          <div className="challenge-box">
            <div className="challenge-box__meta challenge-box__meta--primary">
              <span className="label">{t('common.topic')}</span>
              <strong>{missionTopic?.name ?? t('home.anyTopic')}</strong>
            </div>

            <div className="challenge-box__reward">
              <div className="challenge-box__reward-copy">
                <span className="label">{t('home.reward')}</span>
                <strong>+{dailyMission?.rewardXp ?? 0} XP</strong>
              </div>
              <span className="reward-token" aria-label={t('home.rewardXp', { xp: dailyMission?.rewardXp ?? 0 })}>+{dailyMission?.rewardXp ?? 0}</span>
            </div>

            <Link to="/misiones" className="primary-button primary-button--compact challenge-cta">
              <Play size={16} />
              {dailyMission?.status === 'completed' ? t('home.claimXp') : t('home.viewMission')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
