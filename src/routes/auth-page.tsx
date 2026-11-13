import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { AuthAuthenticatedRedirect } from '@/features/auth/components/auth-authenticated-redirect'
import { useAuthFlow } from '@/features/auth/components/auth-flow-context'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAuthReturnNavigation } from '@/features/auth/hooks/use-auth-return-navigation'
import type { AuthReturnTo } from '@/features/auth/types'
import { useMediaQuery } from '@/hooks/use-media-query'

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => {
  const session = useSession()
  const authFlow = useAuthFlow()
  const isMobile = useMediaQuery('(max-width: 760px)')
  const search = useSearch({ strict: false }) as { returnTo?: AuthReturnTo; couponCode?: string }
  const returnTo = search.returnTo ?? '/'
  const goToReturnDestination = useAuthReturnNavigation({
    returnTo,
    couponCode: search.couponCode,
  })

  if (session.data) {
    return <AuthAuthenticatedRedirect returnTo={returnTo} couponCode={search.couponCode} />
  }

  if (isMobile) {
    const pageFooter =
      mode === 'login' ? (
        <p className="mb-0">
          Novo na Kurio?{' '}
          <Link
            to="/register"
            search={{ returnTo, couponCode: search.couponCode }}
            className="font-medium text-(--color-primary-bright) no-underline"
          >
            Crie uma conta
          </Link>
        </p>
      ) : (
        <p className="mb-0">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            search={{ returnTo, couponCode: search.couponCode }}
            className="font-medium text-(--color-primary-bright) no-underline"
          >
            Entre
          </Link>
        </p>
      )

    return (
      <AuthDialog
        open
        initialMode={mode}
        presentation="page"
        pageFooter={pageFooter}
        onOpenChange={(open) => {
          if (!open) {
            authFlow.clearPostAuthAction()
            void goToReturnDestination()
          }
        }}
        onAuthenticated={authFlow.completePostAuthAction}
      />
    )
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed top-[calc(24px+env(safe-area-inset-top))] left-6 z-60 hidden rounded-full max-[760px]:inline-flex"
        aria-label="Voltar"
        onClick={goToReturnDestination}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <p className="fixed top-14 text-4xl font-bold tracking-[0.14em] max-[760px]:z-60">KURIO</p>
      <AuthDialog
        open
        initialMode={mode}
        onOpenChange={(open) => {
          if (!open) {
            authFlow.clearPostAuthAction()
            void goToReturnDestination()
          }
        }}
        onAuthenticated={authFlow.completePostAuthAction}
      />
    </main>
  )
}

export const LoginPage = () => <AuthPage mode="login" />

export const RegisterPage = () => <AuthPage mode="register" />
