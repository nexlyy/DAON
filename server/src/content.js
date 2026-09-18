/**
 * The restaurant's own content: the menu, the categories, the hours, the
 * promotion. Three copies of it live here.
 *
 *   live/     what the pages on the site are rendered from
 *   draft/    what the admin panel writes; nobody sees it until it is published
 *   history/  the live copy as it stood before each of the last publishes
 *
 * Everything that arrives from the panel is checked before it is written, not
 * because the panel is hostile but because a menu with a missing price or a
 * dish pointing at a category that no longer exists would render a broken page
 * for guests.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

import { root } from './env.js'

const HOME = process.env.DAON_CONTENT_HOME ?? resolve(root, 'content')
const LIVE = resolve(HOME, 'live')
const DRAFT = resolve(HOME, 'draft')
const HISTORY = resolve(HOME, 'history')
const META = resolve(DRAFT, 'meta.json')

const KEPT_VERSIONS = 60

export const FILES = ['menu', 'categories', 'allergens', 'restaurant', 'promo', 'texts']

const fileOf = (dir, name) => resolve(dir, `${name}.json`)

const ALLERGENS = ['gluten', 'nuts', 'dairy', 'eggs', 'shellfish', 'soy', 'fish', 'sesame']
const TAGS = ['vegetarian', 'extraSpicy', 'mildAvailable', 'sharing']
const LOCALES = ['en', 'pl', 'ko']

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const NUMBER = /^[0-9]{1,4}[a-z]?$/
const PHOTO = /^(?:[a-z0-9-]{1,40}|u:[a-z0-9-]{1,60})$/
const TIME = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PHONE = /^\+?[0-9 ]{7,20}$/

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Writes through a temporary name so a reader never sees half a file. */
function writeJson(path, value) {
  const text = JSON.stringify(value, null, 2) + '\n'
  const temporary = `${path}.writing`
  writeFileSync(temporary, text, { mode: 0o644 })
  renameSync(temporary, path)
}

// --- checking what the panel sends ------------------------------------------

class Invalid extends Error {}

const fail = (where, what) => {
  throw new Invalid(`${where}: ${what}`)
}

const text = (value, where, { max = 200, required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) fail(where, 'is empty')
    return undefined
  }
  if (typeof value !== 'string') fail(where, 'is not text')
  const trimmed = value.trim()
  if (required && trimmed === '') fail(where, 'is empty')
  if (trimmed.length > max) fail(where, `is longer than ${max} characters`)
  return trimmed === '' ? undefined : trimmed
}

/**
 * English is the one language the site can always fall back to, so a dish with
 * no English name is refused; Polish and Korean may be filled in later.
 */
const localized = (value, where, { max = 200, required = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) fail(where, 'is missing')
    return undefined
  }
  if (typeof value !== 'object' || Array.isArray(value)) fail(where, 'is not a set of languages')
  const out = {}
  for (const locale of LOCALES) {
    const one = text(value[locale], `${where}.${locale}`, {
      max,
      required: required && locale === 'en',
    })
    if (one) out[locale] = one
  }
  for (const key of Object.keys(value)) {
    if (!LOCALES.includes(key)) fail(`${where}.${key}`, 'is not one of pl, en, ko')
  }
  if (Object.keys(out).length === 0) return undefined
  return out
}

const number = (value, where, { min, max, whole = false } = {}) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(where, 'is not a number')
  if (whole && !Number.isInteger(value)) fail(where, 'must be a whole number')
  if (min !== undefined && value < min) fail(where, `is below ${min}`)
  if (max !== undefined && value > max) fail(where, `is above ${max}`)
  return value
}

const pick = (value, allowed, where) => {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) fail(where, 'is not a list')
  const out = []
  for (const one of value) {
    if (!allowed.includes(one)) fail(where, `"${one}" is not one of ${allowed.join(', ')}`)
    if (!out.includes(one)) out.push(one)
  }
  return out.length > 0 ? out : undefined
}

const flag = (value, where) => {
  if (value === undefined || value === false) return undefined
  if (value !== true) fail(where, 'is not yes or no')
  return true
}

function checkMenu(input, { categories }) {
  if (!input || !Array.isArray(input.dishes)) fail('menu', 'has no list of dishes')
  if (input.dishes.length === 0) fail('menu', 'would leave the menu empty')
  if (input.dishes.length > 400) fail('menu', 'holds more than 400 dishes')

  const ids = new Set()
  const numbers = new Set()
  const known = new Set(categories.map((category) => category.id))

  const dishes = input.dishes.map((dish, index) => {
    const where = `dish ${index + 1}`
    const id = text(dish.id, `${where} id`, { max: 60, required: true })
    if (!SLUG.test(id)) fail(`${where} id`, 'may hold only lowercase letters, digits and dashes')
    if (ids.has(id)) fail(`${where} id`, `"${id}" is used twice`)
    ids.add(id)

    const no = text(dish.number, `${where} number`, { max: 6, required: true })
    if (!NUMBER.test(no)) fail(`${where} number`, 'is not a menu number')
    if (numbers.has(no)) fail(`${where} number`, `${no} is used twice`)
    numbers.add(no)

    const categoryId = text(dish.categoryId, `${where} category`, { max: 60, required: true })
    if (!known.has(categoryId)) fail(`${where} category`, `"${categoryId}" is not a category`)

    const photo = text(dish.photo, `${where} photo`, { max: 60 })
    if (photo && !PHOTO.test(photo)) fail(`${where} photo`, 'is not a photograph name')

    return {
      id,
      number: no,
      categoryId,
      name: localized(dish.name, `${where} name`, { max: 120, required: true }),
      description: localized(dish.description, `${where} description`, { max: 1200 }),
      price: number(dish.price, `${where} price`, { min: 0, max: 10000 }),
      photo,
      portion: text(dish.portion, `${where} portion`, { max: 40 }),
      serves: text(dish.serves, `${where} serves`, { max: 40 }),
      tags: pick(dish.tags, TAGS, `${where} tags`),
      allergens: pick(dish.allergens, ALLERGENS, `${where} allergens`),
      featured: flag(dish.featured, `${where} featured`),
      hidden: flag(dish.hidden, `${where} hidden`),
    }
  })

  return { dishes: dishes.map(strip) }
}

function checkCategories(input) {
  if (!input || !Array.isArray(input.categories)) fail('categories', 'has no list')
  if (input.categories.length === 0) fail('categories', 'would leave the menu without categories')
  if (input.categories.length > 40) fail('categories', 'holds more than 40 categories')

  const ids = new Set()
  const categories = input.categories.map((category, index) => {
    const where = `category ${index + 1}`
    const id = text(category.id, `${where} id`, { max: 60, required: true })
    if (!SLUG.test(id)) fail(`${where} id`, 'may hold only lowercase letters, digits and dashes')
    if (ids.has(id)) fail(`${where} id`, `"${id}" is used twice`)
    ids.add(id)

    const calligraphy = text(category.calligraphy, `${where} calligraphy`, { max: 40 })
    if (calligraphy && !SLUG.test(calligraphy)) fail(`${where} calligraphy`, 'is not an image name')

    const pages = category.sourcePages
    if (pages !== undefined && !Array.isArray(pages)) fail(`${where} pages`, 'is not a list')

    return strip({
      id,
      romanization: text(category.romanization, `${where} romanization`, { max: 80 }) ?? '',
      name: localized(category.name, `${where} name`, { max: 120, required: true }),
      calligraphy: calligraphy ?? 'daon',
      sourcePages: (pages ?? []).map((page, at) =>
        number(page, `${where} page ${at + 1}`, { min: 1, max: 200, whole: true }),
      ),
    })
  })

  return { categories }
}

function checkAllergens(input) {
  const tracked = pick(input?.tracked, ALLERGENS, 'tracked allergens') ?? []
  const widespread = pick(input?.widespread, ALLERGENS, 'widespread allergens') ?? []
  for (const one of tracked) {
    if (widespread.includes(one)) {
      fail('allergens', `"${one}" cannot be both tracked per dish and called widespread`)
    }
  }
  return { tracked, widespread }
}

