# Roadmap de implementação — Kurio

> Backlog executável; os requisitos originais estão em [TECHNICAL-CHALLENGE.md](./TECHNICAL-CHALLENGE.md), a execução do projeto em [README.md](./README.md) e as decisões arquiteturais em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Resumo executivo

**Estado atual:** as Fases 1 a 6 estão concluídas e a aplicação está publicada no Vercel em [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app). Os diffs visuais Playwright foram aceitos porque os frames Figma contêm problemas conhecidos; a pontuação Lighthouse atual será mantida sem novas otimizações; e o responsável confirmou a validação manual de teclado.

### Evidência atual

- 54 fixtures, nove itens por página e seis páginas.
- Busca, categoria, rede, preço, ordenação e página persistem na URL.
- Facetas contextuais, respostas obsoletas e paginação durante loading possuem cobertura.
- `GET /api/nfts/:id` e `getNft(id)` já existem com 404.
- Playwright está configurado para 390, 768 e 1440 px.
- Catálogo e detalhe possuem testes comportamentais nos três viewports, cenários MSW determinísticos e baselines desktop/mobile.
- Na validação direcionada mais recente, os fluxos de adicionar ao carrinho, preço/disponibilidade realtime, checkout/recibo, guards de rota, foco por teclado no carrinho e foco do diálogo passaram; as baselines de carrinho e checkout/recibo também passaram.
- As baselines visuais antigas ainda divergem em algumas rotas. O responsável aceitou esses diffs porque os frames Figma têm problemas conhecidos (por exemplo, grade mobile desalinhada e retrato sobreposto indevido no hero); os snapshots não foram atualizados em lote. Isso é um aceite explícito das divergências visuais, não uma afirmação de correspondência pixel a pixel.
- Na revisão final da home mobile, os cards foram alinhados por linha e o retrato sobreposto do hero foi removido; os indicadores continuam funcionais somente no mobile. Testes direcionados de alinhamento, overflow e hero passaram nos viewports aplicáveis.
- Cadastro, login, expiração, perfil, avatar, senha, carteiras, favoritos, logout/troca de conta e merge do carrinho possuem cobertura E2E; telas de autenticação, perfil e carteiras têm baselines desktop/mobile.
- A revalidação do carrinho autenticado limita quantidade ao estoque e ao máximo por pedido; repetir a mesma chave de merge não duplica itens.
- Na execução completa anterior às últimas verificações direcionadas, Playwright executou 279 casos: 178 aprovados, 91 ignorados por viewport e 10 falhas. Nove falhas foram diferenças de screenshots (home, detalhe, carrinho e checkout em desktop/mobile, e login desktop), aceitas pelo responsável devido aos problemas conhecidos nas referências Figma; a falha de favorito no tablet passou ao ser repetida isoladamente. Não atualizar baselines em lote.
- Após a matriz, as verificações direcionadas do cenário de latência diferencial no catálogo, retomada de favoritos no tablet e prioridade de imagem inicial passaram.
- A validação em Vite Preview concluiu uma compra até `/orders/:orderId`; os deep links `/checkout` e `/orders/order-protected` também foram verificados e preservam o destino ao redirecionar para login.
- `npm run typecheck`, `npm run build` e a matriz Lighthouse foram executados. O build passa; o chunk do mock do navegador tem ~476 KiB. A matriz mais recente marcou Performance 97/98 no desktop e 68/72 no mobile. A meta original mobile ≥90 não foi atingida, mas o responsável decidiu manter a pontuação atual sem novas otimizações.
- Na validação direcionada após as otimizações de renderização inicial e prioridade das imagens visíveis, passaram 60 testes aplicáveis de catálogo e nove verificações de detalhe nos três viewports. A paginação aguarda a revalidação inicial antes de interagir, e mantém latência determinística para exercitar o estado de carregamento.
- A limpeza de filtros ativos tem saída visível na sidebar, nos filtros mobile e no estado sem resultados; o acesso à conta está disponível no menu desktop e na navegação/área de conta mobile.
- Favoritar sem sessão preserva o contexto com modal no desktop e página dedicada no mobile; o favorito solicitado é enviado após autenticação confirmada.
- O cenário `catalog-out-of-order` produz respostas determinísticas em ordem inversa à sequência de filtros e possui teste pelo service worker MSW.

### Limites intencionais após a Fase 5

