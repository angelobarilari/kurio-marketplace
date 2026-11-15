# Lighthouse - desempenho mobile

Este é o documento único para resultados, decisões e próximos passos de performance Lighthouse. Os relatórios brutos ficam localmente em `reports/lighthouse/` e não são documentação versionada.

## Referência anterior aos ajustes do carrinho

Auditoria fria de 15/11/2026, antes dos ajustes abaixo: três execuções por rota, mediana, build de produção local via Vite Preview e `VITE_ENABLE_MOCKS=true`.

- Lighthouse 12.8.2, HeadlessChrome 157.
- Perfil simulado Moto G Power (2022), viewport 390 x 844, DPR 1.
- Throttling simulado: 150 ms RTT, 1.638,4 Kbps, CPU 4x.
- Cada execução usou perfil isolado; o carrinho foi semeado sem visitar a aplicação antes.
- São resultados de simulação, não uma medição em aparelho ou rede móvel reais.

| Rota mobile        | Performance |      FCP |      LCP |      TBT |    CLS | Acessibilidade |
| ------------------ | ----------: | -------: | -------: | -------: | -----: | -------------: |
| Homepage           |          78 | 3.459 ms | 4.356 ms |  59,5 ms |      0 |              - |
| Carrinho (4 itens) |          80 | 2.930 ms | 4.182 ms | 107,5 ms | 0,0654 |             96 |

Homepage e carrinho ainda estão abaixo de 90. As demais rotas medidas ficaram acima de 90, mas isso não muda o resultado das duas entradas principais do marketplace.

Relatórios e traces desta auditoria: `reports/lighthouse/phase-8-home-cart-2026-11-15/` e `reports/lighthouse/phase-8-cart-cold-2026-11-15/`.

## Resultado após os ajustes do carrinho

Nova auditoria fria em 15/11/2026: três execuções por rota, mesma build e configuração Lighthouse da referência anterior. Cada execução usou um perfil Chrome isolado; o carrinho foi semeado numa página estática de mesma origem e o cache foi limpo antes da medição.

| Rota mobile         | Performance |      FCP |      LCP |    TBT | CLS | Acessibilidade |
| ------------------- | ----------: | -------: | -------: | -----: | --: | -------------: |
| Homepage (controle) |          76 | 3.554 ms | 4.412 ms | 129 ms |   0 |            100 |
| Carrinho (4 itens)  |          81 | 2.926 ms | 4.177 ms |  80 ms |   0 |             96 |

- No carrinho, o CLS caiu de `0,0654` para `0` nas três execuções; a consulta mobile `/api/nfts?sort=popular` também deixou de ocorrer.
- Performance e LCP do carrinho mudaram pouco (`80 -> 81` e `4.182 -> 4.177 ms`). O TBT mediano foi `107,5 -> 80 ms`, mas variou bastante entre execuções.
- A homepage, que não recebeu mudanças nesta etapa, também variou (`78 -> 76`, LCP `4.356 -> 4.412 ms`, TBT `59,5 -> 129 ms`). Portanto, não atribuir as oscilações pequenas de score, LCP ou TBT do carrinho aos ajustes; o resultado mais claro é a remoção do CLS e do trabalho de recomendações mobile.

Relatórios desta rodada: `reports/lighthouse/phase-8-cart-adjustments-2026-11-15/`.

## Histórico resumido de Home e detalhes

| Medição |  Home desktop |   Home mobile | Detalhes desktop | Detalhes mobile |
| ------- | ------------: | ------------: | ---------------: | --------------: |
| Fase 2  |   99 / 820 ms | 85 / 3.659 ms |      99 / 779 ms |   85 / 3.677 ms |
| Fase 6  | 97 / 1.152 ms | 78 / 4.439 ms |    98 / 1.031 ms |   79 / 4.434 ms |

Cada célula mostra Performance / LCP. As configurações e condições de cache variaram entre fases; use a auditoria fria acima como referência para próximas mudanças, não como comparação causal direta com os valores históricos.

## Achados e opções de melhoria

