export const LOCALES = ['en', 'pl', 'ko'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const ROOT_LOCALE: Locale = 'pl'

export const LOCALE_PREFIX: Record<Locale, string> = { pl: '', en: '/en', ko: '/ko' }

export const LOCALE_STORAGE_KEY = 'daon.locale'

export const LOCALE_META: Record<
  Locale,
  { label: string; english: string; htmlLang: string; og: string }
> = {
  en: { label: 'English', english: 'English', htmlLang: 'en', og: 'en_GB' },
  pl: { label: 'Polski', english: 'Polish', htmlLang: 'pl', og: 'pl_PL' },
  ko: { label: '한국어', english: 'Korean', htmlLang: 'ko', og: 'ko_KR' },
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

export function splitLocale(pathname: string): { locale: Locale; page: string } {
  const match = /^\/(en|ko)(?=\/|$)(.*)$/.exec(pathname)
  if (match) return { locale: match[1] as Locale, page: match[2] || '/' }
  return { locale: ROOT_LOCALE, page: pathname || '/' }
}

export function localePath(locale: Locale, path: string): string {
  const prefix = LOCALE_PREFIX[locale]
  if (!prefix) return path
  return path === '/' ? prefix : path.startsWith('/#') ? `${prefix}${path.slice(1)}` : `${prefix}${path}`
}
