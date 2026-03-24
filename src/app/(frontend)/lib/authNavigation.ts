export function maybeSanitizeNextPath(nextPath: string | null | undefined): string | null {
  if (!nextPath) return null
  if (!nextPath.startsWith('/')) return null
  if (nextPath.startsWith('//')) return null
  if (nextPath.startsWith('/api')) return null
  return nextPath
}

export function sanitizeNextPath(
  nextPath: string | null | undefined,
  fallback = '/user/me',
): string {
  return maybeSanitizeNextPath(nextPath) ?? fallback
}

export function buildAuthHref(basePath: '/login' | '/register', nextPath?: string | null): string {
  const safeNextPath = maybeSanitizeNextPath(nextPath)
  if (!safeNextPath || safeNextPath === basePath) return basePath
  return `${basePath}?next=${encodeURIComponent(safeNextPath)}`
}

export function isProtectedFrontendPath(pathname: string): boolean {
  return pathname === '/editor' || pathname.startsWith('/user')
}
