import { useLanguage } from '../../i18n/LanguageProvider'

interface StarRatingProps {
  value: number
  max?: number
  size?: number
}

export function StarRating({ value, max = 3, size = 14 }: StarRatingProps) {
  const { t } = useLanguage()
  const safeValue = Math.max(0, Math.min(max, value))

  return (
    <div className="star-rating" aria-label={t('progress.starsAria', { value: safeValue, max })}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < safeValue

        return (
          <span
            key={`star-${index}`}
            className={`star-rating__star ${filled ? 'is-filled' : ''}`}
            style={{ fontSize: `${size}px` }}
            aria-hidden="true"
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
