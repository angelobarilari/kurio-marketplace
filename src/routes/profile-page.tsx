import { Navigate } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/layout/marketplace-shell'
import { AccountShell } from '@/features/auth/components/account-shell'
import { ProfileForms } from '@/features/auth/components/profile-forms'
import { useSession } from '@/features/auth/hooks/use-session'

export const ProfilePage = () => {
  const session = useSession()

  return (
    <MarketplaceShell footer={false} onSearchChange={() => undefined}>
      {session.isPending ? (
        <main className="grid min-h-[60vh] place-items-center" aria-busy="true">
          Carregando conta…
        </main>
      ) : session.data ? (
        <AccountShell activeSection="profile">
          <ProfileForms sessionId={session.data.id} />
        </AccountShell>
      ) : (
        <Navigate to="/login" search={{ returnTo: '/profile' }} replace />
      )}
    </MarketplaceShell>
  )
}
