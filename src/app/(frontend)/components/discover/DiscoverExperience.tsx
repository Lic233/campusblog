'use client'

import { IconArrowUp } from '@tabler/icons-react'
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
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="space-y-4">
          <div
            data-testid="discover-tabs-sticky"
            className="sticky top-[var(--floating-toolbar-top)] z-20 mx-auto w-fit max-w-full rounded-[1.75rem] px-3 py-2"
          >
            <DiscoverTabs
              activeKey={activeKey}
              views={data.views}
              onChange={setActiveKey}
              ariaLabel={copy.tabListLabel}
            />
          </div>

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
            <section className="rounded-[1.75rem] border border-dashed border-campus-primary/16 p-10 text-center shadow-sm">
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

      <button
        type="button"
        data-testid="discover-back-to-top"
        aria-label={copy.backToTop}
        title={copy.backToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-campus-primary/10 text-campus-primary shadow-[0_16px_32px_rgba(24,38,72,0.16)] transition-transform duration-200 hover:-translate-y-0.5"
      >
        <IconArrowUp size={18} />
      </button>
    </>
  )
}
