import { httpClient } from '@/lib/http-client'
import type { CatalogSearch, NftListResponse } from '@/features/catalog/types'

export const getNfts = async (search: CatalogSearch, signal?: AbortSignal): Promise<NftListResponse> => {
  const { data } = await httpClient.get<NftListResponse>('/nfts', {
    params: {
      q: search.q,
      category: search.category,
      network: search.network,
      minPriceEth: search.minPriceEth,
      maxPriceEth: search.maxPriceEth,
      sort: search.sort,
      page: search.page,
    },
    signal,
  })
  return data
}
