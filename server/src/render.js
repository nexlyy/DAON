/**
 * Writes the site's pages again, from the content the server holds.
 *
 * Every page on daon.pl is a file: the menu is inside the HTML, which is how a
 * crawler and a phone with slow JavaScript both see the right prices. So when
 * the restaurant changes a price, the pages have to be written again. The build
 * does that on a laptop; this does the same thing on the server, from the same
 * script and the same server bundle that the last deploy left in /opt/daon-site.
 *
 * Nothing is swapped in until the whole set has rendered and every asset the
 * new pages point at is still on disk. A page naming a script that a later
 * deploy deleted would be a blank site, and that is the one outcome worth
 * being slow about.
 */
import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { root } from './env.js'

const KIT = process.env.DAON_SITE_KIT ?? '/opt/daon-site'
const WEB = process.env.DAON_WEB_ROOT ?? '/var/www/daon'
const UPLOADS = process.env.DAON_UPLOADS ?? '/var/www/daon-uploads'
const WORK = resolve(root, 'data', 'render')
const PREVIEWS = resolve(root, 'data', 'previews')
const TIMEOUT_MS = 120_000

const run = (command, args, options) =>
  new Promise((done, failed) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.output = `${stdout ?? ''}${stderr ?? ''}`.trim()
        failed(error)
        return
      }
      done(`${stdout ?? ''}${stderr ?? ''}`)
    })
  })

const walk = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path, base)
    return [relative(base, path).split('\\').join('/')]
  })

/**
 * The files a page points at. The built ones live in the site directory; the
 * pictures uploaded from the panel live outside it, so a deploy cannot delete
 * them, and are looked for there.
 */
