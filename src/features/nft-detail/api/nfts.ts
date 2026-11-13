import { httpClient } from '@/lib/http-client'
import type { NftDetail } from '@/types/nft'

export const getNftDetail = async (id: string, signal?: AbortSignal): Promise<NftDetail> => {
  const { data } = await httpClient.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}
