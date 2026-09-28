import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createAdmin } from './admin.js'
import {
  applyContent,
  parseISODate,
  resolveTableGroup,
  rules,
  seatsAnyone,
  slotsForDate,
  takenAt,
  tableById,
  tables,
  toISODate,
} from './availability.js'
import { openingOn, toStaff } from './bookings.js'
import { cardKeyboard, createBot } from './bot.js'
import { cancelToken, tokenMatches } from './cancel.js'
import { isClosed } from './closures.js'
import { createContent } from './content.js'
import { createPhotos } from './photos.js'
import {
  CLOSES_BEFORE,
  createPreorders,
  enabled as preorderEnabled,
  publicPreorder,
  readItems,
  stillOpen,
} from './preorders.js'
import { createWaitlist, readWaiting, waitingKeyboard, waitingMessage } from './waitlist.js'
import { createRender } from './render.js'
import { loadEnv, root } from './env.js'
import { createGuestMail, readEmail } from './guestmail.js'
import { createMailer } from './mailer.js'
import { createStats } from './stats.js'
import { buildMessage, cancelledMessage, dailyReport, preorderMessage, scrubbedMessage } from './message.js'
import { parseStaff } from './staff.js'
import { createStore, reference, TablesTaken } from './store.js'
import { deleteMessage, editMessage, getChat, getMe, pollUpdates, sendMessage } from './telegram.js'

loadEnv()

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const PORT = Number(process.env.PORT ?? 8787)

