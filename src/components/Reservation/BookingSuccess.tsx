import { Link } from 'react-router-dom'
import { tableById, zoneById } from '@/data/tables/floorPlan'
import type { Booking } from '@/services/booking'
import { useI18n } from '@/i18n/useI18n'
import { RoofMark } from '@/components/Brand/Logo'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import styles from './BookingSuccess.module.css'

export function BookingSuccess({ booking, onReset }: { booking: Booking; onReset: () => void }) {
  const { t, formatDate } = useI18n()
  const table = tableById.get(booking.tableId)
  const zone = table ? zoneById.get(table.zone) : undefined

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.seal} aria-hidden="true">
          <RoofMark />
        </span>

        <h2 className={styles.title}>{t('reservation.success.title')}</h2>
        <p className={styles.body}>{t('reservation.success.body', { phone: booking.phone })}</p>

        <GoldDivider className={styles.divider} />

        <dl className={styles.details}>
          <div>
            <dt>{t('reservation.summary.date')}</dt>
            <dd>
              {formatDate(new Date(`${booking.date}T00:00:00`), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt>{t('reservation.summary.time')}</dt>
            <dd>{booking.time}</dd>
          </div>
          <div>
            <dt>{t('reservation.summary.guests')}</dt>
            <dd>{booking.partySize}</dd>
          </div>
          <div>
            <dt>{t('reservation.summary.table')}</dt>
            <dd>
              {table ? t('reservation.table.tableLabel', { label: table.label }) : booking.tableId}
              {zone && <span className={styles.zone}>{t(`floorPlan.zones.${zone.labelKey}`)}</span>}
            </dd>
          </div>
          <div>
            <dt>{t('reservation.summary.name')}</dt>
            <dd>{booking.name}</dd>
          </div>
          {booking.notes && (
            <div className={styles.wide}>
              <dt>{t('reservation.summary.notes')}</dt>
              <dd>{booking.notes}</dd>
            </div>
          )}
        </dl>

        <p className={styles.reference}>
          {t('reservation.success.reference')} <strong>{booking.reference}</strong>
        </p>

        <div className={styles.actions}>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            {t('reservation.success.addAnother')}
          </button>
          <Link to="/" className="btn">
            {t('reservation.success.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
