import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(await readFile(path.join(root, 'scripts', 'lighthouse-matrix.config.json'), 'utf8'))
const previewPort = new URL(config.baseUrl).port || '4173'
const previewEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const lighthouseEntry = path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js')
const outputDirectory = path.join(root, config.outputDirectory)
const reportData = []
const reportsOnly = process.argv.includes('--reports-only')
const documentationPath = path.join(root, 'docs/performance/LIGHTHOUSE.md')
const reportLinks = path.relative(path.dirname(documentationPath), outputDirectory).split(path.sep).join('/')

const preview = reportsOnly
  ? null
  : spawn(
      process.execPath,
      [previewEntry, 'preview', '--host', '127.0.0.1', '--port', previewPort, '--strictPort'],
      { cwd: root, stdio: 'inherit' },
    )

const stopPreview = async () => {
  if (!preview || preview.exitCode !== null || preview.signalCode !== null) return
  preview.kill()
  await new Promise((resolve) => preview.once('exit', resolve))
}

const waitForPreview = async () => {
  const deadline = Date.now() + 30_000
  let lastError
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) throw new Error(`Preview exited with status ${preview.exitCode}.`)
    try {
      const response = await fetch(config.baseUrl)
      if (response.ok) return
      lastError = new Error(`Preview returned HTTP ${response.status}.`)
    } catch (error) {
      lastError = error
    }
    await delay(500)
  }
  throw new Error(`Preview did not become ready: ${lastError}`)
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

