import Image from 'next/image'
import Link from 'next/link'
import { IconCalendarEvent, IconClockHour4, IconUser } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { getMediaImageAlt } from '../lib/mediaAlt'

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
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#fefcf3] via-[#fdf8ee] to-[#faf3e4] select-none">
      {/* Ruled lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 29px, rgba(176,166,150,0.24) 29px, rgba(176,166,150,0.24) 30px)',
          backgroundPositionY: '8px',
        }}
      />
      {/* Left margin line */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-[#e8b4b8]/45" />
      {/* Hole punches */}
      <div className="absolute left-2.5 top-6 h-3.5 w-3.5 rounded-full border border-[#d0c8bc]/40 bg-[#f8f2e7]" />
      <div className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-[#d0c8bc]/40 bg-[#f8f2e7]" />
      {/* Text content */}
      <div className="relative z-10 pl-14 pr-5 pt-3 pb-2">
        <p className="text-[15px] leading-[30px] text-[#4a4540]/82 font-body line-clamp-[5] whitespace-pre-wrap break-words">
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
}: PostCardProps) {
  const previewText = excerpt || contentText || ''
  const hasImage = Boolean(coverImageUrl)

  return (
    <div className="masonry-item w-full">
      <Link href={`/post/${slug}`} className="group block w-full no-underline">
        <CardSpotlight className="w-full bg-card rounded-xl overflow-hidden border border-transparent shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-campus-primary/10 hover:shadow-[0_8px_30px_rgba(13,59,102,0.1)]">
          {/* Cover / Notebook Preview */}
            <div className={`relative w-full ${aspectClass} max-h-56 overflow-hidden sm:max-h-60`}>
              {hasImage ? (
                <Image
                  alt={getMediaImageAlt(coverImageAlt, 'cover-image')}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  src={coverImageUrl!}
                  fill
                  sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                  unoptimized
                />
              ) : (
                <NotebookPreview text={previewText} />
              )}
            {hasImage && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-2.5">
            {(tagLabel || schoolName || channelName) && (
              <div className="flex flex-wrap gap-1.5">
                {tagLabel ? (
                  <Badge
                    variant="secondary"
                    className="bg-[#4a4540]/8 text-[#4a4540]/70 border-[#4a4540]/10"
                  >
                    {tagLabel}
                  </Badge>
                ) : null}
                {schoolName ? (
                  <Badge
                    variant="secondary"
                    className="bg-campus-primary/8 text-campus-primary border-campus-primary/10"
                  >
                    {schoolName}
                  </Badge>
                ) : null}
                {channelName ? (
                  <Badge
                    variant="secondary"
                    className="bg-campus-teal/10 text-campus-teal border-campus-teal/10"
                  >
                    {channelName}
                  </Badge>
                ) : null}
              </div>
            )}
            <h3 className="font-headline text-lg leading-snug text-campus-primary line-clamp-2 group-hover:text-campus-teal transition-colors duration-200">
              {title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-6 w-6 border border-campus-primary/10">
                  {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={authorName || ''} />}
                  <AvatarFallback className="bg-campus-surface-container text-campus-on-surface-variant text-xs">
                    <IconUser size={14} />
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-label text-foreground/60">
                  {authorName || anonymousLabel}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 text-[12px] font-label text-foreground/50">
                {publishedLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <IconCalendarEvent size={14} />
                    {publishedLabel}
                  </span>
                ) : null}
                {readingMinutes ? (
                  <span className="inline-flex items-center gap-1">
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
