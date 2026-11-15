# Guia de implementação — Kurio

Leia este arquivo antes de alterar o projeto. Ele descreve os padrões usados no código atual; contratos completos e decisões estão na arquitetura. Preserve alterações locais e valide o comportamento executado, sem presumir que o workspace ou os relatórios estejam atualizados.

## Fontes de verdade

1. [TECHNICAL-CHALLENGE.md](./TECHNICAL-CHALLENGE.md): requisitos e critérios de avaliação. Não alterar o enunciado para acomodar a implementação.
2. [README.md](./README.md): instalação, ambiente, contas simuladas, cenários e comandos.
3. [ARCHITECTURE.md](./ARCHITECTURE.md): contratos, responsabilidades, cache, sessão e limitações.
4. [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md): checklist de correspondência com o enunciado.
5. [Referências Figma](./docs/references/figma/README.md): frames, assets e desvios visuais documentados.
6. [RESULTS.md](./docs/quality/RESULTS.md), [AUDIT.md](./docs/quality/AUDIT.md), [TESTING-ROADMAP.md](./docs/quality/TESTING-ROADMAP.md) e [LIGHTHOUSE.md](./docs/performance/LIGHTHOUSE.md): resultados, reprodução, plano dos testes e limites.

Confira as fontes relacionadas à mudança e o código correspondente. Uma checklist marcada ou um teste existente não prova que a execução atual passou.

Documente afirmações arquiteturais com a implementação e a evidência reproduzível correspondente: teste, comando de build/preview, artefato observado ou requisito de origem. Separe comportamento implementado de requisito, decisão, hipótese e limitação; não apresente uma intenção como comportamento verificado. Quando a evidência for parcial ou inexistente, declare isso e indique como validar.

Para retomar o trabalho em outra sessão, consulte o [roadmap](./IMPLEMENTATION-ROADMAP.md), os [resultados](./docs/quality/RESULTS.md) e a [auditoria](./docs/quality/AUDIT.md). Eles são as fontes canônicas para pendências, verificações e evidências; não há um handoff operacional separado.

## Estrutura vigente

```text
src/
  main.tsx                    # bootstrap do navegador, MSW e hidratação
  entry-server.tsx            # pré-renderização e cache público serializado
  router.tsx                  # rotas, lazy loading, busca validada
  router-search.ts            # parsers compartilhados de search
  index.css                   # fontes, tokens, reset, a11y e animações globais
  assets/                     # WebP originais, variantes geradas e índice tipado
  components/
    ui/                       # primitivas shadcn/ui adaptadas
    layout/                   # RootLayout, shells, header e footer
    media/                    # NftImage responsiva
  features/
    auth/                     # autenticação, perfil, senha, avatar e carteiras
    catalog/                  # busca, filtros, lista, cards e eventos de NFT
    nft-detail/               # galeria, edições, quantidade e compra
    cart/                     # itens, proprietário, cupom, cotação e merge
    favorites/                # favoritos privados e intenção após login
    checkout/                 # formulário, carteira, revisão e criação de pedido
    order/                    # consulta, reconciliação, estados e recibo
    home/                     # hero, navegação mobile e conteúdo editorial
  hooks/                      # hooks transversais, como useMediaQuery
  lib/                        # Axios, QueryClient, readiness e utilitários
  types/                      # contratos compartilhados entre domínios
  mocks/
    browser.ts                # setupWorker para desenvolvimento e demonstração
    server.ts                 # setupServer com handlers públicos usados no build
    api-url.ts                # URLs dos handlers no navegador/Node
    fixtures/                 # catálogo e contas determinísticos
    handlers/                 # HTTP, Socket.IO e erros de transporte
    state/                    # estado canônico simulado e persistência
scripts/                      # assets, pré-renderização, preview e Lighthouse
tests/
  *.spec.ts                   # Playwright E2E e regressão visual
  helpers/                    # helpers de navegador/rede do Playwright
  unit/                       # Vitest: regras isoladas por domínio
  integration/                # Vitest: estado, cache e handlers MSW por domínio
  support/                    # fixtures tipadas e isolamento dos testes Vitest
docs/quality/                 # resultado consolidado e relatório Playwright
docs/performance/             # análise e matriz Lighthouse exigida
public/                       # worker MSW, favicon e robots.txt
```

