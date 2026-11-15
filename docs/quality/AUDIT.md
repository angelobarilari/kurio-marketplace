# Auditoria de qualidade e cobertura

Este documento define como reproduzir e interpretar as evidências de qualidade do Kurio. As medições descrevem o código e o ambiente efetivamente executados; não são estimativas nem garantia da versão publicada.

## Escopo e semântica de coverage

`npm run test:coverage` executa os testes unitários e de integração do Vitest e a matriz Playwright completa. O provider V8 coleta execução do Vitest; um fixture CDP coleta a execução dos módulos servidos pelo Vite no navegador. Os sourcemaps do Vite remapeiam a instrumentação do Chromium aos arquivos TS/TSX originais. A conversão e a fusão usam formatos Istanbul.

O mapa combinado inclui todos os 161 arquivos `src/**/*.{ts,tsx}`, inclusive rotas, entrypoints, hooks e componentes. Somente declarações `*.d.ts` ficam fora. Módulos externos, arquivos de teste e CSS não fazem parte do denominador.

A meta atual é **pelo menos 80% em cada indicador do mapa combinado**: linhas, statements, funções e branches. A validação falha se qualquer indicador combinado ficar abaixo de 80%; não há threshold de 80% por ferramenta.

Como proteção adicional das regras críticas, o Vitest exige pelo menos 80% de branches em quatro módulos de estado: `order-store.ts`, `cart-store.ts`, `catalog-store.ts` e `account-store.ts`. Esses limites focados não alteram o escopo nem o threshold global do mapa Vitest; os demais módulos continuam diagnósticos. O gate foi aprovado na execução atual de 186 testes em 15 arquivos; os totais por módulo e os mapas estão em [RESULTS.md](./RESULTS.md).

`npm run test:coverage:vitest` executa os projetos `unit` e `integration`, com include sobre `src/**/*.{ts,tsx}`. Seu percentual é diagnóstico Vitest-only, não “coverage unitária” e não mede Playwright. O mapa Playwright-only mostra o que as jornadas executaram no browser. As ferramentas podem executar as mesmas linhas, e os instrumentos/sourcemaps produzem denominadores diferentes; não somar percentuais nem comparar camadas como se fossem scores independentes equivalentes.

Executar uma linha não prova que uma assertion verificou o resultado, os estados alternativos ou o requisito. Um componente alcançado por uma jornada E2E conta como executado, mas isso não significa que seus estados foram testados isoladamente. A cobertura combinada é sinal de execução e não substitui asserts de comportamento, revisão das jornadas ou cobertura dirigida de regras críticas.

## Reproduzir a medição

Use Node.js compatível com o `engines` de `package.json`, instale o lockfile e o Chromium do Playwright:

```bash
npm ci
npx playwright install chromium
npm run test:coverage
```

O comando deve ser executado sem outras builds/auditorias concorrentes. Ele:

1. executa Vitest sem filtros e grava o resultado JUnit em `docs/quality/vitest-results.xml`;
2. executa todos os testes Playwright nos projetos desktop, tablet e mobile, coletando coverage dos módulos `src/`;
3. remapeia coverage V8 por sourcemaps e gera relatórios Vitest-only, Playwright-only e combinado;
4. retorna erro se a execução de testes falhar, se a coleta/fusão falhar ou se algum indicador do mapa combinado não alcançar 80%.

Para inspecionar camadas separadamente:

```bash
npm run test:checks
npm run test:coverage:vitest
npm run test:coverage:refresh-vitest
npx playwright test --list
npm run test:e2e
```

O primeiro comando gera JUnit consolidado. `test:coverage:vitest` executa unit + integration e não demonstra a meta combinada. `--list` confirma somente descoberta, não execução. `test:e2e` isolado valida os casos, mas não gera coverage; para instrumentar o browser, use o pipeline `test:coverage`.

`test:coverage:refresh-vitest` executa toda a camada Vitest e reagrupa seu mapa com o último JSON Playwright-only versionado, sem executar E2E. Use esse atalho somente quando `src/`, dependências (`package.json`/lockfile), os testes Playwright, `playwright.config.ts`, `vite.config.ts` e a configuração de mocks não mudaram desde a última execução completa aprovada. Caso qualquer um tenha mudado — ou se a validade do mapa anterior for incerta — execute `npm run test:coverage`, que recolhe ambas as camadas. O relatório reagrupado mantém os números das execuções de cada camada e não deve ser apresentado como uma nova execução Playwright.

Após instalar o Chromium, a execução combinada demora aproximadamente 10 minutos neste ambiente de referência. Os casos condicionados ao viewport aparecem como ignorados e não contam como aprovados. Para apenas reconstruir a apresentação dos dados versionados, sem executar testes:

