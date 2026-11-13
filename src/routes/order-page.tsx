import { Navigate } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import {
  OrderLoadError,
  OrderRedirecting,
  OrderSessionError,
} from '@/features/order/components/order-page-states'
import { OrderRealtimeSync } from '@/features/order/components/order-realtime-sync'
import { OrderSkeleton } from '@/features/order/components/order-skeleton'
import { OrderStatusPanel } from '@/features/order/components/order-status-panel'
import { ReceiptConfirmation } from '@/features/order/components/receipt/receipt-confirmation'
import { useOrderPageController } from '@/features/order/hooks/use-order-page-controller'

export const OrderPage = () => {
  const page = useOrderPageController()

  if (page.status === 'unauthenticated') {
    return <Navigate to="/login" search={{ returnTo: `/orders/${page.orderId}` }} replace />
  }

  if (page.status === 'loading-session') {
    return (
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        <OrderSkeleton />
      </MarketplaceShell>
    )
  }

  if (page.status === 'session-error') {
    return (
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        <OrderSessionError onRetry={() => void page.retry()} />
      </MarketplaceShell>
    )
  }

  if (page.status === 'redirecting') return <OrderRedirecting />

  if (page.status === 'load-error') {
    return (
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        <OrderLoadError notFound={page.notFound} onRetry={() => void page.retry()} />
      </MarketplaceShell>
    )
  }

  if (page.status === 'loading-order') {
    return (
      <>
        <OrderRealtimeSync sessionId={page.sessionId} userId={page.userId} orderId={page.orderId} />
        <MarketplaceShell onSearchChange={page.searchCatalog}>
          <OrderSkeleton />
        </MarketplaceShell>
      </>
    )
  }

  return (
    <>
      <OrderRealtimeSync sessionId={page.sessionId} userId={page.userId} orderId={page.orderId} />
      <MarketplaceShell onSearchChange={page.searchCatalog}>
        {page.order.status === 'confirmed' && page.order.receipt ? (
          <ReceiptConfirmation order={page.order} isMobile={page.isMobile} onClose={page.goHome} />
        ) : (
          <OrderStatusPanel
            order={page.order}
            isFetching={page.isFetching}
            onRefresh={() => void page.retry()}
            onRetryCheckout={page.retryCheckout}
          />
        )}
      </MarketplaceShell>
    </>
  )
}
