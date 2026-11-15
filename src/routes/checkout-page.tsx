import { lazy, Suspense } from 'react'
import { MarketplaceCommercePage } from '@/components/layout/marketplace-commerce-page'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { CheckoutAttemptStatus } from '@/features/checkout/components/checkout-attempt-status'
import { CheckoutCollectorForm } from '@/features/checkout/components/checkout-collector-form'
import { CheckoutPageState } from '@/features/checkout/components/checkout-page-state'
import { useCheckoutController } from '@/features/checkout/hooks/use-checkout-controller'
import { Skeleton } from '@/components/ui/skeleton'

const CheckoutPaymentPanel = lazy(() =>
  import('@/features/checkout/components/checkout-payment-panel').then((module) => ({
    default: module.CheckoutPaymentPanel,
  })),
)

export const CheckoutPage = () => {
  const checkout = useCheckoutController()

  if (checkout.status === 'state') {
    return <CheckoutPageState state={checkout.pageState} onSearchChange={checkout.searchCatalog} />
  }

  return (
    <MarketplaceShell onSearchChange={checkout.searchCatalog}>
      <MarketplaceCommercePage {...checkout.page}>
        <CheckoutAttemptStatus model={checkout.attempt} />
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] items-start gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-8">
          <CheckoutCollectorForm
            form={checkout.form}
            model={checkout.collector.model}
            actions={checkout.collector.actions}
          />
          {(!checkout.payment.model.isMobile || checkout.payment.model.mobileStep === 'payment') && (
            <Suspense
              fallback={
                <div className="min-w-0 space-y-3" role="status" aria-label="Carregando pagamento">
                  <Skeleton className="h-56 w-full" />
                </div>
              }
            >
              <CheckoutPaymentPanel
                form={checkout.form}
                model={checkout.payment.model}
                actions={checkout.payment.actions}
              />
            </Suspense>
          )}
        </div>
      </MarketplaceCommercePage>
    </MarketplaceShell>
  )
}