const ORIGINS = (process.env.ALLOWED_ORIGIN ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const LISTEN = process.env.TELEGRAM_LISTEN !== '0'

const STORE = resolve(root, 'data')
const ALERTS_FILE = resolve(STORE, 'alerts.json')
const ALERTS_KEPT_MS = 90 * 24 * 60 * 60 * 1000
const SENT_FILE = resolve(STORE, 'sent.json')
const RETENTION_DAYS = Number(rules.retentionDays ?? 30)
const DAY_MS = 24 * 60 * 60 * 1000

const STAFF = parseStaff(process.env.TELEGRAM_STAFF_IDS)

// The list for today that the staff get every day, at this Warsaw time (the
// service runs with TZ=Europe/Warsaw). "off" turns it off.
const REPORT_SETTING = (process.env.DAILY_REPORT_AT ?? '12:00').trim()
const REPORT_AT = /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(REPORT_SETTING) ? REPORT_SETTING.padStart(5, '0') : null
const REPORT_FILE = resolve(STORE, 'daily-report.json')
// A report missed because the server was down still goes out when it is back,
// if that is within these hours; later in the evening it would only be noise.
const REPORT_LATE_HOURS = 4

// Who is not told about the admin panel — signing in, publishing, a locked
// address. They still get everything about the bookings.
const ADMIN_QUIET = parseStaff(process.env.ADMIN_QUIET_IDS)

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

if (STAFF.size === 0) {
  console.error('TELEGRAM_STAFF_IDS is empty. List the staff Telegram user ids, comma separated.')
  process.exit(1)
}

mkdirSync(STORE, { recursive: true })
const store = createStore()
const guestMail = createGuestMail({ mailer: createMailer(), store })
const stats = createStats()
const waitlist = createWaitlist()
const preorders = createPreorders()

function readAlerts() {
  try {
    return JSON.parse(readFileSync(ALERTS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function addAlerts(ref, messages) {
  const alerts = readAlerts()
  const cutoff = Date.now() - ALERTS_KEPT_MS
  for (const [key, entry] of Object.entries(alerts)) {
    if (!(Date.parse(entry.at) >= cutoff)) delete alerts[key]
  }
  const known = alerts[ref]?.messages ?? []
  const seen = new Set(known.map((message) => `${message.chatId}:${message.messageId}`))
  alerts[ref] = {
    at: new Date().toISOString(),
    messages: [...known, ...messages.filter((message) => !seen.has(`${message.chatId}:${message.messageId}`))],
  }
  writeFileSync(ALERTS_FILE, JSON.stringify(alerts))
}

function readSent() {
  try {
    return JSON.parse(readFileSync(SENT_FILE, 'utf8'))
  } catch {
    return []
  }
}

function recordSent(messages, date) {
  if (!date || messages.length === 0) return
  const sent = readSent()
  for (const { chatId, messageId } of messages) {
    const entry = sent.find((known) => known.chatId === chatId && known.messageId === messageId)
    if (entry) entry.date = date
    else sent.push({ chatId, messageId, date })
  }
  writeFileSync(SENT_FILE, JSON.stringify(sent))
}

async function scrubOldMessages() {
  const cutoff = toISODate(new Date(Date.now() - RETENTION_DAYS * DAY_MS))
  const keep = []
  let scrubbed = 0
  for (const entry of readSent()) {
    if (entry.date >= cutoff) {
      keep.push(entry)
      continue
    }
    try {
      await editMessage(TOKEN, entry.chatId, entry.messageId, scrubbedMessage(entry.date, RETENTION_DAYS))
      scrubbed += 1
    } catch (failure) {
      const gone = /not found|can't be edited|not modified/i.test(failure.message)
      if (!gone && (entry.attempts ?? 0) < 5) keep.push({ ...entry, attempts: (entry.attempts ?? 0) + 1 })
    }
  }
  const latest = readSent().filter(
    (entry) =>
      !keep.some((kept) => kept.chatId === entry.chatId && kept.messageId === entry.messageId) &&
      entry.date >= cutoff,
  )
  writeFileSync(SENT_FILE, JSON.stringify([...keep, ...latest]))
  if (scrubbed > 0) console.log(`Removed guest details from ${scrubbed} old Telegram message(s).`)
}

async function adoptOlderAlerts() {
  const known = new Set(readSent().map((entry) => `${entry.chatId}:${entry.messageId}`))
  for (const [ref, entry] of Object.entries(readAlerts())) {
    const messages = (entry.messages ?? []).filter(
      (message) => !known.has(`${message.chatId}:${message.messageId}`),
    )
    if (messages.length === 0) continue
    const booking = await store.find(ref).catch(() => null)
    if (booking?.date) recordSent(messages, booking.date)
  }
}

async function notifyStaff(text, keyboard, { except } = {}) {
  const sent = []
  const skip = new Set(
    (except === undefined ? [] : Array.isArray(except) || except instanceof Set ? [...except] : [except]).map(
      String,
    ),
  )
  for (const id of STAFF) {
    if (skip.has(String(id))) continue
    try {
      const message = await sendMessage(TOKEN, id, text, keyboard)
      sent.push({ chatId: Number(id), messageId: message.message_id })
    } catch (failure) {
      console.error(`Telegram refused the message for ${id}:`, failure.message)
    }
  }
  return sent
}

function forgetAlerts(key) {
  const alerts = readAlerts()
  if (!alerts[key]) return
  delete alerts[key]
  writeFileSync(ALERTS_FILE, JSON.stringify(alerts))
}

async function updateAlerts(ref, text, pressed, keyboard) {
  const targets = [...(readAlerts()[ref]?.messages ?? []), ...(pressed ? [pressed] : [])]
  const seen = new Set()
  for (const { chatId, messageId } of targets) {
    const key = `${chatId}:${messageId}`
    if (seen.has(key)) continue
    seen.add(key)
    await editMessage(TOKEN, chatId, messageId, text, keyboard).catch(() => {})
  }
}

const strangers = new Set()

function noteStranger(user, chat) {
  const id = String(user?.id ?? 'unknown')
  const key = `${id}:${chat?.type}`
  if (strangers.has(key)) return
  if (strangers.size > 1000) strangers.clear()
  strangers.add(key)
  const who = `${id}${user?.username ? ` (@${user.username})` : ''}`
  console.log(
    STAFF.has(id)
      ? `Ignored ${who} in a ${chat?.type ?? 'unknown'} chat: the bot only answers staff in private.`
      : `Ignored ${who}: not on the staff list.`,
  )
}

const RATE = { windowMs: 60 * 60 * 1000, max: 12 }

const MAX_PER_PHONE = Number(process.env.MAX_BOOKINGS_PER_PHONE ?? 4)
const hits = new Map()

const clientIp = (request) =>
  String(request.headers['x-real-ip'] ?? '').trim() || request.socket.remoteAddress || 'unknown'

function overRate(ip) {
  const now = Date.now()
  const seen = (hits.get(ip) ?? []).filter((at) => now - at < RATE.windowMs)
  seen.push(now)
  hits.set(ip, seen)
  return seen.length > RATE.max
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, seen] of hits) {
    if (now - seen[seen.length - 1] >= RATE.windowMs) hits.delete(ip)
  }
}, 10 * 60 * 1000).unref()

let bookingQueue = Promise.resolve()

function oneAtATime(task) {
  const run = bookingQueue.then(task, task)
  bookingQueue = run.catch(() => {})
  return run
}

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, fail) => setTimeout(() => fail(new Error(`no answer in ${ms} ms`)), ms)),
  ])

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