const referenced = (html) =>
  [...html.matchAll(/(?:src|href|srcSet|srcset)="([^"]+)"/g)]
    .flatMap((match) => match[1].split(','))
    .map((one) => one.trim().split(' ')[0])
    .filter((one) => /^\/(assets|images|u)\//.test(one))

const fileFor = (asset) =>
  asset.startsWith('/u/') ? resolve(UPLOADS, `.${asset.slice(2)}`) : resolve(WEB, `.${asset}`)

export function createRender({ content }) {
  const ready = () =>
    existsSync(resolve(KIT, 'scripts/prerender.mjs')) &&
    existsSync(resolve(KIT, 'dist-ssr/entry-server.js')) &&
    existsSync(resolve(KIT, 'dist-ssr/template.html'))

  /**
   * Renders into a directory of its own and hands back what it wrote. Nothing
   * outside that directory is touched, so this is also how the panel can check
   * a draft without publishing it.
   */
  const draw = async (contentDir) => {
    if (!ready()) {
      throw new Error(
        `the render kit is missing from ${KIT} — publish the site once from the repository`,
      )
    }

    const into = `${WORK}-${Date.now()}`
    rmSync(into, { recursive: true, force: true })
    mkdirSync(into, { recursive: true })

    const started = Date.now()
    try {
      const output = await run('node', [resolve(KIT, 'scripts/prerender.mjs')], {
        timeout: TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          DAON_CONTENT: contentDir,
          DAON_DIST: into,
          DAON_SSR: resolve(KIT, 'dist-ssr'),
          DAON_LOCALES: resolve(KIT, 'src/i18n/locales'),
          DAON_TEMPLATE: resolve(KIT, 'dist-ssr/template.html'),
        },
      })
      return { into, output, ms: Date.now() - started }
    } catch (failure) {
      rmSync(into, { recursive: true, force: true })
      throw new Error(failure.output || failure.message)
    }
  }

  /**
   * Refuses the set if a page is missing or points at something that is not
   * there. Compared against what the site serves now: the deploy from the
   * laptop decides which pages exist, and this only rewrites them.
   */
  const inspect = (into) => {
    const written = walk(into)
    const pages = written.filter((file) => file.endsWith('.html'))
    if (pages.length === 0) throw new Error('the render produced no pages')

    const live = existsSync(WEB) ? walk(WEB).filter((file) => file.endsWith('.html')) : []
    const missing = live.filter((file) => !written.includes(file))
    if (missing.length > 0) {
      throw new Error(`the render left out pages the site has: ${missing.join(', ')}`)
    }

    const absent = new Set()
    for (const page of pages) {
      const html = readFileSync(resolve(into, page), 'utf8')
      if (!html.includes('window.__DAON__={')) throw new Error(`${page} carries no menu`)
      for (const asset of referenced(html)) {
        if (!existsSync(fileFor(asset))) absent.add(asset)
      }
    }
    if (absent.size > 0) {
      throw new Error(`the new pages point at files the site does not have: ${[...absent].join(', ')}`)
    }

    return { written, pages }
  }

  /** One file at a time, each one swapped by a rename: no half-written page. */
  const swap = (into, written) => {
    for (const file of written) {
      const target = resolve(WEB, file)
      const temporary = `${target}.writing`
      mkdirSync(dirname(target), { recursive: true })
      copyFileSync(resolve(into, file), temporary)
      renameSync(temporary, target)
    }
  }

  return {
    kit: KIT,
    web: WEB,
    ready,

    /** Renders the draft and throws if it would not hold together. Changes nothing. */
    async check() {
      const { into, ms } = await draw(content.draft)
      try {
        const { pages } = inspect(into)
        return { pages: pages.length, ms }
      } finally {
        rmSync(into, { recursive: true, force: true })
      }
    },

    /** Renders what is live and puts it on the site. */
    async publish() {
      const { into, ms } = await draw(content.live)
      try {
        const { written, pages } = inspect(into)
        swap(into, written)
        return { files: written.length, pages: pages.length, ms: ms + 0 }
      } finally {
        rmSync(into, { recursive: true, force: true })
      }
    },

    /**
     * Renders the draft and keeps it, under a name nobody can guess, so it can
     * be looked at — or sent to someone — before anything is published.
     */
    async preview({ by, hours = 24 } = {}) {
      const { into } = await draw(content.draft)
      try {
        inspect(into)
      } catch (failure) {
        rmSync(into, { recursive: true, force: true })
        throw failure
      }

      const token = randomBytes(18).toString('base64url')
      const home = resolve(PREVIEWS, token)
      mkdirSync(PREVIEWS, { recursive: true })
      renameSync(into, home)

      const created = new Date()
      const expires = new Date(created.getTime() + hours * 60 * 60 * 1000)
      writeFileSync(
        resolve(home, '.about.json'),
        JSON.stringify({ created: created.toISOString(), expires: expires.toISOString(), by }),
      )

      // Five at a time is plenty; the oldest goes first.
      const kept = readdirSync(PREVIEWS)
        .map((name) => ({ name, at: statSync(resolve(PREVIEWS, name)).mtimeMs }))
        .sort((a, b) => b.at - a.at)
      for (const old of kept.slice(5)) rmSync(resolve(PREVIEWS, old.name), { recursive: true, force: true })

      return { token, created: created.toISOString(), expires: expires.toISOString() }
    },

    /** One page of a preview, or null if the link is unknown or has run out. */
    previewPage(token, page) {
      if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null
      const home = resolve(PREVIEWS, token)
      let about
      try {
        about = JSON.parse(readFileSync(resolve(home, '.about.json'), 'utf8'))
      } catch {
        return null
      }
      if (Date.parse(about.expires) < Date.now()) {
        rmSync(home, { recursive: true, force: true })
        return null
      }

      const parts = page.split('/').filter(Boolean)
      if (parts.some((part) => !/^[a-z0-9-]+$/.test(part))) return null
      const file = resolve(home, ...parts, 'index.html')
      if (!file.startsWith(home) || !existsSync(file)) return null
      return { html: readFileSync(file, 'utf8'), about, path: `/${parts.join('/')}` }
    },

    /** Clears out anything a crash left behind, and previews that have run out. */
    tidy() {
      if (existsSync(PREVIEWS)) {
        for (const name of readdirSync(PREVIEWS)) {
          try {
            const about = JSON.parse(readFileSync(resolve(PREVIEWS, name, '.about.json'), 'utf8'))
            if (Date.parse(about.expires) < Date.now()) {
              rmSync(resolve(PREVIEWS, name), { recursive: true, force: true })
            }
          } catch {
            rmSync(resolve(PREVIEWS, name), { recursive: true, force: true })
          }
        }
      }

      const parent = dirname(WORK)
      if (!existsSync(parent)) return
      const cutoff = Date.now() - 6 * 60 * 60 * 1000
      for (const name of readdirSync(parent)) {
        const path = resolve(parent, name)
        if (!name.startsWith('render-')) continue
        try {
          if (statSync(path).mtimeMs < cutoff) rmSync(path, { recursive: true, force: true })
        } catch {
          // A directory that vanished under us is exactly what we wanted.
        }
      }
    },
  }
}
