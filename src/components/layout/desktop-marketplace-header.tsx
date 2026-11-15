import { SiteHeader } from '@/components/layout/site-header'
import { useCart } from '@/features/cart/hooks/use-cart'

type DesktopMarketplaceHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
}

export const DesktopMarketplaceHeader = ({ searchValue, onSearchChange }: DesktopMarketplaceHeaderProps) => {
  const cart = useCart()

  return (
    <SiteHeader
      cartCount={cart.data?.itemCount ?? 0}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
    />
  )
}
