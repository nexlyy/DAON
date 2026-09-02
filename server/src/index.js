/**
 * DAON reservation API.
 *
 * The site is a static build: it cannot hold a bot token, and it cannot be
 * trusted to know what is already booked. This service does both. It answers
 * the four calls the site's `BookingApi` makes, keeps the reservations in
 * Supabase (or a local file when none is configured), and tells the restaurant
 * about each one over Telegram, in Polish.
 *
 *   GET  /closed-dates?from&to           dates the kitchen is shut
 *   GET  /slots?date&partySize           seating times, with what is still free
 *   GET  /tables?date&time&partySize     per-table availability
 *   POST /bookings                       take a booking, then tell the staff
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
import { loadEnv, root } from './env.js'
import { buildMessage } from './message.js'
import { createStore, reference, TablesTaken } from './store.js'
import { getMe, pollUpdates, sendMessage } from './telegram.js'

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
  if (!slotsForDate(date).includes(time)) {
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
      if (slotsForDate(iso).length === 0) closed.push(iso)
      cursor.setDate(cursor.getDate() + 1)
    }
    return send(request, response, 200, closed)
  }

  if (request.method === 'GET' && url.pathname === '/slots') {
    const date = url.searchParams.get('date') ?? ''
    const partySize = Number(url.searchParams.get('partySize') ?? 2)
    if (!ISO_DATE.test(date)) return send(request, response, 400, { error: 'date must be YYYY-MM-DD' })

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
    const chatId = readChatId()
    if (chatId) {
      sendMessage(
        TOKEN,
        chatId,
        buildMessage({
          reference: record.reference,
          date: record.date,
          time: record.time,
          partySize: record.partySize,
          tables: labelsOf(record.tableIds),
          zone: zoneOf(record.tableIds),
          name: record.name,
          phone: record.phone,
          notes: record.notes,
        }),
      ).catch((failure) => console.error('Telegram refused the message:', failure.message))
    } else {
      console.warn('A booking came in but no chat is configured — send /start to the bot.')
    }

    return send(request, response, 200, { ...record, ...stored })
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

server.listen(PORT, () => {
  console.log(`DAON API on :${PORT} — store: ${store.kind}, bot @${me.username}`)
  const chatId = readChatId()
  console.log(
    chatId
      ? `Notifications go to chat ${chatId}.`
      : `No chat yet — open https://t.me/${me.username} and send /start.`,
  )
})

if (LISTEN) {
  let offset
  const loop = async () => {
    try {
      offset = await pollUpdates(TOKEN, offset, async (message) => {
        const chatId = message.chat?.id
        if (!chatId) return
        const who = message.chat.title ?? message.chat.username ?? message.chat.first_name ?? ''
        const body = (message.text ?? '').trim()

        if (body.startsWith('/start') || body.startsWith('/id')) {
          if (!process.env.TELEGRAM_CHAT_ID?.trim()) rememberChatId(chatId, who)
          await sendMessage(
            TOKEN,
            chatId,
            [
              '<b>DAON — powiadomienia o rezerwacjach</b>',
              '',
              `Ten czat: <code>${chatId}</code>`,
              'Rezerwacje ze strony będą przychodzić tutaj.',
            ].join('\n'),
          ).catch(() => {})
        }
      })
    } catch (failure) {
      console.warn('Polling hiccup:', failure.message)
      await new Promise((done) => setTimeout(done, 5000))
    }
    setTimeout(loop, 100)
  }
  loop()
}
