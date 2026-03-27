import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { buildDiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'
import type { Post } from '@/payload-types'

import SearchBar from '@/components/layout/SearchBar'

import DiscoverExperience from './DiscoverExperience'
import DiscoverHero from './DiscoverHero'

type DiscoverHomepageProps = {
  posts: Post[]
  locale: AppLocale
  t: FrontendDictionary
}

export default function DiscoverHomepage({ posts, locale, t }: DiscoverHomepageProps) {
  const data = buildDiscoverHomeData({
    posts,
    copy: t.discoverHome,
  })

  return (
    <section
      data-testid="discover-homepage-shell"
      className="px-4 pb-6 pt-[var(--floating-toolbar-top)] sm:px-5 lg:px-6"
    >
      <div data-testid="discover-homepage-content" className="w-full space-y-6">
        <div
          data-testid="discover-top-search-sticky"
          className="sticky top-[var(--floating-toolbar-top)] z-30 flex justify-center"
        >
          <SearchBar
            placeholder={t.common.searchPlaceholder}
            className="mx-auto max-w-[42rem]"
            inputClassName="h-12 border-campus-primary/12 bg-white/88 text-sm shadow-[0_12px_28px_rgba(24,38,72,0.10)] sm:h-14"
          />
        </div>

        <DiscoverHero copy={t.discoverHome} featuredPost={data.featuredPost} />
        <DiscoverExperience data={data} locale={locale} copy={t.discoverHome} />
      </div>
    </section>
  )
}
