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

/**
 * A photograph is either one of the ones that ship with the site or one
 * uploaded from the admin panel, which live outside the published directory so
 * a deploy cannot take them down. The name says which: "u:" is an upload.
 */
const file = (photo: string, ext: string, small = false) => {
  const uploaded = photo.startsWith('u:')
  const name = uploaded ? photo.slice(2) : photo
  const dir = uploaded ? 'u/dishes' : 'images/dishes'
  return asset(`${dir}/${small ? 'sm/' : ''}${name}.${ext}`)
}

const set = (photo: string, ext: string) =>
  `${file(photo, ext, true)} ${SMALL}w, ${file(photo, ext)} ${LARGE}w`

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
        src={file(photo, 'webp')}
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
