import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/useI18n'
import { RoofMark } from '@/components/Brand/Logo'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div className={styles.page}>
      <RoofMark className={styles.mark} />
      <h1 className={styles.title}>{t('common.notFound')}</h1>
      <p className={styles.body}>{t('common.notFoundBody')}</p>
      <div className={styles.actions}>
        <Link to="/" className="btn">
          {t('common.backHome')}
        </Link>
        <Link to="/menu" className="btn btn--ghost">
          {t('nav.menu')}
        </Link>
      </div>
    </div>
  )
}
