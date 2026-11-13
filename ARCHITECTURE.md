# Arquitetura — Kurio

> O [TECHNICAL-CHALLENGE.md](./TECHNICAL-CHALLENGE.md) preserva os requisitos do teste técnico; o [README.md](./README.md) documenta a solução e sua execução. Este documento registra as decisões de implementação e os contratos vigentes.

## Stack e fluxo de execução

- Vite entrega React 19 com TypeScript em modo estrito.
- TanStack Router é responsável por rotas, parâmetros e acesso direto.
- TanStack Query controla cache e estado remoto; Axios é o único cliente REST da aplicação.
- Tailwind CSS 4 e primitivas shadcn/ui formam a camada visual. `src/index.css` contém somente fontes, tokens, reset/base, acessibilidade e animações globais.
- MSW fornece o backend simulado. `VITE_ENABLE_MOCKS=true` habilita os handlers no navegador e no build de demonstração.
- Socket.IO Client é o transporte de eventos da aplicação. `VITE_SOCKET_URL=same-origin` mantém o ambiente portátil; o MSW intercepta o WebSocket e usa `@mswjs/socket.io-binding`. A conexão, proteção de versão e reconciliação REST ao conectar/reconectar possuem cobertura ponta a ponta.
- Playwright executa Chromium em 1440×900, 768×1024 e 390×844.
- Lucide fornece ícones funcionais genéricos e `react-icons/fa6` fornece somente ícones de marcas sociais ausentes no Lucide.

## Organização vigente

```text
src/
  assets/                 # imagens locais e índice tipado
  components/
    layout/               # layout compartilhado entre páginas
    ui/                   # primitivas shadcn/ui adaptadas
  features/
    cart/                 # carrinho anônimo, cotação, mutations e interface responsiva
    catalog/              # listagem, filtros, busca, query e cards de NFT
    home/                 # hero, conteúdo editorial e navegação mobile exclusivos da home
    checkout/             # revisão do checkout, carteira, conexão e criação de pedido
    order/                # leitura/atualização de pedidos, itens e recibo
    nft-detail/           # galeria, compra, conteúdo e query da rota de detalhe
  lib/                    # infraestrutura transversal, sem regra de feature
  mocks/
    fixtures/             # dados determinísticos
    handlers/             # contratos HTTP e realtime simulados
    state/                # estado mutável encapsulado dos mocks
  routes/                 # composição de páginas e integração com Router
  types/                  # entidades/eventos compartilhados entre features
tests/                    # jornadas E2E por comportamento observável
```

### Regras de dependência

1. Rotas compõem features; não concentram componentes reutilizáveis nem dados fictícios.
2. Features podem consumir `components/ui`, `components/layout`, `lib` e tipos compartilhados.
   Features nunca importam `routes`; contratos usados pelo Router e por uma feature pertencem ao domínio da feature ou a `types` compartilhado.
3. `lib` não importa features e não contém regra de catálogo, compra ou conta.
4. A UI nunca importa fixtures ou estado de `mocks`; todo dado simulado atravessa Axios/MSW.
5. APIs são agrupadas por recurso, não por verbo HTTP. Leituras simples podem ser chamadas por hooks de Query sem uma camada de use case artificial.
6. Use cases são reservados para ações com orquestração/regra de negócio, como compra, merge de carrinho e confirmação idempotente.

## Padrão para páginas e componentes

