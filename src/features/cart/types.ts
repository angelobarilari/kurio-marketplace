import type { NftSummary } from '@/types/nft'
import type { Network } from '@/types/account'
import type { QuoteRevision } from '@/types/quote'
export type { CartTotals, QuoteRevision } from '@/types/quote'

export type CartOwner = { kind: 'visitor'; id: string } | { kind: 'user'; id: string }

export type Coupon = { code: string; status: 'valid' | 'invalid' | 'expired' }

export type CartItem = {
  id: string
  nft: NftSummary
  editionId: string
  editionLabel: string
  unitPriceEth: string
  lineTotalEth: string
  quantity: number
  maxQuantity: number
  version: number
  status: 'available' | 'price-changed' | 'unavailable'
}

export type Cart = {
  visitorId: string
  owner: CartOwner
  items: CartItem[]
  itemCount: number
  updatedAt: string
}

export type CartQuote = QuoteRevision

export type AddCartItemInput = { nftId: string; editionId: string; quantity: number }
export type UpdateCartItemInput = { itemId: string; quantity: number }
export type QuoteCartInput = { couponCode?: string | null; network?: Network }

export type CartMergeItem = Pick<CartItem, 'id' | 'editionId' | 'quantity'> & {
  nftId: string
}

export type MergeCartInput = {
  idempotencyKey: string
  items: CartMergeItem[]
}

export type CartMergeConflict = {
  itemId: string
  requestedQuantity: number
  acceptedQuantity: number
  reason: 'quantity-adjusted' | 'unavailable'
}

export type MergeCartResult = {
  cart: Cart
  conflicts: CartMergeConflict[]
  alreadyMerged: boolean
}

export type CartError = {
  code: string
  message: string
  maxQuantity?: number
}
