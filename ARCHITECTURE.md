# Arquitetura — Kurio

O [teste técnico](./TECHNICAL-CHALLENGE.md) define os requisitos; o [README](./README.md) descreve a execução. Aqui estão os contratos, as regras de estado e os limites da implementação.

## Organização e stack

- `src/routes`: rotas TanStack Router, parâmetros validados e composição das telas.
- `src/features`: catálogo, detalhe, carrinho, autenticação/conta, favoritos, checkout e pedidos; cada domínio reúne API, hooks, schemas e componentes.
- `src/components/ui`: primitivas shadcn/ui adaptadas; `layout` e `media` concentram elementos compartilhados.
- `src/lib`: Axios, QueryClient e utilitários transversais; `src/types`: contratos compartilhados.
- `src/mocks`: fixtures, estado simulado e handlers MSW HTTP/Socket.IO.
- `tests`: regras unitárias e integrações Vitest por domínio, além de jornadas e baselines Playwright.
- `docs/quality`: roadmap, auditoria, resultados observados e mapas de coverage por camada.

React e TypeScript estrito compõem a UI; Tailwind CSS 4 aplica o sistema visual. TanStack Router mantém navegação e parâmetros; TanStack Query mantém o estado remoto; chamadas REST passam por Axios. A UI não importa fixtures ou estado de mocks.

## Rotas e limites de domínio

| Rota                  | Composição / responsabilidade                                                           |
| --------------------- | --------------------------------------------------------------------------------------- |
| `/`                   | Hero, catálogo, busca/filtros, ordenação e paginação. Estado navegável fica na URL.     |
| `/nfts/$nftId`        | Galeria, contrato detalhado, edições, quantidade, favorito e inclusão no carrinho.      |
| `/cart`               | Itens por proprietário, mutations, cupom, cotação e avanço para autenticação/checkout.  |
| `/login`, `/register` | Autenticação com retorno validado; diálogo no desktop e experiência dedicada no mobile. |
| `/profile`            | Dados, avatar e senha em formulários/mutations independentes.                           |
| `/profile/wallets`    | Carteiras com rede, endereço, provedor, ENS e prioridade.                               |
| `/profile/favorites`  | Lista privada e mutations otimistas de favoritos.                                       |
| `/checkout`           | Formulário, carteira/conexão, revisão de cotação e tentativa idempotente.               |
| `/orders/$orderId`    | Consulta, estados, eventos/reconciliação e recibo pertencente ao usuário autenticado.   |

Rotas compõem a experiência; clientes `api` descrevem transporte; hooks de Query mantêm dados remotos. Controllers coordenam regras e estados de página. Componentes de domínio permanecem na feature, enquanto shells, mídia e primitivas compartilhadas ficam em `components`. O [guia de implementação](./AI-PROJECT-GUIDE.md) detalha as dependências permitidas e os padrões de manutenção.

## Contratos de domínio

- `NftSummary` contém identidade, coleção, categoria, rede, preço decimal, edição resumida, disponibilidade, imagem, datas, popularidade e versão. `Nft` é um alias desse contrato.
- `NftDetail` acrescenta galeria com mídia/alt text, descrições, criador, atributos, edições, avaliação resumida, proveniência e NFTs relacionados. A listagem não carrega indiscriminadamente esses campos.
- `NftEdition` identifica edição, rótulo, preço, estoque e limite por pedido. A quantidade válida depende de estoque, disponibilidade e itens já presentes no carrinho.
- `Session` contém ID, usuário e expiração; não inclui senha. Perfil, carteiras, favoritos e pedidos são recursos privados separados.
- `Cart` identifica proprietário e itens. Cada item representa NFT + edição, com quantidade e valores canônicos reconciliados pela API.
- `QuoteRevision` contém fingerprint, cupom, rede, validade, emissão e totais. O pedido revalida essa revisão, evitando confirmar valores obsoletos.
- `Order` mantém identidade, proprietário, versão e estado da tentativa; o recibo conserva os dados e valores comprados, sem depender de consultas posteriores ao catálogo.

