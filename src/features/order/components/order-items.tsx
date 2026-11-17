import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/media/nft-image'
import type { OrderItemSnapshot } from '@/types/order'

export const OrderItems = ({ items }: { items: OrderItemSnapshot[] }) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <article key={item.id} className="flex items-center gap-4">
        <NftImage
          src={item.image}
          alt=""
          sizes="64px"
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : undefined}
          className="size-16 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: item.nftId }}
            className="font-semibold no-underline hover:text-(--color-primary-bright)"
          >
            {item.name} {item.tokenId}
          </Link>
          <p className="mt-1 mb-0 text-sm text-(--color-muted)">
            {item.editionLabel} · {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
          </p>
        </div>
        <p className="mb-0 shrink-0 text-right font-semibold">{item.lineTotalEth} ETH</p>
      </article>
    ))}
  </div>
)
