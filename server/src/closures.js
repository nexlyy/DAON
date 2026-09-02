/**
 * Days the restaurant shuts on top of its usual week — a holiday, a private
 * party, a kitchen repair.
 *
 * These are settings rather than data: a short list the staff edit from
 * Telegram, kept in a file next to the service. Putting them in the database
 * would mean a migration every time the shape changed, and there is nothing
 * here worth a table.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const FILE = resolve(root, 'data', 'closures.json')

const read = () => {
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const write = (rows) => {
  mkdirSync(resolve(root, 'data'), { recursive: true })
  writeFileSync(FILE, `${JSON.stringify(rows, null, 2)}\n`)
}

/** Every closed date, past ones dropped so the list stays short. */
export function listClosures(today) {
  return read()
    .filter((row) => row.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const isClosed = (date) => read().some((row) => row.date === date)

/** Returns false when the date was already on the list. */
export function addClosure(date, note = '') {
  const rows = read()
  if (rows.some((row) => row.date === date)) return false
  rows.push({ date, note, addedAt: new Date().toISOString() })
  write(rows)
  return true
}

/** Returns false when the date was not on the list. */
export function removeClosure(date) {
  const rows = read()
  const left = rows.filter((row) => row.date !== date)
  if (left.length === rows.length) return false
  write(left)
  return true
}
