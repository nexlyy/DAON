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
import { controllerName, restaurant, reservation as reservationConfig } from '@/data/restaurant'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { bookingApi, isDemoBooking, toISODate } from '@/services/booking'
import { forgetBooking, readBooking, rememberBooking, saveBooking } from '@/services/booking/myBooking'
import type { SavedBooking } from '@/services/booking/myBooking'
import type { Booking, OwnBooking, TableAvailability, TimeSlot } from '@/services/booking'
import { BookingError } from '@/services/booking/types'
import { guestsKey } from '@/i18n/plural'
import { track } from '@/lib/analytics'
import { useI18n } from '@/i18n/useI18n'
import { warsawDate, warsawToday } from '@/lib/warsaw'
import { RestaurantFloorPlan, tableState } from '@/components/RestaurantFloorPlan/RestaurantFloorPlan'
import type { FloorPlanHandle } from '@/components/RestaurantFloorPlan/RestaurantFloorPlan'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { WaitingList } from './WaitingList'
import { GuestSelector } from './GuestSelector'
import { StepIndicator } from './StepIndicator'
import { BookingSuccess } from './BookingSuccess'
import styles from './ReservationFlow.module.css'

const STEPS = ['date', 'time', 'guests', 'table', 'confirm'] as const
type Step = (typeof STEPS)[number]

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/

const zonesWithTables = floorPlan.zones.filter((zone) =>
  floorPlan.tables.some((table) => table.zone === zone.id),
)

