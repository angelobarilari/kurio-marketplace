import { createContext, useContext } from 'react'
import type { Session } from '@/features/auth/types'

type PostAuthAction = (session: Session) => Promise<void>
type AuthFlowContextValue = {
  openAuthDialog: (returnFocusTo?: HTMLElement | null) => void
  registerPostAuthAction: (action: PostAuthAction, failureMessage: string) => void
  completePostAuthAction: (session: Session) => void
  clearPostAuthAction: () => void
}

export const AuthFlowContext = createContext<AuthFlowContextValue | null>(null)

export const useAuthFlow = () => {
  const context = useContext(AuthFlowContext)
  if (!context) throw new Error('useAuthFlow deve ser usado dentro de AuthFlowProvider.')
  return context
}