As economias de score abaixo são hipóteses; não há ganho garantido até repetir três medições na mesma configuração.

### 1. Confirmar se a build medida representa a produção

A inspeção do JavaScript público confirmou o bootstrap do MSW no deploy; `VITE_ENABLE_MOCKS=true` também está configurado localmente. Na homepage, o bundle do worker transferiu 172 KB; todos os scripts somaram cerca de 396 KB transferidos em 29 requisições. O bundle de entrada transferiu cerca de 95 KB.

O deploy público medido usa MSW para servir o backend demonstrativo. Desligar o mock sem uma API real não é uma otimização segura: quebraria os fluxos da aplicação.

**Opção futura:** reduzir ou substituir o custo do backend simulado quando houver uma API real, e medir novamente com essa configuração. Enquanto o mock for necessário no demo, tratamos esses 172 KB como parte do custo publicado.

### 2. Melhorar o LCP da homepage

O LCP é a imagem do primeiro card Emerald Ape, não o texto nem a imagem do hero. A imagem já é eager, prioritária e baixa em aproximadamente 9 KB; o mesmo arquivo é pedido pelo hero por volta de 199 ms e reutilizado pelo card. O candidato de LCP só aparece após a renderização client-side e não é descoberto como elemento da marcação HTML inicial. O FCP mediano ainda é 3,46 s na simulação.

**Status do bundle mobile:** `HomeEditorial` e `SiteFooter` agora são carregados apenas acima de 760 px. Os filtros do catálogo só são carregados quando o painel mobile é aberto; o seletor de ordenação exclusivo de desktop também não entra no caminho mobile inicial. Testes verificam que esses módulos não são requisitados na primeira renderização e que os filtros continuam funcionais quando abertos.

**Status da pré-renderização:** o build gera HTML para as rotas de carrinho, checkout, autenticação e conta, além de uma página inicial genérica para pedidos dinâmicos. Essas páginas privadas recebem apenas sua estrutura inicial segura (skeleton/carregamento), sem sessão, carrinho, carteira ou pedido de usuário no HTML; os dados reais continuam sendo carregados no cliente. Quando `VITE_ENABLE_MOCKS=true`, também são gerados a homepage e os detalhes públicos dos NFTs dos fixtures. O cliente hidrata a marcação correspondente à rota; URLs com query string e NFTs fora dos fixtures continuam na inicialização client-side normal. A mudança não redesenha as páginas: apenas antecipa para o HTML a mesma estrutura/estado inicial que antes aparecia após o JavaScript.

**Próxima opção, da menor para a maior intervenção:**

- Repetir a medição no deploy e em aparelho/rede reais. O pré-render estático local usa os fixtures do modo demo, não substitui SSR dinâmico conectado a uma API real.
- Investigar o atraso de renderização do LCP: nesta rodada, a mediana foi de aproximadamente 2.565 ms (81% do LCP), enquanto a descoberta e o carregamento da imagem somaram cerca de 199 ms.
- Não há evidência de que outra compressão ou preload da mesma imagem resolva o gargalo principal.

### 3. Trabalho de recomendações não exibidas no mobile

Antes do ajuste, `CartPage` envolvia `CartRecommendations` em um contêiner `display:none` no mobile, mas ainda montava o componente. Ele executava `useNftCatalog` e gerava uma requisição `/api/nfts` desnecessária para essa viewport.

**Status:** implementado; recomendações não são montadas até o breakpoint mobile. O teste E2E confirma que a consulta `sort=popular` não ocorre no mobile e que o carrossel permanece disponível em desktop/tablet.

### 4. CLS do resumo mobile

O deslocamento anterior de `0,0654` foi associado ao painel fixo inferior do carrinho, que crescia de 232 px para 361 px quando “Atualizando valores...” dava lugar ao resumo da cotação.

**Status:** implementado; o estado pendente reserva espaço para o resumo. O CLS foi `0` nas três novas medições frias, sem redesenhar o painel.

### 5. Investigar a sequência de sessão e carrinho

