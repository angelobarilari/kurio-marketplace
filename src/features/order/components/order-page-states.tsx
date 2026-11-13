import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const OrderSessionError = ({ onRetry }: { onRetry: () => void }) => (
  <main className="grid min-h-[55vh] place-content-center justify-items-center gap-4 text-center">
    <h1 className="text-2xl">Não foi possível validar sua sessão</h1>
    <Button type="button" onClick={onRetry}>
      Tentar novamente
    </Button>
  </main>
)

export const OrderRedirecting = () => (
  <main className="grid min-h-[50vh] place-content-center justify-items-center gap-4 text-center">
    <Skeleton className="h-8 w-64" />
    <p>Redirecionando para entrar…</p>
  </main>
)

export const OrderLoadError = ({ notFound, onRetry }: { notFound: boolean; onRetry: () => void }) => (
  <main className="grid min-h-[55vh] place-content-center justify-items-center gap-4 text-center">
    <h1 className="text-2xl">{notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
    <p className="text-(--color-muted)">
      {notFound ? 'Este pedido não existe ou não pertence à sua conta.' : 'Seu pedido continua preservado.'}
    </p>
    {notFound ? (
      <Button asChild>
        <Link to="/cart">Voltar ao carrinho</Link>
      </Button>
    ) : (
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    )}
  </main>
)
