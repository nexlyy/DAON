import { useEffect, useState } from 'react'
import { LOCALES, ROOT_LOCALE, type Locale } from '@/i18n/config'
import { matchLocale, readStoredLocale, storeLocale } from '@/i18n/detect'
import { translate } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/useI18n'
import styles from './LanguageHint.module.css'

function browserLocale(): Locale | null {
  const tags = [...(navigator.languages ?? []), navigator.language]
  for (const tag of tags) {
    const match = matchLocale(tag)
    if (match) return match
  }
  return null
}

export function LanguageHint() {
  const { locale, setLocale } = useI18n()
  const [offer, setOffer] = useState<Locale | null>(null)

  useEffect(() => {
    if (locale !== ROOT_LOCALE || readStoredLocale()) return
    const wanted = browserLocale()
    if (!wanted || wanted === ROOT_LOCALE || !LOCALES.includes(wanted)) return
    const timer = window.setTimeout(() => setOffer(wanted), 1200)
    return () => window.clearTimeout(timer)
  }, [locale])

  if (!offer || locale !== ROOT_LOCALE) return null

  return (
    <div className={styles.hint} role="region" lang={offer} aria-label={translate(offer, 'nav.language')}>
      <p className={styles.text}>{translate(offer, 'nav.languageHint.text')}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.switch} onClick={() => setLocale(offer)}>
          {translate(offer, 'nav.languageHint.switch')}
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => {
            storeLocale(ROOT_LOCALE)
            setOffer(null)
          }}
        >
          {translate(offer, 'nav.languageHint.dismiss')}
        </button>
      </div>
    </div>
  )
}
