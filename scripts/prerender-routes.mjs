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

let stopPrerenderMocks
try {
  const { getPrerenderRoutes, renderPrerenderRoute, startPrerenderMocks } =
    await server.ssrLoadModule('/src/entry-server.tsx')
  stopPrerenderMocks = startPrerenderMocks()
  const indexPath = path.join(outputDirectory, 'index.html')
  let indexHtml = await readFile(indexPath, 'utf8')
  const routes = await getPrerenderRoutes()

  const manifest = JSON.parse(await readFile(path.join(outputDirectory, '.vite', 'manifest.json'), 'utf8'))
  // Let the static document paint before downloading and executing hydration.
  // All routes still load the same application, including the mock API.
  indexHtml = indexHtml.replace(
    /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/,
    (_script, src) =>
      `<script type="module">requestAnimationFrame(()=>requestAnimationFrame(()=>import(${JSON.stringify(src)})))</script>`,
  )
  indexHtml = indexHtml.replace(/<link rel="modulepreload"[^>]*>/g, '')
  const latinFont = Object.values(manifest).find((asset) =>
    asset.src?.endsWith('/roboto-mono-latin-wght-normal.woff2'),
  )
  if (latinFont) {
    indexHtml = indexHtml.replace(
      '</head>',
      `<link rel="preload" href="/${latinFont.file}" as="font" type="font/woff2" crossorigin></head>`,
    )
  }
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

  await writeFile(path.join(outputDirectory, '404.html'), indexHtml)
  console.log(`Prerendered ${routes.length} route documents.`)
} finally {
  stopPrerenderMocks?.()
  await server.close()
}
