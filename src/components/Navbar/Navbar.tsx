import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Brand/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher'
import { OpenStatus } from '@/components/OpenStatus/OpenStatus'
import { OrderLink } from '@/components/Order/OrderLink'
import { PromoRibbon } from '@/components/Promo/PromoRibbon'
import { useI18n } from '@/i18n/useI18n'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import styles from './Navbar.module.css'

const links = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/menu', key: 'nav.menu' },
  { to: '/about', key: 'nav.about' },
  { to: '/reservation', key: 'nav.reservation' },
  { to: '/contact', key: 'nav.contact' },
]

export function Navbar() {
  const { t, path } = useI18n()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useLockBodyScroll(drawerOpen)

  /**
   * The bar gets out of the way going down the page and comes back on the way
   * up. On a phone that reads as flickering unless it is deliberate about it:
   * the address bar collapsing, the rubber band at the end of a list and a
   * finger that wobbles all arrive as small scrolls in the wrong direction. So
   * it only moves once the page has travelled a real distance one way, and
   * near the top it is always there.
   */
  useEffect(() => {
    const TRAVEL = 64
    // Always there at the top of a page; between here and a full screen down
    // it simply stays as it is, so hovering around that line does not blink.
    const ALWAYS_SHOWN_BELOW = 200
    const CAN_HIDE_BELOW = 320

    let last = Math.max(0, window.scrollY)
    let turned = last
    let goingDown = true
    let frame = 0

    const measure = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      setScrolled(y > 24)

      if (y !== last) {
        const down = y > last
        if (down !== goingDown) {
          goingDown = down
          turned = last
        }
        last = y
      }

      if (y <= ALWAYS_SHOWN_BELOW) {
        turned = y
        setHidden(false)
        return
      }

      if (y < CAN_HIDE_BELOW && goingDown) return
      if (Math.abs(y - turned) >= TRAVEL) setHidden(goingDown)
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const publish = () => {
      const away = hidden && !drawerOpen
      document.documentElement.style.setProperty('--nav-offset', `${away ? 0 : header.offsetHeight}px`)
      document.documentElement.toggleAttribute('data-nav-away', away)
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(header)
    return () => observer.disconnect()
  }, [hidden, drawerOpen, scrolled])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  return (
    <>
      <header
        ref={headerRef}
        className={styles.header}
        data-scrolled={scrolled || undefined}
        data-hidden={(hidden && !drawerOpen) || undefined}
      >
        <PromoRibbon />
        <div className={styles.bar}>
          <Link to={path('/')} className={styles.brand} aria-label="DAON">
            <Logo />
          </Link>

          <nav className={styles.desktopNav} aria-label={t('nav.home')}>
            {links.map((link) => (
              <NavItem key={link.to} to={path(link.to)} end={link.end}>
                {t(link.key)}
              </NavItem>
            ))}
          </nav>

          <div className={styles.actions}>
            <LanguageSwitcher />
            <OrderLink kind="pickup" className={`${styles.cta} ${styles.pickup}`} />
            <OrderLink kind="delivery" className={styles.cta} />
            <Link to={path('/reservation')} className={`btn ${styles.cta}`}>
              {t('nav.reservation')}
            </Link>
            <button
              type="button"
              className={styles.burger}
              aria-expanded={drawerOpen}
              aria-controls="daon-mobile-nav"
              aria-label={drawerOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <span className={styles.burgerBox} data-open={drawerOpen || undefined}>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={styles.scrim}
        data-open={drawerOpen || undefined}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div id="daon-mobile-nav" className={styles.drawer} data-open={drawerOpen || undefined}>
        <nav className={styles.drawerNav} aria-label={t('nav.openMenu')}>
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              to={path(link.to)}
              end={link.end}
              className={styles.drawerLink}
              style={{ transitionDelay: drawerOpen ? `${90 + index * 45}ms` : '0ms' }}
            >
              <span className={styles.drawerIndex}>{String(index + 1).padStart(2, '0')}</span>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <div className={styles.drawerFooter}>
          <OpenStatus variant="line" />
          <div className={styles.drawerOrder}>
            <OrderLink kind="delivery" />
            <OrderLink kind="pickup" />
          </div>
          <LanguageSwitcher variant="inline" />
        </div>
      </div>
    </>
  )
}

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
      }
    >
      {children}
    </NavLink>
  )
}
