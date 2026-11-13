import * as React from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const ToggleGroup = ({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) => (
  <ToggleGroupPrimitive.Root
    data-slot="toggle-group"
    className={cn('flex items-center', className)}
    {...props}
  />
)
const ToggleGroupItem = ({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) => (
  <ToggleGroupPrimitive.Item
    data-slot="toggle-group-item"
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-(--color-primary-bright)',
      className,
    )}
    {...props}
  />
)

export { ToggleGroup, ToggleGroupItem }