try {
  await mkdir(outputDirectory, { recursive: true })
  if (!reportsOnly) await waitForPreview()

  for (const target of config.targets) {
    for (let run = 1; run <= config.runsPerTarget; run += 1) {
      const name = `${target.name}-${target.profile}-${run}`
      const url = new URL(target.path, config.baseUrl).toString()
      const outputPath = path.join(outputDirectory, name)
      if (!reportsOnly) {
        console.log(`\nLighthouse ${name}: ${url}`)
        const args = [
          lighthouseEntry,
          url,
          '--output=html',
          '--output=json',
          `--output-path=${outputPath}`,
          '--chrome-flags=--headless',
          '--only-categories=performance,accessibility,best-practices,seo',
          '--quiet',
        ]
        if (target.profile === 'desktop') args.push('--preset=desktop')
        const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
        if (result.error) throw result.error
        if (result.status !== 0) throw new Error(`Lighthouse failed for ${name} (exit ${result.status}).`)
      }

      const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'))
      if (report.runtimeError) throw new Error(`Lighthouse ${name}: ${report.runtimeError.message}`)
      reportData.push({ target, run, report })
    }
  }

  const rows = config.targets.map((target) => {
    const reports = reportData
      .filter(
        ({ target: candidate }) => candidate.name === target.name && candidate.profile === target.profile,
      )
      .map(({ report }) => report)
    const score = (report, category) => Math.round((report.categories[category].score ?? 0) * 100)
    const metric = (report, id) => report.audits[id].numericValue
    return {
      ...target,
      performance: median(reports.map((report) => score(report, 'performance'))),
      accessibility: median(reports.map((report) => score(report, 'accessibility'))),
      bestPractices: median(reports.map((report) => score(report, 'best-practices'))),
      seo: median(reports.map((report) => score(report, 'seo'))),
      lcp: median(reports.map((report) => metric(report, 'largest-contentful-paint'))),
      cls: median(reports.map((report) => metric(report, 'cumulative-layout-shift'))),
      tbt: median(reports.map((report) => metric(report, 'total-blocking-time'))),
    }
  })

  const reportInfo = reportData[0].report
  const mobileReport = reportData.find(({ target }) => target.profile === 'mobile').report
  const desktopSettings = reportData.find(({ target }) => target.profile === 'desktop').report.configSettings
  const mobileSettings = mobileReport.configSettings
  const describeProfile = (settings) => {
    const { screenEmulation, throttling } = settings
    return `${screenEmulation.width} x ${screenEmulation.height} CSS px, DPR ${screenEmulation.deviceScaleFactor}, RTT ${throttling.rttMs} ms, ${throttling.throughputKbps} Kbps, CPU x${throttling.cpuSlowdownMultiplier}`
  }
  const formatScore = (value) => `${value}`
  const formatMs = (value) => `${Math.round(value)} ms`
  const failedTargets = rows.filter(
    (row) => row.performance < 90 || row.accessibility < 95 || row.bestPractices < 95 || row.seo < 90,
  )
  const markdown = [
    '# Auditoria Lighthouse',
    '',
    'Auditoria exigida pela seção 10 do [teste técnico](../../TECHNICAL-CHALLENGE.md): início e detalhe do NFT em desktop e mobile, usando build otimizado e cenário padrão dos mocks.',
    '',
    '## Resultados e metas',
    '',
    'Metas obrigatórias em cada alvo: **Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90**.',
    '',
    `Cada combinação de rota/perfil foi medida ${config.runsPerTarget} vezes; os resultados abaixo são medianas. Os relatórios HTML e JSON versionados ficam em \`${config.outputDirectory}/\`.`,
    '',
    '| Rota / perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (row) =>
        `| ${row.name === 'home' ? 'Início' : 'Detalhe'} ${row.profile} | ${formatScore(row.performance)} | ${formatScore(row.accessibility)} | ${formatScore(row.bestPractices)} | ${formatScore(row.seo)} | ${formatMs(row.lcp)} | ${row.cls.toFixed(4)} | ${formatMs(row.tbt)} |`,
    ),
    '',
    failedTargets.length
      ? `**Há metas pendentes:** ${failedTargets.map((row) => `${row.name === 'home' ? 'Início' : 'Detalhe'} ${row.profile}`).join(', ')}. Não declarar conformidade integral de performance enquanto essas medianas estiverem abaixo das metas.`
      : '**As medianas dos quatro alvos atingiram todas as metas do enunciado.**',
    '',
    'LCP é o tempo até o maior conteúdo visível; CLS mede deslocamentos de layout, sem unidade; TBT é o tempo total de bloqueio da thread principal. Tempos são apresentados em milissegundos. Essas métricas explicam o resultado e não substituem as categorias exigidas.',
    '',
    '## Ambiente e condições',
    '',
    `- Lighthouse: ${reportInfo.lighthouseVersion}`,
    `- Node.js: ${process.version}; sistema: ${process.platform} ${process.arch}.`,
    `- Navegador/host da auditoria: ${reportInfo.environment.hostUserAgent}`,
    `- User-agent emulado no perfil mobile: ${mobileReport.environment.networkUserAgent}`,
    `- Perfil desktop: ${describeProfile(desktopSettings)}.`,
    `- Perfil mobile: ${describeProfile(mobileSettings)}; o user-agent emula Moto G Power (2022).`,
    `- Cache e armazenamento: reset por execução (${mobileSettings.clearStorageTypes.join(', ')}).`,
    '- Build: produção via Vite Preview, com MSW habilitado pela configuração de build.',
    '',
    '## Relatórios completos',
    '',
    '| Rota / perfil | Execução 1 | Execução 2 | Execução 3 |',
    '| --- | --- | --- | --- |',
    ...config.targets.map((target) => {
      const reports = Array.from({ length: config.runsPerTarget }, (_, index) => {
        const file = `${target.name}-${target.profile}-${index + 1}`
        return `[HTML](./${reportLinks}/${file}.report.html) / [JSON](./${reportLinks}/${file}.report.json)`
      })
      return `| ${target.name === 'home' ? 'Início' : 'Detalhe'} ${target.profile} | ${reports.join(' | ')} |`
    }),
    '',
    '## Leitura dos resultados',
    '',
    '- A tabela registra medições locais reproduzíveis, não uma garantia da pontuação do ambiente publicado.',
    '- Mudanças de performance devem ser comparadas pelas medianas, usando a mesma configuração e três execuções por alvo.',
    '- Todas as imagens, a fonte local, o MSW e o cliente Socket.IO da entrega permanecem habilitados; não há simplificações específicas para a auditoria.',
    '- A pré-renderização consulta Axios/MSW e serializa somente o cache público. A build prioriza fonte/pintura do HTML; a interação fica protegida até o commit React.',
    '- WebP responsivo, prioridade da imagem principal, lazy loading e módulos sob demanda reduzem trabalho inicial. O custo do backend simulado faz parte da medição.',
    '- Best Practices pode registrar a resposta 401 de sessão visitante como erro de rede no console. Ela faz parte do contrato de autenticação; não representa erro JavaScript não tratado.',
    '- Pontuação aprovada não certifica a versão publicada nem substitui verificação em aparelhos e redes reais.',
    '',
    '## Como reproduzir',
    '',
    'Instale as dependências e configure `.env` conforme o [README](../../README.md). Use `VITE_ENABLE_MOCKS=true`, `VITE_API_URL=/api` e `VITE_SOCKET_URL=same-origin`. É necessário Chrome/Chromium disponível para o Lighthouse.',
    '',
    '```bash',
    'npm run build',
    'npm run audit:lighthouse:matrix',
    '```',
    '',
    `A [configuração da matriz](../../scripts/lighthouse-matrix.config.json) fixa os quatro alvos, as três execuções e a saída. O script inicia/encerra o Vite Preview na porta ${previewPort}, que deve estar livre. Não executar testes, builds ou outras auditorias simultaneamente.`,
    '',
    'Uma nova medição substitui os 12 pares HTML/JSON e atualiza este documento. Falhas de runtime interrompem a matriz. Os metadados nativos são preservados, sem cabeçalhos de data de atualização do projeto.',
    '',
    'Para recalcular apenas este documento a partir dos JSON existentes, sem executar novas medições:',
    '',
    '```bash',
    'npm run audit:lighthouse:matrix -- --reports-only',
    '```',
    '',
    '`--reports-only` não valida uma build posterior: ele somente reorganiza a evidência já medida. Não existe um segundo resumo Markdown em `current/`; ali ficam apenas os artefatos nativos.',
    '',
    'O comando `audit:lighthouse:prerendered` é um diagnóstico opcional de outras rotas, com porta 4175 e saída local ignorada pelo Git em `reports/lighthouse/`. Ele não substitui a matriz obrigatória.',
    '',
    'Os resultados Playwright e as demais condições da entrega estão em [RESULTS.md](../quality/RESULTS.md). Nenhum deploy faz parte desta validação local.',
    '',
  ].join('\n')
  const formattedMarkdown = await prettier.format(markdown, { filepath: documentationPath })
  await writeFile(documentationPath, formattedMarkdown)
  console.log('\nSaved docs/performance/LIGHTHOUSE.md')
} finally {
  await stopPreview()
}
