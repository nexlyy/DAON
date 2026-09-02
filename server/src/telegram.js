const API = 'https://api.telegram.org'

class TelegramError extends Error {}

async function call(token, method, payload) {
  const response = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })

  const body = await response.json().catch(() => ({}))
  if (!body.ok) {
    throw new TelegramError(body.description ?? `${method} failed with ${response.status}`)
  }
  return body.result
}

export const getMe = (token) => call(token, 'getMe')

export const sendMessage = (token, chatId, text) =>
  call(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })

/**
 * Long polling, only so the restaurant can find its own chat id: whoever sends
 * /start gets the number back, and the first one to do so is remembered when
 * no chat is configured yet.
 */
export async function pollUpdates(token, offset, onMessage, timeout = 50) {
  const updates = await call(token, 'getUpdates', {
    offset,
    timeout,
    allowed_updates: ['message'],
  })

  let next = offset
  for (const update of updates) {
    next = update.update_id + 1
    if (update.message) await onMessage(update.message)
  }
  return next
}

export { TelegramError }
