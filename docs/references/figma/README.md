# Referências visuais do Figma — Kurio

Este diretório concentra os frames de referência usados para revisar composição, hierarquia visual e comportamento responsivo. Os requisitos funcionais estão em [TECHNICAL-CHALLENGE.md](../../../TECHNICAL-CHALLENGE.md); o [README do projeto](../../../README.md) descreve setup e execução.

## Convenção de nomes

Os arquivos seguem o padrão `<área>-<dispositivo>-<estado-ou-escopo>.png`:

- nomes em inglês, minúsculos e separados por hífen;
- `desktop` ou `mobile` identifica o viewport representado;
- o sufixo descreve o estado ou o conteúdo realmente visível no frame;
- não há prefixos numéricos, pois a ordem não deve mudar quando novos frames forem adicionados;
- os PNGs são preservados em suas dimensões e qualidade originais.

## Inventário canônico

Há 15 PNGs, todos conferidos visualmente e armazenados nesta pasta.

| Referência                                                                              | Viewport |   Dimensões | Fluxo/estado           | Conteúdo observável                                                         |
| --------------------------------------------------------------------------------------- | -------- | ----------: | ---------------------- | --------------------------------------------------------------------------- |
| [Home completa](./home-desktop-marketplace-full-page.png)                               | Desktop  | 2880 × 7336 | Home/marketplace       | Header, hero, catálogo, filtros, promoções, conteúdo editorial e footer     |
| [Home completa](./home-mobile-marketplace-full-page.png)                                | Mobile   |  828 × 1792 | Home/marketplace       | Hero, busca, navegação e catálogo adaptados ao mobile                       |
| [Detalhe do NFT](./nft-detail-desktop-full-page.png)                                    | Desktop  | 2880 × 4492 | Detalhe/compra         | Galeria, resumo comercial, metadados, abas, itens relacionados e footer     |
| [Detalhe do NFT](./nft-detail-mobile-purchase-page.png)                                 | Mobile   |  828 × 1792 | Detalhe/compra         | Voltar, favorito, imagem, avaliação, edição, metadados, quantidade e compra |
| [Carrinho preenchido](./cart-desktop-populated-summary-recommendations.png)             | Desktop  | 2880 × 3508 | Carrinho               | Itens, quantidades, remoção, cupom, totais, CTA, recomendações e footer     |
| [Carrinho preenchido](./cart-mobile-populated-coupon-totals.png)                        | Mobile   |  826 × 1792 | Carrinho               | Cards compactos, quantidades, remoção, cupom, totais e CTA                  |
| [Checkout](./checkout-desktop-collector-profile-wallet-order-summary.png)               | Desktop  | 2880 × 3314 | Pagamento/revisão      | Perfil do colecionador, rede, carteira, pedido, totais e confirmação        |
| [Checkout](./checkout-mobile-wallet-selection-total.png)                                | Mobile   |  828 × 1792 | Pagamento com carteira | Carteiras conectadas, provedores, seleção, total e confirmação              |
| [Confirmação do pedido](./order-confirmation-desktop-transaction-receipt-modal.png)     | Desktop  | 2880 × 3314 | Pedido confirmado      | Modal de recibo, transação, carteira, itens, taxa, total e explorer         |
| [Login em modal](./auth-login-desktop-modal-marketplace-context.png)                    | Desktop  | 2880 × 3962 | Autenticação/login     | Modal sobre o marketplace, credenciais, recuperação e login social          |
| [Login dedicado](./auth-login-mobile-email-password-social.png)                         | Mobile   |  828 × 1792 | Autenticação/login     | E-mail, senha, recuperação, login social e acesso ao cadastro               |
| [Cadastro em modal](./auth-signup-desktop-modal-marketplace-context.png)                | Desktop  | 2880 × 3962 | Autenticação/cadastro  | Modal sobre o marketplace, credenciais, confirmação e login social          |
| [Cadastro dedicado](./auth-signup-mobile-credentials-social.png)                        | Mobile   |  828 × 1792 | Autenticação/cadastro  | Usuário, e-mail, senhas, cadastro social e retorno ao login                 |
| [Dados do colecionador](./profile-desktop-collector-data-avatar-password.png)           | Desktop  | 2880 × 2160 | Perfil                 | Navegação lateral, dados públicos, ENS, avatar e alteração de senha         |
| [Gerenciamento de carteiras](./profile-desktop-wallet-management-primary-secondary.png) | Desktop  | 2880 × 2160 | Perfil/carteiras       | Carteira principal, rede, endereço, tipo, ENS e carteira secundária         |

## Regra de uso

- Consulte o frame correspondente antes de implementar ou revisar uma rota.
- Não interprete conteúdo estático como sucesso funcional. As ações dependem dos contratos REST, MSW, TanStack Query, sessão e eventos exigidos pelo teste.
- Desktop e mobile são experiências relacionadas, não apenas escalas da mesma composição.
- Estados não desenhados — carregamento, vazio, erro, retry, indisponibilidade, validação e atualização em tempo real — devem respeitar o mesmo sistema visual.
- Desvios intencionais por acessibilidade ou requisito funcional devem ser registrados.
- Referências do Figma ficam aqui; snapshots produzidos por testes visuais ficam junto da suíte de testes.

