import { Link } from 'react-router-dom'
import { Calligraphy } from '@/components/Media/Calligraphy'
import { DishPhoto } from '@/components/Media/DishPhoto'
import { RoofMark } from '@/components/Brand/Logo'
import { Vine } from '@/components/Ornament/Vine'
import { useI18n } from '@/i18n/useI18n'
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
            <DishPhoto
              photo="03"
              alt="Bulgogi served with rice and side dishes"
              sizes="(max-width: 900px) 46vw, 340px"
              priority
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateTwo}`}>
            <DishPhoto
              photo="38"
              alt="Korean fried chicken glazed and scattered with spring onion"
              sizes="(max-width: 900px) 36vw, 250px"
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateThree}`}>
            <DishPhoto
              photo="60"
              alt="Kimchi-jjigae simmering in a stone pot"
              sizes="(max-width: 900px) 30vw, 210px"
            />
          </figure>
          <Calligraphy className={styles.seal} name="daon" />
        </div>
      </div>

      <a className={styles.scroll} href="#about">
        <span>{t('hero.scroll')}</span>
        <span className={styles.scrollLine} aria-hidden="true" />
      </a>
    </section>
  )
}
