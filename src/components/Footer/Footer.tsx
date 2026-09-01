import { Link } from 'react-router-dom'
import { Logo } from '@/components/Brand/Logo'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { OpeningHours } from '@/components/OpeningHours/OpeningHours'
import { restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import styles from './Footer.module.css'

export function Footer() {
  const { t } = useI18n()

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
              {restaurant.address.postalCode} {restaurant.address.city}
            </address>
            <a className={styles.link} href={restaurant.phoneHref}>
              {restaurant.phone}
            </a>
            <a className={styles.link} href={restaurant.emailHref}>
              {restaurant.email}
            </a>
            <a
              className={styles.link}
              href={restaurant.links.maps}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('home.visit.directions')}
            </a>
            <a
              className={styles.link}
              href={restaurant.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{restaurant.instagram}
            </a>
            <a
              className={`btn btn--delivery ${styles.delivery}`}
              href={restaurant.links.uberEats}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('footer.delivery')}
            </a>
          </div>

          <div className={styles.col}>
            <h2 className={styles.colTitle}>{t('footer.hours')}</h2>
            <OpeningHours labels="short" />
          </div>
        </div>

        <p className={styles.legal}>
          © {new Date().getFullYear()} {restaurant.legalName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
