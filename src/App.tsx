import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar/Navbar'
import { Footer } from '@/components/Footer/Footer'
import { LanguageHint } from '@/components/LanguageSwitcher/LanguageHint'
import { HomePage } from '@/pages/Home/HomePage'
import { MenuPage } from '@/pages/Menu/MenuPage'
import { DrinksPage } from '@/pages/Drinks/DrinksPage'
import { ReservationPage } from '@/pages/Reservation/ReservationPage'
import { NotFoundPage } from '@/pages/NotFound/NotFoundPage'
import { PrivacyPage } from '@/pages/Privacy/PrivacyPage'
import { LOCALE_PREFIX } from '@/i18n/config'
import { useI18n } from '@/i18n/useI18n'
import { track } from '@/lib/analytics'
import styles from './App.module.css'

const LOCALE_ROUTES = Object.values(LOCALE_PREFIX)

const PAGES: [string, ReactNode][] = [
  ['/', <HomePage />],
  ['/about', <HomePage />],
  ['/contact', <HomePage />],
  ['/menu', <MenuPage />],
  ['/reservation', <ReservationPage />],
  ['/drinks/:key', <DrinksPage />],
  ['/privacy', <PrivacyPage />],
]

export function App() {
  const { t, switching, page, locale } = useI18n()

  useEffect(() => {
    document.documentElement.removeAttribute('data-boot')
  }, [])

  useEffect(() => {
    track('view', { page: page.startsWith('/drinks/') ? '/drinks' : page, locale })
  }, [page])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]')
      const href = link?.getAttribute('href') ?? ''
      if (href.startsWith('tel:')) track('call')
      else if (href.includes('ubereats.com')) track(href.includes('diningMode=PICKUP') ? 'pickup' : 'delivery')
      else if (href.includes('google.com/maps')) track('directions')
      else if (href.includes('instagram.com')) track('instagram')
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      <Navbar />
      <ScrollBehaviour />
      <main id="main" className={styles.main} data-switching={switching || undefined}>
        <Routes>
          {LOCALE_ROUTES.flatMap((prefix) =>
            PAGES.map(([page, element]) => (
              <Route key={`${prefix}${page}`} path={`${prefix}${page}`} element={element} />
            )),
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <LanguageHint />
    </>
  )
}

const SECTIONS: Record<string, string> = {
  '/about': 'about',
  '/contact': 'contact',
}

function ScrollBehaviour() {
  const { hash } = useLocation()
  const { page } = useI18n()

  useEffect(() => {
    const id = SECTIONS[page] ?? (hash ? hash.slice(1) : '')
    if (id) {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [page, hash])

  return null
}
