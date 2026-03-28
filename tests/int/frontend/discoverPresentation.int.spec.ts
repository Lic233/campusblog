import { describe, expect, it } from 'vitest'

import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { buildDiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'
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

const northSchool = {
  id: 10,
  name: 'North Campus',
  slug: 'north-campus',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as School

const southSchool = {
  id: 11,
  name: 'South Campus',
  slug: 'south-campus',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as School

const eventsChannel = {
  id: 101,
  name: 'Events',
  slug: 'events',
  school: northSchool,
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as SchoolSubChannel

const foodChannel = {
  id: 102,
  name: 'Food',
  slug: 'food',
  school: southSchool,
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as SchoolSubChannel

const eventsTag = {
  id: 201,
  name: 'Events',
  slug: 'events',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as Tag

const lifeTag = {
  id: 202,
  name: 'Campus Life',
  slug: 'campus-life',
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-03-20T00:00:00.000Z',
} as Tag

function makePost(
  id: number,
  title: string,
  publishedAt: string,
  school: School,
  channel: SchoolSubChannel,
  tag: Tag,
): Post {
  return {
    id,
    title,
    slug: `post-${id}`,
    status: 'published',
    school,
    subChannel: channel,
    author,
    tags: [tag],
    excerpt: `${title} excerpt`,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: `${title} body` }],
        },
      ],
    },
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  } as Post
}

describe('buildDiscoverHomeData', () => {
  it('creates discovery views and rails from existing posts', () => {
    const copy = getDictionary('en-US').discoverHome
    const posts = [
      makePost(1, 'Night Market', '2026-03-27T10:00:00.000Z', northSchool, eventsChannel, eventsTag),
      makePost(2, 'Dorm Notes', '2026-03-27T08:00:00.000Z', northSchool, eventsChannel, lifeTag),
      makePost(3, 'Cafeteria Review', '2026-03-27T09:00:00.000Z', southSchool, foodChannel, lifeTag),
    ]

    const data = buildDiscoverHomeData({ posts, copy })

    expect(data.featuredPost?.id).toBe(1)
    expect(data.views.map((view) => view.key)).toEqual([
      'recommended',
      'latest',
      'sameSchool',
      'nearbySchools',
    ])
    expect(data.schoolLinks[0].href).toBe('/school/north-campus')
    expect(data.channelLinks[0].href).toBe('/school/north-campus/channel/events')
    expect(data.tagChips[0].label).toBe('Campus Life')
    expect(
      data.views
        .find((view) => view.key === 'sameSchool')
        ?.posts.every((post) => (post.school as School).id === 10),
    ).toBe(true)
    expect(data.views.find((view) => view.key === 'nearbySchools')?.posts[0].id).toBe(1)
    expect(data.views.find((view) => view.key === 'nearbySchools')?.posts[1].id).toBe(3)
  })
})