`useCart` só busca o carrinho depois que `useSession` termina. Na navegação anônima observada, `/api/session` retorna 401 antes de `/api/cart`; o primeiro item e sua imagem dependem dos dados do carrinho.

**Opção:** avaliar se o carrinho visitante pode ser exibido a partir do snapshot local enquanto a sessão é resolvida. O ganho potencial é reduzir uma espera serial; o risco é misturar dados de visitante e usuário ou quebrar o merge. Só implementar com testes de login, merge, logout e isolamento.

### 6. Corrigir a semântica do resumo

O Lighthouse de acessibilidade marcou 96 no carrinho: um `Separator` é filho direto do `<dl>` do resumo.

**Opção:** mover o separador para fora da lista de definições ou agrupar semanticamente os pares `dt`/`dd`. É correção de acessibilidade, não uma promessa de ganho na nota Performance.

## Resultados das outras rotas

Resultados posteriores às mudanças da Fase 7; cada rota teve três execuções. São referências das rotas, não evidência de que a homepage ou o carrinho tenham atingido 90.

| Rota mobile       | Performance após | LCP antes -> depois | TBT antes -> depois | Resultado confirmado                                                  |
| ----------------- | ---------------: | ------------------: | ------------------: | --------------------------------------------------------------------- |
| Login             |               99 | 1.339 ms (baseline) |   100 ms (baseline) | Sem mudança específica necessária                                     |
| Cadastro          |               99 | 1.324 ms (baseline) |    97 ms (baseline) | Sem mudança específica necessária                                     |
| Checkout          |               96 |   2.009 -> 1.968 ms |       110 -> 117 ms | Imagem oculta de 98.856 B removida; painel futuro adiado              |
| Pedido confirmado |              100 |   1.819 -> 1.787 ms |         39 -> 45 ms | Miniatura caiu de 98.856 B para 9.198 B; acessibilidade permaneceu 94 |
| Perfil            |               99 | 1.633 ms (baseline) |    25 ms (baseline) | Sem mudança específica necessária                                     |
| Carteiras         |              100 | 1.486 ms (baseline) |    50 ms (baseline) | Sem mudança específica necessária                                     |
| Favoritos         |               99 |   1.318 -> 1.779 ms |          12 -> 0 ms | Primeiro card priorizado; LCP piorou e precisa ser reavaliado         |

Os artefatos estão em `reports/lighthouse/phase-7-routes-before/` e `reports/lighthouse/phase-7-routes-after/`. Não se deve apresentar a mudança em favoritos como ganho de LCP.

## Última rodada: bundle mobile da homepage

Três execuções frias da homepage após adiar os filtros e o seletor de desktop, com a mesma simulação Moto G Power (2022), viewport 390 x 844, DPR 1, RTT 150 ms, 1.638,4 Kbps e CPU 4x. Lighthouse 12.8.2 / HeadlessChrome 157; os resultados são medianas.

| Métrica                |        Rodada anterior |                  Atual |               Variação |
| ---------------------- | ---------------------: | ---------------------: | ---------------------: |
| Performance            |                     77 |                     78 |                     +1 |
| FCP                    |               3.428 ms |               3.005 ms |                -423 ms |
| LCP                    |               4.404 ms |               4.419 ms |                 +15 ms |
| TBT                    |                  78 ms |               119,5 ms |               +41,5 ms |
| JavaScript transferido | 394.381 B / 33 scripts | 373.239 B / 30 scripts | -21.142 B / -3 scripts |

- Os módulos `catalog-filters`, `desktop-catalog-sort` e `select` não aparecem na waterfall mobile inicial; o painel de filtros os requisita quando é aberto.
- A redução de bytes e requisições é observável, mas não atribuir a oscilação de FCP, TBT ou score exclusivamente ao código. O LCP permaneceu essencialmente igual e a homepage segue abaixo de 90.
- Build e testes direcionados de filtros/ordenação passaram. O teste de screenshot `home` ainda diverge das imagens de referência versionadas em desktop e mobile; elas não foram atualizadas nesta etapa, então a equivalência visual continua pendente de revisão.

