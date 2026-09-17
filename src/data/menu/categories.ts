import { site } from '@/content/site'
import type { MenuCategory } from './types'

export const categories: MenuCategory[] = site.categories.map((category) => ({
  id: category.id,
  ko: category.name.ko ?? '',
  romanization: category.romanization,
  name: category.name,
  calligraphy: category.calligraphy,
  sourcePages: category.sourcePages,
}))

export const categoryById = new Map(categories.map((c) => [c.id, c]))
