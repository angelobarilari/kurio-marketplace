export type NftSummary = {
  id: string
  name: string
  tokenId: string
  collection: string
  category: string
  network: string
  priceEth: string
  edition: string
  available: boolean
  image: string
  featured?: boolean
  rare?: boolean
  createdAt: string
  popularity: number
  version: number
}

export type Nft = NftSummary

export type NftMedia = {
  id: string
  src: string
  alt: string
}

export type NftAttribute = {
  trait: string
  value: string
}

export type NftEdition = {
  id: string
  label: string
  priceEth: string
  availableQuantity: number
  maxPerOrder: number
}

export type NftRating = {
  average: number
  count: number
}

export type NftProvenance = {
  tokenStandard: 'ERC-721' | 'ERC-1155'
  contractAddress: string
  storage: 'IPFS'
  royaltyPercent: string
}

export type NftDetail = NftSummary & {
  gallery: NftMedia[]
  shortDescription: string
  description: string[]
  creator: { id: string; name: string }
  attributes: NftAttribute[]
  editions: NftEdition[]
  rating: NftRating
  provenance: NftProvenance
  relatedNfts: NftSummary[]
}

export type NftUpdatedEvent = {
  id: string
  version: number
  priceEth: string
  available: boolean
}
