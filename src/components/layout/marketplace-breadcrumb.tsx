import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type MarketplaceBreadcrumbProps = {
  className?: string
  currentPage?: string
}

const marketplacePath = [
  { label: 'Início', hash: undefined },
  { label: 'Mercado', hash: 'catalog' },
] as const

export const MarketplaceBreadcrumb = ({ className, currentPage }: MarketplaceBreadcrumbProps) => (
  <Breadcrumb className={className} aria-label="Navegação estrutural">
    <BreadcrumbList>
      {marketplacePath.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" hash={item.hash}>
                {item.label}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Fragment>
      ))}
      {currentPage && (
        <>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-(--color-foreground)">{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  </Breadcrumb>
)