- Cada rota possui um arquivo em `src/routes` responsável por parâmetros, composição e boundary de página.
- A rota mantém a orquestração de sessão, parâmetros e navegação, e compõe blocos de domínio em `features/<feature>/components`. Extraia formulários e blocos coesos; não transfira a página inteira para um componente genérico da feature.
- Blocos coesos e exclusivos ficam em `src/features/<feature>/components`; primitivas realmente compartilhadas ficam em `src/components`.
- O shell público, `SiteHeader`, `SiteFooter` e seus conteúdos ficam em `components/layout`. Não duplicar esses elementos em features ou rotas.
- Um componente só sobe para `components` quando possui uso transversal real. Componentes exclusivos, como `PromoCard`, `JournalCard` e `MobileBottomNav`, permanecem na feature `home` mesmo que sejam internamente reutilizáveis.
- Configuração + `map` é indicada para coleções homogêneas. Blocos curtos com elementos semanticamente diferentes devem permanecer explícitos para preservar tipagem e leitura.
- Elementos devem seguir a semântica da ação: `Link` para navegação interna, `<a>` para URL/e-mail/telefone real, `<button>` para ação e texto não interativo para funcionalidades futuras. Não usar `href="#"`.
- Não usar `<br />` para controlar composição. Limite largura e permita quebra natural, salvo conteúdo em que a quebra faça parte do significado.
- Valores exatos do Figma podem ser tokens/utilities ou constantes nomeadas. Evitar números soltos repetidos e estilos globais que sobrescrevam utilities.
- Funções e componentes authored pela aplicação usam arrow functions por convenção, sem alegação de ganho de performance.

## Sistema visual

- Cores recorrentes são tokens em `src/index.css`; `--color-on-primary` representa conteúdo sobre o fundo primário.
- Primitivas shadcn/ui adaptadas vivem em `components/ui` (`Button`, `Input`, `Slider`, `Skeleton` e controles equivalentes). Features não devem montar novamente uma primitiva Radix ou um campo base quando já existir wrapper compartilhado.
- Variantes compartilhadas de controles vivem em CVA quando possuem variantes (`components/ui/button.tsx`). Estado visual específico da página permanece no componente.
- Primitivas Radix expõem seleção por `data-state="on"`; no Tailwind 4, os estilos locais usam a variante explícita `data-[state=on]:...`. Esse padrão vale para abas de ordenação, filtros, rede e edições.
- Cards, galerias, filtros e sidebars de negócio continuam sendo componentes próprios compostos por primitivas shadcn; shadcn/ui não substitui componentes específicos do domínio.
- Tailwind é o padrão para estilo local. CSS global não deve conhecer `.nft-card`, `.hero`, footer ou outra composição de componente.
- Imagens ficam em WebP sob `src/assets` e são importadas por `src/assets/index.ts`.
- A fonte Roboto Mono é empacotada localmente.
- Ícones de interface vêm de `lucide-react`. Marcas Facebook, Instagram, X, LinkedIn e YouTube vêm de imports individuais de `react-icons/fa6`; não substituir marcas por caracteres tipográficos improvisados.
- Skeletons devem preservar a geometria final, usar shimmer e respeitar `prefers-reduced-motion`.
- Prettier é a fonte de verdade da formatação e ordena utilities Tailwind. `npm run lint` é corretivo; `npm run lint:check` é a verificação não mutável para CI.

## Catálogo implementado

`GET /api/nfts` aceita `q`, `category`, `network`, `minPriceEth`, `maxPriceEth`, `sort` e `page`. A resposta contém itens, paginação e facetas contextuais. Busca, filtros, ordenação e página vivem na URL; alterações de critério reiniciam a página sem deslocar a rolagem.

- “Limpar filtros” aparece quando há critérios ativos (inclusive no estado sem resultados) e remove esses critérios da URL; ele existe porque filtros persistidos na navegação podem restringir o catálogo indefinidamente sem uma saída clara para o usuário.

O mock possui 54 NFTs determinísticos, nove por página e seis páginas no cenário completo. A paginação mostra até quatro números em janela móvel, mantendo uma página seguinte visível quando houver.

Preços em ETH são strings decimais. Comparação e ordenação convertem para wei inteiro por `ethToWei`, sem usar ponto flutuante para regra monetária.

`GET /api/nfts/:id` e `features/nft-detail/api/getNftDetail` retornam `NftDetail` ou `404 { code: "NFT_NOT_FOUND" }`. A listagem permanece em `features/catalog/api` e continua devolvendo apenas summaries. A coincidência do recurso HTTP `/nfts` não transfere a propriedade da operação de detalhe para a feature de catálogo.

