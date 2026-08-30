import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar/Navbar'
import { Footer } from '@/components/Footer/Footer'
import { HomePage } from '@/pages/Home/HomePage'
import { MenuPage } from '@/pages/Menu/MenuPage'
import { ReservationPage } from '@/pages/Reservation/ReservationPage'
import { NotFoundPage } from '@/pages/NotFound/NotFoundPage'
import { useI18n } from '@/i18n/useI18n'
import styles from './App.module.css'

export function App() {
  const { t, switching } = useI18n()

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      <Navbar />
      <ScrollBehaviour />
      <main id="main" className={styles.main} data-switching={switching || undefined}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

/** Jumps to the top on navigation, or to the anchor when the URL carries one. */
function ScrollBehaviour() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}
