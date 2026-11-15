import { queryOptions, useQuery } from '@tanstack/react-query'
import { getNftDetail } from '@/features/nft-detail/api/nfts'

export const nftDetailQueryKey = (nftId: string) => ['nfts', 'detail', nftId] as const

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: nftDetailQueryKey(nftId),
    queryFn: ({ signal }) => getNftDetail(nftId, signal),
    enabled: nftId.length > 0,
  })

export const useNftDetail = (nftId: string) => useQuery(nftDetailQueryOptions(nftId))