- APIs, autenticação, carteira e pagamento são simulados; integração real com blockchain e gateway não faz parte do escopo.
- A navegação manual por teclado foi validada pelo responsável; foco de diálogo, erros associados, zoom e reflow também possuem cobertura automatizada.

## Auditoria do `TECHNICAL-CHALLENGE.md`

| Seção do teste técnico                     | Estado                        | Evidência / pendência                                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–3 — Escopo, stack e telas                | Implementado funcionalmente   | React/TypeScript, Router, Query, Axios, MSW, Socket.IO, Tailwind/shadcn e as rotas do escopo estão presentes. Diffs visuais conhecidos foram aceitos devido a problemas nos frames Figma.                                             |
| 4–5 — Integração, cache e contratos REST   | Implementado                  | APIs agrupadas por feature, schemas tipados, estado de sessão/carrinho por usuário, erros, idempotência e decisões de cache documentadas em `ARCHITECTURE.md`.                                                                        |
| 6 — MSW e falhas                           | Implementado                  | Fixtures/reset e cenários de sucesso, vazio, latência diferencial/ordem, falhas HTTP/conexão, expiração, cupom, disponibilidade e timeouts; cobertura por handlers e testes direcionados.                                             |
| 7 — Socket.IO                              | Implementado e testado        | O cliente real `socket.io-client` atravessa o binding MSW; evento atualizado, versão antiga, duplicatas, reconexão e reconciliação REST têm cobertura Playwright.                                                                     |
| 8 — Figma, responsividade e acessibilidade | Validado com aceite visual    | Acessibilidade Lighthouse foi 100 nos quatro perfis e há testes nos viewports previstos. Diffs visuais foram aceitos devido a erros conhecidos no Figma; a revisão manual de teclado foi confirmada pelo responsável.                 |
| 9 — Playwright                             | Aceito com diferenças visuais | A matriz funcional teve uma falha de favorito no tablet que passou isoladamente. As nove divergências de screenshot da execução completa foram aceitas pelo responsável devido a problemas no Figma; não regenerar baselines em lote. |
| 10 — Lighthouse                            | Medido; manter como está      | Performance desktop 97/98, mobile 68/72 (meta original ≥90); LCP mobile 6,2 s/5,4 s. O responsável decidiu manter a pontuação atual, sem novas otimizações nesta etapa. Acessibilidade permanece 100.                                 |
| 11 — Critérios de avaliação                | Concluído com aceites         | Não é uma implementação separada; os diffs visuais e a pontuação Lighthouse foram aceitos, a validação manual de teclado foi confirmada e a aplicação está publicada.                                                                 |
| 12 — Entrega e deploy                      | Publicado                     | Aplicação publicada no Vercel: [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app). Build de produção concluído; página inicial e detalhe de NFT carregaram publicamente.                                    |
| 13–14 — Comandos e documentação            | Atualizado                    | O README do projeto agora contém execução, variáveis, contas/scenarios e comandos; o enunciado original está em `TECHNICAL-CHALLENGE.md`; arquitetura, guia e inventário Figma foram atualizados.                                     |

### Aceites registrados

1. As divergências visuais conhecidas do Playwright foram aceitas pelo responsável porque os frames Figma têm erros/inconsistências; manter os snapshots atuais e não atualizá-los em lote.
2. A meta Lighthouse Performance mobile ≥90 não foi atingida (68 na home e 72 no detalhe), mas o responsável decidiu manter a pontuação atual sem novas otimizações nesta etapa.

## Padrões obrigatórios para próximas páginas

As regras de adoção de primitivas shadcn/ui estão centralizadas em [AI-PROJECT-GUIDE.md](./AI-PROJECT-GUIDE.md) e [ARCHITECTURE.md](./ARCHITECTURE.md).
O inventário dos frames recebidos está em [docs/references/figma/README.md](./docs/references/figma/README.md). Cada rota deve apontar para sua referência canônica nos testes visuais e na revisão de fidelidade.

- [x] Migrar controles existentes para `Select`, `Tabs`, `ToggleGroup`, `Popover`, `Tooltip`, `Dialog`, `Badge`, `Breadcrumb` e `Pagination` compartilhados.
- [x] Aplicar também `Separator`, `Sheet` e `Carousel`, incluindo os itens inicialmente classificados como opcionais.

