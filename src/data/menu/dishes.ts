import { site, type RawDish, type RawText } from '@/content/site'
import type { Allergen } from './allergens'
import type { Dish, DishTag, LocalizedText } from './types'

const TAGS: DishTag[] = ['vegetarian', 'extraSpicy', 'mildAvailable', 'sharing']

const text = (value: RawText): LocalizedText => value

const read = (dish: RawDish): Dish => ({
  id: dish.id,
  number: dish.number,
  categoryId: dish.categoryId,
  name: text(dish.name),
  description: dish.description ? text(dish.description) : undefined,
  price: dish.price,
  photo: dish.photo,
  tags: dish.tags?.filter((tag): tag is DishTag => TAGS.includes(tag as DishTag)),
  portion: dish.portion,
  serves: dish.serves,
  featured: dish.featured,
})

// A dish the kitchen has taken off the board stays in the file — hiding it is
// how a seasonal dish comes back without being typed in again.
export const dishes: Dish[] = site.dishes.filter((dish) => !dish.hidden).map(read)

const allergensById = new Map<string, Allergen[]>(
  site.dishes.map((dish) => [dish.id, (dish.allergens ?? []) as Allergen[]]),
)

export function dishAllergens(dish: Dish): Allergen[] {
  return allergensById.get(dish.id) ?? []
}

export const dishesByCategory = (categoryId: string): Dish[] =>
  dishes.filter((dish) => dish.categoryId === categoryId)

export const featuredDishes = (): Dish[] => dishes.filter((dish) => dish.featured)

export const findDish = (id: string): Dish | undefined => dishes.find((dish) => dish.id === id)

export const dishPhotoAlt = (photo: string): LocalizedText =>
  dishes.find((dish) => dish.photo === photo)?.name ?? { en: 'DAON' }