function checkRestaurant(input) {
  const place = input?.place
  if (!place) fail('restaurant', 'has no place')

  const phone = text(place.phone, 'phone', { max: 30, required: true })
  if (!PHONE.test(phone)) fail('phone', 'is not a phone number')
  const email = text(place.email, 'email', { max: 120, required: true })
  if (!EMAIL.test(email)) fail('email', 'is not an email address')

  const hours = {}
  for (let day = 0; day < 7; day += 1) {
    const span = input?.hours?.[String(day)]
    if (span === null || span === undefined) {
      hours[String(day)] = null
      continue
    }
    if (!Array.isArray(span) || span.length !== 2) fail(`hours for day ${day}`, 'is not a pair of times')
    const [open, close] = span
    if (!TIME.test(open) || !TIME.test(close)) fail(`hours for day ${day}`, 'is not written as HH:MM')
    if (open >= close) fail(`hours for day ${day}`, 'closes before it opens')
    hours[String(day)] = [open, close]
  }
  if (Object.values(hours).every((span) => span === null)) {
    fail('hours', 'would close the restaurant every day of the week')
  }

  const rules = input?.reservation ?? {}
  const reservation = {
    slotMinutes: number(rules.slotMinutes, 'slot length', { min: 5, max: 120, whole: true }),
    lastSeatingBeforeClose: number(rules.lastSeatingBeforeClose, 'last seating', {
      min: 0,
      max: 240,
      whole: true,
    }),
    holdMinutes: number(rules.holdMinutes, 'table hold', { min: 30, max: 300, whole: true }),
    maxDaysAhead: number(rules.maxDaysAhead, 'how far ahead', { min: 1, max: 365, whole: true }),
    partySizes: (rules.partySizes ?? []).map((size, at) =>
      number(size, `party size ${at + 1}`, { min: 1, max: 40, whole: true }),
    ),
    maxPartySize: number(rules.maxPartySize, 'largest party', { min: 1, max: 60, whole: true }),
    retentionDays: number(rules.retentionDays, 'how long bookings are kept', {
      min: 1,
      max: 3650,
      whole: true,
    }),
  }
  if (reservation.partySizes.length === 0) fail('party sizes', 'is empty')

  const legalIn = input?.legal ?? {}
  const legal = {}
  for (const key of [
    'companyName',
    'address',
    'krs',
    'nip',
    'regon',
    'court',
    'shareCapital',
    'policyUpdated',
  ]) {
    legal[key] = text(legalIn[key], `legal ${key}`, { max: 300, required: true })
  }
  legal.backupDays = number(legalIn.backupDays, 'backup days', { min: 1, max: 3650, whole: true })
  legal.serverLogDays = number(legalIn.serverLogDays, 'log days', { min: 1, max: 3650, whole: true })
  if (!ISO_DATE.test(legal.policyUpdated)) fail('legal policyUpdated', 'is not a date')

  return {
    place: strip({
      name: text(place.name, 'name', { max: 60, required: true }),
      legalName: text(place.legalName, 'legal name', { max: 120, required: true }),
      address: {
        street: text(place.address?.street, 'street', { max: 120, required: true }),
        postalCode: text(place.address?.postalCode, 'postal code', { max: 20, required: true }),
        city: text(place.address?.city, 'city', { max: 80, required: true }),
        country: text(place.address?.country, 'country', { max: 80, required: true }),
      },
      phone,
      email,
      instagram: text(place.instagram, 'instagram', { max: 60 }) ?? '',
      currency: text(place.currency, 'currency', { max: 8, required: true }),
      googlePlaceId: text(place.googlePlaceId, 'google place id', { max: 120, required: true }),
      links: {
        delivery: link(place.links?.delivery, 'delivery link'),
        pickup: link(place.links?.pickup, 'pickup link'),
      },
    }),
    hours,
    reservation,
    legal,
  }
}

