import { Separator } from '@/components/ui/separator'
import type { Receipt } from '@/types/order'

export const ReceiptTotals = ({ receipt }: { receipt: Receipt }) => (
  <dl className="mt-2 ml-auto w-full max-w-82.5 space-y-1 px-11 pb-3 text-sm max-[760px]:px-5">
    {!/^0+(?:\.0+)?$/.test(receipt.quote.discountEth) && (
      <div className="flex justify-between gap-4">
        <dt>Desconto</dt>
        <dd className="m-0 shrink-0">(-) {receipt.quote.discountEth} ETH</dd>
      </div>
    )}
    <div className="flex justify-between gap-4">
      <dt>Taxa de rede</dt>
      <dd className="m-0 shrink-0">{receipt.quote.networkFeeEth} ETH</dd>
    </div>
    <Separator className="my-1" />
    <div className="flex justify-between gap-4 text-base font-bold">
      <dt>Total</dt>
      <dd className="m-0 shrink-0 text-lg text-(--color-primary-bright)">{receipt.quote.totalEth} ETH</dd>
    </div>
  </dl>
)
