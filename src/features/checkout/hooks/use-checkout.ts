import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  connectCheckoutWallet,
  createOrder,
  disconnectCheckoutWallet,
  getCheckoutWalletConnection,
} from '@/features/checkout/api/checkout'
import { orderKeys } from '@/features/order/hooks/use-orders'
import type { CreateOrderInput, WalletConnection, WalletConnectionInput } from '@/types/order'

export const checkoutKeys = {
  connection: (sessionId: string) => ['account', sessionId, 'checkout', 'wallet-connection'] as const,
}

export const useConnectCheckoutWallet = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WalletConnectionInput) => connectCheckoutWallet(input),
    onSuccess: (connection) => queryClient.setQueryData(checkoutKeys.connection(sessionId), connection),
  })
}

export const useCheckoutWalletConnection = (sessionId: string) =>
  useQuery({
    queryKey: checkoutKeys.connection(sessionId),
    queryFn: ({ signal }) => getCheckoutWalletConnection(signal),
    enabled: Boolean(sessionId),
    meta: { private: true },
    retry: false,
  })

export const useDisconnectCheckoutWallet = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectCheckoutWallet,
    onSuccess: () =>
      queryClient.setQueryData<WalletConnection | null>(checkoutKeys.connection(sessionId), null),
  })
}

export const useCreateOrder = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(sessionId, order.id), order)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
