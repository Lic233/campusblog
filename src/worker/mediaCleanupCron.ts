import { getPayload } from 'payload'

import { cleanupAllOrphanMedia } from '@/media/orphanCleanup'
import { createPayloadConfig } from '@/payload/createPayloadConfig'
import type { PayloadCloudflareEnv } from '@/payload/createPayloadConfig'

export async function runMediaCleanupCron(env: PayloadCloudflareEnv) {
  const payload = await getPayload({ config: createPayloadConfig(env) })
  return cleanupAllOrphanMedia({ payload })
}
