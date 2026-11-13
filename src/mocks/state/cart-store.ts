import { getCatalogNfts, getNftDetailState } from '@/mocks/state/catalog-store'
import { getSessionState } from '@/mocks/state/account-store'
import type {
  AddCartItemInput,
  Cart,
  CartQuote,
  CartItem,
  CartMergeConflict,
  MergeCartInput,
  MergeCartResult,
  QuoteCartInput,
} from '@/features/cart/types'
import { ethToWei } from '@/lib/eth-to-wei'
import { weiToEth } from '@/lib/wei-to-eth'

const storageKey = 'kurio:mock-cart:visitor-anonymous'
const userStorageKey = 'kurio:mock-carts:users:v1'
const visitorId = 'visitor-anonymous'
let memoryItems: CartItem[] = []

type PersistedUserCarts = {
  carts: Record<string, CartItem[]>
  mergedKeys: Record<string, string[]>
}

let memoryUserCarts: PersistedUserCarts = { carts: {}, mergedKeys: {} }

const readItems = (): CartItem[] => {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey)
    if (stored) memoryItems = JSON.parse(stored) as CartItem[]
  } catch {
    // Memory remains the fallback when storage is unavailable or malformed.
  }
  return memoryItems
}

const writeItems = (items: CartItem[]) => {
  memoryItems = items
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(items))
  } catch {
    // The in-memory mock remains functional when storage is unavailable.
  }
}

const readUserCarts = (): PersistedUserCarts => {
  try {
    const stored = globalThis.localStorage?.getItem(userStorageKey)
    if (stored) memoryUserCarts = JSON.parse(stored) as PersistedUserCarts
  } catch {
    // Memory remains the deterministic fallback.
  }
  return memoryUserCarts
}

const writeUserCarts = (state: PersistedUserCarts) => {
  memoryUserCarts = state
  try {
    globalThis.localStorage?.setItem(userStorageKey, JSON.stringify(state))
  } catch {
    // Memory remains the deterministic fallback.
  }
}

const getOwner = (): Cart['owner'] => {
  const session = getSessionState()
  return session ? { kind: 'user', id: session.user.id } : { kind: 'visitor', id: visitorId }
}

const readCurrentItems = (): CartItem[] => {
  const owner = getOwner()
  return owner.kind === 'user' ? (readUserCarts().carts[owner.id] ?? []) : readItems()
}

const writeCurrentItems = (items: CartItem[]) => {
  const owner = getOwner()
  if (owner.kind === 'visitor') {
    writeItems(items)
    return
  }
  const state = readUserCarts()
  writeUserCarts({ ...state, carts: { ...state.carts, [owner.id]: items } })
}

const toCart = (items: CartItem[]): Cart => ({
  visitorId,
  owner: getOwner(),
  items: items.map((item) => ({
    ...item,
    lineTotalEth: weiToEth(ethToWei(item.unitPriceEth) * BigInt(item.quantity)),
  })),
  itemCount: items.reduce((total, item) => total + item.quantity, 0),
  updatedAt: new Date().toISOString(),
})

export const getCartState = (): Cart => {
  const catalog = getCatalogNfts()
  const reconciled = readCurrentItems().map((item) => {
    const nft = catalog.find((candidate) => candidate.id === item.nft.id)
    if (!nft) return { ...item, status: 'unavailable' as const }
    const edition = getNftDetailState(nft.id)?.editions.find((candidate) => candidate.id === item.editionId)
    const priceChanged = edition?.priceEth !== item.unitPriceEth
    return {
      ...item,
      nft,
      maxQuantity: edition ? Math.min(edition.availableQuantity, edition.maxPerOrder) : 0,
      status:
        !nft.available ||
        !edition ||
        edition.availableQuantity === 0 ||
        item.quantity > Math.min(edition.availableQuantity, edition.maxPerOrder)
          ? ('unavailable' as const)
          : priceChanged
            ? ('price-changed' as const)
            : ('available' as const),
      version: nft.version,
    }
  })
  writeCurrentItems(reconciled)
  return toCart(reconciled)
}

