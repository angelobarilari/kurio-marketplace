import type { Nft } from '@/types/nft'

export const makeNft = (overrides: Partial<Nft> = {}): Nft => ({
  id: 'sample',
  name: 'Sample',
  tokenId: '001',
  collection: 'Test',
  category: 'art',
  network: 'Ethereum',
  priceEth: '1',
  edition: 'default',
  available: true,
  image: '',
  createdAt: '2026-01-01',
  popularity: 1,
  version: 1,
  ...overrides,
})
