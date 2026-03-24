import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import type { JSONContent } from '@tiptap/core'

import config from '@/payload.config'
import type { Post } from '@/payload-types'
import EditorForm from '@/components/editor/EditorForm'
import { getCurrentFrontendUser } from '@/lib/frontendSession'
import { getDictionary } from '../lib/i18n/dictionaries'
import { resolveRequestLocale } from '../lib/i18n/locale'

function toNumericId(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function toRelationId(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number | null }).id
    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }
  return ''
}

function toEditorContent(content: Post['content']): JSONContent | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null
  return content as JSONContent
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const currentUser = await getCurrentFrontendUser(headers)
  const { draft } = await searchParams

  if (!currentUser) {
    redirect('/login?next=%2Feditor')
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const draftId = toNumericId(draft)
  const [schoolsResult, subChannelsResult, tagsResult, initialPostResult] = await Promise.all([
    payload.find({
      collection: 'schools',
      where: { isActive: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
      depth: 0,
    }),
    payload.find({
      collection: 'school-sub-channels',
      where: { isActive: { equals: true } },
      sort: 'sortOrder',
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: 'tags',
      where: { isActive: { equals: true } },
      limit: 100,
      depth: 0,
    }),
    draftId
      ? payload
          .findByID({
            collection: 'posts',
            id: draftId,
            depth: 1,
            user: currentUser,
            overrideAccess: false,
          })
          .catch((): null => null)
      : Promise.resolve(null),
  ])

  const schools = schoolsResult.docs.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }))

  const subChannels = subChannelsResult.docs.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    school: typeof ch.school === 'object' && ch.school !== null ? (ch.school as { id: string | number }).id : ch.school as string | number,
  }))

  const tags = tagsResult.docs.map((tag) => ({
    id: tag.id,
    name: tag.name,
  }))

  if (draftId && (!initialPostResult || initialPostResult.status !== 'draft')) {
    redirect('/user/me')
  }

  const initialPost =
    initialPostResult && initialPostResult.status === 'draft'
      ? {
          id: String(initialPostResult.id),
          title: initialPostResult.title,
          excerpt: initialPostResult.excerpt ?? '',
          schoolId: toRelationId(initialPostResult.school),
          subChannelId: toRelationId(initialPostResult.subChannel),
          tagIds: (initialPostResult.tags ?? [])
            .map((tag: number | string | { id?: number | string | null }) => toRelationId(tag))
            .filter(Boolean),
          content: toEditorContent(initialPostResult.content),
        }
      : null

  return (
    <EditorForm
      schools={schools}
      subChannels={subChannels}
      tags={tags}
      t={t}
      initialPost={initialPost}
    />
  )
}
