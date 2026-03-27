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
  const activeIndex = Math.max(
    views.findIndex((view) => view.key === activeKey),
    0,
  )

  return (
    <div
      data-testid="discover-tabs"
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-grid w-fit max-w-full min-w-[min(100%,24rem)] overflow-hidden rounded-full border border-campus-primary/10 bg-white/82 p-1 shadow-[0_10px_24px_rgba(24,38,72,0.08)]"
      style={{ gridTemplateColumns: 'repeat(' + views.length + ', minmax(0, 1fr))' }}
    >
      <span
        data-testid="discover-tabs-indicator"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-full bg-campus-primary shadow-[0_10px_24px_rgba(47,109,246,0.22)] transition-transform duration-300 ease-out"
        style={{
          width: 'calc((100% - 0.5rem) / ' + views.length + ')',
          transform: 'translateX(calc(' + activeIndex + ' * 100%))',
        }}
      />

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
              'relative z-10 rounded-full px-4 py-2 font-label text-sm font-semibold text-center transition-colors duration-200',
              isActive ? 'text-white' : 'text-foreground/65 hover:text-campus-primary',
            )}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
