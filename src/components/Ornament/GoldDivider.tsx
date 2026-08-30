import styles from './GoldDivider.module.css'

/**
 * The hairline-and-blossom rule that separates dishes on every page of the
 * printed menu.
 */
export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={[styles.divider, className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className={styles.rule} />
      <svg className={styles.bloom} viewBox="0 0 44 44" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M22 8c3.6 0 6.5 2.9 6.5 6.5S25.6 21 22 21s-6.5-2.9-6.5-6.5S18.4 8 22 8Z" />
          <path d="M33.6 17.2c1.1 3.4-.7 7.1-4.1 8.2s-7.1-.7-8.2-4.1 .7-7.1 4.1-8.2 7.1.7 8.2 4.1Z" />
          <path d="M29.2 30.9c-2.9 2.1-7 1.5-9.1-1.4s-1.5-7 1.4-9.1 7-1.5 9.1 1.4 1.5 7-1.4 9.1Z" />
          <path d="M14.8 30.9c-2.9-2.1-3.5-6.2-1.4-9.1s6.2-3.5 9.1-1.4 3.5 6.2 1.4 9.1-6.2 3.5-9.1 1.4Z" />
          <path d="M10.4 17.2c1.1-3.4 4.8-5.2 8.2-4.1s5.2 4.8 4.1 8.2-4.8 5.2-8.2 4.1-5.2-4.8-4.1-8.2Z" />
        </g>
        <circle cx="22" cy="22" r="2.1" fill="currentColor" opacity="0.55" />
      </svg>
      <span className={styles.rule} />
    </div>
  )
}
