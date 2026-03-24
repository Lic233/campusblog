import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'
import { IconCompass } from '@tabler/icons-react'

import PostCard, { getAspectClass } from '@/components/PostCard'
import SearchBar from '@/components/layout/SearchBar'
import { extractTextFromTiptapJson } from './lib/tiptap-text'
import { getDictionary } from './lib/i18n/dictionaries'
import { resolveRequestLocale } from './lib/i18n/locale'
import { getPublishedPosts } from './lib/cmsData'

type MediaDoc = {
  url?: string
  alt?: string
}

type TagDoc = {
  name?: string
}

type UserDoc = {
  displayName?: string
  avatar?: MediaDoc | string | number | null
}

export default async function DiscoverPage() {
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)

  const posts = await getPublishedPosts()

  return (
    <section className="px-6 lg:px-10">
      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-campus-surface/80 backdrop-blur-md py-5 flex justify-center">
        <SearchBar placeholder={t.common.searchPlaceholder} />
      </div>

      {posts.length > 0 ? (
        <div className="masonry-grid">
          {posts.map((post, index) => {
            const coverImage =
              post.coverImage && typeof post.coverImage === 'object'
                ? (post.coverImage as MediaDoc)
                : null

            const firstTag =
              post.tags && Array.isArray(post.tags) && post.tags.length > 0
                ? typeof post.tags[0] === 'object'
                  ? (post.tags[0] as TagDoc).name
                  : null
                : null

            const author =
              post.author && typeof post.author === 'object'
                ? (post.author as UserDoc)
                : null

            const authorAvatar =
              author?.avatar && typeof author.avatar === 'object'
                ? (author.avatar as MediaDoc).url
                : null

            return (
              <PostCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                contentText={extractTextFromTiptapJson(post.content)}
                coverImageUrl={coverImage?.url}
                coverImageAlt={coverImage?.alt}
                authorName={author?.displayName}
                authorAvatarUrl={authorAvatar}
                tagLabel={firstTag}
                aspectClass={getAspectClass(index)}
              />
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-campus-primary/10 via-campus-teal/10 to-campus-accent/10 flex items-center justify-center mb-8 animate-float shadow-lg shadow-campus-primary/5">
            <IconCompass size={52} className="text-campus-primary/50" />
          </div>
          <h2 className="font-headline text-3xl font-bold text-campus-primary mb-3">
            {t.discover.noPosts}
          </h2>
          <p className="text-foreground/60 font-label text-base max-w-sm">
            {t.discover.noPostsHint}
          </p>
        </div>
      )}
    </section>
  )
}
