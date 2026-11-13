import type { Nft } from '@/types/nft'

export type CatalogSort = 'recent' | 'newest' | 'popular' | 'price-asc' | 'price-desc'

export type CatalogSearch = {
  q?: string
  category?: string
  network?: string
  minPriceEth?: string
  maxPriceEth?: string
  sort?: CatalogSort
  page?: number
}

export type CatalogFacetCount = {
  categories: { id: string; label: string; count: number }[]
  networks: { name: string; count: number }[]
}

export type NftListResponse = {
  items: Nft[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  facets: CatalogFacetCount
}
