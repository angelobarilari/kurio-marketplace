# Kurio — Marketplace de NFTs

Marketplace responsivo de NFTs construído para o teste técnico. A aplicação cobre descoberta, detalhe e compra de NFTs, carrinho, autenticação, perfil, carteiras, checkout e recibo. A interface usa dados e integrações simulados; não envia transações reais nem conecta carteiras ou provedores externos.

O enunciado original está preservado em [TECHNICAL-CHALLENGE.md](./TECHNICAL-CHALLENGE.md). O estado de conclusão e as pendências verificadas estão no [roadmap](./IMPLEMENTATION-ROADMAP.md).

## Stack

| Área                  | Tecnologia                                                |
| --------------------- | --------------------------------------------------------- |
| UI                    | React 19, TypeScript, Tailwind CSS 4 e shadcn/ui          |
| Rotas e estado remoto | TanStack Router e TanStack Query                          |
| REST e eventos        | Axios, MSW, Socket.IO Client e `@mswjs/socket.io-binding` |
| Formulários           | React Hook Form e Zod                                     |
| Testes e qualidade    | Playwright e Lighthouse                                   |
| Build                 | Vite                                                      |

## Executar localmente

Requer Node.js compatível com a versão do Vite e npm. O projeto funciona sem backend privado.

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

`.env.example` configura mocks no navegador e no build de demonstração:

| Variável            | Valor local   | Finalidade                                               |
| ------------------- | ------------- | -------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`        | Ativa os handlers MSW.                                   |
| `VITE_API_URL`      | `/api`        | Mantém chamadas REST na origem da aplicação.             |
| `VITE_SOCKET_URL`   | `same-origin` | Usa a mesma origem para o transporte Socket.IO simulado. |

Para criar uma build de produção e servi-la localmente:

```powershell
npm run build
npm run preview
```

## Contas e cenários simulados

Os botões sociais são locais e determinísticos: Google autentica como Nova Sato (`nova@kurio.example`) e Facebook como Caio Mendes (`caio@kurio.example`). Para testar senha, crie uma conta na própria tela de cadastro; não há senha padrão documentada ou armazenada em claro.

Selecione um cenário antes de abrir ou recarregar a tela:

```js
localStorage.setItem('kurio:mock-scenario', 'checkout-price-changed')
location.assign('/checkout')
```

| Grupo               | Cenários                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo e detalhe  | `catalog-empty`, `catalog-error`, `catalog-out-of-order`, `detail-error`, `nft-unavailable`, `editions-sold-out`                                                                             |
| Carrinho e cotação  | `cart-slow`, `cart-offline`, `cart-error`, `cart-server-error`, `cart-client-error`, `cart-out-of-order`, `cart-mutation-error`, `quote-slow`, `quote-error`                                 |
| Conta e favoritos   | `favorite-error`, `social-auth-error`, `session-expired`                                                                                                                                     |
| Carteira e checkout | `wallet-connect-offline`, `wallet-connect-rejected`, `session-expired-during-checkout`, `checkout-coupon-expired`, `checkout-price-changed`, `checkout-edition-sold-out`, `payment-declined` |
| Pedidos e realtime  | `order-pending`, `order-timeout-before-create`, `order-timeout-after-create`, `order-duplicate-events`, `cart-realtime-price`, `cart-realtime-sold-out`, `socket-offline`                    |

`KURIO10` é o cupom válido de demonstração, `EXPIRADO` representa um cupom expirado e qualquer outro código não vazio é inválido. `quote-slow` e `quote-error` permitem testar carregamento e recuperação da cotação.

Para voltar aos dados simulados iniciais, remova o cenário e faça o reset do backend MSW:

```js
localStorage.removeItem('kurio:mock-scenario')
await fetch('/api/mock/reset', { method: 'POST' })
location.assign('/')
```

O reset restaura sessão, contas, favoritos, catálogo, carrinhos e pedidos. O cenário armazenado no navegador deve ser removido separadamente.

## Comandos

| Comando                                                         | Uso                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run typecheck`                                             | Verifica os tipos TypeScript.                                             |
| `npm run lint:check`                                            | Verifica Prettier e ESLint sem alterar arquivos.                          |
| `npm run build`                                                 | Gera a build de produção.                                                 |
| `npm run test:e2e -- --project=chromium-desktop --grep "termo"` | Executa um recorte Playwright direcionado.                                |
| `npm run test:e2e`                                              | Executa a matriz Playwright completa.                                     |
| `npm run test:visual`                                           | Executa as regressões visuais.                                            |
| `npm run audit:lighthouse:matrix`                               | Executa três medições Lighthouse por rota e perfil, após `npm run build`. |

O Playwright cobre Chromium desktop (1440 × 900), tablet (768 × 1024) e mobile (390 × 844). A suíte inclui testes funcionais e regressões por screenshots. As diferenças visuais remanescentes foram aceitas pelo responsável porque os frames de referência do Figma têm problemas conhecidos; isso não significa equivalência pixel a pixel nem autorização para atualizar baselines em lote. A matriz Lighthouse inicia um Vite Preview local e salva relatórios HTML/JSON em `reports/lighthouse/phase-6/`, além das medianas em `docs/performance/LIGHTHOUSE-PHASE-6.md`. Não mantenha outro servidor usando a porta `4173` durante essas execuções.

## Documentação

- [Teste técnico original e requisitos de avaliação](./TECHNICAL-CHALLENGE.md)
- [Arquitetura, APIs, eventos e decisões técnicas](./ARCHITECTURE.md)
- [Roadmap e auditoria de requisitos](./IMPLEMENTATION-ROADMAP.md)
- [Guia de implementação e convenções](./AI-PROJECT-GUIDE.md)
- [Inventário dos frames do Figma](./docs/references/figma/README.md)
- [Resultados Lighthouse](./docs/performance/LIGHTHOUSE.md) e [matriz da Fase 6](./docs/performance/LIGHTHOUSE-PHASE-6.md)

## Estado da entrega

A aplicação está publicada no Vercel: [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app). O deploy usa dados e autenticação simulados; não envia transações reais nem conecta serviços externos. As diferenças visuais do Playwright foram aceitas devido a problemas nos frames Figma, e a pontuação Lighthouse atual será mantida sem novas otimizações. A navegação manual por teclado foi validada pelo responsável. Consulte o roadmap para o estado da entrega.
