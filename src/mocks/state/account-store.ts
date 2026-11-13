import { accountFixtures, type AccountFixture } from '@/mocks/fixtures/accounts'
import type {
  AuthCredentials,
  AvatarUpdateInput,
  PasswordChangeInput,
  PasswordRecoveryResult,
  Profile,
  ProfileUpdateInput,
  RegistrationInput,
  Session,
  SocialAuthProvider,
  Wallet,
  WalletInput,
} from '@/features/auth/types'

type PersistedAccountState = {
  accounts: AccountFixture[]
  session: Session | null
}

const storageKey = 'kurio:mock-accounts:v1'
const sessionDurationMs = 60 * 60 * 1000

const cloneFixtures = () => structuredClone(accountFixtures) as AccountFixture[]
let memoryState: PersistedAccountState = { accounts: cloneFixtures(), session: null }

const readState = (): PersistedAccountState => {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey)
    if (stored) memoryState = JSON.parse(stored) as PersistedAccountState
  } catch {
    // The deterministic in-memory state remains available without storage.
  }
  return memoryState
}

const writeState = (state: PersistedAccountState) => {
  memoryState = state
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(state))
  } catch {
    // The mock remains functional in memory when storage is unavailable.
  }
}

const getAuthenticatedAccount = (state: PersistedAccountState) => {
  const session = getSessionState()
  if (!session) return null
  return state.accounts.find((account) => account.user.id === session.user.id) ?? null
}

const replaceAccount = (state: PersistedAccountState, nextAccount: AccountFixture) => {
  writeState({
    ...state,
    accounts: state.accounts.map((account) =>
      account.user.id === nextAccount.user.id ? nextAccount : account,
    ),
  })
}

const digestPassword = async (password: string) => {
  const bytes = new TextEncoder().encode(password)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const createSession = (account: AccountFixture): Session => ({
  id: globalThis.crypto.randomUUID(),
  user: account.user,
  expiresAt: new Date(Date.now() + sessionDurationMs).toISOString(),
})

export const getSessionState = (): Session | null => {
  const state = readState()
  if (!state.session) return null
  if (Date.parse(state.session.expiresAt) > Date.now()) return state.session
  writeState({ ...state, session: null })
  return null
}

export const loginState = async (credentials: AuthCredentials): Promise<Session | null> => {
  const state = readState()
  const email = credentials.email.trim().toLowerCase()
  const account = state.accounts.find((candidate) => candidate.user.email.toLowerCase() === email)
  if (!account || account.passwordDigest !== (await digestPassword(credentials.password))) return null
  const session = createSession(account)
  writeState({ ...state, session })
  return session
}

export const registerState = async (
  input: RegistrationInput,
): Promise<Session | { conflict: 'email' | 'username' }> => {
  const state = readState()
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim().toLowerCase()
  if (state.accounts.some((account) => account.user.email.toLowerCase() === email)) {
    return { conflict: 'email' }
  }
  if (state.accounts.some((account) => account.user.username.toLowerCase() === username)) {
    return { conflict: 'username' }
  }
  const now = new Date().toISOString()
  const userId = `user-${globalThis.crypto.randomUUID()}`
  const account: AccountFixture = {
    user: { id: userId, email, username, createdAt: now },
    passwordDigest: await digestPassword(input.password),
    profile: {
      userId,
      displayName: username,
      username,
      email,
      ensName: null,
      walletAlias: '',
      avatarUrl: null,
      updatedAt: now,
    },
    wallets: [],
    favoriteNftIds: [],
  }
  const session = createSession(account)
  writeState({ accounts: [...state.accounts, account], session })
  return session
}

export const logoutState = () => {
  const state = readState()
  writeState({ ...state, session: null })
}

export const socialLoginState = (provider: SocialAuthProvider): Session => {
  const state = readState()
  const fixtureEmail = provider === 'google' ? 'nova@kurio.example' : 'caio@kurio.example'
  const account = state.accounts.find((candidate) => candidate.user.email === fixtureEmail)
  if (!account) throw new Error('Deterministic social account fixture is unavailable.')
  const session = createSession(account)
  writeState({ ...state, session })
  return session
}

export const recoverPasswordState = (email: string): PasswordRecoveryResult => {
  void readState().accounts.some((account) => account.user.email.toLowerCase() === email.toLowerCase())
  return {
    accepted: true,
    message: 'Se existir uma conta para este e-mail, as instruções de recuperação serão enviadas.',
  }
}

export const getProfileState = (): Profile | null => {
  const state = readState()
  return getAuthenticatedAccount(state)?.profile ?? null
}

export const updateProfileState = (
  input: ProfileUpdateInput,
): Profile | { conflict: 'email' | 'username' } | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim().toLowerCase()
  if (
    state.accounts.some(
      (candidate) => candidate.user.id !== account.user.id && candidate.user.email === email,
    )
  ) {
    return { conflict: 'email' }
  }
  if (
    state.accounts.some(
      (candidate) => candidate.user.id !== account.user.id && candidate.user.username === username,
    )
  ) {
    return { conflict: 'username' }
  }
  const updatedAt = new Date().toISOString()
  const profile: Profile = { ...account.profile, ...input, email, username, updatedAt }
  const user = { ...account.user, email, username }
  replaceAccount(state, { ...account, user, profile })
  if (state.session) writeState({ ...readState(), session: { ...state.session, user } })
  return profile
}

