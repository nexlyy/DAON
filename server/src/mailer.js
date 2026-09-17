import { randomBytes } from 'node:crypto'
import tls from 'node:tls'

const CRLF = '\r\n'
const TIMEOUT_MS = 20_000

const encodeWord = (value) =>
  /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`

const base64Lines = (content) =>
  Buffer.from(content, typeof content === 'string' ? 'utf8' : undefined)
    .toString('base64')
    .replace(/.{76}/g, `$&${CRLF}`)

const address = (value) => String(value ?? '').replace(/[\r\n<>]/g, '').trim()

function buildMime({ from, fromName, to, subject, text, html, attachments = [], domain }) {
  const mixed = `mixed_${randomBytes(12).toString('hex')}`
  const alternative = `alt_${randomBytes(12).toString('hex')}`

  const headers = [
    `From: ${encodeWord(fromName)} <${address(from)}>`,
    `To: <${address(to)}>`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${randomBytes(16).toString('hex')}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
  ]

  const parts = [
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alternative}"`,
    '',
    `--${alternative}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(text),
    `--${alternative}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(html),
    `--${alternative}--`,
    ...attachments.flatMap((attachment) => [
      `--${mixed}`,
      `Content-Type: ${attachment.type}; name="${attachment.name}"`,
      `Content-Disposition: attachment; filename="${attachment.name}"`,
      'Content-Transfer-Encoding: base64',
      '',
      base64Lines(attachment.content),
    ]),
    `--${mixed}--`,
    '',
  ]

  return [...headers, '', ...parts].join(CRLF)
}

function conversation(socket) {
  let buffer = ''
  let waiting = null

  socket.setEncoding('utf8')
  socket.on('data', (chunk) => {
    buffer += chunk
    settle()
  })
  socket.on('error', (failure) => {
    const pending = waiting
    waiting = null
    pending?.reject(failure)
  })
  socket.on('close', () => {
    const pending = waiting
    waiting = null
    pending?.reject(new Error('SMTP connection closed'))
  })

  function settle() {
    if (!waiting) return
    const lines = buffer.split(CRLF)
    const done = lines.findIndex((line) => /^\d{3} /.test(line))
    if (done === -1) return
    const reply = lines.slice(0, done + 1)
    buffer = lines.slice(done + 1).join(CRLF)
    const { resolve } = waiting
    waiting = null
    resolve({ code: Number(reply[done].slice(0, 3)), text: reply.join('\n') })
  }

  const read = () =>
    new Promise((resolve, reject) => {
      waiting = { resolve, reject }
      settle()
    })

  async function expect(command, codes) {
    if (command !== null) socket.write(`${command}${CRLF}`)
    const reply = await read()
    if (!codes.includes(reply.code)) {
      const shown = command?.startsWith('AUTH') ? 'AUTH …' : command
      throw new Error(`SMTP ${shown ?? 'greeting'} answered ${reply.text}`)
    }
    return reply
  }

  return { expect }
}

export function createMailer(env = process.env) {
  const host = env.SMTP_HOST?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS?.replace(/\s+/g, '')
  const from = env.MAIL_FROM?.trim() || user
  const fromName = env.MAIL_FROM_NAME?.trim() || 'DAON Korean Restaurant'
  const port = Number(env.SMTP_PORT ?? 465)
  const enabled = Boolean(host && user && pass && from)

  async function send({ to, subject, text, html, attachments }) {
    if (!enabled) return false
    const socket = await new Promise((resolve, reject) => {
      const connection = tls.connect({ host, port, servername: host })
      connection.setTimeout(TIMEOUT_MS, () => connection.destroy(new Error('SMTP timed out')))
      connection.once('secureConnect', () => resolve(connection))
      connection.once('error', reject)
    })

    try {
      const smtp = conversation(socket)
      await smtp.expect(null, [220])
      await smtp.expect('EHLO daon.pl', [250])

      const credentials = Buffer.from(`\u0000${user}\u0000${pass}`, 'utf8').toString('base64')
      await smtp.expect(`AUTH PLAIN ${credentials}`, [235])
      await smtp.expect(`MAIL FROM:<${address(from)}>`, [250])
      await smtp.expect(`RCPT TO:<${address(to)}>`, [250, 251])
      await smtp.expect('DATA', [354])

      const message = buildMime({ from, fromName, to, subject, text, html, attachments, domain: 'daon.pl' })
      const stuffed = message.replace(/\r\n\./g, '\r\n..')
      socket.write(`${stuffed}${CRLF}.${CRLF}`)
      await smtp.expect(null, [250])
      socket.write(`QUIT${CRLF}`)
      return true
    } finally {
      setTimeout(() => socket.destroy(), 500).unref()
    }
  }

  return { enabled, send }
}
