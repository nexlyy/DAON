import { site } from '@/content/site'
import type { Locale } from '@/i18n/config'
import type { Bilingual, DrinkItem, DrinkPrice, DrinksMenu } from './types'

export type { Bilingual, DrinkGroup, DrinkItem, DrinkPrice, DrinkSection, DrinkStep, DrinksMenu } from './types'

const shown = <T extends { hidden?: boolean }>(list: T[] = []) => list.filter((entry) => !entry.hidden)

/** What a guest sees: hidden drinks and sections left out, and nothing left empty. */
export function visibleMenu(menu: DrinksMenu): DrinksMenu {
  const sections = shown(menu.sections)
    .map((section) => ({
      ...section,
      items: section.items ? shown(section.items) : undefined,
      groups: section.groups
        ?.map((group) => ({ ...group, items: shown(group.items) }))
        .filter((group) => group.items.length > 0),
    }))
    .filter((section) =>
      section.layout === 'steps'
        ? (section.steps?.length ?? 0) > 0
        : (section.items?.length ?? 0) + (section.groups?.length ?? 0) > 0,
    )
  return { ...menu, sections }
}

export const drinksMenu = visibleMenu(site.drinks)

/** Polish reads Polish first; English and Korean read the English the menu prints. */
export const pickText = (locale: Locale, value?: Bilingual | string) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return locale === 'pl' ? value.pl || value.en || '' : value.en || value.pl || ''
}

export const DRINK = 'drink:'

/**
 * One thing a guest can order. A drink with one price is one offer; a wine is
 * a glass and a bottle; soju is a bottle and three counts of shots; the tea you
 * put together is one, whatever goes in it. The API derives the same list from
 * the same file (server/src/drinks.js), and the two have to agree.
 */
export interface DrinkOffer {
  id: string
  sectionId: string
  itemId: string
  name: Bilingual
  /** The group a row sits in: "WIEŻA PIWA 4 L" above "Piwo beczkowe". */
  groupTitle?: Bilingual
  variant?: DrinkPrice
  volume?: string
  price: number
  photo?: string
  ratio?: number
}

export function drinkOffers(menu: DrinksMenu = drinksMenu): DrinkOffer[] {
  const out: DrinkOffer[] = []
  for (const section of menu.sections) {
    if (section.layout === 'steps') {
      if (typeof section.price === 'number') {
        out.push({
          id: DRINK + section.id,
          sectionId: section.id,
          itemId: section.id,
          name: section.title,
          price: section.price,
          photo: section.photo,
          ratio: section.ratio,
        })
      }
      continue
    }

    const rows: { item: DrinkItem; groupTitle?: Bilingual; groupPhoto?: string; groupRatio?: number }[] = [
      ...(section.items ?? []).map((item) => ({ item })),
      ...(section.groups ?? []).flatMap((group) =>
        group.items.map((item) => ({ item, groupTitle: group.title, groupPhoto: group.photo, groupRatio: group.ratio })),
      ),
    ]

    for (const { item, groupTitle, groupPhoto, groupRatio } of rows) {
      const name = item.name ?? groupTitle ?? section.title
      const photo = item.photo ?? groupPhoto ?? section.photo
      const ratio = item.photo ? item.ratio : groupPhoto ? groupRatio : section.ratio
      if (typeof item.price === 'number') {
        out.push({
          id: DRINK + item.id,
          sectionId: section.id,
          itemId: item.id,
          name,
          groupTitle,
          volume: item.volume,
          price: item.price,
          photo,
          ratio,
        })
      }
      for (const variant of item.prices ?? []) {
        out.push({
          id: `${DRINK}${item.id}.${variant.id}`,
          sectionId: section.id,
          itemId: item.id,
          name,
          groupTitle,
          variant,
          volume: variant.volume,
          price: variant.price,
          photo,
          ratio,
        })
      }
    }
  }
  return out
}

/** "150 ml", "BOTTLE · 350 ml", "SHOTS · 40 ml · 3 shots" — what tells two offers of one drink apart. */
export const variantText = (locale: Locale, offer: Pick<DrinkOffer, 'variant' | 'volume'>) =>
  [pickText(locale, offer.variant?.label), offer.volume, offer.variant?.amount].filter(Boolean).join(' · ')
