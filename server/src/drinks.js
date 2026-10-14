/**
 * The drinks a guest can pick with a booking, read from the live drinks list.
 *
 * The site builds the same list in src/data/drinks/index.ts (drinkOffers), and
 * the two have to agree on every id: a drink with one price is "drink:<id>", a
 * glass or a bottle of one is "drink:<id>.<price id>", and the tea you put
 * together is ordered by its section, "drink:<section id>". Hidden drinks and
 * hidden sections are not on offer.
 */
export const DRINK = 'drink:'

const shown = (list = []) => list.filter((entry) => entry && !entry.hidden)

export function drinkOffers(drinks) {
  const out = []
  for (const section of shown(drinks?.sections)) {
    if (section.layout === 'steps') {
      if (typeof section.price === 'number') {
        out.push({ id: DRINK + section.id, name: section.title, price: section.price })
      }
      continue
    }
    const rows = [
      ...shown(section.items).map((item) => ({ item })),
      ...(section.groups ?? []).flatMap((group) => shown(group.items).map((item) => ({ item, group }))),
    ]
    for (const { item, group } of rows) {
      const name = item.name ?? group?.title ?? section.title
      if (typeof item.price === 'number') {
        out.push({ id: DRINK + item.id, name, volume: item.volume, price: item.price })
      }
      for (const variant of item.prices ?? []) {
        out.push({
          id: `${DRINK}${item.id}.${variant.id}`,
          name,
          label: variant.label,
          volume: variant.volume,
          amount: variant.amount,
          price: variant.price,
        })
      }
    }
  }
  return out
}

/** "BOTTLE · 350 ml", "150 ml", "SHOTS · 40 ml · 3 shots": what sets one offer of a drink apart, in English. */
export const variantOf = (offer) =>
  [offer.label?.en ?? offer.label?.pl, offer.volume, offer.amount].filter(Boolean).join(' · ')
