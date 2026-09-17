import { site } from '@/content/site'

export type Allergen =
  | 'gluten'
  | 'nuts'
  | 'dairy'
  | 'eggs'
  | 'shellfish'
  | 'soy'
  | 'fish'
  | 'sesame'

/**
 * Which dish numbers carry which allergen. The kitchen marks it dish by dish;
 * this is the same thing read the other way round, which is what the menu
 * filter needs.
 */
export const allergenNumbers: Partial<Record<Allergen, number[]>> = {}

for (const allergen of site.allergens.tracked as Allergen[]) {
  const numbers = site.dishes
    .filter((dish) => dish.allergens?.includes(allergen))
    .map((dish) => Number(dish.number))
  if (numbers.length > 0) allergenNumbers[allergen] = numbers
}

// In nearly every dish, so the menu says it once rather than on every card.
export const widespreadAllergens: Allergen[] = site.allergens.widespread as Allergen[]

const byNumber = new Map<number, Allergen[]>()
for (const [allergen, numbers] of Object.entries(allergenNumbers)) {
  for (const n of numbers ?? []) {
    byNumber.set(n, [...(byNumber.get(n) ?? []), allergen as Allergen])
  }
}

export function allergensFor(numbers: number[]): Allergen[] {
  const found = new Set<Allergen>()
  for (const n of numbers) {
    for (const allergen of byNumber.get(n) ?? []) found.add(allergen)
  }
  return [...found]
}
