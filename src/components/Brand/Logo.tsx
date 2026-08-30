import type { CSSProperties } from 'react'
import { asset } from '@/lib/asset'
import styles from './Logo.module.css'

interface LogoProps {
  /** `full` pairs the roof mark with the wordmark; `mark` is the roof alone. */
  variant?: 'full' | 'mark'
  /** Adds the "Korean Restaurant" line under the wordmark. */
  withTagline?: boolean
  tagline?: string
  className?: string
}

/**
 * The giwa roof from the cover of the DAON menu, traced off the original artwork
 * and applied as a CSS mask so it inherits `currentColor` — one asset that works
 * on cream, on navy, and inside the success seal.
 */
export function RoofMark({ className }: { className?: string }) {
  return (
    <span
      className={[styles.mark, className].filter(Boolean).join(' ')}
      style={{ '--mark-src': `url(${asset('images/logo-mark.png')})` } as CSSProperties}
      aria-hidden="true"
    />
  )
}

export function Logo({ variant = 'full', withTagline = false, tagline, className }: LogoProps) {
  return (
    <span className={[styles.logo, className].filter(Boolean).join(' ')} data-variant={variant}>
      <RoofMark />
      {variant === 'full' && (
        <span className={styles.text}>
          <span className={styles.word}>DAON</span>
          {withTagline && tagline && <span className={styles.tagline}>{tagline}</span>}
        </span>
      )}
    </span>
  )
}