## Contrato de NFT: estado atual

`NftSummary` atende cards/lista; `Nft` permanece somente como alias temporário de compatibilidade:

- identidade: `id`, `name`, `tokenId`;
- classificação: `collection`, `category`, `network`;
- venda resumida: `priceEth`, `edition`, `available`;
- apresentação: `image`, `featured`, `rare`;
- catálogo/realtime: `createdAt`, `popularity`, `version`.

Os campos de detalhe não são adicionados indiscriminadamente à listagem. O contrato vigente está separado assim:

```ts
type NftSummary = {
  // campos necessários a cards, filtros e realtime do catálogo
}

type NftDetail = NftSummary & {
  gallery: NftMedia[]
  shortDescription: string
  description: string[]
  creator: { id: string; name: string }
  attributes: NftAttribute[]
  editions: NftEdition[]
  rating: NftRating
  provenance: NftProvenance
  relatedNfts: NftSummary[]
}
```

Campos implementados a partir do frame de detalhe:

| Área         | Dados necessários                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Galeria      | imagem principal, thumbnails, `alt`, ordem e mídia ativa                                                |
| Cabeçalho    | nome, token ID, preço em ETH, avaliação média e quantidade de avaliações                                |
| Apresentação | resumo, descrição longa em parágrafos, criador e coleção                                                |
| Edição       | ID estável, rótulo (`1/1`, `1/10`, `1/50`, aberta), preço, estoque, limite por pedido e disponibilidade |
| Compra       | quantidade inteira; máximo = menor valor entre estoque e limite por pedido                              |
| Metadados    | atributos tipados, rede, padrão do token, contrato/endereço e royalties                                 |
| Relacionados | `NftSummary[]` da mesma coleção, resolvidos pelo mock de detalhe                                        |

Decisões de contrato:

- `priceEth` continua string decimal; nunca `number` para cálculo.
- `tokenId` deve ter representação canônica sem depender do `#` para lógica; a formatação pertence à UI. A migração deve preservar os testes/URLs existentes.
- Edição não é apenas texto: compra e quantidade dependem de uma entidade `NftEdition` com estoque.
- `available` deve ser coerente com a edição padrão; eventos futuros podem carregar `editionId` quando a disponibilidade for por edição.
- Fixtures detalhadas devem ser canônicas no mock. A listagem deve derivar summaries delas ou combinar defaults determinísticos com overrides, evitando duas fontes divergentes.
- Não é necessário escrever manualmente uma descrição exclusiva para os 54 NFTs antes da rota existir. O cenário Emerald Ape deve ser completo; os demais podem usar defaults determinísticos coerentes até seus fluxos serem exercitados.

## Padrão aprovado para a rota de detalhe

- Caminho: `/nfts/$nftId`, usando o `id` estável (`emerald-ape-042`), não nome ou índice.
- Query key: `['nfts', 'detail', nftId]`; a listagem mantém sua chave parametrizada própria.
- Arquivo de rota: `src/routes/nft-detail-page.tsx`.
- Componentes coesos: `features/nft-detail/components` para galeria, resumo/compra, abas de informação e relacionados.
- Hook de leitura: `useNftDetail(nftId)` com `AbortSignal`, utilizando `getNft`/contrato de recurso e sem fixtures na UI.
- Estados obrigatórios: skeleton dimensionalmente estável, erro com retry, 404 próprio, NFT/edição indisponível e atualização em segundo plano.
- Cards navegam por `Link` na imagem/título. Não envolver botão de favorito dentro de um link interativo.
- Breadcrumbs devem usar links reais e refletir `Início / Mercado / <NFT>` quando necessário.
- Seleção de edição e quantidade é estado local até entrar no carrinho. Quantidade deve ser revalidada pela API na mutation.
- Comprar e favoritar só aparentam sucesso quando os respectivos mocks/mutations existirem. Até lá, devem permanecer claramente indisponíveis.
- Compartilhamento só vira link/botão funcional com destino/ação real; ícones decorativos não simulam sucesso.
- Ícones de compartilhamento presentes no frame permanecem informativos enquanto não houver destinos ou integração real; e-mail usa Lucide e marcas usam `react-icons/fa6`.
- “Mais desta coleção” reutiliza summary/card do catálogo, sem duplicar um segundo modelo visual incompatível.

