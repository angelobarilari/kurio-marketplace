# Lighthouse — matriz exigida do teste técnico

Execução concluída em 2026-11-15T12:40:46.376Z. Cada combinação de rota/perfil foi medida 3 vezes; os resultados abaixo são medianas. Os relatórios HTML e JSON versionados ficam em `docs/performance/lighthouse/phase-13-final-2026-11-15/`.

- Lighthouse: 12.8.2
- Navegador/host da auditoria: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
- User-agent emulado no perfil mobile: Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36
- Perfil desktop: 1350 x 940 CSS px, DPR 1, RTT 40 ms, 10240 Kbps, CPU x1.
- Perfil mobile: 412 x 823 CSS px, DPR 1.75, RTT 150 ms, 1638.4 Kbps, CPU x4; o user-agent emula Moto G Power (2022).
- Cache e armazenamento: reset por execução (file_systems, shader_cache, service_workers, cache_storage).
- Build: produção via Vite Preview, com MSW habilitado pela configuração de build.

| Rota / perfil   | Performance | Acessibilidade | Boas práticas | SEO |     LCP |    CLS |   TBT |
| --------------- | ----------: | -------------: | ------------: | --: | ------: | -----: | ----: |
| Início desktop  |         100 |            100 |            96 |  92 |  792 ms | 0.0074 |  0 ms |
| Início mobile   |          84 |            100 |            96 |  92 | 4112 ms | 0.0000 | 26 ms |
| Detalhe desktop |          99 |            100 |            96 |  92 |  802 ms | 0.0000 |  0 ms |
| Detalhe mobile  |          88 |            100 |            96 |  92 | 3419 ms | 0.0000 | 14 ms |

## Leitura dos resultados

- A tabela registra medições locais reproduzíveis, não uma garantia da pontuação do ambiente publicado.
- Mudanças de performance devem ser comparadas pelas medianas, usando a mesma configuração e três execuções por alvo.
- Os relatórios detalhados podem ser regenerados com `npm run audit:lighthouse:matrix`.
