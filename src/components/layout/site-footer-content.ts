type FooterHighlight = {
  id: string
  symbol: string
  title: string
  description: string
}

export const footerHighlights: readonly FooterHighlight[] = [
  {
    id: 'wallet-security',
    symbol: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    id: 'featured-creators',
    symbol: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital.',
  },
  {
    id: 'drop-alerts',
    symbol: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de cunhagem e novidades de artistas selecionados.',
  },
]
