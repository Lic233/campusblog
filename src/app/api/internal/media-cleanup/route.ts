import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { hasAdminRole } from '@/access/admin'
import config from '@/payload.config'
import { cleanupAllOrphanMedia } from '@/media/orphanCleanup'

export const runtime = 'nodejs'
export const maxDuration = 60

function getBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function POST(request: Request) {
  const cleanupSecret = process.env.MEDIA_CLEANUP_SECRET?.trim()
  const bearerToken = getBearerToken(request.headers.get('authorization'))
  const isSecretAuthorized = Boolean(cleanupSecret && bearerToken === cleanupSecret)

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  if (!isSecretAuthorized) {
    const headers = await getHeaders()
    const result = await payload.auth({ headers })

    if (!hasAdminRole(result.user as { roles?: string[] | null } | null)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await cleanupAllOrphanMedia({ payload })

  return Response.json({
    deletedIds: result.deletedIds,
    deletedCount: result.deletedIds.length,
    referencedCount: result.referencedCount,
    scannedCount: result.scannedCount,
    success: true,
  })
}
