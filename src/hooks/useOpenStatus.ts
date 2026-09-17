import { useEffect, useState } from 'react'
import { bookingApi } from '@/services/booking'
import { LOOKAHEAD_DAYS, openStatus } from '@/lib/openStatus'
import { shiftISO, warsawMinutes, warsawToday } from '@/lib/warsaw'

const NO_DATES: ReadonlySet<string> = new Set()
const WAIT_FOR_API_MS = 2500

const loads = new Map<string, Promise<ReadonlySet<string>>>()

function closedDatesFrom(today: string) {
  let pending = loads.get(today)
  if (!pending) {
    pending = bookingApi.getClosedDates(today, shiftISO(today, LOOKAHEAD_DAYS)).then(
      (dates) => new Set(dates),
      () => {
        loads.delete(today)
        return NO_DATES
      },
    )
    loads.set(today, pending)
  }
  return pending
}

function readNow() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const forced = new URLSearchParams(window.location.search).get('now')
    if (forced && !Number.isNaN(Date.parse(forced))) return new Date(forced)
  }
  return new Date()
}

export function useOpenStatus() {
  const [now, setNow] = useState(readNow)
  const [closed, setClosed] = useState<{ day: string; dates: ReadonlySet<string> } | null>(null)
  const [gaveUp, setGaveUp] = useState(false)
  const today = warsawToday(now)

  useEffect(() => {
    const tick = () => setNow(readNow())
    const timer = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  useEffect(() => {
    let live = true
    closedDatesFrom(today).then((dates) => {
      if (live) setClosed({ day: today, dates })
    })
    const timer = window.setTimeout(() => setGaveUp(true), WAIT_FOR_API_MS)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [today])

  const dates = closed?.day === today ? closed.dates : NO_DATES

  return {
    status: openStatus(today, warsawMinutes(now), dates),
    ready: closed !== null || gaveUp,
  }
}
