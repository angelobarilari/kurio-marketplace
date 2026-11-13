import type { CatalogSort } from '@/features/catalog/types'

export const catalogCategories = [
  { id: 'digital-art', label: 'Arte digital' },
  { id: 'photography', label: 'Fotografia' },
  { id: 'music', label: 'Música' },
  { id: '3d-art', label: 'Arte 3D' },
  { id: 'collectibles', label: 'Colecionáveis' },
  { id: 'generative', label: 'Generativa' },
  { id: 'games', label: 'Jogos' },
  { id: 'subscriptions', label: 'Assinaturas' },
  { id: 'utility', label: 'Utilidade' },
] as const

export const catalogNetworks = ['Ethereum', 'Polygon', 'Solana'] as const

export const catalogSortTabs: { label: string; value: CatalogSort }[] = [
  { label: 'Todos os NFTs', value: 'recent' },
  { label: 'Novos lançamentos', value: 'newest' },
  { label: 'Em alta', value: 'popular' },
]

export const catalogSortOptions: { label: string; value: CatalogSort }[] = [
  { label: 'Listados recentemente', value: 'recent' },
  { label: 'Novos lançamentos', value: 'newest' },
  { label: 'Mais populares', value: 'popular' },
  { label: 'Menor preço', value: 'price-asc' },
  { label: 'Maior preço', value: 'price-desc' },
]
