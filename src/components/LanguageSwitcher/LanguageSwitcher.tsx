import { useEffect, useId, useRef, useState } from 'react'
import { LOCALES, LOCALE_META, type Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/useI18n'
import styles from './LanguageSwitcher.module.css'

interface Props {
  variant?: 'menu' | 'inline'
}

export function LanguageSwitcher({ variant = 'menu' }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (next: Locale) => {
    setLocale(next)
    setOpen(false)
  }

  if (variant === 'inline') {
    return (
      <div className={styles.inline} role="group" aria-label={t('nav.language')}>
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={styles.inlineOption}
            aria-current={code === locale || undefined}
            onClick={() => choose(code)}
          >
            {LOCALE_META[code].label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('nav.language')}: ${LOCALE_META[locale].english}`}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon />
        <span className={styles.current}>{locale.toUpperCase()}</span>
        <span className={styles.chevron} data-open={open || undefined} aria-hidden="true" />
      </button>

      <ul className={styles.list} id={listId} data-open={open || undefined} role="listbox">
        {LOCALES.map((code) => (
          <li key={code}>
            <button
              type="button"
              role="option"
              aria-selected={code === locale}
              className={styles.option}
              onClick={() => choose(code)}
            >
              <span className={styles.optionLabel}>{LOCALE_META[code].label}</span>
              <span className={styles.optionCode}>{code.toUpperCase()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="10" cy="10" r="7.2" />
        <ellipse cx="10" cy="10" rx="3.1" ry="7.2" />
        <path d="M3 10h14M4.4 6.1h11.2M4.4 13.9h11.2" />
      </g>
    </svg>
  )
}
