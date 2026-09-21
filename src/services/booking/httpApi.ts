import { BookingError } from './types'
import type {
  BookingErrorCode,
  AvailabilityQuery,
  Booking,
  BookingApi,
  BookingRequest,
  BookingState,
  OwnBooking,
  Seating,
  TableAvailability,
  TableStatusQuery,
  TimeSlot,
  WaitlistRequest,
} from './types'

const ownQuery = (own?: OwnBooking | null) =>
  own ? `&reference=${encodeURIComponent(own.reference)}&token=${encodeURIComponent(own.token)}` : ''

export function createHttpBookingApi(baseUrl: string): BookingApi {
  const base = baseUrl.replace(/\/$/, '')

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      })
    } catch {
      throw new BookingError('Network request failed')
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { code?: string } | null
      const known: BookingErrorCode[] = ['unavailable', 'phoneLimit', 'rateLimit', 'closed']
      const code = known.find((candidate) => candidate === body?.code)
      if (code) throw new BookingError(`Request refused: ${code}`, code)
      if (response.status === 409) throw new BookingError('Table is no longer available', 'unavailable')
      throw new BookingError(`Request failed with ${response.status}`)
    }
    return (await response.json()) as T
  }

  return {
    getClosedDates: (from, to) =>
      request<string[]>(`/closed-dates?from=${from}&to=${to}`),

    getTimeSlots: ({ date, partySize, own }: AvailabilityQuery) =>
      request<TimeSlot[]>(`/slots?date=${date}&partySize=${partySize}${ownQuery(own)}`),

    getTableStatus: ({ date, time, partySize, own }: TableStatusQuery) =>
      request<Record<string, TableAvailability>>(
        `/tables?date=${date}&time=${time}&partySize=${partySize}${ownQuery(own)}`,
      ),

    moveBooking: (own: OwnBooking, seating: Seating) =>
      request<BookingState>('/bookings/move', {
        method: 'POST',
        body: JSON.stringify({ ...own, ...seating }),
      }),

    getConfig: () =>
      request<{ email: boolean }>('/config').catch(() => ({ email: false })),

    createBooking: (payload: BookingRequest) =>
      request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

    joinWaitlist: (payload: WaitlistRequest) =>
      request<{ reference: string }>('/waitlist', { method: 'POST', body: JSON.stringify(payload) }),

    lookupBooking: async (reference: string, token: string) => {
      let response: Response
      try {
        response = await fetch(`${base}/bookings/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, token }),
        })
      } catch {
        throw new BookingError('Network request failed')
      }

      if (response.status === 404) return null
      if (!response.ok) throw new BookingError(`Lookup failed with ${response.status}`)
      return (await response.json()) as BookingState
    },

    cancelBooking: async (reference: string, token: string) => {
      await request<{ ok: boolean }>('/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ reference, token }),
      })
    },
  }
}