Os arquivos de tipos vinculados na referência REST definem os payloads completos. A tipagem do cliente não substitui a validação feita pelos handlers.

## Build e pré-renderização

`npm run build` executa TypeScript, Vite e `scripts/prerender-routes.mjs`. Com `VITE_ENABLE_MOCKS=true`, MSW no Node atende às consultas Axios pelos mesmos handlers públicos do navegador. A API paginada fornece os identificadores das 54 páginas de NFT; a build gera 63 documentos, incluindo home, conta/checkout e o documento de pedidos.

O HTML público inclui o cache de catálogo/detalhe serializado com escape de HTML, restaurado antes da hidratação React. O cache privado é vazio: sessão, carrinho, carteiras e pedidos são consultados no cliente. A separação evita serializar dados associados a uma sessão em um documento estático compartilhável. É geração estática durante o build, sem servidor de renderização por requisição. URLs com filtros ou sem documento correspondente iniciam pelo cliente.

Os documentos gerados fazem preload da fonte latina local e iniciam o download/execução da aplicação após a primeira oportunidade de pintura, usando dois `requestAnimationFrame`. Os preloads de módulos são removidos do HTML inicial para priorizar CSS, fonte e imagens; o grafo de módulos é carregado pelo import da aplicação. O stylesheet permanece externo e reutilizável em cache. O mesmo código e os mocks são carregados em todas as visitas; a interatividade aguarda essa inicialização.

O root pré-renderizado fica `inert` e `aria-busy`, com um status acessível, até o commit React. `RootLayout` libera os controles e remove o status após a hidratação. Isso impede que cliques em formulários estáticos sejam perdidos antes de os handlers estarem disponíveis. `npm run test:preview` verifica essa condição atrasando o módulo inicial e realizando login em desktop/mobile, além de conferir rotas, refresh, cache privado, favicon e robots.txt. A decisão de não adicionar uma segunda suite unitária ao entrypoint é baseada nessa validação da build renderizada e hidratada, não no coverage zero do arquivo; o escopo e essa limitação estão registrados no [roadmap de testes](./docs/quality/TESTING-ROADMAP.md).

A configuração Vercel serve documentos com `cleanUrls`, reescreve `/orders/:orderId` para `orders.html` e mantém o fallback de rotas. Nenhuma publicação é executada pelos comandos de qualidade.

## Cache, concorrência e tempo real

| Recurso              | Política                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Padrão de consultas  | `staleTime` de 30 segundos, um retry e sem refetch ao focar a janela. Mutations não têm retry automático.                                                      |
| Catálogo             | Chave `['nfts', search]`; busca, filtros, ordenação e página são validados na URL. Mudança de filtro reinicia a página; consultas recebem `AbortSignal`.       |
| Detalhe              | Chave `['nfts', 'detail', nftId]`, com 404 separado de falhas recuperáveis.                                                                                    |
| Sessão               | Chave `['session']`, stale de 15 segundos e sem retry. Expiração preserva o destino para autenticação e retomada.                                              |
| Dados privados       | Chaves com identidade da sessão e `meta.private`; logout remove dados privados e carrinho. Leituras de carrinho são canceladas antes da troca de proprietário. |
| Favoritos/quantidade | Atualização otimista com snapshot e rollback quando a API rejeita a mutation.                                                                                  |
| Pedidos              | Chave com sessão e pedido, sem retry; pedidos pendentes têm polling de recuperação a cada dois segundos.                                                       |

`nft.updated` só aplica versões mais novas. O sincronizador guarda o último evento por NFT enquanto está montado e reaplica essa versão depois de uma consulta REST: assim, uma resposta antiga não sobrescreve o preço/disponibilidade já recebidos, mesmo durante a primeira leitura. Eventos antigos/duplicados são descartados sem reaplicar efeitos. A indisponibilidade é consistente entre catálogo, detalhe e cotação.

A primeira conexão assina o catálogo; a leitura inicial vem da API ou do cache público hidratado. Reconexões invalidam as consultas ativas para reconciliar via REST. O cliente Socket.IO é importado depois da inicialização do worker MSW, garantindo a interceptação do handshake Engine.IO. O cleanup libera a observação do cache, os eventos guardados, os listeners e o socket.