export function ReservationFlow() {
  const { t, formatDate, locale, path } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('date')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState<number | null>(null)
  const [tableIds, setTableIds] = useState<string[]>([])
  const planRef = useRef<FloorPlanHandle>(null)
  
  const [saved, setSaved] = useState<SavedBooking | null>(() => readBooking())
  const [dropping, setDropping] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [timeLost, setTimeLost] = useState<string | null>(null)
  const [statusVersion, setStatusVersion] = useState(0)
  const [closedVersion, setClosedVersion] = useState(0)
  const timeRef = useRef<string | null>(null)
  const [changing, setChanging] = useState<SavedBooking | null>(null)
  const [changed, setChanged] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const own = useMemo<OwnBooking | null>(
    () => (changing ? { reference: changing.reference, token: changing.token } : null),
    [changing],
  )

  useEffect(() => {
    let cancelled = false
    bookingApi.getConfig().then((config) => {
      if (!cancelled) setEmailEnabled(config.email)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reference = params.get('booking')?.toUpperCase()
    const token = params.get('token')
    if (!reference || !token) return
    navigate({ pathname: location.pathname, hash: location.hash }, { replace: true })

    bookingApi
      .lookupBooking(reference, token)
      .then((found) => {
        if (!found || found.status !== 'confirmed' || found.date < warsawToday()) {
          setManageError(t('reservation.manage.missing'))
          return
        }
        const known = readBooking()
        const next: SavedBooking = {
          reference: found.reference,
          token,
          date: found.date,
          time: found.time,
          partySize: found.partySize,
          tableIds: found.tableIds,
          name: known?.reference === found.reference ? known.name : '',
        }
        saveBooking(next)
        setSaved(next)
        setManageError(null)
      })
      .catch(() => setManageError(t('reservation.errors.offline', { phone: restaurant.phone })))
  }, [location.search])

  useEffect(() => {
    if (!saved) return
    let cancelled = false
    bookingApi
      .lookupBooking(saved.reference, saved.token)
      .then((found) => {
        if (cancelled) return
        
        if (found === null || found.status !== 'confirmed') {
          forgetBooking()
          setSaved(null)
        }
      })
      .catch(() => {
        
      })
    return () => {
      cancelled = true
    }
    
  }, [saved?.reference])

  const [closedDates, setClosedDates] = useState<string[]>([])
  
  const [offline, setOffline] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [status, setStatus] = useState<Record<string, TableAvailability>>({})
  const [statusLoading, setStatusLoading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; email?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    timeRef.current = time
  }, [time])

  useEffect(() => {
    const to = warsawDate()
    to.setDate(to.getDate() + reservationConfig.maxDaysAhead)
    let cancelled = false

    bookingApi
      .getClosedDates(warsawToday(), toISODate(to))
      .then((dates) => {
        if (!cancelled) setClosedDates(dates)
      })
      .catch(() => {
        if (!cancelled) {
          setClosedDates([])
          setOffline(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [closedVersion])

  useEffect(() => {
    if (!date) return
    let cancelled = false
    setSlotsLoading(true)

    bookingApi
      .getTimeSlots({ date, partySize: partySize ?? 1, own })
      .then((result) => {
        if (cancelled) return
        setSlots(result)
        setOffline(false)
        const current = timeRef.current
        if (current && !result.some((slot) => slot.time === current && slot.available)) {
          setTime(null)
          setTableIds([])
          setTimeLost(current)
        }
      })
      .catch(() => {
        if (cancelled) return
        setSlots([])
        setOffline(true)
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [date, partySize, own])

  useEffect(() => {
    if (!date || !time) return
    let cancelled = false
    setStatusLoading(true)

    bookingApi
      .getTableStatus({ date, time, partySize: partySize ?? 1, own })
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
  }, [date, time, partySize, statusVersion, own])

  useEffect(() => {
    if (tableIds.length === 0) return
    const stillFree = (id: string) => (status[id] ?? 'available') === 'available'
    const rebuilt = resolveTableGroup(tableIds[0], partySize ?? 1, stillFree)
    const unchanged = rebuilt?.length === tableIds.length && rebuilt.every((id, i) => id === tableIds[i])
    if (!unchanged) setTableIds(rebuilt ?? [])
  }, [partySize, status, tableIds])

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
      planRef.current?.focusTable(primaryId)
    },
    [partySize, status],
  )

  const canContinue = useMemo(() => {
    switch (step) {
      case 'date':
        return Boolean(date)
      case 'time':
        return Boolean(time)
      case 'guests':
        return Boolean(partySize && time)
      case 'table':
        return Boolean(time) && tableIds.length > 0
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

  const started = useRef(false)
  const pickDate = (value: string) => {
    setDate(value)
    if (!started.current && !changing) {
      started.current = true
      track('book_start')
    }
  }

  const pickTime = (value: string) => {
    setTime(value)
    setTimeLost(null)
  }

  const refuse = (code: string) => {
    setSubmitError(t(`reservation.errors.${code}`, { phone: restaurant.phone }))
    if (code === 'unavailable') {
      setTableIds([])
      setStatusVersion((version) => version + 1)
      goTo('table')
    }
    if (code === 'closed') {
      setTime(null)
      setTableIds([])
      setClosedVersion((version) => version + 1)
      goTo('date')
    }
  }

  const submit = async () => {
    if (!date || !time || !partySize || tableIds.length === 0) {
      setSubmitError(t('reservation.errors.incomplete'))
      goTo(!date ? 'date' : !time ? 'time' : !partySize ? 'guests' : 'table')
      return
    }

    if (changing) {
      setSubmitting(true)
      setSubmitError(null)
      try {
        const result = await bookingApi.moveBooking(
          { reference: changing.reference, token: changing.token },
          { date, time, partySize, tableIds },
        )
        const next: SavedBooking = { ...changing, ...result }
        saveBooking(next)
        setSaved(next)
        setChanged(true)
        setBooking({
          ...next,
          id: '',
          phone: '',
          locale,
          createdAt: '',
          status: 'confirmed',
          cancelToken: changing.token,
        })
      } catch (error) {
        const code = error instanceof BookingError ? error.code : 'generic'
        const found = await bookingApi.lookupBooking(changing.reference, changing.token).catch(() => undefined)
        if (found === null || (found && found.status !== 'confirmed')) {
          setSubmitError(t('reservation.changing.gone', { phone: restaurant.phone }))
        } else {
          refuse(code)
        }
      } finally {
        setSubmitting(false)
      }
      return
    }

    const errors: { name?: string; phone?: string; email?: string } = {}
    if (!name.trim()) errors.name = t('reservation.errors.nameRequired')
    if (!phone.trim()) errors.phone = t('reservation.errors.phoneRequired')
    else if (phone.replace(/\D/g, '').length < 7) errors.phone = t('reservation.errors.phoneInvalid')
    if (emailEnabled && email.trim() && !EMAIL.test(email.trim())) {
      errors.email = t('reservation.errors.emailInvalid')
    }

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
        email: emailEnabled && email.trim() ? email.trim() : undefined,
        locale,
      })
      setBooking(result)
      rememberBooking(result)
    } catch (error) {
      refuse(error instanceof BookingError ? error.code : 'generic')
    } finally {
      setSubmitting(false)
    }
  }

  const startChange = (current: SavedBooking) => {
    setChanging(current)
    setChanged(false)
    setDate(current.date)
    setTime(current.time)
    setPartySize(current.partySize)
    setTableIds(current.tableIds)
    setSubmitError(null)
    setTimeLost(null)
    setStep('date')
  }

  const reset = () => {
    setChanging(null)
    setChanged(false)
    setEmail('')
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
    return (
      <BookingSuccess
        booking={booking}
        onReset={reset}
        changed={changed}
        emailSent={!changed && emailEnabled && Boolean(booking.email)}
      />
    )
  }

  const confirmLabel = changing
    ? t(submitting ? 'reservation.changing.saving' : 'reservation.changing.save')
    : t(submitting ? 'reservation.summary.sending' : 'reservation.summary.confirm')

  const guestsLabel = (count: number) =>
    `${count} ${t(guestsKey(locale, count))}`
  const longDate = (iso: string) =>
    formatDate(new Date(`${iso}T00:00:00`), { weekday: 'long', day: 'numeric', month: 'long' })

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
          
          {manageError && step === 'date' && !changing && (
            <p className={styles.warning} role="alert">
              {manageError}
            </p>
          )}

          {changing && (
            <div className={styles.upcoming}>
              <p className={styles.upcomingLine}>
                {t('reservation.changing.banner', {
                  reference: changing.reference,
                  date: longDate(changing.date),
                  time: changing.time,
                  guests: guestsLabel(changing.partySize),
                })}
              </p>
              <button type="button" className={styles.upcomingCancel} onClick={reset}>
                {t('reservation.changing.stop')}
              </button>
            </div>
          )}

          {saved && !changing && step === 'date' && (
            <div className={styles.upcoming}>
              <p className={styles.upcomingTitle}>{t('reservation.upcoming.title')}</p>
              <p className={styles.upcomingLine}>
                {t('reservation.upcoming.line', {
                  date: longDate(saved.date),
                  time: saved.time,
                  guests: guestsLabel(saved.partySize),
                  reference: saved.reference,
                })}
              </p>
              <div className={styles.upcomingActions}>
                <button type="button" className={styles.upcomingChange} onClick={() => startChange(saved)}>
                  {t('reservation.upcoming.change')}
                </button>
                <button
                  type="button"
                  className={styles.upcomingCancel}
                  disabled={dropping}
                  onClick={async () => {
                    if (!window.confirm(t('reservation.success.cancelConfirm'))) return
                    setDropping(true)
                    setCancelError(null)
                    try {
                      await bookingApi.cancelBooking(saved.reference, saved.token)
                      forgetBooking()
                      setSaved(null)
                    } catch {
                      setCancelError(
                        t('reservation.success.cancelFailed', { phone: restaurant.phone }),
                      )
                    } finally {
                      setDropping(false)
                    }
                  }}
                >
                  {dropping ? t('reservation.success.cancelling') : t('reservation.success.cancel')}
                </button>
              </div>
              {cancelError && (
                <p className={styles.error} role="alert">
                  {cancelError}
                </p>
              )}
            </div>
          )}

          {timeLost && !time && step !== 'date' && (
            <div className={styles.warning} role="alert">
              <p>
                {t('reservation.errors.timeLost', {
                  time: timeLost,
                  guests: partySize ?? 1,
                })}
              </p>
              {step !== 'time' && (
                <button type="button" className={styles.upcomingCancel} onClick={() => goTo('time')}>
                  {t('reservation.errors.pickAnotherTime')}
                </button>
              )}
            </div>
          )}

          {/* The time they wanted has no table for this many: that is exactly
              what the waiting list is for. */}
          {timeLost && !time && step !== 'date' && date && !changing && (
            <WaitingList
              date={date}
              times={slots.map((slot) => slot.time)}
              time={timeLost}
              partySize={partySize}
              urgent
            />
          )}

          {step === 'date' && submitError && (
            <p className={styles.error} role="alert">
              {submitError}
            </p>
          )}

          {step === 'date' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.date.title')}</h2>
              <DatePicker value={date} closedDates={closedDates} onChange={pickDate} />
            </>
          )}

          {step === 'time' && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.time.title')}</h2>
              <p className={styles.stepNote}>{t('reservation.time.subtitle')}</p>
              {offline ? (
                <p className={styles.warning}>
                  {t('reservation.errors.offline', { phone: restaurant.phone })}
                </p>
              ) : (
                <TimePicker slots={slots} value={time} loading={slotsLoading} onChange={pickTime} />
              )}

              {!offline && !slotsLoading && date && !changing && slots.some((slot) => !slot.available) && (
                <WaitingList
                  date={date}
                  times={slots.map((slot) => slot.time)}
                  time={slots.find((slot) => !slot.available)?.time ?? null}
                  partySize={partySize}
                  urgent={!slots.some((slot) => slot.available)}
                />
              )}
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
                selectedIds={tableIds}
                partySize={partySize ?? 1}
                loading={statusLoading}
                handleRef={planRef}
                onSelect={(table: FloorTable) => chooseTable(table.id)}
              />

              <div className={styles.tableList}>
                <p className={styles.tableListTitle}>{t('reservation.table.list')}</p>
                {zonesWithTables.map((zone) => {
                  const roomTables = floorPlan.tables.filter((table) => table.zone === zone.id)
                  const free = roomTables.filter((table) =>
                    ['available', 'selected'].includes(
                      tableState(table, status, tableIds, partySize ?? 1),
                    ),
                  ).length
                  return (
                    <div className={styles.tableRoom} key={zone.id}>
                      <p className={styles.tableRoomName}>
                        {t(`floorPlan.zones.${zone.labelKey}`)}
                        <span className={styles.tableRoomCount}>
                          {t('reservation.table.freeCount', { count: free })}
                        </span>
                      </p>
                      <div className={styles.tableListItems}>
                        {roomTables.map((table) => {
                          const state = tableState(table, status, tableIds, partySize ?? 1)
                          const selectable = state === 'available' || state === 'selected'
                          return (
                            <button
                              key={table.id}
                              type="button"
                              className={styles.tableListItem}
                              data-state={state}
                              disabled={!selectable}
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
                  )
                })}
              </div>

              {!statusLoading && fittingTables.length === 0 && tableIds.length === 0 && (
                <p className={styles.warning}>
                  {t('reservation.table.none', { guests: partySize ?? 1 })}
                </p>
              )}

              {!statusLoading && fittingTables.length === 0 && tableIds.length === 0 && date && !changing && (
                <WaitingList
                  date={date}
                  times={slots.map((slot) => slot.time)}
                  time={time}
                  partySize={partySize}
                  urgent
                />
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

          {step === 'confirm' && changing && (
            <>
              <h2 className={styles.stepTitle}>{t('reservation.changing.title')}</h2>
              <p className={styles.stepNote}>
                {t('reservation.changing.was', {
                  date: longDate(changing.date),
                  time: changing.time,
                  guests: guestsLabel(changing.partySize),
                })}
              </p>
              {submitError && (
                <p className={styles.error} role="alert">
                  {submitError}
                </p>
              )}
            </>
          )}

          {step === 'confirm' && !changing && (
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

                {emailEnabled && (
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span className={styles.fieldLabel}>
                      {t('reservation.details.email')}
                      <em>{t('reservation.details.optional')}</em>
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      placeholder={t('reservation.details.emailPlaceholder')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby="reservation-email-hint"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <span className={styles.fieldHint} id="reservation-email-hint">
                      {t('reservation.details.emailHint')}
                    </span>
                    {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
                  </label>
                )}

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

              <p className={styles.privacy}>
                {t(emailEnabled ? 'reservation.details.privacyEmail' : 'reservation.details.privacy', {
                  controller: controllerName(),
                  days: reservationConfig.retentionDays,
                })}{' '}
                <Link to={path('/privacy')}>{t('footer.privacy')}</Link>
              </p>

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
              {confirmLabel}
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

      <div className={styles.mobileBar}>
        {stepIndex > 0 && (
          <button type="button" className="btn btn--ghost" onClick={back}>
            {t('reservation.back')}
          </button>
        )}
        {step === 'confirm' ? (
          <button type="button" className="btn" disabled={submitting} onClick={submit}>
            {confirmLabel}
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
