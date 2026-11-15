# Roadmap de testes — Kurio

Este plano evolui a confiança nos testes por risco e por camada. Não é uma meta de aumentar percentuais sem relação com comportamento.

## Evidência e política atuais

`npm run test:coverage` combina os mapas de execução do Vitest e do Playwright para os 161 arquivos `src/**/*.{ts,tsx}`. O limite de 80% em linhas, statements, funções e branches aplica-se **somente ao mapa combinado**; não significa 80% em cada ferramenta. O relatório agregado não atribui cada execução a uma camada.

`npm run test:coverage:vitest` executa os projetos unit e integration do Vitest, não apenas os testes unitários. A execução atual teve **186 testes em 15 arquivos**; entre os 161 arquivos-fonte incluídos, registrou 33,67% de linhas, 29,09% de branches, 26,19% de funções e 34,55% de statements. O [relatório Vitest-only](./coverage/vitest-only/index.html) mostra a execução dessa camada.

A última execução completa Playwright descobriu 345 casos: **234 aprovados, 111 ignorados por viewport e zero falhas**, em 10,3 minutos. A cobertura de navegador é capturada por CDP nos testes executados. O [relatório Playwright-only](./coverage/playwright-only/index.html) mostra coverage; o [HTML dos casos](./playwright/coverage-run.html) mostra resultados de testes, não um percentual de coverage por E2E.

O mapa combinado atual junta essa execução Playwright completa com a execução Vitest mais recente: 91,26% linhas, 85,83% branches, 84,78% funções e 88,17% statements. `npm run test:coverage:refresh-vitest` atualizou o mapa Vitest e reagrupou o browser map versionado porque nenhum arquivo `src/`, dependência, teste/configuração Playwright, configuração Vite ou mock mudou após a execução E2E. Esse comando não executa Playwright. Se qualquer input de browser mudar ou a validade do mapa for incerta, rode `npm run test:coverage`.

Coverage responde “o código foi executado?”, não “as assertions comprovaram o comportamento?”. Um componente renderizado por E2E está corretamente marcado como executado, mas isso não prova que seus estados, erros ou limites foram verificados de forma isolada. Não é falso positivo da ferramenta; é uma conclusão excessiva quando o percentual é tratado como sinônimo de qualidade.

### Responsabilidades por camada

| Camada             | Uso principal                                                             | Evidência que deve orientar decisões                                     |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Vitest unit        | Regras puras, validação, transformações, limites e invariantes de domínio | Assertions sobre entradas, saídas e branches relevantes                  |
| Vitest integration | Stores, Query, handlers MSW e isolamento entre recursos                   | Estado real, contrato HTTP e recuperação de falhas                       |
| Playwright         | Jornadas observáveis no browser, navegação, interação e integração visual | Assertions de interface, requests/estado resultante e matriz de jornadas |
| Coverage combinada | Sinal amplo de execução do código-fonte                                   | Relatório agregado; não substitui as evidências acima                    |

Não estabelecer 80% genérico para Vitest e mais 80% para Playwright sobre todo `src/`. Os escopos e a instrumentação diferem, parte das linhas se sobrepõe e percentuais não se somam. Relatórios separados servem para diagnosticar lacunas; thresholds futuros devem restringir-se a um escopo estável de lógica crítica, após análise de branches e uma baseline reproduzível.

## Fases

### Fase 0 — Baseline e classificação (concluída)

- [x] Conferir os comandos, configurações e relatórios atuais.
- [x] Registrar que a meta atual de 80% é combinada e não é um threshold por ferramenta.
- [x] Preservar contagens de Vitest, Playwright e o mapa combinado sem somar casos sobrepostos.

### Fase 1 — Relatórios atribuídos por camada (concluída)

- [x] Preservar o mapa e o relatório Vitest-only.
- [x] Gerar e preservar um relatório Playwright-only com o mesmo conjunto de arquivos-fonte, incluindo arquivos não visitados com coverage zero.
- [x] Manter o relatório combinado como gate de 80% e os relatórios por camada como diagnóstico, sem thresholds independentes arbitrários.
- [x] Fazer `test:coverage:report` reconstruir cada apresentação apenas a partir dos mapas JSON versionados.
- [x] Atualizar apenas Vitest e reagrupar com o mapa E2E anterior via `test:coverage:refresh-vitest`, documentando quando esse reaproveitamento é válido.

### Fase 2 — Regras puras e erros de API (concluída)