const link = (value, where) => {
  const one = text(value, where, { max: 800 })
  if (!one) return ''
  if (!/^https:\/\//.test(one)) fail(where, 'must start with https://')
  return one
}

function checkPromo(input) {
  const promo = input?.birthday
  if (!promo) return { birthday: null }

  const dates = {}
  for (const key of ['announceFrom', 'from', 'to']) {
    const value = text(promo[key], `promotion ${key}`, { max: 10, required: true })
    if (!ISO_DATE.test(value)) fail(`promotion ${key}`, 'is not a date')
    dates[key] = value
  }
  if (dates.from > dates.to) fail('promotion', 'ends before it starts')
  if (dates.announceFrom > dates.from) fail('promotion', 'is announced after it has started')

  return {
    birthday: {
      id: text(promo.id, 'promotion id', { max: 60, required: true }),
      announceFrom: dates.announceFrom,
      from: dates.from,
      to: dates.to,
      percent: number(promo.percent, 'promotion percent', { min: 1, max: 90, whole: true }),
      timeZone: text(promo.timeZone, 'promotion time zone', { max: 60, required: true }),
    },
  }
}

/** Drops the keys that came back empty, so the files stay as small as the originals. */
function strip(value) {
  if (Array.isArray(value)) return value.map(strip)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, one] of Object.entries(value)) {
      if (one === undefined) continue
      out[key] = strip(one)
    }
    return out
  }
  return value
}

/**
 * Wording the restaurant has changed for itself, key by key and language by
 * language. A key it does not recognise simply never applies, so the risk here
 * is not a wrong key but a broken one: a piece of wording that was written
 * with a number or a date in it has to keep the same slots, or the page shows
 * a brace to a guest.
 */
function checkTexts(input) {
  const out = {}
  let total = 0

  for (const locale of LOCALES) {
    const given = input?.[locale]
    if (given === undefined || given === null) continue
    if (typeof given !== 'object' || Array.isArray(given)) fail(`texts.${locale}`, 'is not a set of keys')

    const kept = {}
    for (const [key, value] of Object.entries(given)) {
      if (!/^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*$/.test(key) || key.length > 80) {
        fail(`texts.${locale}`, `"${key}" is not a wording key`)
      }
      const one = text(value, `texts.${locale}.${key}`, { max: 1200 })
      if (one === undefined) continue

      const slots = one.match(/\{[^}]*\}/g) ?? []
      if (slots.length > 8) fail(`texts.${locale}.${key}`, 'holds too many slots in braces')
      for (const slot of slots) {
        if (!/^\{[a-z][a-zA-Z]{0,20}\}$/.test(slot)) {
          fail(`texts.${locale}.${key}`, `${slot} is not a slot the page can fill`)
        }
      }

      kept[key] = one
      total += 1
    }
    out[locale] = kept
  }

  if (total > 300) fail('texts', 'holds more than 300 changed pieces of wording')

  for (const locale of LOCALES) out[locale] = out[locale] ?? {}
  return out
}

const CHECKS = {
  menu: checkMenu,
  categories: (input) => checkCategories(input),
  allergens: (input) => checkAllergens(input),
  restaurant: (input) => checkRestaurant(input),
  promo: (input) => checkPromo(input),
  texts: (input) => checkTexts(input),
}

// --- the store ---------------------------------------------------------------

