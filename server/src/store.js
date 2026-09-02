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
        if (row.date === date && row.time === time) row.tableIds.forEach((id) => taken.add(id))
      }
      return taken
    },

    async bookedOn(date) {
      const byTime = new Map()
      for (const row of read()) {
        if (row.date !== date) continue
        if (!byTime.has(row.time)) byTime.set(row.time, new Set())
        row.tableIds.forEach((id) => byTime.get(row.time).add(id))
      }
      return byTime
    },

    async create(booking) {
      const rows = read()
      const clash = rows.some(
        (row) =>
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
