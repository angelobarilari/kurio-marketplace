import { httpClient } from '@/lib/http-client'
import type {
  AvatarUpdateInput,
  PasswordChangeInput,
  Profile,
  ProfileUpdateInput,
  Wallet,
  WalletInput,
} from '@/features/auth/types'

export const getProfile = async (signal?: AbortSignal): Promise<Profile> => {
  const response = await httpClient.get<Profile>('/profile', { signal })
  return response.data
}

export const updateProfile = async (input: ProfileUpdateInput): Promise<Profile> => {
  const response = await httpClient.patch<Profile>('/profile', input)
  return response.data
}

export const updateAvatar = async (input: AvatarUpdateInput): Promise<Profile> => {
  const response = await httpClient.put<Profile>('/profile/avatar', input)
  return response.data
}

export const changePassword = async (input: PasswordChangeInput): Promise<void> => {
  await httpClient.put('/profile/password', input)
}

export const getWallets = async (signal?: AbortSignal): Promise<Wallet[]> => {
  const response = await httpClient.get<Wallet[]>('/wallets', { signal })
  return response.data
}

export const createWallet = async (input: WalletInput): Promise<Wallet> => {
  const response = await httpClient.post<Wallet>('/wallets', input)
  return response.data
}

export const updateWallet = async ({ id, input }: { id: string; input: WalletInput }): Promise<Wallet> => {
  const response = await httpClient.put<Wallet>(`/wallets/${id}`, input)
  return response.data
}
