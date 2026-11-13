# Guia de implementação para IAs — Kurio

Este é o ponto de entrada obrigatório antes de alterar o projeto. Consulte as fontes de verdade e os arquivos da feature afetada; não replique decisões já documentadas.

## Fontes de verdade

Em caso de conflito, siga esta precedência:

1. `TECHNICAL-CHALLENGE.md`: requisitos e critérios do teste técnico original.
2. `README.md`: apresentação do projeto, setup e comandos de execução.
3. `ARCHITECTURE.md`: decisões implementadas, contratos, limites e responsabilidades.
4. `IMPLEMENTATION-ROADMAP.md`: estado auditado e pendências das fases.
5. `docs/references/figma/README.md`: inventário e leitura dos frames.
6. Código e testes vigentes: evidência do comportamento realmente executável.

Não crie documentos temporários de auditoria no repositório. Atualize o roadmap quando o estado de uma fase mudar e a arquitetura quando uma decisão técnica mudar.

## Antes de editar

1. Leia a seção correspondente do teste técnico, da arquitetura e do roadmap; consulte o README do projeto para comandos e ambiente.
2. Inspecione a rota, componente, tipos, API, handler MSW, estado simulado e testes relacionados.
3. Consulte visualmente o frame desktop/mobile canônico antes de uma mudança de layout.
4. Procure primeiro por componentes e utilitários existentes; preserve alterações locais e não assuma que o workspace está limpo.
5. Faça a menor alteração coerente que resolva a causa. Não implemente funcionalidades editoriais ou integrações reais fora do escopo.
6. Adicione testes para o comportamento novo ou corrigido e execute validação proporcional. Não rode a suíte Playwright completa sem necessidade ou solicitação; use testes/grep e projeto/viewports direcionados durante ajustes.

## Stack e fronteiras

- React + TypeScript estrito; TanStack Router para rotas, URL e proteção de páginas.
- TanStack Query para estado remoto/cache; Axios para todas as chamadas REST.
- MSW implementa contratos simulados em desenvolvimento e build de demonstração.
- Socket.IO Client consome os eventos. A simulação usa `@mswjs/socket.io-binding`; mudanças realtime não podem ser invocadas diretamente pela UI.
- Tailwind CSS 4 para estilo local; shadcn/ui adaptado para controles compartilhados.
- Playwright para jornadas observáveis e regressão visual; Lighthouse conforme o README.

Responsabilidades:

- `src/routes`: limites de rota, parâmetros e composição da página.
- `src/features/<feature>`: API, hooks, componentes, schemas e lógica própria do domínio.
- `src/components/ui`: primitivas shadcn/ui adaptadas.
- `src/components/layout`: shell, header/footer, navegação e layout compartilhados.
- `src/lib`: infraestrutura transversal, sem regras de negócio das features.
- `src/mocks/fixtures`: dados determinísticos; `src/mocks/handlers`: contrato HTTP/eventos; `src/mocks/state`: estado mutável do backend simulado.
- `src/types`: contratos compartilhados entre features.
- `tests`: cobertura E2E organizada por jornadas e comportamento visível.

A UI não importa mocks/fixtures. Não adicione caminhos de sucesso alternativos em componentes ou hooks para contornar um handler ausente.

## Mapa de rotas e features

