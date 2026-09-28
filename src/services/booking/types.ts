export type TableAvailability = 'available' | 'occupied' | 'disabled'

export interface TimeSlot {
  
  time: string
  available: boolean
}

export interface OwnBooking {
  reference: string
  token: string
}

export interface AvailabilityQuery {
  
  date: string
  partySize: number
  own?: OwnBooking | null
}

export interface TableStatusQuery extends AvailabilityQuery {
  
  time: string
}

export interface BookingRequest {
  date: string
  time: string
  partySize: number
  
  tableIds: string[]
  name: string
  phone: string
  notes?: string
  email?: string
  locale: string
}

export interface Seating {
  date: string
  time: string
  partySize: number
  tableIds: string[]
}

export interface BookingState extends Seating {
  reference: string
  status: string
  preorder?: Preorder | null
}

/** One dish and how many, as the guest picks it. */
export interface PreorderItem {
  id: string
  quantity: number
}

/** A dish as the restaurant received it: name and price as they stood then. */
export interface PreorderLine extends PreorderItem {
  number: string
  name: { en: string; pl: string; ko: string }
  price: number
}

/** Dishes picked to go with a booking. Paid at the restaurant, not here. */
export interface Preorder {
  lines: PreorderLine[]
  notes: string
  total: number
  updatedAt: string
}

export interface PreorderRequest {
  items: PreorderItem[]
  notes?: string
  locale: string
}

export interface BookingConfig {
  email: boolean
  /** Null when the restaurant does not take dishes ahead online. */
  preorder: { closesBefore: number } | null
}

export interface Booking extends BookingRequest {
  id: string
  
  reference: string
  
  cancelToken?: string
  createdAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export type BookingErrorCode = 'unavailable' | 'phoneLimit' | 'rateLimit' | 'closed' | 'menu' | 'generic'

export class BookingError extends Error {
  constructor(
    message: string,
    
    readonly code: BookingErrorCode = 'generic',
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

/** A guest who wanted a time that was full. Nothing is held for them. */
export interface WaitlistRequest {
  date: string
  time: string
  partySize: number
  name: string
  phone: string
  notes?: string
  locale: string
}

export interface BookingApi {
  
  getClosedDates(fromISO: string, toISO: string): Promise<string[]>
  getTimeSlots(query: AvailabilityQuery): Promise<TimeSlot[]>
  getTableStatus(query: TableStatusQuery): Promise<Record<string, TableAvailability>>
  createBooking(request: BookingRequest): Promise<Booking>
  
  cancelBooking(reference: string, token: string): Promise<void>
  
  lookupBooking(reference: string, token: string): Promise<BookingState | null>

  moveBooking(own: OwnBooking, seating: Seating): Promise<BookingState>

  getConfig(): Promise<BookingConfig>

  /** Sends the dishes for a booking; an empty list takes them all back. */
  savePreorder(own: OwnBooking, request: PreorderRequest): Promise<Preorder | null>

  joinWaitlist(request: WaitlistRequest): Promise<{ reference: string }>
}
