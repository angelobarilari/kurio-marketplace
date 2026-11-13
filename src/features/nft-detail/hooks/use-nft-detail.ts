import { useQuery } from '@tanstack/react-query'
import { getMockInitialNftDetail } from '@/features/catalog/api/mock-initial-data'
import { getNftDetail } from '@/features/nft-detail/api/nfts'

export const nftDetailQueryKey = (nftId: string) => ['nfts', 'detail', nftId] as const

export const useNftDetail = (nftId: string) =>
  useQuery({
    queryKey: nftDetailQueryKey(nftId),
    initialData: getMockInitialNftDetail(nftId),
    queryFn: ({ signal }) => getNftDetail(nftId, signal),
    enabled: nftId.length > 0,
  })