- [x] Adicionar testes para a validação de payloads em `getApiError` e para o mapeamento permitido de campos em `applyApiFieldErrors`.
- [x] Cobrir formato inválido, códigos não reconhecidos, mensagens/campos inválidos, campo permitido, alias de campo e fallback.
- [x] Não duplicar os testes de interface que já provam os mesmos contratos.

### Fase 3 — Branches de regras críticas (concluída)

- [x] Revisar os relatórios por arquivo de carrinho e transições/tentativas de pedido; confirmar a existência de testes de rejeição, idempotência e estados terminais.
- [x] Completar os casos de validação de checkout não exercitados em `order-store.ts`: nome, perfil, usuário, carteira e endereço secundário.
- [x] Revisar os branches restantes de cotação, reserva de estoque, carrinho e sessão; adicionar testes apenas quando verificarem uma invariante ou recuperação ainda não provada.
- [x] Confirmar a cobertura existente antes de adicionar casos Vitest e manter os testes rápidos nos limites de domínio.
- [x] Evitar extrações sem redução de acoplamento ou ganho de clareza.
- [x] Preservar recuperação, isolamento, inventário e valores exatos.

Os novos casos cobrem cotação por rede sem itens, conflitos e idempotência no merge visitante, quantidades inválidas, conflito entre preço/estoque e pedido, rollback de reserva após uma reserva concorrente, liberação de edições e remoção apenas da quantidade capturada no pedido. O estado privado do carrinho também fica inacessível após expiração e retorna ao usuário correto após novo login. Nesta leva, assertions adicionais protegem a carteira primária ao criar/alterar uma secundária, vinculam a conexão de carteira à sessão ativa e preservam itens acrescentados ao carrinho depois da criação do pedido. Branch coverage Vitest atual: `account-store.ts` 87,50%, `cart-store.ts` 89,65%, `order-store.ts` 89,43% e `catalog-store.ts` 88,89%.

### Fase 4 — Hooks e componentes com comportamento próprio (concluída)

- [x] Revisar `useCheckoutSubmission`, `useCheckoutAttempt` e `useCouponApplication`, os hooks de maior risco de decisão e recuperação.
- [x] Conferir as jornadas Playwright existentes: repetição de cliques, timeout antes/depois da criação, recuperação após refresh, cotação obsoleta, estoque esgotado, expiração de sessão, recusa de conexão, cupom inválido/expirado e recuperação do pagamento.
- [x] Avaliar Testing Library e ambiente DOM; não adicionar dependências nem uma segunda camada de testes dos mesmos contratos, pois o resultado observável já é verificado no browser e as invariantes de domínio têm cobertura Vitest isolada.
- [x] Evitar snapshots de markup, wrappers triviais e testes duplicados para score.

### Fase 5 — Gates e manutenção (concluída)

- [x] Adicionar um gate de branches Vitest de 80% somente aos quatro módulos de estado críticos, sem criar um threshold global por camada: `order-store.ts`, `cart-store.ts`, `catalog-store.ts` e `account-store.ts`.
- [x] Manter coverage Playwright como diagnóstico; a aprovação E2E continua baseada nas assertions e jornadas requeridas, não num percentual isolado.
- [x] Atualizar esta página e [RESULTS.md](./RESULTS.md) com a execução observada, contagens, denominadores e artefatos JSON/HTML.

O gate por módulo está em `vitest.config.ts`; `npm run test:coverage:vitest` executou **186 testes em 15 arquivos** e passou pelos quatro limites de branches. O mapa Vitest global continua diagnóstico, enquanto o mapa combinado mantém o gate de 80% nos quatro indicadores.

### Fase 6 — Testes unitários completos de schemas Zod (concluída)

- [x] Inventariar arquivos `*schema*`, imports de bibliotecas de validação e declarações Zod no projeto: Zod é a única biblioteca declarativa de validação listada em `package.json`, e os únicos módulos de schema em `src/` são `auth/schemas.ts` e `checkout/schemas.ts`.
- [x] Testar diretamente todos os schemas exportados de auth e checkout, incluindo entradas válidas/inválidas, normalização, limites, formatos de endereço, ENS e enums.
- [x] Confirmar no mapa Vitest-only que ambos os arquivos alcançam 100% de linhas, statements, funções e branches; nenhum resultado é inferido da cobertura Playwright.
- [x] Cobrir isoladamente o contrato condicional de `getSession`: sessão válida, HTTP 401 como ausência de sessão e propagação de erros não-401.

