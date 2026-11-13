import { useId } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field-label'
import { Input } from '@/components/ui/input'
import { MobileBottomPanel } from '@/components/layout/mobile-bottom-panel'
import { Separator } from '@/components/ui/separator'
import { useAuthFlow } from '@/features/auth/components/auth-flow-context'
import { useSession } from '@/features/auth/hooks/use-session'
import { useCouponApplication } from '@/features/cart/hooks/use-coupon-application'
import type { CartError } from '@/features/cart/types'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

type CartSummaryProps = { hasItems: boolean; hasConflict: boolean }
type SummaryVariant = 'desktop' | 'mobile'

export const CartSummary = ({ hasItems, hasConflict }: CartSummaryProps) => {
  const navigate = useNavigate()
  const session = useSession()
  const { openAuthDialog, registerPostAuthAction } = useAuthFlow()
  const coupon = useCouponApplication({ enabled: hasItems })
  const { couponCode, couponInput, couponError, couponErrorRetryable, isApplyingCoupon, quote } = coupon
  const isMobile = useMediaQuery('(max-width: 760px)')
  const id = useId()
  const error = isAxiosError<CartError>(quote.error) ? quote.error.response?.data : undefined
  const openCheckout = (trigger: HTMLButtonElement) => {
    const search = { couponCode: quote.data?.couponCode ?? undefined }
    if (session.data) {
      void navigate({ to: '/checkout', search })
      return
    }

    if (isMobile) {
      void navigate({ to: '/login', search: { returnTo: '/checkout', ...search } })
      return
    }

    registerPostAuthAction(async () => {
      await navigate({ to: '/checkout', search })
    }, 'Não foi possível continuar para o checkout. Tente novamente.')
    openAuthDialog(trigger)
  }

  const renderSummary = (variant: SummaryVariant) => {
    const mobile = variant === 'mobile'
    const couponId = `coupon-code-${id}-${variant}`

    return (
      <>
        <h2 id={`cart-summary-title-${variant}`} className={mobile ? 'sr-only' : 'mb-3 text-xl font-bold'}>
          Resumo da carteira
        </h2>
        <Separator className={mobile ? 'hidden' : 'mb-6'} />
        <form
          className={mobile ? 'mb-4' : 'mb-7'}
          onSubmit={(event) => {
            event.preventDefault()
            void coupon.applyCoupon()
          }}
        >
          <FieldLabel htmlFor={couponId} className={mobile ? 'sr-only' : 'mb-2 block text-sm font-bold'}>
            Código promocional
          </FieldLabel>
          <div
            data-testid={mobile ? 'mobile-coupon-control' : undefined}
            className={cn(
              'flex min-w-0',
              mobile && 'rounded-full shadow-[0_4px_18px_#0009,0_0_16px_#e89b5580]',
            )}
          >
            <Input
              id={couponId}
              value={couponInput}
              onChange={(event) => coupon.updateCouponInput(event.target.value)}
              placeholder="Digite o cupom"
              className={`h-11 min-w-0 flex-1 ${mobile ? 'rounded-l-full rounded-r-none' : 'rounded-r-none'}`}
              disabled={!hasItems || isApplyingCoupon}
            />
            <Button
              type="submit"
              className={`h-11 shrink-0 px-4 ${mobile ? 'rounded-l-none rounded-r-full' : 'rounded-l-none'}`}
              disabled={!hasItems || quote.isFetching || isApplyingCoupon}
            >
              {isApplyingCoupon ? 'Validando…' : 'Aplicar'}
            </Button>
          </div>
          {couponCode && quote.data?.couponCode && (
            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto justify-start p-0 text-xs text-(--color-primary-bright)"
              onClick={coupon.removeCoupon}
            >
              Remover cupom {quote.data.couponCode}
            </Button>
          )}
          {(couponError || error) && (
            <p className="mt-2 mb-0 text-sm text-(--color-destructive)" role="alert">
              {couponError ?? error?.message}
            </p>
          )}
          {couponErrorRetryable && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              disabled={isApplyingCoupon}
              onClick={() => void coupon.applyCoupon()}
            >
              Tentar novamente
            </Button>
          )}
        </form>

        {quote.isPending && hasItems ? (
          <p className="text-sm text-(--color-muted)" role="status">
            Atualizando valores...
          </p>
        ) : quote.isError && !error ? (
          <div role="alert">
            <p>Não foi possível carregar a cotação.</p>
            <Button type="button" variant="outline" onClick={() => void quote.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <dl className={`grid ${mobile ? 'gap-3 text-sm' : 'gap-4 text-base'}`}>
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd className="m-0 shrink-0">{quote.data?.subtotalEth ?? '0'} ETH</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Desconto do lançamento</dt>
              <dd className="m-0 shrink-0">(-) {quote.data?.discountEth ?? '0'} ETH</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Taxa de rede</dt>
              <dd className="m-0 shrink-0 text-right">
                {quote.data?.networkFeeEth ?? '0'} ETH
                <span className="block text-xs text-(--color-primary-bright)">Taxa estimada</span>
              </dd>
            </div>
            <Separator />
            <div className={`flex justify-between gap-4 font-bold ${mobile ? 'text-base' : 'text-lg'}`}>
              <dt>Total</dt>
              <dd className="m-0 shrink-0 text-(--color-primary-bright)">
                {quote.data?.totalEth ?? '0'} ETH
              </dd>
            </div>
          </dl>
        )}

        <Button
          type="button"
          className={
            mobile
              ? 'mt-4 h-14 w-full rounded-full text-base font-bold'
              : 'mt-8 h-12 w-full text-base font-bold'
          }
          disabled={!hasItems || hasConflict || quote.isFetching || !quote.data?.valid}
          onClick={(event) => openCheckout(event.currentTarget)}
        >
          {quote.isFetching ? 'Atualizando cotação...' : 'Conectar e finalizar'}
        </Button>
        {!mobile && (
          <Button asChild variant="link" className="mt-2 w-full text-(--color-primary-bright)">
            <Link to="/" hash="catalog">
              Continuar explorando
            </Link>
          </Button>
        )}
      </>
    )
  }

  return (
    <>
      <aside className="min-w-0 max-[760px]:hidden" aria-labelledby="cart-summary-title-desktop">
        {renderSummary('desktop')}
      </aside>
      <MobileBottomPanel
        data-testid="mobile-cart-summary"
        aria-labelledby="cart-summary-title-mobile"
        className="max-h-[78dvh] overflow-y-auto bg-(--color-panel) px-5.5 pt-4"
      >
        {renderSummary('mobile')}
      </MobileBottomPanel>
    </>
  )
}
