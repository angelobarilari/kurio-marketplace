import { useCallback, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from '@tanstack/react-router'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks/use-cart'
import type { CartError, CartItem } from '@/features/cart/types'

export const useCartPageController = () => {
  const navigate = useNavigate()
  const cart = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const [feedback, setFeedback] = useState('')
  const mutationError = updateItem.error ?? removeItem.error

  const searchCatalog = useCallback(
    (value: string) => void navigate({ to: '/', search: { q: value || undefined }, hash: 'catalog' }),
    [navigate],
  )

  const goToCatalog = useCallback(() => void navigate({ to: '/', hash: 'catalog' }), [navigate])
  const changeQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      setFeedback('')
      updateItem.mutate(
        { itemId: item.id, quantity },
        { onSuccess: () => setFeedback(`Quantidade de ${item.nft.name} atualizada.`) },
      )
    },
    [updateItem],
  )
  const remove = useCallback(
    (item: CartItem) => {
      setFeedback('')
      removeItem.mutate(item.id, {
        onSuccess: () => setFeedback(`${item.nft.name} removido do carrinho.`),
      })
    },
    [removeItem],
  )

  return {
    cart,
    feedback,
    mutationPending: updateItem.isPending || removeItem.isPending,
    mutationMessage: isAxiosError<CartError>(mutationError)
      ? mutationError.response?.data.message
      : undefined,
    searchCatalog,
    goToCatalog,
    changeQuantity,
    remove,
  }
}