## Layout e responsividade da rota de detalhe

Os frames desktop e mobile fornecidos são as referências da rota. A implementação contém galeria, imagem principal, painel de compra, abas, relacionados e footer desktop.

No desktop, a rota usa uma área útil própria limitada a `1280px`, sem alterar o limite global do shell. A galeria reserva uma coluna estável para quatro miniaturas; quantidade e ações compartilham a mesma faixa, seguidas por metadados e compartilhamento, conforme o frame.

No mobile:

1. galeria principal antes das informações;
2. thumbnails ficam ocultas, conforme o frame mobile;
3. compra/edição/quantidade sem controles fora da viewport;
4. abas com rolagem horizontal acessível;
5. relacionados em grid responsivo ou carrossel apenas se houver controles reais;
6. footer/navegação conforme o shell público, sem duplicação.

Breakpoints mínimos de validação: 390, 768 e 1440 px. Reflow a 320 CSS px, movimento reduzido, foco e overflow possuem cobertura automatizada; a rodada manual completa de navegação por teclado também foi validada pelo responsável.

## Carrinho anônimo e cotação

- Rota pública: `/cart`; composição em `routes/cart-page.tsx` e blocos em `features/cart`. `useCartPageController` concentra mutations, feedback acessível e navegação, enquanto a rota preserva somente os estados e a composição visual.
- Query keys: `cartKeys.detail(ownerId)` e `cartKeys.quote(ownerId, couponCode, network)` em `features/cart/query-keys.ts`. O proprietário é o ID do usuário ou `visitor`; carrinho e cotação não compartilham cache entre contas.
- `CartItem.id` é `${nftId}:${editionId}`. Repetir essa combinação soma quantidades; estoque e `maxPerOrder` são revalidados pelo handler.
- O estado canônico fica em `mocks/state/cart-store.ts`. No cenário local simulado, um snapshot do carrinho visitante em `localStorage` é transportado pela infraestrutura Axios até o MSW para sobreviver ao refresh, sem importar mocks na UI; ele é um adaptador de teste, não estado autoritativo de produção. Uma API real deve persistir o carrinho no servidor associado a uma identidade de visitante/sessão.
- Mutations persistem snapshots; respostas GET antigas não sobrescrevem uma mutation mais nova. A alteração de quantidade é otimista e restaura o cache anterior em falha.
- `POST /api/cart/quote` é a única fonte de subtotal, desconto, taxa e total. O mock converte strings ETH para wei inteiro e devolve strings decimais.
- Cupons determinísticos: `KURIO10` aplica 10%, `EXPIRADO` retorna expiração e qualquer outro código não vazio retorna inválido.
- `nft.updated` invalida carrinho e cotação. A leitura REST reconcilia preço, disponibilidade, edição, limite e versão; eventos antigos continuam bloqueados pelo controle monotônico do catálogo.
- O header deriva a contagem de `GET /api/cart`; o detalhe só navega ao carrinho após a mutation de inclusão confirmar.
- Após autenticação, `POST /api/cart/merge` associa o snapshot visitante ao carrinho da conta. A chave determinística torna repetições idempotentes; o handler busca novamente catálogo/edição, aplica estoque e `maxPerOrder`, e devolve conflitos explícitos. O snapshot visitante só é removido após confirmação.
- Carrinhos autenticados e chaves de merge são persistidos por identidade no backend simulado. Logout remove o cache remoto do carrinho; uma sessão seguinte lê somente o carrinho do próprio usuário.
- “Colecionadores também viram” reutiliza `Carousel` e `NftCard`; recomendações continuam sendo uma query de catálogo independente do estado do carrinho.
- Cenários nomeados e sem contadores globais cobrem latência, 4xx, 5xx, falha de conexão, resposta fora de ordem, preço alterado e indisponibilidade via Socket.IO.
- Checkout permanece indisponível até sessão/conta existirem. O botão é desabilitado diante de item conflitante, cotação inválida ou recotação em andamento, evitando avanço com valores anteriores ainda presentes no cache.