- [x] Criar shell público compartilhado antes de duplicar header/footer em outra rota.
- Manter páginas em `src/routes` como composição; UI coesa em `src/features/<feature>/components`.
- Usar Router `Link` para navegação interna e Axios/MSW para todo dado remoto.
- Não importar fixtures na UI nem criar fallback de negócio dentro de componentes.
- Usar HTML semântico; não usar `href="#"`, `<br />` para layout ou elementos interativos falsos.
- Manter estado remoto em Query, estado navegável no Router e estado efêmero/local no componente.
- Tratar loading, atualização em segundo plano, erro, retry, vazio/404 e indisponibilidade.
- Preservar layout com skeletons e validar 390/768/1440, teclado, zoom e overflow.
- Usar tokens globais e variantes compartilhadas; CSS global não recebe estilos de componente.
- Adicionar E2E por comportamento e baseline visual das telas exigidas.

## Fase 1 — Homepage e catálogo

### Concluído

- [x] Estrutura feature-first para catálogo/home, mocks e infraestrutura.
- [x] Axios compartilhado, Query, Router search state e MSW de catálogo.
- [x] Busca, filtros combináveis, facetas contextuais, ordenação e preço exato em ETH.
- [x] Paginação em janela móvel com próxima página visível.
- [x] Skeletons, estados principais e cards responsivos.
- [x] Componentes de home extraídos; `App.css` removido e CSS restrito ao global.
- [x] Footer/header sem links falsos e semântica básica revisada.
- [x] Testes E2E comportamentais nos três viewports.

### Qualidade concluída junto da Fase 2

- [x] Adicionar cenários MSW/E2E de erro, retry, vazio e latência fora de ordem.
- [x] Criar baselines visuais da homepage.
- [x] Validar contraste, reflow/zoom e movimento reduzido automaticamente.
- [x] Consolidar a validação manual de teclado no checklist único de fechamento da Fase 2.
- [x] Reexecutar Lighthouse da homepage depois do shell compartilhado.

## Fase 2 — Detalhe do NFT (concluída)

### 2.0 — Fundação antes da tela

- [x] Extrair um shell público compartilhado para home e detalhe.
- [x] Definir comportamento da busca do header fora da home: navegar para `/?q=<termo>#catalog`.
- [x] Definir `/nfts/$nftId` e o boundary de 404 da própria rota.
- [x] Separar contrato leve de listagem (`NftSummary`) do contrato completo (`NftDetail`).
- [x] Modelar `NftMedia`, criador, `NftAttribute`, `NftEdition`, `NftRating` e `NftProvenance`.
- [x] Preservar `Nft` como alias temporário de `NftSummary` sem quebrar catálogo/realtime.
- [x] Fazer a fixture Emerald Ape completa e defaults determinísticos para os demais NFTs.
- [x] Atualizar `GET /api/nfts/:id` para devolver `NftDetail`; manter lista sem payload detalhado.
- [x] Criar query key/hook de detalhe com cancelamento por `AbortSignal`.
- [x] Cobrir acesso direto, navegação pelo card, 404 e comportamento principal.

### 2.1 — Estrutura visual do frame

- [x] Breadcrumb com destinos reais.
- [x] Galeria acessível: imagem principal, thumbnails, seleção por teclado e zoom em `Dialog`.
- [x] Resumo: nome/token, preço, avaliação e descrição curta.
- [x] Edições como opções tipadas, com estado selecionado e indisponibilidade.
- [x] Quantidade com mínimo 1 e máximo derivado de estoque/limite por pedido.
- [x] Metadados: token, coleção, atributos, rede, contrato e royalties.
- [x] Abas “Detalhes” e “Avaliações” com semântica/teclado adequados.
- [x] “Mais desta coleção” reutilizando summaries/cards compatíveis.
- [x] Skeleton com as mesmas dimensões do layout final.

### 2.2 — Responsividade e estados

- [x] Aplicar o frame mobile fornecido como referência.
- [x] Mobile: imagem antes do resumo, controles compactos e ações sem overflow.
- [x] Tablet: evitar duas colunas comprimidas; definir breakpoint pelo conteúdo.
- [x] Completar estados de indisponibilidade, edição esgotada, falha e retry; 404 já está coberto.
- [x] Reconciliar atualização de preço/disponibilidade durante a página aberta.
- [x] Validar foco, alt text, contraste, reflow/zoom e reduced motion automaticamente.
- [x] Cobrir automaticamente os comportamentos de teclado verificáveis; a rodada manual está centralizada no fechamento da fase.

