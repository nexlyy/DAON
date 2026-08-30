import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES, isLocale, type Locale } from './config'

/**
 * Maps a BCP-47 tag onto a supported locale: "ko-KR" and "ko" both become
 * Korean, "pl-PL" becomes Polish, anything else falls back to English.
 */
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
    // Private mode or blocked storage — fall through to detection.
    return null
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Nothing to do; the choice just will not survive a reload.
  }
}

/**
 * A language the guest picked by hand always wins. Otherwise the device
 * languages decide, in the order the browser reports them.
 */
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
