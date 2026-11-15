import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'docs/quality/release.json')
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const sourceInput = (name) =>
  name !== 'public/build-info.json' &&
  (!name.endsWith('.md') || name === 'TECHNICAL-CHALLENGE.md') &&
  !name.startsWith('docs/') &&
  (['src/', 'scripts/', 'tests/', 'public/'].some((prefix) => name.startsWith(prefix)) ||
    !name.includes('/')) &&
  (!name.startsWith('.env') || name === '.env.example')

if (process.argv.includes('--verify')) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  for (const entry of manifest.files) {
    if (sha(await readFile(path.join(root, entry.path))) !== entry.sha256) {
      throw new Error(`Frozen input changed: ${entry.path}`)
    }
  }
  const proof = JSON.parse(await readFile(path.join(root, 'public/build-info.json'), 'utf8'))
  if (proof.sourceSha256 !== manifest.sourceSha256 || proof.baseCommit !== manifest.baseCommit) {
    throw new Error('Build provenance differs from the frozen manifest.')
  }
  console.log(`Verified ${manifest.files.length} frozen inputs: ${manifest.sourceSha256}`)
} else {
  const names = [
    ...new Set(
      git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean),
    ),
  ].sort()
  const files = []
  for (const name of names.filter(sourceInput)) {
    try {
      if (!(await stat(path.join(root, name))).isFile()) continue
      files.push({ path: name, sha256: sha(await readFile(path.join(root, name))) })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  const sourceSha256 = sha(files.map((entry) => `${entry.path}\0${entry.sha256}\n`).join(''))
  const baseCommit = git('rev-parse', 'HEAD').trim()
  const changes = git('status', '--porcelain=v1', '-z', '--untracked-files=all')
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const name = entry.slice(3)
      const category = name.includes('-snapshots/')
        ? 'visual-baseline'
        : name.startsWith('docs/')
          ? 'documentation-and-evidence'
          : name.startsWith('tests/')
            ? 'test'
            : name.startsWith('src/')
              ? 'application'
              : 'tooling-and-public-assets'
      return { status: entry.slice(0, 2), path: name, category }
    })
  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(
    manifestPath,
    `${JSON.stringify({ schemaVersion: 1, baseCommit, sourceSha256, files, changes }, null, 2)}\n`,
  )
  await writeFile(
    path.join(root, 'public/build-info.json'),
    `${JSON.stringify({ baseCommit, sourceSha256 }, null, 2)}\n`,
  )
  const exportArgument = process.argv.find((argument) => argument.startsWith('--export='))
  if (exportArgument) {
    const destination = path.resolve(exportArgument.slice('--export='.length))
    if (destination === root || destination.startsWith(`${root}${path.sep}`))
      throw new Error('Export must be outside the working tree.')
    for (const name of [
      ...names.filter((name) => !name.startsWith('.env') || name === '.env.example'),
      'public/build-info.json',
      'docs/quality/release.json',
    ]) {
      try {
        if (!(await stat(path.join(root, name))).isFile()) continue
        const target = path.join(destination, name)
        await mkdir(path.dirname(target), { recursive: true })
        await copyFile(path.join(root, name), target)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    console.log(
      `Exported tracked and intentional untracked files to ${destination}; no .git, local env or node_modules.`,
    )
  }
  console.log(
    `Frozen ${files.length} inputs; reviewed inventory: ${changes.length} file entries; source SHA256 ${sourceSha256}`,
  )
}
