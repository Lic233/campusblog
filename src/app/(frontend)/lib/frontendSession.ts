import 'server-only'

import { getPayload } from 'payload'

import config from '@/payload.config'
import type { User } from '@/payload-types'
import type { SidebarUser } from './sessionTypes'

export async function getFrontendPayload() {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}

export async function getCurrentFrontendUser(headers: Headers): Promise<User | null> {
  const payload = await getFrontendPayload()
  const result = await payload.auth({ headers })
  return (result.user as User | null | undefined) ?? null
}

export function toSidebarUser(user: User | null): SidebarUser | null {
  if (!user) return null

  const avatarUrl =
    user.avatar && typeof user.avatar === 'object' ? (user.avatar.url ?? null) : null

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl,
  }
}
