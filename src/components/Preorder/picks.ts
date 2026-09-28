import { dishes } from '@/data/menu/dishes'
import type { Preorder } from '@/services/booking'

/** How many of each dish, by dish id. A dish that is not picked is not there. */
export type Picks = Record<string, number>

// The same limits the API keeps; more than this is a conversation with the staff.
export const MAX_PER_DISH = 20
export const MAX_TOTAL = 100

/** The picked dishes in the order they stand on the menu. */
export const pickedDishes = (picks: Picks) =>
  dishes
    .filter((dish) => (picks[dish.id] ?? 0) > 0)
    .map((dish) => ({ dish, quantity: picks[dish.id] }))

export const totalOf = (picks: Picks) =>
  Math.round(pickedDishes(picks).reduce((sum, { dish, quantity }) => sum + dish.price * quantity, 0) * 100) / 100

export const countOf = (picks: Picks) => Object.values(picks).reduce((sum, quantity) => sum + quantity, 0)

/** What the restaurant has, as picks to edit; a dish gone from the menu since is left out. */
export const picksOf = (preorder: Preorder | null | undefined): Picks =>
  Object.fromEntries(
    (preorder?.lines ?? [])
      .filter((line) => dishes.some((dish) => dish.id === line.id))
      .map((line) => [line.id, line.quantity]),
  )
