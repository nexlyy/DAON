import type { Locale } from '@/i18n/config'

export type LocalizedText = { en: string } & Partial<Record<Locale, string>>

export type DishTag =
  | 'vegetarian'
  | 'extraSpicy'
  | 'mildAvailable'
  | 'sharing'

export interface Dish {
  id: string
  
  number: string
  categoryId: string
  name: LocalizedText
  description?: LocalizedText
  
  price: number
  
  photo?: string
  tags?: DishTag[]
  
  portion?: string
  
  serves?: string
  
  featured?: boolean
}

export interface MenuCategory {
  id: string
  
  ko: string
  
  romanization: string
  name: LocalizedText
  
  calligraphy: string
  
  sourcePages: number[]
}
