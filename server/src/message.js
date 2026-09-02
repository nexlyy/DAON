/** The messages the restaurant reads, in Polish. */

const EMPTY = '—'
const NL = '\n'

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
 * The lines a booking is described by, shared by every message about it: when,
 * how many, where, who, and anything the guest wanted us to know. A blank note
 * becomes an em dash rather than an empty line, so nothing looks like it went
 * missing.
 */
const describe = (booking) => [
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

const heading = (title, reference) =>
  `<b>${title}</b>${reference ? ` · ${escapeHtml(reference)}` : ''}`

export function buildMessage(booking) {
  return [heading('Nowa rezerwacja', booking.reference), '', ...describe(booking)].join(NL)
}

/** Who let the table go, once it has been let go. */
export function cancelledMessage(booking, by) {
  return [
    heading('Rezerwacja anulowana', booking.reference),
    `Anulowana przez: ${escapeHtml(by)}`,
    '',
    ...describe(booking),
  ].join(NL)
}

/** A day's bookings, for the staff's own list. */
export function dayList(date, bookings) {
  const title = `<b>${escapeHtml(formatDate(date))}</b>`
  if (bookings.length === 0) return [title, '', 'Brak rezerwacji.'].join(NL)

  const rows = bookings.map((booking) => {
    const note = String(booking.notes ?? '').trim()
    return [
      `<b>${escapeHtml(formatTime(booking.time))}</b> · ${escapeHtml(filled(booking.name))}`,
      `${escapeHtml(filled(booking.partySize))} os. · stoliki ${escapeHtml(
        filled(booking.tables),
      )}`,
      `${escapeHtml(filled(booking.phone))}${note ? ` · ${escapeHtml(note)}` : ''}`,
    ].join(NL)
  })

  return [
    `${title} — rezerwacji: ${bookings.length}`,
    '',
    rows.join(NL + NL),
  ].join(NL)
}

/** What the bot answers when someone asks it what it can do. */
export function helpMessage(closures) {
  const list =
    closures.length === 0
      ? 'Brak dodatkowych dni zamknięcia.'
      : closures
          .map((row) => `• ${formatDate(row.date)}${row.note ? ` — ${escapeHtml(row.note)}` : ''}`)
          .join(NL)

  return [
    '<b>DAON — rezerwacje</b>',
    '',
    '/dzisiaj — rezerwacje na dziś',
    '/jutro — rezerwacje na jutro',
    '/dzien 24-12-2026 — rezerwacje na wybrany dzień',
    '/zamknij 24-12-2026 Wigilia — zamknij dzień dla rezerwacji',
    '/otworz 24-12-2026 — otwórz go z powrotem',
    '/zamkniete — lista zamkniętych dni',
    '',
    '<b>Zamknięte dni</b>',
    list,
  ].join(NL)
}
