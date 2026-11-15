import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getNfts } from '@/features/catalog/api/nfts'
import type { CatalogSearch } from '@/features/catalog/types'

/**
 * Shares the REST query contract between the browser and build-time prefetching.
 *
 * @param search URL-derived catalog filters and pagination.
 * @returns Query options that retain the previous response while filters reload.
 */
export const nftCatalogQueryOptions = (search: CatalogSearch) =>
  queryOptions({
    queryKey: ['nfts', search],
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getNfts(search, signal),
  })

export const useNftCatalog = (search: CatalogSearch, enabled = true) =>
  useQuery({ ...nftCatalogQueryOptions(search), enabled })