### 2.3 — Limite funcional desta fase

- [x] “Comprar” permanece claramente indisponível até a Fase 3.
- [x] “Favoritar” permanece indisponível até sessão e API de favoritos.
- [x] Compartilhar usa destinos reais para LinkedIn, e-mail e X.
- [x] Avaliações permanecem somente leitura com dados do mock, sem simular envio.

### Critérios de saída da Fase 2

- [x] Card navega para `/nfts/$nftId`.
- [x] Refresh/acesso direto funcionam no dev server.
- [x] 404 do NFT é distinto do 404 global.
- [x] Edição e quantidade respeitam estoque e limites.
- [x] Evento novo atualiza detalhe sem regredir versão.
- [x] E2E desktop/mobile e baseline visual versionada passam.
- [x] Lighthouse de detalhe executado 3× por perfil; a medição histórica está em `docs/performance/LIGHTHOUSE.md` e a matriz mais recente da Fase 6 em `docs/performance/LIGHTHOUSE-PHASE-6.md`.

## Evolução de dados do detalhe

| Campo original | Estado atual | Implementação                                                                 |
| -------------- | ------------ | ----------------------------------------------------------------------------- |
| `image`        | Implementado | `gallery: NftMedia[]` com mídia e texto alternativo                           |
| `edition`      | Implementado | `editions: NftEdition[]` com estoque, preço e limite                          |
| `priceEth`     | Implementado | Summary e edição mantêm string decimal                                        |
| `available`    | Implementado | Booleano no summary, estoque por edição e fluxo completo de indisponibilidade |
| `rare`         | Implementado | Mantido no summary e representado também em atributos                         |
| inexistente    | Implementado | Resumo e descrição longa em parágrafos                                        |
| inexistente    | Implementado | Criador com ID e nome                                                         |
| inexistente    | Parcial      | Média e total existem; lista/paginação de avaliações não existe               |
| inexistente    | Implementado | Padrão, contrato, armazenamento e royalties                                   |
| inexistente    | Implementado | Summaries relacionados são resolvidos pelo mock                               |

## Fechamento da Fase 2

Todos os itens técnicos foram concluídos antes do início da Fase 3:

- [x] Completar estados determinísticos de erro, retry, NFT indisponível e edição esgotada.
- [x] Validar detalhe em tablet, foco, contraste, reflow/zoom, textos alternativos e movimento reduzido.
- [x] Criar baselines visuais versionadas de home e detalhe.
- [x] Executar Lighthouse de home e detalhe três vezes por perfil e documentar medianas, LCP, CLS e TBT.
- [x] Implementar e testar reconciliação REST após conexão/reconexão do Socket.IO.
- [x] Rodada manual de navegação por teclado validada pelo responsável do projeto.

## Fase 3 — Carrinho anônimo e cotação (concluída)

### 3.0 — Contratos e regras antes da interface

- [x] Definir **Cart**, **CartItem**, **CartOwner**, **CartQuote**, **CartTotals**, **Coupon** e erros tipados.
- [x] Identificar cada item pela combinação estável de **nftId** e **editionId**; não usar nome, imagem ou índice como identidade.
- [x] Manter preço e totais ETH como strings decimais; cálculos do mock usam wei inteiro.
- [x] Definir quantidade inteira com mínimo 1 e máximo igual ao menor valor entre estoque e **maxPerOrder**.
- [x] Modelar identidade de visitante desde o início para permitir merge futuro sem refazer o contrato.
- [x] Definir política de conflito para NFT indisponível, edição esgotada, quantidade acima do limite e preço alterado.
- [x] Documentar query keys, invalidação, retries e responsabilidades entre carrinho e cotação.

### 3.1 — API simulada e estado MSW

- [x] Criar estado canônico do carrinho em **src/mocks/state**, separado da UI.
- [x] Implementar **GET /api/cart**.
- [x] Implementar inclusão de item e comportamento para item/edição já existente.
- [x] Implementar alteração de quantidade e remoção de item.
- [x] Implementar **POST /api/cart/quote** como fonte de subtotal, desconto, taxa de rede e total.
- [x] Implementar aplicação e remoção de cupom com cenários válido, inválido e expirado.
- [x] Persistir o carrinho visitante após refresh sem armazenar regra de negócio em componentes.
- [x] Fazer **/api/mock/reset** restaurar também carrinho, cupons e cotações para um estado determinístico.
- [x] Adicionar cenários configuráveis de latência, erro 4xx/5xx, conexão indisponível e resposta fora de ordem.

