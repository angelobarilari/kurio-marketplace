import { useCallback, useEffect } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { sessionQueryKey, useSession } from '@/features/auth/hooks/use-session'
import { useOrder } from '@/features/order/hooks/use-orders'
import { useMediaQuery } from '@/hooks/use-media-query'

export const useOrderPageController = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const session = useSession()
  const sessionId = session.data?.id ?? ''
  const order = useOrder(sessionId, orderId)
  const isMobile = useMediaQuery('(max-width: 760px)')
  const unauthorized = isAxiosError(order.error) && order.error.response?.status === 401
  const notFound = isAxiosError(order.error) && order.error.response?.status === 404

  useEffect(() => {
    if (!order.isError || !unauthorized) return
    queryClient.removeQueries({ queryKey: sessionQueryKey })
    queryClient.removeQueries({ predicate: (query) => query.meta?.private === true })
    void navigate({ to: '/login', search: { returnTo: `/orders/${orderId}` }, replace: true })
  }, [navigate, order.isError, orderId, queryClient, unauthorized])

  const searchCatalog = useCallback(
    (value: string) => void navigate({ to: '/', search: { q: value || undefined }, hash: 'catalog' }),
    [navigate],
  )
  const goHome = useCallback(() => void navigate({ to: '/', replace: true }), [navigate])
  const retryCheckout = useCallback(() => {
    if (!order.data) return
    void navigate({
      to: '/checkout',
      search: {
        couponCode: order.data.quote.couponCode ?? undefined,
        network: order.data.checkout.network,
      },
    })
  }, [navigate, order.data])

  if (session.isPending) return { status: 'loading-session' as const, searchCatalog }
  if (!session.data) {
    return session.isError
      ? { status: 'session-error' as const, searchCatalog, retry: session.refetch }
      : { status: 'unauthenticated' as const, orderId, searchCatalog }
  }
  if (order.isPending) {
    return {
      status: 'loading-order' as const,
      orderId,
      sessionId,
      userId: session.data.user.id,
      searchCatalog,
    }
  }
  if (order.isError || !order.data) {
    if (unauthorized) return { status: 'redirecting' as const, searchCatalog }
    return {
      status: 'load-error' as const,
      notFound,
      searchCatalog,
      retry: order.refetch,
    }
  }
  return {
    status: 'ready' as const,
    order: order.data,
    orderId,
    sessionId,
    userId: session.data.user.id,
    isMobile,
    isFetching: order.isFetching,
    searchCatalog,
    goHome,
    retry: order.refetch,
    retryCheckout,
  }
}