| Rota                                                 | Responsabilidade                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/`                                                  | Home, descoberta e catálogo                                                       |
| `/nfts/$nftId`                                       | Detalhe, galeria, edição, quantidade, favoritos e inclusão no carrinho            |
| `/cart`                                              | Carrinho visitante/conta, quantidade, remoção, cupom, cotação e recomendações     |
| `/login`, `/register`                                | Desktop: modal no contexto atual; mobile: páginas dedicadas                       |
| `/profile`, `/profile/wallets`, `/profile/favorites` | Dados, senha, avatar, carteiras e lista de interesse autenticados                 |
| `/checkout`                                          | Revisão do perfil, rede/carteira, cotação, conexão simulada e criação idempotente |
| `/orders/$orderId`                                   | Estado do pedido, eventos realtime, recuperação e recibo                          |

Features vigentes: `home`, `catalog`, `nft-detail`, `cart`, `auth`/conta, `favorites`, `checkout` e `order`. Mantenha conexão, seleção de carteira e criação de pedidos em `checkout`; leitura, atualização em tempo real e apresentação do pedido/recibo pertencem a `order`. Evite mover componentes exclusivos de domínio para `src/components` sem uso transversal real.

As rotas são boundaries e pontos de composição. Orquestrações pequenas podem permanecer nelas; fluxos densos devem usar um controller da própria feature que componha hooks de responsabilidade única. No checkout, `useCheckoutController` combina formulário, tentativa idempotente e submissão, enquanto `checkout-page.tsx` apenas seleciona o estado da página e compõe `CheckoutCollectorForm` e `CheckoutPaymentPanel`. Não mova a página inteira para um componente genérico nem crie um único hook monolítico para apenas deslocar complexidade.

O mesmo critério vale para rotas de comércio e autenticação: `useCartPageController` mantém mutations e feedback do carrinho; `useOrderPageController` mantém sessão, consulta e redirecionamento do pedido; `useAuthReturnNavigation` centraliza a interpretação de destinos autenticados. Controllers expõem estados discriminados e ações sem renderizar JSX.

## Estado, sessão e contratos

- Busca, filtros, ordenação, paginação e identificadores navegáveis pertencem ao Router.
- Queries/mutations remotas pertencem ao TanStack Query. Use chaves estáveis com os parâmetros relevantes e `AbortSignal` em consultas canceláveis.
- Estado efêmero de interface pode ficar local ao componente.
- Queries privadas devem ser marcadas com `meta.private`, isoladas por identidade e removidas ao logout/troca de conta. Cancele queries em andamento antes de mudar de proprietário.
- Não confunda cache local com fonte autoritativa. O estado de produção deve pertencer ao servidor.
- Persistência `localStorage` existente é apenas suporte determinístico ao backend simulado/refresh. Não persista segredos ou senhas em claro.
- Erros REST devem ser visíveis e associados ao campo correspondente, com fallback explícito e recuperável; não capture erros amplamente nem apresente sucesso fictício.

### Carrinho

- O item é identificado por NFT + edição; quantidade é inteira e revalidada contra estoque e `maxPerOrder`.
- Carrinhos de visitante e usuários são distintos. `kurio:visitor-cart` transporta snapshot de teste até o mock; após login, `/api/cart/merge` revalida disponibilidade, soma itens, registra idempotência e limpa o snapshot visitante somente após confirmação.
- Query keys vivem em `src/features/cart/query-keys.ts` e identificam visitante ou proprietário. Logout descarta o cache de carrinho da conta; a sessão seguinte consulta apenas seu próprio carrinho.
- Totais do resumo vêm de `POST /api/cart/quote`. Não calcule subtotais oficiais na interface.
- “Conectar e finalizar” abre o modal de autenticação no desktop; no mobile navega para a tela dedicada e preserva `returnTo`/cupom. A autenticação deve manter os itens e quantidades de ambos os carrinhos.

### Checkout e pedidos

- `CheckoutDraft`, `QuoteRevision`, pedido, snapshot e recibo são contratos tipados em `src/types`.
- O checkout lista todos os itens e quantidades do carrinho. Use a mesma cotação sem filtro de rede do carrinho para que subtotal, desconto, taxa e total coincidam. A rede selecionada identifica a carteira/conexão de pagamento; cada NFT mantém sua própria rede no pedido/recibo. O seletor deve listar todas as carteiras cadastradas; escolher uma sincroniza rede e provedor, sem filtrar carteiras pela rede dos NFTs. Uma mudança de preço/disponibilidade exige nova revisão; confirmação fica bloqueada com formulário inválido ou cotação obsoleta. No mobile, avançar para pagamento conecta a carteira selecionada via API simulada; no desktop, a conexão ocorre ao confirmar a compra. Falha/recusa deve aparecer sem criar o pedido.
- Desktop: ordem dos campos do Figma — nome de exibição/usuário; rede/nome do perfil; endereço de carteira/endereço ENS ou secundário opcional; tipo de carteira/código de indicação; e-mail/nome ENS; observação opcional.
- O campo `Nome ENS` é inicializado pelo ENS da carteira selecionada, com fallback para o ENS do perfil, e acompanha a carteira quando sua rede ou seleção muda.
- Mobile: preservar os dados obrigatórios em uma etapa própria e, depois, apresentar a composição de carteira conectada, provedores, total e confirmação do frame mobile.
- ENS e código de indicação são obrigatórios conforme contrato/validação atual. Não preencha código fictício automaticamente; o usuário/teste deve informar um valor válido.
- Carteira cadastrada, rede selecionada e provedor de conexão são conceitos distintos. A conexão é uma simulação via API, não uma integração real de blockchain.
- Ao encaminhar o usuário do checkout para cadastrar carteira, preserve rede/cupom em search validado e ofereça retorno ao checkout no mobile.
- O resumo reutiliza `CartItemRow` em variante somente leitura. Use a resposta do quote para subtotal, desconto, taxa e total.
- Idempotência recupera a mesma tentativa após timeout; a reutilização da chave com payload diferente é conflito. Confirmação/recusa são estados terminais e o recibo é um snapshot imutável.
- A confirmação desktop é um modal centralizado conforme `order-confirmation-desktop-transaction-receipt-modal.png`: cabeçalho de agradecimento, resumo da transação, tabela de NFTs/quantidades/valores, taxa, total e ação do explorer. A versão mobile deve manter essa informação legível e responsiva.
- Eventos `order.updated` têm identidade/versão e são reconciliados via REST após reconexão; eventos antigos/duplicados não podem regredir o pedido.

## Tipagem, schemas e documentação de código

- Prefira inferência para configurações locais homogêneas. Use `as const`/`satisfies` quando houver ganho verificável na preservação/validação dos literais.
- Tipos nomeados são apropriados para contratos entre camadas e APIs públicas de componentes. Não crie tipos/abstrações redundantes para listas simples.
- Não transforme campos de formulários semanticamente diferentes em tuplas/arrays e `.map()` só para reduzir linhas. Mantenha marcação explícita quando isso melhora leitura, label, validação ou ordem de layout.
- Use React Hook Form + Zod para formulários de domínio. Schemas do cliente melhoram feedback e handlers MSW validam de novo no limite do serviço.
- Use JSDoc em utilitários de domínio exportados quando unidade, efeitos, erros ou contrato não forem óbvios. Não comente código trivial.
- Valores ETH são strings decimais. Cálculos usam wei inteiro (`BigInt`) nos utilitários existentes; não use `number`, `parseFloat` ou ponto flutuante para dinheiro.

## Primitivas e convenções de UI

Antes de criar HTML/Radix novo, procure o wrapper local em `src/components/ui`. Os wrappers disponíveis incluem:

`Button`, `Input`, `Select`, `Textarea`, `FieldLabel`, `FieldError`, `ToggleGroup`, `Tabs`, `Slider`, `Dialog`, `Sheet`, `Popover`, `Tooltip`, `Badge`, `Breadcrumb`, `Pagination`, `Carousel`, `Separator`, `Skeleton`, `RatingStars` e `UnavailableAction`.

- Features devem consumir wrappers; não importar Radix diretamente se houver wrapper local.
- Use `Link` para navegação interna, `<a>` para destino externo real e `<button>`/`Button` para ações. Use HTML semântico para estrutura, listas e metadados.
- Não use `href="#"`, botão nativo sem motivo quando existe `Button`, controle falso ou texto de sucesso sem mutation confirmada.
- `Input` é o wrapper para inputs tipados, inclusive arquivo; `PasswordInput` compartilhado fica na feature de autenticação.
- Reutilize componentes de domínio existentes (por exemplo `NftCard`, `CartItemRow`, carrossel de recomendações) em vez de duplicar aparência e comportamento.
- Use tokens existentes e variantes locais coerentes. `src/index.css` fica restrito a fontes, tokens, reset/base, acessibilidade e animações globais.
- Não use arrays de tuplas ou maps de configuração para blocos heterogêneos cujo conteúdo precise de markup, semântica ou estado diferente.

## Responsividade e acessibilidade

- Desktop e mobile podem ter composições distintas; não reduza o desktop por escala. Consulte ambos os frames quando existirem.
- Valide larguras de 390 × 844, 768 × 1024 e 1440 × 900; evite overflow e preserve conteúdo com zoom.
- Todo controle tem nome acessível, foco visível e suporte a teclado. Labels, `aria-invalid`, `aria-describedby` e feedback de mutation precisam refletir o estado real.
- Imagens informativas têm `alt`; thumbnails redundantes podem usar `alt=""` com contexto acessível ao redor.
- Loading preserva geometria com skeleton; erros oferecem retry; vazio, indisponível e 404 são estados distintos.
- Respeite `prefers-reduced-motion`; estado não deve depender apenas da cor.

## Mocks, reset e cenários

- Fixtures determinísticas vivem em `src/mocks/fixtures`; estado mutável vive em `src/mocks/state`.
- Adicione/alterе um handler de recurso para qualquer mutation/erro novo. Reutilize contratos e códigos estáveis.
- O reset deve limpar sessão, conta, favoritos, carrinhos e pedidos entre testes, sem depender de ordem global.
- Socket.IO deve usar `socket.io-client`; após reconexão, reconcilie recursos ativos com REST e limpe listeners no cleanup.
- Mocks de pagamento e carteira são demonstrações determinísticas. Não alegue transação blockchain ou persistência de produção.

## Testes e comandos

Teste resultados observáveis, semântica acessível e cenários relevantes. Use `--grep`, arquivo/projeto Playwright específicos para validação focada; execute toda a suíte ao fechar uma fase ou quando solicitado. Mudanças visuais relevantes exigem comparação com o frame e manutenção consciente dos baselines, não apenas atualização automática das imagens.

A auditoria atual encontrou Performance Lighthouse mobile abaixo da meta e diferenças nas baselines visuais. O responsável aceitou manter esses resultados na entrega atual, mas isso não autoriza regressões futuras nem atualização automática dos snapshots: compare mudanças com os frames canônicos e consulte o roadmap. A aplicação já possui deploy público; não altere configuração, projeto ou provedor de hospedagem sem solicitação explícita.

```bash
npm run typecheck
npm run lint:check
npm run build
npx playwright test --project=chromium-desktop --grep "termo do teste"
npx playwright test --project=chromium-mobile --grep "termo do teste"
npm run test:e2e
```

`npm run lint` modifica arquivos (Prettier + correções ESLint); `npm run lint:check` não modifica. Para finalizar uma fase, siga os critérios do README e do roadmap, incluindo desktop/mobile, falhas e regressão visual proporcionais.

## Definição de pronto

Uma mudança está pronta somente quando respeita a arquitetura e o Figma aplicável, mantém os contratos/tipos coerentes, cobre loading/erro/vazio quando necessário, não vaza dados de sessão, passou pelas validações direcionadas e atualizou documentação diretamente relacionada. Não declare cobertura, conformidade, Lighthouse ou sucesso de teste sem execução correspondente.
