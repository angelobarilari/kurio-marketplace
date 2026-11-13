import * as React from 'react'
import { X } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetTitle = ({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title className={cn('text-base font-bold', className)} {...props} />
)
const SheetDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description className={cn('text-sm text-(--color-muted)', className)} {...props} />
)

const SheetContent = ({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: 'top' | 'right' | 'bottom' | 'left' }) => {
  const positions = {
    top: 'inset-x-0 top-0 border-b',
    right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
    bottom: 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[28px]',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
  }
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 overflow-y-auto bg-(--color-panel) p-5 text-foreground shadow-xl outline-none',
          positions[side],
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-(--color-muted) focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger }
