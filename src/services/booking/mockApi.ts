import { floorPlan, resolveTableGroup } from '@/data/tables/floorPlan'
import { openingHours, reservation as reservationConfig } from '@/data/restaurant'
import { BookingError } from './types'
import type {
  AvailabilityQuery,
  Booking,
  BookingApi,
  BookingRequest,
  TableAvailability,
  TableStatusQuery,
  TimeSlot,
} from './types'

const STORAGE_KEY = 'daon.bookings'
const LATENCY_MS = 260

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * FNV-1a. Occupancy has to look plausible and, more importantly, stay the same
 * between renders and reloads — so it is derived from the query rather than
 * from Math.random().
 */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Keys here differ only in their last characters ("…|T01" vs "…|T02"), and
  // plain FNV leaves those neighbours clustered — every table in a slot would
  // end up on the same side of the threshold. The murmur3 finaliser spreads them.
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 0xffffffff
}

function readStored(): Booking[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Booking[]) : []
  } catch {
    return []
  }
}

function writeStored(bookings: Booking[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  } catch {
    // Storage unavailable — the booking still returns, it just is not remembered.
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const fromMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** Parses "YYYY-MM-DD" as a local date, avoiding the UTC shift of `new Date(iso)`. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hoursFor(date: Date) {
  return openingHours.find((entry) => entry.day === date.getDay())
}

/** Every seating time the restaurant offers on a given date. */
export function slotsForDate(iso: string): string[] {
  const hours = hoursFor(parseISODate(iso))
  if (!hours) return []

  const first = toMinutes(hours.open)
  const last = toMinutes(hours.close) - reservationConfig.lastSeatingBeforeClose
  const slots: string[] = []
  for (let m = first; m <= last; m += reservationConfig.slotMinutes) {
    slots.push(fromMinutes(m))
  }
  return slots
}

/** Evenings fill up; a Tuesday lunch does not. */
function occupancyPressure(iso: string, time: string): number {
  const day = parseISODate(iso).getDay()
  const minutes = toMinutes(time)
  const weekend = day === 5 || day === 6
  const evening = minutes >= 18 * 60
  if (evening) return weekend ? 0.62 : 0.42
  if (minutes >= 15 * 60) return 0.18
  return weekend ? 0.34 : 0.24
}

export function createMockBookingApi(): BookingApi {
  return {
    async getClosedDates(fromISO, toISO) {
      await wait(LATENCY_MS / 2)
      const closed: string[] = []
      const cursor = parseISODate(fromISO)
      const end = parseISODate(toISO)
      while (cursor <= end) {
        if (!hoursFor(cursor)) closed.push(toISODate(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      return closed
    },

    async getTimeSlots({ date, partySize }: AvailabilityQuery) {
      await wait(LATENCY_MS)
      const now = new Date()
      const isToday = toISODate(now) === date
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      return slotsForDate(date).map<TimeSlot>((time) => {
        if (isToday && toMinutes(time) <= nowMinutes + 60) {
          return { time, available: false }
        }
        // A slot stays on offer while the party can still be seated somewhere —
        // for more than four that means enough free tables side by side.
        const pressure = occupancyPressure(date, time)
        const isFree = (id: string) => {
          const table = floorPlan.tables.find((entry) => entry.id === id)
          return Boolean(table && !table.disabled && hash(`${date}|${time}|${id}`) >= pressure)
        }
        const anySeat = floorPlan.tables.some((table) =>
          Boolean(resolveTableGroup(table.id, partySize, isFree)),
        )
        return { time, available: anySeat }
      })
    },

    async getTableStatus({ date, time }: TableStatusQuery) {
      await wait(LATENCY_MS)
      const booked = new Set(
        readStored()
          .filter((b) => b.date === date && b.time === time && b.status === 'confirmed')
          .flatMap((b) => b.tableIds),
      )
      const pressure = occupancyPressure(date, time)

      return Object.fromEntries(
        floorPlan.tables.map((table) => {
          let status: TableAvailability = 'available'
          if (table.disabled) status = 'disabled'
          else if (booked.has(table.id)) status = 'occupied'
          else if (hash(`${date}|${time}|${table.id}`) < pressure) status = 'occupied'
          return [table.id, status]
        }),
      )
    },

    async createBooking(request: BookingRequest) {
      await wait(LATENCY_MS * 2)
      const status = await this.getTableStatus({
        date: request.date,
        time: request.time,
        partySize: request.partySize,
      })
      if (request.tableIds.some((id) => status[id] !== 'available')) {
        throw new BookingError('Table is no longer available', 'unavailable')
      }

      const id = `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const booking: Booking = {
        ...request,
        id,
        reference: `DAON-${id.slice(-5).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      }
      writeStored([...readStored(), booking])
      return booking
    },
  }
}