async function readJson(request) {
  try {
    return JSON.parse(await readBody(request))
  } catch {
    return null
  }
}

function readSeating(raw) {
  const date = text(raw.date, 10)
  const time = text(raw.time, 5)
  const partySize = Number(raw.partySize)
  const tableIds = Array.isArray(raw.tableIds) ? raw.tableIds.map((id) => text(id, 12)) : []

  if (!ISO_DATE.test(date)) return { error: 'date must be YYYY-MM-DD' }
  if (!TIME.test(time)) return { error: 'time must be HH:mm' }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > rules.maxPartySize) {
    return { error: 'partySize is out of range' }
  }
  if (tableIds.length === 0 || tableIds.some((id) => !tableById.has(id))) {
    return { error: 'unknown table' }
  }

  if (!slotsForDate(date).includes(time) || isClosed(date)) {
    return { error: 'the restaurant is closed at that time', code: 'closed' }
  }

  const today = toISODate(new Date())
  if (date < today) return { error: 'that date has passed', code: 'closed' }

  const seats = tableIds.reduce((total, id) => total + (tableById.get(id)?.seats ?? 0), 0)
  if (seats < partySize) return { error: 'those tables do not seat that party' }

  return { seating: { date, time, partySize, tableIds } }
}

function readBooking(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'body must be an object' }
  const { seating, error, code } = readSeating(raw)
  if (error) return { error, code }

  const name = text(raw.name, 80)
  const phone = text(raw.phone, 40)
  if (!name) return { error: 'name is required' }
  if (!phone) return { error: 'phone is required' }

  return {
    booking: {
      ...seating,
      name,
      phone,
      notes: text(raw.notes, 400),
      locale: text(raw.locale, 5),
    },
  }
}

async function seatingConflict(seating, reservationId) {
  const holds = (await store.holdsOn(seating.date)).filter(
    (hold) => !reservationId || hold.reservationId !== reservationId,
  )
  const taken = takenAt(seating.time, holds)
  if (seating.tableIds.some((id) => taken.has(id))) {
    return { status: 409, body: { error: 'table is no longer available', code: 'unavailable' } }
  }
  const isFree = (id) => !taken.has(id) && !tableById.get(id)?.disabled
  const group = resolveTableGroup(seating.tableIds[0], seating.partySize, isFree)
  if (!group || group.join() !== [...seating.tableIds].join()) {
    return { status: 409, body: { error: 'those tables cannot be put together', code: 'unavailable' } }
  }
  return null
}

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

