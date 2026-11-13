import { JournalCard } from '@/features/home/components/journal-card'
import { PromoCard } from '@/features/home/components/promo-card'
import { journalPosts, promoCards } from '@/features/home/home-content'

export const HomeEditorial = () => (
  <>
    <section
      className="mt-24 grid grid-cols-1 gap-6.5 max-[760px]:hidden lg:grid-cols-2"
      aria-label="Explore a Kurio"
    >
      {promoCards.map(({ id, ...card }) => (
        <PromoCard key={id} {...card} />
      ))}
    </section>

    <section className="my-24 max-[760px]:hidden" aria-labelledby="journal-title">
      <div className="mb-7 text-center">
        <h2 id="journal-title" className="mb-2.5 text-[26px] font-bold">
          Diário da Cunhagem
        </h2>

        <p className="text-[13px] text-(--color-muted)">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {journalPosts.map(({ id, ...post }) => (
          <JournalCard key={id} {...post} />
        ))}
      </div>
    </section>
  </>
)
