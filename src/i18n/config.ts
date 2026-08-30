export const LOCALES = ['en', 'pl', 'ko'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Key used to remember a language the guest picked by hand. */
export const LOCALE_STORAGE_KEY = 'daon.locale'

export const LOCALE_META: Record<Locale, { label: string; english: string; htmlLang: string }> = {
  en: { label: 'English', english: 'English', htmlLang: 'en' },
  pl: { label: 'Polski', english: 'Polish', htmlLang: 'pl' },
  ko: { label: '한국어', english: 'Korean', htmlLang: 'ko' },
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
