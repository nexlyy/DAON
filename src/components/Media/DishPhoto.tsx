import { asset } from '@/lib/asset'

interface Props {
  /** The photo's file name — the dish number as printed, e.g. "07". */
  photo: string
  alt: string
  /** How wide the photo will be drawn, for the browser to pick a file. */
  sizes?: string
  /** Set on the one photo above the fold; everything else loads lazily. */
  priority?: boolean
  className?: string
}

/** Widths on disk. The menu stores its photographs at around 400px square, so
 *  640 is as far as they are worth taking. */
const LARGE = 640
const SMALL = 320

const set = (photo: string, ext: string) =>
  `${asset(`images/dishes/sm/${photo}.${ext}`)} ${SMALL}w, ` +
  `${asset(`images/dishes/${photo}.${ext}`)} ${LARGE}w`

/**
 * A dish photograph, served as AVIF where the browser takes it and WebP
 * everywhere else. `picture` is laid out with `display: contents`, so the
 * surrounding CSS still styles the `img` directly.
 */
export function DishPhoto({
  photo,
  alt,
  sizes = '(max-width: 640px) 120px, (max-width: 900px) 50vw, 400px',
  priority = false,
  className,
}: Props) {
  return (
    <picture>
      <source type="image/avif" srcSet={set(photo, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set(photo, 'webp')} sizes={sizes} />
      <img
        className={className}
        src={asset(`images/dishes/${photo}.webp`)}
        alt={alt}
        width={LARGE}
        height={LARGE}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  )
}