const publicBooking = (booking) => ({
  reference: booking.reference,
  status: booking.status,
  date: booking.date,
  time: booking.time,
  partySize: booking.partySize,
  tableIds: booking.tableIds,
})

// Pre-orders: the older cards of one booking are edited and a new one goes
// out, one save at a time, so two quick saves cannot reach the staff in the
// wrong order.
const preorderCards = (reference) => `${reference}:preorder`
let preorderQueue = Promise.resolve()

function inTurn(task) {
  const run = preorderQueue.then(task, task)
  preorderQueue = run.catch(() => {})
  return run
}

const liveDishes = () => {
  try {
    return content.readLiveFile('menu').dishes ?? []
  } catch {
    return []
  }
}

function tellPreorder(booking, before, after) {
  const key = preorderCards(booking.reference)
  const seen = toStaff(booking)
  inTurn(async () => {
    if (before) await updateAlerts(key, preorderMessage(seen, before, after ? 'replaced' : 'withdrawn'))
    // Only the newest live card is kept for later edits; the older ones have
    // already said what became of them.
    forgetAlerts(key)
    const sent = await notifyStaff(
      after ? preorderMessage(seen, after, before ? 'changed' : 'new') : preorderMessage(seen, before, 'withdrawn'),
    )
    if (after) addAlerts(key, sent)
    recordSent(sent, booking.date)
  }).catch((failure) => console.error('Could not tell the staff about a pre-order:', failure.message))
}

/** A cancelled booking takes its dishes with it; the cards say so without a new message. */
function dropPreorder(booking) {
  const gone = preorders.remove(booking.reference)
  if (!gone) return
  const key = preorderCards(booking.reference)
  const seen = toStaff(booking)
  inTurn(async () => {
    await updateAlerts(key, preorderMessage(seen, gone, 'cancelled'))
    forgetAlerts(key)
  }).catch((failure) => console.error('Could not update the pre-order cards:', failure.message))
}

let bot

