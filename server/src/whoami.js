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

if (!body.ok) {
  console.error(`Telegram said: ${body.description}. Stop the service first — it is reading the same updates.`)
  process.exit(1)
}

const people = new Map()
for (const update of body.result ?? []) {
  const from = update.message?.from ?? update.callback_query?.from
  if (from) people.set(from.id, from.username ? `@${from.username}` : from.first_name ?? '')
}

if (people.size === 0) {
  console.log(`No one has written to the bot lately. Have them open https://t.me/${me.username} and press Start.`)
} else {
  console.log('Accounts that have written to it — add the ones that belong in TELEGRAM_STAFF_IDS:')
  for (const [id, who] of people) console.log(`  ${id}  ${who}`)
}
