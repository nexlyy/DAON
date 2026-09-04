import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const data = JSON.parse(readFileSync(resolve(root, 'reservation-data.json'), 'utf8'))

export const { openingHours, reservation: rules, tables, zones } = data
export const tableById = new Map(tables.map((table) => [table.id, table]))

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