### 3.2 — Query, mutations e integração

- [x] Criar API Axios e hooks TanStack Query para carrinho e cotação.
- [x] Implementar pelo menos uma mutation otimista com rollback, conforme o README.
- [x] Invalidar ou atualizar cache de forma coerente após inclusão, quantidade, remoção e cupom.
- [x] Tornar “Comprar NFT” funcional somente depois da mutation real existir.
- [x] Enviar **nftId**, **editionId** e quantidade selecionada pelo detalhe; a API revalida estoque e limite.
- [x] Substituir o contador fixo do header por valor derivado do carrinho remoto.
- [x] Fazer o ícone do header navegar para a rota do carrinho.
- [x] Preservar contexto e feedback acessível durante mutations e falhas.

### 3.3 — Rota e interface do carrinho

- [x] Registrar referências **cart-desktop-populated-summary-recommendations.png** e **cart-mobile-populated-coupon-totals.png**.
- [x] Criar rota e boundary do carrinho com acesso direto e refresh.
- [x] Manter a rota como composição e os blocos em **features/cart**.
- [x] Implementar lista de itens, edição, quantidade, remoção, cupom e resumo da cotação.
- [x] Desktop: implementar tabela com colunas NFT, preço unitário, quantidade/edição, total e remoção.
- [x] Desktop: manter resumo em coluna lateral com cupom, subtotal, desconto, taxa, total e ações.
- [x] Desktop: reutilizar carrossel de summaries em “Colecionadores também viram”, sem misturar recomendações ao carrinho.
- [x] Mobile: implementar cabeçalho próprio com voltar e título “Carrinho de NFTs”.
- [x] Mobile: transformar itens em cards compactos com imagem, edição, quantidade, total e remoção contextual.
- [x] Mobile: agrupar cupom e totais em painel inferior visualmente contínuo, sem ocultar conteúdo pelo safe area.
- [x] Criar estado vazio com retorno real ao mercado.
- [x] Criar skeleton com a geometria do conteúdo e shimmer compatível com movimento reduzido.
- [x] Tratar loading, atualização em segundo plano, erro/retry e conflitos de disponibilidade.
- [x] Validar 390, 768 e 1440 px, teclado/foco automatizável, zoom e ausência de overflow horizontal.
- [x] Não calcular subtotal, descontos, taxas ou total na interface.

### 3.4 — Preço, disponibilidade e tempo real

- [x] Fazer **nft.updated** atualizar catálogo, detalhe e item correspondente no carrinho.
- [x] Marcar visualmente preço alterado, edição esgotada ou quantidade inválida.
- [x] Solicitar nova cotação depois de mudança relevante.
- [x] Impedir avanço com cotação desatualizada ou em atualização.
- [x] Ignorar eventos duplicados ou antigos por versão.
- [x] Reconciliar carrinho e cotação por REST após reconexão.

### 3.5 — Testes e critérios de saída

- [x] Cobrir inclusão a partir do detalhe, item repetido e limite de quantidade.
- [x] Cobrir alteração, remoção, carrinho vazio e persistência após refresh.
- [x] Cobrir cupom válido, inválido, expirado e remoção de cupom.
- [x] Cobrir erro de mutation e rollback otimista.
- [x] Cobrir preço alterado e edição esgotada via Socket.IO real no cliente.
- [x] Cobrir skeleton, erro/retry e resposta obsoleta.
- [x] Adicionar regressão visual desktop/mobile do carrinho com dados estáveis.
- [x] Garantir lint, typecheck, build e suíte Playwright relevante aprovados.

Critério de saída: o visitante consegue adicionar, revisar e modificar itens com persistência e cotação coerente, mas o checkout continua protegido até sessão e conta existirem.

## Fase 4 — Conta, sessão, perfil e carteiras

### 4.0 — Contratos e isolamento

