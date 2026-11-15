# Resultados e evidências de entrega

Validação local dos requisitos do [teste técnico](../../TECHNICAL-CHALLENGE.md). O [README](../../README.md) contém o setup, e a [arquitetura](../../ARCHITECTURE.md) explica os contratos, o cache e as decisões da solução.

## Resultado da validação

### Regras e integração local — Vitest

`npm run test:coverage:refresh-vitest`: **186 testes Vitest aprovados em 15 arquivos**; o JUnit consolidado está em [vitest-results.xml](./vitest-results.xml). `npm run typecheck:tests` também foi aprovado. O gate focado de pelo menos 80% de branches foi aprovado nos quatro módulos de estado críticos.

| Projeto / domínio                | Casos | Evidência                                                                                                                 |
| -------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------- |
| Unit / ETH e BigInt              |    13 | Um wei, 18 casas, soma exata, valores grandes e rejeição de formatos inválidos.                                           |
| Unit / catálogo                  |     6 | Ordenação, desempate, catálogo vazio e preservação da entrada.                                                            |
| Unit / URL                       |    22 | Normalização e limites de cupom; redes permitidas e parâmetros inválidos.                                                 |
| Unit / erros de API              |     5 | Formato inválido, códigos/mensagens/campos, alias permitido e fallback de formulário.                                     |
| Unit / schemas de auth           |    19 | Todos os schemas exportados: login/cadastro, recuperação, perfil, alteração de senha e carteiras; limites e branches.     |
| Unit / schemas checkout          |    17 | Todos os campos do schema: normalização, limites, formatos de carteira, ENS, notas e enums.                               |
| Unit / sessão API                |     4 | `getSession`: sucesso, 401 como sessão ausente e propagação de erros não-401.                                             |
| Integration / carrinho           |    24 | Limites, totais por rede, merge com conflitos, reprecificação e propriedade dos dados.                                    |
| Integration / pedidos            |    26 | Replay, 10 campos inválidos, carteira alterada, cotação/estoque, rollback de reserva, quantidade comprada e recibo final. |
| Integration / cache              |     4 | Duplicatas, eventos antigos, variantes de filtros e isolamento por sessão.                                                |
| Integration / sessão             |     5 | Expiração, bloqueio de recursos privados, isolamento de dados e conexão de carteira vinculada à sessão ativa.             |
| Integration / conta              |     5 | Conflitos e sincronização de perfil, troca de senha, unicidade e prioridade de carteiras, mutações sem sessão.            |
| Integration / inventário         |     1 | Reserva de quantidade disponível, rejeição de estoque insuficiente e liberação sem underflow.                             |
| Integration / MSW catálogo HTTP  |    12 | Filtros, paginação, preço exato, erros, cenários determinísticos e recuperação.                                           |
| Integration / MSW contratos HTTP |    23 | Auth, conta, favoritos, carrinho e pedidos: status, payloads, autorização e efeitos persistidos.                          |

