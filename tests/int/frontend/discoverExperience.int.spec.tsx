import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
  it('switches tabs with a sliding indicator and renders the localized empty state', () => {
    render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        copy={dictionary.discoverHome}
      />,
    )

    const latestTab = screen.getByRole('tab', { name: dictionary.discoverHome.tabs.latest })
    const indicator = screen.getByTestId('discover-tabs-indicator')

    fireEvent.click(latestTab)

    expect(latestTab.getAttribute('aria-selected')).toBe('true')
    expect(indicator.getAttribute('style')).toContain('translateX(calc(1 * 100%))')
    expect(screen.getByText(dictionary.discoverHome.empty.filteredTitle)).toBeTruthy()
  })

  it('keeps the sticky tabs at the top while the meta rail stays below the tools', () => {
    const { container } = render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        copy={dictionary.discoverHome}
      />,
    )

    const tabsSticky = container.querySelector('[data-testid="discover-tabs-sticky"]')
    const tabs = container.querySelector('[data-testid="discover-tabs"]')
    const indicator = container.querySelector('[data-testid="discover-tabs-indicator"]')
    const metaRail = container.querySelector('[data-testid="discover-meta-rail"]')
    const metaRailScroll = container.querySelector('[data-testid="discover-meta-rail-scroll"]')

    expect(tabsSticky).toBeTruthy()
    expect(tabs).toBeTruthy()
    expect(indicator).toBeTruthy()
    expect(metaRail).toBeTruthy()
    expect(metaRailScroll).toBeTruthy()
    expect(tabsSticky?.className).toContain('top-[var(--floating-toolbar-top)]')
    expect(tabsSticky?.className).toContain('w-fit')
    expect(tabsSticky?.className).toContain('max-w-full')
    expect(indicator?.getAttribute('style')).toContain('translateX(calc(0 * 100%))')
    expect(metaRail?.className).toContain('xl:top-[var(--discover-sticky-top)]')
    expect(metaRail?.className).not.toContain('xl:overflow-y-auto')
    expect(metaRailScroll?.className).toContain('xl:max-h-[calc(100vh-var(--discover-sticky-top))]')
    expect(metaRailScroll?.className).toContain('xl:overflow-y-auto')
  })

  it('renders a back-to-top button that scrolls to the top smoothly', () => {
    const scrollToMock = vi.fn()
    window.scrollTo = scrollToMock

    const { container } = render(
      <DiscoverExperience
        data={data}
        locale="en-US"
        copy={dictionary.discoverHome}
      />,
    )

    fireEvent.click(container.querySelector('[data-testid="discover-back-to-top"]') as HTMLButtonElement)

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
