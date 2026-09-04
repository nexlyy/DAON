import { createHttpBookingApi } from './httpApi'
import { createMockBookingApi } from './mockApi'
import type { BookingApi } from './types'

const apiUrl = import.meta.env.VITE_BOOKING_API_URL as string | undefined

export const bookingApi: BookingApi = apiUrl
  ? createHttpBookingApi(apiUrl)
  : createMockBookingApi()

export const isDemoBooking = !apiUrl

export * from './types'
export { slotsForDate, toISODate, parseISODate } from './mockApi'
