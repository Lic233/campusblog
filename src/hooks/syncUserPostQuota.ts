import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { collectMediaIdsFromPost, deleteUnreferencedMediaByIds } from '@/media/orphanCleanup'
import { recalculateUsedBytesForUser } from '@/quota/postQuota'

type RelationValue =
  | number
  | string
  | {
      id?: number | string | null
    }
  | null
  | undefined

type AuthorAwareDoc = {
  author?: RelationValue
}

function getRelationId(value: RelationValue): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && (typeof value.id === 'number' || typeof value.id === 'string')) {
    return value.id
  }
  return null
}

async function syncAuthors(args: {
  currentAuthor?: RelationValue
  previousAuthor?: RelationValue
  req: Parameters<CollectionAfterChangeHook>[0]['req']
}) {
  const authorIds = new Set<number | string>()
  const currentAuthorId = getRelationId(args.currentAuthor)
  const previousAuthorId = getRelationId(args.previousAuthor)

  if (currentAuthorId !== null) authorIds.add(currentAuthorId)
  if (previousAuthorId !== null) authorIds.add(previousAuthorId)

  for (const authorId of authorIds) {
    await recalculateUsedBytesForUser({
      payload: args.req.payload,
      req: args.req,
      userId: authorId,
    })
  }
}

export const syncUserPostQuotaAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  await syncAuthors({
    currentAuthor: (doc as AuthorAwareDoc | null)?.author,
    previousAuthor: (previousDoc as AuthorAwareDoc | null)?.author,
    req,
  })

  const detachedMediaIds = collectMediaIdsFromPost(previousDoc as AuthorAwareDoc & { content?: unknown; coverImage?: RelationValue })
    .filter((mediaId) => !new Set(collectMediaIdsFromPost(doc as AuthorAwareDoc & { content?: unknown; coverImage?: RelationValue })).has(mediaId))

  await deleteUnreferencedMediaByIds({
    mediaIds: detachedMediaIds,
    payload: req.payload,
    req,
  })

  return doc
}

export const syncUserPostQuotaAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await syncAuthors({
    currentAuthor: (doc as AuthorAwareDoc | null)?.author,
    req,
  })

  await deleteUnreferencedMediaByIds({
    mediaIds: collectMediaIdsFromPost(doc as AuthorAwareDoc & { content?: unknown; coverImage?: RelationValue }),
    payload: req.payload,
    req,
  })

  return doc
}
