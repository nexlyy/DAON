/** The message the restaurant reads, in Polish. */

const EMPTY = '—'

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** "2026-09-11" -> "11-09-2026". Anything else is passed through untouched. */
export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!match) return String(iso ?? EMPTY)
  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

/** "19:30", or whatever came in if it is not a time. */
export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''))
  if (!match) return String(value ?? EMPTY)
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const filled = (value) => {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : EMPTY
}

/**
 * Fields in the order the restaurant reads them: when, how many, where, who,
 * and anything the guest wanted us to know. A blank note becomes an em dash
 * rather than an empty line, so nothing looks like it went missing.
 */
export function buildMessage(booking) {
  const lines = [
    `<b>Nowa rezerwacja</b>${booking.reference ? ` · ${escapeHtml(booking.reference)}` : ''}`,
    '',
    `Data: <b>${escapeHtml(formatDate(booking.date))}</b>`,
    `Godzina: <b>${escapeHtml(formatTime(booking.time))}</b>`,
    `Liczba osób: <b>${escapeHtml(filled(booking.partySize))}</b>`,
    `Stoliki: <b>${escapeHtml(filled(booking.tables))}</b>${
      booking.zone ? ` (${escapeHtml(booking.zone)})` : ''
    }`,
    `Imię: ${escapeHtml(filled(booking.name))}`,
    `Telefon: ${escapeHtml(filled(booking.phone))}`,
    `Uwagi: ${escapeHtml(filled(booking.notes))}`,
  ]

  return lines.join('\n')
}