Cada feature usa apenas as pastas necessárias: `api`, `hooks`, `components`, `utils`, tipos, schemas e constantes locais. Não crie camadas vazias ou uma estrutura paralela de serviços/repositórios sem necessidade demonstrada.

## Dependências e responsabilidades

- Rotas validam parâmetros, selecionam estados e compõem a tela. Features não importam `src/routes`.
- `components/ui` contém wrappers de primitivas; `layout` e `media` atendem usos compartilhados. Componentes de domínio permanecem na feature.
- `lib` reúne infraestrutura transversal e não importa features. Contratos usados por mais de um domínio ficam em `src/types`; tipos locais permanecem na feature.
- A UI não importa fixtures nem estado de mocks. Dados remotos passam por Axios/MSW; eventos passam por `socket.io-client` e pelo binding MSW.
- Clientes em `api` cuidam do transporte e contratos tipados. Hooks de Query cuidam de cache e mutations; controllers compõem o fluxo da página.
- `useCartPageController` orquestra carrinho; `useOrderPageController` expõe estados discriminados de pedido; `useAuthReturnNavigation` centraliza os destinos internos permitidos.
- No checkout, `useCheckoutController` compõe `useCheckoutForm`, `useCheckoutAttempt`, `useCheckoutSubmission` e cupom. Não concentre essas responsabilidades novamente na rota ou em um único hook.
- Componentes de checkout recebem modelos e ações tipados em `features/checkout/types.ts`. Formulário, pagamento e estado da tentativa continuam blocos distintos.

## React, TypeScript e formulários

- Use TypeScript estrito, imports pelo alias `@/` e `import type` para dependências apenas de tipagem.
- Siga os exports nomeados e arrow functions usados nos componentes/hooks. Prefira inferência local; crie tipos nomeados para contratos entre camadas.
- Use uniões discriminadas para estados incompatíveis de página/operação. Evite múltiplos booleanos que permitam combinações impossíveis.
- React Hook Form + Zod validam formulários de domínio. Schemas, constantes e type guards pertencem à feature; o handler MSW repete a validação no limite da API.
- Associe erros REST aos campos permitidos com os helpers de `auth/utils`; erros de operação precisam de feedback e recuperação coerentes.
- Leia `formState.isValid` no controller antes de montar o painel de pagamento lazy. O modelo transmite essa validade ao componente, mantendo a assinatura do formulário ativa.
- Extraia blocos coesos e reutilizáveis. Não mova uma página inteira para outro arquivo só para reduzir seu tamanho.
- Use `map` para coleções homogêneas. Preserve marcação explícita para campos/blocos diferentes quando isso melhora labels, ordem e leitura.
- Documente utilitários exportados quando unidade, efeitos, erros ou contrato não forem óbvios; não comente operações triviais.

## Router, API e cache

- Busca, filtros, ordenação e paginação pertencem à URL validada pelo TanStack Router. Mudança de filtro reinicia a página; refresh e histórico preservam a seleção.
- Reutilize `router-search.ts` para cupom/rede e os destinos validados de autenticação. Não aceite redirects externos arbitrários.
- Axios é o cliente REST. `http-client.ts` aguarda `api-readiness.ts` e rejeita HTML recebido no lugar da API. Não acrescente respostas fictícias nem atalhos de sucesso no cliente.
- Queries canceláveis recebem `AbortSignal`. Chaves devem conter os parâmetros e a identidade relevantes; não compartilhar dados privados entre usuários.
- `nftCatalogQueryOptions` e `nftDetailQueryOptions` compartilham o contrato entre navegador e build. Não reintroduza dados iniciais importados de fixtures nos hooks.
- O QueryClient padrão usa stale de 30 segundos, um retry de query, nenhum retry de mutation e nenhum refetch ao focar a janela. Exceções de sessão, carrinho/cotação e pedido estão nos hooks e na arquitetura.
- Queries privadas recebem `meta.private`. Sessão identifica perfil/favoritos/pedidos; carrinho e cotação são isolados pelo proprietário. Cancele leituras relevantes e remova caches privados na troca/logout.
- Favoritos e quantidade usam atualização otimista com snapshot/rollback. Um erro não pode deixar sucesso fictício no cache.

