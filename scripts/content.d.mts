/**
 * The shape as much of it as the callers of this module need; the site's own
 * copy of it, with every field, is `RawSnapshot` in src/content/site.ts.
 */
export interface ContentSnapshot {
  dishes: { number: string; price: number }[]
  categories: unknown[]
  allergens: unknown
  restaurant: unknown
  promo: unknown
}

export function readContent(dir: string): ContentSnapshot
export function injectContent(html: string, snapshot: ContentSnapshot): string
export function structuredData(snapshot: ContentSnapshot): unknown
export function injectStructuredData(html: string, snapshot: ContentSnapshot): string
