import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies as getCookies } from 'next/headers.js'
import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import { IconChevronRight, IconClockHour4, IconMapPin, IconSchool } from '@tabler/icons-react'
import type { JSONContent } from '@tiptap/core'

import type { Post } from '@/payload-types'
import { TiptapReadOnly } from '@/components/editor/TiptapReadOnly'
import PostBackButton from '@/components/PostBackButton'
import PostFeed from '@/components/PostFeed'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getDictionary } from '../../lib/i18n/dictionaries'
import { resolveRequestLocale } from '../../lib/i18n/locale'
import {
  getPublishedPostBySlug,
  getPublishedPosts,
  getPublishedPostsBySchool,
  getPublishedPostsBySchoolAndChannel,
} from '../../lib/cmsData'
import {
  estimatePostReadingMinutes,
  getPostAuthor,
  getPostPreviewText,
  getPostPrimaryTag,
  getPostPublishedLabel,
  getPostSchool,
  getPostSubChannel,
} from '../../lib/postPresentation'

function dedupePosts(posts: Post[]): Post[] {
  const seen = new Set<number>()

  return posts.filter((post) => {
    if (seen.has(post.id)) return false
    seen.add(post.id)
    return true
  })
}

async function getRelatedPosts(post: Post) {
  const school = getPostSchool(post)
  const channel = getPostSubChannel(post)
  const candidates: Post[] = []

  if (school && channel) {
    candidates.push(...(await getPublishedPostsBySchoolAndChannel(school.id, channel.id)))
  }

  if (school) {
    candidates.push(...(await getPublishedPostsBySchool(school.id)))
  }

  candidates.push(...(await getPublishedPosts()))

  return dedupePosts(candidates)
    .filter((candidate) => candidate.id !== post.id)
    .slice(0, 4)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [headers, cookies] = await Promise.all([getHeaders(), getCookies()])
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    return {
      title: `${t.post.notFoundTitle} | ${t.common.appName}`,
    }
  }

  return {
    title: `${post.title} | ${t.common.appName}`,
    description: getPostPreviewText(post, 160),
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post)
  const school = getPostSchool(post)
  const channel = getPostSubChannel(post)
  const author = getPostAuthor(post)
  const primaryTag = getPostPrimaryTag(post)
  const publishedLabel = getPostPublishedLabel(post.publishedAt ?? post.createdAt, locale)
  const readingMinutes = estimatePostReadingMinutes(post)
  const backHref = channel
    ? `/school/${school?.slug}/channel/${channel.slug}`
    : school
      ? `/school/${school.slug}`
      : '/'
  const articleContent =
    post.content && typeof post.content === 'object' && !Array.isArray(post.content)
      ? (post.content as JSONContent)
      : undefined

  return (
    <article className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-label text-foreground/50">
          <Link href="/" className="transition-colors hover:text-campus-primary">
            {t.post.discover}
          </Link>
          {school ? (
            <>
              <IconChevronRight size={14} />
              <Link
                href={`/school/${school.slug}`}
                className="transition-colors hover:text-campus-primary"
              >
                {school.name}
              </Link>
            </>
          ) : null}
          {channel ? (
            <>
              <IconChevronRight size={14} />
              <Link
                href={`/school/${school?.slug}/channel/${channel.slug}`}
                className="transition-colors hover:text-campus-primary"
              >
                {channel.name}
              </Link>
            </>
          ) : null}
          <IconChevronRight size={14} />
          <span className="text-foreground/70">{post.title}</span>
        </nav>

        <PostBackButton fallbackHref={backHref} label={t.post.back} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-8">
            <header className="relative rounded-[2rem] border border-campus-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(54,117,136,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.74))] p-5 pr-24 shadow-[0_20px_64px_rgba(13,59,102,0.08)] sm:p-6 sm:pr-28">
              <div className="absolute bottom-5 right-5 flex max-w-[45%] flex-wrap justify-end gap-2 sm:bottom-6 sm:right-6">
                {primaryTag ? (
                  <Badge className="bg-campus-primary text-white hover:bg-campus-primary">
                    {primaryTag.name}
                  </Badge>
                ) : null}
                {school ? (
                  <Badge
                    variant="secondary"
                    className="border-campus-primary/10 bg-campus-primary/8 text-campus-primary"
                  >
                    {school.name}
                  </Badge>
                ) : null}
                {channel ? (
                  <Badge
                    variant="secondary"
                    className="border-campus-teal/10 bg-campus-teal/10 text-campus-teal"
                  >
                    {channel.name}
                  </Badge>
                ) : null}
              </div>

              <h1 className="font-headline text-4xl font-bold leading-tight text-campus-primary sm:text-5xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/65 sm:text-lg">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-label text-foreground/60">
                <div className="flex items-center gap-3 rounded-full bg-white/75 px-3 py-2 shadow-sm">
                  <Avatar className="h-9 w-9 border border-campus-primary/10">
                    {author?.avatar && typeof author.avatar === 'object' ? (
                      <AvatarImage src={author.avatar.url ?? undefined} alt={author.displayName} />
                    ) : null}
                    <AvatarFallback className="bg-campus-surface-container text-campus-primary">
                      {author?.displayName?.slice(0, 1).toUpperCase() ?? 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-foreground/80">
                      {author?.displayName ?? t.common.anonymous}
                    </div>
                    {publishedLabel ? (
                      <div className="text-xs text-foreground/45">
                        {t.post.published}: {publishedLabel}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 shadow-sm">
                  <IconClockHour4 size={16} />
                  <span>
                    {readingMinutes} {t.post.readTime}
                  </span>
                </div>
              </div>
            </header>

            <section className="rounded-[2rem] border border-campus-primary/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(13,59,102,0.06)] backdrop-blur-sm sm:p-8">
              <TiptapReadOnly
                content={articleContent}
                bordered={false}
                className="min-h-[8rem]"
                contentClassName="article-prose tiptap-readonly"
                loadingClassName="article-prose"
              />
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/40">
                {t.post.school}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="rounded-2xl bg-campus-primary/10 p-3 text-campus-primary">
                  <IconSchool size={20} />
                </div>
                <div>
                  <div className="font-headline text-xl text-campus-primary">
                    {school?.name ?? t.common.appName}
                  </div>
                  {school ? (
                    <Link
                      href={`/school/${school.slug}`}
                      className="mt-1 inline-flex items-center gap-1 text-sm text-campus-primary/70 hover:text-campus-primary"
                    >
                      <IconMapPin size={14} />
                      /school/{school.slug}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            {channel ? (
              <section className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/40">
                  {t.post.channel}
                </div>
                <div className="mt-3">
                  <div className="font-headline text-xl text-campus-primary">{channel.name}</div>
                  <Link
                    href={`/school/${school?.slug}/channel/${channel.slug}`}
                    className="mt-2 inline-flex text-sm text-campus-teal hover:text-campus-primary"
                  >
                    /channel/{channel.slug}
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/40">
                {t.post.author}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <Avatar className="h-12 w-12 border border-campus-primary/10">
                  {author?.avatar && typeof author.avatar === 'object' ? (
                    <AvatarImage src={author.avatar.url ?? undefined} alt={author.displayName} />
                  ) : null}
                  <AvatarFallback className="bg-campus-surface-container text-campus-primary">
                    {author?.displayName?.slice(0, 1).toUpperCase() ?? 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="font-label text-base font-semibold text-foreground/80">
                    {author?.displayName ?? t.common.anonymous}
                  </div>
                  <p className="text-sm leading-6 text-foreground/60">
                    {author?.bio?.trim() || t.post.authorBioFallback}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {relatedPosts.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-headline text-3xl text-campus-primary">
                {channel ? t.post.relatedChannel : t.post.relatedSchool}
              </h2>
            </div>
            <PostFeed posts={relatedPosts} locale={locale} showSchoolName showChannelName />
          </section>
        ) : null}
      </div>
    </article>
  )
}
