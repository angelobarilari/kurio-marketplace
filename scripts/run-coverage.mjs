import { spawnSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const browserCoverageDirectory = path.join(root, 'reports', 'coverage', 'browser')
const vitestCli = path.join(root, 'node_modules', 'vitest', 'vitest.mjs')
const playwrightCli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js')
const mergeScript = path.join(root, 'scripts', 'merge-browser-coverage.mjs')

const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' })
  if (result.error) throw result.error
  return result.status ?? 1
}

await rm(browserCoverageDirectory, { recursive: true, force: true })

const vitestStatus = run(process.execPath, [vitestCli, 'run', '--coverage'])
if (vitestStatus !== 0) {
  process.exitCode = vitestStatus
} else {
  const playwrightStatus = run(process.execPath, [playwrightCli, 'test'], {
    ...process.env,
    KURIO_BROWSER_COVERAGE: '1',
  })
  if (playwrightStatus !== 0) {
    process.exitCode = playwrightStatus
  } else {
    process.exitCode = run(process.execPath, [mergeScript])
  }
}
