export type TableAvailability = 'available' | 'occupied' | 'disabled'

export interface TimeSlot {
  
  time: string
  available: boolean
}

export interface AvailabilityQuery {
  
  date: string
  partySize: number
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
  locale: string
}

export interface Booking extends BookingRequest {
  id: string
  
  reference: string
  
  cancelToken?: string
  createdAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export class BookingError extends Error {
  constructor(
    message: string,
    
    readonly code: 'unavailable' | 'generic' = 'generic',
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

export interface BookingApi {
  
  getClosedDates(fromISO: string, toISO: string): Promise<string[]>
  getTimeSlots(query: AvailabilityQuery): Promise<TimeSlot[]>
  getTableStatus(query: TableStatusQuery): Promise<Record<string, TableAvailability>>
  createBooking(request: BookingRequest): Promise<Booking>
  
  cancelBooking(reference: string, token: string): Promise<void>
  
  lookupBooking(reference: string, token: string): Promise<{ status: string } | null>
}