Os testes importam código real. Apenas as dependências externas necessárias são adaptadas: armazenamento em memória e interceptação HTTP por MSW. O relógio é restaurado após simular expiração. Essa camada não substitui navegação, screenshots, Socket.IO e acessibilidade no navegador. Comandos parciais não sobrescrevem o JUnit consolidado; instruções de execução estão no [README](../../README.md#comandos).

### Coverage de código — combinada

`npm run test:coverage` combina os dois projetos Vitest com a matriz Playwright. A última execução Playwright completa descobriu **345 casos: 234 aprovados, 111 ignorados por viewport e zero falhas**, em 14,7 minutos com dois workers. O fixture captura V8 por CDP nos testes executados e remapeia os módulos Vite aos fontes TypeScript. O provider Vitest é V8 `@vitest/coverage-v8@4.1.12`.

O escopo inclui todos os arquivos `src/**/*.{ts,tsx}` — **161 arquivos** — e exclui somente declarações `*.d.ts`. Não foram excluídos componentes, hooks, rotas ou arquivos sem testes. A meta exige pelo menos 80% em cada indicador do mapa combinado. Os relatórios nativos versionados são: [Vitest-only](./coverage/vitest-only/index.html), [Playwright-only](./coverage/playwright-only/index.html) e [combinado](./coverage/current/index.html), com seus JSON detalhados e resumos em cada pasta. Os dados V8 temporários em `reports/coverage/` são ignorados pelo Git.

| Camada                    | Linhas               | Branches             | Funções          | Statements           |
| ------------------------- | -------------------- | -------------------- | ---------------- | -------------------- |
| Vitest unit + integration | 900/2.673 (33,67%)   | 629/2.162 (29,09%)   | 230/878 (26,19%) | 1.031/2.984 (34,55%) |
| Playwright browser        | 2.366/2.769 (85,44%) | 1.628/2.210 (73,66%) | 723/894 (80,87%) | 2.582/3.090 (83,55%) |
| Combinada (gate 80%)      | 2.527/2.769 (91,26%) | 1.897/2.210 (85,83%) | 758/894 (84,78%) | 2.803/3.179 (88,17%) |

O mapa combinado atualizado foi produzido por `npm run test:coverage:refresh-vitest`: ele reexecutou os 186 testes Vitest e reagrupou o mapa Playwright-only da execução completa acima. Nesta atualização mudaram somente testes de integração e documentação; `src/`, dependências, specs/configuração Playwright, configuração Vite e mocks permaneceram iguais, portanto o mapa de browser continua aplicável. O refresh **não executa Playwright**. Se qualquer input E2E mudar, rode `npm run test:coverage` antes de declarar cobertura combinada atual. Os denominadores diferem entre camadas; não somar percentuais. O gate combinado passa nos quatro indicadores, com menor margem em branches (85,83%). O gate Vitest de branches por módulo também passou: `account-store.ts` 87,50%, `cart-store.ts` 89,65%, `order-store.ts` 89,43% e `catalog-store.ts` 88,89%. Os dois arquivos de schemas Zod (`auth/schemas.ts` e `checkout/schemas.ts`) têm 100% de linhas, statements, funções e branches no mapa Vitest-only. O agregado não garante cobertura mínima por arquivo: `src/entry-server.tsx`, por exemplo, permanece sem execução instrumentada. Consulte os HTML e JSON por arquivo; 80% não comprova qualidade das assertions nem conformidade funcional.

### Evidências de navegador e build preservadas

| Verificação                      | Comando / escopo                                                                                        | Resultado                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos e build                    | `npm run build` (inclui `tsc -b`)                                                                       | Aprovado; 63 documentos pré-renderizados na build de validação. Build adicional com `VITE_ENABLE_MOCKS=false`: 8 rotas pré-renderizadas e snapshot de release verificado.                                                                                                                                                                       |
| Formatação e lint                | `npm run lint:check`                                                                                    | Aprovados                                                                                                                                                                                                                                                                                                                                       |
| Matriz Playwright anterior       | `npm run test:e2e`                                                                                      | **336 casos: 225 aprovados, 111 ignorados, 0 falhas e 0 flaky**                                                                                                                                                                                                                                                                                 |
| Playwright na coverage combinada | `npm run test:coverage`                                                                                 | **345 casos: 234 aprovados, 111 ignorados, 0 falhas**; [relatório de execução](./playwright/coverage-run.html)                                                                                                                                                                                                                                  |
| Regressão visual                 | Incluída na suíte completa                                                                              | Aprovada; nenhuma baseline alterada nesta correção de tempo real                                                                                                                                                                                                                                                                                |
| Repetição da regressão Socket.IO | `npx playwright test tests/nft-detail.spec.ts --grep "Socket.IO" --repeat-each=5`                       | 30 execuções aprovadas nos três viewports                                                                                                                                                                                                                                                                                                       |
| Instalação limpa anterior        | Cópia isolada sem `node_modules`, `.env` a partir do exemplo, `npm ci`, build e lint                    | Aprovada antes da adição da instrumentação combinada; repetir para validar este lockfile                                                                                                                                                                                                                                                        |
| Preview de produção              | `npm run test:preview` após build                                                                       | Aprovado: rotas, refresh, filtros, carrinho, perfil protegido, 404, login com bootstrap atrasado, cache privado vazio e arquivos públicos                                                                                                                                                                                                       |
| Regressão visual em produção     | `npx playwright test tests/visual.spec.ts tests/account-visual.spec.ts --reporter=list --repeat-each=3` | 36 aprovados, 18 ignorados por viewport e 0 falhas                                                                                                                                                                                                                                                                                              |
| Lighthouse                       | Matriz local: início/detalhe, desktop/mobile, três medições por alvo                                    | Performance mediana: início desktop 100, início mobile 94, detalhe desktop 100 e detalhe mobile 90. Acessibilidade 100, boas práticas 96 e SEO 100 em todos os alvos; as metas por mediana foram atingidas. Detalhe mobile variou de 83 a 92, com TBT de 498 ms na execução mais baixa. [Relatórios e condições](../performance/LIGHTHOUSE.md). |
| Deploy                           | Vercel production: [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app)         | Ativo; hash-fonte `f16455c7fc1eabdb9c34549491694598f1af5576e8651390f9d455744caa7964` conferido e `test:preview` remoto aprovado. A comparação byte a byte dos assets não passou: o build remoto usa Node 26 e o local Node 20; equivalência dos bundles permanece não comprovada.                                                               |

## Evidência complementar dos requisitos centrais

O [relatório do recorte de checkout](./playwright/core.html) registra **17 aprovados, 1 ignorado e 0 falhas**, em 18 casos selecionados para desktop/mobile. O caso ignorado é o timeout anterior à criação, que continua exclusivo do desktop. Esse recorte é evidência independente e sobreposta à matriz completa; não some os totais.

| Requisito central                      | Prova observada                                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Impedir compra duplicada               | Dois eventos de clique no mesmo ciclo produzem exatamente um `POST /api/orders` e um pedido persistido, em desktop/mobile.                                                              |
| Recuperar timeout por idempotência     | Reenvio recupera a tentativa existente; reutilizar a chave com payload diferente continua sendo conflito. Falha antes da criação permite nova tentativa sem perder o carrinho.          |
| Isolar dados entre usuários            | Após compra, logout e login por outra conta, a consulta do pedido atravessa MSW e responde `404 ORDER_NOT_FOUND`; a interface não exibe recibo nem link da transação da primeira conta. |
| Recuperar pedidos pendentes            | Refresh, eventos antigos/duplicados e desconexão/reconexão são exercitados também no mobile, com confirmação recuperada pela interface.                                                 |
| Preservar estados terminais            | Pedidos confirmados e recusados mantêm estado, versão e snapshot após uma transição conflitante; a UI permanece correta após refresh. A recusa mantém o item no carrinho.               |
| Recuperar falhas de pagamento/carteira | Recusa de conexão e pagamento são exercitados sem perda indevida do carrinho.                                                                                                           |

Para reproduzir o conjunto:

```bash
npm run test:core
```

A ampliação revelou e corrigiu uma concorrência no checkout mobile: callbacks do mesmo ciclo podiam gerar chaves diferentes antes de o estado React atualizar. A submissão agora bloqueia concorrência de forma síncrona e consulta a chave persistida antes de criar outra; falhas recuperáveis liberam nova tentativa, enquanto sucesso/recuperação mantém o bloqueio até a navegação.

A build passou e as comparações de checkout/recibo foram executadas novamente em preview de produção: **2 aprovadas, 0 falhas**, sem alterar baselines. Comando: `npx playwright test tests/visual.spec.ts --project=chromium-desktop --project=chromium-mobile --grep "checkout and confirmed receipt" --reporter=list`, com o preview da build na porta 4173.

Esta extensão não repetiu a auditoria Lighthouse: as métricas preservadas continuam sendo as medições dos alvos públicos de início/detalhe indicadas no documento específico.

Ambiente funcional: Windows, Node.js 20.20.2 e Playwright 1.65.0. A execução completa usou Chromium gerenciado pelo Playwright, dois workers e nenhum retry. A configuração permite um retry em CI. Desktop: 1440 × 900; tablet: 768 × 1024; mobile: 390 × 844.

Os 111 casos ignorados são condicionados ao viewport: por exemplo, um teste exclusivo de mobile não é executado no desktop. Eles não são contabilizados como testes aprovados. A suíte principal inicia o servidor de desenvolvimento com MSW; a verificação adicional de preview usou a build otimizada de uma instalação isolada.

## Relatórios Playwright

O [HTML da matriz completa anterior](./playwright/index.html) e o [HTML da execução usada na coverage combinada](./playwright/coverage-run.html) contêm resultados individuais e duração. Não houve falhas nas execuções preservadas, portanto não foram gerados anexos de falha ou traces. A configuração mantém `trace: retain-on-failure` e `screenshot: only-on-failure` para novas falhas.

Abra `docs/quality/playwright/index.html` no navegador ou sirva o relatório localmente:

```bash
npx playwright show-report docs/quality/playwright
```

Para executar novamente e abrir o relatório gerado:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:report
```

A nova execução substitui `playwright-report/` e `test-results/`, ignorados pelo Git. A cópia entregue em `docs/quality/playwright/` não é atualizada automaticamente: confira os totais antes de substituí-la. Se uma execução tiver anexos, preserve também as pastas de dados e traces usadas pelo HTML.

### O que foi corrigido

Uma resposta REST inicial podia terminar depois de `nft.updated`, restaurando um preço antigo ou perdendo o evento quando ainda não havia dados em cache. O sincronizador agora preserva o evento mais recente por NFT e o reaplica depois da resposta, sem aceitar versões antigas/duplicadas. O teste com snapshot REST atrasado reproduziu a falha antes da correção e passou depois dela.

O detalhe do backend simulado também passou a respeitar `available` do NFT, além do estoque por edição. Um teste confirma a indisponibilidade tanto na interface quanto na resposta REST. Os dois casos fazem parte da suíte completa.

O preço do detalhe usa uma região `aria-live` para anunciar mudanças. A build prioriza a pintura do HTML antes da hidratação e faz preload da fonte local; miniaturas ocultas no mobile não são baixadas antecipadamente. A matriz Lighthouse mede esses ajustes na build final, com todas as funcionalidades e mocks habilitados.

Controles do HTML estático ficam bloqueados com `inert` até o commit React, acompanhados de um status acessível. Isso resolve o clique perdido no login antes da hidratação. `npm run test:preview` reproduz o carregamento atrasado do módulo e confirma o login real via API nos dois viewports; execute depois de `npm run build`, com a porta `4176` livre.

### Cobertura das 12 jornadas

| Jornada exigida                                          | Arquivos                                                                                                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Busca, filtros, ordenação, paginação e histórico      | [catalog.spec.ts](../../tests/catalog.spec.ts)                                                                                                                                                 |
| 2. Acesso direto e NFT inexistente                       | [nft-detail.spec.ts](../../tests/nft-detail.spec.ts)                                                                                                                                           |
| 3. Cadastro, login, expiração, logout e troca de usuário | [account.spec.ts](../../tests/account.spec.ts), [checkout.spec.ts](../../tests/checkout.spec.ts), [cart.spec.ts](../../tests/cart.spec.ts)                                                     |
| 4. Favoritos, falha e rollback                           | [favorites.spec.ts](../../tests/favorites.spec.ts)                                                                                                                                             |
| 5. Carrinho, cupom e persistência após refresh/login     | [cart.spec.ts](../../tests/cart.spec.ts)                                                                                                                                                       |
| 6. Compra até o recibo                                   | [checkout.spec.ts](../../tests/checkout.spec.ts), [visual.spec.ts](../../tests/visual.spec.ts)                                                                                                 |
| 7. Recusa, cliques repetidos e timeout idempotente       | [checkout.spec.ts](../../tests/checkout.spec.ts)                                                                                                                                               |
| 8. Perfil, avatar, senha e carteiras                     | [account.spec.ts](../../tests/account.spec.ts)                                                                                                                                                 |
| 9. Preço e disponibilidade via Socket.IO                 | [cart.spec.ts](../../tests/cart.spec.ts), [checkout.spec.ts](../../tests/checkout.spec.ts), [nft-detail.spec.ts](../../tests/nft-detail.spec.ts)                                               |
| 10. Eventos antigos/duplicados e reconexão               | [checkout.spec.ts](../../tests/checkout.spec.ts), [nft-detail.spec.ts](../../tests/nft-detail.spec.ts)                                                                                         |
| 11. Teclado, foco e validação de formulários             | [account.spec.ts](../../tests/account.spec.ts), [catalog.spec.ts](../../tests/catalog.spec.ts), [cart.spec.ts](../../tests/cart.spec.ts), [nft-detail.spec.ts](../../tests/nft-detail.spec.ts) |
| 12. Skeletons, falhas e recuperação                      | [catalog.spec.ts](../../tests/catalog.spec.ts), [nft-detail.spec.ts](../../tests/nft-detail.spec.ts), [cart.spec.ts](../../tests/cart.spec.ts)                                                 |

As consultas e mutations passam por Axios/MSW. Os eventos passam por `socket.io-client` e pelo binding MSW; os testes não simulam o sucesso chamando diretamente o cache da interface.

### Por que existem duas pastas de snapshots

- `tests/visual.spec.ts-snapshots/`: home, detalhe, carrinho, checkout e recibo.
- `tests/account-visual.spec.ts-snapshots/`: login, cadastro, perfil e carteiras.

Cada pasta pertence ao arquivo de testes de mesmo nome; não são duplicatas. `npm run test:visual` executa as duas suítes. A comparação admite até 50 pixels diferentes por imagem, em valor absoluto. Animações e caret são ocultados; dados variáveis do recibo são mascarados.

O Playwright compara a interface com essas baselines, não com o Figma. As [referências e os desvios documentados](../references/figma/README.md) complementam a revisão; aprovar screenshots não certifica fidelidade integral ao layout. Atualize uma baseline somente após inspecionar a diferença e o frame correspondente.

## Auditoria de dependências

A verificação adicional `npm audit --omit=dev` não apontou vulnerabilidades nas dependências de produção. `npm audit` completo apontou 41 alertas em ferramentas de desenvolvimento (31 moderados e 10 altos), incluindo dependências transitivas do Lighthouse. Esses alertas não foram tratados com `--force` ou overrides incompatíveis. A versão mais recente do Lighthouse exige Node.js ≥22.19, enquanto a validação desta entrega usa Node.js 20.20.2. Isso permanece uma limitação da cadeia de ferramentas, sem declaração de ausência total de vulnerabilidades.

**Limite temporal:** essa auditoria de dependências foi executada antes das alterações mais recentes no lockfile para Vitest e instrumentação de coverage. Portanto, os números acima não representam uma auditoria do lockfile atual; reexecute `npm audit` antes de uma decisão de entrega.

## Escopo da conclusão

Os fluxos locais exigidos possuem cobertura e a suíte completa passou. As métricas de performance e sua conformidade são avaliadas separadamente em [LIGHTHOUSE.md](../performance/LIGHTHOUSE.md).

A publicação está ativa e os fluxos públicos de desktop/mobile, deep links, refresh e compra simulada passaram. A equivalência byte a byte dos assets ainda requer alinhar o ambiente de build. A matriz Lighthouse mais recente atingiu a meta por mediana: Performance mobile de 94 no início e 90 no detalhe, e 100 no desktop. O detalhe mobile variou de 83 a 92 entre as execuções, com TBT elevado no resultado mais baixo; a variabilidade deve ser acompanhada. Acessibilidade (100), boas práticas (96) e SEO (100) atingiram as metas em todos os alvos. A conformidade visual integral e a experiência em aparelhos reais continuam sujeitas à revisão humana.
