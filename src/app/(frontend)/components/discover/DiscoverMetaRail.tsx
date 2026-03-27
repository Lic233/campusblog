import Link from 'next/link'

import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { DiscoverRailLink, DiscoverTagChip } from '@/app/(frontend)/lib/discoverPresentation'

type DiscoverMetaRailProps = {
  copy: FrontendDictionary['discoverHome']
  schoolLinks: DiscoverRailLink[]
  channelLinks: DiscoverRailLink[]
  tagChips: DiscoverTagChip[]
}

export default function DiscoverMetaRail({
  copy,
  schoolLinks,
  channelLinks,
  tagChips,
}: DiscoverMetaRailProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.schoolHighlights}
        </h2>
        <div className="mt-4 space-y-2">
          {schoolLinks.map((school) => (
            <Link
              key={school.href}
              href={school.href}
              className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-foreground/72 no-underline transition-colors hover:bg-campus-primary/6 hover:text-campus-primary"
            >
              <span>{school.label}</span>
              <span className="font-label text-xs text-foreground/45">{school.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.channelShortcuts}
        </h2>
        <div className="mt-4 space-y-2">
          {channelLinks.map((channel) => (
            <Link
              key={channel.href}
              href={channel.href}
              className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-foreground/72 no-underline transition-colors hover:bg-campus-teal/8 hover:text-campus-teal"
            >
              <span>{channel.label}</span>
              <span className="font-label text-xs text-foreground/45">{channel.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.trendingTags}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tagChips.map((tag) => (
            <span
              key={tag.label}
              className="rounded-full border border-campus-primary/10 bg-campus-primary/[0.04] px-3 py-1.5 text-sm text-campus-primary/80"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </section>
    </aside>
  )
}
