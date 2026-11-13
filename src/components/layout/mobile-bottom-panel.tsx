import type { ComponentProps } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type MobileBottomPanelProps = ComponentProps<'div'>

export const MobileBottomPanel = ({ className, ...props }: MobileBottomPanelProps) =>
  createPortal(
    <div
      role="region"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 hidden rounded-t-[36px] bg-(--color-panel-raised) px-6 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_var(--color-shadow)] max-[760px]:block',
        className,
      )}
      {...props}
    />,
    document.body,
  )
