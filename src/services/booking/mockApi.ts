import { floorPlan, resolveTableGroup, tableById } from '@/data/tables/floorPlan'
import { hoursFor, reservation as reservationConfig } from '@/data/restaurant'
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

function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  
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
    
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const fromMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function slotsForDate(iso: string): string[] {
  const hours = hoursFor(parseISODate(iso).getDay())
  if (!hours) return []

  const [open, close] = hours
  const first = toMinutes(open)
  const last = toMinutes(close) - reservationConfig.lastSeatingBeforeClose
  const slots: string[] = []
  for (let m = first; m <= last; m += reservationConfig.slotMinutes) {
    slots.push(fromMinutes(m))
  }
  return slots
}

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
  const api: BookingApi = {
    async getClosedDates(fromISO, toISO) {
      await wait(LATENCY_MS / 2)
      const closed: string[] = []
      const cursor = parseISODate(fromISO)
      const end = parseISODate(toISO)
      while (cursor <= end) {
        if (!hoursFor(cursor.getDay())) closed.push(toISODate(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      return closed
    },

    async getTimeSlots({ date, partySize }: AvailabilityQuery) {
      await wait(LATENCY_MS)
      const now = new Date()
      const isToday = toISODate(now) === date
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const stored = readStored()

      return slotsForDate(date).map<TimeSlot>((time) => {
        if (isToday && toMinutes(time) <= nowMinutes + 60) {
          return { time, available: false }
        }
        
        const pressure = occupancyPressure(date, time)
        const booked = new Set(
          stored
            .filter((b) => b.date === date && b.time === time && b.status === 'confirmed')
            .flatMap((b) => b.tableIds),
        )
        const isFree = (id: string) => {
          const table = tableById.get(id)
          if (!table || table.disabled || booked.has(id)) return false
          return hash(`${date}|${time}|${id}`) >= pressure
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
      
      if (!slotsForDate(request.date).includes(request.time)) {
        throw new BookingError('The restaurant is closed at that time', 'unavailable')
      }
      const status = await api.getTableStatus({
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
      return { ...booking, cancelToken: `demo-${id}` }
    },

    async lookupBooking(reference: string) {
      await wait(LATENCY_MS / 2)
      const found = readStored().find((booking) => booking.reference === reference)
      return found ? { status: found.status } : null
    },

    async cancelBooking(reference: string) {
      await wait(LATENCY_MS)
      
      writeStored(readStored().filter((booking) => booking.reference !== reference))
    },
  }

  return api
}
