import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, getFavorites, removeFavorite } from '@/features/favorites/api/favorites'
import type { FavoriteMutationInput, Favorites } from '@/features/favorites/types'

export const favoritesQueryKey = (sessionId: string) => ['account', sessionId, 'favorites'] as const

export const useFavorites = (sessionId?: string) =>
  useQuery({
    queryKey: favoritesQueryKey(sessionId ?? 'anonymous'),
    queryFn: ({ signal }) => getFavorites(signal),
    enabled: Boolean(sessionId),
    retry: false,
    meta: { private: true },
  })

export const useToggleFavorite = (sessionId: string) => {
  const queryClient = useQueryClient()
  const queryKey = favoritesQueryKey(sessionId)

  return useMutation({
    mutationFn: ({ nft, favorite }: FavoriteMutationInput) =>
      favorite ? addFavorite(nft.id) : removeFavorite(nft.id),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Favorites>(queryKey)
      queryClient.setQueryData<Favorites>(queryKey, (current) => ({
        nftIds: favorite
          ? Array.from(new Set([...(current?.nftIds ?? []), nft.id]))
          : (current?.nftIds ?? []).filter((id) => id !== nft.id),
        items: favorite
          ? [...(current?.items ?? []).filter((item) => item.id !== nft.id), nft]
          : (current?.items ?? []).filter((item) => item.id !== nft.id),
      }))
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSuccess: (favorites) => queryClient.setQueryData(queryKey, favorites),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
