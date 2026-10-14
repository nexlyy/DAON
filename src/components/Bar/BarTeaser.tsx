import { Link } from 'react-router-dom'
import { DrinkPhoto } from '@/components/Media/DrinkPhoto'
import { drinkOffers, drinksMenu, pickText, variantText } from '@/data/drinks'
import { useReveal } from '@/hooks/useReveal'
import { useI18n } from '@/i18n/useI18n'
import styles from './BarTeaser.module.css'

// What the bar is known for, by the sections the printed list gives them: the
// two-litre bowl, the beer tower and soju. A section the list no longer has is
// simply left out.
const HIGHLIGHTS = ['cocktail-bowl', 'beer-tower', 'korean-alcohols']

/**
 * The drinks on the home page: three of the cocktails in the round frames the
 * site uses for food, what the bar is known for with its price, and the way to
 * the whole list.
 */
export function BarTeaser() {
  const { t, locale, path, formatPrice } = useI18n()
  const ref = useReveal<HTMLDivElement>()

  const offers = drinkOffers()
  const highlights = HIGHLIGHTS.map((id) => offers.find((offer) => offer.sectionId === id)).filter(
    (offer): offer is NonNullable<typeof offer> => Boolean(offer),
  )
  const photos = drinksMenu.sections
    .filter((section) => section.layout === 'cards')
    .flatMap((section) => section.items ?? [])
    .filter((item) => item.photo)
    .slice(0, 3)

  if (drinksMenu.sections.length === 0) return null

  return (
    <section className={`section ${styles.bar}`} id="bar">
      <div className={`shell ${styles.inner}`}>
        <div className={`reveal ${styles.copy}`} ref={ref}>
          <p className="eyebrow">{t('home.bar.eyebrow')}</p>
          <h2 className={styles.title}>{t('home.bar.title')}</h2>
          <p className={`lede ${styles.lede}`}>{t('home.bar.lede')}</p>

          {highlights.length > 0 && (
            <ul className={styles.list}>
              {highlights.map((offer) => {
                // A row inside a group is named by it: the beer tower is "WIEŻA
                // PIWA 4 L", with "Piwo beczkowe" under it, not the other way.
                const grouped = offer.groupTitle && offer.groupTitle !== offer.name
                const title = grouped ? pickText(locale, offer.groupTitle) : pickText(locale, offer.name)
                const detail = [grouped ? pickText(locale, offer.name) : '', variantText(locale, offer)]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <li key={offer.id} className={styles.row}>
                    <span className={styles.name}>
                      {title}
                      {detail && <em className={styles.detail}>{detail}</em>}
                    </span>
                    <span className={styles.dots} aria-hidden="true" />
                    <span className={styles.price}>{formatPrice(offer.price)}</span>
                  </li>
                )
              })}
            </ul>
          )}

          <Link to={path('/drinks')} className={`btn ${styles.cta}`}>
            {t('home.bar.cta')}
          </Link>
        </div>

        {photos.length > 0 && (
          <div className={styles.media} aria-hidden="true">
            {photos.map((item, index) => (
              <figure key={item.id} className={styles.photo} data-place={index}>
                <DrinkPhoto photo={item.photo!} alt="" ratio={item.ratio} sizes="(max-width: 720px) 60vw, 320px" />
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