- [x] Padronizar formulários da fase com **React Hook Form + Zod**, mantendo schemas reutilizáveis entre desktop/mobile e mapeando erros REST aos campos sem duplicar regras na UI.
- [x] Definir **User**, **Session**, **AuthCredentials**, **RegistrationInput**, **Profile**, **Wallet** e erros tipados.
- [x] Criar pelo menos dois usuários fictícios com dados privados isolados.
- [x] Não armazenar senha em claro no estado persistido, fixtures expostas ou respostas.
- [x] Definir expiração, renovação/consulta da sessão e política de retry sem loops.
- [x] Fazer query keys privadas incluírem identidade da sessão quando necessário.
- [x] Limpar Query cache privado, listeners e subscriptions ao sair ou trocar usuário.
- [x] Preservar destino solicitado e contexto do carrinho para retomada após autenticação.

### 4.1 — REST, MSW e persistência

- [x] Implementar cadastro, login, consulta da sessão, logout e expiração.
- [x] Implementar conflito de e-mail/usuário e credenciais inválidas.
- [x] Implementar recuperação de senha simulada com resposta honesta e estado reproduzível.
- [x] Implementar consulta e atualização do perfil.
- [x] Implementar upload simulado, troca e remoção de avatar.
- [x] Implementar alteração de senha com senha atual, nova senha e confirmação.
- [x] Implementar consulta, cadastro e atualização de carteiras principal e secundária.
- [x] Persistir sessão, perfil e carteiras após refresh no backend simulado.
- [x] Fazer reset de cenário restaurar usuários, sessão, perfil, carteiras, favoritos, carrinhos e pedidos.

### 4.2 — Login e cadastro

- [x] Registrar referências **auth-login-mobile-email-password-social.png**, **auth-signup-mobile-credentials-social.png**, **auth-login-desktop-modal-marketplace-context.png** e **auth-signup-desktop-modal-marketplace-context.png**.
- [x] Desktop: usar Dialog acessível sobre o contexto atual, com fechamento, foco preso, Escape e retorno de foco.
- [x] Desktop: alternar login/cadastro sem perder valores indevidamente e sem criar dialogs aninhados.
- [x] Mobile: usar páginas dedicadas, com botão voltar e safe areas, preservando o mesmo contrato de formulário.
- [x] Login: e-mail, senha, mostrar/ocultar senha, recuperação e submit.
- [x] Cadastro: usuário, e-mail, senha, confirmação e submit.
- [x] Associar labels, descrições e mensagens de erro aos respectivos campos.
- [x] Desabilitar submit durante mutation e impedir envio duplicado.
- [x] Simular Google e Facebook somente por handlers reais; não aparentar autenticação sem resposta.
- [x] Retornar ao carrinho/checkout ou rota privada solicitada depois do sucesso.
- [x] Fazer merge idempotente do carrinho visitante após autenticação, respeitando estoque e limites.

### 4.3 — Perfil do colecionador

- [x] Registrar referência **profile-desktop-collector-data-avatar-password.png**.
- [x] Criar rota privada do perfil com acesso direto, refresh e redirecionamento para login quando necessário.
- [x] Extrair shell de conta compartilhado com navegação lateral e área de conteúdo.
- [x] Manter itens fora do escopo visíveis e desabilitados em todos os viewports, sem simular navegação funcional.
- [x] Implementar nome de exibição, usuário, e-mail, ENS e apelido público conforme contratos.
- [x] Implementar avatar com preview, validação de tipo/tamanho, alteração e remoção.
- [x] Separar mutation de dados do perfil da mutation de senha.
- [x] Validar senha atual, política da nova senha e confirmação.
- [x] Exibir sucesso e erros de forma acessível; persistir somente após resposta do mock.
- [x] Adaptar a rota para mobile mesmo sem frame específico, conforme exigência do README.

### 4.4 — Carteiras

- [x] Registrar referência **profile-desktop-wallet-management-primary-secondary.png**.
- [x] Implementar carteira principal e secundária com IDs estáveis.
- [x] Modelar nome de exibição, apelido, rede, endereço, tipo/provedor, ENS opcional e prioridade.
- [x] Validar formato de endereço de acordo com a rede simulada.
- [x] Permitir cadastrar, editar e definir carteira principal sem duplicar endereços indevidamente.
- [x] Definir comportamento de “igual à carteira principal” para dados secundários sem criar duas fontes divergentes.
- [x] Tratar conflito, validação, sessão expirada e falha transitória.
- [x] Adaptar consulta e edição de carteiras para mobile mesmo sem frame específico.

