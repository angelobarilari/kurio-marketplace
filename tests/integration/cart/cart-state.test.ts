import { describe, expect, it } from 'vitest'
import {
  addCartItemState,
  getCartState,
  getCartQuoteState,
  mergeVisitorCartState,
  updateCartItemState,
  removeCartItemState,
  hydrateCartState,
} from '@/mocks/state/cart-store'
import { logoutState, socialLoginState } from '@/mocks/state/account-store'
import { updateCatalogNft } from '@/mocks/state/catalog-store'
import { ethToWei } from '@/lib/eth-to-wei'

const item = { nftId: 'emerald-ape-042', editionId: 'default', quantity: 1 }

describe('Cart quantities and reconciliation', () => {
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid quantity %s without changing the cart',
    (quantity) => {
      expect(addCartItemState({ ...item, quantity })).toEqual({ error: 'INVALID_QUANTITY' })
      expect(getCartState().itemCount).toBe(0)
    },
  )
  it('combines identical NFT/edition pairs and calculates exact line totals', () => {
    addCartItemState(item)
    addCartItemState(item)
    const cart = getCartState()
    expect(cart.items).toHaveLength(1)
    expect(cart.itemCount).toBe(2)
    expect(ethToWei(cart.items[0].lineTotalEth)).toBe(ethToWei(cart.items[0].unitPriceEth) * 2n)
  })
  it('rejects quantities above the edition limit atomically', () => {
    addCartItemState(item)
    const before = getCartState().items
    const result = updateCartItemState(before[0].id, before[0].maxQuantity + 1)
    expect(result).toMatchObject({ error: 'QUANTITY_LIMIT' })
    expect(getCartState().items).toEqual(before)
  })
  it.each([0, -1, 1.5, NaN])('rejects invalid cart updates without changing quantity (%s)', (quantity) => {
    addCartItemState(item)
    const itemId = getCartState().items[0].id
    expect(updateCartItemState(itemId, quantity)).toEqual({ error: 'INVALID_QUANTITY' })
    expect(getCartState().items[0].quantity).toBe(1)
  })
  it('distinguishes missing NFTs and unavailable editions when adding', () => {
    expect(addCartItemState({ ...item, nftId: 'missing-nft' })).toEqual({ error: 'NFT_NOT_FOUND' })
    expect(addCartItemState({ ...item, editionId: 'missing-edition' })).toEqual({
      error: 'EDITION_UNAVAILABLE',
    })
    expect(addCartItemState({ ...item, editionId: 'one-of-one' })).toEqual({
      error: 'EDITION_UNAVAILABLE',
    })
    expect(getCartState().itemCount).toBe(0)
  })
  it('reports missing items without deleting existing ones', () => {
    addCartItemState(item)
    expect(removeCartItemState('missing')).toEqual({ error: 'CART_ITEM_NOT_FOUND' })
    expect(getCartState().itemCount).toBe(1)
  })
  it('reconciles a new price and changes the quote fingerprint', () => {
    addCartItemState(item)
    const before = getCartQuoteState({ couponCode: null })
    updateCatalogNft(item.nftId, (nft) => ({ ...nft, priceEth: '2.1', version: nft.version + 1 }))
    expect(getCartState().items[0].status).toBe('price-changed')
    const after = getCartQuoteState({ couponCode: null })
    expect(after.subtotalEth).toBe('2.1')
    expect(after.fingerprint).not.toBe(before.fingerprint)
  })
  it('marks unavailable inventory as an invalid quote', () => {
    addCartItemState(item)
    updateCatalogNft(item.nftId, (nft) => ({ ...nft, available: false, version: nft.version + 1 }))
    expect(getCartQuoteState({ couponCode: null }).valid).toBe(false)
    expect(getCartState().items[0].status).toBe('unavailable')
  })
})

describe('Quote totals and cart ownership', () => {
  it('charges no fee for an empty cart', () => {
    expect(getCartQuoteState({ couponCode: null })).toMatchObject({
      subtotalEth: '0',
      totalEth: '0',
      networkFeeEth: '0',
      valid: false,
    })
  })
  it('normalizes the coupon and calculates discount and total with integer wei', () => {
    addCartItemState(item)
    const quote = getCartQuoteState({ couponCode: ' kurio10 ' })
    const subtotal = ethToWei(quote.subtotalEth)
    expect(quote.couponCode).toBe('KURIO10')
    expect(ethToWei(quote.discountEth)).toBe(subtotal / 10n)
    expect(ethToWei(quote.totalEth)).toBe(subtotal - subtotal / 10n + ethToWei('0.016'))
  })
  it('quotes only the requested network and marks an empty network quote invalid', () => {
    addCartItemState(item)
    addCartItemState({ nftId: 'sage-nomad-009', editionId: 'default', quantity: 1 })

    const ethereum = getCartQuoteState({ couponCode: null, network: 'Ethereum' })
    const polygon = getCartQuoteState({ couponCode: null, network: 'Polygon' })
    const solana = getCartQuoteState({ couponCode: null, network: 'Solana' })

    expect(ethereum.subtotalEth).toBe('1.19')
    expect(polygon.subtotalEth).toBe('1.69')
    expect(ethereum.networkFeeEth).toBe('0.016')
    expect(solana).toMatchObject({
      subtotalEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
      valid: false,
    })
  })
  it('merges a visitor cart once and keeps accounts isolated', () => {
    addCartItemState(item)
    const visitor = getCartState()
    socialLoginState('google')
    expect(getCartState().itemCount).toBe(0)
    const input = {
      idempotencyKey: 'visitor-merge',
      items: visitor.items.map((entry) => ({
        id: entry.id,
        nftId: entry.nft.id,
        editionId: entry.editionId,
        quantity: entry.quantity,
      })),
    }
    expect(mergeVisitorCartState(input)?.alreadyMerged).toBe(false)
    expect(mergeVisitorCartState(input)?.alreadyMerged).toBe(true)
    expect(getCartState().itemCount).toBe(1)
    logoutState()
    expect(getCartState().itemCount).toBe(0)
    socialLoginState('facebook')
    expect(getCartState().itemCount).toBe(0)
    logoutState()
    socialLoginState('google')
    expect(getCartState().itemCount).toBe(1)
  })
  it('reports unavailable and quantity-adjusted visitor merge conflicts', () => {
    addCartItemState({ ...item, quantity: 4 })
    const visitorItem = getCartState().items[0]
    socialLoginState('google')
    addCartItemState({ ...item, quantity: 3 })

    const result = mergeVisitorCartState({
      idempotencyKey: 'conflicted-visitor-merge',
      items: [
        {
          id: visitorItem.id,
          nftId: visitorItem.nft.id,
          editionId: visitorItem.editionId,
          quantity: visitorItem.quantity,
        },
        { id: 'missing-nft:default', nftId: 'missing-nft', editionId: 'default', quantity: 1 },
      ],
    })

    expect(result).toMatchObject({
      alreadyMerged: false,
      cart: { itemCount: 5, items: [{ id: visitorItem.id, quantity: 5 }] },
      conflicts: [
        {
          itemId: visitorItem.id,
          requestedQuantity: 7,
          acceptedQuantity: 5,
          reason: 'quantity-adjusted',
        },
        {
          itemId: 'missing-nft:default',
          requestedQuantity: 1,
          acceptedQuantity: 0,
          reason: 'unavailable',
        },
      ],
    })
    expect(
      mergeVisitorCartState({
        idempotencyKey: 'conflicted-visitor-merge',
        items: [],
      })?.alreadyMerged,
    ).toBe(true)
    expect(getCartState().items[0].quantity).toBe(5)

    logoutState()
    expect(getCartState().itemCount).toBe(0)
  })
  it('does not merge a visitor cart without an authenticated owner', () => {
    expect(mergeVisitorCartState({ idempotencyKey: 'guest-merge', items: [] })).toBeNull()
  })
  it('ignores visitor hydration while signed in', () => {
    addCartItemState(item)
    const serialized = JSON.stringify(getCartState().items)
    socialLoginState('google')
    hydrateCartState(serialized)
    expect(getCartState().itemCount).toBe(0)
  })
  it('resets a malformed visitor snapshot safely', () => {
    addCartItemState(item)
    hydrateCartState('{broken')
    expect(getCartState().itemCount).toBe(0)
  })
})
