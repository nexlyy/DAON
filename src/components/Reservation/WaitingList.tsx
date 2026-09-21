/**
 * The waiting list, offered where the booking form runs out: a day with no
 * free time left, or a time with no table for this many guests.
 *
 * It says plainly what it is — not a booking. The guest leaves a name and a
 * number, the staff get a card in Telegram, and somebody calls if a table
 * frees up. Nothing is held and nothing is promised beyond that call.
 */
import { useEffect, useState } from 'react'
import { reservation, restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import { BookingError, bookingApi } from '@/services/booking'
import flow from './ReservationFlow.module.css'
import styles from './WaitingList.module.css'

interface Props {
  date: string
  times: string[]
  time?: string | null
  partySize?: number | null
  /** Everything is taken: the offer is the next step, not a footnote. */
  urgent?: boolean
}

export function WaitingList({ date, times, time, partySize, urgent = false }: Props) {
  const { t, locale, formatDate } = useI18n()
  const [open, setOpen] = useState(urgent)
  const [chosenTime, setChosenTime] = useState(time ?? times[0] ?? '')
  const [guests, setGuests] = useState(partySize ?? 2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [failure, setFailure] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ time: string } | null>(null)

  // A different day or time chosen above is a different request.
  useEffect(() => {
    setDone(null)
    setFailure('')
    setChosenTime(time ?? times[0] ?? '')
  }, [date, time, times])

  useEffect(() => {
    if (partySize) setGuests(partySize)
  }, [partySize])

  useEffect(() => {
    if (urgent) setOpen(true)
  }, [urgent])

  if (times.length === 0) return null

  const day = formatDate(new Date(`${date}T00:00:00`), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const submit = async () => {
    const found: typeof errors = {}
    if (!name.trim()) found.name = t('reservation.errors.nameRequired')
    if (!phone.trim()) found.phone = t('reservation.errors.phoneRequired')
    else if (phone.replace(/\D/g, '').length < 7) found.phone = t('reservation.errors.phoneInvalid')
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSending(true)
    setFailure('')
    try {
      await bookingApi.joinWaitlist({
        date,
        time: chosenTime,
        partySize: guests,
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        locale,
      })
      setDone({ time: chosenTime })
    } catch (error) {
      const code = error instanceof BookingError ? error.code : undefined
      setFailure(
        code === 'phoneLimit'
          ? t('reservation.waitlist.phoneLimit', { phone: restaurant.phone })
          : code === 'rateLimit'
            ? t('reservation.errors.rateLimit', { phone: restaurant.phone })
            : t('reservation.waitlist.failed', { phone: restaurant.phone }),
      )
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className={styles.box} data-done>
        <p className={styles.title}>{t('reservation.waitlist.title')}</p>
        <p className={styles.lead} role="status">
          {t('reservation.waitlist.done', { date: day, time: done.time, phone: phone.trim() })}
        </p>
        <p className={styles.small}>{t('reservation.waitlist.notBooking')}</p>
      </div>
    )
  }

  if (!open) {
    return (
      <div className={styles.invite}>
        <span>{t('reservation.waitlist.invite')}</span>
        <button type="button" className={styles.link} onClick={() => setOpen(true)}>
          {t('reservation.waitlist.open')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.box} data-urgent={urgent || undefined}>
      <p className={styles.title}>{t('reservation.waitlist.title')}</p>
      <p className={styles.lead}>
        {urgent && <>{t('reservation.waitlist.full')} </>}
        {t('reservation.waitlist.lead')}
      </p>

      <div className={flow.fields}>
        <label className={flow.field}>
          <span className={flow.fieldLabel}>{t('reservation.waitlist.time')}</span>
          <select value={chosenTime} onChange={(event) => setChosenTime(event.target.value)}>
            {times.map((one) => (
              <option key={one} value={one}>
                {one}
              </option>
            ))}
          </select>
        </label>

        <label className={flow.field}>
          <span className={flow.fieldLabel}>{t('reservation.waitlist.guests')}</span>
          <select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
            {Array.from({ length: reservation.maxPartySize }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className={flow.field}>
          <span className={flow.fieldLabel}>
            {t('reservation.details.name')}
            <em>{t('reservation.details.required')}</em>
          </span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            placeholder={t('reservation.details.namePlaceholder')}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name && <span className={flow.fieldError}>{errors.name}</span>}
        </label>

        <label className={flow.field}>
          <span className={flow.fieldLabel}>
            {t('reservation.details.phone')}
            <em>{t('reservation.details.required')}</em>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            placeholder={t('reservation.details.phonePlaceholder')}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => setPhone(event.target.value)}
          />
          {errors.phone && <span className={flow.fieldError}>{errors.phone}</span>}
        </label>

        <label className={`${flow.field} ${flow.fieldWide}`}>
          <span className={flow.fieldLabel}>
            {t('reservation.details.notes')}
            <em>{t('reservation.details.optional')}</em>
          </span>
          <textarea
            rows={2}
            value={notes}
            maxLength={300}
            placeholder={t('reservation.waitlist.notesPlaceholder')}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {failure && (
        <p className={flow.error} role="alert">
          {failure}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className="btn" disabled={sending} onClick={() => void submit()}>
          {sending ? t('reservation.waitlist.sending') : t('reservation.waitlist.submit')}
        </button>
        {!urgent && (
          <button type="button" className={styles.link} onClick={() => setOpen(false)}>
            {t('reservation.waitlist.hide')}
          </button>
        )}
      </div>

      <p className={styles.small}>{t('reservation.waitlist.notBooking')}</p>
      <p className={styles.small}>{t('reservation.waitlist.privacy')}</p>
    </div>
  )
}
