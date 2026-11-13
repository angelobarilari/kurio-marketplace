import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type FieldErrorProps = Omit<ComponentProps<'p'>, 'children'> & {
  message?: string
}

const FieldError = ({ message, className, ...props }: FieldErrorProps) =>
  message ? (
    <p data-slot="field-error" className={cn('mt-1 text-xs text-red-300', className)} role="alert" {...props}>
      {message}
    </p>
  ) : null

export { FieldError }
