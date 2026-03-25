import { revalidateTag } from 'next/cache'
import { after } from 'next/server'

import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { resolveRequestLocale } from '@/app/(frontend)/lib/i18n/locale'
import { PayloadRESTError, createPayloadRESTClient } from '../../../../lib/payloadREST'
import { projectQuotaForPublishedPostREST } from '@/quota/postQuotaREST'

export const runtime = 'nodejs'
export const maxDuration = 15

type PostRequestBody = {
  title?: string
  content?: unknown
  school?: string | number
  subChannel?: string | number
  tags?: (string | number)[]
  excerpt?: string
  coverImage?: string | number | null
  status?: 'draft' | 'published'
}

type UserDoc = {
  id: number | string
  quotaBytes?: number | null
}

type PostDoc = {
  id: number | string
  slug: string
  status: string
}

const EMPTY_TIPTAP_DOC = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
}

function toNumericId(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function formatBytes(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 1024 * 1024 ? 1 : 0,
  })

  if (value >= 1024 * 1024 * 1024) return `${formatter.format(value / (1024 * 1024 * 1024))} GB`
  if (value >= 1024 * 1024) return `${formatter.format(value / (1024 * 1024))} MB`
  if (value >= 1024) return `${formatter.format(value / 1024)} KB`
  return `${formatter.format(value)} B`
}

export async function POST(request: Request) {
  try {
    const locale = resolveRequestLocale({
      acceptLanguage: request.headers.get('accept-language'),
    })
    const t = getDictionary(locale)
    const body = (await request.json()) as PostRequestBody
    const { title, content, school, subChannel, tags, excerpt, coverImage, status } = body
    const nextStatus = status === 'draft' ? 'draft' : 'published'

    if (nextStatus === 'published' && (!title || typeof title !== 'string' || !title.trim())) {
      return Response.json({ error: t.editor.titleRequired }, { status: 400 })
    }
    if (nextStatus === 'published' && !content) {
      return Response.json({ error: t.editor.contentRequired }, { status: 400 })
    }
    if (!school) {
      return Response.json({ error: t.editor.schoolRequired }, { status: 400 })
    }

    const payload = createPayloadRESTClient(request)
    const authUser = await payload.auth<{ id: number | string }>()

    if (!authUser) {
      return Response.json({ error: t.editor.authRequired }, { status: 401 })
    }

    const currentUser = await payload.findByID<UserDoc>('users', authUser.id, { depth: 0 })

    const normalizedTitle =
      title && typeof title === 'string' && title.trim()
        ? title.trim()
        : `Untitled Draft ${Date.now().toString(36)}`
    const normalizedContent = content ?? EMPTY_TIPTAP_DOC

    const schoolId = toNumericId(school)
    if (!schoolId) {
      return Response.json({ error: t.editor.schoolRequired }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      title: normalizedTitle,
      content: normalizedContent,
      school: schoolId,
      status: nextStatus,
    }

    const subChannelId = toNumericId(subChannel)
    if (subChannelId) data.subChannel = subChannelId

    if (excerpt) data.excerpt = excerpt

    const coverImageId = toNumericId(coverImage ?? undefined)
    data.coverImage = coverImageId ?? null

    if (tags && Array.isArray(tags) && tags.length > 0) {
      data.tags = tags.map((tag) => toNumericId(tag)).filter(Boolean)
    }

    if (nextStatus === 'published') {
      const projection = await projectQuotaForPublishedPostREST({
        candidatePost: {
          content: normalizedContent,
          coverImage: coverImageId ?? null,
          excerpt: excerpt?.trim() || null,
          title: normalizedTitle,
        },
        client: payload,
        quotaBytes: currentUser.quotaBytes,
        userId: currentUser.id,
      })

      if (!projection.allowed) {
        return Response.json(
          {
            error: `${t.editor.quotaExceeded} ${t.userCenter.remainingQuota}: ${formatBytes(projection.remainingBytes, locale)}. ${t.editor.requiredQuota}: ${formatBytes(projection.requiredBytes, locale)}.`,
            quota: projection,
          },
          { status: 400 },
        )
      }
    }

    const post = await payload.create<PostDoc>('posts', data)

    revalidateTag('posts', 'max')
    revalidateTag('posts-by-school', 'max')
    revalidateTag('posts-by-school-channel', 'max')

    after(() => {
      const channelInfo = subChannelId ? ` channel=${subChannelId}` : ''
      console.info(
        `[editor-posts:create] id=${post.id} slug=${post.slug} school=${schoolId}${channelInfo}`,
      )
    })

    return Response.json({
      success: true,
      post: { id: post.id, slug: post.slug, status: post.status },
    })
  } catch (err) {
    const message =
      err instanceof PayloadRESTError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Unknown error'
    console.error('POST /api/editor/posts error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}