export const hydrateCartState = (serialized: string | null) => {
  if (getOwner().kind === 'user') return
  if (serialized === null) return
  try {
    const items = JSON.parse(serialized) as CartItem[]
    if (Array.isArray(items)) writeItems(items)
  } catch {
    writeItems([])
  }
}

export const addCartItemState = (input: AddCartItemInput): Cart | { error: string; maxQuantity?: number } => {
  const catalog = getCatalogNfts()
  const nft = catalog.find((item) => item.id === input.nftId)
  if (!nft) return { error: 'NFT_NOT_FOUND' }
  const detail = getNftDetailState(nft.id)
  if (!detail) return { error: 'EDITION_UNAVAILABLE' }
  const edition = detail.editions.find((item) => item.id === input.editionId)
  if (!edition || !nft.available || edition.availableQuantity === 0) return { error: 'EDITION_UNAVAILABLE' }
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) return { error: 'INVALID_QUANTITY' }

  const maxQuantity = Math.min(edition.availableQuantity, edition.maxPerOrder)
  const itemId = `${nft.id}:${edition.id}`
  const items = readCurrentItems()
  const current = items.find((item) => item.id === itemId)
  const nextQuantity = (current?.quantity ?? 0) + input.quantity
  if (nextQuantity > maxQuantity) return { error: 'QUANTITY_LIMIT', maxQuantity }

  const nextItem: CartItem = {
    id: itemId,
    nft,
    editionId: edition.id,
    editionLabel: edition.label,
    unitPriceEth: edition.priceEth,
    lineTotalEth: weiToEth(ethToWei(edition.priceEth) * BigInt(nextQuantity)),
    quantity: nextQuantity,
    maxQuantity,
    version: nft.version,
    status: 'available',
  }
  const next = current ? items.map((item) => (item.id === itemId ? nextItem : item)) : [...items, nextItem]
  writeCurrentItems(next)
  return toCart(next)
}

export const updateCartItemState = (
  itemId: string,
  quantity: number,
): Cart | { error: string; maxQuantity?: number } => {
  const items = readCurrentItems()
  const current = items.find((item) => item.id === itemId)
  if (!current) return { error: 'CART_ITEM_NOT_FOUND' }
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { error: 'INVALID_QUANTITY' }
  if (quantity > current.maxQuantity) return { error: 'QUANTITY_LIMIT', maxQuantity: current.maxQuantity }
  const next = items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
  writeCurrentItems(next)
  return toCart(next)
}

export const removeCartItemState = (itemId: string): Cart | { error: string } => {
  const items = readCurrentItems()
  if (!items.some((item) => item.id === itemId)) return { error: 'CART_ITEM_NOT_FOUND' }
  const next = items.filter((item) => item.id !== itemId)
  writeCurrentItems(next)
  return toCart(next)
}

export const removePurchasedCartItemsForUserState = (
  userId: string,
  purchasedItems: Array<{ id: string; quantity: number }>,
) => {
  const state = readUserCarts()
  const purchasedQuantities = new Map(purchasedItems.map((item) => [item.id, item.quantity]))
  const next = (state.carts[userId] ?? []).flatMap((item) => {
    const remaining = item.quantity - (purchasedQuantities.get(item.id) ?? 0)
    if (remaining <= 0) return []
    return [
      {
        ...item,
        quantity: remaining,
        lineTotalEth: weiToEth(ethToWei(item.unitPriceEth) * BigInt(remaining)),
      },
    ]
  })
  writeUserCarts({ ...state, carts: { ...state.carts, [userId]: next } })
}

export const acceptCurrentCartPrices = (): Cart => {
  const cart = getCartState()
  const next = cart.items.map((item) => {
    const detail = getNftDetailState(item.nft.id)
    const edition = detail?.editions.find((candidate) => candidate.id === item.editionId)
    const maxQuantity = edition ? Math.min(edition.availableQuantity, edition.maxPerOrder) : 0
    return {
      ...item,
      unitPriceEth: edition?.priceEth ?? item.unitPriceEth,
      maxQuantity,
      status:
        !detail?.available || !edition || item.quantity > maxQuantity
          ? ('unavailable' as const)
          : ('available' as const),
    }
  })
  writeCurrentItems(next)
  return toCart(next)
}

