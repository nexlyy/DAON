/**
 * The admin panel's side of the wire: a login, a draft of the content, and a
 * button that puts it on the site.
 *
 * What it is guarding matters more than the size of the code here. Anyone who
 * gets in can change what a guest reads about a dish, so:
 *
 *   - the password is kept as a scrypt hash, never in the repository, and the
 *     panel starts read-only until the first password has been replaced;
 *   - five wrong guesses from one address stop that address for a quarter of an
 *     hour, and the next lock is longer;
 *   - a login from an address that has none of the current sessions, every
 *     lock-out, and every publish are reported to the staff chat, so a stranger
 *     getting in is something the restaurant hears about rather than discovers;
 *   - a session cookie is HttpOnly, Strict and confined to /api/admin, and
 *     every write also has to carry the session's own token in a header, so a
 *     page on another site cannot make a request that counts.
 */
import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

import { root } from './env.js'
import { Invalid } from './content.js'

const DATA = resolve(root, 'data')
const CREDENTIALS = resolve(DATA, 'admin.json')
const SESSIONS = resolve(DATA, 'admin-sessions.json')
const LOG = resolve(DATA, 'admin-log.jsonl')

const COOKIE = 'daon_admin'
const COOKIE_PATH = '/api/admin'
const IDLE_MS = 12 * 60 * 60 * 1000
const LIFE_MS = 7 * 24 * 60 * 60 * 1000

const TRIES = 5
const LOCKS_MS = [15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000, 4 * 60 * 60 * 1000]
const FORGET_MS = 60 * 60 * 1000

const BODY_MAX = 4 * 1024 * 1024
const LOG_KEPT = 400

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

// --- passwords ---------------------------------------------------------------

const hash = (password, salt) =>
  new Promise((done, failed) => {
    scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }, (error, key) =>
      error ? failed(error) : done(key),
    )
  })

