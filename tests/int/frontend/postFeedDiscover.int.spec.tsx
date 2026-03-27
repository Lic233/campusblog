import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PostFeed from '@/components/PostFeed'
import type { Post, School, SchoolSubChannel, Tag, User } from '@/payload-types'

const author = {
  id: 1,
  displayName: 'Alex',
  roles: ['user'],
  email: 'alex@example.com',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
  collection: 'users',
} as User

const school = {
  id: 10,
  name: 'North Campus',
  slug: 'north-campus',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as School

const channel = {
  id: 101,
  name: 'Events',
  slug: 'events',
  school,
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as SchoolSubChannel

const tag = {
  id: 201,
  name: 'Events',
  slug: 'events',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as Tag

function makePost(id: number): Post {
  return {
    id,
    title: `Post ${id}`,
    slug: `post-${id}`,
    status: 'published',
    school,
    subChannel: channel,
    author,
    tags: [tag],
    excerpt: `Excerpt ${id}`,
    content: { type: 'doc', content: [] },
    publishedAt: `2026-03-27T0${id}:00:00.000Z`,
    createdAt: `2026-03-27T0${id}:00:00.000Z`,
    updatedAt: `2026-03-27T0${id}:00:00.000Z`,
  } as Post
}

describe('PostFeed discover mode', () => {
  it('marks the first two cards as featured discover cards', () => {
    const { container } = render(
      <PostFeed
        posts={[makePost(1), makePost(2), makePost(3)]}
        locale="en-US"
        showSchoolName
        showChannelName
        variant="discover"
        featuredCount={2}
      />,
    )

    expect(container.querySelectorAll('[data-card-variant="discover-featured"]').length).toBe(2)
    expect(container.querySelectorAll('[data-card-variant="discover-default"]').length).toBe(1)
  })
})
