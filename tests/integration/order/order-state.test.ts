import assert from 'node:assert/strict'
import { describe, expect, it, vi } from 'vitest'
import { disconnectWalletState, getOrderState } from '@/mocks/state/order-store'
import {
  addCartItemState,
  getCartQuoteState,
  getCartState,
  removeCartItemState,
  updateCartItemState,
} from '@/mocks/state/cart-store'
import {
  createOrderState,
  getOrderByAttemptState,
  subscribeOrderState,
  transitionOrderState,
} from '@/mocks/state/order-store'
import { getNftDetailState } from '@/mocks/state/catalog-store'
import { updateCatalogNft } from '@/mocks/state/catalog-store'
import { prepareOrder } from '../../support/checkout'

describe('Checkout rejection and recovery', () => {
  it.each([
    ['displayName', 'A'],
    ['profileName', ''],
    ['username', 'invalid user'],
    ['email', 'invalid'],
    ['walletId', ''],
    ['walletAddress', 'invalid'],
    ['ensName', ''],
    ['secondaryWalletAddress', 'invalid'],
    ['referralCode', ''],
    ['collectorNote', 'x'.repeat(501)],
  ])('rejects invalid %s without reserving inventory or registering an attempt', (field, value) => {
    const input = prepareOrder()
    const stock = getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity
    const result = createOrderState({ ...input, checkout: { ...input.checkout, [field]: value } })
    expect(result).toMatchObject({
      status: 422,
      error: { code: 'VALIDATION_ERROR', fieldErrors: { [field]: expect.any(String) } },
    })
    expect(getOrderByAttemptState(input.idempotencyKey)).toBeNull()
    expect(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity).toBe(stock)
    expect(createOrderState(input)).toMatchObject({ created: true })
  })
  it('requires an active wallet connection', () => {
    const input = prepareOrder()
    disconnectWalletState(input.connectionId)
    expect(createOrderState(input)).toMatchObject({ status: 409, error: { code: 'WALLET_NOT_CONNECTED' } })
    expect(getOrderByAttemptState(input.idempotencyKey)).toBeNull()
  })
  it('rejects a wallet whose saved address changed without reserving inventory', () => {
    const input = prepareOrder()
    const stock = getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity

    expect(
      createOrderState({
        ...input,
        checkout: { ...input.checkout, walletAddress: '0x0000000000000000000000000000000000000001' },
      }),
    ).toMatchObject({ status: 409, error: { code: 'WALLET_CHANGED' } })
    expect(getOrderByAttemptState(input.idempotencyKey)).toBeNull()
    expect(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity).toBe(stock)
  })
  it('rejects an emptied cart', () => {
    const input = prepareOrder()
    removeCartItemState(getCartState().items[0].id)
    expect(createOrderState(input)).toMatchObject({ error: { code: 'CART_EMPTY' } })
  })
  it.each([
    ['EXPIRADO', 'COUPON_EXPIRED'],
    ['UNKNOWN', 'COUPON_INVALID'],
  ])('rejects coupon %s', (couponCode, code) => {
    const input = prepareOrder()
    input.quoteRevision.couponCode = couponCode
    expect(createOrderState(input)).toMatchObject({ status: 422, error: { code } })
  })
  it('releases reserved stock once when payment is declined', () => {
    const input = prepareOrder()
    const initialStock = getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity
    const result = createOrderState(input)
    assert.ok('order' in result)
    expect(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity).toBe(initialStock - 1)
    transitionOrderState(result.order.userId, result.order.id, 'declined')
    transitionOrderState(result.order.userId, result.order.id, 'declined')
    expect(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity).toBe(initialStock)
    expect(getCartState().itemCount).toBe(1)
  })
  it('preserves the confirmed receipt when replaying the same attempt', () => {
    const input = prepareOrder()
    const result = createOrderState(input)
    assert.ok('order' in result)
    const settled = transitionOrderState(result.order.userId, result.order.id, 'confirmed')
    const replay = createOrderState(input)
    expect(replay).toMatchObject({
      created: false,
      order: { status: 'confirmed', receipt: settled?.receipt },
    })
    expect(settled?.receipt?.transactionId).toMatch(/^0x[0-9a-f]{64}$/)
    expect(getOrderState(result.order.id)?.receipt?.quote).toEqual(settled?.quote)
  })
})

