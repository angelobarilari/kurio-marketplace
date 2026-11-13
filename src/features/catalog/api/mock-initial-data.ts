import { categories, createNftDetail, createNfts, networks } from '@/mocks/fixtures/catalog'
import type { CatalogSearch, NftListResponse } from '@/features/catalog/types'

const pageSize = 9
const mockNfts = import.meta.env.VITE_ENABLE_MOCKS === 'true' ? createNfts() : null

const mockCatalog: NftListResponse | null = mockNfts
  ? {
      items: mockNfts.slice(0, pageSize),
      page: 1,
      pageSize,
      totalItems: mockNfts.length,
      totalPages: Math.ceil(mockNfts.length / pageSize),
      facets: { categories, networks },
    }
  : null

export const getMockInitialCatalog = (search: CatalogSearch) => {
  const isDefaultPage =
    !search.q &&
    !search.category &&
    !search.network &&
    !search.minPriceEth &&
    !search.maxPriceEth &&
    (!search.sort || search.sort === 'recent') &&
    (!search.page || search.page === 1)

  return isDefaultPage && mockCatalog ? mockCatalog : undefined
}

export const getMockInitialNftDetail = (nftId: string) => {
  const nft = mockNfts?.find((candidate) => candidate.id === nftId)
  return nft && mockNfts ? createNftDetail(nft, mockNfts) : undefined
}
