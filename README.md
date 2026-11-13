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

## Pré-requisitos

- Node.js `20.19+` ou `22.12+` (`^20.19.0 || >=22.12.0`).
- npm, incluído na instalação do Node.js.
- Git, apenas se o projeto for obtido por clone.

O projeto funciona sem backend, credenciais privadas, carteira real ou serviço externo.

## Início rápido

```bash
git clone https://github.com/angelobarilari/kurio-marketplace.git
cd kurio-marketplace
npm ci
```

Crie o arquivo local de ambiente a partir do exemplo.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Abra a URL exibida pelo Vite no terminal, normalmente `http://localhost:5173`.

Se a porta padrão estiver ocupada, o Vite selecionará outra e informará o endereço correto. Alterações no código são recarregadas automaticamente.

## Ambiente local

`.env.example` configura mocks no navegador e no build de demonstração:

| Variável            | Valor local   | Finalidade                                               |
| ------------------- | ------------- | -------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`        | Ativa os handlers MSW.                                   |
| `VITE_API_URL`      | `/api`        | Mantém chamadas REST na origem da aplicação.             |
| `VITE_SOCKET_URL`   | `same-origin` | Usa a mesma origem para o transporte Socket.IO simulado. |

Para criar uma build de produção e servi-la localmente:

```bash
npm run build
npm run preview
```

O preview normalmente fica disponível em `http://localhost:4173`. A build é gerada em `dist/`.

## Roteiro rápido de avaliação

1. Acesse `/` para testar busca, filtros, ordenação e paginação do catálogo.
2. Abra um NFT para testar galeria, edição, quantidade, favorito e inclusão no carrinho.
3. Acesse `/cart`, altere quantidades e use o cupom `KURIO10`.
4. Crie uma conta pelo fluxo de cadastro ou use o login social simulado.
5. Cadastre uma carteira no perfil e prossiga por `/checkout` até o pedido e o recibo simulados.

Os dados ficam no backend MSW simulado e podem persistir no armazenamento do navegador para permitir refresh e retomada dos fluxos. Nenhuma compra ou conexão blockchain real é executada.

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

Na primeira execução dos testes, instale o navegador gerenciado pelo Playwright:

```bash
npx playwright install chromium
```

O Playwright cobre Chromium desktop (1440 × 900), tablet (768 × 1024) e mobile (390 × 844). A suíte inclui testes funcionais e regressões por screenshots. A execução completa mais recente registrou 179 casos aprovados, 91 ignorados por viewport e nove diferenças visuais conhecidas. Essas diferenças foram aceitas pelo responsável por inconsistências nos frames do Figma; isso não significa equivalência pixel a pixel nem autorização para atualizar baselines em lote.

A matriz Lighthouse inicia um Vite Preview local e salva relatórios HTML/JSON em `reports/lighthouse/phase-6/`. Essa pasta é um artefato local ignorado pelo Git; as medianas versionadas ficam em `docs/performance/LIGHTHOUSE-PHASE-6.md`. Não mantenha outro servidor usando a porta `4173` durante essas execuções.

## Documentação

- [Teste técnico original e requisitos de avaliação](./TECHNICAL-CHALLENGE.md)
- [Arquitetura, APIs, eventos e decisões técnicas](./ARCHITECTURE.md)
- [Roadmap e auditoria de requisitos](./IMPLEMENTATION-ROADMAP.md)
- [Guia de implementação e convenções](./AI-PROJECT-GUIDE.md)
- [Inventário dos frames do Figma](./docs/references/figma/README.md)
- [Resultados Lighthouse](./docs/performance/LIGHTHOUSE.md) e [matriz da Fase 6](./docs/performance/LIGHTHOUSE-PHASE-6.md)

## Estado da entrega

O código-fonte está publicado no repositório público [angelobarilari/kurio-marketplace](https://github.com/angelobarilari/kurio-marketplace), e a aplicação está disponível em [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app).

As diferenças visuais conhecidas e a decisão de manter o Lighthouse mobile atual estão registradas no roadmap. A rodada manual completa de teclado foi validada pelo responsável; foco, semântica, reflow e cenários automatizáveis também possuem cobertura Playwright.
