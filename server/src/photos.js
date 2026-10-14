/**
 * Photographs of dishes and drinks, as uploaded from the admin panel.
 *
 * They cannot live where the rest of the site lives: publishing from the
 * repository replaces that whole directory, and a deploy would take every
 * uploaded picture down with it. So they sit in their own directory, served
 * from /u/, and the file name carries a hash — a replacement gets a new name,
 * which is what lets browsers cache them for a year and still see the change.
 *
 * ffmpeg does the resizing and the encoding. It is on the server for other
 * reasons and can write both formats the site serves; if it is ever missing,
 * the upload is kept at the one size the panel sent rather than refused.
 */
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const UPLOADS = process.env.DAON_UPLOADS ?? '/var/www/daon-uploads'
const KEPT = resolve(root, 'content', 'photos')

// Each kind of picture keeps to its own directory under /u/, the large ones at
// the top and the phone size in sm/.
export const KINDS = ['dishes', 'drinks']
const dirsOf = (kind) => {
  const large = resolve(UPLOADS, kind)
  return { large, small: resolve(large, 'sm') }
}

const LARGE_PX = 640
const SMALL_PX = 320
const MAX_BYTES = 12 * 1024 * 1024
const UNREFERENCED_KEPT_MS = 7 * 24 * 60 * 60 * 1000

const run = (command, args) =>
  new Promise((done, failed) => {
    execFile(command, args, { timeout: 60_000 }, (error, stdout, stderr) =>
      error ? failed(new Error(`${error.message} ${stderr ?? ''}`.trim())) : done(stdout),
    )
  })

/**
 * What the bytes actually are, rather than what the header claimed. A file
 * that is not one of the four is not written anywhere.
 */
export function kindOf(bytes) {
  if (bytes.length < 16) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  const riff = bytes.subarray(0, 4).toString('latin1')
  if (riff === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  if (bytes.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = bytes.subarray(8, 12).toString('latin1')
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') return 'avif'
  }
  return null
}

export function createPhotos() {
  let ffmpeg = true

  const ready = (kind) => {
    mkdirSync(dirsOf(kind).small, { recursive: true })
    mkdirSync(resolve(KEPT, 'original'), { recursive: true })
  }

  const encode = async (from, to, size) => {
    await run('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      from,
      '-vf',
      `scale=${size}:${size}:flags=lanczos`,
      '-frames:v',
      '1',
      ...(to.endsWith('.avif')
        ? ['-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '32', '-cpu-used', '6', '-pix_fmt', 'yuv420p']
        : ['-c:v', 'libwebp', '-quality', '82']),
      to,
    ])
  }

  /**
   * Writes one photograph at the two sizes and two formats the site asks for,
   * and hands back the name to put in the menu or the drinks list.
   */
  const save = async (id, bytes, kind = 'dishes') => {
    if (!KINDS.includes(kind)) throw new Error('that is not a kind of picture the site keeps')
    if (bytes.length > MAX_BYTES) throw new Error('that picture is larger than 12 MB')
    const type = kindOf(bytes)
    if (!type) throw new Error('that file is not a JPEG, PNG, WebP or AVIF picture')

    ready(kind)
    const { large, small } = dirsOf(kind)

    const stamp = createHash('sha256').update(bytes).digest('hex').slice(0, 8)
    const name = `${id}-${stamp}`.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 60)

    const original = resolve(KEPT, 'original', `${name}.${type}`)
    writeFileSync(original, bytes)

    const wrote = []
    for (const [dir, size] of [
      [large, LARGE_PX],
      [small, SMALL_PX],
    ]) {
      for (const format of ['webp', 'avif']) {
        const target = resolve(dir, `${name}.${format}`)
        // ffmpeg reads the format off the extension, so the half-written file
        // keeps it at the end: name.writing.webp, not name.webp.writing.
        const temporary = resolve(dir, `${name}.writing.${format}`)
        try {
          if (!ffmpeg) throw new Error('ffmpeg is not here')
          await encode(original, temporary, size)
          renameSync(temporary, target)
          wrote.push(`${size}.${format}`)
        } catch (failure) {
          rmSync(temporary, { force: true })
          // Without ffmpeg there is nothing to resize with. Keeping what the
          // panel sent is worse than a proper set but better than no picture,
          // and the panel says so.
          // Only a missing ffmpeg turns it off; one picture it could not read
          // says nothing about the next.
          if (/ENOENT/.test(failure.message)) ffmpeg = false
          if (format === 'webp' && type === 'webp') {
            copyFileSync(original, target)
            wrote.push(`${size}.webp as sent`)
          } else if (format === 'webp') {
            throw new Error(`could not read that picture: ${failure.message}`)
          }
        }
      }
    }

    return { photo: `u:${name}`, name, wrote, resized: ffmpeg }
  }

  /**
   * Uploaded pictures nothing points at any more. Kept for a week in case a
   * change is taken back, then removed.
   */
  const sweep = (live) => {
    const drinks = live.drinks?.sections ?? []
    const named = [
      ...(live.menu?.dishes ?? []).map((dish) => dish.photo),
      ...drinks.flatMap((section) => [
        section.photo,
        ...(section.items ?? []).map((item) => item.photo),
        ...(section.groups ?? []).flatMap((group) => [group.photo, ...group.items.map((item) => item.photo)]),
      ]),
    ]
    const used = new Set(
      named.filter((photo) => typeof photo === 'string' && photo.startsWith('u:')).map((photo) => photo.slice(2)),
    )

    let removed = 0
    for (const kind of KINDS) {
      const { large, small } = dirsOf(kind)
      for (const dir of [large, small]) {
        if (!existsSync(dir)) continue
        for (const file of readdirSync(dir, { withFileTypes: true })) {
          if (!file.isFile()) continue
          const name = file.name.replace(/\.(webp|avif)$/, '')
          if (name === file.name || used.has(name)) continue
          const path = resolve(dir, file.name)
          try {
            if (Date.now() - statSync(path).mtimeMs < UNREFERENCED_KEPT_MS) continue
            unlinkSync(path)
            removed += 1
          } catch {
            // Already gone, which is the point.
          }
        }
      }
    }
    return { removed }
  }

  /** What the panel shows in its photo library: what exists, of one kind. */
  const list = (kind = 'dishes') => {
    const { large } = dirsOf(KINDS.includes(kind) ? kind : 'dishes')
    if (!existsSync(large)) return []
    return readdirSync(large)
      .filter((file) => file.endsWith('.webp'))
      .map((file) => {
        const name = file.slice(0, -5)
        let size = 0
        try {
          size = statSync(resolve(large, file)).size
        } catch {
          size = 0
        }
        return { photo: `u:${name}`, bytes: size, avif: existsSync(resolve(large, `${name}.avif`)) }
      })
  }

  return { save, sweep, list, uploads: UPLOADS, maxBytes: MAX_BYTES }
}
