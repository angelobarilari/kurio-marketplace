import { MarketplaceCommercePage } from '@/components/layout/marketplace-commerce-page'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { CheckoutAttemptStatus } from '@/features/checkout/components/checkout-attempt-status'
import { CheckoutCollectorForm } from '@/features/checkout/components/checkout-collector-form'
import { CheckoutPageState } from '@/features/checkout/components/checkout-page-state'
import { CheckoutPaymentPanel } from '@/features/checkout/components/checkout-payment-panel'
import { useCheckoutController } from '@/features/checkout/hooks/use-checkout-controller'

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
          <CheckoutPaymentPanel
            form={checkout.form}
            model={checkout.payment.model}
            actions={checkout.payment.actions}
          />
        </div>
      </MarketplaceCommercePage>
    </MarketplaceShell>
  )
}