Evidência: a busca de arquivos `*schema*` no projeto encontrou somente esses dois módulos de produção e seus testes; a inspeção dos imports de validação não encontrou outra biblioteca declarativa. `tests/unit/auth/schemas.test.ts` contém 19 casos, `tests/unit/checkout/schemas.test.ts` 17, e `tests/unit/auth/auth-api.test.ts` 4. A cobertura total Vitest continua sendo um diagnóstico de toda a aplicação, não uma meta percentual genérica para a camada; a cobertura integral aplica-se especificamente aos dois módulos de schemas inventariados.

## Fase 7 — Contratos HTTP, stores e decisões finais (concluída)

### Contratos HTTP diretos

`tests/integration/mocks/http-contracts.test.ts` adiciona **23 testes com `fetch` e MSW** para auth, conta, favoritos, carrinho e pedidos, complementando os 12 casos existentes de catálogo em `catalog-http.test.ts`. Os novos testes verificam status, payload de erro, autenticação, validação de requisição e efeitos persistidos; não repetem jornadas Playwright. Incluem sessão 401, conflitos de cadastro/perfil/carteira, falhas de provedor social, avatar inválido, favorito ausente, merge de carrinho, limites de quantidade e recursos de pedido/conexão ausentes. Os handlers MSW usam caminhos relativos; o teste fornece um `location` Node equivalente ao origin do browser para manter a correspondência real das rotas e conservar `onUnhandledRequest: 'error'`.

| Handler             | Statements combinados | Branches combinados | Resultado da revisão                                                                                |
| ------------------- | --------------------: | ------------------: | --------------------------------------------------------------------------------------------------- |
| `auth-http.ts`      |                92,85% |              85,18% | Contratos de sessão, login/cadastro, validação e provedores exercitados diretamente.                |
| `account-http.ts`   |                75,78% |              62,82% | Restam ramos de resposta; os contratos críticos de autorização, conflito e carteira têm assertions. |
| `favorites-http.ts` |                82,14% |              75,00% | Os ramos de não autenticado, NFT ausente e erro de serviço têm assertions diretas.                  |
| `cart-http.ts`      |               100,00% |              88,88% | Merge inválido/não autenticado, limites e itens ausentes verificados.                               |
| `order-http.ts`     |                92,94% |              84,72% | Autenticação, conexão e recurso/transição ausentes verificados; jornadas permanecem no Playwright.  |

Percentuais são apenas execução. Não criar casos adicionais só para elevar os dois arquivos ainda abaixo de 80% em branches: contratos HTTP e UI relevantes têm assertions, enquanto branches residuais devem ser avaliados pelo comportamento que protegem.

### Auditoria dirigida das stores

| Store              | Branches Vitest-only | Não executados | Evidência adicional nesta fase                                                                               |
| ------------------ | -------------------: | -------------: | ------------------------------------------------------------------------------------------------------------ |
| `account-store.ts` |       63/72 (87,50%) |              9 | Carteira secundária preserva a carteira primária ao criar e atualizar.                                       |
| `cart-store.ts`    |     104/116 (89,65%) |             12 | Itens preservados após checkout cobertos junto ao ciclo de pedido.                                           |
| `order-store.ts`   |     127/142 (89,43%) |             15 | Conexão vinculada à sessão atual; desconexão com ID antigo não remove conexão ativa.                         |
| `catalog-store.ts` |       24/27 (88,89%) |              3 | Estoque e liberação já cobertos por invariantes de reserva, sem necessidade de perseguir os ramos restantes. |

Os casos estão em `auth/account-state.test.ts`, `auth/session.test.ts` e `order/order-state.test.ts`. O teste de pedido confirma que a transição terminal remove apenas itens capturados no pedido e mantém itens que entraram no carrinho posteriormente. Branches remanescentes foram tratados como candidatos à inspeção, não como casos obrigatórios; não foram alteradas regras de produção nem gates.

### Prerender/SSR

Decisão: **não adicionar uma segunda suite direta de SSR nesta fase**. `npm run build` executa a geração e validação dos 63 documentos prerenderizados; `npm run test:preview` verifica home e detalhe, navegação/refresh, query de rede, proteção de perfil, rota inexistente, hidratação atrasada, checkout e compra via MSW em desktop/mobile, além dos recursos públicos. Essa evidência atravessa o HTML e a hidratação que importam ao usuário. `entry-server.tsx` permanece com 0% de execução instrumentada, mas isso não é ausência de teste funcional; uma suite Node/Vite só se justifica se surgir uma regra de prerender que não seja observável nas validações existentes.

