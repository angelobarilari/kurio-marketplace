import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession, logout } from '@/features/auth/api/auth'
import { sessionQueryKey } from '@/features/auth/query-keys'
import { cartKeys } from '@/features/cart/query-keys'

export { sessionQueryKey } from '@/features/auth/query-keys'

export const useSession = () =>
  useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => getSession(signal),
    staleTime: 15_000,
    retry: false,
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
