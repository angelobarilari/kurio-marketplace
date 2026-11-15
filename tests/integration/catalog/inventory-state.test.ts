import { describe, expect, it } from 'vitest'
import { getNftDetailState, releaseNftEdition, reserveNftEdition } from '@/mocks/state/catalog-store'

describe('Edition inventory reservations', () => {
  it('reserves only available quantities and releases stock without underflow', () => {
    const nftId = 'emerald-ape-042'
    const editionId = 'default'

    expect(
      getNftDetailState(nftId)?.editions.find((edition) => edition.id === editionId)?.availableQuantity,
    ).toBe(8)
    expect(reserveNftEdition(nftId, editionId, 2)).toBe(true)
    expect(
      getNftDetailState(nftId)?.editions.find((edition) => edition.id === editionId)?.availableQuantity,
    ).toBe(6)
    expect(reserveNftEdition(nftId, editionId, 0)).toBe(false)
    expect(reserveNftEdition(nftId, editionId, 7)).toBe(false)
    expect(reserveNftEdition(nftId, 'missing-edition', 1)).toBe(false)
    expect(reserveNftEdition('missing-nft', editionId, 1)).toBe(false)

    releaseNftEdition(nftId, editionId, 1)
    expect(
      getNftDetailState(nftId)?.editions.find((edition) => edition.id === editionId)?.availableQuantity,
    ).toBe(7)
    releaseNftEdition(nftId, editionId, 8)
    expect(
      getNftDetailState(nftId)?.editions.find((edition) => edition.id === editionId)?.availableQuantity,
    ).toBe(8)
  })
})
