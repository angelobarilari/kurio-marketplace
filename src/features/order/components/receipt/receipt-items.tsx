import { Link } from '@tanstack/react-router'
import type { OrderItemSnapshot } from '@/types/order'

export const ReceiptItems = ({ items }: { items: OrderItemSnapshot[] }) => (
  <section className="px-11 pt-5 max-[760px]:px-5" aria-labelledby="receipt-items-title">
    <h3 id="receipt-items-title" className="mb-2 font-bold">
      Detalhes da transação
    </h3>
    <div className="grid grid-cols-[minmax(0,1fr)_72px_120px] border-b border-(--color-border) py-2 text-sm font-bold max-[520px]:grid-cols-[minmax(0,1fr)_88px]">
      <span>NFTs</span>
      <span className="text-center max-[520px]:hidden">Edições</span>
      <span className="text-right">Subtotal</span>
    </div>
    <div>
      {items.map((item) => (
        <article
          key={item.id}
          className="grid grid-cols-[minmax(0,1fr)_72px_120px] items-center gap-2 py-3 max-[520px]:grid-cols-[minmax(0,1fr)_88px]"
        >
          <div className="flex min-w-0 items-center gap-3 max-[520px]:gap-2">
            <img
              src={item.image}
              alt=""
              className="size-20 shrink-0 rounded-md object-cover max-[520px]:size-14"
            />
            <div className="min-w-0">
              <Link
                to="/nfts/$nftId"
                params={{ nftId: item.nftId }}
                className="font-bold no-underline hover:text-(--color-primary-bright) max-[520px]:text-sm"
              >
                {item.name} {item.tokenId}
              </Link>
              <p className="mt-1 mb-0 text-sm text-(--color-muted) max-[520px]:text-xs">
                ID do token: {item.tokenId}
                <span className="hidden max-[520px]:inline"> · (x {item.quantity})</span>
              </p>
            </div>
          </div>
          <span className="text-center text-(--color-muted) max-[520px]:hidden">(x {item.quantity})</span>
          <span className="text-right font-mono text-lg font-bold text-(--color-primary-bright) max-[520px]:text-sm">
            {item.lineTotalEth} ETH
          </span>
        </article>
      ))}
    </div>
  </section>
)
