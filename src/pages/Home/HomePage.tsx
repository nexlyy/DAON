import { Link } from 'react-router-dom'
import { OrderLink } from '@/components/Order/OrderLink'
import { Calligraphy } from '@/components/Media/Calligraphy'
import { DishPhoto } from '@/components/Media/DishPhoto'
import { categories } from '@/data/menu/categories'
import { dishes, featuredDishes } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useReveal } from '@/hooks/useReveal'
import { Hero } from '@/components/Hero/Hero'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { OpeningHours } from '@/components/OpeningHours/OpeningHours'
import { DishCard } from '@/components/Menu/DishCard'
import { DishDialog } from '@/components/Menu/DishDialog'
import { useCallback, useState } from 'react'
import styles from './HomePage.module.css'

export function HomePage() {
  const { t, resolve, formatPrice, locale } = useI18n()
  const [openDish, setOpenDish] = useState<Dish | null>(null)
  
  const closeDish = useCallback(() => setOpenDish(null), [])

  useDocumentMeta({ title: t('meta.title'), description: t('meta.description') })

  const aboutRef = useReveal<HTMLDivElement>()
  const signatureRef = useReveal<HTMLDivElement>()
  const categoriesRef = useReveal<HTMLDivElement>()
  const visitRef = useReveal<HTMLDivElement>()
  const ctaRef = useReveal<HTMLDivElement>()

  const featured = featuredDishes().slice(0, 6)
  const cheapest = Math.min(...dishes.map((dish) => dish.price))

  return (
    <>
      <Hero />

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
              <DishPhoto
                photo="19"
                alt="Basic kimbap sliced into rounds"
                sizes="(max-width: 900px) 60vw, 420px"
              />
            </figure>
            <figure className={`${styles.aboutPhoto} ${styles.aboutPhotoSmall}`}>
              <DishPhoto
                photo="82"
                alt="Haemul pajeon, a seafood and spring onion pancake"
                sizes="(max-width: 900px) 34vw, 240px"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className={`section ${styles.signature}`}>
        <div className="shell">
          <header className={`reveal ${styles.sectionHead}`} ref={signatureRef}>
            <p className="eyebrow eyebrow--center">{t('home.signature.eyebrow')}</p>
            <h2>{t('home.signature.title')}</h2>
            <p className="lede">{t('home.signature.subtitle')}</p>
          </header>

          <div className={`${styles.signatureGrid} shelf`}>
            {featured.map((dish, index) => (
              <DishCard
                key={dish.id}
                dish={dish}
                index={index}
                variant="card"
                onOpen={setOpenDish}
              />
            ))}
          </div>

          <div className={styles.sectionAction}>
            <Link to="/menu" className="btn btn--ghost">
              {t('home.signature.all')}
            </Link>
          </div>
        </div>
      </section>

      <section className={`section ${styles.categories}`}>
        <div className="shell">
          <header className={`reveal ${styles.sectionHead}`} ref={categoriesRef}>
            <p className="eyebrow eyebrow--center">{t('home.categories.eyebrow')}</p>
            <h2>{t('home.categories.title')}</h2>
            <p className="lede">{t('home.categories.subtitle')}</p>
          </header>

          <ul className={`${styles.categoryList} shelf`}>
            {categories.map((category) => {
              const count = dishes.filter((dish) => dish.categoryId === category.id).length
              return (
                <li key={category.id}>
                  <Link to="/menu" className={styles.categoryCard}>
                    <Calligraphy name={category.calligraphy} />
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

      <section className={`section ${styles.visit}`} id="contact">
        <div className={`shell ${styles.visitInner}`}>
          <div className={`reveal ${styles.visitCopy}`} ref={visitRef}>
            <p className="eyebrow">{t('home.visit.eyebrow')}</p>
            <h2>{t('home.visit.title')}</h2>

            <div className={styles.visitBlock}>
              <h3>{t('home.visit.address')}</h3>
              <address>
                {restaurant.address.street}
                <br />
                {restaurant.address.postalCode} {restaurant.address.city}
              </address>
              <a
                className={styles.visitLink}
                href={restaurant.links.maps}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('home.visit.directions')} →
              </a>
            </div>

            <div className={styles.visitBlock}>
              <h3>{t('home.visit.contact')}</h3>
              <a className={styles.visitLink} href={restaurant.phoneHref}>
                {restaurant.phone}
              </a>
              <a className={styles.visitLink} href={restaurant.emailHref}>
                {restaurant.email}
              </a>
              <a
                className={styles.visitLink}
                href={restaurant.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{restaurant.instagram}
              </a>
            </div>

            <div className={styles.order}>
              <p className={styles.orderTitle}>{t('order.title')}</p>
              <div className={styles.orderButtons}>
                <OrderLink kind="delivery" />
                <OrderLink kind="pickup" />
              </div>
              <p className={styles.orderNote}>{t('order.note')}</p>
            </div>
          </div>

          <div className={styles.hoursCard}>
            <h3 className={styles.hoursTitle}>{t('home.visit.hours')}</h3>
            <GoldDivider />
            <OpeningHours />
          </div>
        </div>
      </section>

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

      <DishDialog dish={openDish} onClose={closeDish} />
    </>
  )
}
