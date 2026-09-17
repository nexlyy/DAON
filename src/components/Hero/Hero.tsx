import { Link } from 'react-router-dom'
import { Calligraphy } from '@/components/Media/Calligraphy'
import { DishPhoto } from '@/components/Media/DishPhoto'
import { RoofMark } from '@/components/Brand/Logo'
import { Vine } from '@/components/Ornament/Vine'
import { OpenStatus } from '@/components/OpenStatus/OpenStatus'
import { dishPhotoAlt } from '@/data/menu/dishes'
import { useI18n } from '@/i18n/useI18n'
import styles from './Hero.module.css'

export function Hero() {
  const { t, resolve, path } = useI18n()
  const alt = (photo: string) => resolve(dishPhotoAlt(photo))

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
            <Link to={path('/menu')} className="btn">
              {t('hero.viewMenu')}
            </Link>
            <Link to={path('/reservation')} className="btn btn--ghost">
              {t('hero.bookTable')}
            </Link>
          </div>

          <OpenStatus to={path('/#hours')} />
        </div>

        <div className={styles.collage}>
          <figure className={`${styles.plate} ${styles.plateOne}`}>
            <DishPhoto
              photo="03"
              alt={alt('03')}
              sizes="(max-width: 900px) 46vw, 340px"
              priority
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateTwo}`}>
            <DishPhoto
              photo="38"
              alt={alt('38')}
              sizes="(max-width: 900px) 36vw, 250px"
            />
          </figure>
          <figure className={`${styles.plate} ${styles.plateThree}`}>
            <DishPhoto
              photo="60"
              alt={alt('60')}
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
