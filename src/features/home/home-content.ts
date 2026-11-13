import { nftImages } from '@/assets'

export type PromoCardContent = {
  id: string
  image: string
  title: string
  description: string
}

export type JournalPostContent = {
  id: string
  image: string
  title: string
}

export const promoCards: readonly PromoCardContent[] = [
  {
    id: 'genesis-drops',
    image: nftImages.emeraldApe,
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Coleções exclusivas diretamente dos criadores antes da revelação pública.',
  },
  {
    id: 'curated-art',
    image: nftImages.ivoryBaron,
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
  },
]

export const journalPosts: readonly JournalPostContent[] = [
  { id: 'nft-ownership', image: nftImages.ivoryBaron, title: 'Como funciona a propriedade de NFTs' },
  { id: 'digital-artists', image: nftImages.emeraldApe, title: '10 artistas digitais para acompanhar' },
  { id: 'rarity-provenance', image: nftImages.sageNomad, title: 'Raridade, atributos e procedência' },
  { id: 'wallet-security', image: nftImages.goldenBeat, title: 'Como proteger sua carteira' },
]