### 4.5 — Favoritos

- [x] Implementar consulta, inclusão e remoção de favoritos por usuário.
- [x] Aplicar mutation otimista com rollback se ainda não usada no carrinho.
- [x] Sincronizar estado entre card, detalhe e lista de interesse.
- [x] Garantir que logout/troca de usuário não exponha favoritos da sessão anterior.

### 4.6 — Testes e critérios de saída

- [x] Cobrir cadastro, conflito, login inválido/válido, recuperação, expiração, logout e troca de usuário.
- [x] Cobrir retorno ao fluxo anterior e merge do carrinho após login.
- [x] Cobrir atualização de perfil, avatar e senha, incluindo validações e refresh.
- [x] Cobrir cadastro/edição de carteiras e isolamento entre usuários.
- [x] Cobrir favoritos com falha de mutation e rollback.
- [x] Validar foco de Dialog, leitor de erros, zoom e ausência de overflow; o responsável também confirmou a rodada manual completa de teclado.
- [x] Criar regressão visual de login/cadastro desktop/mobile, perfil e carteiras.

Critério de saída: sessão, conta, perfil, carteiras e favoritos funcionam por API simulada, persistem corretamente e não vazam dados entre usuários.

## Fase 5 — Checkout, pedido e confirmação

### 5.0 — Contratos e máquina de estados

- [x] Definir **CheckoutDraft**, **QuoteRevision**, **Order**, **OrderItemSnapshot**, **OrderStatus**, **PaymentAttempt** e **Receipt**.
- [x] Estados mínimos do pedido: pendente, confirmado e recusado; confirmado/recusado são terminais.
- [x] Snapshot contém itens, edições, quantidades, preços, desconto, taxa, total, rede, carteira e dados necessários ao recibo.
- [x] Criar chave de idempotência por tentativa e detectar reutilização com payload diferente.
- [x] Diferenciar timeout antes da criação de timeout depois da criação do pedido.

### 5.1 — Pagamento e revisão

- [x] Registrar referências **checkout-desktop-collector-profile-wallet-order-summary.png** e **checkout-mobile-wallet-selection-total.png**.
- [x] Proteger checkout por sessão e preservar carrinho/cupom/destino durante autenticação.
- [x] Desktop: combinar formulário do colecionador com resumo dos NFTs e cotação atual.
- [x] Desktop: ordenar os campos conforme o Figma e indicar obrigatoriedade de nome de exibição, usuário, rede, perfil, carteira, tipo, indicação, e-mail e ENS; endereço secundário e observação são opcionais.
- [x] Validar no cliente e no handler os campos obrigatórios; não preencher código de indicação fictício automaticamente.
- [x] Mobile: usar etapa própria de dados seguida por composição de carteira conectada, troca de carteira, provedores, total e confirmação.
- [x] Separar carteira cadastrada, rede selecionada e provedor de conexão.
- [x] Simular conexão, recusa e desconexão de carteira.
- [x] Revalidar itens, preços, estoque, cupom e taxa antes da confirmação.
- [x] Exigir confirmação nova quando a revisão da cotação mudar.
- [x] Desabilitar confirmação enquanto dados estiverem inválidos, desatualizados ou em mutation.

### 5.2 — Criação e acompanhamento do pedido

- [x] Implementar endpoint idempotente de criação do pedido.
- [x] Implementar consulta de pedido por ID para recuperação após timeout, refresh e reconexão.
- [x] Implementar evento **order.updated** através do cliente Socket.IO.
- [x] Ignorar eventos antigos/duplicados por identidade e versão.
- [x] Reconciliar pedido pendente por REST depois de reconectar.
- [x] Preservar itens do carrinho em falha ou recusa.
- [x] Após confirmação, remover somente itens e quantidades comprados.

### 5.3 — Confirmação e recibo

- [x] Registrar referência **order-confirmation-desktop-transaction-receipt-modal.png**.
- [x] Exibir confirmação somente quando o backend simulado retornar pedido confirmado.
- [x] Usar apresentação responsiva coerente para desktop e mobile.
- [x] Exibir ID/transação, data, total, carteira, itens, edições/quantidades, taxa e total.
- [x] Manter recibo imutável após alterações posteriores de catálogo, preço ou perfil.
- [x] Link de explorer é simulado, mas tem destino coerente e não expõe dado real.
- [x] Manter acesso ao recibo pela rota do pedido após navegação/refresh.