## Carrinho, checkout e pedidos

- Item é NFT + edição. Quantidade é inteira, limitada pelo estoque e `maxPerOrder`.
- ETH é string decimal; cálculos usam wei inteiro (`BigInt`) e os utilitários existentes. A cotação da API define subtotal, desconto, taxa e total.
- Visitante e contas possuem carrinhos separados. Após login, `/cart/merge` revalida os itens e impede aplicação duplicada; o snapshot visitante só é limpo após confirmação.
- O snapshot em `localStorage` e os headers do mock são adaptadores da demonstração. Não tratá-los como persistência autoritativa de produção.
- Checkout mantém todos os itens e usa a mesma cotação sem filtro de rede do carrinho. Cada NFT conserva a própria rede no pedido.
- Carteira cadastrada, rede e provedor são conceitos distintos. O seletor lista todas as carteiras; sua escolha sincroniza rede/provedor. A conexão é simulada por API.
- ENS e indicação são obrigatórios no contrato atual; não invente preenchimento automático de indicação. Endereço secundário e observação são opcionais e validados.
- Mudança de cotação/fingerprint exige nova revisão explícita. Formulário inválido, cotação obsoleta, falta de conexão e tentativa pendente bloqueiam a confirmação.
- A chave idempotente identifica uma tentativa: timeout deve recuperar o mesmo pedido; chave repetida com payload diferente gera conflito.
- Preserve o bloqueio síncrono da submissão antes do primeiro `await` e a leitura da chave persistida por usuário. O estado de render/disabled do botão sozinho não impede dois callbacks concorrentes no mesmo ciclo.
- Pedido é pendente, confirmado ou recusado; os dois últimos são terminais. Recibo só aparece após confirmação e reproduz um snapshot imutável.
- Confirmação remove apenas as quantidades compradas. Falha/recusa preserva os itens. Não simular uma transação blockchain real.

## MSW, Socket.IO e persistência

- Fixtures são determinísticos; handlers representam transporte/validação e `mocks/state` mantém o estado consistente entre recursos.
- Cenários são selecionados por `kurio:mock-scenario` e header correspondente. Mantenha-os reproduzíveis e documente-os no README.
- Reset restaura catálogo, contas, sessão, favoritos, inventário, carrinhos e pedidos. O cenário é removido separadamente.
- Persistência local existe para refresh da demonstração. Não persistir senhas em claro, segredos ou dados reais; fixtures de senha usam digest.
- `CatalogRealtimeSync` só aceita versões novas, guarda o último evento por NFT e reaplica após respostas REST atrasadas. Preserve essa proteção inclusive quando a query inicial ainda não tem dados.
- A primeira conexão assina o catálogo; reconexões reconciliam queries ativas por REST. O socket é importado depois da inicialização do worker.
- Eventos de pedido conferem pedido, usuário e versão. Polling recupera pedidos pendentes; eventos antigos/duplicados não podem reverter estados terminais.
- Cleanup remove listeners, observadores de cache, eventos guardados e sockets. Eventos da sessão anterior não podem atualizar a seguinte.

## Build, pré-renderização e inicialização

- `npm run build` executa tipos, Vite e `prerender-routes.mjs`. Com mocks habilitados, o build descobre NFTs pela API paginada e gera 63 documentos.
- `entry-server.tsx` usa MSW no Node e Axios com os mesmos handlers públicos. Serializa apenas queries públicas, com escape de HTML; o navegador restaura esse cache antes de hidratar.
- Sessão, carrinho, carteira e pedido são consultados no cliente; nunca incluir dados privados no HTML/cache estático.
- A build prioriza CSS, fonte local e imagens antes de carregar a hidratação. Todos os visitantes recebem o mesmo código, mocks e funcionalidades; não criar comportamento exclusivo para Lighthouse.
- O HTML estático fica `inert` e `aria-busy` durante a inicialização, com status acessível. `RootLayout` libera a interação depois do commit React, evitando cliques perdidos em controles ainda sem handlers. Não remover essa proteção para melhorar uma medição.
- `test:preview` verifica a build, inclusive login com o módulo inicial atrasado, rotas, refresh, cache privado e arquivos públicos.
- Query strings e rotas sem documento correspondente usam bootstrap client-side. Preserve o guard e os marcadores de hidratação; alterações exigem conferir erros do navegador no preview.
- Não alterar configuração/provedor de hospedagem nem fazer deploy sem solicitação explícita. Verificação local não comprova correspondência da URL publicada.

