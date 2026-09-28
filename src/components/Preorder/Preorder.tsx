import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { dishes } from '@/data/menu/dishes'
import { restaurant } from '@/data/restaurant'
import { countKey } from '@/i18n/plural'
import { useI18n } from '@/i18n/useI18n'
import { warsawMinutes, warsawToday, shiftISO } from '@/lib/warsaw'
import { bookingApi } from '@/services/booking'
import type { Preorder as Saved } from '@/services/booking'
import { BookingError } from '@/services/booking/types'
import { PreorderDialog, type Done } from './PreorderDialog'
import { countOf, picksOf, totalOf, type Picks } from './picks'
import styles from './Preorder.module.css'

export interface PreorderTarget {
  reference: string
  token: string
  date: string
  time: string
  partySize: number
}

interface Props {
  booking: PreorderTarget
  /** "card" sits in the confirmation; "banner" is one button next to "change". */
  variant: 'card' | 'banner'
  /** Just booked: nothing to look up yet, and the little window may ask. */
  fresh?: boolean
  buttonClassName?: string
}

const NUDGED = 'daon.preorder.asked'

const alreadyAsked = (reference: string) => {
  try {
    return window.localStorage.getItem(NUDGED) === reference
  } catch {
    return false
  }
}

const rememberAsked = (reference: string) => {
  try {
    window.localStorage.setItem(NUDGED, reference)
  } catch {
  }
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * When the website stops taking changes, in Warsaw time whatever the guest's
 * own clock says: the booking time less what the API asks for.
 */
function closingOf(date: string, time: string, closesBefore: number) {
  let day = date
  let minutes = toMinutes(time) - closesBefore
  while (minutes < 0) {
    day = shiftISO(day, -1)
    minutes += 24 * 60
  }
  const clock = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  const today = warsawToday()
  const open = today < day || (today === day && warsawMinutes() < minutes)
  return { day, clock, open }
}

/**
 * Dishes picked ahead for a booking: the question after booking, the dialog
 * with the menu, and what the restaurant already has.
 */
export function Preorder({ booking, variant, fresh = false, buttonClassName }: Props) {
  const { t, locale, formatDate, formatPrice, resolve } = useI18n()
  const [closesBefore, setClosesBefore] = useState<number | null | undefined>(undefined)
  const [saved, setSaved] = useState<Saved | null | undefined>(fresh ? null : undefined)
  const [picks, setPicks] = useState<Picks>({})
  const [notes, setNotes] = useState('')
  const [edited, setEdited] = useState(false)
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)

  useEffect(() => {
    let gone = false
    bookingApi.getConfig().then((config) => {
      if (!gone) setClosesBefore(config.preorder ? config.preorder.closesBefore : null)
    })
    return () => {
      gone = true
    }
  }, [])

  useEffect(() => {
    if (fresh) return
    let gone = false
    bookingApi
      .lookupBooking(booking.reference, booking.token)
      .then((found) => {
        if (!gone) setSaved(found?.preorder ?? null)
      })
      .catch(() => {
        if (!gone) setSaved(null)
      })
    return () => {
      gone = true
    }
  }, [booking.reference, booking.token, fresh])

  const closing =
    typeof closesBefore === 'number' ? closingOf(booking.date, booking.time, closesBefore) : null
  const available = Boolean(closing?.open) && dishes.length > 0 && saved !== undefined

  // The question comes a moment after the confirmation has been read, once
  // per booking, and never over a pre-order that already exists.
  useEffect(() => {
    if (!fresh || !available || saved || alreadyAsked(booking.reference)) return
    const timer = window.setTimeout(() => {
      rememberAsked(booking.reference)
      setAsking(true)
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [fresh, available, saved, booking.reference])

  const openDialog = () => {
    if (!edited) {
      setPicks(picksOf(saved))
      setNotes(saved?.notes ?? '')
    }
    setError(null)
    setDone(null)
    setAsking(false)
    setOpen(true)
  }

  const close = useCallback(() => setOpen(false), [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setEdited(true)
    setPicks((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[id]
      else next[id] = quantity
      return next
    })
  }, [])

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await bookingApi.savePreorder(
        { reference: booking.reference, token: booking.token },
        {
          items: Object.entries(picks).map(([id, quantity]) => ({ id, quantity })),
          notes: notes.trim() || undefined,
          locale,
        },
      )
      setDone(result ? (saved ? 'changed' : 'sent') : 'removed')
      setSaved(result)
      setPicks(picksOf(result))
      setNotes(result?.notes ?? '')
      setEdited(false)
    } catch (failure) {
      const code = failure instanceof BookingError ? failure.code : 'generic'
      const known = ['closed', 'menu', 'rateLimit'].includes(code) ? code : 'generic'
      setError(t(`reservation.preorder.errors.${known}`, { phone: restaurant.phone }))
    } finally {
      setSaving(false)
    }
  }

  if (closesBefore === null || closesBefore === undefined || saved === undefined) return null
  if (!available && !saved) return null

  // "do 18:00" on the day itself, "do 30 września, 18:00" before it: a date
  // without the weekday reads right after "do", "until" and "까지" alike.
  const deadline = closing
    ? closing.day === warsawToday()
      ? closing.clock
      : `${formatDate(new Date(`${closing.day}T00:00:00`), { day: 'numeric', month: 'long' })}, ${closing.clock}`
    : ''
  const dishesLabel = (count: number) => t(countKey(locale, count, 'reservation.preorder.dishes'), { count })
  const unsent = edited && countOf(picks) > 0
  const nameOf = (line: Saved['lines'][number]) => {
    const current = dishes.find((dish) => dish.id === line.id)
    return current ? resolve(current.name) : line.name[locale as 'en' | 'pl' | 'ko'] ?? line.name.en
  }

  const dialog = open && (
    <PreorderDialog
      booking={booking}
      picks={picks}
      notes={notes}
      hasSaved={Boolean(saved)}
      deadline={deadline}
      saving={saving}
      error={error}
      done={done}
      onQuantity={setQuantity}
      onNotes={(value) => {
        setEdited(true)
        setNotes(value)
      }}
      onSubmit={submit}
      onClose={close}
    />
  )

  const question = asking && !open && (
    <Nudge
      onYes={openDialog}
      onLater={() => setAsking(false)}
    />
  )

  if (variant === 'banner') {
    if (!available) return null
    return (
      <>
        <button type="button" className={buttonClassName} onClick={openDialog}>
          {saved
            ? t('reservation.preorder.bannerSaved', { dishes: dishesLabel(countOf(picksOf(saved))) })
            : t('reservation.preorder.bannerChoose')}
        </button>
        {dialog}
      </>
    )
  }

  return (
    <section className={styles.card} aria-labelledby={`preorder-${booking.reference}`}>
      <p className={styles.eyebrow} id={`preorder-${booking.reference}`}>
        <BowlIcon />
        {t('reservation.preorder.section')}
      </p>

      {saved ? (
        <>
          <ul className={styles.picked}>
            {saved.lines.map((line) => (
              <li key={line.id}>
                <span className={styles.times}>{line.quantity} ×</span>
                <span>{nameOf(line)}</span>
              </li>
            ))}
          </ul>
          {saved.notes && <p className={styles.note}>{saved.notes}</p>}
          <p className={styles.total}>{t('reservation.preorder.totalLine', { total: formatPrice(saved.total) })}</p>
          {available ? (
            <button type="button" className="btn btn--ghost" onClick={openDialog}>
              {t(unsent ? 'reservation.preorder.finish' : 'reservation.preorder.change')}
            </button>
          ) : (
            <p className={styles.small}>{t('reservation.preorder.phoneOnly', { phone: restaurant.phone })}</p>
          )}
        </>
      ) : unsent ? (
        <>
          <p className={styles.lead}>
            {t('reservation.preorder.unsent', {
              dishes: dishesLabel(countOf(picks)),
              total: formatPrice(totalOf(picks)),
            })}
          </p>
          <button type="button" className="btn btn--delivery" onClick={openDialog}>
            {t('reservation.preorder.finish')}
          </button>
        </>
      ) : (
        <>
          <p className={styles.lead}>{t('reservation.preorder.invite')}</p>
          <button type="button" className="btn btn--delivery" onClick={openDialog}>
            {t('reservation.preorder.choose')}
          </button>
        </>
      )}

      {dialog}
      {question}
    </section>
  )
}

/** The small window that asks, once, right after the booking went through. */
function Nudge({ onYes, onLater }: { onYes: () => void; onLater: () => void }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onLater()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onLater])

  return createPortal(
    <div className={styles.nudge} role="dialog" aria-modal="false" aria-labelledby="preorder-ask" aria-describedby="preorder-ask-body">
      <span className={styles.nudgeIcon} aria-hidden="true">
        <BowlIcon large />
      </span>
      <p className={styles.nudgeTitle} id="preorder-ask">
        {t('reservation.preorder.nudgeTitle')}
      </p>
      <p className={styles.nudgeBody} id="preorder-ask-body">
        {t('reservation.preorder.nudgeBody')}
      </p>
      <div className={styles.nudgeActions}>
        <button type="button" className="btn" onClick={onYes}>
          {t('reservation.preorder.nudgeYes')}
        </button>
        <button type="button" className="btn btn--quiet" onClick={onLater}>
          {t('reservation.preorder.nudgeLater')}
        </button>
      </div>
      <button type="button" className={styles.nudgeClose} onClick={onLater}>
        <span className="visually-hidden">{t('reservation.preorder.close')}</span>
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}

function BowlIcon({ large = false }: { large?: boolean }) {
  const size = large ? 24 : 14
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={large ? 1.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 16h22a11 11 0 0 1-22 0Z" />
      <path d="M12 29.5h8" />
      <path d="M17.5 12.5 26.5 3.5M21 12.5l7.5-7" />
      <path d="M10.5 12c0-1.4 1.6-1.7 1.6-3.2s-1.6-1.6-1.6-3.2" />
    </svg>
  )
}
