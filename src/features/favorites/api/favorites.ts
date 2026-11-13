import { httpClient } from '@/lib/http-client'
import type { Favorites } from '@/features/favorites/types'

export const getFavorites = async (signal?: AbortSignal): Promise<Favorites> => {
  const { data } = await httpClient.get<Favorites>('/favorites', { signal })
  return data
}

export const addFavorite = async (nftId: string): Promise<Favorites> => {
  const { data } = await httpClient.put<Favorites>(`/favorites/${encodeURIComponent(nftId)}`)
  return data
}

export const removeFavorite = async (nftId: string): Promise<Favorites> => {
  const { data } = await httpClient.delete<Favorites>(`/favorites/${encodeURIComponent(nftId)}`)
  return data
}
