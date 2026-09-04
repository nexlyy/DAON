/**
 * DAON reservation API.
 *
 * The site is a static build: it cannot hold a bot token, and it cannot be
 * trusted to know what is already booked. This service does both. It answers
 * the four calls the site's `BookingApi` makes, keeps the reservations in
 * Supabase (or a local file when none is configured), and tells the restaurant
 * about each one over Telegram.
 *
 *   GET  /closed-dates?from&to           dates the kitchen is shut
 *   GET  /slots?date&partySize           seating times, with what is still free
 *   GET  /tables?date&time&partySize     per-table availability
 *   POST /bookings                       take a booking, then tell the staff
 *   POST /bookings/cancel                give a table back
 *   GET  /health                         liveness, store, chat
 *
 * It also answers /start in Telegram with the chat id, which is how the
 * restaurant tells the service where to send.
 */
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  labelsOf,
  parseISODate,
  resolveTableGroup,
  rules,
  seatsAnyone,
  slotsForDate,
  tableById,
  tables,
  toISODate,
  zoneOf,
} from './availability.js'
import { cancelToken, tokenMatches } from './cancel.js'
import { addClosure, isClosed, listClosures, removeClosure } from './closures.js'
import { loadEnv, root } from './env.js'
import {
  buildMessage,
  cancelledMessage,
  dayList,
  formatDate,
  helpMessage,
  welcomeMessage,
} from './message.js'
import { createStore, reference, TablesTaken } from './store.js'
import { answerCallback, editMessage, getMe, pollUpdates, sendMessage } from './telegram.js'

loadEnv()

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const PORT = Number(process.env.PORT ?? 8787)
/** Comma-separated: the published site, plus a dev server while working. */
const ORIGINS = (process.env.ALLOWED_ORIGIN ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const LISTEN = process.env.TELEGRAM_LISTEN !== '0'

const STORE = resolve(root, 'data')
const CHAT_FILE = resolve(STORE, 'chat.json')

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

mkdirSync(STORE, { recursive: true })
const store = createStore()

/* -------------------------------------------------------------------- chat */

function readChatId() {
  const configured = process.env.TELEGRAM_CHAT_ID?.trim()
  if (configured) return configured
  try {
    return JSON.parse(readFileSync(CHAT_FILE, 'utf8')).chatId ?? null
  } catch {
    return null
  }
}

function rememberChatId(chatId, who) {
  writeFileSync(
    CHAT_FILE,
    JSON.stringify({ chatId, who, savedAt: new Date().toISOString() }, null, 2),
  )
  console.log(`Notifications will go to chat ${chatId} (${who}).`)
}

/* ------------------------------------------------------------------ limits */

// Enough for a restaurant, not enough for a script.
const RATE = { windowMs: 60 * 60 * 1000, max: 12 }
/** One phone cannot hold the room: a party books, it does not farm tables. */
const MAX_PER_PHONE = Number(process.env.MAX_BOOKINGS_PER_PHONE ?? 4)
const hits = new Map()

function overRate(ip) {
  const now = Date.now()
  const seen = (hits.get(ip) ?? []).filter((at) => now - at < RATE.windowMs)
  seen.push(now)
  hits.set(ip, seen)
  return seen.length > RATE.max
}

/* ---------------------------------------------------------------- requests */

const MAX_BODY = 8 * 1024
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{1,2}:\d{2}$/

const text = (value, limit) =>
  value === undefined || value === null
    ? ''
    : String(value).replace(/\s+/g, ' ').trim().slice(0, limit)

function readBody(request) {
  return new Promise((done, fail) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        fail(new Error('body too large'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => done(Buffer.concat(chunks).toString('utf8')))
    request.on('error', fail)
  })
}

/** Everything a booking has to satisfy before it reaches the store. */
function readBooking(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'body must be an object' }

  const date = text(raw.date, 10)
  const time = text(raw.time, 5)
  const name = text(raw.name, 80)
  const phone = text(raw.phone, 40)
  const partySize = Number(raw.partySize)
  const tableIds = Array.isArray(raw.tableIds) ? raw.tableIds.map((id) => text(id, 12)) : []

  if (!ISO_DATE.test(date)) return { error: 'date must be YYYY-MM-DD' }
  if (!TIME.test(time)) return { error: 'time must be HH:mm' }
  if (!name) return { error: 'name is required' }
  if (!phone) return { error: 'phone is required' }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > rules.maxPartySize) {
    return { error: 'partySize is out of range' }
  }
  if (tableIds.length === 0 || tableIds.some((id) => !tableById.has(id))) {
    return { error: 'unknown table' }
  }

  // The steps only ever offer open days and real seating times, but a tab left
  // open overnight can carry a stale one.
  if (!slotsForDate(date).includes(time) || isClosed(date)) {
    return { error: 'the restaurant is closed at that time' }
  }

  const today = toISODate(new Date())
  if (date < today) return { error: 'that date has passed' }

  const seats = tableIds.reduce((total, id) => total + (tableById.get(id)?.seats ?? 0), 0)
  if (seats < partySize) return { error: 'those tables do not seat that party' }

  return {
    booking: {
      date,
      time,
      partySize,
      tableIds,
      name,
      phone,
      notes: text(raw.notes, 400),
      locale: text(raw.locale, 5),
    },
  }
}

