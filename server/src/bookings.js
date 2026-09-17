import {
  hoursFor,
  labelsOf,
  resolveTableGroup,
  rules,
  seatsAnyone,
  slotsForDate,
  tableById,
  tables,
  takenAt,
  zoneOf,
  zones,
} from './availability.js'
import { isClosed } from './closures.js'
import { addDays, weekdayOf } from './dates.js'

export const STAFF_MAX_PARTY = 40

export const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number)
  return hours * 60 + minutes
}

export const labelIds = new Map(tables.map((table) => [table.label, table.id]))

export const toStaff = (booking) => ({
  reference: booking.reference,
  date: booking.date,
  time: booking.time,
  partySize: booking.partySize,
  tables: labelsOf(booking.tableIds ?? []),
  zone: zoneOf(booking.tableIds ?? []),
  name: booking.name,
  phone: booking.phone,
  notes: booking.notes,
})

export function openingOn(date) {
  if (isClosed(date)) return { closed: true, reason: 'closure' }
  const hours = hoursFor(weekdayOf(date))
  if (!hours) return { closed: true, reason: 'weekly' }
  return { closed: false, open: hours[0], close: hours[1] }
}

export function openAt(date, time) {
  const day = openingOn(date)
  if (day.closed) return { ...day, ok: false }
  const at = toMinutes(time)
  if (at < toMinutes(day.open) || at >= toMinutes(day.close)) return { ...day, ok: false, reason: 'hours' }
  return { ...day, ok: true, late: at > toMinutes(day.close) - rules.lastSeatingBeforeClose }
}

export function nextOpenDays(today, count) {
  const days = []
  for (let ahead = 0; days.length < count && ahead < 60; ahead++) {
    const date = addDays(today, ahead)
    if (!openingOn(date).closed) days.push(date)
  }
  return days
}

const holdsWithout = async (store, date, reservationId) =>
  (await store.holdsOn(date)).filter((hold) => !reservationId || hold.reservationId !== reservationId)

export async function freeTimes(store, date, partySize, reservationId) {
  const holds = await holdsWithout(store, date, reservationId)
  return slotsForDate(date).map((time) => ({
    time,
    free: seatsAnyone(partySize, takenAt(time, holds)),
  }))
}

const zoneOrder = Object.keys(zones)

export async function tableOptions(store, { date, time, partySize, reservationId }) {
  const taken = takenAt(time, await holdsWithout(store, date, reservationId))
  const isFree = (id) => !taken.has(id) && !tableById.get(id)?.disabled
  const seen = new Map()
  for (const table of tables) {
    const group = resolveTableGroup(table.id, partySize, isFree)
    if (!group) continue
    const key = [...group].sort().join('+')
    if (!seen.has(key)) seen.set(key, group)
  }
  const seats = (group) => group.reduce((total, id) => total + (tableById.get(id)?.seats ?? 0), 0)
  return [...seen.values()].sort(
    (a, b) =>
      seats(a) - seats(b) ||
      zoneOrder.indexOf(tableById.get(a[0])?.zone) - zoneOrder.indexOf(tableById.get(b[0])?.zone),
  )
}

export async function tablesStillFree(store, { date, time, tableIds, reservationId }) {
  const taken = takenAt(time, await holdsWithout(store, date, reservationId))
  return tableIds.every((id) => !taken.has(id) && !tableById.get(id)?.disabled)
}

export const matchesGroup = (tableIds, partySize, isFree) => {
  const group = resolveTableGroup(tableIds[0], partySize, isFree)
  return Boolean(group) && group.join() === tableIds.join()
}
