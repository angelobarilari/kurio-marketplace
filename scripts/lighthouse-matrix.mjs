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

const preview = spawn(
  process.execPath,
  [previewEntry, 'preview', '--host', '127.0.0.1', '--port', previewPort, '--strictPort'],
  { cwd: root, stdio: 'inherit' },
)

const stopPreview = async () => {
  if (preview.exitCode !== null || preview.signalCode !== null) return
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
  await waitForPreview()

  for (const target of config.targets) {
    for (let run = 1; run <= config.runsPerTarget; run += 1) {
      const name = `${target.name}-${target.profile}-${run}`
      const url = new URL(target.path, config.baseUrl).toString()
      const outputPath = path.join(outputDirectory, name)
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

      const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'))
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
  const markdown = [
    '# Lighthouse — matriz exigida do teste técnico',
    '',
    `Execução concluída em ${reportInfo.fetchTime}. Cada combinação de rota/perfil foi medida ${config.runsPerTarget} vezes; os resultados abaixo são medianas. Os relatórios HTML e JSON versionados ficam em \`${config.outputDirectory}/\`.`,
    '',
    `- Lighthouse: ${reportInfo.lighthouseVersion}`,
    `- Navegador/host da auditoria: ${reportInfo.environment.hostUserAgent}`,
    `- User-agent emulado no perfil mobile: ${mobileReport.environment.networkUserAgent}`,
    `- Perfil desktop: ${describeProfile(desktopSettings)}.`,
    `- Perfil mobile: ${describeProfile(mobileSettings)}; o user-agent emula Moto G Power (2022).`,
    `- Cache e armazenamento: reset por execução (${mobileSettings.clearStorageTypes.join(', ')}).`,
    '- Build: produção via Vite Preview, com MSW habilitado pela configuração de build.',
    '',
    '| Rota / perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (row) =>
        `| ${row.name === 'home' ? 'Início' : 'Detalhe'} ${row.profile} | ${formatScore(row.performance)} | ${formatScore(row.accessibility)} | ${formatScore(row.bestPractices)} | ${formatScore(row.seo)} | ${formatMs(row.lcp)} | ${row.cls.toFixed(4)} | ${formatMs(row.tbt)} |`,
    ),
    '',
    '## Leitura dos resultados',
    '',
    '- A tabela registra medições locais reproduzíveis, não uma garantia da pontuação do ambiente publicado.',
    '- Mudanças de performance devem ser comparadas pelas medianas, usando a mesma configuração e três execuções por alvo.',
    '- Os relatórios detalhados podem ser regenerados com `npm run audit:lighthouse:matrix`.',
    '',
  ].join('\n')
  const summaryPath = path.join(outputDirectory, 'summary.md')
  const formattedMarkdown = await prettier.format(markdown, { filepath: summaryPath })
  await writeFile(summaryPath, formattedMarkdown)
  console.log(`\nSaved ${path.join(config.outputDirectory, 'summary.md')}`)
} finally {
  await stopPreview()
}
