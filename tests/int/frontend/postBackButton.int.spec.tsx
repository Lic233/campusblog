import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PostBackButton from '@/components/PostBackButton'

const backMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock }),
}))

describe('PostBackButton', () => {
  it('renders a compact back pill for the detail page header', () => {
    render(<PostBackButton fallbackHref="/school/north-campus" label="Back to browse" />)

    const link = screen.getByRole('link', { name: /back to browse/i })

    expect(link.className).toContain('px-3')
    expect(link.className).toContain('py-1.5')
    expect(link.className).toContain('text-xs')
    expect(link.className).not.toContain('shadow')
  })
})
