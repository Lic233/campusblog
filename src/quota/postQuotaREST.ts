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

type PublishedPostDoc = PostQuotaInput & {
  id: number | string
}

type MediaDoc = {
  filesize?: number | null
  id: number | string
}

type FindClient = {
  find<TDoc>(
    collection: string,
    options?: {
      depth?: number
      limit?: number
      page?: number
      sort?: string
      where?: Record<string, unknown>
    },
  ): Promise<{ docs: TDoc[]; totalPages: number }>
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

async function getMediaSizeMap(client: FindClient, mediaIds: number[]): Promise<Map<number, number>> {
  if (mediaIds.length === 0) return new Map()

  const result = await client.find<MediaDoc>('media', {
    depth: 0,
    limit: mediaIds.length,
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

async function getPublishedPostsForUser(
  client: FindClient,
  userId: number | string,
  options?: {
    excludePostId?: number | string | null
  },
): Promise<PublishedPostDoc[]> {
  const docs: PublishedPostDoc[] = []
  let page = 1

  while (true) {
    const result = await client.find<PublishedPostDoc>('posts', {
      depth: 0,
      limit: PAGE_SIZE,
      page,
      sort: '-updatedAt',
      where: {
        and: [
          {
            author: {
              equals: userId,
            },
          },
          {
            status: {
              equals: 'published',
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

    docs.push(...result.docs)

    if (page >= result.totalPages) break
    page += 1
  }

  return docs
}

export async function projectQuotaForPublishedPostREST(args: {
  candidatePost: PostQuotaInput
  client: FindClient
  excludePostId?: number | string | null
  quotaBytes?: number | null
  userId: number | string
}): Promise<QuotaProjection> {
  const publishedPosts = await getPublishedPostsForUser(args.client, args.userId, {
    excludePostId: args.excludePostId,
  })

  const mediaIds = new Set<number>(collectPostMediaIds(args.candidatePost))
  for (const post of publishedPosts) {
    for (const mediaId of collectPostMediaIds(post)) {
      mediaIds.add(mediaId)
    }
  }

  const mediaSizeMap = await getMediaSizeMap(args.client, Array.from(mediaIds))
  const publishedBytes = publishedPosts.reduce(
    (total, post) => total + getPostUsageBytesFromMap(post, mediaSizeMap),
    0,
  )
  const requiredBytes = getPostUsageBytesFromMap(args.candidatePost, mediaSizeMap)
  const usedBytes = publishedBytes + requiredBytes
  const quotaBytes = args.quotaBytes ?? DEFAULT_QUOTA_BYTES

  return {
    allowed: usedBytes <= quotaBytes,
    quotaBytes,
    remainingBytes: Math.max(quotaBytes - publishedBytes, 0),
    requiredBytes,
    usedBytes,
  }
}

