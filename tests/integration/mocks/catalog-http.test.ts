import assert from 'node:assert/strict'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { ethToWei } from '@/lib/eth-to-wei'
import { setupServer } from 'msw/node'
import { catalogHttpHandlers } from '@/mocks/handlers/catalog-http'
const origin = 'http://kurio.prerender'
const network = setupServer(...catalogHttpHandlers)
beforeAll(() => network.listen({ onUnhandledRequest: 'error' }))
afterEach(() => network.resetHandlers())
afterAll(() => network.close())

describe('Real MSW HTTP handlers', () => {
  it('returns distinct pages with consistent totals', async () => {
    const first = await (await fetch(`${origin}/api/nfts?page=1`)).json()
    const second = await (await fetch(`${origin}/api/nfts?page=2`)).json()
    const ids = new Set(first.items.map((item: { id: string }) => item.id))
    expect(second.items.every((item: { id: string }) => !ids.has(item.id))).toBe(true)
    expect(first.totalItems).toBe(second.totalItems)
    expect(first.totalPages).toBe(Math.ceil(first.totalItems / first.pageSize))
    expect(second.page).toBe(2)
  })
  it.each(['0', '-1', '1.5', 'NaN'])('normalizes invalid page %s', async (page) => {
    const response = await fetch(`${origin}/api/nfts?page=${page}`)
    expect(response.status).toBe(200)
    expect((await response.json()).page).toBe(1)
  })
  it('returns an empty page beyond the last page without losing metadata', async () => {
    const body = await (await fetch(`${origin}/api/nfts?page=999`)).json()
    expect(body.items).toEqual([])
    expect(body.totalItems).toBeGreaterThan(0)
    expect(body.page).toBe(999)
  })
  it('handles exact ETH price bounds inclusively', async () => {
    const body = await (await fetch(`${origin}/api/nfts?minPriceEth=1.19&maxPriceEth=1.19`)).json()
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every((item: { priceEth: string }) => item.priceEth === '1.19')).toBe(true)
  })
  it('recovers after a deterministic transient error', async () => {
    const failed = await fetch(`${origin}/api/nfts`, {
      headers: { 'x-kurio-mock-scenario': 'catalog-error' },
    })
    expect(failed.status).toBe(503)
    const recovered = await fetch(`${origin}/api/nfts`)
    expect(recovered.status).toBe(200)
    expect((await recovered.json()).items.length).toBeGreaterThan(0)
  })
  it('returns a deterministic empty scenario', async () => {
    const response = await fetch(`${origin}/api/nfts`, {
      headers: { 'x-kurio-mock-scenario': 'catalog-empty' },
    })
    expect(await response.json()).toMatchObject({ items: [], totalItems: 0, totalPages: 1 })
  })
  it('combines filters and returns coherent pagination', async () => {
    const response = await fetch(`${origin}/api/nfts?network=Ethereum&sort=price-asc&page=1`)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.pageSize, 9)
    assert.ok(body.items.every((item: { network: string }) => item.network === 'Ethereum'))
    assert.ok(body.totalItems > body.items.length)
    const values = body.items.map((item: { priceEth: string }) => ethToWei(item.priceEth))
    assert.ok(values.every((value: bigint, index: number) => index === 0 || values[index - 1] <= value))
  })
  it('rejects inverted price bounds', async () => {
    const response = await fetch(`${origin}/api/nfts?minPriceEth=2&maxPriceEth=1`)
    assert.equal(response.status, 400)
    assert.equal((await response.json()).code, 'INVALID_PRICE_RANGE')
  })
  it('distinguishes a nonexistent NFT from a transient failure', async () => {
    assert.equal((await fetch(`${origin}/api/nfts/missing`)).status, 404)
    const response = await fetch(`${origin}/api/nfts`, {
      headers: { 'x-kurio-mock-scenario': 'catalog-error' },
    })
    assert.equal(response.status, 503)
    assert.equal((await response.json()).code, 'CATALOG_UNAVAILABLE')
  })
})
