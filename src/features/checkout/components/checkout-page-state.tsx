import { Link, Navigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { CheckoutSkeleton } from '@/features/checkout/components/checkout-skeleton'
import type { CheckoutBlockingPageState } from '@/features/checkout/types'

type CheckoutPageStateProps = {
  state: CheckoutBlockingPageState
  onSearchChange: (value: string) => void
}

export const CheckoutPageState = ({ state, onSearchChange }: CheckoutPageStateProps) => {
  if (state.kind === 'unauthenticated') {
    return <Navigate to="/login" search={{ returnTo: '/checkout', couponCode: state.couponCode }} replace />
  }

  if (state.kind === 'loading') {
    return (
      <MarketplaceShell onSearchChange={onSearchChange}>
        <CheckoutSkeleton />
      </MarketplaceShell>
    )
  }

  const content = {
    'session-error': {
      title: 'Não foi possível validar sua sessão',
      description: 'Verifique sua conexão e tente novamente.',
    },
    'load-error': {
      title: 'Não foi possível preparar o checkout',
      description: 'Confira sua conexão e tente carregar o carrinho, perfil e carteiras novamente.',
    },
    empty: {
      title: 'Seu carrinho está vazio',
      description: 'Adicione NFTs ao carrinho antes de iniciar o pagamento.',
    },
  }[state.kind]

  return (
    <MarketplaceShell onSearchChange={onSearchChange}>
      <main className="grid min-h-[55vh] place-content-center justify-items-center gap-4 text-center">
        <h1 className="text-2xl">{content.title}</h1>
        <p className="max-w-lg text-(--color-muted)">{content.description}</p>
        {state.kind === 'empty' ? (
          <Button asChild>
            <Link to="/cart">Voltar ao carrinho</Link>
          </Button>
        ) : (
          <Button type="button" onClick={state.onRetry}>
            Tentar novamente
          </Button>
        )}
      </main>
    </MarketplaceShell>
  )
}
