/**
 * The waiting list: guests who wanted a time that was already full.
 *
 * It is not a booking and does not hold a table. A guest leaves a name, a
 * number, the time they wanted and how many they are; the staff get a card in
 * Telegram, and if a table frees up somebody calls. That is all the site
 * promises, and all this keeps.
 *
 * The name and the number are the same kind of thing a booking holds, kept for
 * less time: the entry goes the day after the day it was for.
 */
import { randomBytes } from 'node:crypto'
import { chmodSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { parseISODate, rules, slotsForDate, toISODate } from './availability.js'
import { isClosed } from './closures.js'
import { root } from './env.js'
import { escapeHtml, formatDay, formatTime } from './message.js'

const FILE = resolve(root, 'data', 'waitlist.json')
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/

// One guest can wait for a few evenings, not fill the list.
export const PER_PHONE = 3
export const MAX_PARTY = 40

const NL = '\n'

const text = (value, limit) =>
  value === undefined || value === null ? '' : String(value).replace(/\s+/g, ' ').trim().slice(0, limit)

const digitsOf = (phone) => phone.replace(/\D/g, '')

/** Checks what the form sent and gives back an entry, or the reason it cannot be one. */
export function readWaiting(raw, today = toISODate(new Date())) {
  if (!raw || typeof raw !== 'object') return { error: 'body must be an object' }

  const date = text(raw.date, 10)
  if (!ISO_DATE.test(date)) return { error: 'date must be YYYY-MM-DD', code: 'date' }
  if (date < today) return { error: 'that day has passed', code: 'date' }
  const last = new Date(parseISODate(today))
  last.setDate(last.getDate() + Number(rules.maxDaysAhead ?? 60))
  if (date > toISODate(last)) return { error: 'that day is too far ahead', code: 'date' }

  const slots = slotsForDate(date)
  if (slots.length === 0 || isClosed(date)) return { error: 'the restaurant is closed then', code: 'closed' }

  const time = text(raw.time, 5)
  if (!TIME.test(time) || !slots.includes(time)) return { error: 'that is not a time we seat', code: 'time' }

  const partySize = Number(raw.partySize)
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_PARTY) {
    return { error: 'party size is out of range', code: 'guests' }
  }

  const name = text(raw.name, 80)
  const phone = text(raw.phone, 40)
  if (!name) return { error: 'name is required', code: 'name' }
  if (digitsOf(phone).length < 7) return { error: 'phone is required', code: 'phone' }

  return {
    entry: {
      date,
      time,
      partySize,
      name,
      phone,
      notes: text(raw.notes, 300),
      locale: text(raw.locale, 5),
    },
  }
}

const readAll = () => {
  try {
    const rows = JSON.parse(readFileSync(FILE, 'utf8'))
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

const writeAll = (rows) => {
  const temporary = `${FILE}.writing`
  writeFileSync(temporary, JSON.stringify(rows, null, 2) + NL, { mode: 0o600 })
  renameSync(temporary, FILE)
  chmodSync(FILE, 0o600)
}

const STATUS = {
  waiting: '⏳ Waiting for a table',
  seated: '✅ Found a table',
  dropped: '✖ Taken off the list',
}

/** The card the staff get, and see again whenever somebody presses one of its buttons. */
export function waitingMessage(entry, { by } = {}) {
  return [
    `<b>${STATUS[entry.status] ?? STATUS.waiting}</b> · <code>${escapeHtml(entry.id)}</code>`,
    ...(by ? [`Marked by ${escapeHtml(by)}`] : []),
    '',
    `Date: <b>${escapeHtml(formatDay(entry.date))}</b>`,
    `Around: <b>${escapeHtml(formatTime(entry.time))}</b>`,
    `Guests: <b>${escapeHtml(entry.partySize)}</b>`,
    `Name: ${escapeHtml(entry.name)}`,
    `Phone: ${escapeHtml(entry.phone)}`,
    ...(entry.notes ? [`Notes: ${escapeHtml(entry.notes)}`] : []),
    '',
    entry.status === 'waiting'
      ? '<i>Not a booking. Call if a table frees up, then book it with /book.</i>'
      : '',
  ]
    .join(NL)
    .trim()
}

// Rows of buttons, the way sendMessage and editMessage take them. An empty set
// takes the buttons off the card once somebody has pressed one.
export const waitingKeyboard = (entry) =>
  entry.status === 'waiting'
    ? [
        [
          { text: '✅ Found a table', callback_data: `wl:${entry.id}:seated` },
          { text: '✖ Take off the list', callback_data: `wl:${entry.id}:dropped` },
        ],
      ]
    : []

export function waitingList(entries) {
  if (entries.length === 0) return 'Nobody is waiting for a table.'
  const byDay = new Map()
  for (const entry of entries) {
    byDay.set(entry.date, [...(byDay.get(entry.date) ?? []), entry])
  }
  const lines = ['<b>Waiting for a table</b>']
  for (const [date, rows] of byDay) {
    lines.push('', `<b>${escapeHtml(formatDay(date))}</b>`)
    for (const entry of rows.sort((a, b) => a.time.localeCompare(b.time))) {
      lines.push(
        `${escapeHtml(entry.time)} · ${escapeHtml(entry.partySize)} · ${escapeHtml(entry.name)} · ${escapeHtml(entry.phone)}` +
          (entry.notes ? ` · <i>${escapeHtml(entry.notes)}</i>` : ''),
      )
    }
  }
  return lines.join(NL)
}

export function createWaitlist() {
  return {
    /** Adds an entry, unless this number is already waiting for enough evenings. */
    add(entry) {
      const rows = readAll()
      const digits = digitsOf(entry.phone)
      const today = toISODate(new Date())
      const already = rows.filter(
        (row) => row.status === 'waiting' && row.date >= today && digitsOf(row.phone) === digits,
      )
      if (already.length >= PER_PHONE) return { error: 'too many on that number', code: 'phoneLimit' }

      const stored = {
        id: `WL-${randomBytes(3).toString('hex').toUpperCase()}`,
        ...entry,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      }
      writeAll([...rows, stored])
      return { entry: stored }
    },

    /** The ones still waiting, from today on, earliest first. */
    active(today = toISODate(new Date())) {
      return readAll()
        .filter((row) => row.status === 'waiting' && row.date >= today)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    },

    find: (id) => readAll().find((row) => row.id === id) ?? null,

    /** Marks an entry as seated or taken off; the first press wins. */
    set(id, status, by) {
      const rows = readAll()
      const row = rows.find((one) => one.id === id)
      if (!row) return null
      if (row.status !== 'waiting') return { entry: row, already: true }
      row.status = status
      row.by = by
      row.closedAt = new Date().toISOString()
      writeAll(rows)
      return { entry: row }
    },

    /**
     * Forgets every entry whose day has passed, and hands them back so the
     * cards the staff got can be deleted as well — the privacy policy promises
     * both, the day after the date the guest chose.
     */
    tidy(today = toISODate(new Date())) {
      const rows = readAll()
      const kept = rows.filter((row) => row.date >= today)
      if (kept.length !== rows.length) writeAll(kept)
      return rows.filter((row) => row.date < today)
    },
  }
}
