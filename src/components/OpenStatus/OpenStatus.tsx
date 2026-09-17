import { Link } from 'react-router-dom'
import { useOpenStatus } from '@/hooks/useOpenStatus'
import type { NextOpening, OpenStatus as Status } from '@/lib/openStatus'
import { useI18n } from '@/i18n/useI18n'
import { weekdayOfISO } from '@/lib/warsaw'
import styles from './OpenStatus.module.css'

interface Props {
  variant?: 'pill' | 'line'
  to?: string
  className?: string
}

export function OpenStatus({ variant = 'pill', to, className }: Props) {
  const { t, list, formatDate } = useI18n()
  const { status, ready } = useOpenStatus()

  if (typeof window === 'undefined') return null

  const when = (next: NextOpening) => {
    if (next.daysAhead === 1) return t('status.tomorrow')
    if (next.daysAhead < 7) return list('status.on')[weekdayOfISO(next.iso)]
    const [year, month, day] = next.iso.split('-').map(Number)
    return t('status.onDate', {
      date: formatDate(new Date(year, month - 1, day), { day: 'numeric', month: 'long' }),
    })
  }

  const [headline, detail] = describe(status, t, when)

  const content = (
    <>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.headline}>{headline}</span>
      {detail && (
        <>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <span className={styles.detail}>{detail}</span>
        </>
      )}
    </>
  )

  const shared = {
    className: [styles.status, styles[variant], className].filter(Boolean).join(' '),
    'data-state': status.state,
    'data-ready': ready || undefined,
  }

  return to ? (
    <Link to={to} {...shared}>
      {content}
    </Link>
  ) : (
    <p {...shared}>{content}</p>
  )
}

type Translate = (key: string, params?: Record<string, string | number>) => string

function describe(status: Status, t: Translate, when: (next: NextOpening) => string) {
  const until = status.close ? t('status.until', { close: status.close }) : ''
  const next = status.next ? t('status.next', { day: when(status.next), open: status.next.open }) : ''

  switch (status.state) {
    case 'before':
      return [t('status.before', { open: status.open ?? '' }), until]
    case 'open':
      return [t('status.open'), until]
    case 'soon':
      return [t('status.soon', { minutes: status.minutesLeft ?? 0 }), until]
    case 'after':
      return [t('status.after'), next]
    case 'closed':
      return [t('status.closed'), next]
  }
}
