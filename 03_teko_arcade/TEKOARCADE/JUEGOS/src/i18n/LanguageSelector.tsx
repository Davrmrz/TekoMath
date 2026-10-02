import { Globe, Languages } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useLanguage } from './LanguageProvider'
import { useSound } from '../audio/useSound'
import { languageOptions, type Language } from './types'
import './LanguageSelector.css'

const optionKeys: Record<Language, 'language.es' | 'language.es_py' | 'language.jopara'> = {
  es: 'language.es',
  es_py: 'language.es_py',
  jopara: 'language.jopara',
}

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()
  const { playSound } = useSound()
  const [isOpen, setIsOpen] = useState(false)
  const selected = languageOptions.find((option) => option.code === language) ?? languageOptions[0]

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setIsOpen(false)
  }

  return (
    <div className="language-selector" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="language-selector__trigger"
        aria-label={t('language.selectorLabel')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={t(optionKeys[selected.code])}
        onClick={() => {
          playSound(isOpen ? 'ui.close' : 'ui.open')
          setIsOpen((open) => !open)
        }}
      >
        <Globe size={14} aria-hidden="true" />
        <span>{selected.shortLabel}</span>
        <Languages size={13} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="language-selector__menu" role="menu" aria-label={t('language.selectorLabel')}>
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.code}
              className={`language-selector__option${language === option.code ? ' is-selected' : ''}`}
              onClick={() => {
                setLanguage(option.code)
                setIsOpen(false)
              }}
            >
              <span className="language-selector__option-short">{option.shortLabel}</span>
              <span>{t(optionKeys[option.code])}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}