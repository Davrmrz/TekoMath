import { ArrowRight } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageProvider'

interface SessionSummaryProps {
  topic: string
  gameName: string
  sourceLabel: string
  exercise: string
  difficulty: string
  onConfirm: () => void
  disabled?: boolean
}

export function SessionSummary({
  topic,
  gameName,
  sourceLabel,
  exercise,
  difficulty,
  onConfirm,
  disabled = false,
}: SessionSummaryProps) {
  const { t } = useLanguage()
  return (
    <div className="session-summary">
      <div className="session-summary__header">
        <p className="eyebrow">{t('session.preparation')}</p>
        <h3>{t('session.confirm')}</h3>
      </div>

      <div className="session-summary__grid">
        <div className="session-summary__item">
          <span className="label">{t('common.topic')}</span>
          <strong>{topic}</strong>
        </div>
        <div className="session-summary__item">
          <span className="label">{t('common.game')}</span>
          <strong>{gameName}</strong>
        </div>
        <div className="session-summary__item">
          <span className="label">{t('session.origin')}</span>
          <strong>{sourceLabel}</strong>
        </div>
        <div className="session-summary__item">
          <span className="label">{t('common.difficulty')}</span>
          <strong>{difficulty}</strong>
        </div>
      </div>

      <div className="session-summary__exercise">
        <span className="label">{t('common.exercise')}</span>
        <p>{exercise}</p>
      </div>

      <button type="button" className="primary-button primary-button--full" onClick={onConfirm} disabled={disabled}>
        {t('session.start')}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}