describe('Order idempotency and terminal states', () => {
  it('replays the same order without reserving inventory twice', () => {
    const input = prepareOrder()
    const first = createOrderState(input)
    assert.ok('order' in first)
    const remaining = getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity
    const replay = createOrderState(structuredClone(input))
    assert.ok('order' in replay)
    assert.equal(first.created, true)
    assert.equal(replay.created, false)
    assert.equal(replay.order.id, first.order.id)
    assert.equal(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity, remaining)
  })
  it('rejects the same idempotency key with a changed payload', () => {
    const input = prepareOrder()
    createOrderState(input)
    const result = createOrderState({
      ...input,
      checkout: { ...input.checkout, collectorNote: 'different' },
    })
    assert.ok('error' in result)
    assert.equal(result.status, 409)
    assert.equal(result.error.code, 'IDEMPOTENCY_CONFLICT')
  })
  it('rejects a stale quote without creating an attempt', () => {
    const input = prepareOrder()
    updateCatalogNft('emerald-ape-042', (nft) => ({ ...nft, priceEth: '2.1', version: nft.version + 1 }))
    const stock = getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity
    const result = createOrderState({
      ...input,
    })
    assert.ok('error' in result)
    assert.equal(result.error.code, 'QUOTE_STALE')
    assert.equal(result.status, 409)
    assert.equal(result.error.quoteRevision?.subtotalEth, '2.1')
    assert.notEqual(result.error.quoteRevision?.fingerprint, input.quoteRevision.fingerprint)
    assert.equal(getOrderByAttemptState(input.idempotencyKey), null)
    assert.equal(getNftDetailState('emerald-ape-042')!.editions[0].availableQuantity, stock)
  })
  it('rejects an unavailable cart against its current invalid quote without creating an attempt', () => {
    const input = prepareOrder()
    updateCatalogNft('emerald-ape-042', (nft) => ({ ...nft, available: false, version: nft.version + 1 }))
    input.quoteRevision = getCartQuoteState({ couponCode: null })

    expect(input.quoteRevision.valid).toBe(false)
    expect(createOrderState(input)).toMatchObject({
      status: 409,
      error: { code: 'CART_CONFLICT' },
    })
    expect(getOrderByAttemptState(input.idempotencyKey)).toBeNull()
    expect(getCartState().itemCount).toBe(1)
  })
  it('rolls back earlier reservations when a competing reservation consumes later stock', () => {
    const input = prepareOrder()
    addCartItemState({ nftId: 'sage-nomad-009', editionId: 'default', quantity: 1 })
    input.quoteRevision = getCartQuoteState({ couponCode: null })

    const storage = globalThis.localStorage
    const setItem = storage.setItem.bind(storage)
    let competingReservationApplied = false
    vi.spyOn(storage, 'setItem').mockImplementation((key, value) => {
      setItem(key, value)
      if (key !== 'kurio:mock-edition-inventory:v1' || competingReservationApplied) return
      competingReservationApplied = true
      const inventory = JSON.parse(value) as Record<string, number>
      setItem(key, JSON.stringify({ ...inventory, 'sage-nomad-009:default': 8 }))
    })

    expect(createOrderState(input)).toMatchObject({
      status: 409,
      error: { code: 'EDITION_UNAVAILABLE' },
    })
    expect(getNftDetailState('emerald-ape-042')?.editions[0].availableQuantity).toBe(8)
    expect(getNftDetailState('sage-nomad-009')?.editions[0].availableQuantity).toBe(0)
    expect(getOrderByAttemptState(input.idempotencyKey)).toBeNull()
  })
  it('removes only the quantity captured by a confirmed order', () => {
    const input = prepareOrder()
    const itemId = getCartState().items[0].id
    updateCartItemState(itemId, 2)
    input.quoteRevision = getCartQuoteState({ couponCode: null })

    const result = createOrderState(input)
    assert.ok('order' in result)
    assert.equal(result.order.items[0].quantity, 2)

    updateCartItemState(itemId, 3)
    transitionOrderState(result.order.userId, result.order.id, 'confirmed')
    expect(getCartState().items[0]).toMatchObject({ id: itemId, quantity: 1, lineTotalEth: '1.19' })
  })
  it('preserves unrelated cart items added after order creation', () => {
    const input = prepareOrder()
    const result = createOrderState(input)
    assert.ok('order' in result)

    addCartItemState({ nftId: 'sage-nomad-009', editionId: 'default', quantity: 1 })
    const laterItemId = getCartState().items.find((item) => item.nft.id === 'sage-nomad-009')?.id
    assert.ok(laterItemId)

    transitionOrderState(result.order.userId, result.order.id, 'confirmed')
    expect(getCartState().items.map((item) => item.id)).toEqual([laterItemId])
  })
  for (const status of ['confirmed', 'declined'] as const) {
    it(`keeps ${status} terminal and notifies once`, () => {
      const result = createOrderState(prepareOrder())
      assert.ok('order' in result)
      const { order } = result
      const updates = []
      const unsubscribe = subscribeOrderState(order.userId, order.id, (event) => updates.push(event))
      const settled = transitionOrderState(order.userId, order.id, status)
      assert.deepEqual(
        transitionOrderState(order.userId, order.id, status === 'confirmed' ? 'declined' : 'confirmed'),
        settled,
      )
      assert.equal(updates.length, 1)
      unsubscribe()
      assert.equal(getCartState().itemCount, status === 'confirmed' ? 0 : 1)
    })
  }
})
