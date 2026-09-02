/**
 * Cancelling a booking.
 *
 * The guest gets a link rather than an account, so the link has to prove itself:
 * the token is an HMAC of the booking's id under a server-side secret. Nothing
 * is stored for it, and a guessed reference gets you nowhere without the key.
 *
 * Cancelling marks the reservation and then frees its tables. That order
 * matters — if the second step fails, a table stays blocked and the staff can
 * see it, which is the safe way round. The other order could hand the same
 * table to two parties.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const secret = () =>
  process.env.CANCEL_SECRET?.trim() ||
  process.env.SUPABASE_SERVICE_KEY?.trim() ||
  process.env.TELEGRAM_BOT_TOKEN?.trim() ||
  'daon'

export const cancelToken = (id) =>
  createHmac('sha256', secret()).update(String(id)).digest('base64url').slice(0, 22)

export function tokenMatches(id, token) {
  const expected = Buffer.from(cancelToken(id))
  const given = Buffer.from(String(token ?? ''))
  return expected.length === given.length && timingSafeEqual(expected, given)
}