### 5.4 — Falhas obrigatórias

- [x] Pagamento recusado com mensagem e ação recuperável.
- [x] Sessão expirada durante checkout com retorno ao mesmo contexto após login.
- [x] Carteira desconectada ou conexão recusada.
- [x] Preço alterado, cupom expirado ou edição esgotada antes da confirmação.
- [x] Clique repetido sem criar pedidos duplicados.
- [x] Timeout após criação com recuperação pelo mesmo ID/chave.
- [x] Interrupção Socket.IO durante pedido pendente e reconciliação posterior.

### 5.5 — Testes e critérios de saída

- [x] Cobrir compra completa do catálogo ao recibo confirmado.
- [x] Cobrir alteração de preço/disponibilidade durante checkout.
- [x] Cobrir recusa, clique repetido, idempotência e timeout recuperável.
- [x] Cobrir refresh/reconexão de pedido pendente.
- [x] Cobrir sessão expirada e retomada.
- [x] Cobrir imutabilidade do recibo depois de evento de catálogo.
- [x] Criar regressão visual de pagamento e confirmação desktop/mobile.

Critério de saída: nenhuma confirmação aparece sem pedido confirmado, nenhuma repetição cria compra duplicada e todo recibo representa o snapshot imutável da transação.

## Fase 6 — Resiliência, entrega e qualidade

- [x] Validar Socket.IO através de `socket.io-client`, incluindo reconexão, versões e duplicatas.
- [x] Completar os cenários MSW determinísticos do teste técnico, incluindo latência variável e respostas fora de ordem.
- [x] Cobrir as 12 jornadas funcionais Playwright; comportamento do favorito no tablet passou na repetição focada.
- [x] Registrar o aceite do responsável para pular a revisão visual Figma; manter os diffs das baselines antigas documentados, sem atualização em lote.
- [x] Registrar a decisão de manter a pontuação Lighthouse atual (68/72 mobile), sem novas otimizações nesta etapa; a meta original ≥90 não foi atingida.
- [x] Documentar setup, variáveis, contas fictícias, cenários/reset, arquitetura e decisões de cache.
- [x] Validar checkout/pedido em preview de produção e deep links depois das correções.
- [x] Registrar a validação manual de teclado confirmada pelo responsável.
- [x] Publicar a aplicação no Vercel e verificar a URL pública e o carregamento de rotas.

## Riscos e decisões em aberto

| Tema                    | Estado/decisão necessária                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frame mobile do detalhe | Fornecido e aplicado; manter como referência das próximas revisões.                                                                                                                        |
| Galeria                 | Só quatro assets distintos existem hoje; definir se thumbnails podem repetir ou se novos assets serão exportados.                                                                          |
| Avaliações              | Frame mostra total 19, mas contrato/lista ainda não existem. Definir somente leitura vs. endpoint paginado.                                                                                |
| Edições                 | Frame mostra múltiplas opções; definir preços/estoques e qual é a edição padrão de cada NFT.                                                                                               |
| Token/contrato          | Dados são simulados; usar valores claramente fictícios, mas estruturalmente válidos.                                                                                                       |
| Shell mobile            | Footer desktop está oculto no mobile; detalhe precisa seguir a navegação mobile já existente ou uma decisão de Figma.                                                                      |
| Referências visuais     | Inventário em docs/references/figma; binários originais precisam manter nomes canônicos e não podem ser recomprimidos.                                                                     |
| Identidade visitante    | Precisa ser estável o bastante para refresh e merge, sem expor carrinhos entre usuários.                                                                                                   |
| Cotação                 | API simulada é a única fonte de subtotal, desconto, taxa e total; a UI não recalcula valores oficiais.                                                                                     |
| Bundle de mocks         | Chunk do navegador com ~476 KiB; otimizações anteriores não elevaram o Lighthouse mobile. Limitação registrada; novas investigações pausadas conforme decisão de manter a pontuação atual. |

## Entrega

A aplicação está pública em [kurio-marketplace-two.vercel.app](https://kurio-marketplace-two.vercel.app). Os diffs visuais foram aceitos devido a problemas conhecidos nos frames Figma; a pontuação Lighthouse será mantida como está; a rodada manual de teclado foi validada pelo responsável.
