import { MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ReceiptItems } from '@/features/order/components/receipt/receipt-items'
import { ReceiptSummary } from '@/features/order/components/receipt/receipt-summary'
import { ReceiptTotals } from '@/features/order/components/receipt/receipt-totals'
import type { Network } from '@/types/account'
import type { Order, Receipt } from '@/types/order'

const explorerNames: Record<Network, string> = {
  Ethereum: 'Etherscan',
  Polygon: 'PolygonScan',
  Solana: 'Solscan',
}

const ReceiptContent = ({
  receipt,
  orderId,
  isMobile,
  onClose,
}: {
  receipt: Receipt
  orderId: string
  isMobile: boolean
  onClose: () => void
}) => (
  <div className="overflow-hidden border-b-10 border-b-(--color-primary) bg-(--color-panel)">
    <header className="px-8 pt-7 pb-5 text-center max-[760px]:px-5">
      <div
        data-testid="receipt-envelope"
        className="relative mx-auto mb-3 grid size-18.5 place-items-center text-(--color-primary-bright)"
      >
        <MailOpen className="size-18.5" strokeWidth={1.1} aria-hidden="true" />
        <span
          data-testid="receipt-envelope-label"
          className="absolute top-6 left-1/2 -translate-x-1/2 text-center text-[10px] leading-3 font-bold"
        >
          THANK
          <br />
          YOU
        </span>
      </div>
      {isMobile ? (
        <h1 className="mb-0 text-xl font-bold">Seus NFTs agora estão na sua carteira</h1>
      ) : (
        <>
          <DialogTitle className="text-center text-xl font-bold">
            Seus NFTs agora estão na sua carteira
          </DialogTitle>
          <DialogDescription className="sr-only">Recibo imutável do pedido {orderId}.</DialogDescription>
        </>
      )}
      <p className="sr-only" role="status">
        Pagamento confirmado
      </p>
      <span className="sr-only">Pedido {orderId}</span>
    </header>
    <ReceiptSummary receipt={receipt} />
    <ReceiptItems items={receipt.items} />
    <ReceiptTotals receipt={receipt} />
    <p className="mx-auto mt-1 mb-5 max-w-130 px-8 text-center text-(--color-muted) max-[760px]:px-5">
      Transação confirmada na {receipt.network}. A propriedade foi registrada para sua carteira conectada na
      simulação.
    </p>
    <div className="flex justify-center px-8 pb-7 max-[760px]:flex-col max-[760px]:px-5">
      <Button asChild className="min-w-55 px-5 py-5 text-base font-bold">
        <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
          Ver no {explorerNames[receipt.network]}
        </a>
      </Button>
      {isMobile && (
        <Button type="button" variant="outline" className="mt-3" onClick={onClose}>
          Voltar ao marketplace
        </Button>
      )}
    </div>
  </div>
)

export const ReceiptConfirmation = ({
  order,
  isMobile,
  onClose,
}: {
  order: Order
  isMobile: boolean
  onClose: () => void
}) => {
  const receipt = order.receipt
  if (!receipt) return null

  if (isMobile) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <ReceiptContent receipt={receipt} orderId={order.id} isMobile={isMobile} onClose={onClose} />
      </main>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[min(92vw,700px)] overflow-y-auto rounded-none border-0 border-b-10 border-b-(--color-primary) bg-(--color-panel) p-0 shadow-none">
        <ReceiptContent receipt={receipt} orderId={order.id} isMobile={isMobile} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
