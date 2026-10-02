import type { ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageProvider'

interface ExerciseSourceCardProps {
  title: string
  description: string
  icon: ReactNode
  selected?: boolean
  onClick: () => void
}

export function ExerciseSourceCard({ title, description, icon, selected = false, onClick }: ExerciseSourceCardProps) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      className={`exercise-source-card ${selected ? 'exercise-source-card--selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="exercise-source-card__icon">{icon}</div>
      <div className="exercise-source-card__content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {selected ? <span className="exercise-source-card__badge">{t('common.active')}</span> : null}
    </button>
  )
}
