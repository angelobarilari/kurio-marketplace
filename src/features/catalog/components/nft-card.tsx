import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { Nft } from '@/types/nft'

type NftCardProps = {
  nft: Nft
  priority?: boolean
}

export const NftCard = ({ nft, priority = false }: NftCardProps) => (
  <article className="flex h-full min-w-0 flex-col" data-testid="nft-card" data-network={nft.network}>
    <div className="relative overflow-hidden rounded-[10px] bg-(--color-panel) p-3 max-[760px]:rounded-[22px] max-[760px]:p-1">
      <Link
        className="block rounded-[10px] max-[760px]:rounded-2xl"
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver detalhes de ${nft.name} ${nft.tokenId}`}
      >
        <img
          className="aspect-square w-full rounded-[10px] object-cover max-[760px]:rounded-2xl"
          src={nft.image}
          alt={`Arte de ${nft.name}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </Link>

      {nft.rare && (
        <Badge className="absolute top-3 left-3 rounded-[10px] px-3 py-1.25 text-[11px] font-bold text-background uppercase max-[760px]:top-1.75 max-[760px]:left-1.75 max-[760px]:rounded-2xl">
          Raro
        </Badge>
      )}

      <FavoriteButton
        nft={nft}
        className="absolute top-4.5 right-4.5 size-8.5 rounded-full border-0 bg-(--color-panel) p-0 text-(--color-primary) hover:bg-(--color-panel-raised) max-[760px]:top-3 max-[760px]:right-3 [&_svg]:size-4.75"
      />
    </div>

    <div className="flex-1 px-0.5 pt-3 max-[760px]:px-2 max-[760px]:pt-2.5" data-testid="nft-card-details">
      <h3 className="mb-1 min-h-9 text-[16px] leading-4.5 font-normal wrap-anywhere text-(--color-foreground) max-[760px]:mb-0">
        <Link
          className="no-underline hover:text-(--color-primary-bright)"
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
        >
          {nft.name} {nft.tokenId}
        </Link>
      </h3>
      <p className="mb-1 min-h-5.5 overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap text-(--color-primary-bright)">
        {nft.priceEth} ETH
      </p>
    </div>
  </article>
)
