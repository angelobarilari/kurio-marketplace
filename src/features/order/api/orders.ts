import { httpClient } from '@/lib/http-client'
import type { Order } from '@/types/order'

export const getOrder = async (orderId: string, signal?: AbortSignal): Promise<Order> => {
  const response = await httpClient.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return response.data
}

export const getOrderByAttempt = async (idempotencyKey: string, signal?: AbortSignal): Promise<Order> => {
  const response = await httpClient.get<Order>(
    `/orders/by-idempotency/${encodeURIComponent(idempotencyKey)}`,
    { signal },
  )
  return response.data
}
