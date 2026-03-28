import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PrimaryActionButton } from '@/components/ui/primary-action-button'

describe('PrimaryActionButton', () => {
  it('renders the shared campus-primary visual language', () => {
    render(
      <PrimaryActionButton data-testid="primary-action">
        Publish article
      </PrimaryActionButton>,
    )

    const button = screen.getByTestId('primary-action')

    expect(button.className).toContain('rounded-full')
    expect(button.className).toContain('bg-campus-primary')
    expect(button.className).toContain('hover:-translate-y-0.5')
    expect(button.className).toContain('hover:bg-campus-primary')
    expect(button.className).toContain('hover:shadow-[0_16px_32px_rgba(13,59,102,0.18)]')
  })
})
