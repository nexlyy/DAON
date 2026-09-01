import { useMemo, useState } from 'react'
import { toISODate } from '@/services/booking'
import { reservation as reservationConfig } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import styles from './DatePicker.module.css'

interface Props {
  value: string | null
  closedDates: string[]
  onChange: (iso: string) => void
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export function DatePicker({ value, closedDates, onChange }: Props) {
  const { t, list } = useI18n()
  const today = startOfDay(new Date())
  const closed = useMemo(() => new Set(closedDates), [closedDates])

  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const lastBookable = new Date(today)
  lastBookable.setDate(lastBookable.getDate() + reservationConfig.maxDaysAhead)

  const months = list('months')
  const dayNames = list('days.narrow')
  // Monday-first grid, which is what Polish and Korean calendars use.
  const weekdays = [1, 2, 3, 4, 5, 6, 0]

  const cells = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()

    const result: (Date | null)[] = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
    }
    return result
  }, [cursor])

  const canGoBack = cursor > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoForward =
    new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <=
    new Date(lastBookable.getFullYear(), lastBookable.getMonth(), 1)

  const shift = (months: number) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + months, 1))

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.nav}
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label={t('reservation.date.previousMonth')}
        >
          <Chevron direction="left" />
        </button>
        <p className={styles.month} aria-live="polite">
          {months[cursor.getMonth()]} <span>{cursor.getFullYear()}</span>
        </p>
        <button
          type="button"
          className={styles.nav}
          onClick={() => shift(1)}
          disabled={!canGoForward}
          aria-label={t('reservation.date.nextMonth')}
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {weekdays.map((day, index) => (
          <span key={index}>{dayNames[day]}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((date, index) => {
          if (!date) return <span key={`pad-${index}`} className={styles.pad} />

          const iso = toISODate(date)
          const isPast = date < today
          const isFar = date > lastBookable
          const isClosed = closed.has(iso)
          const disabled = isPast || isFar || isClosed
          const isToday = iso === toISODate(today)

          return (
            <button
              key={iso}
              type="button"
              className={styles.day}
              disabled={disabled}
              data-today={isToday || undefined}
              data-closed={isClosed || undefined}
              aria-pressed={value === iso}
              onClick={() => onChange(iso)}
            >
              <span>{date.getDate()}</span>
              {isClosed && <span className={styles.closedMark} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
