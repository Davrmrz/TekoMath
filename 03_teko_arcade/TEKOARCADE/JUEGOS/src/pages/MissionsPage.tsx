import { useState } from 'react'
import { ArrowRight, Check, Sparkles, Star, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTopicById } from '../data/topics'
import type { LocalMission } from '../services/missionEngine'
import { missionService } from '../services/missionService'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TranslationKey } from '../i18n/translations'
import { useSound } from '../audio/useSound'

type MissionFilter = 'all' | 'active' | 'claimable' | 'claimed'

const missionFilters: Array<{ id: MissionFilter; label: TranslationKey }> = [
  { id: 'all', label: 'missions.all' },
  { id: 'active', label: 'missions.inProgress' },
  { id: 'claimable', label: 'missions.claimable' },
  { id: 'claimed', label: 'missions.claimed' },
]

const missionCopyKeys: Record<string, { title: TranslationKey; description: TranslationKey }> = {
  'games-2': { title: 'missions.games2.title', description: 'missions.games2.description' },
  'correct-5': { title: 'missions.correct5.title', description: 'missions.correct5.description' },
  'combo-3': { title: 'missions.combo3.title', description: 'missions.combo3.description' },
  'practice-sin': { title: 'missions.practiceSin.title', description: 'missions.practiceSin.description' },
  'xp-50': { title: 'missions.xp50.title', description: 'missions.xp50.description' },
}

function matchesFilter(mission: LocalMission, filter: MissionFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return mission.status === 'new' || mission.status === 'active'
  if (filter === 'claimable') return mission.status === 'completed'
  return mission.status === 'claimed'
}

function MissionReward({ xp }: { xp: number }) {
  const { t } = useLanguage()
  return (
    <div className="mission-reward">
      <span>+{xp}</span>
      <small>{t('common.xp')}</small>
    </div>
  )
}

