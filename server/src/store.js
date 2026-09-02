/**
 * Where reservations live.
 *
 * Supabase when it is configured, a JSON file next door when it is not — the
 * service runs either way, so a fresh checkout works before anyone has set up a
 * database. Both stores answer the same three questions: what is booked for a
 * given service, whether a set of tables is still free, and take this booking.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

export class TablesTaken extends Error {
  constructor() {
    super('one of those tables has just been taken')
    this.name = 'TablesTaken'
  }
}

/* ------------------------------------------------------------------ shared */

const reference = () => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return `DAON-${id.slice(-5).toUpperCase()}`
}

/* ---------------------------------------------------------------- supabase */

function supabaseStore(url, key) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  async function call(path, init) {
    const response = await fetch(`${base}${path}`, { ...init, headers })
    const text = await response.text()
    const body = text ? JSON.parse(text) : null

    if (!response.ok) {
      // The stored procedure raises this when a table went in the meantime.
      if (body?.message?.includes('tables_taken')) throw new TablesTaken()
      throw new Error(body?.message ?? `Supabase said ${response.status}`)
    }
    return body
  }

  /** One booking, by the code the guest was given. */
  async function find(reference) {
    const [row] = await call(
      `/reservations?select=*&reference=eq.${encodeURIComponent(reference)}&limit=1`,
    )
    if (!row) return null
    const tables = await call(`/reservation_tables?select=table_id&reservation_id=eq.${row.id}`)
    return fromRow(
      row,
      tables.map((table) => table.table_id),
    )
  }

  return {
    kind: 'supabase',

    async takenTables(date, time) {
      const rows = await call(
        `/reservation_tables?select=table_id&booking_date=eq.${date}&booking_time=eq.${time}`,
      )
      return new Set(rows.map((row) => row.table_id))
    },

    async bookedOn(date) {
      const rows = await call(
        `/reservation_tables?select=booking_time,table_id&booking_date=eq.${date}`,
      )
      const byTime = new Map()
      for (const row of rows) {
        if (!byTime.has(row.booking_time)) byTime.set(row.booking_time, new Set())
        byTime.get(row.booking_time).add(row.table_id)
      }
      return byTime
    },

    find,

    /** Everything booked on a date, for the staff's own list. */
    async onDate(date) {
      const rows = await call(
        `/reservations?select=*&booking_date=eq.${date}&status=eq.confirmed&order=booking_time`,
      )
      if (rows.length === 0) return []
      const tables = await call(
        `/reservation_tables?select=reservation_id,table_id&booking_date=eq.${date}`,
      )
      return rows.map((row) =>
        fromRow(
          row,
          tables.filter((t) => t.reservation_id === row.id).map((t) => t.table_id),
        ),
      )
    },

    /** Bookings still to come on this phone number — the spam ceiling. */
    async upcomingForPhone(phone, fromDate) {
      const rows = await call(
        `/reservations?select=reference&phone=eq.${encodeURIComponent(phone)}` +
          `&booking_date=gte.${fromDate}&status=eq.confirmed`,
      )
      return rows.length
    },

    async cancel(reference) {
      const found = await find(reference)
      if (!found || found.status === 'cancelled') return found

      await call(`/reservations?reference=eq.${encodeURIComponent(reference)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      })
      // Freeing the tables is what lets someone else book them, and it is the
      // step that must not be skipped; a stuck row would block a table.
      await call(`/reservation_tables?reservation_id=eq.${found.id}`, { method: 'DELETE' })
      return { ...found, status: 'cancelled' }
    },

    async create(booking) {
      const [row] = await call('/rpc/create_reservation', {
        method: 'POST',
        body: JSON.stringify({
          p_reference: booking.reference,
          p_date: booking.date,
          p_time: booking.time,
          p_party_size: booking.partySize,
          p_table_ids: booking.tableIds,
          p_name: booking.name,
          p_phone: booking.phone,
          p_notes: booking.notes ?? '',
          p_locale: booking.locale ?? '',
        }),
      })
      return row ?? booking
    },
  }
}

/** The database's column names, back in the shape the site speaks. */
function fromRow(row, tableIds) {
  return {
    id: row.id,
    reference: row.reference,
    date: row.booking_date,
    time: row.booking_time,
    partySize: row.party_size,
    tableIds,
    name: row.guest_name,
    phone: row.phone,
    notes: row.notes ?? '',
    locale: row.locale ?? '',
    status: row.status,
    createdAt: row.created_at,
  }
}

/* -------------------------------------------------------------------- file */

function fileStore() {
  const dir = resolve(root, 'data')
  const file = resolve(dir, 'bookings.json')
  mkdirSync(dir, { recursive: true })

  const read = () => {
    try {
      return JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      return []
    }
  }

  const write = (rows) => writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`)

  return {
    kind: 'file',

    async takenTables(date, time) {
      const taken = new Set()
      for (const row of read()) {
        if (row.status === 'cancelled') continue
        if (row.date === date && row.time === time) row.tableIds.forEach((id) => taken.add(id))
      }
      return taken
    },

    async bookedOn(date) {
      const byTime = new Map()
      for (const row of read()) {
        if (row.status === 'cancelled' || row.date !== date) continue
        if (!byTime.has(row.time)) byTime.set(row.time, new Set())
        row.tableIds.forEach((id) => byTime.get(row.time).add(id))
      }
      return byTime
    },

    async find(reference) {
      return read().find((row) => row.reference === reference) ?? null
    },

    async onDate(date) {
      return read()
        .filter((row) => row.date === date && row.status !== 'cancelled')
        .sort((a, b) => a.time.localeCompare(b.time))
    },

    async upcomingForPhone(phone, fromDate) {
      return read().filter(
        (row) => row.phone === phone && row.date >= fromDate && row.status === 'confirmed',
      ).length
    },

    async cancel(reference) {
      const rows = read()
      const found = rows.find((row) => row.reference === reference)
      if (!found || found.status === 'cancelled') return found ?? null
      found.status = 'cancelled'
      write(rows)
      return found
    },

    async create(booking) {
      const rows = read()
      const clash = rows.some(
        (row) =>
          row.status !== 'cancelled' &&
          row.date === booking.date &&
          row.time === booking.time &&
          row.tableIds.some((id) => booking.tableIds.includes(id)),
      )
      if (clash) throw new TablesTaken()

      rows.push(booking)
      write(rows)
      return booking
    },
  }
}

export function createStore() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_KEY?.trim()
  return url && key ? supabaseStore(url, key) : fileStore()
}

export { reference }
