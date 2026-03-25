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
  type?: string
  text?: string
  attrs?: {
    mediaId?: number | string | null
  }
  content?: TiptapNode[]
}

type PostQuotaInput = {
  content?: unknown
  coverImage?: RelationValue
  excerpt?: string | null
  title?: string | null
}

type CountedPostDoc = PostQuotaInput & {
  id: number | string
}

export type QuotaProjection = {
  allowed: boolean
  quotaBytes: number
  remainingBytes: number
  requiredBytes: number
  usedBytes: number
}

const DEFAULT_QUOTA_BYTES = 104857600
const PAGE_SIZE = 100

function toNumericId(value: number | string | undefined | null): number | null {
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

function getUtf8Length(value: string | null | undefined): number {
  if (!value) return 0
  return new TextEncoder().encode(value).length
}

function collectContentStats(content: unknown): { mediaIds: number[]; textBytes: number } {
  if (!content || typeof content !== 'object') {
    return { mediaIds: [], textBytes: 0 }
  }

  const mediaIds = new Set<number>()
  let textBytes = 0

  const walk = (node: TiptapNode) => {
    if (typeof node.text === 'string') {
      textBytes += getUtf8Length(node.text)
    }

    if (node.type === 'image') {
      const mediaId = toNumericId(node.attrs?.mediaId)
      if (mediaId) mediaIds.add(mediaId)
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child)
      }
    }
  }

  walk(content as TiptapNode)

  return {
    mediaIds: Array.from(mediaIds),
    textBytes,
  }
}

function collectPostMediaIds(post: PostQuotaInput): number[] {
  const mediaIds = new Set<number>(collectContentStats(post.content).mediaIds)
  const coverImageId = getRelationId(post.coverImage)

  if (coverImageId) {
    mediaIds.add(coverImageId)
  }

  return Array.from(mediaIds)
}

async function getMediaSizeMap(
  payload: Payload,
  mediaIds: number[],
  req?: PayloadRequest,
): Promise<Map<number, number>> {
  if (mediaIds.length === 0) return new Map()

  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: mediaIds.length,
    overrideAccess: true,
    req,
    where: {
      id: {
        in: mediaIds,
      },
    },
  })

  const sizeMap = new Map<number, number>()

  for (const doc of result.docs) {
    const docId = toNumericId(doc.id)
    if (!docId) continue
    sizeMap.set(docId, doc.filesize ?? 0)
  }

  return sizeMap
}

function getPostUsageBytesFromMap(post: PostQuotaInput, mediaSizeMap: Map<number, number>): number {
  const { mediaIds, textBytes } = collectContentStats(post.content)
  const uniqueMediaIds = new Set<number>(mediaIds)
  const coverImageId = getRelationId(post.coverImage)

  if (coverImageId) {
    uniqueMediaIds.add(coverImageId)
  }

  let mediaBytes = 0

  for (const mediaId of uniqueMediaIds) {
    mediaBytes += mediaSizeMap.get(mediaId) ?? 0
  }

  return textBytes + getUtf8Length(post.title) + getUtf8Length(post.excerpt) + mediaBytes
}

async function getCountedPostsForUser(
  payload: Payload,
  userId: number | string,
  options?: {
    excludePostId?: number | string | null
    req?: PayloadRequest
  },
): Promise<CountedPostDoc[]> {
  const docs: CountedPostDoc[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: PAGE_SIZE,
      overrideAccess: true,
      page,
      req: options?.req,
      sort: '-updatedAt',
      where: {
        and: [
          {
            author: {
              equals: userId,
            },
          },
          ...(options?.excludePostId
            ? [
                {
                  id: {
                    not_equals: options.excludePostId,
                  },
                },
              ]
            : []),
        ],
      },
    })

    docs.push(...(result.docs as CountedPostDoc[]))

    if (page >= result.totalPages) break
    page += 1
  }

  return docs
}

export async function projectQuotaForPost(args: {
  candidatePost: PostQuotaInput
  excludePostId?: number | string | null
  payload: Payload
  quotaBytes?: number | null
  req?: PayloadRequest
  userId: number | string
}): Promise<QuotaProjection> {
  const countedPosts = await getCountedPostsForUser(args.payload, args.userId, {
    excludePostId: args.excludePostId,
    req: args.req,
  })

  const mediaIds = new Set<number>(collectPostMediaIds(args.candidatePost))
  for (const post of countedPosts) {
    for (const mediaId of collectPostMediaIds(post)) {
      mediaIds.add(mediaId)
    }
  }

  const mediaSizeMap = await getMediaSizeMap(args.payload, Array.from(mediaIds), args.req)
  const existingBytes = countedPosts.reduce(
    (total, post) => total + getPostUsageBytesFromMap(post, mediaSizeMap),
    0,
  )
  const requiredBytes = getPostUsageBytesFromMap(args.candidatePost, mediaSizeMap)
  const usedBytes = existingBytes + requiredBytes
  const quotaBytes = args.quotaBytes ?? DEFAULT_QUOTA_BYTES

  return {
    allowed: usedBytes <= quotaBytes,
    quotaBytes,
    remainingBytes: Math.max(quotaBytes - existingBytes, 0),
    requiredBytes,
    usedBytes,
  }
}

export async function getPostUsageBytesMap(args: {
  payload: Payload
  posts: (PostQuotaInput & { id: number | string })[]
  req?: PayloadRequest
}): Promise<Map<string, number>> {
  const mediaIds = new Set<number>()

  for (const post of args.posts) {
    for (const mediaId of collectPostMediaIds(post)) {
      mediaIds.add(mediaId)
    }
  }

  const mediaSizeMap = await getMediaSizeMap(args.payload, Array.from(mediaIds), args.req)
  const usageMap = new Map<string, number>()

  for (const post of args.posts) {
    usageMap.set(String(post.id), getPostUsageBytesFromMap(post, mediaSizeMap))
  }

  return usageMap
}

export async function recalculateUsedBytesForUser(args: {
  payload: Payload
  req: PayloadRequest
  userId: number | string
}): Promise<number> {
  const countedPosts = await getCountedPostsForUser(args.payload, args.userId, { req: args.req })
  const mediaIds = new Set<number>()

  for (const post of countedPosts) {
    for (const mediaId of collectPostMediaIds(post)) {
      mediaIds.add(mediaId)
    }
  }

  const mediaSizeMap = await getMediaSizeMap(args.payload, Array.from(mediaIds), args.req)
  const usedBytes = countedPosts.reduce(
    (total, post) => total + getPostUsageBytesFromMap(post, mediaSizeMap),
    0,
  )

  await args.req.payload.update({
    collection: 'users',
    data: {
      usedBytes,
    },
    id: args.userId,
    overrideAccess: true,
    req: args.req,
  })

  return usedBytes
}