export function createContent() {
  mkdirSync(LIVE, { recursive: true })
  mkdirSync(DRAFT, { recursive: true })
  mkdirSync(HISTORY, { recursive: true })

  // The draft starts as a copy of what is live, which is also how it comes back
  // after a publish: nothing pending, everything equal.
  for (const name of FILES) {
    if (!existsSync(fileOf(DRAFT, name)) && existsSync(fileOf(LIVE, name))) {
      cpSync(fileOf(LIVE, name), fileOf(DRAFT, name))
    }
  }

  const readMeta = () => {
    try {
      return readJson(META)
    } catch {
      return { revision: 1, updatedAt: null, updatedBy: null }
    }
  }

  const bumpMeta = (by) => {
    const meta = readMeta()
    const next = {
      revision: (meta.revision ?? 1) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: by ?? null,
    }
    writeJson(META, next)
    return next
  }

  const read = (dir, name) => {
    try {
      return readJson(fileOf(dir, name))
    } catch (failure) {
      // The wording file arrived later than the others; an older directory has
      // none, which means nothing is overridden.
      if (name === 'texts') return { pl: {}, en: {}, ko: {} }
      throw failure
    }
  }

  const readAll = (dir) => {
    const out = {}
    for (const name of FILES) out[name] = read(dir, name)
    return out
  }

  /** Which files the draft and the live copy disagree on. */
  const pending = () => {
    const changed = []
    for (const name of FILES) {
      const a = JSON.stringify(read(LIVE, name))
      const b = JSON.stringify(read(DRAFT, name))
      if (a !== b) changed.push(name)
    }
    return changed
  }

  const check = (name, input) => {
    const checkOne = CHECKS[name]
    if (!checkOne) fail(name, 'is not one of the content files')
    // A dish names its category, so the categories have to be read as they
    // will stand after this save, not as they stand now.
    const categories = name === 'categories' ? checkCategories(input).categories : read(DRAFT, 'categories').categories
    return checkOne(input, { categories })
  }

  const save = (name, input, by) => {
    const checked = check(name, input)
    writeJson(fileOf(DRAFT, name), checked)
    return { meta: bumpMeta(by), value: checked }
  }

  /**
   * Everything has to agree before it goes live: a category the panel deleted
   * may still be named by a dish it did not show.
   */
  const verify = () => {
    const draft = readAll(DRAFT)
    const categories = checkCategories(draft.categories).categories
    checkMenu(draft.menu, { categories })
    checkAllergens(draft.allergens)
    checkRestaurant(draft.restaurant)
    checkPromo(draft.promo)
    checkTexts(draft.texts)
    return draft
  }

  const versions = () =>
    readdirSync(HISTORY, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .reverse()

  /** Keeps the live copy as it stands, then makes the draft live. */
  const promote = (by) => {
    const draft = verify()

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const kept = resolve(HISTORY, stamp)
    mkdirSync(kept, { recursive: true })
    for (const name of FILES) {
      if (existsSync(fileOf(LIVE, name))) cpSync(fileOf(LIVE, name), fileOf(kept, name))
    }
    writeJson(resolve(kept, 'about.json'), { at: new Date().toISOString(), by: by ?? null })

    for (const name of FILES) writeJson(fileOf(LIVE, name), draft[name])

    for (const old of versions().slice(KEPT_VERSIONS)) {
      rmSync(resolve(HISTORY, old), { recursive: true, force: true })
    }

    return { version: stamp, content: draft }
  }

  /** Puts an older copy back into the draft, where it can be looked at first. */
  const restore = (version, by) => {
    if (!/^[0-9TZ-]{10,40}$/.test(version)) fail('version', 'is not one of the kept versions')
    const from = resolve(HISTORY, version)
    if (!existsSync(from)) fail('version', 'is not one of the kept versions')
    for (const name of FILES) {
      if (existsSync(fileOf(from, name))) cpSync(fileOf(from, name), fileOf(DRAFT, name))
    }
    return { meta: bumpMeta(by), pending: pending() }
  }

  const history = () =>
    versions().map((version) => {
      let about = {}
      try {
        about = readJson(resolve(HISTORY, version, 'about.json'))
      } catch {
        about = {}
      }
      return { version, at: about.at ?? null, by: about.by ?? null }
    })

  return {
    home: HOME,
    live: LIVE,
    draft: DRAFT,
    files: FILES,
    readLive: () => readAll(LIVE),
    readDraft: () => readAll(DRAFT),
    meta: readMeta,
    pending,
    save,
    verify,
    promote,
    restore,
    history,
    Invalid,
  }
}

export { Invalid }