### Sensibilidade a mutações

Piloto manual: inverti temporariamente a condição de promoção de carteira primária e executei somente o teste de carteira secundária; a assertion falhou ao observar a carteira existente como `secondary`. Restaurei a condição imediatamente e a suite completa passou. O resultado demonstra valor para assertions de invariantes críticas, mas não justifica instalar agora um mutation runner nem adicionar threshold global: `package.json` não contém ferramenta, e o escopo ainda não tem baseline estável. Reconsiderar um piloto automatizado se uma revisão futura encontrar assertions críticas cuja sensibilidade não possa ser avaliada manualmente.

## Lacunas restantes — snapshot verificável

Os mapas JSON versão atual incluem **161 arquivos fonte**. O combinado tem 22 arquivos abaixo de 80% em statements e 26 abaixo de 80% em branches. No Vitest-only, 129 arquivos têm zero statements executados; isso inclui UI, rotas, hooks e código exercitado no browser, e não é uma lista de 129 testes unitários faltantes.

Arquivos abaixo de 80% em statements combinados:

`entry-server.tsx`, `components/layout/site-header.tsx`, `features/auth/api/account.ts`, `features/auth/components/{account-shell,password-input,profile-forms}.tsx`, `features/auth/hooks/{use-account,use-session}.ts`, `features/cart/hooks/{use-cart-page-controller,use-cart}.ts`, `features/catalog/components/catalog-filters.tsx`, `features/checkout/constants.ts`, `features/checkout/hooks/use-checkout-controller.ts`, `features/favorites/api/favorites.ts`, `features/favorites/components/favorite-button.tsx`, `features/home/components/mobile-bottom-nav.tsx`, `features/order/components/order-page-states.tsx`, `mocks/server.ts`, `mocks/handlers/account-http.ts` e `routes/{favorites-page,profile-page,wallets-page}.tsx`.

Arquivos abaixo de 80% em branches combinados:

`entry-server.tsx`, `components/ui/{pagination,sheet,slider}.tsx`, `features/auth/components/{auth-flow-provider,profile-forms}.tsx`, `features/auth/hooks/use-account.ts`, `features/cart/{query-keys.ts,api/cart.ts,hooks/{use-cart-page-controller,use-cart,use-coupon-application}.ts}`, `features/catalog/components/{catalog-filters,price-filter}.tsx`, `features/catalog/hooks/use-catalog-search.ts`, `features/checkout/components/checkout-wallet-picker.tsx`, `features/checkout/hooks/use-checkout-submission.ts`, `features/favorites/components/{favorite-button,favorites-content}.tsx`, `features/favorites/hooks/use-favorites.ts`, `features/order/components/order-page-states.tsx`, `features/order/hooks/use-order-page-controller.ts`, `mocks/handlers/{account-http,favorites-http}.ts` e `routes/{favorites-page,home-page}.tsx`.

Os fluxos de interface desses componentes continuam atribuídos ao Playwright; não criar Vitest DOM para duplicar login, perfil, favoritos, carrinho, cupons ou checkout. Schemas Zod, regras puras, erros API e stores já têm testes na camada apropriada. Os relatórios por arquivo em [`coverage/current/`](./coverage/current/), [`coverage/vitest-only/`](./coverage/vitest-only/) e [`coverage/playwright-only/`](./coverage/playwright-only/) são a fonte para reavaliar o snapshot.

## Critérios de parada

- Uma fase só é concluída quando seus testes direcionados passam e a cobertura combinada é atualizada se o mapa de execução mudou.
- Não aumentar thresholds, excluir arquivos ou atualizar snapshots sem justificativa baseada em requisitos e evidência.
- `test:coverage:refresh-vitest` reusa o último mapa Playwright; se código-fonte, dependências, testes/configuração E2E ou mocks mudarem, o caminho reproduzível volta a ser `npm run test:coverage`.
- A visão por arquivo e os mapas completos estão em [`coverage/current/`](./coverage/current/), [`coverage/vitest-only/`](./coverage/vitest-only/) e [`coverage/playwright-only/`](./coverage/playwright-only/) depois da Fase 1.
- Os frames em [Referências Figma](../references/figma/README.md) continuam sendo fonte visual necessária; não são resultado de teste nem substituem snapshots/testes Playwright.
