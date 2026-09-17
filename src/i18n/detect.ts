import { LOCALE_STORAGE_KEY, LOCALES, isLocale, type Locale } from './config'

export function matchLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null
  const primary = tag.toLowerCase().split('-')[0]
  return LOCALES.find((locale) => locale === primary) ?? null
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
  }
}
