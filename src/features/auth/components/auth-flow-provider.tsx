import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthFlowContext } from '@/features/auth/components/auth-flow-context'
import { getApiError } from '@/features/auth/utils/get-api-error'
import type { Session } from '@/features/auth/types'

const AuthDialog = lazy(() =>
  import('@/features/auth/components/auth-dialog').then((module) => ({ default: module.AuthDialog })),
)

export const AuthFlowProvider = ({ children }: { children: ReactNode }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const pendingAction = useRef<{
    action: (session: Session) => Promise<void>
    failureMessage: string
  } | null>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)

  const openAuthDialog = (element?: HTMLElement | null) => {
    returnFocusTo.current = element ?? null
    setActionError('')
    setDialogOpen(true)
  }

  const registerPostAuthAction = (action: (session: Session) => Promise<void>, failureMessage: string) => {
    pendingAction.current = { action, failureMessage }
    setActionError('')
  }

  const completePostAuthAction = (session: Session) => {
    const pending = pendingAction.current
    pendingAction.current = null
    if (!pending) return

    void pending.action(session).catch((error: unknown) => {
      setActionError(getApiError(error)?.message ?? pending.failureMessage)
    })
  }

  const clearPostAuthAction = () => {
    pendingAction.current = null
  }

  const contextValue = {
    openAuthDialog,
    registerPostAuthAction,
    completePostAuthAction,
    clearPostAuthAction,
  }

  return (
    <AuthFlowContext.Provider value={contextValue}>
      {children}
      {dialogOpen && (
        <Suspense fallback={null}>
          <AuthDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                clearPostAuthAction()
                requestAnimationFrame(() => returnFocusTo.current?.focus())
              }
            }}
            onAuthenticated={completePostAuthAction}
          />
        </Suspense>
      )}
      {actionError && (
        <div
          role="alert"
          className="fixed right-4 bottom-4 z-100 flex max-w-sm items-start gap-3 rounded-md border border-(--color-border) bg-(--color-panel) p-4 text-sm shadow-lg"
        >
          <p className="flex-1">{actionError}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Fechar mensagem"
            onClick={() => setActionError('')}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}
    </AuthFlowContext.Provider>
  )
}