## UI, assets e acessibilidade

- Tailwind CSS 4 é o padrão local. `index.css` fica restrito a fontes, tokens, reset, acessibilidade e animações; não adicionar seletores globais de uma feature.
- Consulte os wrappers de `components/ui` antes de usar HTML/Radix diretamente. Reutilize `Button`, campos, labels/erros, Select, Dialog/Sheet, Tabs, Carousel, Skeleton e demais primitivas existentes.
- Variantes compartilhadas usam CVA; `cn` compõe classes. Prettier ordena utilities. Estados Radix usam variantes explícitas, como `data-[state=on]`.
- Use `Link` na navegação interna, `<a>` para destinos externos e botões para ações. Ações fora do escopo usam feedback de indisponibilidade, sem `href="#"` ou sucesso fictício.
- Reutilize `NftCard`, `NftImage`, `CartItemRow`, shells e recibo. Blocos exclusivos, como hero/editorial/promoções, continuam em `home`.
- Imagens são locais e responsivas via `src/assets/index.ts` e `components/media/nft-image.tsx`. Preserve `srcset`, `sizes`, prioridade da imagem principal e lazy de conteúdo oculto/fora da viewport.
- A fonte empacotada se chama `Roboto Mono Variable`. Ícones funcionais vêm de Lucide; marcas sociais usam imports individuais de `react-icons/fa6`.
- Consulte desktop/mobile no inventário Figma antes de mudar layout. Valide 390, 768 e 1440 px, sem overflow e com reflow/zoom. Não regenerar snapshots para encobrir divergências.
- Labels, semântica, foco, diálogo/drawer, erros por campo, contraste e alternativas de imagem precisam acompanhar o estado real.
- Mudanças relevantes usam anúncios acessíveis; o preço do detalhe usa `aria-live="polite"`. Respeite movimento reduzido e não dependa só de cor.
- Loading usa skeleton com geometria preservada. Erro, vazio, indisponível e 404 são estados distintos e recuperáveis quando aplicável.

## Testes, relatórios e documentação

- Vitest usa imports TypeScript diretos, alias `@/` e dois projetos em `vitest.config.ts`: `unit` e `integration`. Não criar um servidor Vite manual nem agregar módulos em um objeto dinâmico para executar testes.
- Separe arquivos por responsabilidade dentro do domínio. Regras puras ficam em `tests/unit`; cenários que compõem stores, cache e transporte ficam em `tests/integration`. Playwright continua responsável pelos fluxos completos e screenshots.
- Use fixtures tipadas e pequenas em `tests/support`, sem copiar implementações da aplicação para os testes. O setup de integração reinicia storage e stores por caso; restaure relógios, mocks e handlers e encerre servidores/subscriptions usados pelo arquivo. Não usar testes concorrentes dentro de um arquivo que compartilha estado mutável.
- Cubra invariantes, limites e recuperação de erros. Prefira tabelas para entradas equivalentes; não duplique asserts apenas para elevar a contagem. `typecheck:tests` valida os testes com TypeScript estrito.
- `test:checks` executa os dois projetos e grava o JUnit em `docs/quality/vitest-results.xml`. `test:coverage:vitest` executa os projetos unit e integration; não é “unit-only” e não aplica threshold. `test:coverage` instrumenta Vitest e Playwright, produz relatórios por camada e combinado, e exige 80% apenas no mapa combinado. `test:coverage:refresh-vitest` atualiza a camada Vitest e reagrupa com o último mapa Playwright sem executar E2E; use somente se `src/`, dependências, testes e configurações de browser/build não mudaram desde a última execução completa. Os mapas por camada mostram execução, não suficiência dos asserts; não exigir 80% genérico para cada ferramenta. Consulte o [roadmap de testes](./docs/quality/TESTING-ROADMAP.md) para escopo e sequência.

