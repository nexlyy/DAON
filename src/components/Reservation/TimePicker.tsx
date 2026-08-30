import { useMemo } from 'react'
import type { TimeSlot } from '@/services/booking'
import { useI18n } from '@/i18n/useI18n'
import styles from './TimePicker.module.css'

interface Props {
  slots: TimeSlot[]
  value: string | null
  loading: boolean
  onChange: (time: string) => void
}

/** Anything before 16:00 is lunch service; the rest is dinner. */
const DINNER_FROM = 16

export function TimePicker({ slots, value, loading, onChange }: Props) {
  const { t } = useI18n()

  const groups = useMemo(() => {
    const lunch = slots.filter((slot) => Number(slot.time.split(':')[0]) < DINNER_FROM)
    const dinner = slots.filter((slot) => Number(slot.time.split(':')[0]) >= DINNER_FROM)
    return [
      { key: 'lunch', label: t('reservation.time.lunch'), slots: lunch },
      { key: 'dinner', label: t('reservation.time.dinner'), slots: dinner },
    ].filter((group) => group.slots.length > 0)
  }, [slots, t])

  if (loading) {
    return (
      <div className={styles.skeleton} aria-live="polite" aria-busy="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} />
        ))}
        <span className="visually-hidden">{t('common.loading')}</span>
      </div>
    )
  }

  if (!slots.some((slot) => slot.available)) {
    return <p className={styles.none}>{t('reservation.time.none')}</p>
  }

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <h3 className={styles.groupLabel}>{group.label}</h3>
          <div className={styles.slots}>
            {group.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                className={styles.slot}
                disabled={!slot.available}
                aria-pressed={value === slot.time}
                onClick={() => onChange(slot.time)}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