/** A booking in the words the staff read. */
const toStaff = (booking) => ({
  reference: booking.reference,
  date: booking.date,
  time: booking.time,
  partySize: booking.partySize,
  tables: labelsOf(booking.tableIds),
  zone: zoneOf(booking.tableIds),
  name: booking.name,
  phone: booking.phone,
  notes: booking.notes,
})

/* ------------------------------------------------------------------ server */

/** Echoes the caller's origin when it is one of ours — a list cannot be sent. */
function allowOrigin(request) {
  const origin = request.headers.origin
  if (ORIGINS.includes('*')) return '*'
  if (origin && ORIGINS.includes(origin)) return origin
  return ORIGINS[0] ?? '*'
}

function send(request, response, status, body) {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowOrigin(request),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
  })
  response.end(payload)
}

async function handle(request, response, url) {
  if (request.method === 'OPTIONS') return send(request, response, 204, {})

  if (request.method === 'GET' && url.pathname === '/health') {
    return send(request, response, 200, {
      ok: true,
      store: store.kind,
      chat: Boolean(readChatId()),
    })
  }

  if (request.method === 'GET' && url.pathname === '/closed-dates') {
    const from = url.searchParams.get('from') ?? ''
    const to = url.searchParams.get('to') ?? ''
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
      return send(request, response, 400, { error: 'from and to must be YYYY-MM-DD' })
    }

    const closed = []
    const cursor = parseISODate(from)
    const end = parseISODate(to)
    while (cursor <= end) {
      const iso = toISODate(cursor)
      if (slotsForDate(iso).length === 0 || isClosed(iso)) closed.push(iso)
      cursor.setDate(cursor.getDate() + 1)
    }
    return send(request, response, 200, closed)
  }

  if (request.method === 'GET' && url.pathname === '/slots') {
    const date = url.searchParams.get('date') ?? ''
    const partySize = Number(url.searchParams.get('partySize') ?? 2)
    if (!ISO_DATE.test(date)) return send(request, response, 400, { error: 'date must be YYYY-MM-DD' })

    if (isClosed(date)) return send(request, response, 200, [])

    const booked = await store.bookedOn(date)
    const now = new Date()
    const isToday = toISODate(now) === date
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const slots = slotsForDate(date).map((time) => {
      const [h, m] = time.split(':').map(Number)
      // An hour's notice: the kitchen cannot take a table booked for right now.
      if (isToday && h * 60 + m <= nowMinutes + 60) return { time, available: false }
      return { time, available: seatsAnyone(partySize, booked.get(time) ?? new Set()) }
    })
    return send(request, response, 200, slots)
  }

  if (request.method === 'GET' && url.pathname === '/tables') {
    const date = url.searchParams.get('date') ?? ''
    const time = url.searchParams.get('time') ?? ''
    if (!ISO_DATE.test(date) || !TIME.test(time)) {
      return send(request, response, 400, { error: 'date and time are required' })
    }

    const taken = await store.takenTables(date, time)
    const status = Object.fromEntries(
      tables.map((table) => [
        table.id,
        table.disabled ? 'disabled' : taken.has(table.id) ? 'occupied' : 'available',
      ]),
    )
    return send(request, response, 200, status)
  }

  // Is the booking this browser remembers still a booking? The staff can
  // cancel from Telegram, and the guest has no other way to find that out.
  if (request.method === 'POST' && url.pathname === '/bookings/lookup') {
    let raw
    try {
      raw = JSON.parse(await readBody(request))
    } catch {
      return send(request, response, 400, { error: 'invalid JSON' })
    }

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null
    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    return send(request, response, 200, {
      reference: booking.reference,
      status: booking.status,
      date: booking.date,
      time: booking.time,
      partySize: booking.partySize,
      tableIds: booking.tableIds,
    })
  }

  if (request.method === 'POST' && url.pathname === '/bookings/cancel') {
    let raw
    try {
      raw = JSON.parse(await readBody(request))
    } catch {
      return send(request, response, 400, { error: 'invalid JSON' })
    }

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null
    // The same answer either way: a wrong code and a wrong token must not be
    // distinguishable, or the codes become guessable.
    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    if (booking.status === 'cancelled') {
      return send(request, response, 200, { ok: true, alreadyCancelled: true })
    }

    await store.cancel(ref)
    const chatId = readChatId()
    if (chatId) {
      sendMessage(TOKEN, chatId, cancelledMessage(toStaff(booking), 'the guest')).catch(() => {})
    }
    return send(request, response, 200, { ok: true })
  }

  if (request.method === 'POST' && url.pathname === '/bookings') {
    const ip = request.headers['x-forwarded-for']?.split(',')[0].trim() ?? request.socket.remoteAddress
    if (overRate(ip ?? 'unknown')) return send(request, response, 429, { error: 'too many requests' })

    let raw
    try {
      raw = JSON.parse(await readBody(request))
    } catch {
      return send(request, response, 400, { error: 'invalid JSON' })
    }

    const { booking, error } = readBooking(raw)
    if (error) return send(request, response, 400, { error })

    const held = await store.upcomingForPhone(booking.phone, toISODate(new Date()))
    if (held >= MAX_PER_PHONE) {
      return send(request, response, 429, { error: 'too many bookings on that number' })
    }

    // The group has to still make sense against what is booked right now.
    const taken = await store.takenTables(booking.date, booking.time)
    if (booking.tableIds.some((id) => taken.has(id))) {
      return send(request, response, 409, { error: 'table is no longer available' })
    }
    const isFree = (id) => !taken.has(id) && !tableById.get(id)?.disabled
    const group = resolveTableGroup(booking.tableIds[0], booking.partySize, isFree)
    if (!group || group.join() !== [...booking.tableIds].join()) {
      return send(request, response, 409, { error: 'those tables cannot be put together' })
    }

    const record = {
      ...booking,
      id: `bk_${Date.now().toString(36)}`,
      reference: reference(),
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    }

    let stored
    try {
      stored = await store.create(record)
    } catch (failure) {
      if (failure instanceof TablesTaken) {
        return send(request, response, 409, { error: 'table is no longer available' })
      }
      console.error('Could not store the booking:', failure.message)
      return send(request, response, 500, { error: 'could not store the booking' })
    }

    // The guest already has their table; a silent bot is the restaurant's
    // problem to see in the log, not theirs to see on screen.
    const id = stored?.id ?? record.id
    const chatId = readChatId()
    if (chatId) {
      sendMessage(TOKEN, chatId, buildMessage(toStaff(record)), [
        [{ text: '❌ Cancel this reservation', callback_data: `cancel:${record.reference}` }],
      ]).catch((failure) => console.error('Telegram refused the message:', failure.message))
    } else {
      console.warn('A booking came in but no chat is configured — send /start to the bot.')
    }

    // The token is what lets the guest cancel later; it is theirs alone, so it
    // goes back once and is never stored anywhere we could leak it from.
    return send(request, response, 200, {
      ...record,
      id,
      cancelToken: cancelToken(id),
    })
  }

  return send(request, response, 404, { error: 'not found' })
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  handle(request, response, url).catch((failure) => {
    console.error('Unhandled:', failure)
    send(request, response, 500, { error: 'server error' })
  })
})

