import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCartItem, getCart, quoteCart, removeCartItem, updateCartItem } from '@/features/cart/api/cart'
import type { AddCartItemInput, Cart, QuoteCartInput, UpdateCartItemInput } from '@/features/cart/types'
import { useSession } from '@/features/auth/hooks/use-session'
import type { Network } from '@/types/account'
import { cartKeys, getCartOwnerId } from '@/features/cart/query-keys'

export const useCart = () => {
  const session = useSession()
  return useQuery({
    queryKey: cartKeys.detail(getCartOwnerId(session.data?.user.id)),
    queryFn: ({ signal }) => getCart(signal),
    enabled: session.isSuccess,
    meta: { private: Boolean(session.data) },
    staleTime: 15_000,
  })
}

export const useCartQuote = (couponCode: string | null, enabled = true, network?: Network) => {
  const session = useSession()
  const ownerId = getCartOwnerId(session.data?.user.id)
  return useQuery({
    queryKey: cartKeys.quote(ownerId, couponCode, network),
    queryFn: ({ signal }) => quoteCart({ couponCode, network }, signal),
    enabled: enabled && session.isSuccess,
    meta: { private: Boolean(session.data) },
    retry: false,
  })
}

const useCartMutation = <TInput>(mutationFn: (input: TInput) => Promise<Cart>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      const ownerId = cart.owner.kind === 'user' ? cart.owner.id : 'visitor'
      queryClient.setQueryData(cartKeys.detail(ownerId), cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export const useAddCartItem = () => useCartMutation<AddCartItemInput>(addCartItem)

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  const session = useSession()
  const queryKey = cartKeys.detail(getCartOwnerId(session.data?.user.id))
  return useMutation({
    mutationFn: updateCartItem,
    onMutate: async ({ itemId, quantity }: UpdateCartItemInput) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Cart>(queryKey)
      queryClient.setQueryData<Cart>(queryKey, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
              itemCount: current.items.reduce(
                (total, item) => total + (item.id === itemId ? quantity : item.quantity),
                0,
              ),
            }
          : current,
      )
      return { previous, queryKey }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}

export const useRemoveCartItem = () => useCartMutation<string>(removeCartItem)

export const useRefreshQuote = () => {
  const queryClient = useQueryClient()
  const session = useSession()
  const ownerId = getCartOwnerId(session.data?.user.id)
  return (input: QuoteCartInput) =>
    queryClient.fetchQuery({
      queryKey: cartKeys.quote(ownerId, input.couponCode ?? null, input.network),
      queryFn: () => quoteCart(input),
    })
}
