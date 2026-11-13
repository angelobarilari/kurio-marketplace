import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { useCart } from '@/features/cart/hooks/use-cart'

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
  const cart = useCart()
  return (
    <div className="mx-auto w-[min(var(--content-width),calc(100%-48px))] max-[1100px]:w-[min(100%-40px,var(--content-width))] max-[760px]:w-full max-[760px]:px-5.5 max-[390px]:px-4">
      <SiteHeader
        cartCount={cart.data?.itemCount ?? 0}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
      {children}
      {footer && <SiteFooter />}
    </div>
  )
}
