/**
 * Everything the restaurant can change about itself — dishes, categories,
 * hours, the promotion — lives in the JSON files beside this one. The page
 * carries the current copy inline, so a price edited in the admin shows up in
 * the HTML a crawler reads, not only after JavaScript has run.
 *
 * Who puts it there: `contentSnapshot()` in vite.config.ts while developing,
 * `scripts/prerender.mjs` for every built page, and the API on the server when
 * it renders the pages again after an edit.
 */
import allergenMeta from './allergens.json'
import categoriesJson from './categories.json'
import promoJson from './promo.json'
import restaurantJson from './restaurant.json'

export interface RawText {
  en: string
  pl?: string
  ko?: string
}

export interface RawDish {
  id: string
  number: string
  categoryId: string
  name: RawText
  description?: RawText
  price: number
  photo?: string
  portion?: string
  serves?: string
  tags?: string[]
  allergens?: string[]
  featured?: boolean
  hidden?: boolean
}

export interface RawCategory {
  id: string
  romanization: string
  name: RawText
  calligraphy: string
  sourcePages: number[]
}

export interface RawSnapshot {
  dishes: RawDish[]
  categories: RawCategory[]
  allergens: { tracked: string[]; widespread: string[] }
  restaurant: typeof restaurantJson
  promo: typeof promoJson
}

declare global {
  // eslint-disable-next-line no-var
  var __DAON__: RawSnapshot | null | undefined
}

const injected = typeof globalThis.__DAON__ === 'object' ? globalThis.__DAON__ : null

/**
 * The dish list is only ever the injected copy: shipping a second one inside
 * the JavaScript would send every visitor the same 90 KB twice. The rest is
 * small and the page frame needs it, so those keep a built-in fallback.
 */
export const site: RawSnapshot = {
  dishes: injected?.dishes ?? [],
  categories: injected?.categories ?? categoriesJson.categories,
  allergens: injected?.allergens ?? allergenMeta,
  restaurant: injected?.restaurant ?? restaurantJson,
  promo: injected?.promo ?? promoJson,
}

if (import.meta.env.SSR && site.dishes.length === 0) {
  throw new Error(
    'no content snapshot: set globalThis.__DAON__ before importing the server bundle',
  )
}
