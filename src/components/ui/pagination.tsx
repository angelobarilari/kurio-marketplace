import * as React from 'react'
import { cn } from '@/lib/utils'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    data-slot="pagination"
    className={cn('flex w-full justify-center', className)}
    {...props}
  />
)
const PaginationContent = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    data-slot="pagination-content"
    className={cn('flex items-center gap-1 max-[760px]:w-full max-[760px]:justify-between', className)}
    {...props}
  />
)
const PaginationItem = (props: React.ComponentProps<'li'>) => <li data-slot="pagination-item" {...props} />

export { Pagination, PaginationContent, PaginationItem }
