import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor
const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-80 rounded-md border border-border bg-(--color-panel) p-4 text-foreground shadow-lg outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
)

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
