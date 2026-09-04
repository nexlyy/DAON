import { formatTableLabels } from '@/data/tables/floorPlan'
import { restaurant } from '@/data/restaurant'
import type { Booking } from './types'

const HOURS = 2

const TZ = 'Europe/Warsaw'

const utcStamp = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const localStamp = (date: string, time: string) =>
  `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

const escape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

export function calendarFile(booking: Booking, title: string): string {
  const [hour, minute] = booking.time.split(':').map(Number)
  const endTime = `${String((hour + HOURS) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const description = [
    `${title} · ${booking.reference}`,
    `${booking.partySize} · ${formatTableLabels(booking.tableIds)}`,
    restaurant.phone,
  ].join('\n')

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
