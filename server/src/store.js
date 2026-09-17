import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

export class TablesTaken extends Error {
  constructor() {
    super('one of those tables has just been taken')
    this.name = 'TablesTaken'
  }
}

const reference = () => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return `DAON-${id.slice(-5).toUpperCase()}`
}

function supabaseStore(url, key) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  async function call(path, init) {
    const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init?.headers } })
    const text = await response.text()
    const body = text ? JSON.parse(text) : null

    if (!response.ok) {
      if (body?.message?.includes('tables_taken') || body?.code === '23505') throw new TablesTaken()
      throw new Error(body?.message ?? `Supabase said ${response.status}`)
    }
    return body
  }

  async function withTables(rows) {
    if (rows.length === 0) return []
    const ids = rows.map((row) => row.id).join(',')
    const tables = await call(`/reservation_tables?select=reservation_id,table_id&reservation_id=in.(${ids})`)
    return rows.map((row) =>
      fromRow(
        row,
        tables.filter((table) => table.reservation_id === row.id).map((table) => table.table_id),
      ),
    )
  }

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

    async ping() {
      await call('/reservations?select=id&limit=1')
    },

    async holdsOn(date) {
      const rows = await call(
        `/reservation_tables?select=booking_time,table_id,reservation_id&booking_date=eq.${date}`,
      )
      return rows.map((row) => ({
        time: row.booking_time,
        tableId: row.table_id,
        reservationId: row.reservation_id,
      }))
    },

    async release(reference) {
      const found = await find(reference)
      if (!found) return null
      await call(`/reservation_tables?reservation_id=eq.${found.id}`, { method: 'DELETE' })
      return { ...found, tableIds: [] }
    },

    find,

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

    async between(from, to) {
      const rows = await call(
        `/reservations?select=*&status=eq.confirmed&booking_date=gte.${from}&booking_date=lte.${to}` +
          '&order=booking_date,booking_time',
      )
      return withTables(rows)
    },

    async search(query, from) {
      const needle = query.replace(/[^\p{L}\p{N}+\- ]/gu, ' ').replace(/\s+/g, ' ').trim()
      if (!needle) return []
      const digits = needle.replace(/\D/g, '')
      const filters = [
        `guest_name.ilike."*${needle}*"`,
        `reference.ilike."*${needle}*"`,
        ...(digits.length >= 3 ? [`phone.ilike."*${digits.split('').join('*')}*"`] : []),
      ]
      const rows = await call(
        `/reservations?select=*&booking_date=gte.${from}` +
          `&or=${encodeURIComponent(`(${filters.join(',')})`)}` +
          '&order=booking_date,booking_time&limit=30',
      )
      return withTables(rows)
    },

    async move(reference, change) {
      const found = await find(reference)
      if (!found) return null

      await call(`/reservation_tables?reservation_id=eq.${found.id}`, { method: 'DELETE' })
      const rows = (tableIds, date, time) =>
        JSON.stringify(
          tableIds.map((tableId) => ({
            reservation_id: found.id,
            table_id: tableId,
            booking_date: date,
            booking_time: time,
          })),
        )

      try {
        if (change.tableIds.length > 0) {
          await call('/reservation_tables', {
            method: 'POST',
            body: rows(change.tableIds, change.date, change.time),
          })
        }
      } catch (failure) {
        if (found.tableIds.length > 0) {
          await call('/reservation_tables', {
            method: 'POST',
            body: rows(found.tableIds, found.date, found.time),
          }).catch((again) => console.error(`Could not put ${reference} back on its tables:`, again.message))
        }
        throw failure
      }

      await call(`/reservations?id=eq.${found.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          booking_date: change.date,
          booking_time: change.time,
          party_size: change.partySize,
        }),
      })
      return { ...found, ...change }
    },

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

    async ping() {
      read()
    },

    async holdsOn(date) {
      const holds = []
      for (const row of read()) {
        if (row.status === 'cancelled' || row.date !== date) continue
        for (const tableId of row.tableIds) holds.push({ time: row.time, tableId, reservationId: row.id })
      }
      return holds
    },

    async release(reference) {
      const rows = read()
      const found = rows.find((row) => row.reference === reference)
      if (!found) return null
      found.tableIds = []
      found.releasedAt = new Date().toISOString()
      write(rows)
      return found
    },

    async find(reference) {
      return read().find((row) => row.reference === reference) ?? null
    },

    async onDate(date) {
      return read()
        .filter((row) => row.date === date && row.status !== 'cancelled')
        .sort((a, b) => a.time.localeCompare(b.time))
    },

    async between(from, to) {
      return read()
        .filter((row) => row.status === 'confirmed' && row.date >= from && row.date <= to)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    },

    async search(query, from) {
      const needle = query.toLowerCase().trim()
      const digits = needle.replace(/\D/g, '')
      if (!needle) return []
      return read()
        .filter((row) => row.date >= from)
        .filter(
          (row) =>
            row.name.toLowerCase().includes(needle) ||
            row.reference.toLowerCase().includes(needle) ||
            (digits.length >= 3 && row.phone.replace(/\D/g, '').includes(digits)),
        )
        .slice(0, 30)
    },

    async move(reference, change) {
      const rows = read()
      const found = rows.find((row) => row.reference === reference)
      if (!found) return null
      const clash = rows.some(
        (row) =>
          row !== found &&
          row.status !== 'cancelled' &&
          row.date === change.date &&
          row.time === change.time &&
          row.tableIds.some((id) => change.tableIds.includes(id)),
      )
      if (clash) throw new TablesTaken()
      Object.assign(found, change)
      write(rows)
      return found
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
