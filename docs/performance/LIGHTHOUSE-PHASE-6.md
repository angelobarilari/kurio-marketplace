# Lighthouse — matriz da Fase 6

Execução concluída em 2026-11-13T18:10:55.438Z. Cada combinação de rota/perfil foi medida 3 vezes; os resultados abaixo são medianas. Relatórios HTML e JSON por execução estão em [reports/lighthouse/phase-6](../../reports/lighthouse/phase-6/).

- Lighthouse: 12.8.2
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
- Ambiente: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36
- Build: produção via Vite Preview, com MSW habilitado pela configuração de build.

| Rota / perfil   | Performance | Acessibilidade | Boas práticas | SEO |     LCP |    CLS |    TBT |
| --------------- | ----------: | -------------: | ------------: | --: | ------: | -----: | -----: |
| Início desktop  |          97 |            100 |            96 |  92 | 1173 ms | 0.0015 |  17 ms |
| Início mobile   |          68 |            100 |            96 |  92 | 6219 ms | 0.0195 | 149 ms |
| Detalhe desktop |          98 |            100 |            96 |  92 | 1115 ms | 0.0017 |   4 ms |
| Detalhe mobile  |          72 |            100 |            96 |  92 | 5390 ms | 0.0016 | 138 ms |

## Decisão

A meta original de Performance mobile ≥90 não foi atingida (68 na home e 72 no detalhe). O responsável decidiu manter a pontuação atual e não continuar a investigação/otimização do Lighthouse nesta etapa. Estes números ficam registrados como baseline conhecida, não como meta cumprida.
