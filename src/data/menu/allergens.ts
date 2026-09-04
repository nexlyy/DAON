export type Allergen =
  | 'gluten'
  | 'nuts'
  | 'dairy'
  | 'eggs'
  | 'shellfish'
  | 'soy'
  | 'fish'
  | 'sesame'

export const allergenNumbers: Partial<Record<Allergen, number[]>> = {
  nuts: [34, 35, 36, 37, 38, 39],
  dairy: [2, 24, 30, 61, 76, 88, 92, 93, 94],
  shellfish: [16, 17, 18, 19, 20, 23, 56, 58, 60, 64, 66, 74, 75, 77, 83],
  fish: [6, 30, 31, 85, 89],
}

export const widespreadAllergens: Allergen[] = ['gluten', 'eggs', 'soy', 'sesame']

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
