import type { Profile, User, Wallet } from '@/features/auth/types'

export type AccountFixture = {
  user: User
  passwordDigest: string
  profile: Profile
  wallets: Wallet[]
  favoriteNftIds: string[]
}

export const accountFixtures: readonly AccountFixture[] = [
  {
    user: {
      id: 'user-nova',
      email: 'nova@kurio.example',
      username: 'nova',
      createdAt: '2026-01-12T10:00:00.000Z',
    },
    passwordDigest: '0287713ae5fcff3888cfa095ad3d43fc9f5366cafa6abe3d9a5cde3940551790',
    profile: {
      userId: 'user-nova',
      displayName: 'Nova Sato',
      username: 'nova',
      email: 'nova@kurio.example',
      ensName: 'nova.kurio.eth',
      walletAlias: 'Reserva',
      avatarUrl: null,
      updatedAt: '2026-01-12T10:00:00.000Z',
    },
    wallets: [
      {
        id: 'wallet-nova-primary',
        userId: 'user-nova',
        displayName: 'Principal',
        alias: 'Principal',
        network: 'Ethereum',
        address: '0xA91F00000000000000000000000000000000E82C',
        provider: 'MetaMask',
        ensName: null,
        priority: 'primary',
        createdAt: '2026-01-12T10:00:00.000Z',
        updatedAt: '2026-01-12T10:00:00.000Z',
      },
      {
        id: 'wallet-nova-secondary',
        userId: 'user-nova',
        displayName: 'Reserva',
        alias: 'Reserva',
        network: 'Polygon',
        address: '0xB72E0000000000000000000000000000000019AC',
        provider: 'Coinbase Wallet',
        ensName: 'nova.kurio.eth',
        priority: 'secondary',
        createdAt: '2026-01-12T10:00:00.000Z',
        updatedAt: '2026-01-12T10:00:00.000Z',
      },
    ],
    favoriteNftIds: ['emerald-ape-042'],
  },
  {
    user: {
      id: 'user-caio',
      email: 'caio@kurio.example',
      username: 'caio',
      createdAt: '2026-02-18T14:30:00.000Z',
    },
    passwordDigest: '7189a8e2982a10bcc07ad0949e3583ebc7b99ef73b86ad4180000f302f720aca',
    profile: {
      userId: 'user-caio',
      displayName: 'Caio Mendes',
      username: 'caio',
      email: 'caio@kurio.example',
      ensName: null,
      walletAlias: 'Coleção',
      avatarUrl: null,
      updatedAt: '2026-02-18T14:30:00.000Z',
    },
    wallets: [
      {
        id: 'wallet-caio-primary',
        userId: 'user-caio',
        displayName: 'Coleção',
        alias: 'Coleção',
        network: 'Solana',
        address: '8fj3H7E5LdS3cKoLkVQxT8pUYZ2iN1aBcD4eF6gH7jK9',
        provider: 'WalletConnect',
        ensName: null,
        priority: 'primary',
        createdAt: '2026-02-18T14:30:00.000Z',
        updatedAt: '2026-02-18T14:30:00.000Z',
      },
    ],
    favoriteNftIds: ['golden-beat-207'],
  },
]
