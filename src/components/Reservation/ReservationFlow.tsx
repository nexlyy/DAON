import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { floorPlan, tableById, zoneById } from '@/data/tables/floorPlan'
import type { FloorTable } from '@/data/tables/floorPlan'
import { restaurant, reservation as reservationConfig } from '@/data/restaurant'
import { bookingApi, isDemoBooking, toISODate } from '@/services/booking'
import type { Booking, TableAvailability, TimeSlot } from '@/services/booking'
import { BookingError } from '@/services/booking/types'
import { useI18n } from '@/i18n/useI18n'
import { RestaurantFloorPlan, tableState } from '@/components/RestaurantFloorPlan/RestaurantFloorPlan'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { GuestSelector } from './GuestSelector'
import { StepIndicator } from './StepIndicator'
import { BookingSuccess } from './BookingSuccess'
import styles from './ReservationFlow.module.css'

const STEPS = ['date', 'time', 'guests', 'table', 'confirm'] as const
type Step = (typeof STEPS)[number]

export function ReservationFlow() {
  const { t, formatDate, locale } = useI18n()

  const [step, setStep] = useState<Step>('date')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState<number | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)

  const [closedDates, setClosedDates] = useState<string[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [status, setStatus] = useState<Record<string, TableAvailability>>({})
  const [statusLoading, setStatusLoading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Closed dates only depend on the opening hours, so they load once.
  useEffect(() => {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + reservationConfig.maxDaysAhead)
    let cancelled = false

    bookingApi
      .getClosedDates(toISODate(from), toISODate(to))
      .then((dates) => {
        if (!cancelled) setClosedDates(dates)
      })
      .catch(() => {
        if (!cancelled) setClosedDates([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Party size is not known while the guest is still on the time step, so the
  // slot query asks for "any table at all" and the table step narrows it later.
  useEffect(() => {
    if (!date) return
    let cancelled = false
    setSlotsLoading(true)

    bookingApi
      .getTimeSlots({ date, partySize: partySize ?? 1 })
      .then((result) => {
        if (cancelled) return
        setSlots(result)
        setTime((current) =>
          current && result.some((slot) => slot.time === current && slot.available) ? current : null,
        )
      })
      .catch(() => {
        if (!cancelled) setSlots([])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [date, partySize])

  useEffect(() => {
    if (!date || !time) return
    let cancelled = false
    setStatusLoading(true)

    bookingApi
      .getTableStatus({ date, time, partySize: partySize ?? 1 })
      .then((result) => {
        if (!cancelled) setStatus(result)
      })
      .catch(() => {
        if (!cancelled) setStatus({})
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [date, time, partySize])

  // Drop a table that no longer seats the party or has just been taken.
  useEffect(() => {
    if (!tableId) return
    const table = tableById.get(tableId)
    if (!table) return
    if ((partySize && table.seats < partySize) || status[tableId] === 'occupied') {
      setTableId(null)
    }
  }, [partySize, status, tableId])

  // Move focus to the new step so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    panelRef.current?.focus({ preventScroll: true })
  }, [step])

  const stepIndex = STEPS.indexOf(step)
  const selectedTable = tableId ? tableById.get(tableId) ?? null : null

  const fittingTables = useMemo(
    () =>
      floorPlan.tables.filter(
        (table) => tableState(table, status, tableId, partySize ?? 1) === 'available',
      ),
    [status, tableId, partySize],
  )

  /** Free tables plus the one already chosen, for the compact list on phones. */
  const selectableTables = useMemo(
    () =>
      floorPlan.tables.filter((table) => {
        const state = tableState(table, status, tableId, partySize ?? 1)
        return state === 'available' || state === 'selected'
      }),
    [status, tableId, partySize],
  )

  const canContinue = useMemo(() => {
    switch (step) {
      case 'date':
        return Boolean(date)
      case 'time':
        return Boolean(time)
      case 'guests':
        return Boolean(partySize)
      case 'table':
        return Boolean(tableId)
      default:
        return false
    }
  }, [step, date, time, partySize, tableId])

  const goTo = useCallback((next: Step) => {
    setSubmitError(null)
    setStep(next)
  }, [])

  const back = () => stepIndex > 0 && goTo(STEPS[stepIndex - 1])
  const next = () => stepIndex < STEPS.length - 1 && canContinue && goTo(STEPS[stepIndex + 1])

  const submit = async () => {
    if (!date || !time || !partySize || !tableId) return

    const errors: { name?: string; phone?: string } = {}
    if (!name.trim()) errors.name = t('reservation.errors.nameRequired')
    if (!phone.trim()) errors.phone = t('reservation.errors.phoneRequired')
    else if (phone.replace(/\D/g, '').length < 7) errors.phone = t('reservation.errors.phoneInvalid')

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await bookingApi.createBooking({
        date,
        time,
        partySize,
        tableId,
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        locale,
      })
      setBooking(result)
    } catch (error) {
      const code = error instanceof BookingError ? error.code : 'generic'
      setSubmitError(t(`reservation.errors.${code}`))
      if (code === 'unavailable') {
        setTableId(null)
        goTo('table')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setBooking(null)
    setStep('date')
    setDate(null)
    setTime(null)
    setPartySize(null)
    setTableId(null)
    setName('')
    setPhone('')
    setNotes('')
    setFieldErrors({})
  }

  if (booking) {
    return <BookingSuccess booking={booking} onReset={reset} />
  }

  const prettyDate = date
    ? formatDate(new Date(`${date}T00:00:00`), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null

  return (
    <div className={styles.flow}>
      <StepIndicator steps={STEPS} current={stepIndex} onJump={(index) => goTo(STEPS[index])} />

      <div className={styles.body}>
        <div
          className={styles.panel}
          ref={panelRef}
          tabIndex={-1}
          role="group"
          aria-label={t(`reservation.steps.${step}`)}
          key={step}
        >
          {step === 'date' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.date.title')}</h2>
              <DatePicker value={date} closedDates={closedDates} onChange={setDate} />
            </>
          )}

          {step === 'time' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.time.title')}</h2>
              <p className={styles.stepNote}>{t('reservation.time.subtitle')}</p>
              <TimePicker slots={slots} value={time} loading={slotsLoading} onChange={setTime} />
            </>
          )}

          {step === 'guests' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.guests.title')}</h2>
              <GuestSelector value={partySize} onChange={setPartySize} />
            </>
          )}

          {step === 'table' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.table.title')}</h2>
              <p className={styles.stepNote}>{t('reservation.table.subtitle')}</p>

              <Legend />

              <RestaurantFloorPlan
                status={status}
                selectedId={tableId}
                partySize={partySize ?? 1}
                loading={statusLoading}
                onSelect={(table: FloorTable) => setTableId(table.id)}
              />

              {/* Phones get a plain list as well: tapping a 40px table inside a
                  scrolled plan is fiddly, and this is what screen readers read. */}
              {selectableTables.length > 0 && (
                <div className={styles.tableList}>
                  <p className={styles.tableListTitle}>{t('reservation.table.list')}</p>
                  <div className={styles.tableListItems}>
                    {selectableTables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        className={styles.tableListItem}
                        aria-pressed={tableId === table.id}
                        onClick={() => setTableId(table.id)}
                      >
                        <span className={styles.tableListLabel}>
                          {t('reservation.table.tableLabel', { label: table.label })}
                        </span>
                        <span className={styles.tableListMeta}>
                          {t(`floorPlan.zones.${zoneById.get(table.zone)?.labelKey ?? 'hall'}`)} ·{' '}
                          {t('reservation.table.seats', { count: table.seats })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!statusLoading && fittingTables.length === 0 && !tableId && (
                <p className={styles.warning}>
                  {t('reservation.table.none', { guests: partySize ?? 1 })}
                </p>
              )}

              {selectedTable && (
                <p className={styles.selectedTable}>
                  {t('reservation.table.selected', {
                    label: selectedTable.label,
                    zone: t(
                      `floorPlan.zones.${zoneById.get(selectedTable.zone)?.labelKey ?? 'hall'}`,
                    ),
                    seats: selectedTable.seats,
                  })}
                </p>
              )}
            </>
          )}

          {step === 'confirm' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.details.title')}</h2>

              <div className={styles.fields}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {t('reservation.details.name')}
                    <em>{t('reservation.details.required')}</em>
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    placeholder={t('reservation.details.namePlaceholder')}
                    aria-invalid={Boolean(fieldErrors.name)}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {t('reservation.details.phone')}
                    <em>{t('reservation.details.required')}</em>
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    placeholder={t('reservation.details.phonePlaceholder')}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                  {fieldErrors.phone && (
                    <span className={styles.fieldError}>{fieldErrors.phone}</span>
                  )}
                </label>

                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>{t('reservation.details.notes')}</span>
                  <textarea
                    rows={3}
                    value={notes}
                    placeholder={t('reservation.details.notesPlaceholder')}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </label>
              </div>

              {isDemoBooking && (
                <p className={styles.demo}>
                  {t('reservation.demoNotice', { phone: restaurant.phone })}
                </p>
              )}

              {submitError && (
                <p className={styles.error} role="alert">
                  {submitError}
                </p>
              )}
            </>
          )}
        </div>

        <aside className={styles.summary} aria-label={t('reservation.summary.title')}>
          <p className={styles.summaryBrand}>DAON</p>
          <h2 className={styles.summaryTitle}>{t('reservation.summary.title')}</h2>

          <dl className={styles.summaryList}>
            <SummaryRow
              label={t('reservation.summary.date')}
              value={prettyDate}
              onEdit={date ? () => goTo('date') : undefined}
              editLabel={t('reservation.change')}
            />
            <SummaryRow
              label={t('reservation.summary.time')}
              value={time}
              onEdit={time ? () => goTo('time') : undefined}
              editLabel={t('reservation.change')}
            />
            <SummaryRow
              label={t('reservation.summary.guests')}
              value={partySize ? String(partySize) : null}
              onEdit={partySize ? () => goTo('guests') : undefined}
              editLabel={t('reservation.change')}
            />
            <SummaryRow
              label={t('reservation.summary.table')}
              value={
                selectedTable
                  ? t('reservation.table.tableLabel', { label: selectedTable.label })
                  : null
              }
              onEdit={selectedTable ? () => goTo('table') : undefined}
              editLabel={t('reservation.change')}
            />
          </dl>

          {step === 'confirm' ? (
            <button type="button" className={`btn ${styles.confirm}`} disabled={submitting} onClick={submit}>
              {submitting ? t('reservation.summary.sending') : t('reservation.summary.confirm')}
            </button>
          ) : (
            <button type="button" className={`btn ${styles.confirm}`} disabled={!canContinue} onClick={next}>
              {t('reservation.next')}
            </button>
          )}

          {stepIndex > 0 && (
            <button type="button" className={`btn btn--quiet ${styles.back}`} onClick={back}>
              ← {t('reservation.back')}
            </button>
          )}
        </aside>
      </div>

      {/* Repeated below the panel so the actions stay reachable on phones */}
      <div className={styles.mobileBar}>
        {stepIndex > 0 && (
          <button type="button" className="btn btn--ghost" onClick={back}>
            {t('reservation.back')}
          </button>
        )}
        {step === 'confirm' ? (
          <button type="button" className="btn" disabled={submitting} onClick={submit}>
            {submitting ? t('reservation.summary.sending') : t('reservation.summary.confirm')}
          </button>
        ) : (
          <button type="button" className="btn" disabled={!canContinue} onClick={next}>
            {t('reservation.next')}
          </button>
        )}
      </div>

      <p className="visually-hidden" aria-live="polite">
        {t('reservation.stepOf', { current: stepIndex + 1, total: STEPS.length })}
      </p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string
  value: string | null
  onEdit?: () => void
  editLabel: string
}) {
  return (
    <div className={styles.summaryRow} data-filled={Boolean(value) || undefined}>
      <dt>{label}</dt>
      <dd>
        <span>{value ?? '—'}</span>
        {onEdit && (
          <button type="button" onClick={onEdit}>
            {editLabel}
          </button>
        )}
      </dd>
    </div>
  )
}

function Legend() {
  const { t } = useI18n()
  const states = ['available', 'selected', 'occupied', 'disabled'] as const

  return (
    <ul className={styles.legend}>
      {states.map((state) => (
        <li key={state}>
          <span className={styles.swatch} data-state={state} aria-hidden="true" />
          {t(`reservation.table.legend.${state}`)}
        </li>
      ))}
    </ul>
  )
}
