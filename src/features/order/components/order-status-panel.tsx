import { ArrowLeft, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MarketplaceBreadcrumb } from '@/components/layout/marketplace-breadcrumb'
import { OrderItems } from '@/features/order/components/order-items'
import type { Order } from '@/types/order'

type OrderStatusPanelProps = {
  order: Order
  isFetching: boolean
  onRefresh: () => void
  onRetryCheckout: () => void
}

export const OrderStatusPanel = ({
  order,
  isFetching,
  onRefresh,
  onRetryCheckout,
}: OrderStatusPanelProps) => (
  <main className="mx-auto max-w-3xl space-y-6 py-10 max-[760px]:px-5.5 max-[760px]:py-7">
    <MarketplaceBreadcrumb className="text-sm font-bold max-[760px]:hidden" currentPage="Pedido" />
    <Button asChild type="button" variant="ghost" className="-ml-2">
      <Link to="/cart">
        <ArrowLeft aria-hidden="true" /> Voltar ao carrinho
      </Link>
    </Button>
    <div className="rounded-xl border border-(--color-border) bg-(--color-panel) p-6">
      {order.status === 'pending' ? (
        <>
          <Badge variant="outline">Pagamento pendente</Badge>
          <h1 className="mt-4 text-2xl font-bold">Aguardando confirmação</h1>
          <p className="mt-2 text-(--color-muted)">
            Seu pedido foi criado. A confirmação aparece assim que o provedor simulado concluir.
          </p>
          <Button type="button" variant="outline" disabled={isFetching} onClick={onRefresh}>
            {isFetching ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <CircleAlert aria-hidden="true" />
            )}
            {isFetching ? 'Verificando…' : 'Verificar status'}
          </Button>
        </>
      ) : (
        <>
          <Badge className="border-(--color-destructive) text-(--color-destructive)">
            Pagamento recusado
          </Badge>
          <h1 className="mt-4 text-2xl font-bold">Não foi possível concluir o pagamento</h1>
          <p className="mt-2 text-(--color-muted)">
            {order.failureMessage ?? 'A compra foi recusada. Seus itens permanecem no carrinho.'}
          </p>
          <Button type="button" className="mt-3" onClick={onRetryCheckout}>
            Tentar novamente
          </Button>
        </>
      )}
      <Separator className="my-6" />
      <p className="mb-1 text-xs text-(--color-muted)">Número do pedido</p>
      <p className="mb-0 font-mono text-sm break-all">{order.id}</p>
      <div className="my-5">
        <OrderItems items={order.items} />
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="m-0 shrink-0">{order.quote.subtotalEth} ETH</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Taxa de rede</dt>
          <dd className="m-0 shrink-0">{order.quote.networkFeeEth} ETH</dd>
        </div>
        <div className="flex justify-between gap-4 font-bold">
          <dt>Total</dt>
          <dd className="m-0 shrink-0">{order.quote.totalEth} ETH</dd>
        </div>
      </dl>
    </div>
  </main>
)
