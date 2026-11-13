import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  createWallet,
  getProfile,
  getWallets,
  updateAvatar,
  updateProfile,
  updateWallet,
} from '@/features/auth/api/account'
import type {
  AvatarUpdateInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  WalletInput,
} from '@/features/auth/types'

export const profileQueryKey = (sessionId: string) => ['account', sessionId, 'profile'] as const
export const walletsQueryKey = (sessionId: string) => ['account', sessionId, 'wallets'] as const

export const useProfile = (sessionId?: string) =>
  useQuery({
    queryKey: profileQueryKey(sessionId ?? 'anonymous'),
    queryFn: ({ signal }) => getProfile(signal),
    enabled: Boolean(sessionId),
    meta: { private: true },
    retry: false,
  })

export const useWallets = (sessionId?: string) =>
  useQuery({
    queryKey: walletsQueryKey(sessionId ?? 'anonymous'),
    queryFn: ({ signal }) => getWallets(signal),
    enabled: Boolean(sessionId),
    meta: { private: true },
    retry: false,
  })

export const useUpdateProfile = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfile(input),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(sessionId), profile),
  })
}

export const useUpdateAvatar = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AvatarUpdateInput) => updateAvatar(input),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(sessionId), profile),
  })
}

export const useChangePassword = () =>
  useMutation({ mutationFn: (input: PasswordChangeInput) => changePassword(input) })

export const useCreateWallet = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WalletInput) => createWallet(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryKey(sessionId) }),
  })
}

export const useUpdateWallet = (sessionId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryKey(sessionId) }),
  })
}