function MissionProgress({ current, total }: { current: number; total: number }) {
  const { t } = useLanguage()
  const percent = total === 0 ? 0 : Math.min(100, Math.max(0, (current / total) * 100))
  return (
    <div className="mission-progress">
      <div className="mission-progress__meta">
        <span>{t('missions.progress')}</span>
        <strong>{current} / {total}</strong>
      </div>
      <div
        className="mission-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={t('missions.progressValue', { current, total })}
      >
        <span className="mission-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function MissionCard({
  mission,
  onClaim,
}: {
  mission: LocalMission
  onClaim: (mission: LocalMission) => void
}) {
  const { t } = useLanguage()
  const topicName = mission.topicId ? getTopicById(mission.topicId)?.name ?? mission.topicId : 'General'
  const statusClass = mission.status === 'claimed' ? 'completed' : mission.status
  const copyKeys = missionCopyKeys[mission.id]
  const title = copyKeys ? t(copyKeys.title) : mission.title
  const description = copyKeys ? t(copyKeys.description) : mission.description
  const statusKeys: Record<LocalMission['status'], TranslationKey> = {
    new: 'status.new',
    active: 'status.active',
    completed: 'status.completed',
    claimed: 'status.claimed',
  }

  return (
    <article className={`mission-card${mission.status === 'completed' || mission.status === 'claimed' ? ' is-completed' : ''}`}>
      <div className="mission-card__top">
        <div className="mission-card__info">
          <span className="mission-card__eyebrow">{topicName}</span>
          <h3 className="mission-card__title">{title}</h3>
        </div>
        <div className="mission-card__reward-state">
          <MissionReward xp={mission.rewardXp} />
          <span className={`mission-status mission-status--${statusClass}`}>{t(statusKeys[mission.status])}</span>
        </div>
      </div>

      <div className="mission-card__rule"><Zap size={14} /><span>{t('missions.localRule')}</span></div>

      <div className="mission-card__objective-block">
        <span className="mission-card__objective-label">{t('missions.goal')}</span>
        <p className="mission-card__objective">{description}</p>
      </div>

      <MissionProgress current={mission.current} total={mission.target} />

      <div className="mission-card__secondary">
        {mission.status === 'claimed' ? <><Check size={15} /><span>{t('missions.rewardClaimed')}</span></> : mission.status === 'completed' ? <><Star size={15} /><span>{t('missions.goalCompleted')}</span></> : <><Star size={15} /><span>{t('missions.progressSaved')}</span></>}
      </div>

      <div className="mission-card__footer">
        {mission.status === 'completed' ? (
          <button type="button" className="compact-button compact-button--success" onClick={() => onClaim(mission)}>
            {t('missions.claimReward')} <ArrowRight size={15} />
          </button>
        ) : mission.status === 'claimed' ? (
          <button type="button" className="compact-button compact-button--success" disabled>{t('missions.claimedButton')} <Check size={15} /></button>
        ) : (
          <Link to={mission.topicId ? `/tema/${mission.topicId}` : '/mapa'} className="compact-button compact-button--primary">
            {t('missions.practice')} <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </article>
  )
}

export function MissionsPage() {
  const { t } = useLanguage()
  const { playSound } = useSound()
  const [missions, setMissions] = useState(() => missionService.getMissions())
  const [filter, setFilter] = useState<MissionFilter>('all')
  const [claimMessage, setClaimMessage] = useState('')
  const activeCount = missions.filter((mission) => mission.status === 'new' || mission.status === 'active').length
  const completedCount = missions.filter((mission) => mission.status === 'completed' || mission.status === 'claimed').length
  const availableXp = missions.filter((mission) => mission.status === 'completed').reduce((sum, mission) => sum + mission.rewardXp, 0)
  const visibleMissions = missions.filter((mission) => matchesFilter(mission, filter))
  const spotlight = missions.find((mission) => mission.status === 'completed')
    ?? missions.find((mission) => mission.status === 'active' || mission.status === 'new')
  const summaryStats = [
    { label: 'missions.active', value: String(activeCount) },
    { label: 'missions.completed', value: String(completedCount) },
    { label: 'missions.xpToClaim', value: String(availableXp) },
  ]

  const claimReward = (mission: LocalMission) => {
    const result = missionService.claimReward(mission.id)
    setMissions(missionService.getMissions())
    if (result.claimed) playSound('mission.claim')
    setClaimMessage(result.claimed ? t('missions.rewardSuccess', { xp: result.xp }) : t('missions.rewardAlreadyClaimed'))
  }

  return (
    <section className="missions-page page-shell">
      <header className="missions-header">
        <div className="missions-header__content">
          <p className="eyebrow">{t('missions.title')}</p>
          <h2>{t('missions.route')}</h2>
          <p className="section-copy">{t('missions.description')}</p>
        </div>

      </header>

      <div className="missions-summary" aria-label={t('missions.summary')}>
        {summaryStats.map((stat) => (
          <div key={stat.label} className="missions-summary__item">
            <span>{t(stat.label as TranslationKey)}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="missions-toolbar">
        <div className="missions-filters" aria-label={t('missions.filters')}>
          {missionFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              className={`filter-chip ${filter === item.id ? 'is-active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>

        <div className="missions-toolbar__meta">
          <Trophy size={15} />
          <span>{t('missions.challengeCount', { count: visibleMissions.length })}</span>
        </div>
      </div>

      <div className="missions-grid">
        {visibleMissions.map((mission) => <MissionCard key={mission.id} mission={mission} onClaim={claimReward} />)}
      </div>

      {claimMessage ? <p className="mission-claim-message" role="status">{claimMessage}</p> : null}
      {spotlight ? <div className="missions-spotlight" aria-label={t('missions.spotlightLabel')}>
        <div className="missions-spotlight__icon"><Sparkles size={18} /></div>
        <div><span className="eyebrow eyebrow--compact">{t('missions.spotlightLabel')}</span><p>{missionCopyKeys[spotlight.id] ? t(missionCopyKeys[spotlight.id].title) : spotlight.title} · {spotlight.current}/{spotlight.target}</p></div>
      </div> : null}
    </section>
  )
}
