import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import UserPostActions from '@/components/user/UserPostActions'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('UserPostActions', () => {
  it('keeps view and delete buttons on the same size and shape system while using the light-red destructive hover', () => {
    render(
      <UserPostActions
        actionHref="/post/demo"
        actionLabel="View article"
        cancelLabel="Cancel"
        confirmActionLabel="Delete"
        confirmLabel="Delete this post?"
        deleteErrorLabel="Delete failed"
        deleteLabel="Delete"
        deletingLabel="Deleting"
        postId="1"
      />,
    )

    const viewButton = screen.getByRole('link', { name: /view article/i })
    const deleteButton = screen.getByRole('button', { name: /^delete$/i })

    expect(viewButton.className).toContain('h-10')
    expect(viewButton.className).toContain('rounded-full')
    expect(deleteButton.className).toContain('h-10')
    expect(deleteButton.className).toContain('rounded-full')
    expect(deleteButton.className).toContain('border-2')
    expect(deleteButton.className).toContain('border-destructive')
    expect(deleteButton.className).toContain('bg-destructive/10')
    expect(deleteButton.className).toContain('hover:bg-destructive')
    expect(deleteButton.className).toContain('hover:text-white')
  })
})