Eventos de pedidos conferem pedido, usuário e versão. O componente é associado à sessão/pedido atual e encerra sua assinatura no cleanup. Reconexão e polling recuperam o pedido pela API sem criar outra compra.

## Contratos REST e eventos

### Referência dos contratos REST

As rotas abaixo usam o prefixo `/api` e corpos JSON. Os clientes estão nas pastas `api` de cada feature e os handlers em `src/mocks/handlers`. ETH trafega como string decimal; quantidades são inteiras. Os tipos vinculados depois da tabela definem os campos completos.

| Método e recurso                                    | Entrada                                                                        | Resposta                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `GET /session`                                      | Sem corpo                                                                      | `Session`; `401` quando não há sessão válida, convertido em `null` pelo cliente |
| `POST /session/register`                            | `username`, `email`, `password`, `passwordConfirmation`                        | `Session`; conflito de e-mail/usuário ou validação por campo                    |
| `POST /session/login`                               | `email`, `password`                                                            | `Session`; credenciais inválidas retornam `401`                                 |
| `POST /session/social/:provider`                    | `google` ou `facebook`, sem credenciais externas                               | `Session` simulada                                                              |
| `POST /session/logout`                              | Sem corpo                                                                      | `204`, com sessão encerrada                                                     |
| `POST /session/recover-password`                    | `email`                                                                        | `PasswordRecoveryResult`, confirmação simulada sem envio real de e-mail         |
| `GET /nfts`                                         | Query `q`, `category`, `network`, `minPriceEth`, `maxPriceEth`, `sort`, `page` | `NftListResponse`, com itens, paginação e facetas                               |
| `GET /nfts/:id`                                     | Identificador na rota                                                          | `NftDetail` ou `404`                                                            |
| `GET /favorites`                                    | Sessão autenticada                                                             | `Favorites` do usuário                                                          |
| `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` | Identificador na rota                                                          | `Favorites` atualizado                                                          |
| `GET /cart`                                         | Proprietário resolvido pela sessão ou estado do visitante                      | `Cart`                                                                          |
| `POST /cart/items`                                  | `nftId`, `editionId`, `quantity`                                               | `Cart` atualizado                                                               |
| `PATCH /cart/items/:itemId`                         | `quantity`                                                                     | `Cart` atualizado                                                               |
| `DELETE /cart/items/:itemId`                        | Identificador na rota                                                          | `Cart` atualizado                                                               |
| `POST /cart/merge`                                  | `idempotencyKey` e itens do visitante                                          | Carrinho da conta, cotação, conflitos e indicação de merge já aplicado          |
| `POST /cart/quote`                                  | `couponCode` e rede opcional                                                   | `CartQuote`, com fingerprint, validade, subtotal, desconto, taxa e total        |
| `GET /profile`, `PATCH /profile`                    | PATCH com `ProfileUpdateInput`                                                 | `Profile` autenticado                                                           |
| `PUT /profile/avatar`                               | `avatarUrl`, inclusive `null` para remover                                     | `Profile` atualizado                                                            |
| `PUT /profile/password`                             | `currentPassword`, `newPassword`, `passwordConfirmation`                       | `204` após validação                                                            |
| `GET /wallets`                                      | Sessão autenticada                                                             | `Wallet[]`                                                                      |
| `POST /wallets`, `PUT /wallets/:walletId`           | `WalletInput`                                                                  | `Wallet` cadastrada/atualizada; endereço duplicado gera conflito                |
| `GET /checkout/wallet-connection`                   | Sessão autenticada                                                             | `WalletConnection` ou `null`                                                    |
| `POST /checkout/wallet-connection`                  | `walletId`, `network`, `provider`                                              | `WalletConnection`, ou erro simulado de recusa/conexão                          |
| `DELETE /checkout/wallet-connection/:connectionId`  | Identificador na rota                                                          | `204`                                                                           |
| `POST /orders`                                      | `CreateOrderInput` e header `Idempotency-Key` com a mesma chave do corpo       | `Order`; a mesma tentativa recupera o pedido e payload diferente gera conflito  |
| `GET /orders/:orderId`                              | Identificador na rota                                                          | `Order` pertencente ao usuário, ou `404`                                        |
| `GET /orders/by-idempotency/:idempotencyKey`        | Chave da tentativa na rota                                                     | `Order` recuperado ou `404`                                                     |

