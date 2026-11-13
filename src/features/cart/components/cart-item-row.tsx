import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cartDesktopGridClass } from '@/features/cart/components/cart-table-layout'
import type { CartItem } from '@/features/cart/types'
import { cn } from '@/lib/utils'

type CartItemSummaryProps = { item: CartItem; variant: 'summary' }
type EditableCartItemProps = {
  item: CartItem
  variant?: 'cart'
  pending: boolean
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}
type CartItemRowProps = CartItemSummaryProps | EditableCartItemProps

const formatTokenId = (tokenId: string) => {
  const normalizedTokenId = tokenId.replace(/^#/, '')
  return /^\d+$/.test(normalizedTokenId) ? normalizedTokenId.padStart(4, '0') : normalizedTokenId
}

export const CartItemRow = (props: CartItemRowProps) => {
  const { item } = props
  const tokenId = formatTokenId(item.nft.tokenId)
  if (props.variant === 'summary') {
    return (
      <article className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4 bg-(--color-panel) p-0 pr-6">
        <Link to="/nfts/$nftId" params={{ nftId: item.nft.id }} className="shrink-0">
          <img src={item.nft.image} alt="" className="size-20 rounded-md object-cover" />
        </Link>
        <div className="min-w-0">
          <h3 className="mb-1 text-base font-bold wrap-break-word whitespace-normal">
            <Link
              className="no-underline hover:text-(--color-primary-bright)"
              to="/nfts/$nftId"
              params={{ nftId: item.nft.id }}
            >
              {item.nft.name} {item.nft.tokenId}
            </Link>
          </h3>
          <p className="mb-0 text-sm text-(--color-muted)">
            ID do token: #{tokenId} · {item.editionLabel}
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-sm text-(--color-muted)">(x {item.quantity})</span>
            <span className="font-bold whitespace-nowrap text-(--color-primary-bright)">
              {item.lineTotalEth} ETH
            </span>
          </div>
        </div>
      </article>
    )
  }

  const { pending, onQuantityChange, onRemove } = props
  return (
    <article
      className={cn(
        'grid min-h-17.5 items-center bg-(--color-panel) p-0 pr-6 max-[900px]:grid-cols-[minmax(240px,1fr)_auto_auto_auto_40px] max-[760px]:grid-cols-[96px_minmax(0,1fr)] max-[760px]:gap-0 max-[760px]:overflow-hidden max-[760px]:rounded-[18px] max-[760px]:p-0',
        cartDesktopGridClass,
      )}
    >
      <div className="flex min-w-0 items-center gap-4 max-[760px]:contents">
        <Link to="/nfts/$nftId" params={{ nftId: item.nft.id }} className="shrink-0">
          <img
            src={item.nft.image}
            alt={item.nft.name}
            className="size-17.5 rounded-md object-cover max-[760px]:h-full max-[760px]:min-h-24 max-[760px]:w-24 max-[760px]:rounded-none"
          />
        </Link>
        <div className="min-w-0 max-[760px]:grid max-[760px]:grid-cols-[minmax(0,1fr)_auto] max-[760px]:items-center max-[760px]:gap-x-2 max-[760px]:gap-y-1 max-[760px]:px-3 max-[760px]:py-2">
          <h2 className="mb-1 truncate text-lg font-bold max-[760px]:col-span-2 max-[760px]:mb-0 max-[760px]:overflow-visible max-[760px]:text-base max-[760px]:text-clip max-[760px]:whitespace-normal">
            <Link
              className="no-underline hover:text-(--color-primary-bright)"
              to="/nfts/$nftId"
              params={{ nftId: item.nft.id }}
            >
              {item.nft.name} {item.nft.tokenId}
            </Link>
          </h2>
          <p className="mb-0 text-sm text-(--color-muted) max-[760px]:row-start-2 max-[760px]:text-xs">
            <span className="max-[760px]:hidden">ID do token: #{tokenId}</span>
            <span className="hidden max-[760px]:inline">Edição: {item.editionLabel}</span>
          </p>
          <p className="mt-3 mb-0 hidden text-xl font-bold text-(--color-primary-bright) max-[760px]:col-start-1 max-[760px]:row-start-3 max-[760px]:mt-0 max-[760px]:block">
            {item.lineTotalEth} ETH
          </p>
          <div className="mt-3 hidden items-center gap-2 max-[760px]:col-start-2 max-[760px]:row-start-2 max-[760px]:mt-0 max-[760px]:flex max-[760px]:gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="rounded-full"
              disabled={pending || item.quantity <= 1}
              aria-label={`Diminuir quantidade de ${item.nft.name}`}
              onClick={() => onQuantityChange(item, item.quantity - 1)}
            >
              <Minus />
            </Button>
            <output className="min-w-5 text-center" aria-live="polite">
              {item.quantity}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="rounded-full"
              disabled={pending || item.quantity >= item.maxQuantity}
              aria-label={`Aumentar quantidade de ${item.nft.name}`}
              onClick={() => onQuantityChange(item, item.quantity + 1)}
            >
              <Plus />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="ml-auto text-(--color-primary)"
              disabled={pending}
              aria-label={`Remover ${item.nft.name} do carrinho`}
              onClick={() => onRemove(item)}
            >
              <Trash2 />
            </Button>
          </div>
          {item.status !== 'available' && (
            <p className="mt-2 mb-0 text-xs text-(--color-destructive)" role="status">
              {item.status === 'price-changed' ? 'Preço atualizado. Revise a cotação.' : 'Item indisponível.'}
            </p>
          )}
        </div>
      </div>
      <p className="mb-0 max-[760px]:hidden">{item.unitPriceEth} ETH</p>
      <div className="flex items-center gap-2 max-[760px]:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="rounded-full"
          disabled={pending || item.quantity <= 1}
          aria-label={`Diminuir quantidade de ${item.nft.name}`}
          onClick={() => onQuantityChange(item, item.quantity - 1)}
        >
          <Minus />
        </Button>
        <output className="min-w-5 text-center" aria-live="polite">
          {item.quantity}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="rounded-full"
          disabled={pending || item.quantity >= item.maxQuantity}
          aria-label={`Aumentar quantidade de ${item.nft.name}`}
          onClick={() => onQuantityChange(item, item.quantity + 1)}
        >
          <Plus />
        </Button>
      </div>
      <p className="mb-0 font-bold text-(--color-primary-bright) max-[760px]:hidden">
        {item.lineTotalEth} ETH
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-(--color-muted) max-[760px]:hidden"
        disabled={pending}
        aria-label={`Remover ${item.nft.name} do carrinho`}
        onClick={() => onRemove(item)}
      >
        <Trash2 />
      </Button>
    </article>
  )
}
