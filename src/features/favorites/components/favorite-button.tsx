import { Heart } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAuthFlow } from '@/features/auth/components/auth-flow-context'
import type { AuthReturnTo } from '@/features/auth/types'
import { useFavorites, useToggleFavorite, favoritesQueryKey } from '@/features/favorites/hooks/use-favorites'
import { addFavorite } from '@/features/favorites/api/favorites'
import type { Nft } from '@/types/nft'
import { useMediaQuery } from '@/hooks/use-media-query'

type FavoriteButtonProps = {
  nft: Nft
  showLabel?: boolean
  className?: string
}

const getSafeReturnTo = (pathname: string): AuthReturnTo =>
  pathname === '/cart' ||
  pathname === '/profile' ||
  pathname === '/profile/wallets' ||
  pathname === '/profile/favorites' ||
  /^\/nfts\/[a-z0-9-]+$/.test(pathname)
    ? (pathname as AuthReturnTo)
    : '/'

export const FavoriteButton = ({ nft, showLabel = false, className }: FavoriteButtonProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const session = useSession()
  const authFlow = useAuthFlow()
  const favorites = useFavorites(session.data?.id)
  const toggle = useToggleFavorite(session.data?.id ?? 'anonymous')
  const isMobile = useMediaQuery('(max-width: 760px)')
  const isFavorite = favorites.data?.nftIds.includes(nft.id) ?? false

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!session.data) {
      authFlow.registerPostAuthAction(async (authenticatedSession) => {
        const queryKey = favoritesQueryKey(authenticatedSession.id)
        await queryClient.cancelQueries({ queryKey })
        const updatedFavorites = await addFavorite(nft.id)
        queryClient.setQueryData(queryKey, updatedFavorites)
      }, 'Não foi possível adicionar o NFT aos favoritos.')
      if (isMobile) {
        void navigate({ to: '/login', search: { returnTo: getSafeReturnTo(pathname) } })
        return
      }
      authFlow.openAuthDialog(event.currentTarget)
      return
    }
    toggle.mutate({ nft, favorite: !isFavorite })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? 'default' : 'icon'}
      className={cn(className, isFavorite && 'bg-(--color-primary) text-primary-foreground')}
      disabled={Boolean(session.data) && (favorites.isLoading || toggle.isPending)}
      aria-label={`${isFavorite ? 'Remover' : 'Adicionar'} ${nft.name} ${nft.tokenId} ${isFavorite ? 'dos' : 'aos'} favoritos`}
      aria-pressed={isFavorite}
      onClick={handleClick}
    >
      <Heart className={cn(isFavorite && 'fill-current')} aria-hidden="true" />
      {showLabel && <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>}
    </Button>
  )
}