Contratos completos: [conta e sessão](./src/features/auth/types.ts), [carteiras](./src/types/account.ts), [NFT](./src/types/nft.ts), [catálogo](./src/features/catalog/types.ts), [favoritos](./src/features/favorites/types.ts), [carrinho e cotação](./src/features/cart/types.ts) e [pedido/recibo/conexão](./src/types/order.ts).

Erros usam `code` e, conforme o recurso, `message`, `fieldErrors` ou uma nova `quoteRevision`. Os handlers representam entrada inválida (`400`/`422`), falta de sessão (`401`), recurso inexistente ou pedido fora do escopo do usuário (`404`), conflito (`409`), cupom expirado (`410`) e indisponibilidade (`503`); cenários de rede também podem falhar sem resposta HTTP. Ocultar um pedido de outro usuário como `404` evita expor sua existência. A UI associa erros de campo e oferece recuperação quando a operação é recuperável.

`x-kurio-mock-scenario` seleciona falhas determinísticas; `x-kurio-cart-state` transporta os itens do visitante ao backend simulado. Esses headers pertencem à demonstração. `POST /api/mock/reset` restaura o estado e retorna `204`; `POST /api/mock/orders/:orderId/transition` permite controlar a evolução de pedidos nos cenários. Essas rotas auxiliares não substituem as operações reais de interface.

### Contrato de eventos

O transporte usa `socket.io-client`, path `/socket.io/` e WebSocket, interceptado por MSW com `@mswjs/socket.io-binding`. A URL `same-origin` acompanha a origem da aplicação. Não há servidor Socket.IO remoto nem blockchain real nessa demonstração.

| Evento              | Payload                                  | Reconciliação                                                         |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `catalog.subscribe` | Sem payload obrigatório                  | Solicita a assinatura do catálogo público                             |
| `nft.updated`       | `id`, `version`, `priceEth`, `available` | Atualiza somente versões mais novas e invalida o carrinho/cotação     |
| `order.subscribe`   | `{ orderId }`                            | O mock confere sessão e propriedade antes da assinatura               |
| `order.updated`     | `orderId`, `userId`, `version`, `order`  | Confere identidade e versão; dados privados ficam isolados por sessão |

Na reconexão, os recursos ativos são reconsultados via REST. Pedidos pendentes também possuem polling de recuperação a cada dois segundos; o polling termina ao alcançar um estado terminal. Cleanup remove listeners e encerra a conexão. A cobertura e os resultados estão em [RESULTS.md](./docs/quality/RESULTS.md).

## Sessão, conta e persistência

As APIs de cadastro, credenciais e login social simulado retornam uma sessão com duração padrão de uma hora. Google e Facebook selecionam usuários fictícios separados. As contas e a sessão persistem no backend simulado via `localStorage`; senhas usam somente digest SHA-256, sem retorno no contrato público. Isso é suporte à demonstração, não um serviço de autenticação de produção.

Perfil, avatar, senha e carteiras têm contratos e mutations separados. React Hook Form e Zod validam os formulários; MSW revalida no limite da API e devolve erros por campo. Avatares aceitam PNG/JPEG/WebP de até 1 MB. Carteiras têm identidade própria, rede, provedor e prioridade; endereços duplicados são rejeitados por usuário.

Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação. O login mantém o retorno ao fluxo anterior; desktop usa diálogo e mobile usa tela dedicada. Expiração de sessão no checkout preserva o contexto e exige reconexão de carteira. Pedidos de outro usuário são tratados como inexistentes.

`POST /api/mock/reset` restaura contas, sessão, favoritos, catálogo, carrinhos, inventário e pedidos. A seleção de cenário é removida separadamente, conforme o README.

## Carrinho e cotação

