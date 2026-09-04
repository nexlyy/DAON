import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { ReservationFlow } from '@/components/Reservation/ReservationFlow'
import styles from './ReservationPage.module.css'

export function ReservationPage() {
  const { t } = useI18n()
  useDocumentMeta({ title: t('meta.reservationTitle'), description: t('meta.description'), path: '/reservation' })

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className="shell">
          <p className="eyebrow">{t('reservation.eyebrow')}</p>
          <h1 className={styles.title}>{t('reservation.title')}</h1>
          <p className={`lede ${styles.subtitle}`}>{t('reservation.subtitle')}</p>
        </div>
      </header>

      <div className={`shell ${styles.body}`}>
        <ReservationFlow />
      </div>
    </div>
  )
}
