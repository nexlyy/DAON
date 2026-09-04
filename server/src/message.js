const EMPTY = '—'
const NL = '\n'

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!match) return String(iso ?? EMPTY)
  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''))
  if (!match) return String(value ?? EMPTY)
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const filled = (value) => {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : EMPTY
}

const describe = (booking) => [
  `Date: <b>${escapeHtml(formatDate(booking.date))}</b>`,
  `Time: <b>${escapeHtml(formatTime(booking.time))}</b>`,
  `Guests: <b>${escapeHtml(filled(booking.partySize))}</b>`,
  `Tables: <b>${escapeHtml(filled(booking.tables))}</b>${
    booking.zone ? ` (${escapeHtml(booking.zone)})` : ''
  }`,
  `Name: ${escapeHtml(filled(booking.name))}`,
  `Phone: ${escapeHtml(filled(booking.phone))}`,
  `Notes: ${escapeHtml(filled(booking.notes))}`,
]

const heading = (title, reference) =>
  `<b>${title}</b>${reference ? ` · ${escapeHtml(reference)}` : ''}`

export function buildMessage(booking) {
  return [heading('New reservation', booking.reference), '', ...describe(booking)].join(NL)
}

export function cancelledMessage(booking, by) {
  return [
    heading('Reservation cancelled', booking.reference),
    `Cancelled by: ${escapeHtml(by)}`,
    '',
    ...describe(booking),
  ].join(NL)
}

export function dayList(date, bookings) {
  const title = `<b>${escapeHtml(formatDate(date))}</b>`
  if (bookings.length === 0) return [title, '', 'No reservations.'].join(NL)

  const rows = bookings.map((booking) => {
    const note = String(booking.notes ?? '').trim()
    return [
      `<b>${escapeHtml(formatTime(booking.time))}</b> · ${escapeHtml(filled(booking.name))}`,
      `${escapeHtml(filled(booking.partySize))} guests · tables ${escapeHtml(
        filled(booking.tables),
      )}`,
      `${escapeHtml(filled(booking.phone))}${note ? ` · ${escapeHtml(note)}` : ''}`,
    ].join(NL)
  })

  return [`${title} — ${bookings.length} reservation(s)`, '', rows.join(NL + NL)].join(NL)
}

export function helpMessage(closures) {
  const list =
    closures.length === 0
      ? 'No extra closed days.'
      : closures
          .map((row) => `• ${formatDate(row.date)}${row.note ? ` — ${escapeHtml(row.note)}` : ''}`)
          .join(NL)

  return [
    '<b>DAON — reservations</b>',
    '',
    '/today — reservations for today',
    '/tomorrow — reservations for tomorrow',
    '/day 24-12-2026 — reservations for a given day',
    '/close 24-12-2026 Christmas Eve — close a day for bookings',
    '/open 24-12-2026 — open it again',
    '/closed — the days currently closed',
    '',
    '<b>Closed days</b>',
    list,
  ].join(NL)
}

export function welcomeMessage(chatId) {
  return [
    '<b>DAON — reservation alerts</b>',
    '',
    `This chat: <code>${chatId}</code>`,
    'Reservations from the website will arrive here.',
    '',
    'Send /help to see what else I can do.',
  ].join(NL)
}
