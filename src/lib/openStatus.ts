import { hoursFor } from '@/data/restaurant'
import { shiftISO, weekdayOfISO } from '@/lib/warsaw'

export type OpenState = 'before' | 'open' | 'soon' | 'after' | 'closed'

export interface NextOpening {
  iso: string
  daysAhead: number
  open: string
}

export interface OpenStatus {
  state: OpenState
  open?: string
  close?: string
  minutesLeft?: number
  next?: NextOpening | null
}

export const SOON_MINUTES = 60
export const LOOKAHEAD_DAYS = 14

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function openStatus(today: string, minutes: number, closed: ReadonlySet<string>): OpenStatus {
  const hoursOn = (iso: string) => (closed.has(iso) ? null : hoursFor(weekdayOfISO(iso)))

  const nextOpening = (): NextOpening | null => {
    for (let daysAhead = 1; daysAhead <= LOOKAHEAD_DAYS; daysAhead++) {
      const iso = shiftISO(today, daysAhead)
      const hours = hoursOn(iso)
      if (hours) return { iso, daysAhead, open: hours[0] }
    }
    return null
  }

  const hours = hoursOn(today)
  if (!hours) return { state: 'closed', next: nextOpening() }

  const [open, close] = hours
  if (minutes < toMinutes(open)) return { state: 'before', open, close }

  const minutesLeft = toMinutes(close) - minutes
  if (minutesLeft <= 0) return { state: 'after', open, close, next: nextOpening() }

  return { state: minutesLeft <= SOON_MINUTES ? 'soon' : 'open', open, close, minutesLeft }
}
