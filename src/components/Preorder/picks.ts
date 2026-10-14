import { drinkOffers, type DrinkOffer } from '@/data/drinks'
import { dishes } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import type { Preorder } from '@/services/booking'

/**
 * How many of each thing, by its id: a dish's own id, or a drink's offer id
 * ("drink:seoul-kiss", "drink:primitivo-villa-schinosa.150-ml"). Nothing picked
 * is not there.
 */
export type Picks = Record<string, number>

// The same limits the API keeps; more than this is a conversation with the staff.
export const MAX_PER_DISH = 20
export const MAX_TOTAL = 100

/** Every drink a guest can pick, as the drinks list stands in this page. */
export const offers = drinkOffers()
const offerById = new Map(offers.map((offer) => [offer.id, offer]))
const dishById = new Map(dishes.map((dish) => [dish.id, dish]))

export const findOffer = (id: string) => offerById.get(id)

export type PickedLine = { id: string; quantity: number; price: number } & (
  | { kind: 'dish'; dish: Dish }
  | { kind: 'drink'; offer: DrinkOffer }
)

/** What is picked: the dishes in menu order, then the drinks in the order of the drinks list. */
export const pickedLines = (picks: Picks): PickedLine[] => [
  ...dishes
    .filter((dish) => (picks[dish.id] ?? 0) > 0)
    .map((dish) => ({ kind: 'dish' as const, id: dish.id, dish, price: dish.price, quantity: picks[dish.id] })),
  ...offers
    .filter((offer) => (picks[offer.id] ?? 0) > 0)
    .map((offer) => ({ kind: 'drink' as const, id: offer.id, offer, price: offer.price, quantity: picks[offer.id] })),
]

export const totalOf = (picks: Picks) =>
  Math.round(pickedLines(picks).reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100

export const countOf = (picks: Picks) => Object.values(picks).reduce((sum, quantity) => sum + quantity, 0)

/** What the restaurant has, as picks to edit; anything gone from the menu since is left out. */
export const picksOf = (preorder: Preorder | null | undefined): Picks =>
  Object.fromEntries(
    (preorder?.lines ?? [])
      .filter((line) => dishById.has(line.id) || offerById.has(line.id))
      .map((line) => [line.id, line.quantity]),
  )
