import { httpClient } from '@/lib/http-client'
import type { CreateOrderInput, Order, WalletConnection, WalletConnectionInput } from '@/types/order'

export const connectCheckoutWallet = async (input: WalletConnectionInput): Promise<WalletConnection> => {
  const response = await httpClient.post<WalletConnection>('/checkout/wallet-connection', input)
  return response.data
}

export const getCheckoutWalletConnection = async (signal?: AbortSignal): Promise<WalletConnection | null> => {
  const response = await httpClient.get<WalletConnection | null>('/checkout/wallet-connection', { signal })
  return response.data
}

export const disconnectCheckoutWallet = async (connectionId: string): Promise<void> => {
  await httpClient.delete(`/checkout/wallet-connection/${encodeURIComponent(connectionId)}`)
}

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  const response = await httpClient.post<Order>('/orders', input, {
    headers: { 'Idempotency-Key': input.idempotencyKey },
  })
  return response.data
}
