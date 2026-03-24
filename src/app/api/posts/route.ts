import { getPayload } from 'payload'
import { revalidateTag } from 'next/cache'
import { after } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'
export const maxDuration = 15

type PostRequestBody = {
  title?: string
  content?: unknown
  school?: string | number
  subChannel?: string | number
  tags?: (string | number)[]
  excerpt?: string
  coverImage?: string | number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `post-${Date.now()}`
}

function toNumericId(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostRequestBody
    const { title, content, school, subChannel, tags, excerpt, coverImage } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!content) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!school) {
      return Response.json({ error: 'School is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return Response.json({ error: 'Authentication is required' }, { status: 401 })
    }

    const slug = slugify(title) + '-' + Date.now().toString(36)

    const schoolId = toNumericId(school)
    if (!schoolId) {
      return Response.json({ error: 'Invalid school ID' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      title: title.trim(),
      slug,
      content,
      school: schoolId,
      status: 'published',
    }

    const subChannelId = toNumericId(subChannel)
    if (subChannelId) data.subChannel = subChannelId

    if (excerpt) data.excerpt = excerpt
    if (coverImage) data.coverImage = toNumericId(coverImage)

    if (tags && Array.isArray(tags) && tags.length > 0) {
      data.tags = tags.map((t) => toNumericId(t)).filter(Boolean)
    }

    const post = await payload.create({
      collection: 'posts',
      overrideAccess: false,
      user,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })

    revalidateTag('posts', 'max')
    revalidateTag('posts-by-school', 'max')
    revalidateTag('posts-by-school-channel', 'max')

    after(() => {
      const channelInfo = subChannelId ? ` channel=${subChannelId}` : ''
      console.info(
        `[posts:create] id=${post.id} slug=${post.slug} school=${schoolId}${channelInfo}`,
      )
    })

    return Response.json({ success: true, post: { id: post.id, slug: post.slug } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/posts error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