```bash
npm run test:coverage:report
```

## Evidências e interpretação

O [RESULTS.md](./RESULTS.md) mantém os resultados efetivamente observados, contagens, limites e ligações para artefatos nativos. O pipeline grava mapas e relatórios HTML/JSON de Vitest em [`coverage/vitest-only/`](./coverage/vitest-only/), Playwright em [`coverage/playwright-only/`](./coverage/playwright-only/) e do resultado combinado em [`coverage/current/`](./coverage/current/). Cada `coverage-final.json` contém o mapa detalhado e `coverage-summary.json` os totais. São evidências versionadas; não editar os dados ou metadados manualmente. O relatório de execução dos casos Playwright está em [`playwright/coverage-run.html`](./playwright/coverage-run.html) e não é o relatório de coverage.

`npm run test:coverage:report` regenera as três apresentações a partir dos mapas JSON versionados, sem executar testes. Isso preserva a apresentação, mas **não** valida que os mapas correspondem às alterações atuais. Depois de mudanças em código, dependências ou configuração, rode `npm run test:coverage`.

Ao registrar um novo resultado:

- preservar a saída JSON/HTML gerada e o JUnit da mesma execução;
- registrar os totais de linhas, statements, funções e branches, além do número de testes e arquivos;
- identificar se a execução foi completa ou filtrada; nunca somar contagens de execuções sobrepostas;
- manter resultados por camada e combinados como evidências distintas; a métrica agregada nunca substitui a leitura dos casos e assertions;
- não atualizar snapshots para fazer testes passar sem revisar visualmente a diferença;
- não alterar tolerâncias, exclusões ou limites para aumentar scores.

Coverage alto não substitui verificação de acessibilidade, requisitos, comportamento, instalação limpa, build, preview nem Lighthouse. Consulte o [RESULTS.md](./RESULTS.md) e o [LIGHTHOUSE.md](../performance/LIGHTHOUSE.md) para escopo e evidências dessas verificações.

### Testes unitários de schemas Zod

O inventário do projeto — arquivos `*schema*`, imports de bibliotecas declarativas de validação e declarações Zod em `src/**/*.{ts,tsx}` — encontrou apenas dois módulos de schema de produção: `src/features/auth/schemas.ts` e `src/features/checkout/schemas.ts`. `package.json` lista Zod como única biblioteca declarativa de validação. Os respectivos testes Vitest exercitam todos os schemas exportados diretamente, sem browser nem rede. Na execução documentada, ambos registraram 100% de linhas, statements, funções e branches no mapa Vitest-only. Tipos TypeScript sem validação em runtime não são schemas de validação nem alvos unitários equivalentes. Isso é uma evidência específica desses módulos, não uma afirmação de 100% da camada Vitest ou de toda regra de negócio. Os casos e limites estão descritos em [RESULTS.md](./RESULTS.md).

## Validações de entrega

Reproduza checks independentes quando aplicáveis:

```bash
npm run typecheck
npm run typecheck:tests
npm run lint:check
npm run test:checks
npm run build
npm run test:e2e
npm run test:preview
```

Execute `npm run audit:lighthouse:matrix` somente depois do build, sem builds, testes ou outras auditorias concorrentes. A matriz mede cada rota/perfil três vezes; registrar medianas e preservar todos os relatórios HTML/JSON nativos. Para verificar uma instalação limpa, usar uma cópia dos inputs revisados e `npm ci`; não copiar `.env` local ou credenciais privadas.

## Estado da proveniência

Uma medição só corresponde ao conjunto de arquivos realmente testado. `node scripts/release-snapshot.mjs` registra o commit-base, o SHA-256 dos inputs de código/build/teste e o inventário de alterações em `docs/quality/release.json`; também grava o fingerprint em `public/build-info.json` para que a build/preview possa provar qual snapshot gerou os assets.

Para criar e validar uma cópia independente dos arquivos intencionais, passe um destino fora do repositório, por exemplo `node scripts/release-snapshot.mjs --export=../kurio-final-snapshot`. A exportação omite `.git`, dependências locais e arquivos de ambiente; configure a cópia usando valores não secretos de `.env.example`. No checkout exportado, rode `npm ci`, `node scripts/release-snapshot.mjs --verify` e os comandos de validação abaixo. Não use `--verify` como substituto dos testes.

Qualquer alteração posterior em código, dependências ou configuração invalida as evidências afetadas e exige nova execução. Mudanças apenas em relatórios/documentação não alteram o fingerprint de build, mas devem manter seus resultados e links sincronizados com a execução que os gerou.

Nenhum relatório autoriza por si só publicação ou afirma que a URL pública corresponde ao workspace. A proveniência do deploy deve ser verificada pelo hash da fonte e dos assets, seguida de checks na URL publicada.
