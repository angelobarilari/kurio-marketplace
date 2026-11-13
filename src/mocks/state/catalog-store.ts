import { createNftDetail, createNfts } from '@/mocks/fixtures/catalog'
import type { Nft, NftDetail } from '@/types/nft'

let catalogNfts = createNfts()
const inventoryStorageKey = 'kurio:mock-edition-inventory:v1'
let reservedOrSold: Record<string, number> = {}

const readInventory = () => {
  try {
    const stored = globalThis.localStorage?.getItem(inventoryStorageKey)
    if (stored) reservedOrSold = JSON.parse(stored) as Record<string, number>
  } catch {
    // Keep deterministic in-memory inventory when storage is unavailable or malformed.
  }
  return reservedOrSold
}

const writeInventory = (inventory: Record<string, number>) => {
  reservedOrSold = inventory
  try {
    globalThis.localStorage?.setItem(inventoryStorageKey, JSON.stringify(inventory))
  } catch {
    // The mock remains functional in memory when storage is unavailable.
  }
}

const inventoryKey = (nftId: string, editionId: string) => `${nftId}:${editionId}`

export const getCatalogNfts = (): readonly Nft[] =>
  catalogNfts.map((nft) => {
    const detail = createNftDetail(nft, catalogNfts)
    const inventory = readInventory()
    return {
      ...nft,
      available:
        nft.available &&
        detail.editions.some(
          (edition) => edition.availableQuantity - (inventory[inventoryKey(nft.id, edition.id)] ?? 0) > 0,
        ),
    }
  })

export const getNftDetailState = (nftId: string): NftDetail | undefined => {
  const nft = catalogNfts.find((candidate) => candidate.id === nftId)
  if (!nft) return undefined

  const inventory = readInventory()
  const detail = createNftDetail(nft, getCatalogNfts())
  const editions = detail.editions.map((edition) => ({
    ...edition,
    availableQuantity: Math.max(
      0,
      edition.availableQuantity - (inventory[inventoryKey(nftId, edition.id)] ?? 0),
    ),
  }))

  return { ...detail, available: editions.some((edition) => edition.availableQuantity > 0), editions }
}

export const reserveNftEdition = (nftId: string, editionId: string, quantity: number): boolean => {
  const edition = getNftDetailState(nftId)?.editions.find((candidate) => candidate.id === editionId)
  if (!edition || quantity < 1 || quantity > edition.availableQuantity) return false
  const key = inventoryKey(nftId, editionId)
  const inventory = readInventory()
  writeInventory({ ...inventory, [key]: (inventory[key] ?? 0) + quantity })
  return true
}

export const releaseNftEdition = (nftId: string, editionId: string, quantity: number) => {
  const key = inventoryKey(nftId, editionId)
  const inventory = readInventory()
  const remaining = Math.max(0, (inventory[key] ?? 0) - quantity)
  const next = { ...inventory }
  if (remaining === 0) delete next[key]
  else next[key] = remaining
  writeInventory(next)
}

export const updateCatalogNft = (id: string, update: (nft: Nft) => Nft): Nft | undefined => {
  const current = catalogNfts.find((nft) => nft.id === id)
  if (!current) return undefined

  const updated = update(current)
  catalogNfts = catalogNfts.map((nft) => (nft.id === id ? updated : nft))
  return updated
}

export const resetCatalog = () => {
  catalogNfts = createNfts()
  writeInventory({})
}
