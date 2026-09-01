import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  floorPlan,
  formatTableLabels,
  resolveTableGroup,
  seatsOf,
  tableById,
  zoneById,
} from '@/data/tables/floorPlan'
import type { FloorTable } from '@/data/tables/floorPlan'
import { restaurant, reservation as reservationConfig } from '@/data/restaurant'
import { bookingApi, isDemoBooking, toISODate } from '@/services/booking'
import type { Booking, TableAvailability, TimeSlot } from '@/services/booking'
import { BookingError } from '@/services/booking/types'
import { useI18n } from '@/i18n/useI18n'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { RestaurantFloorPlan, tableState } from '@/components/RestaurantFloorPlan/RestaurantFloorPlan'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { GuestSelector } from './GuestSelector'
import { StepIndicator } from './StepIndicator'
import { BookingSuccess } from './BookingSuccess'
import styles from './ReservationFlow.module.css'

const STEPS = ['date', 'time', 'guests', 'table', 'confirm'] as const
type Step = (typeof STEPS)[number]

/** Środek has no tables, so it never becomes a room tab. */
const zonesWithTables = floorPlan.zones.filter((zone) =>
  floorPlan.tables.some((table) => table.zone === zone.id),
)

export function ReservationFlow() {
  const { t, formatDate, locale } = useI18n()
  const isPhone = useMediaQuery('(max-width: 720px)')

  const [step, setStep] = useState<Step>('date')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState<number | null>(null)
  const [tableIds, setTableIds] = useState<string[]>([])
  const [focusZone, setFocusZone] = useState(zonesWithTables[0].id)

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

  // A change of party size or a table going in the meantime can invalidate the
  // group; rebuild it around the same first table, and drop it if that fails.
  useEffect(() => {
    if (tableIds.length === 0) return
    const stillFree = (id: string) => (status[id] ?? 'available') === 'available'
    const rebuilt = resolveTableGroup(tableIds[0], partySize ?? 1, stillFree)
    const unchanged = rebuilt?.length === tableIds.length && rebuilt.every((id, i) => id === tableIds[i])
    if (!unchanged) setTableIds(rebuilt ?? [])
  }, [partySize, status, tableIds])

  // Move focus to the new step so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    panelRef.current?.focus({ preventScroll: true })
  }, [step])

  const stepIndex = STEPS.indexOf(step)
  const primaryTable = tableIds.length > 0 ? tableById.get(tableIds[0]) ?? null : null

  const fittingTables = useMemo(
    () =>
      floorPlan.tables.filter(
        (table) => tableState(table, status, tableIds, partySize ?? 1) === 'available',
      ),
    [status, tableIds, partySize],
  )

  const chooseTable = useCallback(
    (primaryId: string) => {
      const isFree = (id: string) => (status[id] ?? 'available') === 'available'
      setTableIds(resolveTableGroup(primaryId, partySize ?? 1, isFree) ?? [])
      const zone = tableById.get(primaryId)?.zone
      if (zone) setFocusZone(zone)
    },
    [partySize, status],
  )

  /**
   * The list under the plan mirrors the room the guest is looking at — every
   * table in it, taken ones included, so the numbers match what they can see.
   */
  const listedTables = useMemo(
    () => floorPlan.tables.filter((table) => table.zone === focusZone),
    [focusZone],
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
        return tableIds.length > 0
      default:
        return false
    }
  }, [step, date, time, partySize, tableIds])

  const goTo = useCallback((next: Step) => {
    setSubmitError(null)
    setStep(next)
  }, [])

  const back = () => stepIndex > 0 && goTo(STEPS[stepIndex - 1])
  const next = () => stepIndex < STEPS.length - 1 && canContinue && goTo(STEPS[stepIndex + 1])

  const submit = async () => {
    if (!date || !time || !partySize || tableIds.length === 0) return

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
        tableIds,
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
        setTableIds([])
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
    setTableIds([])
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

              {/* Room tabs replace sideways scrolling on a phone. */}
              <div className={styles.zoneTabs} role="group" aria-label={t('floorPlan.title')}>
                {zonesWithTables.map((zone) => {
                  const free = floorPlan.tables.filter(
                    (table) =>
                      table.zone === zone.id &&
                      ['available', 'selected'].includes(
                        tableState(table, status, tableIds, partySize ?? 1),
                      ),
                  ).length
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      className={styles.zoneTab}
                      aria-pressed={focusZone === zone.id}
                      onClick={() => setFocusZone(zone.id)}
                    >
                      {t(`floorPlan.zones.${zone.labelKey}`)}
                      <span className={styles.zoneTabCount}>{free}</span>
                    </button>
                  )
                })}
              </div>

              <RestaurantFloorPlan
                status={status}
                selectedIds={tableIds}
                partySize={partySize ?? 1}
                loading={statusLoading}
                focusZone={isPhone ? focusZone : null}
                onSelect={(table: FloorTable) => chooseTable(table.id)}
              />

              {/* Phones get a plain list as well: tapping a 40px table inside a
                  scrolled plan is fiddly, and this is what screen readers read. */}
              {listedTables.length > 0 && (
                <div className={styles.tableList}>
                  <p className={styles.tableListTitle}>{t('reservation.table.list')}</p>
                  <div className={styles.tableListItems}>
                    {listedTables.map((table) => {
                      const state = tableState(table, status, tableIds, partySize ?? 1)
                      const free = state === 'available' || state === 'selected'
                      return (
                        <button
                          key={table.id}
                          type="button"
                          className={styles.tableListItem}
                          data-state={state}
                          disabled={!free}
                          aria-pressed={state === 'selected'}
                          onClick={() => chooseTable(table.id)}
                        >
                          <span className={styles.tableListLabel}>
                            {t('reservation.table.tableLabel', { label: table.label })}
                          </span>
                          <span className={styles.tableListMeta}>
                            {t('reservation.table.seats', { count: table.seats })} ·{' '}
                            {state === 'noJoin'
                              ? t('reservation.table.legend.noJoin')
                              : t(`reservation.table.legend.${state}`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!statusLoading && fittingTables.length === 0 && tableIds.length === 0 && (
                <p className={styles.warning}>
                  {t('reservation.table.none', { guests: partySize ?? 1 })}
                </p>
              )}

              {primaryTable && (
                <p className={styles.selectedTable}>
                  {t(tableIds.length > 1 ? 'reservation.table.selectedJoined' : 'reservation.table.selected', {
                    tables: formatTableLabels(tableIds),
                    zone: t(`floorPlan.zones.${zoneById.get(primaryTable.zone)?.labelKey ?? 'sala1'}`),
                    seats: seatsOf(tableIds),
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

        <aside
          className={styles.summary}
          data-empty={!(date || time || partySize || tableIds.length) || undefined}
          aria-label={t('reservation.summary.title')}
        >
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
              label={t(tableIds.length > 1 ? 'reservation.summary.tables' : 'reservation.summary.table')}
              value={
                tableIds.length === 0
                  ? null
                  : tableIds.length > 1
                    ? formatTableLabels(tableIds)
                    : t('reservation.table.tableLabel', { label: formatTableLabels(tableIds) })
              }
              onEdit={tableIds.length > 0 ? () => goTo('table') : undefined}
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
  // `disabled` is for tables out of service, of which there are none; the
  // hatched tables a guest sees are the ones with no free neighbour to join.
  const states = ['available', 'selected', 'occupied', 'noJoin'] as const

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