## Cache e tempo real

- `nft.updated` atualiza summaries nas listas e o detalhe em cache somente se a versão recebida for mais nova.
- Preço/disponibilidade não devem regredir com eventos duplicados ou antigos.
- Ao conectar ou reconectar, queries `nfts` ativas são invalidadas para reconciliação por REST antes da nova assinatura.
- O cliente é importado dinamicamente depois da inicialização do worker para que o interceptor WebSocket do MSW capture o Engine.IO. O mock aceita a URL WebSocket completa porque o handshake acrescenta query parameters antes de o binding Socket.IO assumir o protocolo.
- O teste ponta a ponta confirma atualização para `1.75 ETH` via Socket.IO e rejeita uma atualização posterior com versão antiga e preço `9.99 ETH`.
- Favoritos usam `['account', sessionId, 'favorites']`, marcada como query privada. Inclusão e remoção são mutations otimistas com snapshot e rollback; card, detalhe e `/profile/favorites` consomem o mesmo cache.

## Conta e sessão

- A sessão é consultada por `GET /api/session`, dura uma hora no cenário padrão e não possui retry automático, evitando loops em respostas `401`.
- `POST /api/mock/reset` restaura catálogo, contas/credenciais de fixture, sessão, carrinhos e pedidos de forma determinística.
- Cadastro, login por credenciais, login social simulado, recuperação e logout atravessam Axios, MSW e TanStack Query. Google e Facebook selecionam usuários fictícios isolados por handlers reais.
- O backend simulado persiste contas e sessão sob uma única chave versionada. Senhas são mantidas somente como digest SHA-256 e nunca retornam nos contratos públicos.
- Queries privadas usam a identidade da sessão nas chaves (`['account', sessionId, ...]`), recebem `meta.private` e são removidas no logout.
- Perfil, avatar, senha e carteiras possuem endpoints e mutations separados. Carteiras têm IDs estáveis, endereço validado por rede, prioridade principal/secundária e conflito de endereço por usuário.
- Schemas Zod centralizados validam autenticação no cliente, enquanto os handlers repetem a validação no limite do servidor simulado. React Hook Form é o padrão definido para os formulários maiores de perfil, carteira e checkout.
- `PasswordInput` é compartilhado entre autenticação e perfil; o input de arquivo do avatar usa o wrapper shadcn `Input` com nome acessível.
- O Dialog desktop preserva valores somente durante a alternância interna entre login/cadastro; fechar ou autenticar limpa campos, erros e mensagens transitórias.
- Autenticação usa um único contrato React Hook Form + Zod para login e cadastro; a troca de modo preserva valores úteis, enquanto fechar a experiência limpa campos, erros REST e mensagens de recuperação.
- `/login` e `/register` são entradas dedicadas para mobile, respeitam safe areas e aceitam somente destinos internos permitidos em `returnTo`, incluindo detalhes de NFT validados por padrão interno. `/profile`, `/profile/wallets` e `/profile/favorites` redirecionam visitantes para login e retomam a rota depois da sessão confirmada.
- Favoritar sem sessão abre o Dialog sobre a tela atual no desktop e mantém a página de autenticação dedicada no mobile. A intenção de favoritar é executada pela API após autenticação confirmada; falhas são apresentadas sem exibir sucesso fictício.
- “Minha conta” no header desktop abre perfil, carteiras e saída. Essa entrada foi adicionada porque os frames do Figma não deixavam claro como chegar a essas páginas depois do login; no mobile, o ícone de perfil leva à área privada e o `AccountShell` oferece as mesmas seções e a ação “Sair”.
- A área privada começa em `/profile` e reutiliza `AccountShell` para navegação e composição. Itens ainda fora do escopo permanecem visíveis em todos os viewports como controles desabilitados, sem links ou sucesso fictício.
- Após logout confirmado, a navegação retorna à home antes de limpar a sessão em cache; assim, rotas privadas não interceptam a saída e redirecionam o usuário para login com `returnTo` da página anterior.
- O perfil usa React Hook Form com schemas Zod compartilhados; erros retornados pelo REST são associados aos campos. Dados cadastrais, avatar e senha possuem formulários e mutations independentes.
- Upload de avatar aceita PNG, JPEG e WebP de até 1 MB, gera preview local somente para envio ao backend simulado e atualiza o cache privado após confirmação.
- As rotas `/profile` e `/profile/wallets` reorganizam o shell e os formulários em uma coluna nos viewports móveis. Header e navegação inferior oferecem acesso real ao perfil; o acesso às carteiras e ao logout permanece no `AccountShell`.
- Carteiras usam um schema Zod discriminado pela rede: Ethereum/Polygon exigem endereço hexadecimal `0x` e Solana usa Base58. Principal e secundária têm IDs estáveis; promover uma secundária rebaixa a principal anterior de forma atômica no estado simulado.
- E-mail é identidade do perfil, não propriedade da carteira; código de indicação pertence ao contrato de checkout da Fase 5. Esses campos não são duplicados no endpoint de carteiras sem um contrato aprovado.
- “Igual à carteira principal” significa ausência de um segundo registro. Ao adicionar uma secundária, ela passa a ser uma entidade independente e o backend rejeita endereços duplicados, evitando duas fontes para a mesma carteira.
- Favoritos ficam no registro privado da conta simulada e são expostos por `GET/PUT/DELETE /api/favorites`. O logout remove queries com `meta.private`, impedindo que a próxima sessão observe a lista anterior. A intenção de favoritar sem sessão é retomada após autenticação, com erro visível se a mutation falhar.
- As respostas `VALIDATION_ERROR` usam um helper HTTP compartilhado em `mocks/handlers`; o mapeamento de erros REST para campos permitidos de React Hook Form fica em `features/auth/utils`, preservando aliases de campo específicos do formulário.
- O merge de carrinho ocorre depois da resposta de autenticação e antes da navegação de sucesso. A falha do merge não é mascarada como autenticação bem-sucedida; respostas do merge trazem a cotação/cart canônicos e conflitos de quantidade ou disponibilidade.

