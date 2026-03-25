export type MediaAltKind = 'avatar' | 'cover-image' | 'inline-image'

type NamedFileLike = {
  name?: string | null
}

function normalizeAsciiToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getFileStem(file?: NamedFileLike | null): string {
  const rawName = file?.name?.trim()
  if (!rawName) return ''

  const stem = rawName.replace(/\.[^.]+$/, '')
  return normalizeAsciiToken(stem).slice(0, 10)
}

function getSeedToken(seed?: string | number | null): string {
  if (seed === undefined || seed === null) return ''
  return normalizeAsciiToken(String(seed)).slice(0, 24)
}

export function buildGeneratedMediaAlt(args: {
  file?: NamedFileLike | null
  kind: MediaAltKind
  seed?: string | number | null
}): string {
  const parts: string[] = [args.kind]
  const fileStem = getFileStem(args.file)
  const seedToken = getSeedToken(args.seed)

  if (fileStem) parts.push(fileStem)
  if (seedToken) parts.push(seedToken)

  parts.push(Date.now().toString(36))
  return parts.join('-')
}

export function getMediaImageAlt(
  alt: string | null | undefined,
  fallbackKind: MediaAltKind,
): string {
  const trimmed = alt?.trim()
  return trimmed ? trimmed : fallbackKind
}
