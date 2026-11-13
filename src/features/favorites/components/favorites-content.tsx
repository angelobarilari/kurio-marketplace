import { NftCard } from '@/features/catalog/components/nft-card'
import { useFavorites } from '@/features/favorites/hooks/use-favorites'

export const FavoritesContent = ({ sessionId }: { sessionId: string }) => {
  const favorites = useFavorites(sessionId)

  if (favorites.isPending) {
    return (
      <div className="grid min-h-72 place-items-center" aria-busy="true">
        Carregando lista de interesse…
      </div>
    )
  }

  if (favorites.isError) {
    return (
      <div className="rounded-lg border border-(--color-destructive) p-5" role="alert">
        <h1 className="mb-2 text-xl font-bold">Lista de interesse</h1>
        <p className="mb-0">Não foi possível carregar seus favoritos. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Lista de interesse</h1>
      <p className="mb-7 text-sm text-(--color-muted)">NFTs salvos para consultar novamente quando quiser.</p>
      {favorites.data.items.length ? (
        <div className="grid grid-cols-3 gap-x-5 gap-y-9 max-[1100px]:grid-cols-2 max-[540px]:grid-cols-1">
          {favorites.data.items.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-(--color-panel) px-5 py-12 text-center">
          <h2 className="mb-2 text-lg font-bold">Sua lista está vazia</h2>
          <p className="mb-0 text-sm text-(--color-muted)">
            Use o botão de coração nos NFTs para adicioná-los aqui.
          </p>
        </div>
      )}
    </div>
  )
}
