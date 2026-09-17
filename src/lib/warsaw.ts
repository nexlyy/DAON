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