/* ------------------------------------------------------------------- start */

const me = await getMe(TOKEN).catch((failure) => {
  console.error('The bot token was refused:', failure.message)
  process.exit(1)
})

// Bound to loopback: nginx is the only thing that should reach it. The firewall
// says the same, but a service should not depend on a firewall rule staying put.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`DAON API on :${PORT} — store: ${store.kind}, bot @${me.username}`)
  const chatId = readChatId()
  console.log(
    chatId
      ? `Notifications go to chat ${chatId}.`
      : `No chat yet — open https://t.me/${me.username} and send /start.`,
  )
})

/* ---------------------------------------------------------------- the bot */

/** "24-12-2026", the way it is written on the day, back to an ISO date. */
function readDayFirstDate(value) {
  const match = /^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/.exec(String(value ?? '').trim())
  if (!match) return null
  const [, day, month, year] = match
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return ISO_DATE.test(iso) ? iso : null
}

/**
 * The commands, with the Polish names they shipped with kept as aliases so a
 * staff member who learned those is not left tapping a dead command.
 */
const COMMANDS = {
  '/help': 'help',
  '/pomoc': 'help',
  '/today': 'day',
  '/dzisiaj': 'day',
  '/tomorrow': 'tomorrow',
  '/jutro': 'tomorrow',
  '/day': 'onDate',
  '/dzien': 'onDate',
  '/close': 'close',
  '/zamknij': 'close',
  '/open': 'open',
  '/otworz': 'open',
  '/closed': 'help',
  '/zamkniete': 'help',
}

