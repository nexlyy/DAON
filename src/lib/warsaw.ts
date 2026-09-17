const ZONE = 'Europe/Warsaw'

const isoDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const warsawToday = (now = new Date()) => isoDay.format(now)

export const warsawWeekday = (now = new Date()) =>
  new Date(`${warsawToday(now)}T12:00:00Z`).getUTCDay()

export function warsawDate(now = new Date()) {
  const [year, month, day] = warsawToday(now).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function warsawMinutes(now = new Date()) {
  const parts = clock.formatToParts(now)
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return (pick('hour') % 24) * 60 + pick('minute')
}

export function shiftISO(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const weekdayOfISO = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay()
