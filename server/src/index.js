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
  takenAt,
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
  privateMessage,
  releasedMessage,
  scrubbedMessage,
  welcomeMessage,
} from './message.js'
import { isStaff, nameOf, parseStaff } from './staff.js'
import { createStore, reference, TablesTaken } from './store.js'
import {
  answerCallback,
  editMessage,
  getChat,
  getMe,
  pollUpdates,
  sendMessage,
} from './telegram.js'

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

function readAlerts() {
  try {
    return JSON.parse(readFileSync(ALERTS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function rememberAlerts(ref, messages) {
  const alerts = readAlerts()
  const cutoff = Date.now() - ALERTS_KEPT_MS
  for (const [key, entry] of Object.entries(alerts)) {
    if (!(Date.parse(entry.at) >= cutoff)) delete alerts[key]
  }
  alerts[ref] = { at: new Date().toISOString(), messages }
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
  const known = new Set(sent.map((entry) => `${entry.chatId}:${entry.messageId}`))
  for (const { chatId, messageId } of messages) {
    if (!known.has(`${chatId}:${messageId}`)) sent.push({ chatId, messageId, date })
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
    (entry) => !keep.some((kept) => kept.chatId === entry.chatId && kept.messageId === entry.messageId) &&
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

async function notifyStaff(text, keyboard) {
  const sent = []
  for (const id of STAFF) {
    try {
      const message = await sendMessage(TOKEN, id, text, keyboard)
      sent.push({ chatId: id, messageId: message.message_id })
    } catch (failure) {
      console.error(`Telegram refused the message for ${id}:`, failure.message)
    }
  }
  return sent
}

async function updateAlerts(ref, text, pressed) {
  const targets = [...(readAlerts()[ref]?.messages ?? []), ...(pressed ? [pressed] : [])]
  const seen = new Set()
  for (const { chatId, messageId } of targets) {
    const key = `${chatId}:${messageId}`
    if (seen.has(key)) continue
    seen.add(key)
    await editMessage(TOKEN, chatId, messageId, text).catch(() => {})
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

  if (!slotsForDate(date).includes(time) || isClosed(date)) {
    return { error: 'the restaurant is closed at that time', code: 'closed' }
  }

  const today = toISODate(new Date())
  if (date < today) return { error: 'that date has passed', code: 'closed' }

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

    const holds = await store.holdsOn(date)
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

    const taken = takenAt(time, await store.holdsOn(date))
    const status = Object.fromEntries(
      tables.map((table) => [
        table.id,
        table.disabled ? 'disabled' : taken.has(table.id) ? 'occupied' : 'available',
      ]),
    )
    return send(request, response, 200, status)
  }

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

    if (!booking || !tokenMatches(booking.id, raw.token)) {
      return send(request, response, 404, { error: 'no such booking' })
    }
    if (booking.status === 'cancelled') {
      return send(request, response, 200, { ok: true, alreadyCancelled: true })
    }

    await store.cancel(ref)
    const notice = cancelledMessage(toStaff(booking), 'the guest')
    updateAlerts(ref, notice)
      .then(() => notifyStaff(notice))
      .then((sent) => recordSent(sent, booking.date))
      .catch((failure) => console.error('Could not tell the staff:', failure.message))
    return send(request, response, 200, { ok: true })
  }

  if (request.method === 'POST' && url.pathname === '/bookings') {
    if (overRate(clientIp(request))) {
      return send(request, response, 429, { error: 'too many requests', code: 'rateLimit' })
    }

    let raw
    try {
      raw = JSON.parse(await readBody(request))
    } catch {
      return send(request, response, 400, { error: 'invalid JSON' })
    }

    const { booking, error, code } = readBooking(raw)
    if (error) return send(request, response, 400, { error, code })

    const outcome = await oneAtATime(async () => {
      const held = await store.upcomingForPhone(booking.phone, toISODate(new Date()))
      if (held >= MAX_PER_PHONE) {
        return { status: 429, body: { error: 'too many bookings on that number', code: 'phoneLimit' } }
      }

      const taken = takenAt(booking.time, await store.holdsOn(booking.date))
      if (booking.tableIds.some((id) => taken.has(id))) {
        return { status: 409, body: { error: 'table is no longer available', code: 'unavailable' } }
      }
      const isFree = (id) => !taken.has(id) && !tableById.get(id)?.disabled
      const group = resolveTableGroup(booking.tableIds[0], booking.partySize, isFree)
      if (!group || group.join() !== [...booking.tableIds].join()) {
        return {
          status: 409,
          body: { error: 'those tables cannot be put together', code: 'unavailable' },
        }
      }

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
    notifyStaff(buildMessage(toStaff(record)), [
      [
        { text: '✅ Guests left', callback_data: `free:${record.reference}` },
        { text: '❌ Cancel', callback_data: `cancel:${record.reference}` },
      ],
    ])
      .then((sent) => {
        rememberAlerts(record.reference, sent)
        recordSent(sent, record.date)
      })
      .catch((failure) => console.error('Could not tell the staff:', failure.message))

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

const me = await getMe(TOKEN).catch((failure) => {
  console.error('The bot token was refused:', failure.message)
  process.exit(1)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DAON API on :${PORT} — store: ${store.kind}, bot @${me.username}`)
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

  for (const id of STAFF) {
    getChat(TOKEN, id).catch(() =>
      console.warn(
        `Staff account ${id} has not opened the bot, so it cannot be written to. ` +
          `They need to open https://t.me/${me.username} and press Start.`,
      ),
    )
  }
})

function readDayFirstDate(value) {
  const match = /^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/.exec(String(value ?? '').trim())
  if (!match) return null
  const [, day, month, year] = match
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return ISO_DATE.test(iso) ? iso : null
}

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
  '/free': 'free',
}

async function handleCommand(message) {
  const chatId = message.chat.id
  const [raw, ...rest] = (message.text ?? '').trim().split(/\s+/)
  const command = raw.split('@')[0].toLowerCase()
  const say = (text, keyboard) => sendMessage(TOKEN, chatId, text, keyboard).catch(() => {})
  const sayAbout = (date, text) =>
    sendMessage(TOKEN, chatId, text)
      .then((message) => recordSent([{ chatId, messageId: message.message_id }], date))
      .catch(() => {})

  if (!isStaff(STAFF, message.from, message.chat)) {
    noteStranger(message.from, message.chat)
    if (command === '/start' && message.chat.type === 'private') return say(privateMessage())
    return
  }

  if (command === '/start') return say(welcomeMessage())

  const action = COMMANDS[command]
  if (!action) return

  if (action === 'help') return say(helpMessage(listClosures(toISODate(new Date()))))

  if (action === 'free') {
    const ref = (rest[0] ?? '').toUpperCase()
    if (!ref) return say('Which one? /free DAON-XXXXX')
    const booking = await store.find(ref)
    if (!booking) return say(`No reservation ${ref}.`)
    if (booking.tableIds.length === 0) return say(`${ref} is not holding a table.`)
    const notice = releasedMessage(toStaff(booking), nameOf(message.from))
    await store.release(ref)
    await updateAlerts(ref, notice)
    return sayAbout(booking.date, notice)
  }

  if (action === 'day' || action === 'tomorrow' || action === 'onDate') {
    const day = new Date()
    if (action === 'tomorrow') day.setDate(day.getDate() + 1)
    const date = action === 'onDate' ? readDayFirstDate(rest.join(' ')) : toISODate(day)
    if (!date) return say('Write the date like this: /day 24-12-2026')
    return sayAbout(date, dayList(date, await store.onDate(date)))
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

async function handleFreeButton(query) {
  const chatId = query.message?.chat?.id
  const reference = String(query.data ?? '').split(':')[1] ?? ''

  if (!isStaff(STAFF, query.from, query.message?.chat)) {
    return answerCallback(TOKEN, query.id, 'Not allowed.').catch(() => {})
  }

  const booking = await store.find(reference)
  if (!booking) {
    return answerCallback(TOKEN, query.id, 'That reservation is gone.').catch(() => {})
  }
  if (booking.status === 'cancelled' || booking.tableIds.length === 0) {
    return answerCallback(TOKEN, query.id, 'That table is already free.').catch(() => {})
  }

  const notice = releasedMessage(toStaff(booking), nameOf(query.from))
  await store.release(reference)
  await answerCallback(TOKEN, query.id, 'Table is free again.').catch(() => {})
  await updateAlerts(reference, notice, { chatId, messageId: query.message.message_id })
}

async function handleCancelButton(query) {
  const chatId = query.message?.chat?.id
  const reference = String(query.data ?? '').split(':')[1] ?? ''

  if (!isStaff(STAFF, query.from, query.message?.chat)) {
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

  const notice = cancelledMessage(toStaff(booking), `the restaurant (${nameOf(query.from)})`)
  await updateAlerts(reference, notice, { chatId, messageId: query.message.message_id })
}

if (LISTEN) {
  let offset
  const loop = async () => {
    try {
      offset = await pollUpdates(TOKEN, offset, {
        async onMessage(message) {
          if (!message.chat?.id) return
          if (!(message.text ?? '').trim().startsWith('/')) return
          await handleCommand(message)
        },
        async onCallback(query) {
          const data = String(query.data ?? '')
          if (data.startsWith('cancel:')) await handleCancelButton(query)
          if (data.startsWith('free:')) await handleFreeButton(query)
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
