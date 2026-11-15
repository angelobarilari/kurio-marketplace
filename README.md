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
| Testes e qualidade    | Vitest, Playwright e Lighthouse                           |
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
5. Cadastre uma carteira no perfil e prossiga por `/checkout`. Preencha os campos obrigatórios, incluindo o código de indicação (por exemplo, `TESTE10`), e confirme até o pedido e o recibo simulados.

Os dados ficam no backend MSW simulado e podem persistir no armazenamento do navegador para permitir refresh e retomada dos fluxos. Nenhuma compra ou conexão blockchain real é executada.

Para uma conta nova, exemplos válidos de demonstração são: rede `Ethereum`, endereço `0x1111111111111111111111111111111111111111`, provedor `MetaMask`, nome ENS `teste.eth` e indicação `TESTE10`. Esses valores servem apenas ao ambiente simulado.

## Contas e cenários simulados

Os botões sociais são locais e determinísticos: Google autentica como Nova Sato (`nova@kurio.example`) e Facebook como Caio Mendes (`caio@kurio.example`). Para testar senha, crie uma conta na própria tela de cadastro; não há senha padrão documentada ou armazenada em claro.

Selecione um cenário antes de abrir ou recarregar a tela:

```js
localStorage.setItem('kurio:mock-scenario', 'checkout-price-changed')
location.assign('/checkout')
```

| Grupo               | Cenários                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo e detalhe  | `catalog-empty`, `catalog-error`, `catalog-slow`, `catalog-out-of-order`, `detail-error`, `detail-slow`, `detail-realtime-slow`, `nft-unavailable`, `editions-sold-out`                      |
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

Os testes de regras e de integração usam Vitest com TypeScript. `tests/unit/` reúne conversão ETH/wei, ordenação e parsers da URL; `tests/integration/` separa carrinho, pedidos, conta/sessão, cache e handlers MSW por domínio. Fixtures e isolamento de estado ficam em `tests/support/`. A configuração executa cada arquivo isoladamente e reinicia armazenamento e estado antes de cada teste de integração. Não exige navegador ou servidor de desenvolvimento.

| Comando                                | Uso                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:unit`                    | Regras isoladas, sem gerar ou substituir o relatório consolidado.                                                           |
| `npm run test:integration`             | Estado dos domínios e contratos HTTP/MSW, sem substituir o consolidado.                                                     |
| `npm run test:checks`                  | Executa ambos os projetos e gera `docs/quality/vitest-results.xml` em JUnit.                                                |
| `npm run test:coverage`                | Executa Vitest e Playwright; exige 80% nos quatro indicadores combinados.                                                   |
| `npm run test:coverage:vitest`         | Executa os projetos unit e integration; diagnóstico Vitest-only, sem threshold próprio.                                     |
| `npm run test:coverage:refresh-vitest` | Atualiza Vitest + combinado reutilizando o último mapa Playwright; use só se código, dependências e inputs E2E não mudaram. |
| `npm run test:coverage:report`         | Regera os relatórios por camada e combinado a partir dos mapas JSON versionados.                                            |
| `npm run test:watch`                   | Reexecuta os testes Vitest relacionados às alterações durante o desenvolvimento.                                            |
| `npm run typecheck:tests`              | Verifica a tipagem estrita dos testes, helpers e configuração.                                                              |

Para filtrar um arquivo, use `npm run test:unit -- tests/unit/lib/eth.test.ts`; para filtrar pelo nome do caso, acrescente `-t "nome"`. Vitest e Playwright têm responsabilidades diferentes: Vitest cobre regras e integrações locais; Playwright cobre jornadas no browser. O percentual de 80% pertence à união dos mapas, não a cada ferramenta. Coverage prova execução, não suficiência das assertions. O comando `test:coverage:refresh-vitest` não executa E2E e só é válido quando `src/`, dependências, testes e configurações de browser/build permanecem iguais à última execução completa. Consulte [resultados](./docs/quality/RESULTS.md), [auditoria](./docs/quality/AUDIT.md) e o [roadmap de testes](./docs/quality/TESTING-ROADMAP.md).

`npm run test:core` executa o recorte complementar de resiliência do checkout em desktop/mobile: cliques repetidos, idempotência, isolamento de pedidos, estados terminais, refresh/reconexão e recuperação de falhas. O comando não substitui a suíte completa. Resultados e evidências estão em [RESULTS.md](./docs/quality/RESULTS.md).

| Comando                                                         | Uso                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run typecheck`                                             | Verifica os tipos TypeScript.                                                         |
| `npm run lint:check`                                            | Verifica Prettier e ESLint sem alterar arquivos.                                      |
| `npm run build`                                                 | Gera a build e os documentos HTML pré-renderizados elegíveis.                         |
| `npm run test:e2e -- --project=chromium-desktop --grep "termo"` | Executa um recorte Playwright direcionado.                                            |
| `npm run test:e2e`                                              | Executa a matriz Playwright completa.                                                 |
| `npm run test:visual`                                           | Executa todas as comparações visuais, incluindo conta.                                |
| `npm run test:report`                                           | Abre o relatório HTML da última execução local.                                       |
| `npm run test:preview`                                          | Valida a build em produção, incluindo login com bootstrap atrasado; usa a porta 4176. |
| `npm run audit:lighthouse:matrix`                               | Executa três medições Lighthouse por rota e perfil, após `npm run build`.             |
| `npm run audit:lighthouse:prerendered`                          | Mede as rotas pré-renderizadas; exige build com mocks habilitados.                    |

