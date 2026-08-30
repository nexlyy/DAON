import { createHttpBookingApi } from './httpApi'
import { createMockBookingApi } from './mockApi'
import type { BookingApi } from './types'

const apiUrl = import.meta.env.VITE_BOOKING_API_URL as string | undefined

/**
 * GitHub Pages is static, so the site ships with the mock adapter. Point
 * VITE_BOOKING_API_URL at a real service and the same UI starts writing real
 * reservations — nothing else has to change.
 */
export const bookingApi: BookingApi = apiUrl
  ? createHttpBookingApi(apiUrl)
  : createMockBookingApi()

/** True while reservations are stored in the browser rather than sent anywhere. */
export const isDemoBooking = !apiUrl

export * from './types'
export { slotsForDate, toISODate, parseISODate } from './mockApi'
