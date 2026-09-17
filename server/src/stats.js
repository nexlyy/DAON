import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { toISODate } from './availability.js'
import { addDays } from './dates.js'
import { root } from './env.js'

const DIR = resolve(root, 'data', 'stats')
const KEEP_DAYS = 400
const PAGES = new Set(['/', '/menu', '/reservation', '/privacy', '/about', '/contact', '/drinks'])
const EVENTS = new Set(['view', 'delivery', 'pickup', 'call', 'directions', 'instagram', 'book_start'])
const LOCALES = new Set(['pl', 'en', 'ko'])
const ROBOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|monitor|curl|wget|python|node-fetch/i
const OWN_HOSTS = /(^|\.)daon\.pl$|^localhost$|^127\./

const blank = () => ({ visitors: 0, views: {}, events: {}, locales: {}, referrers: {}, booked: {} })

const bump = (table, key, by = 1) => {
  table[key] = (table[key] ?? 0) + by
}

export function createStats() {
  mkdirSync(DIR, { recursive: true })
  let day = toISODate(new Date())
  let salt = randomBytes(32)
  let seen = new Map()
  let counts = load(day)
  let dirty = false

  function load(date) {
    try {
      return { ...blank(), ...JSON.parse(readFileSync(resolve(DIR, `${date}.json`), 'utf8')) }
    } catch {
      return blank()
    }
  }

  function flush() {
    if (!dirty) return
    writeFileSync(resolve(DIR, `${day}.json`), JSON.stringify(counts))
    dirty = false
  }

  function roll() {
    const today = toISODate(new Date())
    if (today === day) return
    flush()
    day = today
    salt = randomBytes(32)
    seen = new Map()
    counts = load(day)
    prune()
  }

  function prune() {
    const cutoff = toISODate(new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000))
    for (const file of readdirSync(DIR)) {
      if (/^\d{4}-\d{2}-\d{2}\.json$/.test(file) && file.slice(0, 10) < cutoff) rmSync(resolve(DIR, file))
    }
  }

  setInterval(() => {
    roll()
    flush()
  }, 60_000).unref()

  return {
    hit({ ip, userAgent, event, page, locale, referrer }) {
      if (!EVENTS.has(event) || ROBOTS.test(userAgent ?? '')) return
      roll()

      const visitor = createHash('sha256').update(salt).update(String(ip)).update(String(userAgent)).digest('base64url')
      const hits = seen.get(visitor) ?? 0
      if (hits >= 300) return
      if (hits === 0) {
        if (seen.size > 50_000) seen.clear()
        counts.visitors += 1
      }
      seen.set(visitor, hits + 1)

      if (event === 'view') {
        const cleaned = PAGES.has(page) ? page : page?.startsWith('/drinks') ? '/drinks' : null
        if (cleaned) bump(counts.views, cleaned)
        if (LOCALES.has(locale)) bump(counts.locales, locale)
        const host = String(referrer ?? '').toLowerCase().replace(/^www\./, '').slice(0, 60)
        if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) && !OWN_HOSTS.test(host)) {
          if (counts.referrers[host] !== undefined || Object.keys(counts.referrers).length < 60) {
            bump(counts.referrers, host)
          }
        }
      } else {
        bump(counts.events, event)
      }
      dirty = true
    },

    booked(source) {
      roll()
      bump(counts.booked, source)
      dirty = true
    },

    days(count) {
      roll()
      flush()
      const result = []
      for (let back = count - 1; back >= 0; back--) {
        const date = addDays(day, -back)
        result.push({ date, ...(date === day ? counts : load(date)) })
      }
      return result
    },

    flush,
  }
}
