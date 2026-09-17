import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/useI18n'
import { usePromo } from '@/promo/usePromo'
import { BirthdaySeal } from './BirthdaySeal'
import styles from './BirthdayBand.module.css'

export function BirthdayBand() {
  const { t, path } = useI18n()
  const { phase, percent, dates, end } = usePromo()

  if (!phase) return null
  const active = phase === 'active'

  return (
    <section className={styles.band} aria-labelledby="birthday-title" data-phase={phase}>
      <div className={styles.frame} aria-hidden="true" />
      <div className={`shell ${styles.inner}`}>
        <div className={styles.figure} aria-hidden="true">
          <BirthdaySeal className={styles.seal} />
          <p className={styles.off}>
            <span className={styles.minus}>−</span>
            {percent}%
          </p>
          <p className={styles.every}>{t('promo.band.everyDish')}</p>
        </div>

        <div className={styles.copy}>
          <p className={`eyebrow ${styles.eyebrow}`}>{dates}</p>
          <h2 className={styles.title} id="birthday-title">
            {t(active ? 'promo.band.titleActive' : 'promo.band.title')}
          </h2>
          <p className={styles.body}>
            {t(active ? 'promo.band.bodyActive' : 'promo.band.body', { percent, end })}
          </p>
          <p className={styles.fine}>{t('promo.band.fine')}</p>
          <div className={styles.actions}>
            <Link to={path('/menu')} className={`btn ${styles.primary}`}>
              {t('promo.band.menu')}
            </Link>
            <Link to={path('/reservation')} className={`btn ${styles.secondary}`}>
              {t('hero.bookTable')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function MenuPromoNotice() {
  const { t } = useI18n()
  const { phase, percent, dates, end } = usePromo()

  if (!phase) return null

  return (
    <p className={styles.notice} data-phase={phase}>
      <BirthdaySeal className={styles.noticeSeal} />
      <span>
        {t(phase === 'active' ? 'promo.menu.active' : 'promo.menu.upcoming', {
          percent,
          dates,
          end,
        })}
      </span>
    </p>
  )
}
