import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SchoolTopBar from '@/components/layout/SchoolTopBar'

let pathnameMock = '/school/north-campus'

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}))

describe('SchoolTopBar', () => {
  it('renders content-width channel tabs with a sliding indicator and balanced add button', () => {
    pathnameMock = '/school/north-campus/channel/events'

    const { container } = render(
      <SchoolTopBar
        schoolName="North Campus"
        schoolSlug="north-campus"
        subChannels={[
          { id: 1, name: 'Events', slug: 'events' },
          { id: 2, name: 'Culture', slug: 'culture' },
        ]}
        t={{
          common: { searchPlaceholder: 'Search campus news...' },
          school: { addSubChannel: 'Add Channel', allPosts: 'All Posts', homepage: 'Homepage' },
        }}
      />,
    )

    expect(screen.getByText('North Campus')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search campus news...')).toBeTruthy()
    expect(screen.getByTestId('school-channel-tabs-indicator')).toBeTruthy()
    expect(screen.getByTestId('school-add-channel').className).toContain('h-9')
    expect(container.querySelector('header')?.className).toContain('bg-gradient-to-b')
  })
})