Na primeira execução dos testes, instale o navegador gerenciado pelo Playwright:

```bash
npx playwright install chromium
```

O Playwright cobre Chromium desktop (1440 × 900), tablet (768 × 1024) e mobile (390 × 844). Os resultados, a cobertura das 12 jornadas e o relatório de entrega estão em [Resultados e evidências](./docs/quality/RESULTS.md). A suíte completa inclui os testes visuais. Capturas de falha e traces são preservados automaticamente quando um teste falha.

A matriz Lighthouse inicia o Vite Preview, grava os 12 relatórios HTML e 12 JSON em `docs/performance/lighthouse/current/` e atualiza as medianas e condições em `docs/performance/LIGHTHOUSE.md`. Execute depois do build, com a porta `4173` livre e sem testes ou outras auditorias simultâneas. Consulte [Lighthouse](./docs/performance/LIGHTHOUSE.md) para metas, condições e leitura dos resultados. A auditoria adicional `audit:lighthouse:prerendered` cobre outras rotas na porta `4175` e salva experimentos locais em `reports/lighthouse/`; ela não substitui a matriz exigida.

`npm run build` também gera HTML estático para as rotas aplicáveis. Para incluir a homepage e os detalhes dos NFTs de demonstração, configure `VITE_ENABLE_MOCKS=true` no ambiente de build (no setup local, `.env` já vem com esse valor). Páginas privadas recebem apenas sua estrutura inicial; sessão, carrinho, carteira e pedido são carregados no cliente. Isso é pré-renderização estática de build, não SSR dinâmico.

## Documentação

- [Teste técnico original e requisitos de avaliação](./TECHNICAL-CHALLENGE.md)
- [Arquitetura, APIs, eventos e decisões técnicas](./ARCHITECTURE.md)
- [Roadmap e auditoria de requisitos](./IMPLEMENTATION-ROADMAP.md)
- [Guia de implementação e convenções](./AI-PROJECT-GUIDE.md)
- [Inventário dos frames do Figma](./docs/references/figma/README.md)
- [Resultados de qualidade, cobertura E2E e evidências de entrega](./docs/quality/RESULTS.md)
- [Procedimento de auditoria, escopo e reprodução](./docs/quality/AUDIT.md)
- [Roadmap de testes, metas por camada e fases de expansão](./docs/quality/TESTING-ROADMAP.md)
- [Resultados e próximos passos Lighthouse](./docs/performance/LIGHTHOUSE.md)

## Estado da entrega

Endereços de referência da entrega: [repositório](https://github.com/angelobarilari/kurio-marketplace) e [aplicação](https://kurio-marketplace-two.vercel.app). A publicação está ativa; o hash da fonte e os fluxos públicos verificados estão registrados em [RESULTS.md](./docs/quality/RESULTS.md), junto às limitações ainda abertas.

Os resultados e limites da validação local e da URL publicada estão em [RESULTS.md](./docs/quality/RESULTS.md), as métricas e metas Lighthouse em [LIGHTHOUSE.md](./docs/performance/LIGHTHOUSE.md) e a correspondência com os requisitos no [checklist de entrega](./IMPLEMENTATION-ROADMAP.md).
