import type { Locale } from '@/i18n/config'

/**
 * Text that exists in at least English. Polish comes from the printed menu;
 * Korean is filled in once the Korean edition of the menu is supplied, and
 * falls back to English until then.
 */
export type LocalizedText = { en: string } & Partial<Record<Locale, string>>

export type DishTag =
  | 'vegetarian'
  | 'extraSpicy'
  | 'mildAvailable'
  | 'sharing'

export interface Dish {
  id: string
  /**
   * The number as printed in the menu, zero-padded — "01", "47". It is the
   * only number the interface ever shows, so reordering or regrouping the
   * list can never renumber a dish.
   */
  number: string
  categoryId: string
  name: LocalizedText
  description?: LocalizedText
  /** Price in PLN. */
  price: number
  /** File name (without extension) in /images/dishes. */
  photo?: string
  tags?: DishTag[]
  /** Portion size printed in the menu, e.g. "200g". */
  portion?: string
  /** Number of guests the dish is served for, e.g. "3-4". */
  serves?: string
  /** Marked as a signature dish on the home page. */
  featured?: boolean
}

export interface MenuCategory {
  id: string
  /** Korean heading as printed in the menu. */
  ko: string
  /** Romanisation of the Korean heading. */
  romanization: string
  name: LocalizedText
  /** File name (without extension) in /images/titles. */
  calligraphy: string
  /** Pages of the printed menu this category covers, for reference. */
  sourcePages: number[]
}
