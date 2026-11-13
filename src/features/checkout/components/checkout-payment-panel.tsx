import { isAxiosError } from 'axios'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { checkoutWalletProviders, isWalletProvider } from '@/features/checkout/constants'
import { CheckoutWalletCards } from '@/features/checkout/components/checkout-wallet-picker'
import type { CheckoutFormValues } from '@/features/checkout/schemas'
import type { CheckoutPaymentPanelActions, CheckoutPaymentPanelModel } from '@/features/checkout/types'
import type { CheckoutApiError } from '@/types/order'

type CheckoutPaymentPanelProps = {
  form: UseFormReturn<CheckoutFormValues>
  model: CheckoutPaymentPanelModel
  actions: CheckoutPaymentPanelActions
}

export const CheckoutPaymentPanel = ({
  form,
  model: {
    values,
    cart,
    wallets,
    couponCode,
    couponInput,
    couponError,
    couponErrorRetryable,
    isApplyingCoupon,
    checkoutError,
    connectionError,
    isMobile,
    mobileStep,
    connectedForSelection,
    mustReviewQuote,
    reviewedFingerprint,
    attemptPending,
    quote,
    connectionHasError,
    isConnecting,
    isDisconnecting,
    isCreatingOrder,
  },
  actions: {
    onCouponInputChange,
    onApplyCoupon,
    onRemoveCoupon,
    onRetryCoupon,
    onSelectWallet,
    onChangeWallet,
    onDisconnect,
    onAcceptQuote,
    onRetryQuote,
    onRetryConnection,
  },
}: CheckoutPaymentPanelProps) => {
  const quoteNeedsApproval =
    mustReviewQuote && Boolean(quote.data?.fingerprint) && reviewedFingerprint !== quote.data?.fingerprint
  const canSubmit =
    form.formState.isValid &&
    quote.data?.valid === true &&
    !quote.isFetching &&
    !isCreatingOrder &&
    !isConnecting &&
    !isApplyingCoupon &&
    !attemptPending &&
    !quoteNeedsApproval

  const totalSummary = quote.data && (
    <div className="flex justify-end gap-4 text-lg font-bold max-[760px]:text-xl">
      <span>Total</span>
      <span className="shrink-0 text-(--color-primary-bright)">{quote.data.totalEth} ETH</span>
    </div>
  )

  return (
    <aside
      className={isMobile && mobileStep === 'collector' ? 'hidden' : 'min-w-0 space-y-7'}
      aria-label="Resumo e pagamento"
    >
      {isMobile && (
        <CheckoutWalletCards
          wallets={wallets}
          selectedWalletId={values.walletId ?? ''}
          network={values.network ?? 'Ethereum'}
          couponCode={couponCode}
          isConnected={connectedForSelection}
          onSelect={onSelectWallet}
          onChangeWallet={onChangeWallet}
        />
      )}

      <section className={isMobile ? 'hidden' : ''} aria-labelledby="order-items-title">
        <h2 id="order-items-title" className="mb-3 text-xl font-bold">
          Seus NFTs
        </h2>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-(--color-border) pb-3 text-sm font-bold">
          <span>NFTs</span>
          <span>Subtotal</span>
        </div>
        <div className="space-y-3">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} variant="summary" item={item} />
          ))}
        </div>
      </section>

      <form
        className={isMobile ? 'hidden' : 'flex items-center gap-2'}
        onSubmit={(event) => {
          event.preventDefault()
          onApplyCoupon()
        }}
      >
        <FieldLabel visuallyHidden htmlFor="checkout-coupon">
          Código promocional
        </FieldLabel>
        <Input
          id="checkout-coupon"
          value={couponInput}
          onChange={(event) => onCouponInputChange(event.target.value)}
          placeholder="Tem um código promocional?"
          className="h-10 min-w-0 flex-1"
          disabled={!cart.items.length || isApplyingCoupon}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!cart.items.length || quote.isFetching || isApplyingCoupon}
        >
          {isApplyingCoupon ? 'Validando…' : 'Aplicar'}
        </Button>
      </form>
      {couponError && (
        <div className="space-y-2" role="alert">
          <p className="mb-0 text-sm text-(--color-destructive)">{couponError}</p>
          {couponErrorRetryable && (
            <Button type="button" variant="outline" disabled={isApplyingCoupon} onClick={onRetryCoupon}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      {quote.isPending ? (
        <div className="space-y-3" role="status" aria-label="Atualizando cotação">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      ) : quote.isError ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm">
            {isAxiosError<CheckoutApiError>(quote.error)
              ? (quote.error.response?.data.message ?? 'Não foi possível atualizar a cotação.')
              : 'Não foi possível atualizar a cotação.'}
          </p>
          {couponCode && (
            <Button
              type="button"
              variant="link"
              className="h-auto justify-start p-0"
              onClick={onRemoveCoupon}
            >
              Remover cupom {couponCode}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onRetryQuote}>
            Tentar novamente
          </Button>
        </div>
      ) : quote.data ? (
        <>
          <dl className={isMobile ? 'hidden' : 'space-y-3 text-sm'}>
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd className="m-0 shrink-0">{quote.data.subtotalEth} ETH</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Desconto</dt>
              <dd className="m-0 shrink-0">(-) {quote.data.discountEth} ETH</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Taxa de rede</dt>
              <dd className="m-0 shrink-0">{quote.data.networkFeeEth} ETH</dd>
            </div>
          </dl>
          {couponCode && (
            <Button
              type="button"
              variant="link"
              className="mt-3 h-auto justify-start p-0 text-xs"
              onClick={onRemoveCoupon}
            >
              Remover cupom {couponCode}
            </Button>
          )}
          {!quote.data.valid && (
            <div className="mt-4 rounded-md border border-(--color-destructive) p-3 text-sm" role="alert">
              Há itens indisponíveis ou uma alteração que exige revisão. Volte ao carrinho para conferir os
              itens.
              <Button
                asChild
                variant="link"
                className="mt-2 h-auto justify-start p-0 text-(--color-primary-bright)"
              >
                <Link to="/cart">Revisar carrinho</Link>
              </Button>
            </div>
          )}
          {!isMobile && <Separator className="my-4" />}
          {!isMobile && totalSummary}
        </>
      ) : null}

      <section className="space-y-4" aria-labelledby="wallet-title">
        <h2 id="wallet-title" className="mb-1 text-xl font-bold">
          Carteira e rede
        </h2>
        <ToggleGroup
          type="single"
          value={values.walletType}
          onValueChange={(value) => {
            if (isWalletProvider(value)) {
              form.setValue('walletType', value, { shouldValidate: true })
            }
          }}
          aria-label="Provedor de carteira"
          className="flex w-full flex-col gap-3"
        >
          {checkoutWalletProviders.map((provider) => (
            <ToggleGroupItem
              key={provider}
              value={provider}
              aria-label={`Usar ${provider}`}
              className="h-16 w-full justify-start gap-4 rounded-lg border border-(--color-border) bg-(--color-panel) px-4 text-left text-base text-(--color-foreground) data-[state=on]:border-(--color-primary) data-[state=on]:bg-(--color-panel) data-[state=on]:text-(--color-foreground)"
            >
              <span
                aria-hidden="true"
                className="grid size-5 place-items-center rounded-full border border-current"
              >
                {values.walletType === provider && (
                  <span className="size-2.5 rounded-full bg-(--color-primary-bright)" />
                )}
              </span>
              {provider}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {connectedForSelection && (
          <div
            className={
              isMobile
                ? 'flex justify-end'
                : 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/50 bg-(--color-panel) p-4'
            }
          >
            {!isMobile && (
              <p className="mb-0 flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-5 text-(--color-primary-bright)" aria-hidden="true" />
                Carteira conectada para esta tentativa.
              </p>
            )}
            <Button
              type="button"
              variant={isMobile ? 'link' : 'outline'}
              disabled={isDisconnecting}
              onClick={onDisconnect}
            >
              {isDisconnecting ? 'Desconectando…' : 'Desconectar'}
            </Button>
          </div>
        )}
        {connectionError && (
          <p className="mb-0 text-sm text-(--color-destructive)" role="alert">
            {connectionError}
          </p>
        )}
        {connectionHasError && (
          <Button type="button" variant="link" onClick={onRetryConnection}>
            Verificar conexão novamente
          </Button>
        )}
      </section>

      {isMobile && totalSummary}

      {mustReviewQuote && quote.data?.valid && (
        <div className="rounded-lg border border-(--color-primary) bg-(--color-panel) p-4" role="status">
          <p className="mb-2 flex items-center gap-2 font-semibold">
            <CircleAlert className="size-5" aria-hidden="true" />A cotação mudou. Confira os novos valores
            antes de continuar.
          </p>
          <p className="mb-3 text-sm text-(--color-muted)">
            Total atualizado: <strong>{quote.data.totalEth} ETH</strong>
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={quote.isFetching}
            onClick={() => onAcceptQuote(quote.data?.fingerprint ?? null)}
          >
            {quote.isFetching ? 'Atualizando cotação…' : 'Revisar e aceitar esta cotação'}
          </Button>
        </div>
      )}

      {checkoutError && (
        <p className="mb-0 rounded-lg border border-(--color-destructive) p-4 text-sm" role="alert">
          {checkoutError}
        </p>
      )}
      <Button
        type="submit"
        form="checkout-form"
        className="h-14 w-full rounded-[28px] text-base font-bold max-[760px]:sticky max-[760px]:bottom-4 max-[760px]:rounded-full"
        disabled={!canSubmit}
      >
        {isConnecting ? 'Conectando carteira…' : isCreatingOrder ? 'Enviando pedido…' : 'Confirmar compra'}
      </Button>
    </aside>
  )
}
