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
      className="relative inline-grid w-fit max-w-full min-w-[min(100%,22rem)] overflow-hidden rounded-full border border-campus-border-soft/80 bg-gradient-to-r from-campus-panel-soft via-campus-panel-strong/75 to-campus-panel-soft p-0.5"
      style={{ gridTemplateColumns: 'repeat(' + views.length + ', minmax(0, 1fr))' }}
    >
      <span
        data-testid="discover-tabs-indicator"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 rounded-full bg-campus-primary transition-transform duration-300 ease-out"
        style={{
          width: 'calc((100% - 0.25rem) / ' + views.length + ')',
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
              'relative z-10 inline-flex min-w-[6.5rem] items-center justify-center rounded-full px-3.5 py-1.5 font-label text-sm font-semibold text-center transition-colors duration-200',
              isActive ? 'text-white' : 'text-campus-text-soft hover:text-campus-primary',
            )}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