export const getCartQuoteState = (input: QuoteCartInput): CartQuote => {
  const cart = acceptCurrentCartPrices()
  const network = input.network ?? 'all'
  const items = network === 'all' ? cart.items : cart.items.filter((item) => item.nft.network === network)
  const subtotal = items.reduce(
    (total, item) => total + ethToWei(item.unitPriceEth) * BigInt(item.quantity),
    0n,
  )
  const normalizedCoupon = input.couponCode?.trim().toUpperCase() || null
  const discount = normalizedCoupon === 'KURIO10' ? subtotal / 10n : 0n
  const networkFee = items.length > 0 ? ethToWei('0.016') : 0n
  const fingerprint = [
    network,
    normalizedCoupon ?? '',
    ...items
      .map((item) => `${item.id}:${item.quantity}:${item.version}:${item.unitPriceEth}`)
      .sort((first, second) => first.localeCompare(second)),
  ].join('|')

  return {
    fingerprint,
    couponCode: normalizedCoupon,
    network,
    issuedAt: new Date().toISOString(),
    subtotalEth: weiToEth(subtotal),
    discountEth: weiToEth(discount),
    networkFeeEth: weiToEth(networkFee),
    totalEth: weiToEth(subtotal - discount + networkFee),
    valid: items.length > 0 && items.every((item) => item.status === 'available'),
  }
}

export const mergeVisitorCartState = (input: MergeCartInput): MergeCartResult | null => {
  const owner = getOwner()
  if (owner.kind !== 'user') return null
  const state = readUserCarts()
  const mergedKeys = state.mergedKeys[owner.id] ?? []
  if (mergedKeys.includes(input.idempotencyKey)) {
    return { cart: getCartState(), conflicts: [], alreadyMerged: true }
  }

  const catalog = getCatalogNfts()
  const nextItems = [...(state.carts[owner.id] ?? [])]
  const conflicts: CartMergeConflict[] = []

  for (const inputItem of input.items) {
    const nft = catalog.find((candidate) => candidate.id === inputItem.nftId)
    const edition = nft
      ? getNftDetailState(nft.id)?.editions.find((candidate) => candidate.id === inputItem.editionId)
      : undefined
    const existing = nextItems.find((item) => item.id === inputItem.id)
    if (!nft || !nft.available || !edition || edition.availableQuantity === 0) {
      conflicts.push({
        itemId: inputItem.id,
        requestedQuantity: inputItem.quantity,
        acceptedQuantity: existing?.quantity ?? 0,
        reason: 'unavailable',
      })
      continue
    }

    const maxQuantity = Math.min(edition.availableQuantity, edition.maxPerOrder)
    const requestedQuantity = (existing?.quantity ?? 0) + inputItem.quantity
    const acceptedQuantity = Math.min(requestedQuantity, maxQuantity)
    if (acceptedQuantity !== requestedQuantity) {
      conflicts.push({
        itemId: inputItem.id,
        requestedQuantity,
        acceptedQuantity,
        reason: 'quantity-adjusted',
      })
    }
    const nextItem: CartItem = {
      id: inputItem.id,
      nft,
      editionId: edition.id,
      editionLabel: edition.label,
      unitPriceEth: edition.priceEth,
      lineTotalEth: weiToEth(ethToWei(edition.priceEth) * BigInt(acceptedQuantity)),
      quantity: acceptedQuantity,
      maxQuantity,
      version: nft.version,
      status: 'available',
    }
    if (existing) {
      nextItems.splice(
        nextItems.findIndex((item) => item.id === inputItem.id),
        1,
        nextItem,
      )
    } else {
      nextItems.push(nextItem)
    }
  }

  writeUserCarts({
    carts: { ...state.carts, [owner.id]: nextItems },
    mergedKeys: { ...state.mergedKeys, [owner.id]: [...mergedKeys, input.idempotencyKey] },
  })
  writeItems([])
  return { cart: toCart(nextItems), conflicts, alreadyMerged: false }
}

export const resetCart = () => {
  writeItems([])
  writeUserCarts({ carts: {}, mergedKeys: {} })
}
