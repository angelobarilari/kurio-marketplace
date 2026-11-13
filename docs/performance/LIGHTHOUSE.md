# Lighthouse — baseline da Fase 2

Auditoria executada em 12/11/2026 sobre `npm run build` + `npm run preview`, com mocks determinísticos habilitados. Cada combinação foi executada três vezes; a tabela registra a mediana. Os JSONs brutos estão em [`docs/performance/lighthouse`](./lighthouse/).

| Rota / perfil   | Performance | Acessibilidade | Boas práticas | SEO |      LCP |    CLS |   TBT |
| --------------- | ----------: | -------------: | ------------: | --: | -------: | -----: | ----: |
| Home desktop    |          99 |            100 |            96 |  92 |   820 ms | 0,0075 |  0 ms |
| Home mobile     |          85 |            100 |            96 |  92 | 3.659 ms | 0,0007 | 49 ms |
| Detalhe desktop |          99 |            100 |            96 |  92 |   779 ms | 0,0003 |  0 ms |
| Detalhe mobile  |          85 |            100 |            96 |  92 | 3.677 ms | 0,0007 | 48 ms |

## Leitura dos resultados

- Acessibilidade atingiu 100 nos quatro perfis após correções de contraste, estrutura de lista e tamanho dos alvos do carrossel.
- CLS e TBT estão baixos em todos os cenários.
- O principal ponto de otimização futuro é o LCP mobile, hoje próximo de 3,7 s. Ele não bloqueia a Fase 2, pois o README exige auditoria e documentação sem definir nota mínima, mas deve ser acompanhado ao adicionar carrinho e checkout.
- Boas práticas 96 e SEO 92 permanecem como baseline mensurável para as próximas fases; qualquer regressão deve ser justificada.
