type JournalCardProps = {
  image: string
  title: string
}

export const JournalCard = ({ image, title }: JournalCardProps) => (
  <article data-testid="journal-card" className="overflow-hidden rounded-lg bg-(--color-panel)">
    <img src={image} alt="" loading="lazy" className="aspect-[1.1] w-full object-cover" />

    <div className="p-3.5">
      <p className="mb-0 text-[10px] text-(--color-muted)">12 de novembro · Leitura de 4 min</p>

      <h3 className="my-2 text-[13px] font-bold">{title}</h3>

      <p className="mb-0 text-[10px] text-(--color-muted)">Leitura em breve</p>
    </div>
  </article>
)
