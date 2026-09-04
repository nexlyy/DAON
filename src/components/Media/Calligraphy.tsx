import { asset } from '@/lib/asset'

interface Props {
  name: string
  className?: string
  width?: number
  height?: number
}

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
