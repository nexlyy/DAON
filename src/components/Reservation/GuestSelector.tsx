import { useState } from 'react'
import { reservation as reservationConfig, restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'
import styles from './GuestSelector.module.css'

interface Props {
  value: number | null
  onChange: (partySize: number) => void
}

export function GuestSelector({ value, onChange }: Props) {
  const { t } = useI18n()
  const { partySizes, maxPartySize } = reservationConfig
  const largest = partySizes[partySizes.length - 1]

  const [expanded, setExpanded] = useState(() => value !== null && value > largest)

  const showLargeNote = (value ?? 0) >= largest

  return (
    <div className={styles.wrap}>
      <div className={styles.options} role="group" aria-label={t('reservation.guests.title')}>
        {partySizes.slice(0, -1).map((size) => (
          <button
            key={size}
            type="button"
            className={styles.option}
            aria-pressed={value === size}
            onClick={() => {
              setExpanded(false)
              onChange(size)
            }}
          >
            <span className={styles.number}>{size}</span>
            <span className={styles.caption}>
              {size === 1 ? t('reservation.guests.person') : t('reservation.guests.people')}
            </span>
          </button>
        ))}

        <button
          type="button"
          className={styles.option}
          data-wide
          aria-pressed={expanded || (value ?? 0) >= largest}
          onClick={() => {
            setExpanded(true)
            if ((value ?? 0) < largest) onChange(largest)
          }}
        >
          <span className={styles.number}>{t('reservation.guests.sixPlus')}</span>
          <span className={styles.caption}>{t('reservation.guests.people')}</span>
        </button>
      </div>

      {expanded && (
        <div className={styles.stepper}>
          <label className={styles.stepperLabel} htmlFor="party-size">
            {t('reservation.guests.custom')}
          </label>
          <div className={styles.stepperControls}>
            <button
              type="button"
              onClick={() => onChange(Math.max(largest, (value ?? largest) - 1))}
              aria-label="-"
            >
              −
            </button>
            <input
              id="party-size"
              type="number"
              inputMode="numeric"
              min={largest}
              max={maxPartySize}
              value={value ?? largest}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (Number.isFinite(next)) {
                  onChange(Math.min(maxPartySize, Math.max(largest, next)))
                }
              }}
            />
            <button
              type="button"
              onClick={() => onChange(Math.min(maxPartySize, (value ?? largest) + 1))}
              aria-label="+"
            >
              +
            </button>
          </div>
        </div>
      )}

      {showLargeNote && (
        <p className={styles.note}>
          {t('reservation.guests.large', { count: maxPartySize, phone: restaurant.phone })}
        </p>
      )}
    </div>
  )
}
