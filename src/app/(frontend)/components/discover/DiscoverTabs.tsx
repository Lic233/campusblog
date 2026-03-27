'use client'

import type { DiscoverView, DiscoverViewKey } from '@/app/(frontend)/lib/discoverPresentation'
import { cn } from '@/lib/utils'

type DiscoverTabsProps = {
  activeKey: DiscoverViewKey
  views: DiscoverView[]
  onChange: (key: DiscoverViewKey) => void
  ariaLabel: string
}

export default function DiscoverTabs({ activeKey, views, onChange, ariaLabel }: DiscoverTabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {views.map((view) => {
        const isActive = view.key === activeKey

        return (
          <button
            key={view.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.key)}
            className={cn(
              'rounded-full px-4 py-2 font-label text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-campus-primary text-white shadow-[0_10px_24px_rgba(47,109,246,0.22)]'
                : 'bg-white/78 text-foreground/65 shadow-sm hover:bg-white hover:text-campus-primary',
            )}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
