import { Link } from 'react-router-dom'
import { categories } from '@/data/menu/categories'
import { dishes, dishFromPrice, featuredDishes } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { openingHours, restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useReveal } from '@/hooks/useReveal'
import { asset } from '@/lib/asset'
import { Hero } from '@/components/Hero/Hero'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { DishCard } from '@/components/Menu/DishCard'
import { DishDialog } from '@/components/Menu/DishDialog'
import { useState } from 'react'
import styles from './HomePage.module.css'

const weekOrder = [1, 2, 3, 4, 5, 6, 0]

export function HomePage() {
  const { t, resolve, list, formatPrice, locale } = useI18n()
  const [openDish, setOpenDish] = useState<Dish | null>(null)

  useDocumentMeta({ title: t('meta.title'), description: t('meta.description') })

  const aboutRef = useReveal<HTMLDivElement>()
  const signatureRef = useReveal<HTMLDivElement>()
  const categoriesRef = useReveal<HTMLDivElement>()
  const visitRef = useReveal<HTMLDivElement>()
  const ctaRef = useReveal<HTMLDivElement>()

  const featured = featuredDishes().slice(0, 6)
  const dayNames = list('days.long')
  const cheapest = Math.min(...dishes.map(dishFromPrice))

  return (
    <>
      <Hero />

      {/* About ------------------------------------------------------------ */}
      <section className={`section ${styles.about}`} id="about">
        <div className={`shell ${styles.aboutInner}`}>
          <div className={`reveal ${styles.aboutCopy}`} ref={aboutRef}>
            <p className="eyebrow">{t('home.about.eyebrow')}</p>
            <h2 className={styles.aboutTitle}>{t('home.about.title')}</h2>
            <p className={`lede ${styles.aboutBody}`}>{t('home.about.body')}</p>
            <p className={styles.aboutNote}>{t('home.about.note')}</p>

            <dl className={styles.stats}>
              <div>
                <dt>{dishes.length}</dt>
                <dd>{t('home.about.stats.dishes')}</dd>
              </div>
              <div>
                <dt>{categories.length}</dt>
                <dd>{t('home.about.stats.chapters')}</dd>
              </div>
              <div>
                <dt>{formatPrice(cheapest)}</dt>
                <dd>{t('home.about.stats.from')}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.aboutMedia}>
            <figure className={styles.aboutPhoto}>
              <img
                src={asset('images/dishes/19.webp')}
                alt="Basic kimbap sliced into rounds"
                width={760}
                height={760}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <figure className={`${styles.aboutPhoto} ${styles.aboutPhotoSmall}`}>
              <img
                src={asset('images/dishes/82.webp')}
                alt="Haemul pajeon, a seafood and spring onion pancake"
                width={760}
                height={760}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* Signature dishes ------------------------------------------------- */}
      <section className={`section ${styles.signature}`}>
        <div className="shell">
          <header className={`reveal ${styles.sectionHead}`} ref={signatureRef}>
            <p className="eyebrow eyebrow--center">{t('home.signature.eyebrow')}</p>
            <h2>{t('home.signature.title')}</h2>
            <p className="lede">{t('home.signature.subtitle')}</p>
          </header>

          <div className={styles.signatureGrid}>
            {featured.map((dish, index) => (
              <DishCard key={dish.id} dish={dish} index={index} onOpen={setOpenDish} />
            ))}
          </div>

          <div className={styles.sectionAction}>
            <Link to="/menu" className="btn btn--ghost">
              {t('home.signature.all')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories ------------------------------------------------------- */}
      <section className={`section ${styles.categories}`}>
        <div className="shell">
          <header className={`reveal ${styles.sectionHead}`} ref={categoriesRef}>
            <p className="eyebrow eyebrow--center">{t('home.categories.eyebrow')}</p>
            <h2>{t('home.categories.title')}</h2>
            <p className="lede">{t('home.categories.subtitle')}</p>
          </header>

          <ul className={styles.categoryList}>
            {categories.map((category) => {
              const count = dishes.filter((dish) => dish.categoryId === category.id).length
              return (
                <li key={category.id}>
                  <Link to="/menu" className={styles.categoryCard}>
                    <img
                      src={asset(`images/titles/${category.calligraphy}.webp`)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className={styles.categoryName}>{resolve(category.name)}</span>
                    <span className={styles.categoryMeta}>
                      {locale !== 'ko' && <span lang="ko">{category.ko}</span>}
                      <span>{t('menu.results', { count })}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Visit ------------------------------------------------------------ */}
      <section className={`section ${styles.visit}`} id="visit">
        <div className={`shell ${styles.visitInner}`}>
          <div className={`reveal ${styles.visitCopy}`} ref={visitRef}>
            <p className="eyebrow">{t('home.visit.eyebrow')}</p>
            <h2>{t('home.visit.title')}</h2>

            <div className={styles.visitBlock}>
              <h3>{t('home.visit.address')}</h3>
              <address>
                {restaurant.address.street ?? t('home.visit.addressPending')}
                <br />
                {restaurant.address.city}, {restaurant.address.country}
              </address>
              <a
                className={styles.visitLink}
                href={restaurant.address.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('home.visit.directions')} →
              </a>
            </div>

            <div className={styles.visitBlock}>
              <h3>{t('home.visit.contact')}</h3>
              <a className={styles.visitLink} href={restaurant.phoneHref}>
                {restaurant.phone}
              </a>
              <a
                className={styles.visitLink}
                href={restaurant.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                @{restaurant.instagram}
              </a>
            </div>
          </div>

          <div className={styles.hoursCard}>
            <h3 className={styles.hoursTitle}>{t('home.visit.hours')}</h3>
            <GoldDivider />
            <dl className={styles.hours}>
              {weekOrder.map((day) => {
                const entry = openingHours.find((item) => item.day === day)
                const isToday = new Date().getDay() === day
                return (
                  <div key={day} data-today={isToday || undefined}>
                    <dt>{dayNames[day]}</dt>
                    <dd>{entry ? `${entry.open} – ${entry.close}` : t('common.closed')}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Reservation CTA -------------------------------------------------- */}
      <section className={styles.cta}>
        <div className={`shell ${styles.ctaInner}`}>
          <div className={`reveal ${styles.ctaCopy}`} ref={ctaRef}>
            <h2>{t('home.cta.title')}</h2>
            <p>{t('home.cta.body')}</p>
            <Link to="/reservation" className={`btn ${styles.ctaButton}`}>
              {t('home.cta.button')}
            </Link>
          </div>
        </div>
      </section>

      <DishDialog dish={openDish} onClose={() => setOpenDish(null)} />
    </>
  )
}
