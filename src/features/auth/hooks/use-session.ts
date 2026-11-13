import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSession,
  login,
  loginWithSocialProvider,
  logout,
  recoverPassword,
  register,
} from '@/features/auth/api/auth'
import type {
  AuthCredentials,
  PasswordRecoveryInput,
  RegistrationInput,
  Session,
  SocialAuthProvider,
} from '@/features/auth/types'
import { mergeVisitorCart } from '@/features/cart/api/cart'
import type { Cart } from '@/features/cart/types'
import { cartKeys } from '@/features/cart/query-keys'

export const sessionQueryKey = ['session'] as const

export const useSession = () =>
  useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getSession(signal),
    staleTime: 15_000,
    retry: false,
  })

const useSessionMutation = <TInput>(mutationFn: (input: TInput) => Promise<Session>) => {
  const queryClient = useQueryClient()
  return useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all })
    },
    mutationFn: async (input: TInput) => {
      const session = await mutationFn(input)
      const merge = await mergeVisitorCart()
      queryClient.setQueryData<Cart>(cartKeys.detail(session.user.id), merge.cart)
      queryClient.removeQueries({ queryKey: ['cart', 'visitor'] })
      return session
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: cartKeys.all }),
    onSuccess: (session) => queryClient.setQueryData(sessionQueryKey, session),
  })
}

export const useLogin = () => useSessionMutation<AuthCredentials>(login)
export const useRegister = () => useSessionMutation<RegistrationInput>(register)
export const useSocialLogin = () => useSessionMutation<SocialAuthProvider>(loginWithSocialProvider)

export const usePasswordRecovery = () =>
  useMutation({
    mutationFn: (input: PasswordRecoveryInput) => recoverPassword(input),
  })

export const useLogout = (onLoggedOut?: () => void | Promise<void>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all })
    },
    onSuccess: async () => {
      await onLoggedOut?.()
      queryClient.setQueryData(sessionQueryKey, null)
      queryClient.removeQueries({ predicate: (query) => query.meta?.private === true })
      queryClient.removeQueries({ queryKey: ['cart'] })
    },
  })
}