async function handle(request, response, url) {
  if (request.method === 'OPTIONS') return send(request, response, 204, {})

  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    return admin.handle(request, response, url)
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    let database = 'ok'
    try {
      await withTimeout(store.ping(), 8000)
    } catch (failure) {
      database = 'unreachable'
      console.error('Health check: the database did not answer:', failure.message)
    }
    const ok = database === 'ok'
    return send(request, response, ok ? 200 : 503, {
      ok,
      store: store.kind,
      database,
      staff: STAFF.size,
    })
  }

  if (request.method === 'GET' && url.pathname === '/hit') {
    stats.hit({
      ip: clientIp(request),
      userAgent: request.headers['user-agent'],
      event: url.searchParams.get('e'),
      page: url.searchParams.get('p'),
      locale: url.searchParams.get('l'),
      referrer: url.searchParams.get('r'),
    })
    response.writeHead(204, { 'Cache-Control': 'no-store' })
    return response.end()
  }

  if (request.method === 'GET' && url.pathname === '/config') {
    return send(request, response, 200, {
      email: guestMail.enabled,
      preorder: preorderEnabled() && liveDishes().length > 0 ? { closesBefore: CLOSES_BEFORE } : null,
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

    const reservationId = await ownReservation(url)
    const holds = (await store.holdsOn(date)).filter(
      (hold) => !reservationId || hold.reservationId !== reservationId,
    )
    const now = new Date()
    const isToday = toISODate(now) === date
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const slots = slotsForDate(date).map((time) => {
      const [h, m] = time.split(':').map(Number)

      if (isToday && h * 60 + m <= nowMinutes + 60) return { time, available: false }
      return { time, available: seatsAnyone(partySize, takenAt(time, holds)) }
    })
    return send(request, response, 200, slots)
  }

  if (request.method === 'GET' && url.pathname === '/tables') {
    const date = url.searchParams.get('date') ?? ''
    const time = url.searchParams.get('time') ?? ''
    if (!ISO_DATE.test(date) || !TIME.test(time)) {
      return send(request, response, 400, { error: 'date and time are required' })
    }

    const reservationId = await ownReservation(url)
    const holds = (await store.holdsOn(date)).filter(
      (hold) => !reservationId || hold.reservationId !== reservationId,
    )
    const taken = takenAt(time, holds)
    const status = Object.fromEntries(
      tables.map((table) => [
        table.id,
        table.disabled ? 'disabled' : taken.has(table.id) ? 'occupied' : 'available',
      ]),
    )
    return send(request, response, 200, status)
  }

  if (request.method === 'POST' && url.pathname === '/bookings/lookup') {
    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null
    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    return send(request, response, 200, {
      ...publicBooking(booking),
      preorder: booking.status === 'confirmed' ? publicPreorder(preorders.get(booking.reference)) : null,
    })
  }

  // Dishes picked to go with a booking. The browser proves the booking is its
  // own with the same token that cancels it; the prices come from the live
  // menu, not from the request.
  if (request.method === 'POST' && url.pathname === '/bookings/preorder') {
    if (overRate(clientIp(request))) {
      return send(request, response, 429, { error: 'too many requests', code: 'rateLimit' })
    }
    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })
    if (!preorderEnabled()) return send(request, response, 409, { error: 'pre-orders are off', code: 'closed' })

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null
    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    if (!stillOpen(booking)) {
      return send(request, response, 409, { error: 'too late to change the dishes online', code: 'closed' })
    }

    const { lines, error, code } = readItems(raw.items, liveDishes())
    if (error) return send(request, response, 400, { error, code })
    const notes = lines.length > 0 ? text(raw.notes, 300) : ''

    const before = preorders.get(booking.reference)
    const same =
      before && JSON.stringify([before.lines, before.notes]) === JSON.stringify([lines, notes])
    if (same || (!before && lines.length === 0)) {
      return send(request, response, 200, { preorder: publicPreorder(before) })
    }

    const after =
      lines.length > 0
        ? preorders.put(booking.reference, { date: booking.date, lines, notes, locale: text(raw.locale, 5) })
        : (preorders.remove(booking.reference), null)
    if (!before) stats.booked('preorder')
    tellPreorder(booking, before, after)
    return send(request, response, 200, { preorder: publicPreorder(after) })
  }

  if (request.method === 'POST' && url.pathname === '/bookings/cancel') {
    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null

    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    if (booking.status === 'cancelled') {
      return send(request, response, 200, { ok: true, alreadyCancelled: true })
    }

    await store.cancel(ref)
    dropPreorder(booking)
    guestMail.cancelled(booking).catch(() => {})
    const notice = cancelledMessage(toStaff(booking), 'the guest')
    updateAlerts(ref, notice)
      .then(() => notifyStaff(notice))
      .then((sent) => recordSent(sent, booking.date))
      .catch((failure) => console.error('Could not tell the staff:', failure.message))
    return send(request, response, 200, { ok: true })
  }

  if (request.method === 'POST' && url.pathname === '/bookings/move') {
    if (overRate(clientIp(request))) {
      return send(request, response, 429, { error: 'too many requests', code: 'rateLimit' })
    }
    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })

    const ref = text(raw.reference, 24).toUpperCase()
    const booking = ref ? await store.find(ref) : null
    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    if (booking.status !== 'confirmed' || booking.date < toISODate(new Date())) {
      return send(request, response, 409, { error: 'that booking can no longer be changed', code: 'closed' })
    }

    const { seating, error, code } = readSeating(raw)
    if (error) return send(request, response, 400, { error, code })

    const outcome = await oneAtATime(async () => {
      const conflict = await seatingConflict(seating, booking.id)
      if (conflict) return conflict
      try {
        return { after: await store.move(ref, seating) }
      } catch (failure) {
        if (failure instanceof TablesTaken) {
          return { status: 409, body: { error: 'table is no longer available', code: 'unavailable' } }
        }
        console.error('Could not move the booking:', failure.message)
        return { status: 500, body: { error: 'could not change the booking' } }
      }
    })
    if (!outcome.after) return send(request, response, outcome.status, outcome.body)

    stats.booked('changedOnline')
    bot
      .announceMove(booking, outcome.after, 'the guest, on the website')
      .catch((failure) => console.error('Could not tell the staff:', failure.message))
    return send(request, response, 200, publicBooking({ ...booking, ...outcome.after }))
  }

  // Somebody wanted a time that was full. Nothing is held for them: the staff
  // get a card, and call if a table frees up.
  if (request.method === 'POST' && url.pathname === '/waitlist') {
    if (overRate(clientIp(request))) {
      return send(request, response, 429, { error: 'too many requests', code: 'rateLimit' })
    }

    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })

    const { entry, error, code } = readWaiting(raw)
    if (error) return send(request, response, 400, { error, code })

    const added = waitlist.add(entry)
    if (added.error) return send(request, response, 429, { error: added.error, code: added.code })

    notifyStaff(waitingMessage(added.entry), waitingKeyboard(added.entry))
      .then((sent) => addAlerts(added.entry.id, sent))
      .catch((failure) => console.error('Could not tell the staff about the waiting list:', failure.message))

    return send(request, response, 200, {
      reference: added.entry.id,
      date: added.entry.date,
      time: added.entry.time,
      partySize: added.entry.partySize,
    })
  }

  if (request.method === 'POST' && url.pathname === '/bookings') {
    if (overRate(clientIp(request))) {
      return send(request, response, 429, { error: 'too many requests', code: 'rateLimit' })
    }

    const raw = await readJson(request)
    if (!raw) return send(request, response, 400, { error: 'invalid JSON' })

    const { booking, error, code } = readBooking(raw)
    if (error) return send(request, response, 400, { error, code })

    const outcome = await oneAtATime(async () => {
      const held = await store.upcomingForPhone(booking.phone, toISODate(new Date()))
      if (held >= MAX_PER_PHONE) {
        return { status: 429, body: { error: 'too many bookings on that number', code: 'phoneLimit' } }
      }

      const conflict = await seatingConflict(booking)
      if (conflict) return conflict

      const record = {
        ...booking,
        id: `bk_${Date.now().toString(36)}`,
        reference: reference(),
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      }

      try {
        return { record, stored: await store.create(record) }
      } catch (failure) {
        if (failure instanceof TablesTaken) {
          return { status: 409, body: { error: 'table is no longer available', code: 'unavailable' } }
        }
        console.error('Could not store the booking:', failure.message)
        return { status: 500, body: { error: 'could not store the booking' } }
      }
    })

    if (!outcome.record) return send(request, response, outcome.status, outcome.body)
    const { record, stored } = outcome

    const id = stored?.id ?? record.id
    notifyStaff(buildMessage(toStaff(record)), cardKeyboard(record.reference))
      .then((sent) => {
        addAlerts(record.reference, sent)
        recordSent(sent, record.date)
      })
      .catch((failure) => console.error('Could not tell the staff:', failure.message))

    stats.booked('online')
    guestMail
      .booked({ ...record, id }, readEmail(raw.email), booking.locale)
      .catch((failure) => console.error('Could not email the guest:', failure.message))

    return send(request, response, 200, {
      ...record,
      id,
      cancelToken: cancelToken(id),
    })
  }

  return send(request, response, 404, { error: 'not found' })
}

