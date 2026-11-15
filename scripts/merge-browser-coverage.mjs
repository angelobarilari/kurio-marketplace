import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import coverageLib from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { createCoverageMap } = coverageLib
const coverageDirectory = path.join(root, 'reports', 'coverage')
const browserCoverageDirectory = path.join(coverageDirectory, 'browser')
const coverageRoot = path.join(root, 'docs', 'quality', 'coverage')
const reportDirectories = {
  combined: path.join(coverageRoot, 'current'),
  vitest: path.join(coverageRoot, 'vitest-only'),
  playwright: path.join(coverageRoot, 'playwright-only'),
}
const reportOnly = process.argv.includes('--report-only')
const reusePlaywright = process.argv.includes('--reuse-playwright')
const sourceRoot = path.join(root, 'src') + path.sep
const coverageInputFiles = {
  combined: path.join(reportDirectories.combined, 'coverage-final.json'),
  vitest: path.join(reportDirectories.vitest, 'coverage-final.json'),
  playwright: path.join(reportDirectories.playwright, 'coverage-final.json'),
}

if (reportOnly && reusePlaywright) {
  throw new Error('Choose either --report-only or --reuse-playwright, not both.')
}

const readCoverageMap = async (filePath) => createCoverageMap(JSON.parse(await readFile(filePath, 'utf8')))

const assertSourceFiles = (coverageMap, label) => {
  const files = coverageMap.files()
  if (files.length === 0) {
    throw new Error(`${label} coverage contains no source files.`)
  }
  for (const file of files) {
    if (!file.startsWith(sourceRoot)) {
      throw new Error(`${label} coverage contains a file outside src/: ${file}`)
    }
  }
  return files
}

const addZeroCoverageForMissingFiles = (coverageMap, sourceMap) => {
  const coveredFiles = new Set(coverageMap.files())
  for (const file of sourceMap.files()) {
    if (coveredFiles.has(file)) continue

    const fileCoverage = JSON.parse(JSON.stringify(sourceMap.fileCoverageFor(file).toJSON()))
    for (const counts of [fileCoverage.s, fileCoverage.f]) {
      for (const key of Object.keys(counts)) counts[key] = 0
    }
    for (const key of Object.keys(fileCoverage.b)) {
      fileCoverage.b[key] = fileCoverage.b[key].map(() => 0)
    }
    coverageMap.addFileCoverage(fileCoverage)
  }
}

const writeReport = async (directory, coverageMap) => {
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })
  const context = libReport.createContext({ dir: directory, coverageMap })
  for (const name of ['json-summary', 'json', 'html']) {
    reports.create(name).execute(context)
  }
}

const logSummary = (label, coverageMap) => {
  const summary = coverageMap.getCoverageSummary()
  console.log(`\n${label} (${coverageMap.files().length} source files):`)
  for (const metric of ['lines', 'branches', 'functions', 'statements']) {
    console.log(`${metric}: ${summary[metric].pct.toFixed(2)}%`)
  }
  return summary
}

let coverageMaps
if (reportOnly) {
  coverageMaps = {
    combined: await readCoverageMap(coverageInputFiles.combined),
    vitest: await readCoverageMap(coverageInputFiles.vitest),
    playwright: await readCoverageMap(coverageInputFiles.playwright),
  }
} else {
  const vitestMap = await readCoverageMap(path.join(coverageDirectory, 'coverage-final.json'))
  assertSourceFiles(vitestMap, 'Vitest')

  let browserMap
  if (reusePlaywright) {
    browserMap = await readCoverageMap(coverageInputFiles.playwright)
    console.log(
      'Reusing versioned Playwright coverage. Use only if src/, Playwright tests, package manifests, and test/build configuration are unchanged since the last full run.',
    )
  } else {
    browserMap = createCoverageMap({})
    const browserFiles = (await readdir(browserCoverageDirectory)).filter((file) => file.endsWith('.json'))
    if (browserFiles.length === 0) {
      throw new Error('No browser coverage files were collected from the Playwright run.')
    }

    for (const file of browserFiles) {
      const workerMap = await readCoverageMap(path.join(browserCoverageDirectory, file))
      assertSourceFiles(workerMap, 'Playwright')
      browserMap.merge(workerMap)
    }
  }
  addZeroCoverageForMissingFiles(browserMap, vitestMap)

  const combinedMap = createCoverageMap(JSON.parse(JSON.stringify(vitestMap.toJSON())))
  combinedMap.merge(browserMap)
  coverageMaps = { combined: combinedMap, vitest: vitestMap, playwright: browserMap }
}

for (const [layer, coverageMap] of Object.entries(coverageMaps)) {
  assertSourceFiles(coverageMap, layer)
  await writeReport(reportDirectories[layer], coverageMap)
}

const combinedSummary = logSummary('Combined Vitest + Playwright coverage', coverageMaps.combined)
logSummary('Vitest unit + integration coverage', coverageMaps.vitest)
logSummary('Playwright browser coverage', coverageMaps.playwright)

const belowTarget = ['lines', 'branches', 'functions', 'statements'].filter(
  (metric) => combinedSummary[metric].pct < 80,
)
if (belowTarget.length > 0) {
  console.error(`The combined 80% target is not met for: ${belowTarget.join(', ')}.`)
  process.exitCode = 1
}
