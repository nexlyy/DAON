import styles from './Vine.module.css'

export function Vine({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={[styles.vine, className].filter(Boolean).join(' ')}
      data-flip={flip || undefined}
      viewBox="0 0 160 520"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M96 4c-6 34-2 62 8 88 12 30 16 58 6 88-10 30-30 52-38 82-8 30-2 58 14 84 12 20 18 40 16 62" />
      <path d="M104 92c14-14 30-20 48-18-6 16-18 27-34 31-8 2-12 0-14-13Z" />
      <path d="M100 84c-14-10-30-13-46-8 8 14 21 22 37 23 7 0 9-3 9-15Z" />
      <path d="M110 182c16-6 32-4 46 6-12 12-27 16-43 11-7-2-8-6-3-17Z" />
      <path d="M96 176c-16-2-31 2-43 14 14 8 30 8 44 0 6-4 6-8-1-14Z" />
      <path d="M72 292c-16 2-30 10-39 24 16 5 32 2 44-9 6-5 5-9-5-15Z" />
      <path d="M84 286c10-14 24-22 41-24-2 16-11 29-26 35-7 3-11 1-15-11Z" />
      <path d="M74 400c-15 4-27 14-34 29 16 3 31-2 41-14 5-6 4-10-7-15Z" />
      <circle cx="100" cy="88" r="3" />
      <circle cx="103" cy="180" r="3" />
      <circle cx="79" cy="290" r="3" />
    </svg>
  )
}
