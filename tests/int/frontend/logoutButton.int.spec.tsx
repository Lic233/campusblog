import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import LogoutButton from '@/components/auth/LogoutButton'

vi.mock('next/navigation', () => ({
  usePathname: () => '/user/me',
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}))

describe('LogoutButton', () => {
  it('uses a light-red destructive button that fills red on hover', () => {
    render(
      <LogoutButton
        label="Logout"
        pendingLabel="Logging out"
        className="h-11 min-w-[11rem] flex-1"
      />,
    )

    const button = screen.getByRole('button', { name: /logout/i })
    expect(button.className).toContain('rounded-full')
    expect(button.className).toContain('border-2')
    expect(button.className).toContain('border-destructive')
    expect(button.className).toContain('bg-destructive/10')
    expect(button.className).toContain('text-destructive')
    expect(button.className).toContain('hover:bg-destructive')
    expect(button.className).toContain('hover:text-white')
  })
})



