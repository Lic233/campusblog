import type { Post } from '@/payload-types'

import type { AppLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import {
  estimatePostReadingMinutes,
  getPostAuthor,
  getPostCoverImage,
  getPostPreviewText,
  getPostPrimaryTag,
  getPostPublishedLabel,
  getPostSchool,
  getPostSubChannel,
} from '@/lib/postPresentation'
import PostCard, { getAspectClass } from '@/components/PostCard'

type PostFeedProps = {
  posts: Post[]
  locale: AppLocale
  showSchoolName?: boolean
  showChannelName?: boolean
}

export default function PostFeed({
  posts,
  locale,
  showSchoolName = false,
  showChannelName = true,
}: PostFeedProps) {
  if (posts.length === 0) return null
  const t = getDictionary(locale)

  return (
    <div className="masonry-grid">
      {posts.map((post, index) => {
        const coverImage = getPostCoverImage(post)
        const primaryTag = getPostPrimaryTag(post)
        const author = getPostAuthor(post)
        const authorAvatar =
          author?.avatar && typeof author.avatar === 'object' ? author.avatar.url : null
        const school = getPostSchool(post)
        const subChannel = getPostSubChannel(post)

        return (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            contentText={getPostPreviewText(post)}
            coverImageUrl={coverImage?.url}
            coverImageAlt={coverImage?.alt ?? post.title}
            authorName={author?.displayName}
            authorAvatarUrl={authorAvatar}
            tagLabel={primaryTag?.name}
            schoolName={showSchoolName ? school?.name : null}
            channelName={showChannelName ? subChannel?.name : null}
            publishedLabel={getPostPublishedLabel(post.publishedAt ?? post.createdAt, locale)}
            readingMinutes={estimatePostReadingMinutes(post)}
            aspectClass={getAspectClass(index)}
            anonymousLabel={t.common.anonymous}
            readTimeLabel={t.post.readTimeShort}
          />
        )
      })}
    </div>
  )
}
