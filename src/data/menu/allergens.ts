/**
 * The allergy notice printed at the back of the menu (page 23).
 *
 * Four allergens are listed against specific dish numbers; the other four are
 * marked "contained in most dishes" and are shown as a standing notice rather
 * than per dish. The numbers are menu numbers, so an option inside a dish
 * counts as much as the dish's own number.
 */
export type Allergen =
  | 'gluten'
  | 'nuts'
  | 'dairy'
  | 'eggs'
  | 'shellfish'
  | 'soy'
  | 'fish'
  | 'sesame'

/** Listed against particular dishes. */
export const allergenNumbers: Partial<Record<Allergen, number[]>> = {
  nuts: [34, 35, 36, 37, 38, 39],
  dairy: [2, 24, 30, 61, 76, 88, 92, 93, 94],
  shellfish: [16, 17, 18, 19, 20, 23, 56, 58, 60, 64, 66, 74, 75, 77, 83],
  fish: [6, 30, 31, 85, 89],
}

/** Printed as "contained in most dishes", so they are not tagged per dish. */
export const widespreadAllergens: Allergen[] = ['gluten', 'eggs', 'soy', 'sesame']

const byNumber = new Map<number, Allergen[]>()
for (const [allergen, numbers] of Object.entries(allergenNumbers)) {
  for (const n of numbers ?? []) {
    byNumber.set(n, [...(byNumber.get(n) ?? []), allergen as Allergen])
  }
}

/** Allergens listed for any of the menu numbers a dish covers. */
export function allergensFor(numbers: number[]): Allergen[] {
  const found = new Set<Allergen>()
  for (const n of numbers) {
    for (const allergen of byNumber.get(n) ?? []) found.add(allergen)
  }
  return [...found]
}
