import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { collectMediaIdsFromUser, deleteUnreferencedMediaByIds } from '@/media/orphanCleanup'

type UserLike = {
  avatar?: number | string | { id?: number | string | null } | null
}

export const cleanupDetachedUserMediaAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const currentIds = new Set(collectMediaIdsFromUser(doc as UserLike | null))
  const detachedIds = collectMediaIdsFromUser(previousDoc as UserLike | null).filter(
    (mediaId) => !currentIds.has(mediaId),
  )

  await deleteUnreferencedMediaByIds({
    mediaIds: detachedIds,
    payload: req.payload,
    req,
  })

  return doc
}

export const cleanupDetachedUserMediaAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await deleteUnreferencedMediaByIds({
    mediaIds: collectMediaIdsFromUser(doc as UserLike | null),
    payload: req.payload,
    req,
  })

  return doc
}
