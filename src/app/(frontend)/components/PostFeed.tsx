import type { Post } from '@/payload-types'

import type { AppLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { getMediaImageAlt } from '@/app/(frontend)/lib/mediaAlt'
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
import PostCard, { getAspectClass, type PostCardVariant } from '@/components/PostCard'

export type PostFeedVariant = 'default' | 'discover'

type PostFeedProps = {
  posts: Post[]
  locale: AppLocale
  showSchoolName?: boolean
  showChannelName?: boolean
  variant?: PostFeedVariant
  featuredCount?: number
}

function getDiscoverAspectClass(index: number): string {
  if (index === 0) return 'aspect-[7/5]'
  if (index === 1) return 'aspect-[6/5]'
  return getAspectClass(index)
}

function getCardVariant(index: number, variant: PostFeedVariant, featuredCount: number): PostCardVariant {
  if (variant !== 'discover') return 'default'
  return index < featuredCount ? 'discover-featured' : 'discover-default'
}

export default function PostFeed({
  posts,
  locale,
  showSchoolName = false,
  showChannelName = true,
  variant = 'default',
  featuredCount = 0,
}: PostFeedProps) {
  if (posts.length === 0) return null
  const t = getDictionary(locale)

  return (
    <div
      data-testid={variant === 'discover' ? 'discover-post-feed' : undefined}
      className={variant === 'discover' ? 'masonry-grid masonry-grid--discover' : 'masonry-grid'}
    >
      {posts.map((post, index) => {
        const coverImage = getPostCoverImage(post)
        const primaryTag = getPostPrimaryTag(post)
        const author = getPostAuthor(post)
        const authorAvatar =
          author?.avatar && typeof author.avatar === 'object' ? author.avatar.url : null
        const school = getPostSchool(post)
        const subChannel = getPostSubChannel(post)
        const cardVariant = getCardVariant(index, variant, featuredCount)
        const aspectClass =
          cardVariant === 'discover-featured' ? getDiscoverAspectClass(index) : getAspectClass(index)

        return (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            contentText={getPostPreviewText(post)}
            coverImageUrl={coverImage?.url}
            coverImageAlt={getMediaImageAlt(coverImage?.alt, 'cover-image')}
            authorName={author?.displayName}
            authorAvatarUrl={authorAvatar}
            tagLabel={primaryTag?.name}
            schoolName={showSchoolName ? school?.name : null}
            channelName={showChannelName ? subChannel?.name : null}
            publishedLabel={getPostPublishedLabel(post.publishedAt ?? post.createdAt, locale)}
            readingMinutes={estimatePostReadingMinutes(post)}
            aspectClass={aspectClass}
            anonymousLabel={t.common.anonymous}
            readTimeLabel={t.post.readTimeShort}
            variant={cardVariant}
          />
        )
      })}
    </div>
  )
}