- Cada item é identificado por NFT + edição. Quantidade é inteira e limitada pelo estoque e por `maxPerOrder`.
- ETH trafega como string decimal; cálculos usam wei inteiro (`BigInt`), sem ponto flutuante para dinheiro.
- Carrinhos de visitante e usuários são separados. No mock, um snapshot visitante é transportado pelo cliente HTTP para sustentar refresh; o backend simulado revalida os itens. Uma API de produção deve manter o carrinho no servidor.
- Após login, `/cart/merge` combina os itens com a conta, revalida estoque/limites e devolve conflitos. Uma chave idempotente impede somar novamente o mesmo merge. O snapshot visitante só é removido depois da confirmação.
- `/cart/quote` é a fonte de subtotal, desconto, taxa e total. `KURIO10` concede 10%; `EXPIRADO` retorna expiração; outros códigos não vazios são inválidos.
- Eventos invalidam carrinho/cotação. Conflitos e recotação bloqueiam o avanço; dados anteriores no cache não autorizam uma compra.

## Checkout, pedido e recibo

O checkout separa formulário, tentativa idempotente e submissão em hooks da feature; `useCheckoutController` os compõe e a rota seleciona os estados e componentes. A validade do formulário é acompanhada antes de montar o painel de pagamento carregado sob demanda.

A revisão inclui todos os itens e quantidades do carrinho, usando a mesma cotação sem filtro de rede. Carteira cadastrada, rede e provedor são conceitos distintos. O seletor oferece todas as carteiras do usuário; cada NFT conserva sua rede no snapshot. No mobile, dados obrigatórios e pagamento ocupam etapas separadas. Nome ENS e código de indicação são obrigatórios; o código não é inventado automaticamente.

Conectar uma carteira é uma chamada simulada com estados de sucesso, recusa e falha. Criar pedido exige sessão, conexão, formulário e cotação válidos. Mudança de preço, cupom, disponibilidade ou fingerprint exige revisão explícita antes de confirmar novamente.

A chave de idempotência identifica uma tentativa: reenvio após timeout recupera o mesmo pedido; usar a chave com payload diferente retorna conflito. Pedido é `pending`, `confirmed` ou `declined`; os dois últimos estados são terminais. Recarga e reconexão recuperam o pedido existente.

A submissão usa uma referência síncrona para bloquear cliques concorrentes antes de qualquer `await`, sem depender do próximo render ou do botão desabilitado. Sucesso/recuperação mantém o bloqueio até sair do checkout; falhas recuperáveis liberam nova tentativa. A chave é consultada diretamente no `sessionStorage` por usuário antes de gerar outra, impedindo que callbacks do mesmo ciclo criem chaves distintas.

Só um pedido confirmado produz recibo. O recibo contém snapshot imutável do colecionador, carteira, itens, taxas e total. Após confirmação, apenas as quantidades compradas são removidas do carrinho. Recusa e falhas preservam os itens. Transação e explorer são simulados.

## Interface e desvios do layout

Tailwind aplica tokens de cor e espaçamento; o CSS global reúne fontes, reset, acessibilidade e animações. A fonte local usa a família registrada pelo pacote, `Roboto Mono Variable`. `NftImage` oferece variantes WebP de 320/768/1254 px com `srcset` e `sizes`. Miniaturas de galeria são lazy para evitar baixar conteúdo oculto no mobile; a imagem principal permanece eager e prioritária.

Os [frames canônicos e desvios do Figma](./docs/references/figma/README.md) documentam a grade mobile alinhada, a retirada do retrato sobreposto no hero, o acesso à conta e as adaptações necessárias aos fluxos funcionais. Desktop e mobile têm composições próprias. Esses PNGs são referências de design para revisão, não testes nem snapshots; devem permanecer versionados. Perfil, carteiras e recibo funcionam no mobile mesmo sem frame dedicado.

Skeletons preservam a geometria e respeitam movimento reduzido. Labels, erros, foco, diálogos, reflow e overflow possuem cobertura. O preço do detalhe anuncia atualizações por `aria-live="polite"`. Screenshots comparam a UI com baselines aprovadas; não certificam automaticamente fidelidade integral ao Figma.

