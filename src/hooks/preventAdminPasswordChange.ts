import type { CollectionBeforeChangeHook } from 'payload'

import { hasAdminRole } from '@/access/admin'

type PasswordChangeData = {
  password?: string | null
}

type UserDoc = {
  id?: number | string | null
}

export const preventAdminPasswordChange: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !data) return data
  if (!hasAdminRole(req.user)) return data

  const nextData = data as PasswordChangeData
  const targetUser = (originalDoc ?? null) as UserDoc | null
  const hasNextPassword =
    typeof nextData.password === 'string' ? nextData.password.trim().length > 0 : false

  if (!hasNextPassword) return data
  if (!req.user?.id || !targetUser?.id) return data
  if (String(req.user.id) === String(targetUser.id)) return data

  throw new Error('Administrators cannot change another user password from the Payload admin.')
}
