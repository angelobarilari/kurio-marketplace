import emeraldApe from './emerald-ape.webp'
import goldenBeat from './golden-beat.webp'
import ivoryBaron from './ivory-baron.webp'
import sageNomad from './sage-nomad.webp'
import emeraldApeSmall from './generated/emerald-ape-320.webp'
import emeraldApeMedium from './generated/emerald-ape-768.webp'
import goldenBeatSmall from './generated/golden-beat-320.webp'
import goldenBeatMedium from './generated/golden-beat-768.webp'
import ivoryBaronSmall from './generated/ivory-baron-320.webp'
import ivoryBaronMedium from './generated/ivory-baron-768.webp'
import sageNomadSmall from './generated/sage-nomad-320.webp'
import sageNomadMedium from './generated/sage-nomad-768.webp'

export const nftImages = {
  emeraldApe,
  goldenBeat,
  ivoryBaron,
  sageNomad,
} as const

type ResponsiveImageSources = {
  small: string
  medium: string
  full: string
}

const responsiveNftImages = new Map<string, ResponsiveImageSources>([
  [emeraldApe, { small: emeraldApeSmall, medium: emeraldApeMedium, full: emeraldApe }],
  [goldenBeat, { small: goldenBeatSmall, medium: goldenBeatMedium, full: goldenBeat }],
  [ivoryBaron, { small: ivoryBaronSmall, medium: ivoryBaronMedium, full: ivoryBaron }],
  [sageNomad, { small: sageNomadSmall, medium: sageNomadMedium, full: sageNomad }],
])

export const getResponsiveNftImage = (src: string): ResponsiveImageSources | undefined =>
  responsiveNftImages.get(src)
