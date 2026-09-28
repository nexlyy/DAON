/**
 * Dishes a guest picks after booking, so the restaurant knows what is coming.
 *
 * It is not a payment and not a promise that anything will be ready on the
 * minute: the staff see the list next to the booking, and the guest pays at
 * the table as usual. The prices are read from the live menu here, never taken
 * from the browser, and the names are kept as they stood when the guest chose,
 * so a dish renamed later still reads the same on the staff card.
 *
 * Kept only until the visit: the day after the booking date the entry goes.
 */
import { chmodSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const FILE = resolve(root, 'data', 'preorders.json')
const NL = '\n'

export const LIMITS = { lines: 40, perDish: 20, total: 100, notes: 300 }

// How long before the booking the website stops taking changes. After that
// it is a phone call, because the kitchen may already have started.
export const CLOSES_BEFORE = Math.max(0, Number(process.env.PREORDER_CLOSES_MINUTES ?? 60) || 0)

export const enabled = () => process.env.PREORDER !== 'off'

const startsAt = (booking) => {
  const [hours, minutes] = String(booking.time).split(':').map(Number)
  const [year, month, day] = String(booking.date).split('-').map(Number)
  return new Date(year, month - 1, day, hours, minutes).getTime()
}

/** Whether the guest can still pick or change dishes online. */
export const stillOpen = (booking, now = Date.now()) =>
  booking.status === 'confirmed' && now < startsAt(booking) - CLOSES_BEFORE * 60 * 1000

/**
 * Turns what the browser sent into lines the kitchen can read, in the order
 * the dishes stand on the menu. An empty list is allowed: it means the guest
 * took the whole pre-order back.
 */
export function readItems(raw, dishes) {
  if (!Array.isArray(raw)) return { error: 'items must be a list', code: 'items' }
  if (raw.length > LIMITS.lines) return { error: 'too many different dishes', code: 'items' }

  const onMenu = dishes.filter((dish) => !dish.hidden)
  const byId = new Map(onMenu.map((dish) => [dish.id, dish]))
  const counts = new Map()

  for (const item of raw) {
    const id = typeof item?.id === 'string' ? item.id : ''
    const quantity = Number(item?.quantity)
    if (!byId.has(id)) return { error: `${id || 'a dish'} is not on the menu`, code: 'menu' }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.perDish) {
      return { error: 'quantity is out of range', code: 'items' }
    }
    counts.set(id, (counts.get(id) ?? 0) + quantity)
  }

  let total = 0
  for (const quantity of counts.values()) {
    if (quantity > LIMITS.perDish) return { error: 'quantity is out of range', code: 'items' }
    total += quantity
  }
  if (total > LIMITS.total) return { error: 'too many dishes', code: 'items' }

  const lines = onMenu
    .filter((dish) => counts.has(dish.id))
    .map((dish) => ({
      id: dish.id,
      number: dish.number,
      name: { en: dish.name.en, pl: dish.name.pl ?? dish.name.en, ko: dish.name.ko ?? dish.name.en },
      price: dish.price,
      quantity: counts.get(dish.id),
    }))
  return { lines }
}

export const totalOf = (lines) =>
  Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100

/** What the guest's browser gets back: enough to show and to edit. */
export const publicPreorder = (entry) =>
  entry
    ? {
        lines: entry.lines.map(({ id, number, name, price, quantity }) => ({ id, number, name, price, quantity })),
        notes: entry.notes,
        total: totalOf(entry.lines),
        updatedAt: entry.updatedAt,
      }
    : null

const readAll = () => {
  try {
    const rows = JSON.parse(readFileSync(FILE, 'utf8'))
    return rows && typeof rows === 'object' && !Array.isArray(rows) ? rows : {}
  } catch {
    return {}
  }
}

const writeAll = (rows) => {
  const temporary = `${FILE}.writing`
  writeFileSync(temporary, JSON.stringify(rows, null, 2) + NL, { mode: 0o600 })
  renameSync(temporary, FILE)
  chmodSync(FILE, 0o600)
}

/** The pre-order for one booking, or null. Read on every call: the file is small. */
export const preorderFor = (reference) => (reference ? readAll()[reference] ?? null : null)

export function createPreorders() {
  return {
    get: preorderFor,

    put(reference, { date, lines, notes, locale }) {
      const rows = readAll()
      const now = new Date().toISOString()
      rows[reference] = {
        reference,
        date,
        lines,
        notes,
        locale,
        createdAt: rows[reference]?.createdAt ?? now,
        updatedAt: now,
      }
      writeAll(rows)
      return rows[reference]
    },

    /** Takes the pre-order away and hands back what it was, so its cards can say so. */
    remove(reference) {
      const rows = readAll()
      const gone = rows[reference] ?? null
      if (gone) {
        delete rows[reference]
        writeAll(rows)
      }
      return gone
    },

    /** A booking moved to another day takes its dishes along. */
    moved(reference, date) {
      const rows = readAll()
      if (!rows[reference] || rows[reference].date === date) return
      rows[reference] = { ...rows[reference], date }
      writeAll(rows)
    },

    /**
     * Forgets every pre-order whose day has passed. The booking is asked
     * first, in case it was moved to a later day without this file hearing of
     * it; if the database does not answer, the entry waits for the next round.
     */
    async tidy(today, findBooking) {
      const rows = readAll()
      const gone = []
      let changed = false
      for (const [reference, entry] of Object.entries(rows)) {
        if (entry.date >= today) continue
        let booking
        try {
          booking = await findBooking(reference)
        } catch {
          continue
        }
        if (booking && booking.status === 'confirmed' && booking.date >= today) {
          rows[reference] = { ...entry, date: booking.date }
        } else {
          gone.push(entry)
          delete rows[reference]
        }
        changed = true
      }
      if (changed) writeAll(rows)
      return gone
    },
  }
}
