import { Navigate, useSearch } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { AccountShell } from '@/features/auth/components/account-shell'
import { WalletsContent } from '@/features/auth/components/wallets-content'
import { useSession } from '@/features/auth/hooks/use-session'

export const WalletsPage = () => {
  const session = useSession()
  const search = useSearch({ from: '/profile/wallets' })

  return (
    <MarketplaceShell footer={false} onSearchChange={() => undefined}>
      {session.isPending ? (
        <main className="grid min-h-[60vh] place-items-center" aria-busy="true">
          Carregando carteiras…
        </main>
      ) : session.data ? (
        <AccountShell activeSection="wallets">
          <WalletsContent
            sessionId={session.data.id}
            returnTo={
              search.returnTo ? { network: search.network, couponCode: search.couponCode } : undefined
            }
          />
        </AccountShell>
      ) : (
        <Navigate to="/login" search={{ returnTo: '/profile/wallets' }} replace />
      )}
    </MarketplaceShell>
  )
}
