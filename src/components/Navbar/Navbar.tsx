import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Brand/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher'
import { useI18n } from '@/i18n/useI18n'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import styles from './Navbar.module.css'

const links = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/menu', key: 'nav.menu' },
  { to: '/#about', key: 'nav.about' },
  { to: '/reservation', key: 'nav.reservation' },
  { to: '/#contact', key: 'nav.contact' },
]

export function Navbar() {
  const { t } = useI18n()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useLockBodyScroll(drawerOpen)

  // The bar condenses once the hero is behind it, and slides away while the
  // guest scrolls down so the menu photographs get the full screen.
  useEffect(() => {
    let previous = window.scrollY

    const onScroll = () => {
      const current = window.scrollY
      setScrolled(current > 24)
      setHidden(current > 320 && current > previous + 4)
      previous = current
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Anything else that sticks to the top of the page (the menu filter bar) reads
  // `--nav-offset` so it tucks under the bar and rides up with it when it hides.
  // The bar is a different height on a phone, so a rotation has to re-measure.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const publish = () => {
      const offset = hidden && !drawerOpen ? 0 : header.offsetHeight
      document.documentElement.style.setProperty('--nav-offset', `${offset}px`)
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
    <header
      ref={headerRef}
      className={styles.header}
      data-scrolled={scrolled || undefined}
      data-hidden={(hidden && !drawerOpen) || undefined}
    >
      <div className={styles.bar}>
        <Link to="/" className={styles.brand} aria-label="DAON">
          <Logo />
        </Link>

        <nav className={styles.desktopNav} aria-label={t('nav.home')}>
          {links.map((link) => (
            <NavItem key={link.to} to={link.to} end={link.end}>
              {t(link.key)}
            </NavItem>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher />
          <Link to="/reservation" className={`btn ${styles.cta}`}>
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
              to={link.to}
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
          <LanguageSwitcher variant="inline" />
        </div>
      </div>
    </header>
  )
}

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  const location = useLocation()

  // Hash links point at sections of the home page, so their active state has to
  // follow the hash rather than the router match.
  if (to.includes('#')) {
    const hash = `#${to.split('#')[1]}`
    const active = location.pathname === '/' && location.hash === hash
    return (
      <Link to={to} className={styles.navLink} data-active={active || undefined}>
        {children}
      </Link>
    )
  }

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
