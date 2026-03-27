import Image from 'next/image'
import Link from 'next/link'
import { IconCalendarEvent, IconClockHour4, IconUser } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { cn } from '@/lib/utils'

import { getMediaImageAlt } from '../lib/mediaAlt'

export type PostCardVariant = 'default' | 'discover-default' | 'discover-featured'

type PostCardProps = {
  title: string
  slug: string
  excerpt?: string | null
  contentText?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  authorName?: string | null
  authorAvatarUrl?: string | null
  tagLabel?: string | null
  schoolName?: string | null
  channelName?: string | null
  publishedLabel?: string | null
  readingMinutes?: number | null
  aspectClass?: string
  anonymousLabel: string
  readTimeLabel: string
  variant?: PostCardVariant
}

const ASPECT_CLASSES = [
  'aspect-[5/4]',
  'aspect-[6/5]',
  'aspect-[4/3]',
  'aspect-square',
  'aspect-[7/6]',
  'aspect-[3/2]',
]

export function getAspectClass(index: number): string {
  return ASPECT_CLASSES[index % ASPECT_CLASSES.length]
}

function NotebookPreview({ text }: { text: string }) {
  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-gradient-to-b from-[#fefcf3] via-[#fdf8ee] to-[#faf3e4]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(176,166,150,0.24) 29px, rgba(176,166,150,0.24) 30px)',
          backgroundPositionY: '8px',
        }}
      />
      <div className="absolute bottom-0 left-10 top-0 w-px bg-[#e8b4b8]/45" />
      <div className="absolute left-2.5 top-6 h-3.5 w-3.5 rounded-full border border-[#d0c8bc]/40 bg-[#f8f2e7]" />
      <div className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-[#d0c8bc]/40 bg-[#f8f2e7]" />
      <div className="relative z-10 px-5 pb-2 pl-14 pt-3">
        <p className="font-body line-clamp-[5] whitespace-pre-wrap break-words text-[15px] leading-[30px] text-[#4a4540]/82">
          {text}
        </p>
      </div>
    </div>
  )
}

export default function PostCard({
  title,
  slug,
  excerpt,
  contentText,
  coverImageUrl,
  coverImageAlt,
  authorName,
  authorAvatarUrl,
  tagLabel,
  schoolName,
  channelName,
  publishedLabel,
  readingMinutes,
  aspectClass = 'aspect-[5/4]',
  anonymousLabel,
  readTimeLabel,
  variant = 'default',
}: PostCardProps) {
  const previewText = excerpt || contentText || ''
  const hasImage = Boolean(coverImageUrl)
  const isDiscoverFeatured = variant === 'discover-featured'
  const isDiscover = variant !== 'default'

  return (
    <div className="masonry-item w-full" data-card-variant={variant}>
      <Link href={`/post/${slug}`} className="group block w-full no-underline">
        <CardSpotlight
          className={cn(
            'w-full overflow-hidden border border-campus-primary/8 bg-white/88 transition-all duration-300',
            'hover:-translate-y-0.5 hover:border-campus-primary/16',
            isDiscoverFeatured
              ? 'rounded-[1.6rem] shadow-[0_20px_48px_rgba(24,38,72,0.12)] hover:shadow-[0_24px_60px_rgba(24,38,72,0.16)]'
              : isDiscover
                ? 'rounded-[1.35rem] shadow-[0_14px_32px_rgba(24,38,72,0.09)] hover:shadow-[0_18px_40px_rgba(24,38,72,0.13)]'
                : 'rounded-xl shadow-sm hover:shadow-[0_8px_30px_rgba(13,59,102,0.1)]',
          )}
          spotlightColor={isDiscoverFeatured ? 'rgba(47, 109, 246, 0.12)' : 'rgba(13, 59, 102, 0.06)'}
        >
          <div className={cn('relative w-full overflow-hidden', aspectClass, isDiscoverFeatured && 'max-h-[18rem] sm:max-h-[21rem]', !isDiscoverFeatured && 'max-h-56 sm:max-h-60')}>
            {hasImage ? (
              <Image
                alt={getMediaImageAlt(coverImageAlt, 'cover-image')}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                src={coverImageUrl!}
                fill
                sizes="(min-width: 1280px) 26rem, (min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                unoptimized
              />
            ) : (
              <NotebookPreview text={previewText} />
            )}
            {hasImage ? (
              <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            ) : null}
          </div>

          <div className={cn(isDiscoverFeatured ? 'space-y-3.5 p-5 sm:p-6' : 'space-y-2.5 p-4')}>
            {(tagLabel || schoolName || channelName) ? (
              <div className="flex flex-wrap gap-1.5">
                {tagLabel ? (
                  <Badge
                    variant="secondary"
                    className="border-[#4a4540]/10 bg-[#4a4540]/8 text-[#4a4540]/70"
                  >
                    {tagLabel}
                  </Badge>
                ) : null}
                {schoolName ? (
                  <Badge
                    variant="secondary"
                    className="border-campus-primary/10 bg-campus-primary/8 text-campus-primary"
                  >
                    {schoolName}
                  </Badge>
                ) : null}
                {channelName ? (
                  <Badge
                    variant="secondary"
                    className="border-campus-teal/10 bg-campus-teal/10 text-campus-teal"
                  >
                    {channelName}
                  </Badge>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <h3
                className={cn(
                  'font-headline leading-snug text-campus-primary transition-colors duration-200 group-hover:text-campus-teal',
                  isDiscoverFeatured ? 'text-xl sm:text-[1.45rem]' : 'text-lg',
                )}
              >
                {title}
              </h3>
            </div>

            <div className={cn('flex gap-3', isDiscoverFeatured ? 'flex-col sm:flex-row sm:items-end sm:justify-between' : 'items-center justify-between')}>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 border border-campus-primary/10">
                  {authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} alt={authorName || ''} /> : null}
                  <AvatarFallback className="bg-campus-surface-container text-campus-on-surface-variant text-xs">
                    <IconUser size={14} />
                  </AvatarFallback>
                </Avatar>
                <span className="font-label text-[13px] text-foreground/60">
                  {authorName || anonymousLabel}
                </span>
              </div>
              <div
                data-testid="post-card-meta"
                className={cn(
                  'font-label text-[12px] text-foreground/50 text-right',
                  isDiscoverFeatured
                    ? 'flex flex-wrap justify-end gap-x-3 gap-y-1 sm:max-w-[12rem]'
                    : 'flex flex-col items-end gap-1',
                )}>
                {publishedLabel ? (
                  <span className="inline-flex items-center justify-end gap-1">
                    <IconCalendarEvent size={14} />
                    {publishedLabel}
                  </span>
                ) : null}
                {readingMinutes ? (
                  <span className="inline-flex items-center justify-end gap-1">
                    <IconClockHour4 size={14} />
                    {readingMinutes} {readTimeLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </CardSpotlight>
      </Link>
    </div>
  )
}
