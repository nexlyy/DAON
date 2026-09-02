import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTableLabels, tableById, zoneById } from '@/data/tables/floorPlan'
import { restaurant } from '@/data/restaurant'
import { bookingApi } from '@/services/booking'
import type { Booking } from '@/services/booking'
import { downloadCalendar } from '@/services/booking/calendar'
import { forgetBooking } from '@/services/booking/myBooking'
import { useI18n } from '@/i18n/useI18n'
import { RoofMark } from '@/components/Brand/Logo'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import styles from './BookingSuccess.module.css'

export function BookingSuccess({ booking, onReset }: { booking: Booking; onReset: () => void }) {
  const { t, formatDate } = useI18n()
  const primary = tableById.get(booking.tableIds[0])
  const zone = primary ? zoneById.get(primary.zone) : undefined
  const joined = booking.tableIds.length > 1

  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function cancel() {
    if (!booking.cancelToken) return
    if (!window.confirm(t('reservation.success.cancelConfirm'))) return

    setCancelling(true)
    setCancelError(null)
    try {
      await bookingApi.cancelBooking(booking.reference, booking.cancelToken)
      forgetBooking()
      setCancelled(true)
    } catch {
      setCancelError(t('reservation.success.cancelFailed', { phone: restaurant.phone }))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.seal} aria-hidden="true">
          <RoofMark />
        </span>

        <h2 className={styles.title}>{t('reservation.success.title')}</h2>
        {/* The restaurant's number, not the guest's: nothing is sent to them,
            and the only thing they might need is a way to reach the kitchen. */}
        <p className={styles.body}>
          {t('reservation.success.body', { phone: restaurant.phone })}
        </p>

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
            <dt>{t(joined ? 'reservation.summary.tables' : 'reservation.summary.table')}</dt>
            <dd>
              {joined
                ? formatTableLabels(booking.tableIds)
                : t('reservation.table.tableLabel', { label: formatTableLabels(booking.tableIds) })}
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
          <button
            type="button"
            className="btn btn--delivery"
            onClick={() => downloadCalendar(booking, t('reservation.success.eventTitle'))}
          >
            {t('reservation.success.calendar')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            {t('reservation.success.addAnother')}
          </button>
          <Link to="/" className="btn">
            {t('reservation.success.backHome')}
          </Link>
        </div>

        {/* Nothing is sent to the guest, so the way out has to live on the page
            they end up on — and in their browser, for when they come back. */}
        {booking.cancelToken && (
          <div className={styles.cancel}>
            {cancelled ? (
              <p className={styles.cancelDone}>{t('reservation.success.cancelled')}</p>
            ) : (
              <>
                <p className={styles.cancelTitle}>{t('reservation.success.cancelTitle')}</p>
                <button
                  type="button"
                  className={styles.cancelButton}
                  disabled={cancelling}
                  onClick={cancel}
                >
                  {cancelling
                    ? t('reservation.success.cancelling')
                    : t('reservation.success.cancel')}
                </button>
                {cancelError && <p className={styles.cancelError}>{cancelError}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
