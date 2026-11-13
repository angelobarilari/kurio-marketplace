import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type FieldLabelProps = ComponentProps<'label'> & {
  visuallyHidden?: boolean
}

const FieldLabel = ({ visuallyHidden = false, className, ...props }: FieldLabelProps) => (
  <label data-slot="field-label" className={cn(visuallyHidden && 'sr-only', className)} {...props} />
)

export { FieldLabel }
