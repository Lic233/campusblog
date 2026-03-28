import type { FrontendDictionary } from './i18n/dictionaries'
import type { Post } from '@/payload-types'

import { getPostPrimaryTag, getPostSchool, getPostSubChannel } from './postPresentation'

export type DiscoverViewKey = 'recommended' | 'latest' | 'sameSchool' | 'nearbySchools'

export type DiscoverView = {
  key: DiscoverViewKey
  label: string
  title: string
  hint: string
  posts: Post[]
}

export type DiscoverRailLink = {
  label: string
  href: string
  count: number
}

export type DiscoverTagChip = {
  label: string
  count: number
}

export type DiscoverHomeData = {
  featuredPost: Post | null
  views: DiscoverView[]
  schoolLinks: DiscoverRailLink[]
  channelLinks: DiscoverRailLink[]
  tagChips: DiscoverTagChip[]
}

type DiscoverHomeCopy = FrontendDictionary['discoverHome']

function dateWeight(post: Post): number {
  const source = post.publishedAt ?? post.createdAt
  const parsed = Date.parse(source)
  return Number.isNaN(parsed) ? 0 : parsed
}

function sortNewest(posts: Post[]): Post[] {
  return [...posts].sort((left, right) => dateWeight(right) - dateWeight(left))
}

function pickMostCommonSchool(posts: Post[]): string | null {
  const counts = new Map<string, number>()

  for (const post of posts) {
    const school = getPostSchool(post)
    if (!school) continue

    const key = String(school.id)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
}

function pickNearbySchoolPosts(posts: Post[]): Post[] {
  const seenSchools = new Set<string>()
  const unique: Post[] = []

  for (const post of posts) {
    const school = getPostSchool(post)
    const key = school ? String(school.id) : `post:${post.id}`
    if (seenSchools.has(key)) continue

    seenSchools.add(key)
    unique.push(post)
  }

  const merged = [...unique, ...posts]
  const seenPosts = new Set<number | string>()

  return merged.filter((post) => {
    const key = post.id
    if (seenPosts.has(key)) return false
    seenPosts.add(key)
    return true
  })
}

export function buildDiscoverHomeData({
  posts,
  copy,
}: {
  posts: Post[]
  copy: DiscoverHomeCopy
}): DiscoverHomeData {
  const latest = sortNewest(posts)
  const recommended = latest.slice(0, 12)
  const sameSchoolKey = pickMostCommonSchool(latest)
  const sameSchool = sameSchoolKey
    ? latest.filter((post) => String(getPostSchool(post)?.id ?? '') === sameSchoolKey).slice(0, 12)
    : recommended
  const nearbySchools = pickNearbySchoolPosts(latest).slice(0, 12)

  const schoolMap = new Map<string, DiscoverRailLink>()
  const channelMap = new Map<string, DiscoverRailLink>()
  const tagMap = new Map<string, DiscoverTagChip>()

  for (const post of latest) {
    const school = getPostSchool(post)
    if (school) {
      const schoolKey = String(school.id)
      const existing = schoolMap.get(schoolKey)
      schoolMap.set(schoolKey, {
        label: school.name,
        href: `/school/${school.slug}`,
        count: (existing?.count ?? 0) + 1,
      })
    }

    const channel = getPostSubChannel(post)
    if (school && channel) {
      const channelKey = `${school.id}:${channel.id}`
      const existing = channelMap.get(channelKey)
      channelMap.set(channelKey, {
        label: channel.name,
        href: `/school/${school.slug}/channel/${channel.slug}`,
        count: (existing?.count ?? 0) + 1,
      })
    }

    const tag = getPostPrimaryTag(post)
    if (tag) {
      const existing = tagMap.get(tag.slug)
      tagMap.set(tag.slug, {
        label: tag.name,
        count: (existing?.count ?? 0) + 1,
      })
    }
  }

  return {
    featuredPost: recommended[0] ?? null,
    views: [
      {
        key: 'recommended',
        label: copy.tabs.recommended,
        title: copy.views.recommendedTitle,
        hint: copy.views.recommendedHint,
        posts: recommended,
      },
      {
        key: 'latest',
        label: copy.tabs.latest,
        title: copy.views.latestTitle,
        hint: copy.views.latestHint,
        posts: latest.slice(0, 12),
      },
      {
        key: 'sameSchool',
        label: copy.tabs.sameSchool,
        title: copy.views.sameSchoolTitle,
        hint: copy.views.sameSchoolHint,
        posts: sameSchool,
      },
      {
        key: 'nearbySchools',
        label: copy.tabs.nearbySchools,
        title: copy.views.nearbySchoolsTitle,
        hint: copy.views.nearbySchoolsHint,
        posts: nearbySchools,
      },
    ],
    schoolLinks: [...schoolMap.values()].sort((left, right) => right.count - left.count).slice(0, 6),
    channelLinks: [...channelMap.values()].sort((left, right) => right.count - left.count).slice(0, 6),
    tagChips: [...tagMap.values()].sort((left, right) => right.count - left.count).slice(0, 8),
  }
}
