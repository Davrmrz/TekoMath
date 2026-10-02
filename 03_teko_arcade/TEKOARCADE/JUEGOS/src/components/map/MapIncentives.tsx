import { Gift, Sparkles, Trophy } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageProvider'
import { useSoundMilestone } from '../../audio/useSound'

interface MapRewardProps {
  amount: number
  label: string
}

export function MapReward({ amount, label }: MapRewardProps) {
  const { t } = useLanguage()
  return (
    <div className="map-path__interlude map-path__interlude--reward" aria-label={t('map.rewardAria', { label, xp: amount })}>
      <span className="map-reward__icon"><Gift size={17} /></span>
      <span className="map-reward__copy"><strong>+{amount} XP</strong></span>
      <span className="map-reward__sparkle" aria-hidden="true"><Sparkles size={14} /></span>
    </div>
  )
}

export function MapChest({ amount }: { amount: number }) {
  const { t } = useLanguage()
  const milestoneRef = useSoundMilestone<HTMLDivElement>('reward.chest')
  return (
    <div ref={milestoneRef} className="map-path__interlude map-path__interlude--chest" role="img" aria-label={t('map.rewardChest', { xp: amount })}>
      <span className="map-chest__art" aria-hidden="true"><span className="map-chest__lid" /><span className="map-chest__body" /><span className="map-chest__lock" /></span>
      <span className="map-chest__badge">+{amount} XP</span>
    </div>
  )
}

interface MapCheckpointProps {
  title: string
  subtitle: string
  final?: boolean
}

export function MapCheckpoint({ title, subtitle, final = false }: MapCheckpointProps) {
  const { t } = useLanguage()
  const milestoneRef = useSoundMilestone<HTMLDivElement>(final ? 'map.finalChallenge' : 'map.checkpoint')
  return (
    <div ref={milestoneRef} className={`map-path__interlude map-checkpoint${final ? ' map-checkpoint--final' : ''}`} role="img" aria-label={t('map.checkpointAria', { title, subtitle })}>
      <span className="map-checkpoint__icon"><Trophy size={19} /></span>
      <span className="map-checkpoint__copy"><strong>{title}</strong></span>
      {final ? <Sparkles className="map-checkpoint__sparkle" size={16} aria-hidden="true" /> : null}
    </div>
  )
}