import { Link } from 'react-router-dom'
import { Logo } from '@/components/Brand/Logo'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { openingHours, restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import styles from './Footer.module.css'

/** Monday first, the way Polish and Korean calendars read. */
const weekOrder = [1, 2, 3, 4, 5, 6, 0]

export function Footer() {
  const { t, list } = useI18n()
  const dayNames = list('days.short')

  return (
    <footer className={styles.footer} id="contact">
      <div className="shell">
        <GoldDivider className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Logo withTagline tagline={t('footer.tagline')} className={styles.logo} />
            <p className={styles.blurb}>{t('hero.tagline')}</p>
          </div>

          <nav className={styles.col} aria-labelledby="footer-explore">
            <h2 className={styles.colTitle} id="footer-explore">
              {t('footer.explore')}
            </h2>
            <Link to="/" className={styles.link}>
              {t('nav.home')}
            </Link>
            <Link to="/menu" className={styles.link}>
              {t('nav.menu')}
            </Link>
            <Link to="/#about" className={styles.link}>
              {t('nav.about')}
            </Link>
            <Link to="/reservation" className={styles.link}>
              {t('nav.reservation')}
            </Link>
          </nav>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>{t('footer.visit')}</h2>
            <address className={styles.address}>
              {restaurant.address.street}
              <br />
              {restaurant.address.city}, {restaurant.address.country}
            </address>
            <a className={styles.link} href={restaurant.phoneHref}>
              {restaurant.phone}
            </a>
            <a
              className={styles.link}
              href={restaurant.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              @{restaurant.instagram}
            </a>
          </div>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>{t('footer.hours')}</h2>
            <dl className={styles.hours}>
              {weekOrder.map((day) => {
                const entry = openingHours.find((item) => item.day === day)
                return (
                  <div className={styles.hoursRow} key={day}>
                    <dt>{dayNames[day]}</dt>
                    <dd>{entry ? `${entry.open}–${entry.close}` : t('common.closed')}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>

        <p className={styles.legal}>
          © {new Date().getFullYear()} {restaurant.legalName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
