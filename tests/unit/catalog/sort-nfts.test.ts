import { describe, expect, it } from 'vitest'
import { sortNfts } from '@/features/catalog/utils/sort-nfts'
import { makeNft } from '../../support/nft'

describe('Catalog ordering', () => {
  const source = [
    makeNft({ id: 'b', priceEth: '1.000000000000000001', popularity: 5, createdAt: '2026-02-01' }),
    makeNft({ id: 'c', priceEth: '1', popularity: 10, createdAt: '2026-01-01' }),
    makeNft({ id: 'a', priceEth: '1', popularity: 10, createdAt: '2026-01-01' }),
  ]
  it.each([
    ['price-asc', ['a', 'c', 'b']],
    ['price-desc', ['b', 'a', 'c']],
    ['popular', ['a', 'c', 'b']],
    ['newest', ['b', 'a', 'c']],
    ['recent', ['b', 'c', 'a']],
  ] as const)('sorts by %s with deterministic ties and no source mutation', (sort, ids) => {
    const input = structuredClone(source)
    const result = sortNfts(input, sort)
    expect(result.map((nft) => nft.id)).toEqual(ids)
    expect(input).toEqual(source)
    expect(result).not.toBe(input)
  })
  it('supports an empty catalog', () => {
    expect(sortNfts([], 'price-asc')).toEqual([])
  })
})
