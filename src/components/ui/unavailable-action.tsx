import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type UnavailableActionProps = {
  children: ReactNode
  message: string
  className?: string
}

export const UnavailableAction = ({ children, message, className }: UnavailableActionProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className={cn('inline-flex', className)} tabIndex={0}>
        {children}
      </span>
    </TooltipTrigger>
    <TooltipContent>{message}</TooltipContent>
  </Tooltip>
)
