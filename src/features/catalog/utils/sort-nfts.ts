import { ethToWei } from '@/lib/eth-to-wei'
import type { CatalogSort } from '@/features/catalog/types'
import type { Nft } from '@/types/nft'

/**
 * Sorts NFTs deterministically without mutating the input array.
 *
 * @param items NFTs to sort.
 * @param sort Sort order to apply.
 * @returns A new array in the requested order, using NFT IDs as tie-breakers.
 */
export const sortNfts = (items: Nft[], sort: CatalogSort): Nft[] => {
  if (sort === 'recent') return [...items]

  return [...items].sort((a, b) => {
    if (sort === 'price-asc' || sort === 'price-desc') {
      const difference = ethToWei(a.priceEth) - ethToWei(b.priceEth)
      if (difference === 0n) return a.id.localeCompare(b.id)
      const ascending = difference < 0n
      return ascending === (sort === 'price-asc') ? -1 : 1
    }

    const difference =
      sort === 'popular' ? b.popularity - a.popularity : b.createdAt.localeCompare(a.createdAt)

    return difference || a.id.localeCompare(b.id)
  })
}
