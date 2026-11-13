import { Mail, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileBottomPanel } from '@/components/layout/mobile-bottom-panel'
import { RatingStars } from '@/components/ui/rating-stars'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { NftDetail, NftEdition } from '@/types/nft'

type NftPurchasePanelProps = {
  nft: NftDetail
  edition: NftEdition
  maxQuantity: number
  quantity: number
  onEditionChange: (edition: NftEdition) => void
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  addingToCart: boolean
  cartError?: string
}

export const NftPurchasePanel = ({
  nft,
  edition,
  maxQuantity,
  quantity,
  onEditionChange,
  onQuantityChange,
  onAddToCart,
  addingToCart,
  cartError,
}: NftPurchasePanelProps) => {
  const isUnavailable = !nft.available || edition.availableQuantity === 0
  const isLimitReached = !isUnavailable && maxQuantity === 0
  const isPurchaseDisabled = isUnavailable || isLimitReached || addingToCart
  const purchaseLabel = isUnavailable
    ? 'Indisponível'
    : isLimitReached
      ? 'Limite atingido'
      : addingToCart
        ? 'Adicionando...'
        : 'Comprar NFT'
  const attributes = nft.attributes.map((attribute) => attribute.value).join(', ')

  return (
    <>
      <section className="relative min-w-0 max-[1100px]:mt-8 max-[760px]:z-10 max-[760px]:-mx-5.5 max-[760px]:-mt-9 max-[760px]:rounded-t-[42px] max-[760px]:bg-(--color-panel) max-[760px]:px-6 max-[760px]:pt-9 max-[760px]:pb-8 max-[390px]:-mx-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="mb-4 text-[clamp(28px,2.5vw,34px)] leading-tight font-bold max-[760px]:text-xl">
            {nft.name} {nft.tokenId}
          </h1>
          <Badge
            variant="outline"
            className="mt-1 hidden shrink-0 gap-1 border-(--color-primary) px-2 py-1 text-sm font-normal max-[760px]:flex"
            aria-label={`Avaliação ${nft.rating.average} de 5, ${nft.rating.count} avaliações`}
          >
            <Star className="size-4 fill-(--color-primary) text-(--color-primary)" />
            <span>{nft.rating.average}</span>
            <span className="text-(--color-muted)">({nft.rating.count})</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-5 pb-4 max-[760px]:hidden">
          <p className="mb-0 text-2xl font-bold text-(--color-primary-bright)">{edition.priceEth} ETH</p>
          <div
            className="flex items-center gap-2 text-[13px] text-(--color-foreground)"
            aria-label={`Avaliação ${nft.rating.average} de 5, ${nft.rating.count} avaliações de colecionadores`}
          >
            <RatingStars value={nft.rating.average} className="gap-1.5 [&_svg]:size-3.75" />
            <span>{nft.rating.count} avaliações de colecionadores</span>
          </div>
        </div>
        <Separator className="mb-5 max-[760px]:hidden" />

        <h2 className="mb-2 text-base font-bold max-[760px]:sr-only">Sobre este NFT:</h2>
        <p className="mb-5 text-sm leading-7 text-(--color-muted)">{nft.shortDescription}</p>

        {!nft.available && (
          <p
            className="mb-5 rounded-md border border-(--color-destructive) px-3 py-2 text-sm text-(--color-foreground)"
            role="status"
          >
            Este NFT está indisponível no momento.
          </p>
        )}

        <fieldset className="mb-5" disabled={!nft.available}>
          <legend className="mb-2 text-base font-bold">Edição:</legend>
          <ToggleGroup
            type="single"
            value={edition.id}
            onValueChange={(value) => {
              const next = nft.editions.find((option) => option.id === value)
              if (next) onEditionChange(next)
            }}
            className="flex-wrap gap-2"
            aria-label="Edição"
          >
            {nft.editions.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                className="cursor-pointer rounded-full border border-(--color-border) px-3 py-1.5 text-sm text-(--color-muted) data-[state=on]:border-(--color-primary) data-[state=on]:text-(--color-primary-bright)"
                disabled={!nft.available || option.availableQuantity === 0}
                aria-label={`${option.label}${option.availableQuantity === 0 ? ' — esgotada' : ''}`}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>

        <div className="mt-8 flex items-center gap-3 max-[760px]:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-(--color-muted)">Qtd.</span>
            <Button
              type="button"
              size="icon"
              className="rounded-full bg-(--color-primary) text-primary-foreground"
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
              onClick={() => onQuantityChange(quantity - 1)}
            >
              <Minus />
            </Button>
            <output className="min-w-5 text-center text-xl" aria-live="polite">
              {quantity}
            </output>
            <Button
              type="button"
              size="icon"
              className="rounded-full bg-(--color-primary) text-primary-foreground"
              disabled={quantity >= maxQuantity}
              aria-label="Aumentar quantidade"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus />
            </Button>
          </div>
          <Button
            type="button"
            className="h-11 min-w-40 rounded-md bg-(--color-primary) font-bold text-primary-foreground disabled:opacity-70"
            disabled={isPurchaseDisabled}
            onClick={onAddToCart}
          >
            {purchaseLabel}
          </Button>
          <FavoriteButton
            nft={nft}
            showLabel
            className="h-11 gap-2 border-(--color-primary) text-(--color-primary)"
          />
        </div>
        {edition.availableQuantity === 0 && nft.available && (
          <p className="mt-2 mb-0 text-sm text-(--color-destructive) max-[760px]:hidden" role="status">
            A edição {edition.label} está esgotada.
          </p>
        )}
        {isLimitReached && (
          <p className="mt-2 mb-0 text-sm text-(--color-muted) max-[760px]:hidden" role="status">
            Você já atingiu o limite desta edição no carrinho.
          </p>
        )}
        {cartError && (
          <p className="mt-2 text-sm text-(--color-destructive) max-[760px]:hidden" role="alert">
            {cartError}
          </p>
        )}

        <dl className="mt-8 mb-0 grid gap-3 text-sm text-(--color-muted) max-[760px]:mt-8">
          <div>
            <dt className="inline">ID do token: </dt>
            <dd className="inline">{nft.tokenId}</dd>
          </div>
          <div>
            <dt className="inline">Coleção: </dt>
            <dd className="inline">{nft.collection}</dd>
          </div>
          <div>
            <dt className="inline">Atributos: </dt>
            <dd className="inline">{attributes}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center gap-2 text-sm font-bold max-[760px]:hidden">
          <span>Compartilhar este NFT:</span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(globalThis.location?.href ?? '')}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Compartilhar no LinkedIn"
          >
            <FaLinkedinIn className="size-4" aria-hidden="true" />
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(`${nft.name} ${nft.tokenId}`)}&body=${encodeURIComponent(globalThis.location?.href ?? '')}`}
            aria-label="Compartilhar por e-mail"
          >
            <Mail className="size-4" aria-hidden="true" />
          </a>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(`${nft.name} ${nft.tokenId}`)}&url=${encodeURIComponent(globalThis.location?.href ?? '')}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Compartilhar no X"
          >
            <FaXTwitter className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <MobileBottomPanel data-testid="mobile-purchase-bar" aria-label="Barra de compra" className="z-30">
        {cartError && (
          <p className="mb-3 text-sm text-(--color-destructive)" role="alert">
            {cartError}
          </p>
        )}
        {edition.availableQuantity === 0 && nft.available && (
          <p className="mb-3 text-sm text-(--color-destructive)" role="status">
            A edição {edition.label} está esgotada.
          </p>
        )}
        {isLimitReached && (
          <p className="mb-3 text-sm text-(--color-muted)" role="status">
            Você já atingiu o limite desta edição no carrinho.
          </p>
        )}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm font-bold text-(--color-muted)">Qtd.</span>
            <Button
              type="button"
              size="icon"
              className="size-9 rounded-full bg-(--color-primary) text-primary-foreground"
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
              onClick={() => onQuantityChange(quantity - 1)}
            >
              <Minus />
            </Button>
            <output className="min-w-5 text-center text-xl" aria-live="polite">
              {quantity}
            </output>
            <Button
              type="button"
              size="icon"
              className="size-9 rounded-full bg-(--color-primary) text-primary-foreground"
              disabled={quantity >= maxQuantity}
              aria-label="Aumentar quantidade"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus />
            </Button>
          </div>
          <p className="mb-0 shrink-0 text-xl font-bold text-(--color-primary-bright)">
            {edition.priceEth} ETH
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            className="h-15 flex-1 rounded-full bg-(--color-primary) text-base font-bold text-primary-foreground disabled:opacity-70"
            disabled={isPurchaseDisabled}
            onClick={onAddToCart}
          >
            {purchaseLabel}
          </Button>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-15 rounded-full border-(--color-border) bg-transparent text-(--color-primary-bright)"
          >
            <Link to="/cart" aria-label="Abrir carrinho">
              <ShoppingCart aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </MobileBottomPanel>
    </>
  )
}
