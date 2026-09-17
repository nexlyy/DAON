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

const WARSAW_ZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZ}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

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
    ...WARSAW_ZONE,
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
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
