import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/useI18n'
import { usePromo } from '@/promo/usePromo'
import styles from './PromoRibbon.module.css'

const KEY = 'daon.promo.hidden'

function readHidden() {
  try {
    return window.sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function PromoRibbon() {
  const { t, path, page } = useI18n()
  const { id, phase, percent, dates, end } = usePromo()
  const [hidden, setHidden] = useState(readHidden)
  const ref = useRef<HTMLDivElement>(null)

  const stamp = `${id}:${phase}`
  const visible = Boolean(phase) && hidden !== stamp && !page.startsWith('/drinks')

  useEffect(() => {
    const root = document.documentElement
    const node = ref.current
    if (!visible || !node) {
      root.style.setProperty('--promo-offset', '0px')
      return
    }

    const publish = () => root.style.setProperty('--promo-offset', `${node.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    return () => {
      observer.disconnect()
      root.style.setProperty('--promo-offset', '0px')
    }
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    setHidden(stamp)
    try {
      window.sessionStorage.setItem(KEY, stamp)
    } catch {}
  }

  const message = t(phase === 'active' ? 'promo.ribbon.active' : 'promo.ribbon.upcoming', {
    percent,
    dates,
    end,
  })

  return (
    <div className={styles.ribbon} ref={ref} data-phase={phase}>
      <div className={styles.inner}>
        {page === '/menu' ? (
          <p className={styles.message}>{message}</p>
        ) : (
          <Link to={path('/menu')} className={styles.message}>
            {message}
            <span className={styles.cta}>{t('promo.ribbon.cta')} →</span>
          </Link>
        )}
        <button
          type="button"
          className={styles.close}
          onClick={dismiss}
          aria-label={t('promo.ribbon.close')}
        >
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" focusable="false">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
