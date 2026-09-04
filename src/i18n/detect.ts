import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES, isLocale, type Locale } from './config'

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

export function resolveInitialLocale(): Locale {
  const stored = readStoredLocale()
  if (stored) return stored

  if (typeof navigator !== 'undefined') {
    const candidates = [...(navigator.languages ?? []), navigator.language]
    for (const candidate of candidates) {
      const match = matchLocale(candidate)
      if (match) return match
    }
  }

  return DEFAULT_LOCALE
}
