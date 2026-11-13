import { httpClient } from '@/lib/http-client'
import type {
  AddCartItemInput,
  Cart,
  CartQuote,
  CartItem,
  MergeCartInput,
  MergeCartResult,
  QuoteCartInput,
  UpdateCartItemInput,
} from '@/features/cart/types'

export const getCart = async (signal?: AbortSignal): Promise<Cart> => {
  const response = await httpClient.get<Cart>('/cart', { signal })
  return response.data
}

export const addCartItem = async (input: AddCartItemInput): Promise<Cart> => {
  const response = await httpClient.post<Cart>('/cart/items', input)
  return response.data
}

export const updateCartItem = async ({ itemId, quantity }: UpdateCartItemInput): Promise<Cart> => {
  const response = await httpClient.patch<Cart>(`/cart/items/${itemId}`, { quantity })
  return response.data
}

export const removeCartItem = async (itemId: string): Promise<Cart> => {
  const response = await httpClient.delete<Cart>(`/cart/items/${itemId}`)
  return response.data
}

export const quoteCart = async (input: QuoteCartInput, signal?: AbortSignal): Promise<CartQuote> => {
  const response = await httpClient.post<CartQuote>('/cart/quote', input, { signal })
  return response.data
}

/**
 * Builds the idempotent cart-merge payload from the visitor snapshot persisted for mock refreshes.
 *
 * The local snapshot is transport state for the simulated backend, not a production server-of-record.
 */
const getVisitorMergeInput = (): MergeCartInput => {
  const visitorId =
    globalThis.localStorage?.getItem('kurio:visitor-id') ?? `visitor-${globalThis.crypto.randomUUID()}`
  globalThis.localStorage?.setItem('kurio:visitor-id', visitorId)
  let items: CartItem[] = []
  try {
    const stored = globalThis.localStorage?.getItem('kurio:visitor-cart')
    if (stored) items = JSON.parse(stored) as CartItem[]
  } catch {
    items = []
  }
  const mergeItems = items
    .map((item) => ({ id: item.id, nftId: item.nft.id, editionId: item.editionId, quantity: item.quantity }))
    .sort((first, second) => first.id.localeCompare(second.id))
  return {
    idempotencyKey: `${visitorId}:${mergeItems.map((item) => `${item.id}:${item.quantity}`).join('|') || 'empty'}`,
    items: mergeItems,
  }
}

export const mergeVisitorCart = async (): Promise<MergeCartResult> => {
  const response = await httpClient.post<MergeCartResult>('/cart/merge', getVisitorMergeInput())
  return response.data
}
