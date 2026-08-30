import { useI18n } from '@/i18n/useI18n'
import styles from './StepIndicator.module.css'

interface Props {
  steps: readonly string[]
  current: number
  onJump: (index: number) => void
}

export function StepIndicator({ steps, current, onJump }: Props) {
  const { t } = useI18n()

  return (
    <ol className={styles.steps}>
      {steps.map((step, index) => {
        const state = index === current ? 'current' : index < current ? 'done' : 'todo'
        return (
          <li key={step} className={styles.step} data-state={state}>
            <button
              type="button"
              className={styles.button}
              disabled={index > current}
              aria-current={index === current ? 'step' : undefined}
              onClick={() => onJump(index)}
            >
              <span className={styles.dot}>
                {state === 'done' ? <Check /> : <span>{index + 1}</span>}
              </span>
              <span className={styles.label}>{t(`reservation.steps.${step}`)}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true" focusable="false">
      <path
        d="M2.5 7.4l3 3 6-6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