A galeria reutiliza as artes locais disponíveis. Avaliações exibem resumo/contagem e não permitem envio. Páginas editoriais, suporte, ofertas, downloads, blockchain e pagamentos reais estão fora do escopo. Controles auxiliares comunicam sua indisponibilidade sem apresentar sucesso fictício.

## Decisões arquiteturais e motivo

As escolhas abaixo descrevem o sistema implementado. Cada motivo está ligado a comportamento observável ou a uma validação repetível; quando a evidência é parcial, isso é indicado explicitamente.

| Decisão                                                          | Por que                                                                                                                                                                                                                                                    | Evidência reproduzível                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Separar testes unitários, integração e navegador                 | Regras puras são rápidas e isoladas; stores/handlers precisam provar efeitos e contratos reais; interface, acessibilidade e navegação precisam de browser. Isso evita um teste E2E genérico para cada regra e evita duplicar em DOM os mesmos contratos.   | [Schemas unitários](./tests/unit/auth/schemas.test.ts), [schemas de checkout](./tests/unit/checkout/schemas.test.ts), [integrações HTTP MSW](./tests/integration/mocks/http-contracts.test.ts) e [configuração Playwright](./playwright.config.ts).                                                                      |
| Testar todos os schemas de runtime, sem manter cobertura parcial | A validação de payload e campos é uma regra isolável. O inventário encontrou somente dois módulos de schema Zod de produção; testar todos os exports mantém um padrão uniforme sem trazer jornadas de formulário para Vitest.                              | [Schemas de auth](./tests/unit/auth/schemas.test.ts), [schemas de checkout](./tests/unit/checkout/schemas.test.ts) e inventário/regras em [AUDIT.md](./docs/quality/AUDIT.md).                                                                                                                                           |
| Manter busca, filtros e paginação na URL; dados remotos em Query | A URL preserva estado navegável no refresh/histórico, enquanto Query controla cache e reconciliação dos dados assíncronos.                                                                                                                                 | [Validação de parâmetros](./tests/unit/routing/search.test.ts), [jornada de catálogo](./tests/catalog.spec.ts) e [cache/realtime](./tests/integration/catalog/realtime-cache.test.ts).                                                                                                                                   |
| Validar handlers HTTP diretamente além das jornadas              | Uma jornada atravessa só parte das respostas de cada endpoint. `fetch` contra handlers reais verifica status, payload, autenticação e efeitos persistidos; `onUnhandledRequest: 'error'` impede sucesso silencioso por rota não interceptada.              | [Contratos de auth/conta/favoritos/carrinho/pedidos](./tests/integration/mocks/http-contracts.test.ts), [contratos do catálogo](./tests/integration/mocks/catalog-http.test.ts), `npm run test:integration`.                                                                                                             |
| Isolar recursos privados por sessão/usuário                      | Cache e conexão de carteira não devem sobreviver a uma troca de sessão como se pertencessem ao novo usuário; tentativas/pedidos também precisam respeitar propriedade.                                                                                     | [Testes de sessão e propriedade](./tests/integration/auth/session.test.ts), [isolamento/cache realtime](./tests/integration/catalog/realtime-cache.test.ts) e cenários de conta/pedido em [Playwright](./tests/checkout.spec.ts).                                                                                        |
| Usar wei inteiro, quote revision e idempotência no checkout      | `Number` decimal não representa ETH com exatidão. O fingerprint obriga revisão de valores/disponibilidade obsoletos, e a chave idempotente evita pedidos duplicados após retry/timeout.                                                                    | [Conversões ETH/wei](./tests/unit/lib/eth.test.ts), [estados de carrinho](./tests/integration/cart/cart-state.test.ts), [pedidos e recuperação](./tests/integration/order/order-state.test.ts) e [jornadas de checkout](./tests/checkout.spec.ts).                                                                       |
| Pré-renderizar dados públicos, nunca o estado privado            | HTML estático pode ser servido a visitantes diferentes; serializar sessão, carrinho, carteira ou pedido poderia misturar dados. Query pública melhora a primeira pintura sem transformar o build em renderização por requisição.                           | [Entrada SSR](./src/entry-server.tsx), [gerador de rotas](./scripts/prerender-routes.mjs), `npm run build` e `npm run test:preview` verificam documentos, cache privado vazio, navegação e hidratação atrasada. A entrada tem coverage instrumentado zero; build/preview são evidência funcional, não coverage unitário. |
| Manter o gate de 80% combinado e gates locais de branches        | Vitest e Playwright compartilham linhas e têm instrumentos/denominadores diferentes; exigir 80% para cada camada duplicaria uma meta sem indicar qualidade. Quatro stores críticas têm gate local de branches como proteção adicional de regras de estado. | Thresholds em [vitest.config.ts](./vitest.config.ts); coleta/fusão em [run-coverage.mjs](./scripts/run-coverage.mjs) e [merge-browser-coverage.mjs](./scripts/merge-browser-coverage.mjs); números e execução em [RESULTS.md](./docs/quality/RESULTS.md).                                                                |
| Não instalar mutation testing nem impor score global agora       | Um piloto pequeno pode mostrar se assertions críticas detectam regressões, mas um score sem escopo ou baseline estável pode incentivar mutações sem valor de produto.                                                                                      | O piloto manual da regra de carteira primária foi detectado pelo teste em [account-state.test.ts](./tests/integration/auth/account-state.test.ts); procedimento, resultado e decisão de não instalar ferramenta estão no [roadmap de testes](./docs/quality/TESTING-ROADMAP.md).                                         |

