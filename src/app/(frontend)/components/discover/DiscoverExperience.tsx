'use client'

import { useState } from 'react'

import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { DiscoverHomeData, DiscoverViewKey } from '@/app/(frontend)/lib/discoverPresentation'
import PostFeed from '@/components/PostFeed'
import SearchBar from '@/components/layout/SearchBar'

import DiscoverMetaRail from './DiscoverMetaRail'
import DiscoverTabs from './DiscoverTabs'

type DiscoverExperienceProps = {
  data: DiscoverHomeData
  locale: AppLocale
  searchPlaceholder: string
  copy: FrontendDictionary['discoverHome']
}

export default function DiscoverExperience({
  data,
  locale,
  searchPlaceholder,
  copy,
}: DiscoverExperienceProps) {
  const [activeKey, setActiveKey] = useState<DiscoverViewKey>('recommended')
  const activeView = data.views.find((view) => view.key === activeKey) ?? data.views[0]

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <div data-testid="discover-search-sticky" className="sticky top-[var(--discover-sticky-top)] z-20">
          <SearchBar
            placeholder={searchPlaceholder}
            className="max-w-none"
            inputClassName="h-12 border-campus-primary/12 bg-white/88 shadow-[0_14px_36px_rgba(24,38,72,0.10)]"
          />
        </div>

        <DiscoverTabs
          activeKey={activeKey}
          views={data.views}
          onChange={setActiveKey}
          ariaLabel={copy.tabListLabel}
        />

        <section className="space-y-2">
          <h2 className="font-headline text-3xl text-campus-primary">{activeView.title}</h2>
          <p className="text-sm leading-6 text-foreground/62">{activeView.hint}</p>
        </section>

        {activeView.posts.length > 0 ? (
          <PostFeed
            posts={activeView.posts}
            locale={locale}
            showSchoolName
            showChannelName
            variant="discover"
            featuredCount={2}
          />
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-campus-primary/16 bg-white/68 p-10 text-center shadow-sm">
            <h3 className="font-headline text-2xl text-campus-primary">{copy.empty.filteredTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-foreground/62">{copy.empty.filteredHint}</p>
          </section>
        )}
      </div>

      <DiscoverMetaRail
        copy={copy}
        schoolLinks={data.schoolLinks}
        channelLinks={data.channelLinks}
        tagChips={data.tagChips}
      />
    </div>
  )
}
