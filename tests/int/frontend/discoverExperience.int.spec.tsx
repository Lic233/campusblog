import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DiscoverExperience from '@/components/discover/DiscoverExperience'
import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { DiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'

const dictionary = getDictionary('en-US')

const data: DiscoverHomeData = {
  featuredPost: null,
  schoolLinks: [{ label: 'North Campus', href: '/school/north-campus', count: 2 }],
  channelLinks: [{ label: 'Events', href: '/school/north-campus/channel/events', count: 2 }],
  tagChips: [{ label: 'Campus Life', count: 2 }],
  views: [
    {
      key: 'recommended',
      label: dictionary.discoverHome.tabs.recommended,
      title: dictionary.discoverHome.views.recommendedTitle,
      hint: dictionary.discoverHome.views.recommendedHint,
      posts: [],
    },
    {
      key: 'latest',
      label: dictionary.discoverHome.tabs.latest,
      title: dictionary.discoverHome.views.latestTitle,
      hint: dictionary.discoverHome.views.latestHint,
      posts: [],
    },
    {
      key: 'sameSchool',
      label: dictionary.discoverHome.tabs.sameSchool,
      title: dictionary.discoverHome.views.sameSchoolTitle,
      hint: dictionary.discoverHome.views.sameSchoolHint,
      posts: [],
    },
    {
      key: 'nearbySchools',
      label: dictionary.discoverHome.tabs.nearbySchools,
      title: dictionary.discoverHome.views.nearbySchoolsTitle,
      hint: dictionary.discoverHome.views.nearbySchoolsHint,
      posts: [],
    },
  ],
}

describe('DiscoverExperience', () => {
  it('switches tabs and renders the localized empty state', () => {
    render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        copy={dictionary.discoverHome}
      />,
    )

    const latestTab = screen.getByRole('tab', { name: dictionary.discoverHome.tabs.latest })
    fireEvent.click(latestTab)

    expect(latestTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText(dictionary.discoverHome.views.latestTitle)).toBeTruthy()
    expect(screen.getByText(dictionary.discoverHome.empty.filteredTitle)).toBeTruthy()
  })

  it('keeps the sticky tabs below the top search bar while the meta rail stays below the tools', () => {
    const { container } = render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        copy={dictionary.discoverHome}
      />,
    )

    const tabsSticky = container.querySelector('[data-testid="discover-tabs-sticky"]')
    const tabs = container.querySelector('[data-testid="discover-tabs"]')
    const metaRail = container.querySelector('[data-testid="discover-meta-rail"]')
    const metaRailScroll = container.querySelector('[data-testid="discover-meta-rail-scroll"]')

    expect(tabsSticky).toBeTruthy()
    expect(tabs).toBeTruthy()
    expect(metaRail).toBeTruthy()
    expect(metaRailScroll).toBeTruthy()
    expect(tabsSticky?.className).toContain('top-[var(--discover-sticky-top)]')
    expect(tabsSticky?.className).toContain('w-fit')
    expect(tabsSticky?.className).toContain('max-w-full')
    expect(tabsSticky?.textContent).toContain(dictionary.discoverHome.tabs.recommended)
    expect(metaRail?.className).toContain('xl:top-[var(--discover-sticky-top)]')
    expect(metaRail?.className).not.toContain('xl:overflow-y-auto')
    expect(metaRailScroll?.className).toContain('xl:max-h-[calc(100vh-var(--discover-sticky-top))]')
    expect(metaRailScroll?.className).toContain('xl:overflow-y-auto')
  })
})
