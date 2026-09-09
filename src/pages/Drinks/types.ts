export interface Bilingual {
  pl?: string
  en?: string
}

export interface BilingualLines {
  pl?: string[]
  en?: string[]
}

export interface DrinkPrice {
  label?: Bilingual
  volume?: string
  price: string
}

export interface DrinkItem {
  name?: Bilingual
  step?: string
  title?: Bilingual
  sub?: Bilingual
  note?: string
  desc?: Bilingual & BilingualLines
  volume?: string
  price?: string
  prices?: DrinkPrice[]
  values?: string[]
  photo?: string
  ratio?: number
}

export interface DrinkGroup {
  title: Bilingual
  photo?: string
  ratio?: number
  items: DrinkItem[]
}

export interface DrinkSection {
  id: string
  title: Bilingual
  layout: 'cards' | 'feature' | 'columns' | 'wines' | 'steps'
  columns?: string[]
  price?: string
  photo?: string
  ratio?: number
  items?: DrinkItem[]
  groups?: DrinkGroup[]
}

export interface CoverPhoto {
  photo: string
  ratio: number

  width: number
}

export interface DrinksMenu {
  source: string
  cover: CoverPhoto
  note: Bilingual
  sections: DrinkSection[]
}