## Checkout, pedidos e recibo

- `/checkout` exige sessão. `CartSummary` abre o modal de autenticação no desktop e usa `/login?returnTo=/checkout` no mobile; o cupom aplicado é preservado. Após autenticação, o merge do carrinho termina antes da sessão ser atualizada no cache.
- As queries de carrinho usam chaves por proprietário. Login cancela leituras em andamento, coloca o resultado confirmado do merge na chave da conta e remove a chave visitante; logout cancela leituras e remove o cache de carrinho e demais queries privadas.
- A página de checkout separa o formulário do colecionador da área de pagamento. A ordem desktop segue o Figma: nome de exibição/usuário, rede/nome do perfil, carteira/endereço ENS ou secundário, tipo de carteira/código de indicação, e-mail/nome ENS e observação opcional.
- `routes/checkout-page.tsx` é somente a composição da tela. `useCheckoutController` combina os hooks especializados e entrega modelos e ações coesos aos componentes, sem concentrar novamente as regras em um hook monolítico.
- `useCheckoutForm` mantém React Hook Form, preenchimento por perfil/carteira e sincronização de rede; `useCheckoutAttempt` controla a chave idempotente e recuperação de tentativa; `useCheckoutSubmission` coordena conexão, criação, recotação e erros da API. `CheckoutPageState` e `CheckoutAttemptStatus` isolam os estados que não pertencem ao formulário.
- `CheckoutCollectorForm` encapsula os campos e validação visual; `CheckoutPaymentPanel` encapsula resumo, cupom, cotação, provedores, conexão e CTA. Eles recebem `model` e `actions`, evitando interfaces extensas de propriedades independentes. Redes, provedores e type guards ficam em `features/checkout/constants.ts`, sem configuração de domínio solta na rota.
- Contratos de apresentação compartilhados pela rota e pelos componentes de checkout ficam em `features/checkout/types.ts`. Tipos inferidos diretamente do Zod permanecem em `schemas.ts`; props usadas somente por um componente permanecem locais. Entidades de pedido continuam em `src/types/order.ts`, pois são compartilhadas entre checkout, order, mocks e realtime.
- Mobile usa duas etapas em `/checkout`: dados obrigatórios do colecionador, depois seleção de carteira/provedor, total e confirmação. Assim, os campos do recibo continuam acessíveis sem reduzir o layout mobile de carteira do Figma a uma cópia do formulário desktop.
- Nome ENS e código de indicação são obrigatórios no schema e no handler; o código não é preenchido automaticamente. Endereço primário vem da carteira registrada selecionada; o endereço secundário é opcional e validado.
- A carteira registrada (`walletId`/endereço), rede (`network`) e provedor simulado (`walletType`) são valores distintos. O seletor lista todas as carteiras do usuário; selecionar uma sincroniza sua rede e provedor, sem filtrar pelas redes dos NFTs no carrinho. No mobile, avançar para pagamento inicia a conexão simulada; no desktop, ela é iniciada ao confirmar a compra. Só uma conexão compatível permite criar o pedido; uma recusa mantém o checkout recuperável e não cria a ordem.
- Ao sair do checkout para cadastrar uma carteira, `/profile/wallets` recebe um retorno interno validado com a rede/cupom atuais e oferece uma ação de voltar no mobile.
- O resumo usa `CartItemRow` em variante somente leitura e exibe todos os itens e quantidades do carrinho. Checkout e carrinho usam `POST /api/cart/quote` sem filtro de rede, mantendo subtotal, desconto, taxa e total idênticos. A rede selecionada identifica a carteira/conexão de pagamento; cada NFT preserva sua própria rede no snapshot do pedido. Alteração do fingerprint exige revisão explícita antes de confirmar.
- `/api/orders` valida sessão, conexão, carteira, cotação, preço, disponibilidade, estoque, cupom e campos do checkout no backend simulado. Idempotência recupera a mesma tentativa após timeout e rejeita a mesma chave com payload diferente.
- Pedido mantém estados `pending`, `confirmed` ou `declined`. `order.updated` é processado pelo cliente Socket.IO; eventos antigos/duplicados não regridem a versão e pedido pendente é reconciliado por REST após reload/reconexão.
- `routes/order-page.tsx` é o boundary visual dos estados discriminados entregues por `useOrderPageController`. O controller concentra sessão, consulta, expiração/401, navegação e retry; estados de carregamento/erro ficam em `features/order/components/order-page-states.tsx`, pedido pendente/recusado em `OrderStatusPanel` e recibo em `components/receipt`.
- Após confirmação, só os itens e quantidades comprados são removidos do carrinho do usuário. Falha/recusa preserva o carrinho. O recibo contém snapshot imutável de dados do colecionador, carteira, itens e cotação.
- Integrações de conexão, pagamento, transação e explorer são exclusivamente simuladas; nenhum dado ou efeito representa uma transação real.

