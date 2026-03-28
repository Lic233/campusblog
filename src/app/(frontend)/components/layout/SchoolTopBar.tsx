'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconPlus } from '@tabler/icons-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import SearchBar from './SearchBar'

type SubChannel = {
  id: string | number
  name: string
  slug: string
}

type SchoolTopBarProps = {
  schoolName: string
  schoolSlug: string
  subChannels: SubChannel[]
  t: {
    common: {
      searchPlaceholder: string
    }
    school: {
      addSubChannel: string
      allPosts: string
      homepage: string
    }
  }
}

export default function SchoolTopBar({ schoolName, schoolSlug, subChannels, t }: SchoolTopBarProps) {
  const pathname = usePathname()
  const schoolBasePath = `/school/${schoolSlug}`
  const tabItems = [
    { key: 'all-posts', href: schoolBasePath, label: t.school.allPosts },
    ...subChannels.map((channel) => ({
      key: String(channel.id),
      href: `${schoolBasePath}/channel/${channel.slug}`,
      label: channel.name,
    })),
  ]

  const activeIndex = Math.max(
    tabItems.findIndex((item) => pathname === item.href),
    0,
  )

  return (
    <header className="sticky top-0 z-40 isolate border-b border-campus-border-soft/90 bg-gradient-to-b from-campus-panel-soft via-campus-page to-campus-page">
      <div className="space-y-2 px-4 py-2.5 sm:px-5 lg:px-6">
        <div className="min-w-0">
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-campus-text-soft">
            {t.school.homepage}
          </p>
          <h2 className="truncate font-headline text-2xl text-campus-primary sm:text-[2rem]">{schoolName}</h2>
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="rounded-[1.35rem] p-1">
              <div
                data-testid="school-channel-tabs"
                className="relative inline-grid w-fit max-w-full min-w-[min(100%,19rem)] overflow-hidden rounded-full border border-campus-primary/10 bg-[rgba(255,255,255,0.68)] p-0.5"
                style={{ gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))` }}
              >
                <span
                  data-testid="school-channel-tabs-indicator"
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 rounded-full bg-campus-primary transition-transform duration-300 ease-out"
                  style={{
                    width: `calc((100% - 0.25rem) / ${tabItems.length})`,
                    transform: `translateX(calc(${activeIndex} * 100%))`,
                  }}
                />

                {tabItems.map((item, index) => {
                  const isActive = index === activeIndex
                  return (
                    <Link key={item.key} href={item.href} className="relative z-10 no-underline">
                      <span
                        className={cn(
                          'inline-flex min-w-[6.5rem] items-center justify-center rounded-full px-3.5 py-1.5 font-label text-sm font-semibold text-center transition-colors duration-200',
                          isActive ? 'text-white' : 'text-foreground/65 hover:text-campus-primary',
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <Button
              data-testid="school-add-channel"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 rounded-full border border-campus-primary/10 px-3.5 font-label text-sm font-semibold text-campus-accent transition-colors duration-200 hover:border-[#F0A35E] hover:bg-gradient-to-r hover:from-[#F8C58F] hover:to-[#F08A24] hover:text-white"
            >
              <IconPlus size={13} />
              <span>{t.school.addSubChannel}</span>
            </Button>
          </div>

          <div className="w-full xl:max-w-xs xl:flex-shrink-0">
            <SearchBar
              placeholder={t.common.searchPlaceholder}
              className="max-w-none"
              inputClassName="h-10 border-campus-primary/12 text-sm shadow-[0_12px_28px_rgba(24,38,72,0.10)]"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

