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

/**
 * Ready for a real backend. Set VITE_BOOKING_API_URL and this adapter replaces
 * the mock — the UI never learns which one it is talking to.
 *
 * Expected endpoints:
 *   GET  {base}/closed-dates?from=…&to=…        -> string[]
 *   GET  {base}/slots?date=…&partySize=…        -> TimeSlot[]
 *   GET  {base}/tables?date=…&time=…&partySize= -> Record<tableId, status>
 *   POST {base}/bookings                        -> Booking
 *   POST {base}/bookings/cancel                 -> { ok: true }
 */
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

    if (response.status === 409) {
      throw new BookingError('Table is no longer available', 'unavailable')
    }
    if (!response.ok) {
      throw new BookingError(`Request failed with ${response.status}`)
    }
    return (await response.json()) as T
  }

  return {
    getClosedDates: (from, to) =>
      request<string[]>(`/closed-dates?from=${from}&to=${to}`),

    getTimeSlots: ({ date, partySize }: AvailabilityQuery) =>
      request<TimeSlot[]>(`/slots?date=${date}&partySize=${partySize}`),

    getTableStatus: ({ date, time, partySize }: TableStatusQuery) =>
      request<Record<string, TableAvailability>>(
        `/tables?date=${date}&time=${time}&partySize=${partySize}`,
      ),

    createBooking: (payload: BookingRequest) =>
      request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

    cancelBooking: async (reference: string, token: string) => {
      await request<{ ok: boolean }>('/bookings/cancel', {
        method: 'POST',
        body: JSON.stringify({ reference, token }),
      })
    },
  }
}
