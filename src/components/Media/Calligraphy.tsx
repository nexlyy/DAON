import { asset } from '@/lib/asset'

interface Props {
  /** The category's calligraphy slug, e.g. "hansang". */
  name: string
  className?: string
  width?: number
  height?: number
}

/**
 * A section title in brush script, cut from the printed menu. Decorative: the
 * same words are always set in real text beside it.
 */
export function Calligraphy({ name, className, width, height }: Props) {
  return (
    <picture>
      <source type="image/avif" srcSet={asset(`images/titles/${name}.avif`)} />
      <img
        className={className}
        src={asset(`images/titles/${name}.webp`)}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  )
}
