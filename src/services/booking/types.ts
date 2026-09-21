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
}

export interface Booking extends BookingRequest {
  id: string
  
  reference: string
  
  cancelToken?: string
  createdAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export type BookingErrorCode = 'unavailable' | 'phoneLimit' | 'rateLimit' | 'closed' | 'generic'

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

  getConfig(): Promise<{ email: boolean }>

  joinWaitlist(request: WaitlistRequest): Promise<{ reference: string }>
}
