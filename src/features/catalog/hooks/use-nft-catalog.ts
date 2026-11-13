import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMockInitialCatalog } from '@/features/catalog/api/mock-initial-data'
import { getNfts } from '@/features/catalog/api/nfts'
import type { CatalogSearch } from '@/features/catalog/types'

/**
 * Fetches the catalog for the supplied URL state and retains the previous response
 * while a new filter or page is loading.
 *
 * @param search URL-derived catalog filters and pagination.
 * @param enabled Whether the query should execute.
 * @returns TanStack Query state for the requested catalog results.
 */
export const useNftCatalog = (search: CatalogSearch, enabled = true) =>
  useQuery({
    queryKey: ['nfts', search],
    enabled,
    initialData: getMockInitialCatalog(search),
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getNfts(search, signal),
  })
