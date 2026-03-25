import type { Payload, PayloadRequest } from 'payload'

type RelationValue =
  | number
  | string
  | {
      id?: number | string | null
    }
  | null
  | undefined

type TiptapNode = {
  attrs?: {
    mediaId?: number | string | null
  }
  content?: TiptapNode[]
  type?: string
}

type PostLike = {
  content?: unknown
  coverImage?: RelationValue
}

type UserLike = {
  avatar?: RelationValue
}

const PAGE_SIZE = 100

function toNumericId(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function getRelationId(value: RelationValue): number | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return toNumericId(value)
  }

  if (value && typeof value === 'object') {
    return toNumericId(value.id)
  }

  return null
}

function collectInlineMediaIds(content: unknown): number[] {
  if (!content || typeof content !== 'object') return []

  const mediaIds = new Set<number>()

  const walk = (node: TiptapNode) => {
    if (node.type === 'image') {
      const mediaId = toNumericId(node.attrs?.mediaId)
      if (mediaId !== null) mediaIds.add(mediaId)
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
  }

  walk(content as TiptapNode)
  return Array.from(mediaIds)
}

export function collectMediaIdsFromPost(post: PostLike | null | undefined): number[] {
  if (!post) return []

  const mediaIds = new Set<number>(collectInlineMediaIds(post.content))
  const coverImageId = getRelationId(post.coverImage)

  if (coverImageId !== null) {
    mediaIds.add(coverImageId)
  }

  return Array.from(mediaIds)
}

export function collectMediaIdsFromUser(user: UserLike | null | undefined): number[] {
  if (!user) return []

  const avatarId = getRelationId(user.avatar)
  return avatarId === null ? [] : [avatarId]
}

async function collectReferencedMediaIds(args: {
  candidateIds?: number[]
  payload: Payload
  req?: PayloadRequest
}): Promise<Set<number>> {
  const candidateSet = args.candidateIds ? new Set(args.candidateIds) : null
  const referencedMediaIds = new Set<number>()

  let postPage = 1
  while (true) {
    const result = await args.payload.find({
      collection: 'posts',
      depth: 0,
      limit: PAGE_SIZE,
      overrideAccess: true,
      page: postPage,
      req: args.req,
    })

    for (const post of result.docs) {
      for (const mediaId of collectMediaIdsFromPost(post)) {
        if (!candidateSet || candidateSet.has(mediaId)) {
          referencedMediaIds.add(mediaId)
        }
      }
    }

    if (postPage >= result.totalPages) break
    postPage += 1
  }

  let userPage = 1
  while (true) {
    const result = await args.payload.find({
      collection: 'users',
      depth: 0,
      limit: PAGE_SIZE,
      overrideAccess: true,
      page: userPage,
      req: args.req,
    })

    for (const user of result.docs) {
      for (const mediaId of collectMediaIdsFromUser(user)) {
        if (!candidateSet || candidateSet.has(mediaId)) {
          referencedMediaIds.add(mediaId)
        }
      }
    }

    if (userPage >= result.totalPages) break
    userPage += 1
  }

  return referencedMediaIds
}

export async function deleteUnreferencedMediaByIds(args: {
  mediaIds: number[]
  payload: Payload
  req?: PayloadRequest
}): Promise<number[]> {
  const uniqueIds = Array.from(new Set(args.mediaIds.filter((id) => Number.isFinite(id))))
  if (uniqueIds.length === 0) return []

  const referencedMediaIds = await collectReferencedMediaIds({
    candidateIds: uniqueIds,
    payload: args.payload,
    req: args.req,
  })

  const deletedIds: number[] = []

  for (const mediaId of uniqueIds) {
    if (referencedMediaIds.has(mediaId)) continue

    try {
      await args.payload.delete({
        collection: 'media',
        id: mediaId,
        overrideAccess: true,
        req: args.req,
      })
      deletedIds.push(mediaId)
    } catch (error) {
      console.warn(
        `[media-cleanup] failed to delete orphan media id=${mediaId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      )
    }
  }

  return deletedIds
}

export async function cleanupAllOrphanMedia(args: {
  payload: Payload
  req?: PayloadRequest
}): Promise<{ deletedIds: number[]; referencedCount: number; scannedCount: number }> {
  const allMediaIds: number[] = []
  let mediaPage = 1

  while (true) {
    const result = await args.payload.find({
      collection: 'media',
      depth: 0,
      limit: PAGE_SIZE,
      overrideAccess: true,
      page: mediaPage,
      req: args.req,
    })

    for (const media of result.docs) {
      const mediaId = toNumericId(media.id)
      if (mediaId !== null) allMediaIds.push(mediaId)
    }

    if (mediaPage >= result.totalPages) break
    mediaPage += 1
  }

  const referencedMediaIds = await collectReferencedMediaIds({
    candidateIds: allMediaIds,
    payload: args.payload,
    req: args.req,
  })
  const orphanIds = allMediaIds.filter((mediaId) => !referencedMediaIds.has(mediaId))
  const deletedIds = await deleteUnreferencedMediaByIds({
    mediaIds: orphanIds,
    payload: args.payload,
    req: args.req,
  })

  return {
    deletedIds,
    referencedCount: referencedMediaIds.size,
    scannedCount: allMediaIds.length,
  }
}
