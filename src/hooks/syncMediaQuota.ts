import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { collectMediaIdsFromPost } from '@/media/orphanCleanup'
import { recalculateUsedBytesForUser } from '@/quota/postQuota'

type RelationValue =
  | number
  | string
  | {
      id?: number | string | null
    }
  | null
  | undefined

type MediaAwarePost = {
  author?: RelationValue
  content?: unknown
  coverImage?: RelationValue
}

function getRelationId(value: RelationValue): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (
    value &&
    typeof value === 'object' &&
    (typeof value.id === 'number' || typeof value.id === 'string')
  ) {
    return value.id
  }
  return null
}

async function recalculateAuthorsReferencingMedia(args: {
  mediaId: number | string
  req: Parameters<CollectionAfterChangeHook>[0]['req']
}) {
  const targetId = Number(args.mediaId)
  if (!Number.isFinite(targetId)) return

  const authorIds = new Set<number | string>()
  let page = 1

  while (true) {
    const result = await args.req.payload.find({
      collection: 'posts',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
      req: args.req,
    })

    for (const post of result.docs as MediaAwarePost[]) {
      const mediaIds = collectMediaIdsFromPost(post).map(Number)
      if (!mediaIds.includes(targetId)) continue

      const authorId = getRelationId(post.author)
      if (authorId !== null) authorIds.add(authorId)
    }

    if (page >= result.totalPages) break
    page += 1
  }

  for (const authorId of authorIds) {
    await recalculateUsedBytesForUser({
      payload: args.req.payload,
      req: args.req,
      userId: authorId,
    })
  }
}

export const syncMediaQuotaAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (typeof doc?.id === 'number' || typeof doc?.id === 'string') {
    await recalculateAuthorsReferencingMedia({ mediaId: doc.id, req })
  }

  if (
    previousDoc?.id !== doc?.id &&
    (typeof previousDoc?.id === 'number' || typeof previousDoc?.id === 'string')
  ) {
    await recalculateAuthorsReferencingMedia({ mediaId: previousDoc.id, req })
  }

  return doc
}

export const syncMediaQuotaAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (typeof doc?.id === 'number' || typeof doc?.id === 'string') {
    await recalculateAuthorsReferencingMedia({ mediaId: doc.id, req })
  }

  return doc
}