Relatórios desta rodada: `reports/lighthouse/phase-10-home-mobile-controls/`.

## Última rodada: pré-renderização da homepage

Três execuções frias da homepage após a pré-renderização estática, comparadas à rodada anterior de bundle mobile. Mesma configuração: Lighthouse 12.8.2 / HeadlessChrome, Moto G Power (2022) simulado, viewport 390 x 844, DPR 1, RTT 150 ms, 1.638,4 Kbps e CPU 4x. Os valores são medianas.

| Métrica     | Bundle mobile anterior | Pré-renderização |      Variação |
| ----------- | ---------------------: | ---------------: | ------------: |
| Performance |                     78 |               90 |           +12 |
| FCP         |               3.005 ms |         2.448 ms |       -557 ms |
| LCP         |               4.419 ms |         3.160 ms |     -1.259 ms |
| TBT         |               119,5 ms |           9,5 ms |       -110 ms |
| CLS         |                      0 |                0 | sem alteração |

- O candidato de LCP continua sendo a imagem do primeiro card Emerald Ape. Agora os nove cards já estão no HTML inicial, e o audit identificou a imagem no markup antes da execução do JavaScript.
- Build e hidratação de produção passaram em desktop e mobile; a homepage manteve os nove cards e os filtros mobile continuaram funcionais. Testes direcionados também cobrem filtros por URL e acesso direto ao carrinho.
- Uma das três execuções teve LCP de 4.071 ms, contra aproximadamente 3.160 ms nas outras duas. A mediana melhorou de forma clara, mas a variabilidade continua relevante; não tratar uma execução isolada como garantia.
- A mudança é pré-renderização estática de build, não SSR dinâmico por requisição. A homepage e os detalhes de NFT usam fixtures do modo demo; rotas com query string e IDs fora dos fixtures continuam na inicialização client-side. Dados privados nunca são gravados no HTML estático.

Relatórios desta rodada: `reports/lighthouse/phase-11-home-ssg-final/`.

## Auditoria das rotas pré-renderizadas

Nova auditoria mobile após a pré-renderização das demais páginas. Cada rota teve três execuções em perfis Chrome isolados; os valores abaixo são medianas. O servidor da auditoria resolve as URLs limpas para os documentos gerados e reproduz o rewrite de `/orders/:orderId` do Vercel. Antes de medir, o harness valida o conteúdo esperado da rota; isso evita contar redirecionamentos para login como checkout ou páginas de conta.

Perfil simulado Moto G Power (2022), viewport 390 x 844, DPR 1, RTT 150 ms, 1.638,4 Kbps, CPU 4x; Lighthouse 12.8.2 / HeadlessChrome 157. Build de produção com MSW habilitado.

| Rota mobile                             | Performance | Acessibilidade |      LCP |    TBT | CLS |
| --------------------------------------- | ----------: | -------------: | -------: | -----: | --: |
| Início                                  |          88 |            100 | 1.603 ms | 449 ms |   0 |
| Detalhe NFT (`emerald-ape-042`)         |          94 |            100 | 1.462 ms | 289 ms |   0 |
| Login                                   |          92 |            100 | 1.130 ms | 340 ms |   0 |
| Cadastro                                |          94 |            100 | 1.124 ms | 285 ms |   0 |
| Carrinho (visitante, 4 itens)           |          93 |             96 | 2.458 ms | 227 ms |   0 |
| Checkout (sessão, 1 item)               |          91 |            100 | 2.513 ms | 236 ms |   0 |
| Perfil (fixture Nova)                   |          96 |            100 | 1.782 ms | 232 ms |   0 |
| Carteiras (fixture Nova)                |          88 |            100 | 2.286 ms | 423 ms |   0 |
| Favoritos (fixture Nova)                |          97 |             98 | 1.797 ms | 173 ms |   0 |
| Pedido confirmado (gerado por execução) |          94 |             94 | 2.060 ms | 248 ms |   0 |

