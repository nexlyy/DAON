/**
 * The drinks list as the bar's printed menu sets it: sections with a layout of
 * their own (cocktail cards, a feature with a photograph, columns of rows, a
 * wine table, the steps of a tea you put together yourself).
 *
 * Every drink has an id that stays put and its prices are numbers, so the
 * admin panel can edit it and a guest can pick it with a booking.
 */
export interface Bilingual {
  pl?: string
  en?: string
}

export interface BilingualLines {
  pl?: string[]
  en?: string[]
}

/** One thing to order when a drink comes in more than one way: a glass or a bottle, one shot or six. */
export interface DrinkPrice {
  id: string
  label?: Bilingual
  volume?: string
  amount?: string
  price: number
}

export interface DrinkItem {
  id: string
  name?: Bilingual
  desc?: Bilingual
  note?: Bilingual
  volume?: string
  price?: number
  prices?: DrinkPrice[]
  /** Wines: the alcohol column as printed, "13,5%". */
  abv?: string
  photo?: string
  ratio?: number
  hidden?: boolean
}

export interface DrinkGroup {
  title: Bilingual
  photo?: string
  ratio?: number
  items: DrinkItem[]
}

export interface DrinkStep {
  step?: string
  title?: Bilingual
  sub?: Bilingual
  desc?: BilingualLines
}

export type DrinkLayout = 'cards' | 'feature' | 'columns' | 'wines' | 'steps'

export interface DrinkSection {
  id: string
  title: Bilingual
  layout: DrinkLayout
  photo?: string
  ratio?: number
  /** Wines: the headings of the table, the volumes first and the alcohol last. */
  columns?: string[]
  items?: DrinkItem[]
  groups?: DrinkGroup[]
  /** Steps: one price for the tea, whatever is chosen on the way. */
  price?: number
  steps?: DrinkStep[]
  hidden?: boolean
}

export interface DrinksMenu {
  note?: Bilingual
  sections: DrinkSection[]
}