export const updateAvatarState = (input: AvatarUpdateInput): Profile | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  const profile = { ...account.profile, avatarUrl: input.avatarUrl, updatedAt: new Date().toISOString() }
  replaceAccount(state, { ...account, profile })
  return profile
}

export const changePasswordState = async (
  input: PasswordChangeInput,
): Promise<'updated' | 'invalid-current-password' | null> => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  if (account.passwordDigest !== (await digestPassword(input.currentPassword))) {
    return 'invalid-current-password'
  }
  replaceAccount(state, { ...account, passwordDigest: await digestPassword(input.newPassword) })
  return 'updated'
}

export const getWalletsState = (): Wallet[] | null => {
  const state = readState()
  return getAuthenticatedAccount(state)?.wallets ?? null
}

export const getFavoriteNftIdsState = (): string[] | null => {
  const state = readState()
  return getAuthenticatedAccount(state)?.favoriteNftIds ?? null
}

export const addFavoriteState = (nftId: string): string[] | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  const favoriteNftIds = Array.from(new Set([...account.favoriteNftIds, nftId]))
  replaceAccount(state, { ...account, favoriteNftIds })
  return favoriteNftIds
}

export const removeFavoriteState = (nftId: string): string[] | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  const favoriteNftIds = account.favoriteNftIds.filter((id) => id !== nftId)
  replaceAccount(state, { ...account, favoriteNftIds })
  return favoriteNftIds
}

export const createWalletState = (input: WalletInput): Wallet | { conflict: true } | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  if (account.wallets.some((wallet) => wallet.address.toLowerCase() === input.address.toLowerCase())) {
    return { conflict: true }
  }
  const now = new Date().toISOString()
  const wallet: Wallet = {
    ...input,
    id: `wallet-${globalThis.crypto.randomUUID()}`,
    userId: account.user.id,
    createdAt: now,
    updatedAt: now,
  }
  const wallets =
    input.priority === 'primary'
      ? [...account.wallets.map((item) => ({ ...item, priority: 'secondary' as const })), wallet]
      : [...account.wallets, wallet]
  replaceAccount(state, { ...account, wallets })
  return wallet
}

export const updateWalletState = (
  walletId: string,
  input: WalletInput,
): Wallet | { conflict: true } | 'not-found' | null => {
  const state = readState()
  const account = getAuthenticatedAccount(state)
  if (!account) return null
  const current = account.wallets.find((wallet) => wallet.id === walletId)
  if (!current) return 'not-found'
  if (
    account.wallets.some(
      (wallet) => wallet.id !== walletId && wallet.address.toLowerCase() === input.address.toLowerCase(),
    )
  ) {
    return { conflict: true }
  }
  const wallet: Wallet = { ...current, ...input, updatedAt: new Date().toISOString() }
  const wallets = account.wallets.map((item) => {
    if (item.id === walletId) return wallet
    return input.priority === 'primary' ? { ...item, priority: 'secondary' as const } : item
  })
  replaceAccount(state, { ...account, wallets })
  return wallet
}

export const expireSessionState = () => {
  const state = readState()
  if (!state.session) return
  writeState({ ...state, session: { ...state.session, expiresAt: new Date(0).toISOString() } })
}

export const resetAccountState = () => writeState({ accounts: cloneFixtures(), session: null })