async function ownReservation(url) {
  const ref = text(url.searchParams.get('reference'), 24).toUpperCase()
  const token = url.searchParams.get('token')
  if (!ref || !token) return null
  const booking = await store.find(ref).catch(() => null)
  return booking && tokenMatches(booking.id, token) ? booking.id : null
}

const content = createContent()
const render = createRender({ content })
const photos = createPhotos()
const admin = createAdmin({
  content,
  render,
  photos,
  notifyStaff: (text) => notifyStaff(text, undefined, { except: ADMIN_QUIET }).catch(() => {}),
  // The hours and the reservation rules are the restaurant's to change too, so
  // a publish has to reach the booking side of the API, not only the pages.
  onPublished: (published) => {
    try {
      applyContent(published.restaurant)
    } catch (failure) {
      console.error('Published content did not reach the booking rules:', failure.message)
    }
  },
  clientIp,
})

bot = createBot({
  token: TOKEN,
  staff: STAFF,
  store,
  notifyStaff,
  recordSent,
  addAlerts,
  updateAlerts,
  oneAtATime,
  retentionDays: RETENTION_DAYS,
  onMoved: (before, after) => {
    preorders.moved(after.reference, after.date)
    return guestMail.moved({ ...before, ...after })
  },
  onCancelled: (booking) => {
    dropPreorder(booking)
    return guestMail.cancelled(booking)
  },
  onBooked: () => stats.booked('staff'),
  stats,
  waitlist,
  reportAt: REPORT_AT,
})

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  handle(request, response, url).catch((failure) => {
    console.error('Unhandled:', failure)
    send(request, response, 500, { error: 'server error' })
  })
})

