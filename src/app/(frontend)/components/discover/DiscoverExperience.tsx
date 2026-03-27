'use client'

import { useState } from 'react'

import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { DiscoverHomeData, DiscoverViewKey } from '@/app/(frontend)/lib/discoverPresentation'
import PostFeed from '@/components/PostFeed'

import DiscoverMetaRail from './DiscoverMetaRail'
import DiscoverTabs from './DiscoverTabs'

type DiscoverExperienceProps = {
  data: DiscoverHomeData
  locale: AppLocale
  copy: FrontendDictionary['discoverHome']
}

export default function DiscoverExperience({ data, locale, copy }: DiscoverExperienceProps) {
  const [activeKey, setActiveKey] = useState<DiscoverViewKey>('recommended')
  const activeView = data.views.find((view) => view.key === activeKey) ?? data.views[0]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="space-y-4">
        <div
          data-testid="discover-tabs-sticky"
          className="sticky top-[var(--discover-sticky-top)] z-20 mx-auto w-fit max-w-full rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(246,247,251,0.96),rgba(246,247,251,0.82))] px-3 py-2 backdrop-blur-sm"
        >
          <DiscoverTabs
            activeKey={activeKey}
            views={data.views}
            onChange={setActiveKey}
            ariaLabel={copy.tabListLabel}
          />
        </div>

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
            <h3 className="font-headline text-2xl text-campus-primary">
              {copy.empty.filteredTitle}
            </h3>
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
