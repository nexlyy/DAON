import { formatTableLabels } from '@/data/tables/floorPlan'
import { restaurant } from '@/data/restaurant'
import type { Booking } from './types'

/** The table is held for a while after the booked time; so is the event. */
const HOURS = 2

/** The restaurant's own clock. A guest booking from another country would
 *  otherwise get the event at their local 19:00, not Katowice's. */
const TZ = 'Europe/Warsaw'

const utcStamp = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** "2026-09-18" + "13:00" -> "20260918T130000", left in the restaurant's zone. */
const localStamp = (date: string, time: string) =>
  `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

/** Line breaks, commas and semicolons all mean something in an .ics file. */
const escape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/**
 * A calendar entry for the booking.
 *
 * Nothing is sent to the guest — no e-mail, no SMS — so this is the one thing
 * they can take away with them. Written as a file the browser downloads, which
 * every phone opens in its own calendar.
 */
export function calendarFile(booking: Booking, title: string): string {
  const [hour, minute] = booking.time.split(':').map(Number)
  const endTime = `${String((hour + HOURS) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const description = [
    `${title} · ${booking.reference}`,
    `${booking.partySize} · ${formatTableLabels(booking.tableIds)}`,
    restaurant.phone,
  ].join('\n')

  // CRLF and the 'PRODID' line are what make this a valid file rather than
  // something only one calendar app will open.
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DAON//Reservation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@daon`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART;TZID=${TZ}:${localStamp(booking.date, booking.time)}`,
    `DTEND;TZID=${TZ}:${localStamp(booking.date, endTime)}`,
    `SUMMARY:${escape(`${restaurant.name} — ${title}`)}`,
    `LOCATION:${escape(restaurant.addressLine)}`,
    `DESCRIPTION:${escape(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Hands the file to the browser under a name worth seeing in a downloads list. */
export function downloadCalendar(booking: Booking, title: string): void {
  const blob = new Blob([calendarFile(booking, title)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `daon-${booking.reference}.ics`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
