import { Link } from 'react-router-dom'
import { RoofMark } from '@/components/Brand/Logo'
import { Vine } from '@/components/Ornament/Vine'
import { useI18n } from '@/i18n/useI18n'
import { asset } from '@/lib/asset'
import styles from './Hero.module.css'

/**
 * The cover of the printed menu is a gold hairline frame around a cream field
 * with the roof mark centred; the hero repeats that frame and hangs three
 * photographs off it the way the inside pages do.
 */
export function Hero() {
  const { t } = useI18n()

  return (
    <section className={styles.hero}>
      <div className={styles.frame} aria-hidden="true" />
      <Vine className={styles.vine} />

      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`eyebrow ${styles.eyebrow}`}>{t('hero.eyebrow')}</p>

          <h1 className={styles.wordmark}>
            <RoofMark className={styles.roof} />
            <span className={styles.word}>DAON</span>
          </h1>

          <p className={styles.tagline}>{t('hero.tagline')}</p>
          <p className={styles.lead}>{t('hero.lead')}</p>

          <div className={styles.actions}>
            <Link to="/menu" className="btn">
              {t('hero.viewMenu')}
            </Link>
            <Link to="/reservation" className="btn btn--ghost">
              {t('hero.bookTable')}
            </Link>
          </div>
        </div>

        <div className={styles.collage}>
          <figure className={`${styles.plate} ${styles.plateOne}`}>
            <img
              src={asset('images/dishes/03.webp')}
              alt="Bulgogi served with rice and side dishes"
              width={760}
              height={760}
              fetchPriority="high"
              decoding="async"
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateTwo}`}>
            <img
              src={asset('images/dishes/38.webp')}
              alt="Korean fried chicken glazed and scattered with spring onion"
              width={760}
              height={760}
              decoding="async"
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateThree}`}>
            <img
              src={asset('images/dishes/60.webp')}
              alt="Kimchi-jjigae simmering in a stone pot"
              width={760}
              height={760}
              decoding="async"
            />
          </figure>
          <img
            className={styles.seal}
            src={asset('images/titles/daon.webp')}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <a className={styles.scroll} href="#about">
        <span>{t('hero.scroll')}</span>
        <span className={styles.scrollLine} aria-hidden="true" />
      </a>
    </section>
  )
}
