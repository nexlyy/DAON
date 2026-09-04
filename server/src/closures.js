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

export function listClosures(today) {
  return read()
    .filter((row) => row.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const isClosed = (date) => read().some((row) => row.date === date)

export function addClosure(date, note = '') {
  const rows = read()
  if (rows.some((row) => row.date === date)) return false
  rows.push({ date, note, addedAt: new Date().toISOString() })
  write(rows)
  return true
}

export function removeClosure(date) {
  const rows = read()
  const left = rows.filter((row) => row.date !== date)
  if (left.length === rows.length) return false
  write(left)
  return true
}