| Comando                                                         | Uso                                                            |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run typecheck`                                             | Tipos TypeScript                                               |
| `npm run lint:check`                                            | Prettier e ESLint sem correções automáticas                    |
| `npm run build`                                                 | Build otimizada e pré-renderização                             |
| `npm run test:coverage`                                         | Relatórios por camada e combinados; 80% no combinado           |
| `npm run test:coverage:vitest`                                  | Diagnóstico dos projetos unit + integration                    |
| `npm run test:coverage:refresh-vitest`                          | Atualiza Vitest e combinado, reutilizando mapa E2E válido      |
| `npm run test:coverage:report`                                  | Regenera os três relatórios dos mapas versionados              |
| `npm run test:e2e -- --project=chromium-desktop --grep "termo"` | Validação funcional direcionada                                |
| `npm run test:e2e`                                              | Suíte completa em desktop/tablet/mobile                        |
| `npm run test:visual`                                           | Comparações de comércio e conta                                |
| `npm run test:report`                                           | HTML da última execução local                                  |
| `npm run test:preview`                                          | Verificação da build já gerada, na porta 4176                  |
| `npm run audit:lighthouse:matrix`                               | Três medições de início/detalhe, desktop/mobile, na porta 4173 |

- Nos testes, use `tests/helpers/mock-api.ts` para reset pelo navegador; `page.request` não atravessa o service worker.
- Observe a interface e o resultado das operações. REST precisa atravessar Axios/MSW; tempo real precisa atravessar o cliente Socket.IO.
- Controle latência, cenários e disparo de eventos em regressões sensíveis a tempo. Não aumentar tolerância/retries para esconder falhas.
- Playwright usa dois workers, zero retry local e um em CI. As 12 jornadas obrigatórias são mapeadas em RESULTS.md.
- `npm run test:core` é o recorte complementar de checkout em desktop/mobile. Ele cobre isolamento entre contas, estados terminais, concorrência, idempotência e recuperação; não substitui a matriz completa nem permite somar resultados sobrepostos.
- Cada arquivo visual possui sua própria pasta de snapshots. A tolerância é de 50 pixels absolutos; mudanças maiores exigem inspeção contra o frame e a baseline. Atualize somente casos revisados.
- Rode testes direcionados durante o ajuste e a suíte completa no fechamento solicitado. Após alterações de build/hidratação, valide também `test:preview` e screenshots em preview de produção.
- Lighthouse exige build com mocks, imagens e fonte da entrega. Use três medições por alvo, medianas das quatro categorias e LCP/CLS/TBT. Não executar junto com testes ou outras auditorias.
- Preserve os relatórios nativos e seus metadados reais. A matriz Lighthouse fica em `docs/performance/lighthouse/current/`; os relatórios Playwright de entrega ficam em `docs/quality/playwright/`; coverage por camada e combinada fica em `docs/quality/coverage/`.
- Mantenha apenas a evidência final revisada quando solicitado; substitua relatórios antigos somente depois de conferir os novos. Execuções locais não atualizam automaticamente o HTML Playwright.
- Atualize cada documento em sua função: README para execução; arquitetura para contratos, motivos e provas; checklist para requisitos; RESULTADOS para testes e limites; LIGHTHOUSE para métricas e análise. Cite os arquivos/testes/comandos que sustentam afirmações e evite números duplicados divergentes e documentos temporários de auditoria.
- Não acrescentar datas de atualização do projeto nem editar datas das medições. A geração de novos relatórios mantém os metadados autênticos das ferramentas.
- Registre resultados abaixo das metas, falhas e limitações. Não atribua nota máxima ou conformidade integral sem evidência; screenshots e Lighthouse não substituem revisão humana completa.

Uma mudança está pronta quando respeita os contratos e o layout aplicável, mantém isolamento/concorrência, cobre estados de loading/erro/vazio, passou pelas verificações proporcionais e atualizou a documentação relacionada.