const encode = async (password) => {
  const salt = randomBytes(16)
  const key = await hash(password, salt)
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`
}

const matches = async (password, stored) => {
  const [kind, N, r, p, salt, key] = String(stored ?? '').split('$')
  if (kind !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await new Promise((done, failed) => {
    scrypt(
      password,
      Buffer.from(salt, 'base64'),
      expected.length,
      { N: Number(N), r: Number(r), p: Number(p) },
      (error, out) => (error ? failed(error) : done(out)),
    )
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// --- small helpers -----------------------------------------------------------

const readJsonFile = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const writeJsonFile = (path, value, mode = 0o600) => {
  const temporary = `${path}.writing`
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { mode })
  renameSync(temporary, path)
  chmodSync(path, mode)
}

const cookiesOf = (request) => {
  const out = {}
  for (const part of String(request.headers.cookie ?? '').split(';')) {
    const at = part.indexOf('=')
    if (at < 1) continue
    out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim())
  }
  return out
}

const secure = (request) =>
  String(request.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() === 'https'

const readBody = (request, limit = BODY_MAX) =>
  new Promise((done, failed) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        failed(new Error('body too large'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => done(Buffer.concat(chunks)))
    request.on('error', failed)
  })

const shorten = (value, max = 120) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

// --- the panel ---------------------------------------------------------------

export function createAdmin({ content, render, photos, notifyStaff, onPublished, clientIp }) {
  mkdirSync(DATA, { recursive: true })

  let sessions = readJsonFile(SESSIONS, []).filter((one) => one && one.token)
  const tries = new Map()

  const saveSessions = () => writeJsonFile(SESSIONS, sessions)

  const credentials = () => readJsonFile(CREDENTIALS, null)

  /**
   * The first password comes from the environment file on the server, which is
   * the only place a secret for this machine belongs. Until it is set the panel
   * answers nothing at all, so a public repository never carries a way in.
   */
  const bootstrap = async () => {
    if (credentials()) return
    const user = process.env.ADMIN_USER?.trim()
    const password = process.env.ADMIN_PASSWORD ?? ''
    const stored = process.env.ADMIN_PASSWORD_HASH?.trim()
    if (!user || (!password && !stored)) return

    writeJsonFile(CREDENTIALS, {
      user,
      hash: stored || (await encode(password)),
      // Whatever the first password is, it has been typed into a chat, a
      // deploy note or an environment file by now. Nothing can be changed on
      // the site until it has been replaced from inside the panel.
      mustChange: !stored,
      updatedAt: new Date().toISOString(),
    })
    console.log(`Admin panel: ready for "${user}". The first password has to be replaced on login.`)
  }

  const configured = () => credentials() !== null

  const note = (entry) => {
    try {
      appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', {
        mode: 0o600,
      })
    } catch (failure) {
      console.error('Admin panel: could not write the log:', failure.message)
    }
  }

  const readLog = (limit) => {
    try {
      const lines = readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)
      return lines
        .slice(-Math.min(limit || 100, LOG_KEPT))
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)
        .reverse()
    } catch {
      return []
    }
  }

  const prune = () => {
    const now = Date.now()
    const before = sessions.length
    sessions = sessions.filter(
      (one) => now - Date.parse(one.seen) < IDLE_MS && now - Date.parse(one.created) < LIFE_MS,
    )
    if (sessions.length !== before) saveSessions()
  }

  const sessionOf = (request) => {
    prune()
    const token = cookiesOf(request)[COOKIE]
    if (!token) return null
    const found = sessions.find((one) => one.token === token)
    if (!found) return null
    found.seen = new Date().toISOString()
    return found
  }

  const lockedFor = (ip) => {
    const state = tries.get(ip)
    if (!state?.until) return 0
    const left = state.until - Date.now()
    if (left <= 0) {
      state.until = 0
      return 0
    }
    return left
  }

  const failed = (ip) => {
    const state = tries.get(ip) ?? { count: 0, locks: 0, until: 0, at: 0 }
    if (Date.now() - state.at > FORGET_MS) state.count = 0
    state.count += 1
    state.at = Date.now()
    if (state.count >= TRIES) {
      state.count = 0
      state.until = Date.now() + LOCKS_MS[Math.min(state.locks, LOCKS_MS.length - 1)]
      state.locks += 1
      tries.set(ip, state)
      return state.until - Date.now()
    }
    tries.set(ip, state)
    return 0
  }

  const cleared = (ip) => tries.delete(ip)

  // --- answers ---------------------------------------------------------------

  const json = (request, response, status, body, cookie) => {
    const payload = JSON.stringify(body)
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(payload),
      'X-Robots-Tag': 'noindex, nofollow',
    }
    if (cookie) headers['Set-Cookie'] = cookie
    response.writeHead(status, headers)
    response.end(payload)
  }

  const cookieFor = (request, token) =>
    [
      `${COOKIE}=${token}`,
      `Path=${COOKIE_PATH}`,
      'HttpOnly',
      'SameSite=Strict',
      secure(request) ? 'Secure' : '',
      `Max-Age=${Math.floor(IDLE_MS / 1000)}`,
    ]
      .filter(Boolean)
      .join('; ')

  const clearCookie = (request) =>
    [
      `${COOKIE}=`,
      `Path=${COOKIE_PATH}`,
      'HttpOnly',
      'SameSite=Strict',
      secure(request) ? 'Secure' : '',
      'Max-Age=0',
    ]
      .filter(Boolean)
      .join('; ')

  const body = async (request) => {
    try {
      return JSON.parse((await readBody(request)).toString('utf8'))
    } catch {
      return null
    }
  }

  const state = () => ({
    user: credentials()?.user ?? null,
    mustChange: credentials()?.mustChange === true,
    meta: content.meta(),
    pending: content.pending(),
    canRender: render.ready(),
  })

  async function handle(request, response, url) {
    const path = url.pathname.replace(/^\/admin\/?/, '/')
    const ip = clientIp(request)

    if (!configured()) {
      return json(request, response, 503, { error: 'the admin panel is not set up on this server' })
    }

    // --- getting in ----------------------------------------------------------

    if (path === '/session' && request.method === 'POST') {
      const left = lockedFor(ip)
      if (left > 0) {
        return json(request, response, 429, {
          error: 'too many wrong passwords',
          retryInMinutes: Math.ceil(left / 60000),
        })
      }

      const sent = (await body(request)) ?? {}
      const stored = credentials()
      const user = shorten(sent.user, 60)
      const password = typeof sent.password === 'string' ? sent.password : ''

      const right = user === stored.user && password !== '' && (await matches(password, stored.hash))
      if (!right) {
        const locked = failed(ip)
        note({ what: 'login refused', user, ip })
        if (locked > 0) {
          notifyStaff?.(
            `Admin panel: five wrong passwords from ${ip}. That address is blocked for ${Math.ceil(locked / 60000)} minutes.`,
          )
        }
        return json(request, response, 401, { error: 'wrong user or password' })
      }

      cleared(ip)
      const known = sessions.some((one) => one.ip === ip)
      const session = {
        token: randomBytes(32).toString('base64url'),
        csrf: randomBytes(24).toString('base64url'),
        user: stored.user,
        ip,
        agent: shorten(request.headers['user-agent'], 200),
        created: new Date().toISOString(),
        seen: new Date().toISOString(),
      }
      sessions.push(session)
      saveSessions()
      note({ what: 'signed in', user: stored.user, ip })
      if (!known) {
        notifyStaff?.(`Admin panel: signed in from ${ip}.`)
      }

      return json(
        request,
        response,
        200,
        { csrf: session.csrf, ...state() },
        cookieFor(request, session.token),
      )
    }

    // --- everything below needs the session ----------------------------------

    const session = sessionOf(request)
    if (!session) {
      return json(request, response, 401, { error: 'not signed in' })
    }

    if (path === '/session' && request.method === 'GET') {
      saveSessions()
      return json(request, response, 200, {
        csrf: session.csrf,
        since: session.created,
        ...state(),
      })
    }

    if (path === '/session' && request.method === 'DELETE') {
      sessions = sessions.filter((one) => one.token !== session.token)
      saveSessions()
      note({ what: 'signed out', user: session.user, ip })
      return json(request, response, 200, { ok: true }, clearCookie(request))
    }

    // A write also has to carry the token this session was given, and come
    // from the site itself. A form on another page has neither.
    const writing = request.method !== 'GET' && request.method !== 'HEAD'
    if (writing) {
      if (request.headers['x-daon-csrf'] !== session.csrf) {
        return json(request, response, 403, { error: 'this request is missing its token' })
      }
      const origin = request.headers.origin
      if (origin && !/^https?:\/\/(daon\.pl|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$/.test(origin)) {
        return json(request, response, 403, { error: 'this request came from somewhere else' })
      }
    }

    if (path === '/password' && request.method === 'PUT') {
      const sent = (await body(request)) ?? {}
      const stored = credentials()
      const current = typeof sent.current === 'string' ? sent.current : ''
      const next = typeof sent.next === 'string' ? sent.next : ''

      if (!(await matches(current, stored.hash))) {
        note({ what: 'password change refused', user: stored.user, ip })
        return json(request, response, 403, { error: 'the current password does not match' })
      }
      if (next.length < 10) {
        return json(request, response, 400, { error: 'the new password needs at least 10 characters' })
      }
      if (next === current) {
        return json(request, response, 400, { error: 'the new password is the old one' })
      }

      writeJsonFile(CREDENTIALS, {
        user: stored.user,
        hash: await encode(next),
        mustChange: false,
        updatedAt: new Date().toISOString(),
      })

      // Whoever knew the old password is signed out everywhere but here.
      sessions = sessions.filter((one) => one.token === session.token)
      saveSessions()
      note({ what: 'password changed', user: stored.user, ip })
      notifyStaff?.('Admin panel: the password was changed.')
      return json(request, response, 200, state())
    }

    // Nothing about the site can change while the first password still stands.
    const locked = credentials()?.mustChange === true
    if (writing && locked) {
      return json(request, response, 423, {
        error: 'set a new password before changing anything on the site',
      })
    }

    // --- content --------------------------------------------------------------

    if (path === '/content' && request.method === 'GET') {
      return json(request, response, 200, {
        ...state(),
        draft: content.readDraft(),
        live: content.readLive(),
      })
    }

    const saving = /^\/content\/([a-z]+)$/.exec(path)
    if (saving && request.method === 'PUT') {
      const name = saving[1]
      if (!content.files.includes(name)) {
        return json(request, response, 404, { error: `there is no ${name} to save` })
      }
      const sent = (await body(request)) ?? {}
      const meta = content.meta()
      if (sent.revision !== undefined && sent.revision !== meta.revision) {
        return json(request, response, 409, {
          error: 'someone else saved a change while this page was open',
          ...state(),
        })
      }
      try {
        const saved = content.save(name, sent.value, session.user)
        note({ what: `saved ${name}`, user: session.user, ip })
        return json(request, response, 200, { ...state(), value: saved.value })
      } catch (failure) {
        if (failure instanceof Invalid) {
          return json(request, response, 400, { error: failure.message })
        }
        throw failure
      }
    }

    if (path === '/check' && request.method === 'POST') {
      try {
        content.verify()
        const drawn = await render.check()
        return json(request, response, 200, { ...state(), ...drawn })
      } catch (failure) {
        return json(request, response, 400, { error: failure.message })
      }
    }

    if (path === '/publish' && request.method === 'POST') {
      try {
        const promoted = content.promote(session.user)
        const written = await render.publish()
        onPublished?.(promoted.content)
        try {
          photos.sweep(promoted.content)
        } catch (failure) {
          console.error('Admin panel: could not tidy the uploaded pictures:', failure.message)
        }
        note({
          what: 'published',
          user: session.user,
          ip,
          version: promoted.version,
          pages: written.pages,
        })
        notifyStaff?.(
          `Admin panel: the site was published. ${written.pages} pages rewritten in ${(written.ms / 1000).toFixed(1)}s.`,
        )
        return json(request, response, 200, { ...state(), version: promoted.version, ...written })
      } catch (failure) {
        note({ what: 'publish failed', user: session.user, ip, why: shorten(failure.message, 300) })
        return json(request, response, 400, { error: failure.message })
      }
    }

    const uploading = /^\/photo\/([a-z0-9-]{1,60})$/.exec(path)
    if (uploading && request.method === 'PUT') {
      const dishId = uploading[1]
      const dishes = content.readDraft().menu.dishes
      if (!dishes.some((dish) => dish.id === dishId)) {
        return json(request, response, 404, { error: 'there is no dish with that name' })
      }
      let bytes
      try {
        bytes = await readBody(request, photos.maxBytes + 1024)
      } catch {
        return json(request, response, 413, { error: 'that picture is too large' })
      }
      try {
        const written = await photos.save(dishId, bytes)
        note({ what: 'photograph uploaded', user: session.user, ip, dish: dishId })
        return json(request, response, 200, { ...state(), ...written })
      } catch (failure) {
        return json(request, response, 400, { error: failure.message })
      }
    }

    if (path === '/photos' && request.method === 'GET') {
      return json(request, response, 200, { photos: photos.list() })
    }

    if (path === '/history' && request.method === 'GET') {
      return json(request, response, 200, { versions: content.history() })
    }

    if (path === '/restore' && request.method === 'POST') {
      const sent = (await body(request)) ?? {}
      try {
        content.restore(shorten(sent.version, 40), session.user)
        note({ what: 'restored', user: session.user, ip, version: shorten(sent.version, 40) })
        return json(request, response, 200, { ...state(), draft: content.readDraft() })
      } catch (failure) {
        if (failure instanceof Invalid) {
          return json(request, response, 400, { error: failure.message })
        }
        throw failure
      }
    }

    if (path === '/log' && request.method === 'GET') {
      return json(request, response, 200, {
        entries: readLog(Number(url.searchParams.get('limit') ?? 100)),
      })
    }

    return json(request, response, 404, { error: 'no such thing in the admin panel' })
  }

  return {
    handle,
    bootstrap,
    configured,
    /** Frees the sessions of anyone who has been away, on a timer. */
    prune,
  }
}