const me = await getMe(TOKEN).catch((failure) => {
  console.error('The bot token was refused:', failure.message)
  process.exit(1)
})

await admin.bootstrap()
render.tidy()

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DAON API on :${PORT} — store: ${store.kind}, bot @${me.username}`)
  console.log(
    admin.configured()
      ? `Admin panel: on, pending changes: ${content.pending().length}.` +
          (ADMIN_QUIET.size > 0 ? ` Not reported to ${ADMIN_QUIET.size} staff account(s).` : '')
      : 'Admin panel: off (ADMIN_USER and ADMIN_PASSWORD are not set).',
  )
  console.log(`Staff: ${STAFF.size} account(s).`)

  setTimeout(() => {
    adoptOlderAlerts()
      .then(scrubOldMessages)
      .catch((failure) => console.error('Could not tidy old messages:', failure.message))
  }, Number(process.env.TIDY_DELAY_MS ?? 60_000))
  setInterval(() => {
    scrubOldMessages().catch((failure) =>
      console.error('Could not tidy old messages:', failure.message),
    )
  }, 6 * 60 * 60 * 1000)

  // The waiting list keeps a name and a number only until the day it was for
  // has passed.
  const forgetWaiting = async () => {
    try {
      const gone = waitlist.tidy()
      if (gone.length === 0) return
      const alerts = readAlerts()
      for (const entry of gone) {
        for (const { chatId, messageId } of alerts[entry.id]?.messages ?? []) {
          await deleteMessage(TOKEN, chatId, messageId).catch(() => {})
        }
        delete alerts[entry.id]
      }
      writeFileSync(ALERTS_FILE, JSON.stringify(alerts))
      console.log(`Waiting list: forgot ${gone.length} from past days, with their cards.`)
    } catch (failure) {
      console.error('Could not tidy the waiting list:', failure.message)
    }
  }
  void forgetWaiting()
  setInterval(() => void forgetWaiting(), 6 * 60 * 60 * 1000)

  // Dishes picked ahead are kept only until the visit.
  const forgetPreorders = async () => {
    try {
      const gone = await preorders.tidy(toISODate(new Date()), (reference) => store.find(reference))
      if (gone.length > 0) console.log(`Pre-orders: forgot ${gone.length} from past days.`)
    } catch (failure) {
      console.error('Could not tidy the pre-orders:', failure.message)
    }
  }
  void forgetPreorders()
  setInterval(() => void forgetPreorders(), 6 * 60 * 60 * 1000)

  startDailyReport()

  bot.setup().catch(() => {})

  const mailTick = () =>
    guestMail.tick().catch((failure) => console.error('Could not send reminders:', failure.message))
  setTimeout(mailTick, 30_000)
  setInterval(mailTick, 10 * 60 * 1000)
  console.log(guestMail.enabled ? 'Guest emails: on.' : 'Guest emails: off (no SMTP settings).')

  for (const id of STAFF) {
    getChat(TOKEN, id).catch(() =>
      console.warn(
        `Staff account ${id} has not opened the bot, so it cannot be written to. ` +
          `They need to open https://t.me/${me.username} and press Start.`,
      ),
    )
  }
})

