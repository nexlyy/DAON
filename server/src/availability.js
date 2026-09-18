import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const FILE = resolve(root, 'reservation-data.json')

const data = JSON.parse(readFileSync(FILE, 'utf8'))

export const { openingHours, reservation: rules, restaurant, tables, zones } = data
export const tableById = new Map(tables.map((table) => [table.id, table]))

/**
 * The hours and the reservation rules are also part of what the restaurant can
 * change on the site, so a publish has to reach this file too — otherwise the
 * page would say the kitchen closes at 23:00 while the booking form still
 * stopped at 22:00. The objects are filled in place, because everything that
 * reads them holds the same reference.
 */
export function applyContent(content) {
  const next = {
    openingHours: content.hours,
    reservation: content.reservation,
    restaurant: {
      name: content.place.name,
      phone: content.place.phone,
      email: content.place.email,
      address: `${content.place.address.street}, ${content.place.address.postalCode} ${content.place.address.city}`,
      site: 'https://daon.pl',
      company: content.legal.companyName,
    },
  }

  const current = JSON.parse(readFileSync(FILE, 'utf8'))
  const temporary = `${FILE}.writing`
  writeFileSync(temporary, `${JSON.stringify({ ...current, ...next }, null, 2)}\n`)
  renameSync(temporary, FILE)

  for (const key of Object.keys(openingHours)) delete openingHours[key]
  Object.assign(openingHours, next.openingHours)
  Object.assign(rules, next.reservation)
  Object.assign(restaurant, next.restaurant)
}

const pad = (value) => String(value).padStart(2, '0')
const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const fromMinutes = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const hoursFor = (day) => openingHours[String(day)] ?? null

export function slotsForDate(iso) {
  const hours = hoursFor(parseISODate(iso).getDay())
  if (!hours) return []

  const first = toMinutes(hours[0])
  const last = toMinutes(hours[1]) - rules.lastSeatingBeforeClose
  const slots = []
  for (let m = first; m <= last; m += rules.slotMinutes) slots.push(fromMinutes(m))
  return slots
}

export function resolveTableGroup(primaryId, partySize, isFree) {
  const primary = tableById.get(primaryId)
  if (!primary || primary.disabled || !isFree(primary.id)) return null

  const group = [primary]
  const taken = new Set([primary.id])
  let seats = primary.seats

  while (seats < partySize) {
    const nextId = group
      .flatMap((table) => table.joinsWith ?? [])
      .find((id) => !taken.has(id) && isFree(id) && !tableById.get(id)?.disabled)
    if (!nextId) return null

    const next = tableById.get(nextId)
    if (!next) return null
    taken.add(nextId)
    group.push(next)
    seats += next.seats
  }

  return group.map((table) => table.id)
}

export function takenAt(time, holds) {
  const at = toMinutes(time)
  const hold = rules.holdMinutes ?? 90
  const taken = new Set()
  for (const row of holds) {
    if (Math.abs(toMinutes(row.time) - at) <= hold) taken.add(row.tableId)
  }
  return taken
}

export function seatsAnyone(partySize, taken) {
  const isFree = (id) => !taken.has(id) && !tableById.get(id)?.disabled
  return tables.some((table) => Boolean(resolveTableGroup(table.id, partySize, isFree)))
}

export const labelsOf = (ids) =>
  ids.map((id) => tableById.get(id)?.label ?? id).join(', ')

export const zoneOf = (ids) => {
  const zone = tableById.get(ids[0] ?? '')?.zone
  return zone ? (zones[zone] ?? '') : ''
}
