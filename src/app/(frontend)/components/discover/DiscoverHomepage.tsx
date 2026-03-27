import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { buildDiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'
import type { Post } from '@/payload-types'

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
    <section className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <DiscoverHero copy={t.discoverHome} featuredPost={data.featuredPost} />
        <DiscoverExperience
          data={data}
          locale={locale}
          searchPlaceholder={t.common.searchPlaceholder}
          copy={t.discoverHome}
        />
      </div>
    </section>
  )
}