/** Only the chat the restaurant registered may drive the bot. */
const isStaff = (chatId) => String(chatId) === String(readChatId() ?? '')

async function handleCommand(chatId, who, body) {
  // Telegram appends @botname when a command is used in a group.
  const [raw, ...rest] = body.split(/\s+/)
  const command = raw.split('@')[0].toLowerCase()
  const say = (text, keyboard) => sendMessage(TOKEN, chatId, text, keyboard).catch(() => {})

  if (command === '/start' || command === '/id') {
    if (!process.env.TELEGRAM_CHAT_ID?.trim()) rememberChatId(chatId, who)
    return say(welcomeMessage(chatId))
  }

  // Everything below changes what guests can book, so it stays with the chat
  // the restaurant registered.
  if (!isStaff(chatId)) return

  const action = COMMANDS[command]
  if (!action) return

  if (action === 'help') return say(helpMessage(listClosures(toISODate(new Date()))))

  if (action === 'day' || action === 'tomorrow' || action === 'onDate') {
    const day = new Date()
    if (action === 'tomorrow') day.setDate(day.getDate() + 1)
    const date = action === 'onDate' ? readDayFirstDate(rest.join(' ')) : toISODate(day)
    if (!date) return say('Write the date like this: /day 24-12-2026')
    return say(dayList(date, await store.onDate(date)))
  }

  const [first, ...note] = rest
  const date = readDayFirstDate(first)
  if (!date) return say(`Write the date like this: ${command} 24-12-2026`)

  if (action === 'close') {
    const booked = await store.onDate(date)
    const added = addClosure(date, note.join(' '))
    return say(
      [
        added
          ? `${formatDate(date)} is closed — no new bookings will be taken.`
          : `${formatDate(date)} was already closed.`,
        booked.length > 0
          ? `\nCareful: ${booked.length} guest(s) already booked that day. Call them — /day ${formatDate(date)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  return say(
    removeClosure(date)
      ? `${formatDate(date)} is taking bookings again.`
      : `${formatDate(date)} was not closed.`,
  )
}

/** The staff pressed "cancel" under a booking. */
async function handleCancelButton(query) {
  const chatId = query.message?.chat?.id
  const reference = String(query.data ?? '').split(':')[1] ?? ''

  if (!isStaff(chatId)) {
    return answerCallback(TOKEN, query.id, 'Not allowed.').catch(() => {})
  }

  const booking = await store.find(reference)
  if (!booking) {
    return answerCallback(TOKEN, query.id, 'That reservation is gone.').catch(() => {})
  }
  if (booking.status === 'cancelled') {
    return answerCallback(TOKEN, query.id, 'Already cancelled.').catch(() => {})
  }

  await store.cancel(reference)
  await answerCallback(TOKEN, query.id, 'Cancelled. The table is free again.').catch(() => {})
  // Rewriting the message takes the button away, so it cannot be pressed twice.
  await editMessage(
    TOKEN,
    chatId,
    query.message.message_id,
    cancelledMessage(toStaff(booking), 'the restaurant'),
  ).catch(() => {})
}

if (LISTEN) {
  let offset
  const loop = async () => {
    try {
      offset = await pollUpdates(TOKEN, offset, {
        async onMessage(message) {
          const chatId = message.chat?.id
          if (!chatId) return
          const who = message.chat.title ?? message.chat.username ?? message.chat.first_name ?? ''
          const body = (message.text ?? '').trim()
          if (!body.startsWith('/')) return
          await handleCommand(chatId, who, body)
        },
        async onCallback(query) {
          if (String(query.data ?? '').startsWith('cancel:')) await handleCancelButton(query)
        },
      })
    } catch (failure) {
      console.warn('Polling hiccup:', failure.message)
      await new Promise((done) => setTimeout(done, 5000))
    }
    setTimeout(loop, 100)
  }
  loop()
}
