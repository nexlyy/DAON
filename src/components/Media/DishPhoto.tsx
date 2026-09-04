import { asset } from '@/lib/asset'

interface Props {
  photo: string
  alt: string

  sizes?: string

  priority?: boolean
  className?: string
}

const LARGE = 640
const SMALL = 320

const set = (photo: string, ext: string) =>
  `${asset(`images/dishes/sm/${photo}.${ext}`)} ${SMALL}w, ` +
  `${asset(`images/dishes/${photo}.${ext}`)} ${LARGE}w`

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
