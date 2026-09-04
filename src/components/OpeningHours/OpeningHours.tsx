import { hoursFor, weekOrder } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import styles from './OpeningHours.module.css'

interface Props {
  labels?: 'long' | 'short'
  className?: string
}

export function OpeningHours({ labels = 'long', className }: Props) {
  const { t, list } = useI18n()
  const dayNames = list(`days.${labels}`)
  const today = new Date().getDay()

  return (
    <dl className={[styles.hours, className].filter(Boolean).join(' ')}>
      {weekOrder.map((day) => {
        const hours = hoursFor(day)
        return (
          <div key={day} data-today={day === today || undefined} data-closed={!hours || undefined}>
            <dt>{dayNames[day]}</dt>
            <dd>{hours ? `${hours[0]} – ${hours[1]}` : t('common.closed')}</dd>
          </div>
        )
      })}
    </dl>
  )
}
