import { lazy, Suspense, type ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'

const SiteFooter = lazy(() =>
  import('@/components/layout/site-footer').then((module) => ({
    default: module.SiteFooter,
  })),
)

const DesktopMarketplaceHeader = lazy(() =>
  import('@/components/layout/desktop-marketplace-header').then((module) => ({
    default: module.DesktopMarketplaceHeader,
  })),
)

type MarketplaceShellProps = {
  children: ReactNode
  searchValue?: string
  onSearchChange: (value: string) => void
  footer?: boolean
}

export const MarketplaceShell = ({
  children,
  searchValue = '',
  onSearchChange,
  footer = true,
}: MarketplaceShellProps) => {
  const isMobile = useMediaQuery('(max-width: 760px)')

  return (
    <div className="mx-auto w-[min(var(--content-width),calc(100%-48px))] max-[1100px]:w-[min(100%-40px,var(--content-width))] max-[760px]:w-full max-[760px]:px-5.5 max-[390px]:px-4">
      {!isMobile && (
        <Suspense fallback={<div className="h-18.25 max-[760px]:hidden" aria-hidden="true" />}>
          <DesktopMarketplaceHeader searchValue={searchValue} onSearchChange={onSearchChange} />
        </Suspense>
      )}
      {children}
      {footer && !isMobile && (
        <Suspense fallback={null}>
          <SiteFooter />
        </Suspense>
      )}
    </div>
  )
}
