import type { ComponentProps } from 'react'
import { getResponsiveNftImage } from '@/assets'

type NftImageProps = Omit<ComponentProps<'img'>, 'src' | 'srcSet'> & {
  src: string
}

export const NftImage = ({ src, sizes, ...props }: NftImageProps) => {
  const sources = getResponsiveNftImage(src)

  return (
    <img
      {...props}
      src={src}
      srcSet={sources ? `${sources.small} 320w, ${sources.medium} 768w, ${sources.full} 1254w` : undefined}
      sizes={sources ? sizes : undefined}
    />
  )
}
