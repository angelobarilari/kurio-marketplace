export type Network = 'Ethereum' | 'Polygon' | 'Solana'
export type WalletProvider = 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet'

export type Wallet = {
  id: string
  userId: string
  displayName: string
  alias: string
  network: Network
  address: string
  provider: WalletProvider
  ensName: string | null
  priority: 'primary' | 'secondary'
  createdAt: string
  updatedAt: string
}

export type WalletInput = Omit<Wallet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
