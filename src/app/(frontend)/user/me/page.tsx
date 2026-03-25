import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'
import { redirect } from 'next/navigation'

import type { Post } from '@/payload-types'
import LogoutButton from '@/components/auth/LogoutButton'
import UserProfileEditor from '@/components/user/UserProfileEditor'
import UserPostActions from '@/components/user/UserPostActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sanitizeNextPath } from '@/lib/authNavigation'
import { getFrontendPayload, getCurrentFrontendUser } from '@/lib/frontendSession'
import { getPostSchool, getPostSubChannel } from '@/lib/postPresentation'
import { getPostUsageBytesMap } from '@/quota/postQuota'
import { getDictionary } from '../../lib/i18n/dictionaries'
import { resolveRequestLocale } from '../../lib/i18n/locale'

function formatBytes(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 1024 * 1024 ? 1 : 0,
  })

  if (value >= 1024 * 1024 * 1024) return `${formatter.format(value / (1024 * 1024 * 1024))} GB`
  if (value >= 1024 * 1024) return `${formatter.format(value / (1024 * 1024))} MB`
  if (value >= 1024) return `${formatter.format(value / 1024)} KB`
  return `${formatter.format(value)} B`
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(date)
}

function UserPostList({
  actionHref,
  emptyLabel,
  hrefLabel,
  locale,
  metaLabel,
  posts,
  postUsageBytes,
  t,
}: {
  actionHref?: (post: Post) => string | null
  emptyLabel: string
  hrefLabel: string
  locale: string
  metaLabel: string | null
  posts: Post[]
  postUsageBytes: Map<string, number>
  t: ReturnType<typeof getDictionary>
}) {
  if (posts.length === 0) {
    return <p className="text-sm font-label text-foreground/50">{emptyLabel}</p>
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const school = getPostSchool(post)
        const channel = getPostSubChannel(post)

        return (
          <div
            key={post.id}
            className="rounded-2xl border border-campus-primary/10 bg-white/70 px-4 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {metaLabel ? (
                  <div className="font-label text-xs uppercase tracking-[0.18em] text-foreground/40">
                    {metaLabel}
                  </div>
                ) : null}
                <h3 className="mt-2 font-headline text-xl leading-snug text-campus-primary">
                  {post.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
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
                <p className="mt-3 text-sm font-label text-foreground/55">
                  {formatDate(post.publishedAt ?? post.updatedAt, locale)}
                </p>
                <p className="mt-2 text-sm font-label text-foreground/55">
                  {t.userCenter.usedQuota}:{' '}
                  {formatBytes(postUsageBytes.get(String(post.id)) ?? 0, locale)}
                </p>
              </div>

              <UserPostActions
                actionHref={actionHref?.(post)}
                actionLabel={hrefLabel}
                cancelLabel={t.common.cancel}
                confirmActionLabel={t.common.confirm}
                confirmLabel={t.userCenter.deletePostConfirm}
                deleteErrorLabel={t.userCenter.deletePostError}
                deleteLabel={t.userCenter.deletePost}
                deletingLabel={t.userCenter.deletingPost}
                postId={post.id}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function UserCenterPage() {
  const [headers, cookies] = await Promise.all([getHeaders(), getCookies()])
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)

  const currentUser = await getCurrentFrontendUser(headers)
  if (!currentUser) {
    redirect(`/login?next=${encodeURIComponent(sanitizeNextPath('/user/me', '/user/me'))}`)
  }

  const payload = await getFrontendPayload()
  const [draftPostsResult, publishedPostsResult] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        and: [{ author: { equals: currentUser.id } }, { status: { equals: 'draft' } }],
      },
      sort: '-updatedAt',
      depth: 1,
      limit: 50,
      user: currentUser,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'posts',
      where: {
        and: [{ author: { equals: currentUser.id } }, { status: { equals: 'published' } }],
      },
      sort: '-publishedAt',
      depth: 1,
      limit: 50,
      user: currentUser,
      overrideAccess: false,
    }),
  ])
  const postUsageBytes = await getPostUsageBytesMap({
    payload,
    posts: [...draftPostsResult.docs, ...publishedPostsResult.docs],
  })

  const quotaBytes = currentUser.quotaBytes ?? 0
  const usedBytes = currentUser.usedBytes ?? 0
  const remainingBytes = Math.max(quotaBytes - usedBytes, 0)
  const avatarUrl =
    currentUser.avatar && typeof currentUser.avatar === 'object'
      ? (currentUser.avatar.url ?? undefined)
      : undefined

  return (
    <section className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-label text-xs uppercase tracking-[0.18em] text-campus-primary/45">
              {t.common.appName}
            </p>
            <h1 className="mt-2 font-headline text-4xl font-bold text-campus-primary">
              {t.userCenter.pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/60">
              {t.userCenter.pageSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 min-w-[11rem] flex-1 rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_28px_rgba(13,59,102,0.18)]"
            >
              <Link href="/editor">{t.userCenter.writeArticle}</Link>
            </Button>
            <LogoutButton
              label={t.common.logout}
              pendingLabel={t.common.logoutPending}
              className="h-11 min-w-[11rem] flex-1"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
          <Card className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 py-0 shadow-[0_16px_48px_rgba(13,59,102,0.08)]">
            <CardHeader className="border-b border-campus-primary/8 py-5">
              <CardTitle className="font-headline text-2xl text-campus-primary">
                {t.userCenter.profileCardTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <UserProfileEditor
                userId={currentUser.id}
                displayName={currentUser.displayName}
                email={currentUser.email}
                bio={currentUser.bio}
                avatarUrl={avatarUrl}
                copy={{
                  avatarHint: t.userCenter.avatarHint,
                  avatarUpload: t.userCenter.avatarUpload,
                  bioLabel: t.userCenter.bioLabel,
                  displayNameLabel: t.auth.displayNameLabel,
                  emailLabel: t.userCenter.emailLabel,
                  noBio: t.userCenter.noBio,
                  profileError: t.userCenter.profileError,
                  profileSaved: t.userCenter.profileSaved,
                  saveProfile: t.userCenter.saveProfile,
                  savingProfile: t.userCenter.savingProfile,
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 py-0 shadow-[0_16px_48px_rgba(13,59,102,0.08)]">
            <CardHeader className="border-b border-campus-primary/8 py-5">
              <CardTitle className="font-headline text-2xl text-campus-primary">
                {t.userCenter.quotaCardTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-5 py-5">
              <div className="rounded-2xl bg-campus-primary/6 px-4 py-4">
                <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/45">
                  {t.userCenter.usedQuota}
                </div>
                <div className="mt-2 font-headline text-3xl text-campus-primary">
                  {formatBytes(usedBytes, locale)}
                </div>
              </div>
              <div className="rounded-2xl bg-campus-teal/8 px-4 py-4">
                <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/45">
                  {t.userCenter.totalQuota}
                </div>
                <div className="mt-2 font-headline text-3xl text-campus-primary">
                  {formatBytes(quotaBytes, locale)}
                </div>
              </div>
              <div className="rounded-2xl bg-campus-accent/8 px-4 py-4">
                <div className="text-xs font-label uppercase tracking-[0.18em] text-foreground/45">
                  {t.userCenter.remainingQuota}
                </div>
                <div className="mt-2 font-headline text-3xl text-campus-primary">
                  {formatBytes(remainingBytes, locale)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 py-0 shadow-[0_16px_48px_rgba(13,59,102,0.08)]">
          <CardHeader className="border-b border-campus-primary/8 py-5">
            <CardTitle className="font-headline text-2xl text-campus-primary">
              {t.userCenter.draftsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <UserPostList
              actionHref={(post) => `/editor?draft=${post.id}`}
              emptyLabel={t.userCenter.emptyDrafts}
              hrefLabel={t.userCenter.editDraft}
              locale={locale}
              metaLabel={t.userCenter.updatedAt}
              posts={draftPostsResult.docs}
              postUsageBytes={postUsageBytes}
              t={t}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-campus-primary/10 bg-white/80 py-0 shadow-[0_16px_48px_rgba(13,59,102,0.08)]">
          <CardHeader className="border-b border-campus-primary/8 py-5">
            <CardTitle className="font-headline text-2xl text-campus-primary">
              {t.userCenter.publishedTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <UserPostList
              actionHref={(post) => `/post/${post.slug}`}
              emptyLabel={t.userCenter.emptyPublished}
              hrefLabel={t.userCenter.viewPublicPost}
              locale={locale}
              metaLabel={null}
              posts={publishedPostsResult.docs}
              postUsageBytes={postUsageBytes}
              t={t}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
