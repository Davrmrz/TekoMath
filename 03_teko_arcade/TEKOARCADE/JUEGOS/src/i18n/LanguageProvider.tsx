import { createContext, useContext, useState, type ReactNode } from 'react'
import { translate, type TranslationKey } from './translations'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, languageOptions, type Language, type TranslationParams } from './types'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return languageOptions.some((option) => option.code === saved)
      ? saved as Language
      : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>(readInitialLanguage)

  const setLanguage = (nextLanguage: Language) => {
    setCurrentLanguage(nextLanguage)
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    } catch {
      // The selection still applies for the current page when storage is unavailable.
    }
  }

  const t = (key: TranslationKey, params?: TranslationParams) => translate(key, language, params)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider.')
  return context
}