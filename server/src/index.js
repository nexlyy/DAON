/**
 * DAON reservation notifier.
 *
 * The site is a static build, so it cannot hold a bot token. This service does:
 * it takes one POST per confirmed reservation and forwards it to the
 * restaurant's Telegram chat, in Polish, in the shape the staff asked for.
 *
 *   POST /bookings/notify   the booking, as JSON
 *   GET  /health            liveness, and whether a chat is configured
 *
 * It also answers /start in Telegram with the chat id, which is how the
 * restaurant tells the service where to send.
 */
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadEnv, root } from './env.js'
import { buildMessage } from './message.js'
import { getMe, pollUpdates, sendMessage } from './telegram.js'

loadEnv()

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()
const PORT = Number(process.env.PORT ?? 8787)
const ORIGIN = process.env.ALLOWED_ORIGIN?.trim() || '*'
const SHARED_SECRET = process.env.NOTIFY_SECRET?.trim() || ''
const LISTEN = process.env.TELEGRAM_LISTEN !== '0'

const STORE = resolve(root, 'data')
const CHAT_FILE = resolve(STORE, 'chat.json')
const LOG_FILE = resolve(STORE, 'bookings.log')

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

mkdirSync(STORE, { recursive: true })

/** The chat to notify: the environment wins, otherwise whoever sent /start. */
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

// One restaurant's worth of traffic. The endpoint is public by nature — a
// static site cannot keep a secret — so it is capped rather than trusted.
const RATE = { windowMs: 60 * 60 * 1000, max: 30 }
const hits = new Map()

function overRate(ip) {
  const now = Date.now()
  const seen = (hits.get(ip) ?? []).filter((at) => now - at < RATE.windowMs)
  seen.push(now)
  hits.set(ip, seen)
  return seen.length > RATE.max
}

/* ---------------------------------------------------------------- payloads */

const MAX_BODY = 8 * 1024

const text = (value, limit) => {
  if (value === undefined || value === null) return ''
  return String(value).replace(/\s+/g, ' ').trim().slice(0, limit)
}

/** Keeps the message honest: anything unexpected is rejected, not forwarded. */
function readBooking(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'body must be an object' }

  const date = text(raw.date, 10)
  const time = text(raw.time, 5)
  const name = text(raw.name, 80)
  const phone = text(raw.phone, 40)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'date must be YYYY-MM-DD' }
  if (!/^\d{1,2}:\d{2}$/.test(time)) return { error: 'time must be HH:mm' }
  if (!name) return { error: 'name is required' }
  if (!phone) return { error: 'phone is required' }

  const partySize = Number(raw.partySize)
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 60) {
    return { error: 'partySize is out of range' }
  }

  return {
    booking: {
      reference: text(raw.reference, 24),
      date,
      time,
      partySize,
      tables: text(raw.tables, 60),
      zone: text(raw.zone, 40),
      name,
      phone,
      notes: text(raw.notes, 400),
    },
  }
}

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

/* ------------------------------------------------------------------ server */

function send(response, status, body) {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-Daon-Secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Length': Buffer.byteLength(payload),
  })
  response.end(payload)
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method === 'OPTIONS') return send(response, 204, {})

  if (request.method === 'GET' && url.pathname === '/health') {
    return send(response, 200, { ok: true, chat: Boolean(readChatId()) })
  }

  if (request.method !== 'POST' || url.pathname !== '/bookings/notify') {
    return send(response, 404, { ok: false, error: 'not found' })
  }

  const ip = request.socket.remoteAddress ?? 'unknown'
  if (overRate(ip)) return send(response, 429, { ok: false, error: 'too many requests' })

  if (SHARED_SECRET && request.headers['x-daon-secret'] !== SHARED_SECRET) {
    return send(response, 401, { ok: false, error: 'unauthorised' })
  }

  let raw
  try {
    raw = JSON.parse(await readBody(request))
  } catch {
    return send(response, 400, { ok: false, error: 'invalid JSON' })
  }

  const { booking, error } = readBooking(raw)
  if (error) return send(response, 400, { ok: false, error })

  const chatId = readChatId()
  if (!chatId) {
    console.warn('A booking arrived but no chat is configured — send /start to the bot.')
    return send(response, 503, { ok: false, error: 'no chat configured' })
  }

  try {
    await sendMessage(TOKEN, chatId, buildMessage(booking))
  } catch (failure) {
    console.error('Telegram refused the message:', failure.message)
    return send(response, 502, { ok: false, error: 'telegram rejected the message' })
  }

  // A line per booking, so a message lost in Telegram is still recoverable.
  try {
    writeFileSync(
      LOG_FILE,
      `${JSON.stringify({ at: new Date().toISOString(), ...booking })}\n`,
      { flag: 'a' },
    )
  } catch (failure) {
    console.warn('Could not append to the booking log:', failure.message)
  }

  return send(response, 200, { ok: true })
})

/* ------------------------------------------------------------------- start */

const me = await getMe(TOKEN).catch((failure) => {
  console.error('The bot token was refused:', failure.message)
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`DAON notifier on :${PORT}, bot @${me.username}`)
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
