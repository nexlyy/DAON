import { prettyDay, shortDay } from './dates.js'

const EMPTY = '—'
const NL = '\n'
const CHUNK = 3500

export const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!match) return String(iso ?? EMPTY)
  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

export const formatDay = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? '')) ? prettyDay(iso) : String(iso ?? EMPTY)

export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''))
  if (!match) return String(value ?? EMPTY)
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const filled = (value) => {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : EMPTY
}

export const money = (amount) =>
  `${Number.isInteger(amount) ? amount : Number(amount).toFixed(2)} zł`

const dishCount = (lines) => lines.reduce((sum, line) => sum + line.quantity, 0)
const preorderTotal = (lines) =>
  Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100

/** "2× #01 Jeyuk Bokkeum, 1× #44 Samgyeobsal — 185 zł", for lists and booking cards. */
export const preorderShort = (preorder) =>
  `${preorder.lines.map((line) => `${line.quantity}× #${line.number} ${line.name.en}`).join(', ')} — ${money(
    preorderTotal(preorder.lines),
  )}`

const describe = (booking) => [
  `Date: <b>${escapeHtml(formatDay(booking.date))}</b>`,
  `Time: <b>${escapeHtml(formatTime(booking.time))}</b>`,
  `Guests: <b>${escapeHtml(filled(booking.partySize))}</b>`,
  `Tables: <b>${escapeHtml(filled(booking.tables))}</b>${
    booking.zone ? ` (${escapeHtml(booking.zone)})` : ''
  }`,
  `Name: ${escapeHtml(filled(booking.name))}`,
  `Phone: ${escapeHtml(filled(booking.phone))}`,
  `Notes: ${escapeHtml(filled(booking.notes))}`,
  ...(booking.preorder ? [`Pre-order: ${escapeHtml(preorderShort(booking.preorder))}`] : []),
]

const PREORDER_HEADS = {
  new: '🍽 <b>Pre-order</b>',
  changed: '🍽 <b>Pre-order changed</b>',
  withdrawn: '🍽 <b>Pre-order withdrawn</b>',
  replaced: '<s>Pre-order</s>',
  cancelled: '<s>Pre-order</s>',
}

const PREORDER_NOTES = {
  withdrawn: 'The guest took it back on the website. Nothing is pre-ordered now.',
  replaced: 'Replaced by a newer version, sent after this one.',
  cancelled: 'The reservation was cancelled.',
}

/**
 * The card the staff get when a guest picks dishes, and what the older copies
 * turn into once it is changed, taken back or the booking is cancelled.
 */
export function preorderMessage(booking, preorder, state = 'new') {
  const live = state === 'new' || state === 'changed'
  const strike = (text) => (live ? text : `<s>${text}</s>`)
  const who = [
    `${formatDay(booking.date)}, ${formatTime(booking.time)}`,
    `${booking.partySize} guest${Number(booking.partySize) === 1 ? '' : 's'}`,
    booking.tables ? `tables ${booking.tables}` : 'no table held',
    filled(booking.name),
  ].join(' · ')

  const lines = preorder.lines.map((line) =>
    strike(
      `${line.quantity} × <b>#${escapeHtml(line.number)}</b> ${escapeHtml(line.name.en)} — ${money(line.price * line.quantity)}`,
    ),
  )

  return [
    `${PREORDER_HEADS[state] ?? PREORDER_HEADS.new} · <code>${escapeHtml(booking.reference)}</code>`,
    ...(PREORDER_NOTES[state] ? [PREORDER_NOTES[state]] : []),
    escapeHtml(who),
    '',
    ...lines,
    '',
    strike(`${dishCount(preorder.lines)} dish${dishCount(preorder.lines) === 1 ? '' : 'es'} · by the menu <b>${money(preorderTotal(preorder.lines))}</b>`),
    ...(preorder.notes ? [strike(`Kitchen note: ${escapeHtml(preorder.notes)}`)] : []),
    ...(live ? ['<i>Not paid. The guest pays at the restaurant as usual.</i>'] : []),
  ].join(NL)
}

const heading = (title, reference) =>
  `<b>${title}</b>${reference ? ` · <code>${escapeHtml(reference)}</code>` : ''}`

export function buildMessage(booking, { by } = {}) {
  return [
    heading('New reservation', booking.reference),
    ...(by ? [`Added by ${escapeHtml(by)} in the bot`] : []),
    '',
    ...describe(booking),
  ].join(NL)
}

export function cancelledMessage(booking, by) {
  return [
    heading('Reservation cancelled', booking.reference),
    `Cancelled by: ${escapeHtml(by)}`,
    '',
    ...describe(booking),
  ].join(NL)
}

export function releasedMessage(booking, by) {
  return [
    heading('Table free again', booking.reference),
    'The guests have left; the table is back in the calendar.',
    ...(by ? [`Freed by: ${escapeHtml(by)}`] : []),
    '',
    ...describe(booking),
  ].join(NL)
}

const oneLine = (booking) =>
  `${formatDay(booking.date)} ${formatTime(booking.time)} · ${booking.partySize} guests · tables ${filled(booking.tables)}`

