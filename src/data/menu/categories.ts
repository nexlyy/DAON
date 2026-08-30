import type { MenuCategory } from './types'

/**
 * Categories follow the printed DAON menu. `ko` is the brush heading that
 * appears on each page; the English and Polish names translate that heading —
 * the printed menu only carries the Korean one.
 */
export const categories: MenuCategory[] = [
  {
    id: 'hansang',
    ko: '한상차림',
    romanization: 'Hansangcharim',
    name: { en: 'Korean Table Set', pl: 'Zestaw koreański', ko: '한상차림' },
    calligraphy: 'hansang',
    sourcePages: [2, 3],
  },
  {
    id: 'ramyeon',
    ko: '수제라면',
    romanization: 'Sujeramyeon',
    name: { en: 'Handmade Ramen', pl: 'Ramen domowy', ko: '수제라면' },
    calligraphy: 'ramyeon',
    sourcePages: [4],
  },
  {
    id: 'jungsik',
    ko: '중식세트',
    romanization: 'Jungsik Set',
    name: { en: 'Chinese-Korean Sets', pl: 'Zestawy chińsko-koreańskie', ko: '중식세트' },
    calligraphy: 'jungsik',
    sourcePages: [5],
  },
  {
    id: 'kimbap',
    ko: '김밥',
    romanization: 'Kimbap',
    name: { en: 'Kimbap', pl: 'Kimbap', ko: '김밥' },
    calligraphy: 'kimbap',
    sourcePages: [6, 7],
  },
  {
    id: 'chucheon',
    ko: '추천메뉴',
    romanization: 'Chucheon Menu',
    name: { en: "Chef's Recommendations", pl: 'Polecane dania', ko: '추천메뉴' },
    calligraphy: 'chucheon',
    sourcePages: [8],
  },
  {
    id: 'bbq',
    ko: '바베큐',
    romanization: 'Barbecue',
    name: { en: 'Korean BBQ', pl: 'Grill koreański', ko: '바베큐' },
    calligraphy: 'bbq',
    sourcePages: [9],
  },
  {
    id: 'yeoreum',
    ko: '여름메뉴',
    romanization: 'Yeoreum Menu',
    name: { en: 'Summer Menu', pl: 'Menu letnie', ko: '여름메뉴' },
    calligraphy: 'yeoreum',
    sourcePages: [10],
  },
  {
    id: 'siksa',
    ko: '식사메뉴',
    romanization: 'Siksa Menu',
    name: { en: 'Meals & Stews', pl: 'Dania obiadowe', ko: '식사메뉴' },
    calligraphy: 'siksa',
    sourcePages: [11],
  },
  {
    id: 'jeongol',
    ko: '전골메뉴',
    romanization: 'Jeongol Menu',
    name: { en: 'Hot Pots', pl: 'Kociołki', ko: '전골메뉴' },
    calligraphy: 'jeongol',
    sourcePages: [12, 13, 14],
  },
  {
    id: 'anju',
    ko: '안주류',
    romanization: 'Anjuryu',
    name: { en: 'Anju — Dishes for Drinks', pl: 'Anju — przekąski do napojów', ko: '안주류' },
    calligraphy: 'anju',
    sourcePages: [15, 16, 17],
  },
  {
    id: 'rezerwacja',
    ko: '예약 메뉴',
    romanization: 'Menu rezerwacji',
    name: { en: 'Reservation Menu', pl: 'Menu rezerwacji', ko: '예약 메뉴' },
    calligraphy: 'daon',
    sourcePages: [18, 19],
  },
  {
    id: 'dzieci',
    ko: '어린이 메뉴',
    romanization: 'Menu dla dzieci',
    name: { en: 'Kids Menu', pl: 'Menu dla dzieci', ko: '어린이 메뉴' },
    calligraphy: 'daon',
    sourcePages: [20],
  },
  {
    id: 'teukseon',
    ko: '특선메뉴',
    romanization: 'Teukseon Menu',
    name: { en: 'Special Menu', pl: 'Menu specjalne', ko: '특선메뉴' },
    calligraphy: 'teukseon',
    sourcePages: [21, 22],
  },
]

export const categoryById = new Map(categories.map((c) => [c.id, c]))
