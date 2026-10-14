import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n/useI18n'
import styles from './MenuSwitch.module.css'

/**
 * The food and the drinks are two halves of one menu, so they share one place
 * in the navigation and this switch at the top of both.
 */
export function MenuSwitch() {
  const { t, path } = useI18n()
  return (
    <nav className={styles.switch} aria-label={t('menu.switch.label')}>
      <NavLink to={path('/menu')} className={styles.option} end>
        {t('menu.switch.food')}
      </NavLink>
      <NavLink to={path('/drinks')} className={styles.option} end>
        {t('menu.switch.drinks')}
      </NavLink>
    </nav>
  )
}
