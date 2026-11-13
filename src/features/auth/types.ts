export type { Network, WalletProvider, Wallet, WalletInput } from '@/types/account'

export type AuthErrorCode =
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_CONFLICT'
  | 'USERNAME_CONFLICT'
  | 'VALIDATION_ERROR'
  | 'CURRENT_PASSWORD_INVALID'
  | 'WALLET_CONFLICT'
  | 'RESOURCE_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'

export type ApiError = {
  code: AuthErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export type User = {
  id: string
  email: string
  username: string
  createdAt: string
}

export type Session = {
  id: string
  user: User
  expiresAt: string
}

export type AuthCredentials = {
  email: string
  password: string
}

export type SocialAuthProvider = 'google' | 'facebook'

export type AuthReturnTo =
  | '/'
  | '/cart'
  | '/profile'
  | '/profile/wallets'
  | '/profile/favorites'
  | '/checkout'
  | `/nfts/${string}`
  | `/orders/${string}`

export type RegistrationInput = AuthCredentials & {
  username: string
  passwordConfirmation: string
}

export type PasswordRecoveryInput = {
  email: string
}

export type PasswordRecoveryResult = {
  accepted: true
  message: string
}

export type Profile = {
  userId: string
  displayName: string
  username: string
  email: string
  ensName: string | null
  walletAlias: string
  avatarUrl: string | null
  updatedAt: string
}

export type ProfileUpdateInput = Pick<
  Profile,
  'displayName' | 'username' | 'email' | 'ensName' | 'walletAlias'
>

export type AvatarUpdateInput = {
  avatarUrl: string | null
}

export type PasswordChangeInput = {
  currentPassword: string
  newPassword: string
  passwordConfirmation: string
}
