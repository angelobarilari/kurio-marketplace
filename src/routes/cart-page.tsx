import { Link } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { MarketplaceCommercePage } from '@/components/layout/marketplace-commerce-page'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { CartRecommendations } from '@/features/cart/components/cart-recommendations'
import { CartSkeleton } from '@/features/cart/components/cart-skeleton'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { cartDesktopGridClass, cartTableColumns } from '@/features/cart/components/cart-table-layout'
import { useCartPageController } from '@/features/cart/hooks/use-cart-page-controller'
import { cn } from '@/lib/utils'

export const CartPage = () => {
  const page = useCartPageController()
  const { cart } = page

  if (cart.isPending)
    return (
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        <CartSkeleton />
      </MarketplaceShell>
    )
  if (cart.isError || !cart.data)
    return (
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        <main className="grid min-h-[65vh] place-content-center justify-items-center gap-4 text-center">
          <h1 className="text-2xl">Não foi possível carregar o carrinho</h1>
          <p className="text-(--color-muted)">Seus itens continuam preservados. Tente novamente.</p>
          <Button type="button" onClick={() => void cart.refetch()}>
            Tentar novamente
          </Button>
        </main>
      </MarketplaceShell>
    )

  const hasConflict = cart.data.items.some((item) => item.status !== 'available')
  return (
    <MarketplaceShell onSearchChange={page.searchCatalog}>
      <MarketplaceCommercePage
        currentPage="Carrinho"
        mobileTitle="Carrinho de NFTs"
        backLabel="Voltar ao mercado"
        onBack={page.goToCatalog}
        className={
          cart.data.items.length
            ? 'max-[760px]:pb-[calc(315px+env(safe-area-inset-bottom))]'
            : 'max-[760px]:pb-0'
        }
      >
        {page.feedback && (
          <p className="sr-only" role="status" aria-live="polite">
            {page.feedback}
          </p>
        )}
        {page.mutationMessage && (
          <p className="mb-4 rounded border border-(--color-destructive) p-3 text-sm" role="alert">
            {page.mutationMessage}
          </p>
        )}

        {cart.data.items.length === 0 ? (
          <section className="grid min-h-[48vh] place-content-center justify-items-center text-center">
            <h1 className="mb-3 text-2xl">Seu carrinho está vazio</h1>
            <p className="mb-6 text-(--color-muted)">Explore o mercado e escolha uma edição para começar.</p>
            <Button asChild>
              <Link to="/" hash="catalog">
                Explorar NFTs
              </Link>
            </Button>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_330px] items-start gap-16 max-[1050px]:grid-cols-[minmax(0,1fr)_300px] max-[900px]:grid-cols-1 max-[760px]:gap-10">
              <section aria-labelledby="cart-items-title">
                <div
                  className={cn(
                    'mb-3 grid min-h-10 items-center px-4 text-base leading-none font-bold max-[900px]:hidden',
                    cartDesktopGridClass,
                  )}
                >
                  {cartTableColumns.map((column, index) =>
                    index === 0 ? (
                      <h1 id="cart-items-title" key={column.id} className="mb-0 text-base leading-none">
                        {column.label}
                      </h1>
                    ) : (
                      <span key={column.id} aria-hidden={!column.label || undefined}>
                        {column.label}
                      </span>
                    ),
                  )}
                </div>
                <Separator className="mb-4 max-[900px]:hidden" />
                <div className="space-y-4 max-[760px]:space-y-3">
                  {cart.data.items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      pending={page.mutationPending}
                      onQuantityChange={page.changeQuantity}
                      onRemove={page.remove}
                    />
                  ))}
                </div>
              </section>
              <CartSummary hasItems hasConflict={hasConflict} />
            </div>
            <div className="max-[760px]:hidden">
              <CartRecommendations />
            </div>
          </>
        )}
      </MarketplaceCommercePage>
    </MarketplaceShell>
  )
}
