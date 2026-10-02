import { useLanguage } from '../../i18n/LanguageProvider'

interface ProgressBarProps {
  value: number
  compact?: boolean
  className?: string
}

export function ProgressBar({ value, compact = false, className = '' }: ProgressBarProps) {
  const { t } = useLanguage()
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div
      className={`progress-bar ${compact ? 'progress-bar--compact' : ''} ${className}`.trim()}
      aria-label={t('progress.barAria', { value: safeValue })}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <span style={{ width: `${safeValue}%` }} />
    </div>
  )
}