## Referências e snapshots

Os PNGs desta pasta são os frames canônicos de consulta. A validação automatizada compara a aplicação com as snapshots versionadas junto aos testes:

- [Comércio](../../../tests/visual.spec.ts-snapshots): home, detalhe, carrinho, checkout e recibo.
- [Conta](../../../tests/account-visual.spec.ts-snapshots): login, cadastro, perfil e carteiras.

As duas pastas pertencem a suítes diferentes. Execute ambas com `npm run test:visual`; a suíte completa também as inclui. O resultado da execução e o HTML estão em [RESULTS.md](../../quality/RESULTS.md).

A tolerância é de 50 pixels diferentes por imagem, em valor absoluto. Animações/caret são ocultados e campos variáveis do recibo são mascarados. Capturas aguardam a decodificação das imagens. Não atualizar baselines em lote nem aceitar diferenças sem inspeção.

### Decisões da composição atual

- Home mobile: hero compacto com indicadores, sem retrato sobreposto, e grade alinhada por linha.
- Conteúdo editorial e footer desktop não são montados no mobile. Recomendações ocultas do carrinho também não são consultadas nesse viewport.
- “Oferta limitada” mantém margem inferior de 16 px.
- A fonte local é `Roboto Mono Variable`, coerente com o pacote instalado.
- Carrinho/checkout usam dados determinísticos: três NFTs com quantidade 2 no desktop e quatro NFTs com quantidades variadas no mobile.
- O detalhe usa preço/edição do contrato; o recibo apresenta o snapshot imutável do pedido, com valores fornecidos pela API.

Os frames orientam composição e adaptações; as snapshots detectam regressões da interface aprovada. Dados de demonstração e estados funcionais precisam continuar coerentes com o enunciado e os contratos.

## Leitura funcional dos frames

### Home e catálogo

- O desktop usa navegação completa, hero amplo, filtros laterais e grade de catálogo.
- O mobile reorganiza navegação, busca, filtros e catálogo; não deve ser uma simples redução do desktop.
- Filtros, ordenação, paginação e busca precisam refletir a URL e os dados da API.
- Cards reutilizam o mesmo contrato resumido de NFT em home, recomendações e coleções.

### Detalhe do NFT

- A rota combina galeria, dados comerciais, edição, quantidade, metadados, avaliação e recomendações.
- O NFT exibido deve ser resolvido pelo identificador da rota, sem duplicar um objeto específico na página.
- O preço vem do contrato do NFT; os valores são strings decimais em ETH conforme o enunciado, inclusive nos cenários com redes distintas.
- A ação de compra alimenta o carrinho com NFT, edição e quantidade selecionadas.

### Carrinho

- O desktop apresenta itens e cotação em duas colunas; o mobile transforma os itens em cards e agrupa a cotação em um painel contínuo.
- Quantidade pertence ao par NFT + edição.
- Remover e decrementar quantidade são operações distintas.
- Totais do frame são exemplos visuais; a cotação REST é a fonte oficial.
- “Conectar e finalizar” leva ao checkout e não confirma a compra diretamente.

### Pagamento e confirmação

- O desktop combina dados do colecionador e resumo do pedido; o mobile destaca a seleção de carteira.
- Carteira cadastrada e provedor de conexão são conceitos diferentes.
- A confirmação aparece somente após uma resposta de pedido efetivamente confirmada.
- O recibo é um snapshot imutável com ID, data, carteira, itens, quantidades, taxa e total.

### Autenticação

- Mobile usa páginas dedicadas; desktop usa modal e preserva o contexto de origem.
- Login e cadastro compartilham estrutura visual, mas mantêm validações e mutations próprias.
- Google e Facebook são fluxos simulados e não devem aparentar sucesso sem handler.
- O retorno após login deve preservar o carrinho e o destino privado solicitado.

### Perfil e carteiras

- Dados do perfil, senha, avatar e carteiras têm mutations separadas.
- Itens laterais fora do escopo não devem aparentar funcionalidade.
- Carteiras precisam de identidade estável, rede, endereço, tipo, apelido e ENS opcional.
- E-mail continua sendo dado do perfil; código de indicação está previsto no contrato de checkout da Fase 5. Não duplicar esses campos na API de carteiras antes de aprovar essa mudança de domínio.
- Dados privados devem ser isolados por usuário e removidos do cache ao sair ou trocar de conta.

## Checklist de manutenção

1. Inspecionar visualmente o novo PNG antes de nomeá-lo.
2. Usar a convenção semântica deste documento, sem numeração sequencial.
3. Registrar viewport, dimensões, fluxo e conteúdo no inventário.
4. Atualizar links no roadmap e nos documentos que mencionarem o frame.
5. Verificar que não restaram referências para nomes antigos ou arquivos ausentes.