O mapa de evidências não torna todos os detalhes de implementação automaticamente provados: documentação visual, restrições do teste técnico e decisões de produto também dependem de suas fontes próprias. Referências Figma servem para inspeção visual, não como teste automatizado; screenshots verificam diferenças contra baselines, não fidelidade integral. Veja os [resultados observados](./docs/quality/RESULTS.md) e a [auditoria de qualidade](./docs/quality/AUDIT.md) para limites, ambiente e proveniência.

## Evidências e entrega

Vitest valida regras isoladas em `tests/unit/` e integrações locais em `tests/integration/`, com arquivos por domínio. `tests/support/` concentra fixtures tipadas e o reset de stores/armazenamento; cada arquivo é isolado pelo runner. As suites HTTP exercitam os handlers MSW reais de catálogo, auth, conta, favoritos, carrinho e pedido por requisições `fetch`, com falha em requisições não tratadas. Os testes de domínio chamam os stores reais e verificam valores exatos, idempotência, reconciliação, autorização e propriedade dos dados. Essa camada não certifica renderização, interação por teclado, service worker no navegador ou transporte Socket.IO; esses comportamentos permanecem no Playwright. `tsconfig.test.json` aplica tipagem estrita sem incluir os testes no bundle da aplicação.

Coverage mede execução e os mapas por camada não comprovam que assertions são suficientes. `npm run test:coverage:vitest` roda ambos os projetos Vitest; `npm run test:coverage` combina os mapas Vitest e Playwright. Os 80% são threshold somente do mapa combinado, não 80% por ferramenta. O relatório por camada é diagnóstico; as jornadas E2E são avaliadas pelas assertions de comportamento. A configuração Playwright executa Chromium em 1440 × 900, 768 × 1024 e 390 × 844; os casos condicionados ao viewport não contam como aprovados nos relatórios. Veja [RESULTS.md](./docs/quality/RESULTS.md), [AUDIT.md](./docs/quality/AUDIT.md) e [TESTING-ROADMAP.md](./docs/quality/TESTING-ROADMAP.md) para métricas, reprodução e prioridades.

[LIGHTHOUSE.md](./docs/performance/LIGHTHOUSE.md) registra a matriz, condições, metas e limitações. O [checklist de entrega](./IMPLEMENTATION-ROADMAP.md) relaciona essas evidências ao enunciado.

Os endereços da aplicação e do repositório estão no README. A validação local não comprova que a URL publicada contém as correções locais. Nenhum deploy faz parte desta execução.
