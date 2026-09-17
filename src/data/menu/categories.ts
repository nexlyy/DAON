import korean from '../../content/menu.ko.json'
import type { MenuCategory } from './types'

const printed: Omit<MenuCategory, 'ko'>[] = [
  {
    id: 'hansang',
    romanization: 'Hansangcharim',
    name: { en: 'Korean Table Set', pl: 'Zestaw koreański' },
    calligraphy: 'hansang',
    sourcePages: [2, 3],
  },
  {
    id: 'ramyeon',
    romanization: 'Sujeramyeon',
    name: { en: 'Handmade Ramen', pl: 'Ramen domowy' },
    calligraphy: 'ramyeon',
    sourcePages: [4],
  },
  {
    id: 'jungsik',
    romanization: 'Jungsik Set',
    name: { en: 'Chinese-Korean Sets', pl: 'Zestawy chińsko-koreańskie' },
    calligraphy: 'jungsik',
    sourcePages: [5],
  },
  {
    id: 'kimbap',
    romanization: 'Kimbap',
    name: { en: 'Kimbap', pl: 'Kimbap' },
    calligraphy: 'kimbap',
    sourcePages: [6, 7],
  },
  {
    id: 'chucheon',
    romanization: 'Chucheon Menu',
    name: { en: "Chef's Recommendations", pl: 'Polecane dania' },
    calligraphy: 'chucheon',
    sourcePages: [8],
  },
  {
    id: 'bbq',
    romanization: 'Barbecue',
    name: { en: 'Korean BBQ', pl: 'Grill koreański' },
    calligraphy: 'bbq',
    sourcePages: [9],
  },
  {
    id: 'yeoreum',
    romanization: 'Yeoreum Menu',
    name: { en: 'Summer Menu', pl: 'Menu letnie' },
    calligraphy: 'yeoreum',
    sourcePages: [10],
  },
  {
    id: 'siksa',
    romanization: 'Siksa Menu',
    name: { en: 'Meals & Stews', pl: 'Dania obiadowe' },
    calligraphy: 'siksa',
    sourcePages: [11],
  },
  {
    id: 'jeongol',
    romanization: 'Jeongol Menu',
    name: { en: 'Hot Pots', pl: 'Kociołki' },
    calligraphy: 'jeongol',
    sourcePages: [12, 13, 14],
  },
  {
    id: 'anju',
    romanization: 'Anjuryu',
    name: { en: 'Anju — Dishes for Drinks', pl: 'Anju — przekąski do napojów' },
    calligraphy: 'anju',
    sourcePages: [15, 16, 17],
  },
  {
    id: 'rezerwacja',
    romanization: 'Menu rezerwacji',
    name: { en: 'Reservation Menu', pl: 'Menu rezerwacji' },
    calligraphy: 'daon',
    sourcePages: [18, 19],
  },
  {
    id: 'dzieci',
    romanization: 'Menu dla dzieci',
    name: { en: 'Kids Menu', pl: 'Menu dla dzieci' },
    calligraphy: 'daon',
    sourcePages: [20],
  },
  {
    id: 'teukseon',
    romanization: 'Teukseon Menu',
    name: { en: 'Special Menu', pl: 'Menu specjalne' },
    calligraphy: 'teukseon',
    sourcePages: [21, 22],
  },
]

const koreanCategories: Record<string, { name?: string }> = korean.categories

export const categories: MenuCategory[] = printed.map((category) => {
  const ko = koreanCategories[category.id]?.name ?? ''
  return { ...category, ko, name: { ...category.name, ko } }
})

export const categoryById = new Map(categories.map((c) => [c.id, c]))
