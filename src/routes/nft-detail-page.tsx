import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { MarketplaceBreadcrumb } from '@/components/layout/marketplace-breadcrumb'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { Button } from '@/components/ui/button'
import { NftDetailContent } from '@/features/nft-detail/components/nft-detail-content'
import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft-detail/components/nft-gallery'
import { NftPurchasePanel } from '@/features/nft-detail/components/nft-purchase-panel'
import { useNftDetail } from '@/features/nft-detail/hooks/use-nft-detail'
import { useAddCartItem, useCart } from '@/features/cart/hooks/use-cart'
import type { CartError } from '@/features/cart/types'

export const NftDetailPage = () => {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const navigate = useNavigate()
  const query = useNftDetail(nftId)
  const cart = useCart()
  const [activeMediaId, setActiveMediaId] = useState('')
  const [editionId, setEditionId] = useState('default')
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddCartItem()

  const searchCatalog = (value: string) => {
    void navigate({ to: '/', search: { q: value || undefined }, hash: 'catalog' })
  }

  if (query.isPending)
    return (
      <MarketplaceShell onSearchChange={searchCatalog}>
        <NftDetailSkeleton />
      </MarketplaceShell>
    )

  const isNotFound = isAxiosError(query.error) && query.error.response?.status === 404
  if (query.isError || !query.data) {
    return (
      <MarketplaceShell onSearchChange={searchCatalog}>
        <main className="grid min-h-[65vh] place-content-center justify-items-center gap-4 text-center">
          <h1 className="text-2xl">
            {isNotFound ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}
          </h1>
          <p className="text-(--color-muted)">
            {isNotFound
              ? 'Este item não existe ou não está mais disponível.'
              : 'Confira sua conexão e tente novamente.'}
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/" hash="catalog">
                Voltar ao mercado
              </Link>
            </Button>
            {!isNotFound && (
              <Button type="button" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            )}
          </div>
        </main>
      </MarketplaceShell>
    )
  }

  const nft = query.data
  const edition =
    nft.editions.find((option) => option.id === editionId) ??
    nft.editions.find((option) => option.availableQuantity > 0) ??
    nft.editions[0]
  const cartItemId = `${nft.id}:${edition.id}`
  const quantityInCart = cart.data?.items.find((item) => item.id === cartItemId)?.quantity ?? 0
  const maxQuantity = Math.max(0, Math.min(edition.availableQuantity, edition.maxPerOrder) - quantityInCart)
  const safeQuantity = maxQuantity > 0 ? Math.min(Math.max(1, quantity), maxQuantity) : 0

  return (
    <MarketplaceShell onSearchChange={searchCatalog}>
      <main className="relative left-1/2 w-[min(1280px,calc(100vw-40px))] -translate-x-1/2 py-14 max-[760px]:left-auto max-[760px]:w-auto max-[760px]:translate-x-0 max-[760px]:pt-0 max-[760px]:pb-[calc(190px+env(safe-area-inset-bottom))]">
        <MarketplaceBreadcrumb className="mb-4 text-sm font-bold max-[760px]:hidden" />

        <div className="grid grid-cols-[minmax(560px,1fr)_minmax(500px,1fr)] items-start gap-9 max-[1100px]:block">
          <NftGallery
            nft={nft}
            gallery={nft.gallery}
            activeId={activeMediaId || nft.gallery[0]?.id || ''}
            onSelect={setActiveMediaId}
          />
          <NftPurchasePanel
            nft={nft}
            edition={edition}
            maxQuantity={maxQuantity}
            quantity={safeQuantity}
            onEditionChange={(option) => {
              setEditionId(option.id)
              setQuantity(1)
            }}
            onQuantityChange={setQuantity}
            addingToCart={addToCart.isPending}
            cartError={
              isAxiosError<CartError>(addToCart.error)
                ? addToCart.error.response?.data.message
                : addToCart.isError
                  ? 'Não foi possível adicionar o NFT.'
                  : undefined
            }
            onAddToCart={() => {
              addToCart.mutate(
                { nftId: nft.id, editionId: edition.id, quantity: safeQuantity },
                { onSuccess: () => void navigate({ to: '/cart' }) },
              )
            }}
          />
        </div>
        <NftDetailContent nft={nft} />
      </main>
    </MarketplaceShell>
  )
}
