import assert from 'node:assert/strict'
import { describe, expect, it } from 'vitest'
import { applyNftUpdate } from '@/features/catalog/utils/apply-nft-update'
import { createOrderState } from '@/mocks/state/order-store'
import { createQueryClient } from '@/lib/query-client'
import { getNftDetailState } from '@/mocks/state/catalog-store'
import { orderKeys, setOrderCacheFromEvent } from '@/features/order/hooks/use-orders'
import { prepareOrder } from '../../support/checkout'
import type { NftDetail } from '@/types/nft'
import type { NftListResponse } from '@/features/catalog/types'
import type { Order } from '@/types/order'

describe('Versioned events and cache isolation', () => {
  it('does not create cache entries for unknown NFTs', () => {
    const query = createQueryClient()
    applyNftUpdate(query, { id: 'missing', version: 10, priceEth: '2', available: false })
    expect(query.getQueryCache().getAll()).toHaveLength(0)
    query.clear()
  })
  it('updates availability across cached filter variants without touching other NFTs', () => {
    const query = createQueryClient()
    const nft = getNftDetailState('emerald-ape-042')!
    const other = { ...nft, id: 'other' }
    for (const network of ['Ethereum', 'Polygon']) {
      query.setQueryData(['nfts', { network }], { items: [nft, other], totalItems: 2 })
    }
    applyNftUpdate(query, { id: nft.id, version: nft.version + 1, priceEth: '2', available: false })
    for (const network of ['Ethereum', 'Polygon']) {
      const cached = query.getQueryData<NftListResponse>(['nfts', { network }])!
      expect(cached.items[0]).toMatchObject({ priceEth: '2', available: false })
      expect(cached.items[1]).toEqual(other)
      expect(cached.totalItems).toBe(2)
    }
    query.clear()
  })
  it('does not regress list/detail prices after duplicates and out-of-order NFT events', () => {
    const query = createQueryClient()
    const detail = getNftDetailState('emerald-ape-042')
    assert.ok(detail)
    query.setQueryData(['nfts', { page: 1 }], { items: [detail] })
    query.setQueryData(['nfts', 'detail', detail.id], detail)
    for (const version of [4, 4, 2, 3]) {
      applyNftUpdate(query, {
        id: detail.id,
        version,
        priceEth: version === 4 ? '1.75' : '9.99',
        available: true,
      })
    }
    assert.equal(query.getQueryData<NftListResponse>(['nfts', { page: 1 }])!.items[0].priceEth, '1.75')
    assert.equal(query.getQueryData<NftDetail>(['nfts', 'detail', detail.id])!.editions[0].priceEth, '1.75')
    query.clear()
  })
  it('updates only the session owning an order and ignores older versions', () => {
    const query = createQueryClient()
    const result = createOrderState(prepareOrder())
    assert.ok('order' in result)
    const { order } = result
    setOrderCacheFromEvent(query, 'session-a', { ...order, version: 4, status: 'confirmed' })
    setOrderCacheFromEvent(query, 'session-a', { ...order, version: 3, status: 'pending' })
    assert.equal(query.getQueryData<Order>(orderKeys.detail('session-a', order.id))!.status, 'confirmed')
    assert.equal(query.getQueryData(orderKeys.detail('session-b', order.id)), undefined)
    query.clear()
  })
})