- Foi medido um detalhe representativo; os 54 IDs de NFT pré-renderizados usam o mesmo template. Pedidos usam IDs dinâmicos e o documento genérico `orders.html`.
- As páginas privadas foram medidas após autenticação com o fixture Nova; o pedido foi confirmado antes de cada execução. Os dados privados foram semeados no navegador e não são gravados no HTML estático.
- Início e carteiras ficaram abaixo de 90 nesta rodada. A pontuação e o TBT variaram entre execuções; por isso, estes resultados comprovam o estado atual das rotas, mas não isolam o ganho causado pela pré-renderização nem garantem o mesmo resultado no deploy ou em aparelho real.

Relatórios HTML/JSON e resumo gerado: `reports/lighthouse/phase-12-prerendered-routes/` (artefatos locais ignorados pelo Git).

## Otimizações já feitas

- Homepage, catálogo e detalhes: imagens NFT responsivas, `sizes` e prioridade para candidatos iniciais de LCP; fonte variável e cabeçalho desktop fora do caminho mobile.
- Homepage: conteúdo editorial, rodapé, filtros e seletor de ordenação exclusivos de desktop não são carregados no mobile inicial. O painel de filtros mobile é carregado sob demanda.
- Carrinho: imagens das linhas usam variantes responsivas. Na comparação da Fase 7, o `resourceSize` total caiu de 450.942 B para 32.778 B (-92,7%), mas o LCP ficou em 4,334 -> 4,336 s e o CLS em 0,0688. A imagem deixou de ser o principal alvo; o atraso de dados e o painel são mais relevantes. Recomendações não são montadas no mobile e o resumo reserva espaço durante a cotação; o CLS mediano caiu para 0.
- Checkout: painel de pagamento carregado quando necessário; resumo de NFT oculto não é renderizado no mobile.
- Pedido/recibo: miniaturas responsivas, primeira imagem prioritária.
- Favoritos: primeira imagem recebe prioridade, mas a mediana de LCP regrediu nesta matriz.

Os valores de `resourceSize` das imagens servidas localmente pelo MSW não são bytes confiáveis de transferência. Não comparar fases com viewport, DPR, cache, versão de Chrome ou throttling diferentes. Uma rodada anterior de Home marcou 98 em condição aquecida; ela não substitui a referência fria anterior de 78.

## Sequência recomendada

1. Concluído: confirmar que a build pública usa MSW; não desligar os mocks sem uma API real.
2. Concluído: remover a montagem das recomendações no mobile, reservar espaço para a cotação e repetir três medições frias. O CLS do carrinho foi zerado, mas Home e carrinho ainda estão abaixo de 90.
3. Concluído: adiar módulos que não são necessários no mobile inicial. A transferência de JavaScript caiu 21 KB e três requisições; score e TBT variaram e o LCP não melhorou de forma mensurável.
4. Concluído: pré-renderizar os nove cards iniciais da homepage e hidratar o estado do router. A mediana de LCP caiu 1.259 ms, Performance subiu 12 pontos e CLS permaneceu em 0; confirmar no deploy antes de atribuir o mesmo ganho a usuários reais.
5. Depois, testar a hipótese de renderização antecipada do carrinho visitante, protegendo a semântica de sessão e merge.
6. Validar em aparelho/rede reais antes de afirmar Core Web Vitals de usuários.

## Execução e validação

`npm run audit:lighthouse:matrix` executa a matriz configurada em `scripts/lighthouse-matrix.config.json` após `npm run build`. Os relatórios HTML/JSON e o resumo gerado ficam em `reports/lighthouse/phase-6/` (artefatos locais ignorados pelo Git). A matriz padrão não semeia o estado autenticado do carrinho; para repetir esta auditoria, use o mesmo estado de quatro itens e um perfil frio isolado.

`npm run audit:lighthouse:prerendered` executa três auditorias mobile por rota configuradas em `scripts/lighthouse-prerendered-routes.config.json`, após `VITE_ENABLE_MOCKS=true npm run build`. O harness também aceita `--target=checkout --runs=1` para uma verificação direcionada.
