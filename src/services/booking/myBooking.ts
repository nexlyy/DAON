import type { Booking } from './types'

const KEY = 'daon.booking'

export interface SavedBooking {
  reference: string
  token: string
  date: string
  time: string
  partySize: number
  tableIds: string[]
  name: string
}

/**
 * The guest's own copy of their booking, kept in this browser.
 *
 * There are no accounts and nothing is sent to them, so this is how the site
 * can still show "you have a table on Friday" and offer to cancel it. It holds
 * the cancel token, which is why it stays on the device and goes nowhere else.
 */
export function rememberBooking(booking: Booking & { cancelToken?: string }): void {
  if (!booking.cancelToken) return
  const saved: SavedBooking = {
    reference: booking.reference,
    token: booking.cancelToken,
    date: booking.date,
    time: booking.time,
    partySize: booking.partySize,
    tableIds: booking.tableIds,
    name: booking.name,
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    // A browser with storage turned off simply does not get the reminder.
  }
}

/** The saved booking, unless it is in the past — then it is cleared. */
export function readBooking(): SavedBooking | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null

    const saved = JSON.parse(raw) as SavedBooking
    if (!saved?.reference || !saved?.token || !saved?.date) return null

    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`
    if (saved.date < iso) {
      forgetBooking()
      return null
    }
    return saved
  } catch {
    return null
  }
}

export function forgetBooking(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to do; the entry expires by date anyway.
  }
}