/**
 * Once a day at REPORT_AT: what is booked for today. Checked every half
 * minute rather than timed to the second, so a change of clocks in spring or
 * autumn cannot move it and a restart cannot skip it; the day it went out is
 * written down, so a restart cannot send it twice either.
 */
function startDailyReport() {
  if (!REPORT_AT) {
    console.log('Daily report: off.')
    return
  }
  const readReport = () => {
    try {
      return JSON.parse(readFileSync(REPORT_FILE, 'utf8'))
    } catch {
      return null
    }
  }
  const markReported = (date) =>
    writeFileSync(REPORT_FILE, JSON.stringify({ date, at: new Date().toISOString() }))
  const [hours, minutes] = REPORT_AT.split(':').map(Number)
  const lateBy = (now) => now.getHours() * 60 + now.getMinutes() - (hours * 60 + minutes)

  // Switched on for the first time in the afternoon: start with tomorrow
  // rather than surprise everyone with a list in the middle of service.
  if (!readReport() && lateBy(new Date()) >= 0) markReported(toISODate(new Date()))

  let busy = false
  let retryAt = 0
  const tick = async () => {
    const now = new Date()
    const today = toISODate(now)
    const late = lateBy(now)
    if (busy || late < 0 || late >= REPORT_LATE_HOURS * 60) return
    if (Date.now() < retryAt || readReport()?.date === today) return

    busy = true
    try {
      const bookings = (await withTimeout(store.onDate(today), 15000))
        .filter((booking) => booking.status !== 'cancelled')
        .map(toStaff)
      const day = openingOn(today)
      const texts = dailyReport(today, bookings, {
        closed: day.closed ? (day.reason === 'closure' ? 'closed from the bot' : 'the weekly day off') : null,
        waiting: waitlist.active(today).filter((entry) => entry.date === today).length,
      })
      let delivered = 0
      for (const text of texts) {
        const sent = await notifyStaff(text)
        delivered += sent.length
        recordSent(sent, today)
      }
      if (delivered === 0) throw new Error('Telegram took none of the messages')
      markReported(today)
      console.log(`Daily report for ${today}: sent, ${bookings.length} reservation(s).`)
    } catch (failure) {
      // Most often the database missing one answer; it is back in a minute or two.
      retryAt = Date.now() + 2 * 60 * 1000
      console.error('Could not send the daily report, trying again in 2 minutes:', failure.message)
    } finally {
      busy = false
    }
  }

  setTimeout(() => void tick(), 5000)
  setInterval(() => void tick(), 30 * 1000)
  console.log(`Daily report: every day at ${REPORT_AT}.`)
}

if (LISTEN) {
  let offset
  const loop = async () => {
    try {
      offset = await pollUpdates(TOKEN, offset, {
        async onMessage(message) {
          try {
            if ((await bot.onMessage(message)) === 'stranger') noteStranger(message.from, message.chat)
          } catch (failure) {
            console.error('Bot command failed:', failure)
            sendMessage(TOKEN, message.chat.id, 'Something went wrong. Try again, or /help.').catch(() => {})
          }
        },
        async onCallback(query) {
          try {
            await bot.onCallback(query)
          } catch (failure) {
            console.error('Bot button failed:', failure)
          }
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
