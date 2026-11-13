import type { Receipt } from '@/types/order'

const formatReceiptDate = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(value))
  const dateParts = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return `${dateParts.day} ${dateParts.month}, ${dateParts.year}`
}

export const ReceiptSummary = ({ receipt }: { receipt: Receipt }) => {
  const shortTransactionId = `0x${receipt.transactionId.slice(2, 6).toUpperCase()}...${receipt.transactionId.slice(-4).toUpperCase()}`

  return (
    <section
      className="grid grid-cols-4 border-y border-(--color-primary-bright)/70 px-11 py-4 text-sm text-(--color-muted) max-[760px]:px-5 max-[520px]:grid-cols-2 max-[520px]:gap-y-4"
      aria-label="Resumo da transação"
    >
      <div className="min-w-0 border-r border-(--color-primary-bright)/60 pr-3 max-[520px]:pr-2">
        <span>ID da transação</span>
        <p
          data-testid="receipt-transaction-id"
          className="mt-1 mb-0 truncate font-mono text-base text-foreground"
          aria-label={`Identificação completa da transação: ${receipt.transactionId}`}
          title={receipt.transactionId}
        >
          {shortTransactionId}
        </p>
      </div>
      <div className="min-w-0 border-r border-(--color-primary-bright)/60 px-3 max-[520px]:border-r-0 max-[520px]:pl-2">
        <span>Data</span>
        <p data-testid="receipt-date" className="mt-1 mb-0 text-base text-foreground">
          {formatReceiptDate(receipt.issuedAt)}
        </p>
      </div>
      <div className="min-w-0 border-r border-(--color-primary-bright)/60 px-3 max-[520px]:border-r max-[520px]:pl-0">
        <span>Total</span>
        <p className="mt-1 mb-0 text-base whitespace-nowrap text-foreground">{receipt.quote.totalEth} ETH</p>
      </div>
      <div className="min-w-0 pl-3 max-[520px]:pl-2">
        <span>Carteira</span>
        <p
          className="mt-1 mb-0 text-base text-foreground"
          aria-label={`Carteira ${receipt.wallet.walletType}, endereço ${receipt.wallet.walletAddress}`}
          title={receipt.wallet.walletAddress}
        >
          {receipt.wallet.walletType}
        </p>
      </div>
    </section>
  )
}
