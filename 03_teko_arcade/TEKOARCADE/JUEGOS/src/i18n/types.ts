export const languageOptions = [
  { code: 'es', label: 'Español', shortLabel: 'ES' },
  { code: 'es_py', label: 'Español paraguayo', shortLabel: 'PY' },
  { code: 'jopara', label: 'Jopara', shortLabel: 'JP' },
] as const

export type Language = (typeof languageOptions)[number]['code']
export type TranslationParams = Record<string, string | number>

export const DEFAULT_LANGUAGE: Language = 'es_py'
export const LANGUAGE_STORAGE_KEY = 'teko-language'