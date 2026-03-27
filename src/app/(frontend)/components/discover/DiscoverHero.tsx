import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { Post } from '@/payload-types'

type DiscoverHeroProps = {
  copy: FrontendDictionary['discoverHome']
  featuredPost: Post | null
}

export default function DiscoverHero({ copy, featuredPost }: DiscoverHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-campus-primary/10 bg-[linear-gradient(135deg,rgba(47,109,246,0.12),rgba(255,158,74,0.14),rgba(39,178,126,0.12))] p-6 shadow-[0_24px_64px_rgba(24,38,72,0.10)] sm:p-8">
      <div className="max-w-3xl space-y-4">
        <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-campus-primary/65">
          {copy.heroEyebrow}
        </p>
        <h1 className="font-headline text-4xl leading-tight text-campus-primary sm:text-5xl">
          {copy.heroTitle}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-foreground/70 sm:text-lg">
          {copy.heroSubtitle}
        </p>
      </div>

      {featuredPost ? (
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
          <span className="font-label text-campus-primary/70">{copy.featuredLabel}</span>
          <span className="font-label font-semibold text-campus-primary">{featuredPost.title}</span>
        </div>
      ) : null}
    </section>
  )
}
