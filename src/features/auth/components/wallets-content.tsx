import { useState } from 'react'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWallets } from '@/features/auth/hooks/use-account'
import { WalletForm } from '@/features/auth/components/wallet-form'
import type { Network } from '@/types/account'

type WalletsContentProps = {
  sessionId: string
  returnTo?: { network?: Network; couponCode?: string }
}

export const WalletsContent = ({ sessionId, returnTo }: WalletsContentProps) => {
  const wallets = useWallets(sessionId)
  const primary = wallets.data?.find((wallet) => wallet.priority === 'primary')
  const secondary = wallets.data?.find((wallet) => wallet.priority === 'secondary')
  const [addingSecondary, setAddingSecondary] = useState(false)

  if (wallets.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (wallets.isError) {
    return (
      <div role="alert" className="rounded border border-(--color-border) p-6">
        <p>Não foi possível carregar suas carteiras.</p>
        <Button type="button" className="mt-4" onClick={() => wallets.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-16">
      {returnTo && (
        <Button asChild variant="ghost" size="icon" className="mb-4 hidden max-[760px]:inline-flex">
          <Link to="/checkout" search={returnTo} aria-label="Voltar ao checkout" title="Voltar ao checkout">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
      )}
      <div className="mb-8 flex items-start justify-between gap-5 max-[760px]:flex-col">
        <div>
          <h1 className="text-xl font-bold">Carteira principal</h1>
          <p className="mt-2 text-(--color-muted)">
            Esta carteira fica disponível no pagamento e para receber NFTs comprados.
          </p>
        </div>
      </div>

      <WalletForm sessionId={sessionId} priority="primary" wallet={primary} />

      <div className="my-10 h-px bg-(--color-border)" />

      <section aria-labelledby="secondary-wallet-title">
        <div className="mb-6 flex items-start justify-between gap-5 max-[760px]:flex-col">
          <div>
            <h2 id="secondary-wallet-title" className="text-xl font-bold">
              Carteira secundária
            </h2>
            <p className="mt-2 text-(--color-muted)">
              {secondary
                ? 'Use uma carteira alternativa sem alterar a principal.'
                : 'Nenhuma carteira secundária foi adicionada.'}
            </p>
          </div>
          {!secondary && !addingSecondary && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="grid size-5 place-items-center rounded-full border border-(--color-primary)">
                  <Check className="size-3" aria-hidden="true" />
                </span>{' '}
                Igual à carteira principal
              </span>
              <Button
                type="button"
                variant="link"
                className="text-(--color-primary-bright)"
                onClick={() => setAddingSecondary(true)}
              >
                <Plus aria-hidden="true" /> Adicionar
              </Button>
            </div>
          )}
        </div>
        {(secondary || addingSecondary) && (
          <WalletForm
            sessionId={sessionId}
            priority="secondary"
            wallet={secondary}
            onSaved={() => setAddingSecondary(false)}
          />
        )}
      </section>
    </div>
  )
}
