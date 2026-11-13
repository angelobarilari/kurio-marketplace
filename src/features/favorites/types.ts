import type { Nft } from '@/types/nft'

export type Favorites = {
  nftIds: string[]
  items: Nft[]
}

export type FavoriteMutationInput = {
  nft: Nft
  favorite: boolean
}
