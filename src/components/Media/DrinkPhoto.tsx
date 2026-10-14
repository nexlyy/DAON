import { asset } from '@/lib/asset'

interface Props {
  photo: string
  alt: string
  ratio?: number
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * A drink's photograph. The ones read out of the printed menu ship with the
 * site at 360 and 1000 pixels; one uploaded from the admin panel is "u:name"
 * and lives with the other uploads at 320 and 640, like a dish.
 */
export function DrinkPhoto({
  photo,
  alt,
  ratio = 1.5,
  sizes = '(max-width: 720px) 100vw, 420px',
  priority = false,
  className,
}: Props) {
  const uploaded = photo.startsWith('u:')
  const name = uploaded ? photo.slice(2) : photo
  const dir = uploaded ? 'u/drinks' : 'images/drinks'
  const [small, large] = uploaded ? [320, 640] : [360, 1000]
  const file = (ext: string, tier = '') => asset(`${dir}/${tier}${name}.${ext}`)
  const set = (ext: string) => `${file(ext, 'sm/')} ${small}w, ${file(ext)} ${large}w`

  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        className={className}
        src={file('webp')}
        alt={alt}
        width={large}
        height={Math.round(large / ratio)}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  )
}
