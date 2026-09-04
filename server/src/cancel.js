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
