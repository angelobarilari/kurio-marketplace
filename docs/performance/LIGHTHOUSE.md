# Auditoria Lighthouse

Auditoria exigida pela seção 10 do [teste técnico](../../TECHNICAL-CHALLENGE.md): início e detalhe do NFT em desktop e mobile, usando build otimizado e cenário padrão dos mocks.

## Resultados e metas

Metas obrigatórias em cada alvo: **Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90**.

Cada combinação de rota/perfil foi medida 3 vezes; os resultados abaixo são medianas. Os relatórios HTML e JSON versionados ficam em `docs/performance/lighthouse/current/`.

| Rota / perfil   | Performance | Acessibilidade | Boas práticas | SEO |     LCP |    CLS |    TBT |
| --------------- | ----------: | -------------: | ------------: | --: | ------: | -----: | -----: |
| Início desktop  |         100 |            100 |            96 | 100 |  784 ms | 0.0005 |   0 ms |
| Início mobile   |          94 |            100 |            96 | 100 | 2736 ms | 0.0000 | 152 ms |
| Detalhe desktop |         100 |            100 |            96 | 100 |  617 ms | 0.0001 |   0 ms |
| Detalhe mobile  |          90 |            100 |            96 | 100 | 2737 ms | 0.0000 | 266 ms |

**As medianas dos quatro alvos atingiram todas as metas do enunciado.**

LCP é o tempo até o maior conteúdo visível; CLS mede deslocamentos de layout, sem unidade; TBT é o tempo total de bloqueio da thread principal. Tempos são apresentados em milissegundos. Essas métricas explicam o resultado e não substituem as categorias exigidas.

## Ambiente e condições

- Lighthouse: 12.8.2
- Node.js: v20.20.2; sistema: win32 x64.
- Navegador/host da auditoria: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/158.0.0.0 Safari/537.36
- User-agent emulado no perfil mobile: Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36
- Perfil desktop: 1350 x 940 CSS px, DPR 1, RTT 40 ms, 10240 Kbps, CPU x1.
- Perfil mobile: 412 x 823 CSS px, DPR 1.75, RTT 150 ms, 1638.4 Kbps, CPU x4; o user-agent emula Moto G Power (2022).
- Cache e armazenamento: reset por execução (file_systems, shader_cache, service_workers, cache_storage).
- Build: produção via Vite Preview, com MSW habilitado pela configuração de build.

## Relatórios completos

| Rota / perfil   | Execução 1                                                                                                            | Execução 2                                                                                                            | Execução 3                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Início desktop  | [HTML](./lighthouse/current/home-desktop-1.report.html) / [JSON](./lighthouse/current/home-desktop-1.report.json)     | [HTML](./lighthouse/current/home-desktop-2.report.html) / [JSON](./lighthouse/current/home-desktop-2.report.json)     | [HTML](./lighthouse/current/home-desktop-3.report.html) / [JSON](./lighthouse/current/home-desktop-3.report.json)     |
| Início mobile   | [HTML](./lighthouse/current/home-mobile-1.report.html) / [JSON](./lighthouse/current/home-mobile-1.report.json)       | [HTML](./lighthouse/current/home-mobile-2.report.html) / [JSON](./lighthouse/current/home-mobile-2.report.json)       | [HTML](./lighthouse/current/home-mobile-3.report.html) / [JSON](./lighthouse/current/home-mobile-3.report.json)       |
| Detalhe desktop | [HTML](./lighthouse/current/detail-desktop-1.report.html) / [JSON](./lighthouse/current/detail-desktop-1.report.json) | [HTML](./lighthouse/current/detail-desktop-2.report.html) / [JSON](./lighthouse/current/detail-desktop-2.report.json) | [HTML](./lighthouse/current/detail-desktop-3.report.html) / [JSON](./lighthouse/current/detail-desktop-3.report.json) |
| Detalhe mobile  | [HTML](./lighthouse/current/detail-mobile-1.report.html) / [JSON](./lighthouse/current/detail-mobile-1.report.json)   | [HTML](./lighthouse/current/detail-mobile-2.report.html) / [JSON](./lighthouse/current/detail-mobile-2.report.json)   | [HTML](./lighthouse/current/detail-mobile-3.report.html) / [JSON](./lighthouse/current/detail-mobile-3.report.json)   |

## Leitura dos resultados

- A tabela registra medições locais reproduzíveis, não uma garantia da pontuação do ambiente publicado.
- Mudanças de performance devem ser comparadas pelas medianas, usando a mesma configuração e três execuções por alvo.
- Detalhe mobile atingiu 90 de mediana, com variação entre 83 e 92; a execução mais baixa registrou TBT de 498 ms.
- Todas as imagens, a fonte local, o MSW e o cliente Socket.IO da entrega permanecem habilitados; não há simplificações específicas para a auditoria.
- A pré-renderização consulta Axios/MSW e serializa somente o cache público. A build prioriza fonte/pintura do HTML; a interação fica protegida até o commit React.
- WebP responsivo, prioridade da imagem principal, lazy loading e módulos sob demanda reduzem trabalho inicial. O custo do backend simulado faz parte da medição.
- Best Practices pode registrar a resposta 401 de sessão visitante como erro de rede no console. Ela faz parte do contrato de autenticação; não representa erro JavaScript não tratado.
- Pontuação aprovada não certifica a versão publicada nem substitui verificação em aparelhos e redes reais.

## Como reproduzir

Instale as dependências e configure `.env` conforme o [README](../../README.md). Use `VITE_ENABLE_MOCKS=true`, `VITE_API_URL=/api` e `VITE_SOCKET_URL=same-origin`. É necessário Chrome/Chromium disponível para o Lighthouse.

```bash
npm run build
npm run audit:lighthouse:matrix
```

A [configuração da matriz](../../scripts/lighthouse-matrix.config.json) fixa os quatro alvos, as três execuções e a saída. O script inicia/encerra o Vite Preview na porta 4173, que deve estar livre. Não executar testes, builds ou outras auditorias simultaneamente.

Uma nova medição substitui os 12 pares HTML/JSON e atualiza este documento. Falhas de runtime interrompem a matriz. Os metadados nativos são preservados, sem cabeçalhos de data de atualização do projeto.

Para recalcular apenas este documento a partir dos JSON existentes, sem executar novas medições:

```bash
npm run audit:lighthouse:matrix -- --reports-only
```

`--reports-only` não valida uma build posterior: ele somente reorganiza a evidência já medida. Não existe um segundo resumo Markdown em `current/`; ali ficam apenas os artefatos nativos.

O comando `audit:lighthouse:prerendered` é um diagnóstico opcional de outras rotas, com porta 4175 e saída local ignorada pelo Git em `reports/lighthouse/`. Ele não substitui a matriz obrigatória.

Os resultados Playwright e as demais condições da entrega estão em [RESULTS.md](../quality/RESULTS.md). Nenhum deploy faz parte desta validação local.
