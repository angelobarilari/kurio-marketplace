import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type RatingStarsProps = {
  value: number
  outOf?: number
  className?: string
}

export const RatingStars = ({ value, outOf = 5, className }: RatingStarsProps) => (
  <span className={cn('inline-flex items-center gap-1', className)} aria-hidden="true">
    {Array.from({ length: outOf }, (_, index) => (
      <Star
        key={index}
        className={cn(
          'size-4 stroke-[1.5]',
          index < Math.floor(value)
            ? 'fill-(--color-primary-bright) text-(--color-primary-bright)'
            : 'fill-(--color-muted) text-(--color-muted)',
        )}
      />
    ))}
  </span>
)
