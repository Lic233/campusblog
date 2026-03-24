import type { CollectionBeforeValidateHook } from 'payload'

import { hasAdminRole } from '@/access/admin'

type RelationValue = number | string | { id?: number | string | null } | null | undefined

type AuthorAwareData = {
  author?: RelationValue
  status?: 'draft' | 'published' | 'hidden' | null
}

export const setCurrentAuthor: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (!data) return data

  const nextData = data as AuthorAwareData
  const userID = req.user?.id
  const isAdmin = hasAdminRole(req.user)

  if (userID && operation === 'create') {
    if (!isAdmin || !nextData.author) {
      nextData.author = userID
    }
  }

  // Keep the required author relationship stable for non-admin frontend updates.
  if (userID && operation === 'update' && !isAdmin) {
    nextData.author = userID
  }

  if (!isAdmin && nextData.status === 'hidden') {
    nextData.status = 'published'
  }

  return nextData
}
