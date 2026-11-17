import { createServer } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(root, 'dist')
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { getPrerenderRoutes, renderPrerenderRoute } = await server.ssrLoadModule('/src/entry-server.tsx')
  const indexPath = path.join(outputDirectory, 'index.html')
  const indexHtml = await readFile(indexPath, 'utf8')
  const routes = await getPrerenderRoutes()

  const manifest = JSON.parse(await readFile(path.join(outputDirectory, '.vite', 'manifest.json'), 'utf8'))
  const assetMappings = Object.entries(manifest)
    .filter(([, output]) => typeof output.src === 'string')
    .map(([source, output]) => [`/${source}`, `/${output.file}`])
    .sort(([left], [right]) => right.length - left.length)

  const outputPaths = new Set()
  for (const route of routes) {
    const relativeOutput = route.outputPath
      ? route.outputPath
      : route.path === '/'
        ? 'index.html'
        : `${route.path.slice(1)}.html`
    if (outputPaths.has(relativeOutput)) {
      throw new Error(`Multiple prerendered routes target ${relativeOutput}.`)
    }
    outputPaths.add(relativeOutput)

    let html = await renderPrerenderRoute(indexHtml, route)
    if (!html.includes(`data-prerendered="true" data-prerender-path="${route.path}"`)) {
      throw new Error(`Prerender for ${route.path} is missing its route marker.`)
    }
    if (route.pattern && !html.includes(`data-prerender-pattern="${route.pattern}"`)) {
      throw new Error(`Prerender for ${route.path} is missing its route pattern marker.`)
    }
    if (route.path === '/') {
      const cardCount = [...html.matchAll(/data-testid="nft-card"/g)].length
      if (cardCount !== 9) {
        throw new Error(`Homepage prerender expected 9 initial NFT cards, received ${cardCount}.`)
      }
    }
    if (!html.includes('$_TSR.router')) {
      throw new Error(`Prerender for ${route.path} did not include router hydration state.`)
    }
    if (html.includes('The server did not finish this Suspense boundary')) {
      throw new Error(`Prerender for ${route.path} contains an incomplete Suspense boundary.`)
    }

    for (const [source, output] of assetMappings) {
      html = html.replaceAll(source, output)
    }
    if (html.includes('/src/assets/')) {
      throw new Error(`Prerender for ${route.path} contains development-only asset URLs.`)
    }

    const outputPath = path.join(outputDirectory, relativeOutput)
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }

  console.log(`Prerendered ${routes.length} route documents.`)
} finally {
  await server.close()
}
