import coverageLib, { type CoverageMap } from 'istanbul-lib-coverage'
import convert from 'ast-v8-to-istanbul'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect as playwrightExpect, test as playwrightTest } from '@playwright/test'
import { parseAstAsync } from 'vite'

type TransformedSource = {
  ast: Awaited<ReturnType<typeof parseAstAsync>>
  code: string
}

type CoverageState = {
  coverageMap: CoverageMap
  sources: Map<string, TransformedSource>
}

type WorkerFixtures = {
  coverageState: CoverageState
}

type TestFixtures = {
  captureBrowserCoverage: void
}

const enabled = process.env.KURIO_BROWSER_COVERAGE === '1'
const { createCoverageMap } = coverageLib
const sourceRoot = path.resolve('src')
const coverageDirectory = path.resolve('reports/coverage/browser')

export const test = playwrightTest.extend<TestFixtures, WorkerFixtures>({
  coverageState: [
    async ({ browserName }, provide, workerInfo) => {
      if (enabled && browserName !== 'chromium') {
        throw new Error(`Browser coverage requires Chromium; received ${browserName}.`)
      }

      const state: CoverageState = {
        coverageMap: createCoverageMap({}),
        sources: new Map(),
      }

      await provide(state)
      if (!enabled) return

      await mkdir(coverageDirectory, { recursive: true })
      await writeFile(
        path.join(coverageDirectory, `worker-${workerInfo.workerIndex}.json`),
        JSON.stringify(state.coverageMap.toJSON()),
      )
    },
    { scope: 'worker', auto: true },
  ],
  captureBrowserCoverage: [
    async ({ page, coverageState }, provide) => {
      if (!enabled) {
        await provide()
        return
      }

      const session = await page.context().newCDPSession(page)
      await session.send('Profiler.enable')
      await session.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true })

      try {
        await provide()
        const { result } = await session.send('Profiler.takePreciseCoverage')
        await session.send('Profiler.stopPreciseCoverage')

        for (const script of result) {
          const url = new URL(script.url || '/', 'http://127.0.0.1:4173')
          if (
            url.origin !== 'http://127.0.0.1:4173' ||
            !url.pathname.startsWith('/src/') ||
            !/\.(?:js|jsx|ts|tsx)$/.test(url.pathname)
          ) {
            continue
          }

          const relativeSource = decodeURIComponent(url.pathname.slice('/src/'.length))
          const filePath = path.resolve(sourceRoot, relativeSource)
          if (!filePath.startsWith(`${sourceRoot}${path.sep}`)) {
            throw new Error(`Coverage source escaped src/: ${script.url}`)
          }

          let transformed = coverageState.sources.get(script.url)
          if (!transformed) {
            const response = await fetch(script.url)
            if (!response.ok) {
              throw new Error(
                `Failed to load transformed coverage source: ${script.url} (${response.status})`,
              )
            }
            const code = await response.text()
            transformed = { code, ast: await parseAstAsync(code) }
            coverageState.sources.set(script.url, transformed)
          }

          const converted = await convert({
            code: transformed.code,
            ast: transformed.ast,
            coverage: { functions: script.functions, url: pathToFileURL(filePath).href },
          })
          for (const [source, fileCoverage] of Object.entries(converted)) {
            const sourcePath = path.resolve(source)
            if (sourcePath.startsWith(`${sourceRoot}${path.sep}`)) {
              coverageState.coverageMap.merge({ [sourcePath]: fileCoverage })
            }
          }
        }
      } finally {
        await session.detach()
      }
    },
    { auto: true },
  ],
})

export const expect = playwrightExpect
