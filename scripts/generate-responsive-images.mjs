import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const root = process.cwd()
const sourceDirectory = path.join(root, 'src', 'assets')
const outputDirectory = path.join(sourceDirectory, 'generated')
const images = ['emerald-ape', 'golden-beat', 'ivory-baron', 'sage-nomad']
const widths = [320, 768]

await mkdir(outputDirectory, { recursive: true })

await Promise.all(
  images.flatMap((image) =>
    widths.map((width) =>
      sharp(path.join(sourceDirectory, `${image}.webp`))
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6 })
        .toFile(path.join(outputDirectory, `${image}-${width}.webp`)),
    ),
  ),
)

console.log(`Generated ${images.length * widths.length} responsive WebP assets in ${outputDirectory}.`)