export function movedMessage(before, after, by) {
  return [
    heading('Reservation changed', after.reference),
    `Changed by: ${escapeHtml(by)}`,
    `Was: <s>${escapeHtml(oneLine(before))}</s>`,
    '',
    ...describe(after),
  ].join(NL)
}

function row(booking) {
  const note = String(booking.notes ?? '').trim()
  const when = `<b>${escapeHtml(formatTime(booking.time))}</b>`
  const tables = booking.tables ? `tables ${escapeHtml(booking.tables)}` : 'no table held'
  return [
    `${when} · ${escapeHtml(filled(booking.name))} · ${escapeHtml(filled(booking.partySize))} guests · ${tables}`,
    `${escapeHtml(filled(booking.phone))} · <code>${escapeHtml(booking.reference)}</code>`,
    ...(note ? [`📝 ${escapeHtml(note)}`] : []),
    ...(booking.preorder ? [`🍽 ${escapeHtml(preorderShort(booking.preorder))}`] : []),
    ...(booking.preorder?.notes ? [`🍽 Kitchen note: ${escapeHtml(booking.preorder.notes)}`] : []),
  ].join(NL)
}

function chunked(blocks, title) {
  const chunks = []
  let current = title
  for (const block of blocks) {
    const next = `${current}${NL}${NL}${block}`
    if (next.length > CHUNK && current !== title) {
      chunks.push(current)
      current = `${title} (cont.)${NL}${NL}${block}`
    } else {
      current = next
    }
  }
  chunks.push(current)
  return chunks
}

export function dayList(date, bookings) {
  const title = `<b>${escapeHtml(formatDay(date))}</b>`
  if (bookings.length === 0) return [[title, '', 'No reservations.'].join(NL)]
  const guests = bookings.reduce((total, booking) => total + Number(booking.partySize || 0), 0)
  return chunked(
    bookings.map((booking) => row(booking)),
    `${title} — ${bookings.length} reservation(s), ${guests} guests`,
  )
}

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/**
 * What the kitchen should expect today: every pre-ordered dish added up across
 * the bookings, in menu number order.
 */
function kitchenLines(bookings) {
  const dishes = new Map()
  for (const booking of bookings) {
    for (const line of booking.preorder?.lines ?? []) {
      const known = dishes.get(line.id)
      dishes.set(line.id, { ...line, quantity: (known?.quantity ?? 0) + line.quantity })
    }
  }
  return [...dishes.values()]
    .sort((a, b) => String(a.number).localeCompare(String(b.number), 'en', { numeric: true }))
    .map((line) => `${line.quantity} × <b>#${escapeHtml(line.number)}</b> ${escapeHtml(line.name.en)}`)
}

/**
 * The midday message: what is booked for today, what the kitchen has been
 * asked for in advance, and who is waiting for a table. Said plainly when
 * nothing is booked, so a quiet chat is never mistaken for a broken bot.
 */
export function dailyReport(date, bookings, { closed = null, waiting = 0 } = {}) {
  const title = `☀️ <b>Today · ${escapeHtml(formatDay(date))}</b>`
  const waitingLine =
    waiting > 0 ? [`⏳ ${plural(waiting, 'party', 'parties')} on the waiting list for today — /waitlist`] : []

  if (bookings.length === 0) {
    return [
      [
        title,
        '',
        closed ? `DAON is closed today (${escapeHtml(closed)}), and nothing is booked.` : 'No reservations for today.',
        ...(waitingLine.length ? ['', ...waitingLine] : []),
      ].join(NL),
    ]
  }

  const guests = bookings.reduce((total, booking) => total + Number(booking.partySize || 0), 0)
  const preordered = bookings.filter((booking) => booking.preorder).length
  const head = [
    title,
    `${plural(bookings.length, 'reservation')} · ${plural(guests, 'guest')}` +
      (preordered ? ` · ${preordered} with dishes chosen ahead` : ''),
    ...(closed ? [`⚠️ Today is marked closed (${escapeHtml(closed)}), but these are booked. Call them.`] : []),
  ].join(NL)

  const kitchen = kitchenLines(bookings)
  const blocks = [
    ...bookings.map((booking) => row(booking)),
    ...(kitchen.length ? [['🍽 <b>Pre-ordered, all tables together</b>', ...kitchen].join(NL)] : []),
    ...(waitingLine.length ? [waitingLine.join(NL)] : []),
  ]
  return chunked(blocks, head)
}

export function listMessages(title, bookings, emptyText) {
  if (bookings.length === 0) return [`<b>${escapeHtml(title)}</b>${NL}${NL}${escapeHtml(emptyText)}`]

  const byDay = new Map()
  for (const booking of bookings) {
    if (!byDay.has(booking.date)) byDay.set(booking.date, [])
    byDay.get(booking.date).push(booking)
  }

  const blocks = [...byDay].map(([date, rows]) => {
    const guests = rows.reduce((total, booking) => total + Number(booking.partySize || 0), 0)
    return [
      `<b>${escapeHtml(formatDay(date))}</b> — ${rows.length} reservation(s), ${guests} guests`,
      ...rows.map((booking) => row(booking)),
    ].join(NL + NL)
  })

  return chunked(blocks, `<b>${escapeHtml(title)}</b> — ${bookings.length}`)
}

