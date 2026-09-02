export type TableAvailability = 'available' | 'occupied' | 'disabled'

export interface TimeSlot {
  /** "HH:mm" in the restaurant's local time. */
  time: string
  available: boolean
}

export interface AvailabilityQuery {
  /** ISO date, "YYYY-MM-DD". */
  date: string
  partySize: number
}

export interface TableStatusQuery extends AvailabilityQuery {
  /** "HH:mm". */
  time: string
}

export interface BookingRequest {
  date: string
  time: string
  partySize: number
  /** One id for a party of four or fewer; several when tables are pushed together. */
  tableIds: string[]
  name: string
  phone: string
  notes?: string
  locale: string
}

export interface Booking extends BookingRequest {
  id: string
  /** Short human-readable code the guest can quote on the phone. */
  reference: string
  /**
   * Proves the booking is theirs when they come back to cancel it. Returned
   * once, kept in their browser, never stored anywhere we could leak it from.
   */
  cancelToken?: string
  createdAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export class BookingError extends Error {
  constructor(
    message: string,
    /** Maps onto a key under `reservation.errors` in the locale files. */
    readonly code: 'unavailable' | 'generic' = 'generic',
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

/**
 * The single seam between the site and whatever stores reservations. The mock
 * adapter implements it against localStorage today; an HTTP adapter pointed at
 * a real backend implements the same four calls and nothing in the UI changes.
 */
export interface BookingApi {
  /** Dates the restaurant is closed, so the calendar can grey them out. */
  getClosedDates(fromISO: string, toISO: string): Promise<string[]>
  getTimeSlots(query: AvailabilityQuery): Promise<TimeSlot[]>
  getTableStatus(query: TableStatusQuery): Promise<Record<string, TableAvailability>>
  createBooking(request: BookingRequest): Promise<Booking>
  /** Gives the table back. Only the real API can do it; the demo pretends. */
  cancelBooking(reference: string, token: string): Promise<void>
}
