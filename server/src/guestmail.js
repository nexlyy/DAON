import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { restaurant, toISODate } from './availability.js'
import { cancelToken } from './cancel.js'
import { addDays } from './dates.js'
import { bookingEmail } from './emails.js'
import { root } from './env.js'

const FILE = resolve(root, 'data', 'contacts.json')
const REMIND_FROM_HOUR = 10
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/

export const readEmail = (value) => {
  const email = String(value ?? '').trim().slice(0, 120)
  return EMAIL.test(email) ? email : ''
}

function read() {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return {}
  }
}

function write(contacts) {
  mkdirSync(resolve(root, 'data'), { recursive: true })
  writeFileSync(FILE, JSON.stringify(contacts, null, 2))
}

export function createGuestMail({ mailer, store }) {
  async function deliver(kind, booking, contact) {
    if (!mailer.enabled || !contact?.email) return false
    const message = bookingEmail(kind, {
      restaurant,
      booking,
      locale: contact.locale,
      name: booking.name,
      token: booking.id ? cancelToken(booking.id) : null,
    })
    try {
      await mailer.send({ to: contact.email, ...message })
      return true
    } catch (failure) {
      console.error(`Could not email ${booking.reference} (${kind}):`, failure.message)
      return false
    }
  }

  return {
    get enabled() {
      return mailer.enabled
    },

    async booked(booking, email, locale) {
      if (!mailer.enabled || !email) return
      const contacts = read()
      contacts[booking.reference] = {
        email,
        locale,
        date: booking.date,
        createdAt: new Date().toISOString(),
      }
      write(contacts)
      await deliver('confirmed', booking, contacts[booking.reference])
    },

    async moved(after) {
      const contacts = read()
      const contact = contacts[after.reference]
      if (!contact) return
      contact.date = after.date
      delete contact.remindedAt
      write(contacts)
      await deliver('changed', after, contact)
    },

    async cancelled(booking) {
      const contacts = read()
      const contact = contacts[booking.reference]
      if (!contact) return
      delete contacts[booking.reference]
      write(contacts)
      await deliver('cancelled', booking, contact)
    },

    async tick(now = new Date()) {
      const contacts = read()
      const today = toISODate(now)
      const tomorrow = addDays(today, 1)
      let changed = false

      for (const [reference, contact] of Object.entries(contacts)) {
        if (contact.date < today) {
          delete contacts[reference]
          changed = true
          continue
        }
        const bookedLongAgo = now - Date.parse(contact.createdAt) > 20 * 60 * 60 * 1000
        if (contact.date !== tomorrow || contact.remindedAt || !bookedLongAgo) continue
        if (now.getHours() < REMIND_FROM_HOUR) continue

        const booking = await store.find(reference).catch(() => null)
        if (!booking || booking.status !== 'confirmed' || booking.date !== tomorrow) continue
        contact.remindedAt = new Date().toISOString()
        changed = true
        write(contacts)
        await deliver('reminder', booking, contact)
      }

      if (changed) write(contacts)
    },
  }
}
