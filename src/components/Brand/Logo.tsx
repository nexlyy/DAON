import type { CSSProperties } from 'react'
import { asset } from '@/lib/asset'
import styles from './Logo.module.css'

interface LogoProps {
  
  variant?: 'full' | 'mark'
  
  withTagline?: boolean
  tagline?: string
  className?: string
}

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
