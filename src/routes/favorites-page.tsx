import { Navigate } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { AccountShell } from '@/features/auth/components/account-shell'
import { useSession } from '@/features/auth/hooks/use-session'
import { FavoritesContent } from '@/features/favorites/components/favorites-content'

export const FavoritesPage = () => {
  const session = useSession()

  return (
    <MarketplaceShell footer={false} onSearchChange={() => undefined}>
      {session.isPending ? (
        <main className="grid min-h-[60vh] place-items-center" aria-busy="true">
          Carregando favoritos…
        </main>
      ) : session.data ? (
        <AccountShell activeSection="favorites">
          <FavoritesContent sessionId={session.data.id} />
        </AccountShell>
      ) : (
        <Navigate to="/login" search={{ returnTo: '/profile/favorites' }} replace />
      )}
    </MarketplaceShell>
  )
}