export function helpMessage(closures, { reportAt = null } = {}) {
  const list =
    closures.length === 0
      ? 'No extra closed days.'
      : closures
          .map((entry) => `• ${formatDay(entry.date)}${entry.note ? ` — ${escapeHtml(entry.note)}` : ''}`)
          .join(NL)

  return [
    '<b>DAON — reservations</b>',
    '',
    '<b>Take a booking</b>',
    '/book — step by step: day, guests, time, table, name, phone',
    '/book friday 19:00 4 Anna +48 600 123 456 — notes',
    'Write as much as you know on one line; I ask for the rest and show a card to confirm.',
    '',
    '<b>See bookings</b>',
    '/all — every upcoming reservation',
    '/all past — the last 30 days',
    '/today, /tomorrow, /day saturday',
    '/find Anna — by name, phone or DAON code',
    '/stats — website visits and bookings; /stats 30 for a month',
    '/waitlist — guests waiting for a table that was full',
    '',
    '<b>On its own</b>',
    ...(reportAt ? [`Every day at ${reportAt}: the list for today, with the dishes guests picked ahead.`] : []),
    'Pre-orders from the website come as their own card and show under the booking in /today, /day and /all.',
    '',
    '<b>Change a booking</b>',
    '/move DAON-XXXXX — new day, time, guests or table',
    '/cancel DAON-XXXXX',
    '/free DAON-XXXXX — guests left, free the table now',
    '',
    '<b>Days</b>',
    '/close 24.12 Christmas Eve — no bookings, the website shows DAON as closed',
    '/open 24.12 — open it again',
    '',
    'Dates can be written any way: 20.09, 20/09/2026, 2026-09-20, 20 września, 20 sep, 20 сентября, today, jutro, завтра, friday, w piątek, в пятницу, za 3 dni.',
    '',
    '<b>Closed days</b>',
    list,
  ].join(NL)
}

const PAGE_NAMES = {
  '/': 'home',
  '/menu': 'menu',
  '/reservation': 'reservation',
  '/about': 'about',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/drinks': 'drinks',
}

export function statsMessage(days) {
  const sum = (pick) => days.reduce((total, day) => total + (pick(day) ?? 0), 0)
  const merged = (field) => {
    const table = {}
    for (const day of days) {
      for (const [key, value] of Object.entries(day[field] ?? {})) table[key] = (table[key] ?? 0) + value
    }
    return Object.entries(table).sort((a, b) => b[1] - a[1])
  }
  const joined = (entries, name = (key) => key) =>
    entries.length ? entries.map(([key, value]) => `${escapeHtml(name(key))} ${value}`).join(' · ') : '—'

  const visitors = sum((day) => day.visitors)
  const locales = merged('locales')
  const localeTotal = locales.reduce((total, [, value]) => total + value, 0)
  const event = (name) => sum((day) => day.events?.[name])
  const booked = (name) => sum((day) => day.booked?.[name])

  return [
    `<b>daon.pl — last ${days.length} day${days.length === 1 ? '' : 's'}</b>`,
    '',
    `Visitors: <b>${visitors}</b> (each counted once a day)`,
    days
      .slice(-14)
      .map((day) => `${shortDay(day.date)}: ${day.visitors ?? 0}`)
      .join(NL),
    '',
    `Pages: ${joined(merged('views'), (key) => PAGE_NAMES[key] ?? key)}`,
    '',
    `Reservations: started ${event('book_start')} · booked online <b>${booked('online')}</b> · changed online ${booked('changedOnline')} · taken in the bot ${booked('staff')}`,
    `Dishes picked ahead with a booking: ${booked('preorder')}`,
    `Uber Eats: delivery ${event('delivery')} · pickup ${event('pickup')}`,
    `Taps: call ${event('call')} · directions ${event('directions')} · Instagram ${event('instagram')}`,
    '',
    `Languages: ${
      localeTotal
        ? locales.map(([key, value]) => `${key} ${Math.round((value / localeTotal) * 100)}%`).join(' · ')
        : '—'
    }`,
    `Came from: ${joined(merged('referrers').slice(0, 8))}`,
    '',
    '<i>Counted without cookies. No IP address or other identifier is stored.</i>',
  ].join(NL)
}

export function welcomeMessage() {
  return [
    '<b>DAON — reservations</b>',
    '',
    'You are on the staff list. Reservations from the website arrive here,',
    'and whatever one of you does with a reservation shows up for the others.',
    '',
    'Take a phone booking with /book, see everything with /all.',
    'Send /help for the rest.',
  ].join(NL)
}

export function scrubbedMessage(date, days) {
  return [
    `<b>${escapeHtml(formatDate(date))}</b>`,
    `Guest details removed ${days} days after the booking date, as the privacy policy on daon.pl says.`,
  ].join(NL)
}

export function privateMessage() {
  return 'This bot is private to the DAON staff.'
}