## Estado de qualidade auditado

- A homepage/catalog possui testes comportamentais nos três viewports para busca, filtros, ordenação, faixa de preço, paginação, URL/histórico e overflow.
- Catálogo, detalhe e carrinho possuem cobertura Playwright em 1440×900, 768×1024 e 390×844; catálogo e detalhe também cobrem reflow a 320 CSS px.
- MSW oferece cenários determinísticos de catálogo vazio/erro e latência diferencial, detalhe com erro/retry, NFT indisponível, edições esgotadas, carrinho lento/indisponível, cotação e pedido em timeout, respostas HTTP e conflitos realtime. `catalog-out-of-order` é testado pelo worker MSW controlando a conclusão das respostas Ethereum/Polygon/Solana.
- Baselines Playwright versionadas existem para home, detalhe, carrinho, checkout/recibo e autenticação. A execução completa mais recente detectou diferenças em nove screenshots (home, detalhe, carrinho e checkout em desktop/mobile, além do login desktop); não foram atualizadas automaticamente. Os frames canônicos permanecem a referência visual.
- Baselines de conta cobrem login/cadastro desktop e mobile, perfil e gerenciamento de carteiras. Testes também verificam sessão/isolamento, erros associados aos campos, validação de upload/endereço/senha, foco do Dialog e zoom/reflow a 200%.
- A matriz Playwright completa mais recente executou 279 casos: 179 aprovados, 91 ignorados por viewport e nove divergências visuais aceitas pelo responsável. Os testes funcionais adicionados para clique repetido, recuperação de pedido após reconexão e remoção parcial de quantidades também passaram.
- A cobertura E2E verifica merge idempotente, persistência por usuário, logout sem vazamento, reset determinístico e pedidos/recibos, incluindo duplicatas, eventos antigos e reconexão.
- A build de produção passou com divisão por rota; os maiores chunks observados ficaram em aproximadamente 476 kB (`browser`) e 276 kB (entrada principal) antes de gzip, sem aviso de chunk acima de 500 kB.
- Playwright cobre a autenticação desktop como modal, a página dedicada mobile e a retomada do favorito solicitado; os cenários de falha mantêm rollback/feedback em vez de sucesso fictício.
- A matriz Lighthouse de produção foi executada três vezes por rota e perfil. Os resultados versionados estão em [LIGHTHOUSE-PHASE-6.md](./docs/performance/LIGHTHOUSE-PHASE-6.md); os relatórios HTML/JSON detalhados são artefatos locais gerados em `reports/lighthouse/phase-6/` e ignorados pelo Git.
- Acessibilidade Lighthouse atingiu 100 nos quatro perfis, Best Practices 96 e SEO 92. Performance desktop ficou em 97/98; mobile em 68/72, abaixo da meta original ≥90. O responsável decidiu manter a pontuação atual sem novas otimizações nesta etapa.
- Foco de diálogo, nomes/alt, contraste, reduced motion e reflow estão automatizados; a rodada manual completa de teclado também foi validada pelo responsável.

## Escopo e limitações atuais

Implementado: homepage e catálogo, detalhe de NFT e carrinho responsivos; contratos summary/detail/cart/quote; acesso direto/404; persistência visitante e carrinhos autenticados; cotação e cupom; mutations otimistas; conflitos de preço/disponibilidade; atualização versionada via Socket.IO e reconciliação REST; sessão simulada, autenticação desktop/mobile, merge idempotente, perfil, carteiras e favoritos por usuário; checkout, pedidos idempotentes, confirmação/recusa simuladas e recibo imutável.

O código-fonte está publicado no repositório público [angelobarilari/kurio-marketplace](https://github.com/angelobarilari/kurio-marketplace), e a aplicação está publicada em [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app). Os diffs visuais do Playwright foram aceitos devido a problemas conhecidos nos frames Figma; a pontuação Lighthouse mobile abaixo da meta original será mantida conforme decisão do responsável. Integrações reais com blockchain/carteiras/gateway de pagamento permanecem fora do escopo.

Conclusão atual: **as Fases 1 a 6 estão implementadas, validadas e publicadas**. Diffs visuais e a pontuação Lighthouse atual foram aceitos conforme registrado no roadmap.
