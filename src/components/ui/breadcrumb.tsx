import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const Breadcrumb = (props: React.ComponentProps<'nav'>) => <nav aria-label="Breadcrumb" {...props} />
const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
)
const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('inline-flex items-center gap-2', className)} {...props} />
)
const BreadcrumbLink = ({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp className={cn('transition-colors hover:text-(--color-primary-bright)', className)} {...props} />
  )
}
const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span aria-current="page" className={cn('text-(--color-muted)', className)} {...props} />
)
const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li role="presentation" aria-hidden="true" className={cn('[&_svg]:size-3.5', className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
)

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator }
