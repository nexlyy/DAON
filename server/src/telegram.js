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

export const sendMessage = (token, chatId, text, keyboard) =>
  call(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  })

export const editMessage = (token, chatId, messageId, text) =>
  call(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })

export const answerCallback = (token, id, text) =>
  call(token, 'answerCallbackQuery', { callback_query_id: id, text, show_alert: false })

export async function pollUpdates(token, offset, handlers, timeout = 50) {
  const updates = await call(token, 'getUpdates', {
    offset,
    timeout,
    allowed_updates: ['message', 'callback_query'],
  })

  let next = offset
  for (const update of updates) {
    next = update.update_id + 1
    if (update.message) await handlers.onMessage?.(update.message)
    if (update.callback_query) await handlers.onCallback?.(update.callback_query)
  }
  return next
}

export { TelegramError }
