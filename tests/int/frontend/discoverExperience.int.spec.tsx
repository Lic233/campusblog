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
        searchPlaceholder={dictionary.common.searchPlaceholder}
        copy={dictionary.discoverHome}
      />,
    )

    const latestTab = screen.getByRole('tab', { name: dictionary.discoverHome.tabs.latest })
    fireEvent.click(latestTab)

    expect(latestTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText(dictionary.discoverHome.views.latestTitle)).toBeTruthy()
    expect(screen.getByText(dictionary.discoverHome.empty.filteredTitle)).toBeTruthy()
  })

  it('keeps the sticky search bar and meta rail aligned below the floating tools', () => {
    const { container } = render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        searchPlaceholder={dictionary.common.searchPlaceholder}
        copy={dictionary.discoverHome}
      />,
    )

    const searchSticky = container.querySelector('[data-testid="discover-search-sticky"]')
    const metaRail = container.querySelector('[data-testid="discover-meta-rail"]')

    expect(searchSticky).toBeTruthy()
    expect(metaRail).toBeTruthy()
    expect(searchSticky?.className).toContain('top-[var(--discover-sticky-top)]')
    expect(metaRail?.className).toContain('xl:top-[var(--discover-sticky-top)]')
    expect(metaRail?.className).toContain('xl:max-h-[calc(100vh-var(--discover-sticky-top))]')
  })
})
