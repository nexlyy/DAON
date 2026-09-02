/**
 * Prints the bot's name and the chat ids that have written to it — the quick
 * way to find the number for TELEGRAM_CHAT_ID without running the service.
 */
import { loadEnv } from './env.js'
import { getMe } from './telegram.js'

loadEnv()

const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set.')
  process.exit(1)
}

const me = await getMe(token)
console.log(`Bot: @${me.username} (${me.first_name})`)

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
const body = await response.json()

const chats = new Map()
for (const update of body.result ?? []) {
  const chat = update.message?.chat
  if (chat) chats.set(chat.id, chat.title ?? chat.username ?? chat.first_name ?? chat.type)
}

if (chats.size === 0) {
  console.log(`No one has written to the bot yet. Open https://t.me/${me.username} and send /start.`)
} else {
  console.log('Chats that have written to it:')
  for (const [id, who] of chats) console.log(`  ${id}  ${who}`)
}
