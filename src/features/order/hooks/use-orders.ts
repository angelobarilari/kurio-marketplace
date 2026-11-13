import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrder, getOrderByAttempt } from '@/features/order/api/orders'
import type { Order } from '@/types/order'

export const orderKeys = {
  detail: (sessionId: string, orderId: string) => ['account', sessionId, 'orders', orderId] as const,
  byAttempt: (sessionId: string, idempotencyKey: string) =>
    ['account', sessionId, 'order-attempts', idempotencyKey] as const,
}

export const useOrder = (sessionId: string, orderId: string) =>
  useQuery({
    queryKey: orderKeys.detail(sessionId, orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: Boolean(sessionId && orderId),
    meta: { private: true },
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  })

export const useOrderByAttempt = (sessionId: string, idempotencyKey: string) =>
  useQuery({
    queryKey: orderKeys.byAttempt(sessionId, idempotencyKey),
    queryFn: ({ signal }) => getOrderByAttempt(idempotencyKey, signal),
    enabled: Boolean(sessionId && idempotencyKey),
    meta: { private: true },
    retry: false,
    staleTime: 0,
  })

export const setOrderCacheFromEvent = (
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId: string,
  order: Order,
) =>
  queryClient.setQueryData<Order>(orderKeys.detail(sessionId, order.id), (current) =>
    !current || current.version < order.version ? order : current,
  )
