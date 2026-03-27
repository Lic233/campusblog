# Homepage Discovery Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage into the approved dual-layer discovery experience, while reusing the existing component system and routing all new copy through frontend i18n.

**Architecture:** Keep `src/app/(frontend)/page.tsx` as the server entry that resolves locale and fetches published posts. Move homepage-specific derivation into a pure `discoverPresentation` helper, then compose the UI with small discover components plus light extensions to shared surfaces like `SearchBar`, `PostFeed`, and `PostCard`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Payload-generated types, Vitest, Testing Library

---

## Scope Check

This plan stays inside one subsystem: the frontend homepage discovery experience. It does not touch Payload schema, backend endpoints, route structure, or non-homepage pages.

## File Structure

### Create

- `src/app/(frontend)/lib/discoverPresentation.ts`
  - Pure derivation for homepage hero content, discovery tabs, and metadata rail data from existing `Post` records.
- `src/app/(frontend)/components/discover/DiscoverHero.tsx`
  - Compact homepage hero with localized copy and optional featured-post signal.
- `src/app/(frontend)/components/discover/DiscoverTabs.tsx`
  - Accessible discovery tab strip.
- `src/app/(frontend)/components/discover/DiscoverMetaRail.tsx`
  - Secondary rail for school highlights, channel shortcuts, and trending tags.
- `src/app/(frontend)/components/discover/DiscoverExperience.tsx`
  - Client-side interaction shell that owns the active homepage discovery tab.
- `src/app/(frontend)/components/discover/DiscoverHomepage.tsx`
  - Composition wrapper used by the route entry.
- `tests/int/frontend/discoverDictionary.int.spec.ts`
  - Verifies new homepage i18n copy exists in both locales.
- `tests/int/frontend/discoverPresentation.int.spec.ts`
  - Verifies homepage discovery data derivation.
- `tests/int/frontend/discoverExperience.int.spec.tsx`
  - Verifies tab switching and localized empty-state behavior.
- `tests/int/frontend/postFeedDiscover.int.spec.tsx`
  - Verifies homepage feed highlights the leading cards in discover mode.
- `tests/int/frontend/discoverHomepage.int.spec.tsx`
  - Smoke test for the composed homepage surface.

### Modify

- `src/app/(frontend)/page.tsx`
  - Replace the current sticky-search-only composition with the new homepage wrapper.
- `src/app/(frontend)/components/layout/SearchBar.tsx`
  - Add layout hooks so the homepage can reuse it without forking the component.
- `src/app/(frontend)/components/PostFeed.tsx`
  - Add homepage-specific card rhythm props.
- `src/app/(frontend)/components/PostCard.tsx`
  - Add discover variants and a stable testing hook.
- `src/app/(frontend)/components/layout/SidebarNav.tsx`
  - Reduce visual weight so homepage content becomes the main focal surface.
- `src/app/(frontend)/locales/en-US.json`
  - Add `discoverHome` copy.
- `src/app/(frontend)/locales/zh-CN.json`
  - Add matching `discoverHome` copy.

## Task 1: Add Homepage Discovery i18n Copy

**Files:**
- Modify: `src/app/(frontend)/locales/en-US.json`
- Modify: `src/app/(frontend)/locales/zh-CN.json`
- Test: `tests/int/frontend/discoverDictionary.int.spec.ts`

- [ ] **Step 1: Write the failing dictionary test**

```ts
import { describe, expect, it } from 'vitest'

import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'

describe('discover homepage dictionary', () => {
  it('exposes the homepage discovery copy in both locales', () => {
    const en = getDictionary('en-US')
    const zh = getDictionary('zh-CN')

    expect(en.discoverHome.heroTitle).toBeTruthy()
    expect(en.discoverHome.tabs.nearbySchools).toBeTruthy()
    expect(en.discoverHome.empty.filteredHint).toBeTruthy()

    expect(zh.discoverHome.heroTitle).toBeTruthy()
    expect(zh.discoverHome.tabs.nearbySchools).toBeTruthy()
    expect(zh.discoverHome.empty.filteredHint).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverDictionary.int.spec.ts
```

Expected: FAIL because `discoverHome` does not exist on the current dictionary shape.

- [ ] **Step 3: Add the localized homepage copy**

Add this object to `src/app/(frontend)/locales/en-US.json`:

```json
"discoverHome": {
  "heroEyebrow": "Campus now",
  "heroTitle": "What is everyone talking about on campus today?",
  "heroSubtitle": "Start with the stories, events, and opinions moving across schools right now.",
  "featuredLabel": "Featured now",
  "tabs": {
    "recommended": "Recommended",
    "latest": "Latest",
    "sameSchool": "Same School Trending",
    "nearbySchools": "Nearby Schools"
  },
  "views": {
    "recommendedTitle": "Recommended for browsing",
    "recommendedHint": "A balanced mix of active campus stories and standout posts.",
    "latestTitle": "Latest drops",
    "latestHint": "Freshly published posts, sorted by newest first.",
    "sameSchoolTitle": "Same school momentum",
    "sameSchoolHint": "A tighter stream built around the busiest school in the current feed.",
    "nearbySchoolsTitle": "Across nearby schools",
    "nearbySchoolsHint": "Sample one story from more campuses before diving deeper."
  },
  "sections": {
    "schoolHighlights": "School Highlights",
    "channelShortcuts": "Channel Shortcuts",
    "trendingTags": "Trending Tags"
  },
  "empty": {
    "filteredTitle": "Nothing matches this view yet",
    "filteredHint": "Try another discovery tab or come back after the next post lands."
  }
}
```

Add this matching object to `src/app/(frontend)/locales/zh-CN.json`:

```json
"discoverHome": {
  "heroEyebrow": "鏍″洯姝ゅ埢",
  "heroTitle": "浠婂ぉ锛屾牎鍥噷鐨勪汉閮藉湪鑱婁粈涔堬紵",
  "heroSubtitle": "浠庢鍦ㄥ彂閰电殑鏁呬簨銆佹椿鍔ㄥ拰瑙傜偣寮€濮嬶紝蹇€熻繘鍏ユ牎鍥唴瀹圭幇鍦恒€?,
  "featuredLabel": "姝ｅ湪琚叧娉?,
  "tabs": {
    "recommended": "涓轰綘鎺ㄨ崘",
    "latest": "鏈€鏂?,
    "sameSchool": "鍚屾牎鐑笘",
    "nearbySchools": "闄勮繎瀛︽牎"
  },
  "views": {
    "recommendedTitle": "鎺ㄨ崘鍐呭",
    "recommendedHint": "浼樺厛娴忚褰撳墠鏈€鍊煎緱鐐瑰紑鐨勬牎鍥唴瀹广€?,
    "latestTitle": "鏈€鏂板彂甯?,
    "latestHint": "鎸夊彂甯冩椂闂存帓搴忥紝绗竴鏃堕棿鐪嬪埌鏂板唴瀹广€?,
    "sameSchoolTitle": "鍚屾牎鐑害",
    "sameSchoolHint": "鍥寸粫褰撳墠鏈€娲昏穬瀛︽牎鏁寸悊鍑虹殑鏇磋仛鐒﹀唴瀹规祦銆?,
    "nearbySchoolsTitle": "闄勮繎瀛︽牎鍦ㄨ亰浠€涔?,
    "nearbySchoolsHint": "鍏堟í鍚戠湅鐪嬫洿澶氭牎鍥紝鍐嶆繁鍏ヨ繘鍏ヤ綘鎰熷叴瓒ｇ殑璇濋銆?
  },
  "sections": {
    "schoolHighlights": "鐑棬瀛︽牎",
    "channelShortcuts": "棰戦亾鎹峰緞",
    "trendingTags": "鐑棬鏍囩"
  },
  "empty": {
    "filteredTitle": "杩欎釜鍙戠幇瑙嗗浘閲岃繕娌℃湁鍐呭",
    "filteredHint": "璇曡瘯鍒囨崲鍏朵粬鍙戠幇鏂瑰紡锛屾垨鑰呯瓑涓嬩竴绡囧唴瀹瑰嚭鐜般€?
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverDictionary.int.spec.ts
```

Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/locales/en-US.json src/app/(frontend)/locales/zh-CN.json tests/int/frontend/discoverDictionary.int.spec.ts
git commit -m "feat: add homepage discovery i18n copy"
```

## Task 2: Build Pure Homepage Discovery Derivation

**Files:**
- Create: `src/app/(frontend)/lib/discoverPresentation.ts`
- Test: `tests/int/frontend/discoverPresentation.int.spec.ts`

- [ ] **Step 1: Write the failing presentation test**

```ts
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

const eventsTag = { id: 201, name: 'Events', slug: 'events', createdAt: '2026-03-20T00:00:00.000Z', updatedAt: '2026-03-20T00:00:00.000Z' } as Tag
const lifeTag = { id: 202, name: 'Campus Life', slug: 'campus-life', createdAt: '2026-03-20T00:00:00.000Z', updatedAt: '2026-03-20T00:00:00.000Z' } as Tag

function makePost(id: number, title: string, publishedAt: string, school: School, channel: SchoolSubChannel, tag: Tag): Post {
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
  }
}

describe('buildDiscoverHomeData', () => {
  it('creates discovery views and metadata rails from existing posts', () => {
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
    expect(data.views.find((view) => view.key === 'sameSchool')?.posts.every((post) => {
      const school = post.school as School
      return school.id === 10
    })).toBe(true)
    expect(data.views.find((view) => view.key === 'nearbySchools')?.posts[0].id).toBe(1)
    expect(data.views.find((view) => view.key === 'nearbySchools')?.posts[1].id).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverPresentation.int.spec.ts
```

Expected: FAIL because `buildDiscoverHomeData` does not exist yet.
- [ ] **Step 3: Implement the pure derivation helper**

Create `src/app/(frontend)/lib/discoverPresentation.ts` with:

```ts
import type { FrontendDictionary } from './i18n/dictionaries'
import type { Post } from '@/payload-types'

import { getPostPrimaryTag, getPostSchool, getPostSubChannel } from './postPresentation'

export type DiscoverViewKey =
  | 'recommended'
  | 'latest'
  | 'sameSchool'
  | 'nearbySchools'

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

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key)[0] ?? null
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
  const seenPosts = new Set<number>()

  return merged.filter((post) => {
    if (seenPosts.has(post.id)) return false
    seenPosts.add(post.id)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverPresentation.int.spec.ts
```

Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/lib/discoverPresentation.ts tests/int/frontend/discoverPresentation.int.spec.ts
git commit -m "feat: add homepage discovery presentation helper"
```

## Task 3: Extend Shared Search, Feed, Card, and Sidebar Surfaces

**Files:**
- Modify: `src/app/(frontend)/components/layout/SearchBar.tsx`
- Modify: `src/app/(frontend)/components/PostFeed.tsx`
- Modify: `src/app/(frontend)/components/PostCard.tsx`
- Modify: `src/app/(frontend)/components/layout/SidebarNav.tsx`
- Test: `tests/int/frontend/postFeedDiscover.int.spec.tsx`

- [ ] **Step 1: Write the failing shared-surface test**

```tsx
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
  }
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
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/postFeedDiscover.int.spec.tsx
```

Expected: FAIL because `variant`, `featuredCount`, and `data-card-variant` do not exist yet.
- [ ] **Step 3: Implement the shared component extensions**

Update `src/app/(frontend)/components/layout/SearchBar.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { IconSearch } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  placeholder: string
  className?: string
  inputClassName?: string
}

export default function SearchBar({
  placeholder,
  className,
  inputClassName,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className={cn(
        'relative w-full max-w-xl transition-all duration-300',
        focused && 'scale-[1.02]',
        className,
      )}
    >
      <div
        className={cn(
          'absolute -inset-0.5 rounded-full bg-gradient-to-r from-campus-primary/20 via-campus-teal/20 to-campus-accent/20 opacity-0 blur-sm transition-opacity duration-300',
          focused && 'opacity-100',
        )}
      />
      <div className="relative flex items-center">
        <IconSearch
          size={18}
          className={cn(
            'absolute left-4 z-10 transition-colors duration-200',
            focused ? 'text-campus-primary' : 'text-campus-outline',
          )}
        />
        <Input
          type="text"
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'h-11 w-full rounded-full border-campus-primary/10 bg-white/80 pl-12 pr-5 font-label text-base shadow-sm transition-all duration-200 placeholder:text-foreground/40 focus-visible:border-campus-primary/30 focus-visible:ring-campus-primary/10',
            inputClassName,
          )}
        />
      </div>
    </div>
  )
}
```

Update the `PostFeed` prop shape in `src/app/(frontend)/components/PostFeed.tsx`:

```tsx
type PostFeedProps = {
  posts: Post[]
  locale: AppLocale
  showSchoolName?: boolean
  showChannelName?: boolean
  variant?: 'default' | 'discover'
  featuredCount?: number
}

export default function PostFeed({
  posts,
  locale,
  showSchoolName = false,
  showChannelName = true,
  variant = 'default',
  featuredCount = 0,
}: PostFeedProps) {
  if (posts.length === 0) return null
  const t = getDictionary(locale)

  return (
    <div className="masonry-grid">
      {posts.map((post, index) => {
        const coverImage = getPostCoverImage(post)
        const primaryTag = getPostPrimaryTag(post)
        const author = getPostAuthor(post)
        const authorAvatar =
          author?.avatar && typeof author.avatar === 'object' ? author.avatar.url : null
        const school = getPostSchool(post)
        const subChannel = getPostSubChannel(post)
        const cardVariant =
          variant === 'discover' && index < featuredCount
            ? 'discover-featured'
            : variant === 'discover'
              ? 'discover'
              : 'default'

        return (
          <PostCard
            key={post.id}
            cardVariant={cardVariant}
            aspectClass={
              cardVariant === 'discover-featured' ? 'aspect-[5/6]' : getAspectClass(index)
            }
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            contentText={getPostPreviewText(post)}
            coverImageUrl={coverImage?.url}
            coverImageAlt={getMediaImageAlt(coverImage?.alt, 'cover-image')}
            authorName={author?.displayName}
            authorAvatarUrl={authorAvatar}
            tagLabel={primaryTag?.name}
            schoolName={showSchoolName ? school?.name : null}
            channelName={showChannelName ? subChannel?.name : null}
            publishedLabel={getPostPublishedLabel(post.publishedAt ?? post.createdAt, locale)}
            readingMinutes={estimatePostReadingMinutes(post)}
            anonymousLabel={t.common.anonymous}
            readTimeLabel={t.post.readTimeShort}
          />
        )
      })}
    </div>
  )
}
```

Update `src/app/(frontend)/components/PostCard.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { getMediaImageAlt } from '@/app/(frontend)/lib/mediaAlt'

// Keep the existing NotebookPreview helper in the same file; only extend props and classes below.

type PostCardVariant = 'default' | 'discover' | 'discover-featured'

type PostCardProps = {
  title: string
  slug: string
  excerpt?: string | null
  contentText?: string | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  authorName?: string | null
  authorAvatarUrl?: string | null
  tagLabel?: string | null
  schoolName?: string | null
  channelName?: string | null
  publishedLabel?: string | null
  readingMinutes?: number | null
  aspectClass?: string
  anonymousLabel: string
  readTimeLabel: string
  cardVariant?: PostCardVariant
}

export default function PostCard({
  title,
  slug,
  excerpt,
  contentText,
  coverImageUrl,
  coverImageAlt,
  authorName,
  authorAvatarUrl,
  tagLabel,
  schoolName,
  channelName,
  publishedLabel,
  readingMinutes,
  aspectClass = 'aspect-[5/4]',
  anonymousLabel,
  readTimeLabel,
  cardVariant = 'default',
}: PostCardProps) {
  const previewText = excerpt || contentText || ''
  const hasImage = Boolean(coverImageUrl)
  const isFeatured = cardVariant === 'discover-featured'
  const isDiscover = cardVariant === 'discover' || isFeatured

  return (
    <div className="masonry-item w-full" data-card-variant={cardVariant}>
      <Link href={`/post/${slug}`} className="group block w-full no-underline">
        <CardSpotlight
          className={cn(
            'w-full overflow-hidden rounded-[1.25rem] border transition-all duration-300',
            isFeatured
              ? 'border-campus-primary/12 bg-white/96 shadow-[0_18px_48px_rgba(24,38,72,0.14)]'
              : isDiscover
                ? 'border-campus-primary/10 bg-white/92 shadow-[0_12px_36px_rgba(24,38,72,0.08)]'
                : 'border-transparent bg-card shadow-sm hover:border-campus-primary/10 hover:shadow-[0_8px_30px_rgba(13,59,102,0.1)]',
          )}
        >
          <div className={cn('relative w-full overflow-hidden', aspectClass, isFeatured && 'max-h-[21rem]')}>
            {hasImage ? (
              <Image
                alt={getMediaImageAlt(coverImageAlt, 'cover-image')}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                src={coverImageUrl!}
                fill
                sizes="(min-width: 1280px) 28rem, (min-width: 768px) 50vw, 100vw"
                unoptimized
              />
            ) : (
              <NotebookPreview text={previewText} />
            )}
          </div>

          <div className={cn('space-y-2.5', isFeatured ? 'p-5' : 'p-4')}>
            <h3
              className={cn(
                'font-headline leading-snug text-campus-primary transition-colors duration-200 group-hover:text-campus-teal',
                isFeatured ? 'text-[1.45rem]' : 'text-lg',
              )}
            >
              {title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-label text-foreground/60">
                {authorName || anonymousLabel}
              </span>
              {readingMinutes ? (
                <span className="text-[12px] font-label text-foreground/50">
                  {readingMinutes} {readTimeLabel}
                </span>
              ) : null}
            </div>
          </div>
        </CardSpotlight>
      </Link>
    </div>
  )
}
```

Tone down `src/app/(frontend)/components/layout/SidebarNav.tsx` by changing the root and action-card classes:

```tsx
<aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col border-r border-campus-primary/6 bg-white/58 shadow-[0_18px_54px_rgba(13,59,102,0.08)] backdrop-blur-2xl lg:flex">
```

```tsx
className="block rounded-2xl border border-campus-primary/8 bg-white/62 p-3 shadow-[0_10px_28px_rgba(13,59,102,0.06)] no-underline transition-all hover:bg-white/86 hover:shadow-[0_16px_38px_rgba(13,59,102,0.10)]"
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/postFeedDiscover.int.spec.tsx
```

Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/components/layout/SearchBar.tsx src/app/(frontend)/components/PostFeed.tsx src/app/(frontend)/components/PostCard.tsx src/app/(frontend)/components/layout/SidebarNav.tsx tests/int/frontend/postFeedDiscover.int.spec.tsx
git commit -m "feat: adapt shared surfaces for homepage discovery"
```

## Task 4: Build Discover Interaction Components

**Files:**
- Create: `src/app/(frontend)/components/discover/DiscoverHero.tsx`
- Create: `src/app/(frontend)/components/discover/DiscoverTabs.tsx`
- Create: `src/app/(frontend)/components/discover/DiscoverMetaRail.tsx`
- Create: `src/app/(frontend)/components/discover/DiscoverExperience.tsx`
- Test: `tests/int/frontend/discoverExperience.int.spec.tsx`

- [ ] **Step 1: Write the failing discover-component test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DiscoverExperience from '@/components/discover/DiscoverExperience'
import type { DiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'
import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'

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
    expect(screen.getByText(dictionary.discoverHome.views.latestTitle)).toBeDefined()
    expect(screen.getByText(dictionary.discoverHome.empty.filteredTitle)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverExperience.int.spec.tsx
```

Expected: FAIL because the discover components do not exist yet.
- [ ] **Step 3: Implement the discover components**

Create `src/app/(frontend)/components/discover/DiscoverHero.tsx`:

```tsx
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { Post } from '@/payload-types'

type DiscoverHeroProps = {
  copy: FrontendDictionary['discoverHome']
  featuredPost: Post | null
}

export default function DiscoverHero({ copy, featuredPost }: DiscoverHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-campus-primary/10 bg-[linear-gradient(135deg,rgba(47,109,246,0.12),rgba(255,158,74,0.14),rgba(39,178,126,0.12))] p-6 shadow-[0_24px_64px_rgba(24,38,72,0.10)] sm:p-8">
      <div className="max-w-3xl space-y-4">
        <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-campus-primary/65">
          {copy.heroEyebrow}
        </p>
        <h1 className="font-headline text-4xl leading-tight text-campus-primary sm:text-5xl">
          {copy.heroTitle}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-foreground/70 sm:text-lg">
          {copy.heroSubtitle}
        </p>
      </div>

      {featuredPost ? (
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
          <span className="font-label text-campus-primary/70">{copy.featuredLabel}</span>
          <span className="font-label font-semibold text-campus-primary">{featuredPost.title}</span>
        </div>
      ) : null}
    </section>
  )
}
```

Create `src/app/(frontend)/components/discover/DiscoverTabs.tsx`:

```tsx
'use client'

import type { DiscoverView, DiscoverViewKey } from '@/app/(frontend)/lib/discoverPresentation'
import { cn } from '@/lib/utils'

type DiscoverTabsProps = {
  activeKey: DiscoverViewKey
  views: DiscoverView[]
  onChange: (key: DiscoverViewKey) => void
}

export default function DiscoverTabs({
  activeKey,
  views,
  onChange,
}: DiscoverTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Homepage discovery views"
      className="flex flex-wrap gap-2"
    >
      {views.map((view) => {
        const isActive = view.key === activeKey
        return (
          <button
            key={view.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.key)}
            className={cn(
              'rounded-full px-4 py-2 font-label text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-campus-primary text-white shadow-[0_10px_24px_rgba(47,109,246,0.22)]'
                : 'bg-white/78 text-foreground/65 shadow-sm hover:bg-white hover:text-campus-primary',
            )}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
```

Create `src/app/(frontend)/components/discover/DiscoverMetaRail.tsx`:

```tsx
import Link from 'next/link'

import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { DiscoverRailLink, DiscoverTagChip } from '@/app/(frontend)/lib/discoverPresentation'

type DiscoverMetaRailProps = {
  copy: FrontendDictionary['discoverHome']
  schoolLinks: DiscoverRailLink[]
  channelLinks: DiscoverRailLink[]
  tagChips: DiscoverTagChip[]
}

export default function DiscoverMetaRail({
  copy,
  schoolLinks,
  channelLinks,
  tagChips,
}: DiscoverMetaRailProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.schoolHighlights}
        </h2>
        <div className="mt-4 space-y-2">
          {schoolLinks.map((school) => (
            <Link
              key={school.href}
              href={school.href}
              className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-foreground/72 no-underline transition-colors hover:bg-campus-primary/6 hover:text-campus-primary"
            >
              <span>{school.label}</span>
              <span className="font-label text-xs text-foreground/45">{school.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.channelShortcuts}
        </h2>
        <div className="mt-4 space-y-2">
          {channelLinks.map((channel) => (
            <Link
              key={channel.href}
              href={channel.href}
              className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-foreground/72 no-underline transition-colors hover:bg-campus-teal/8 hover:text-campus-teal"
            >
              <span>{channel.label}</span>
              <span className="font-label text-xs text-foreground/45">{channel.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-campus-primary/8 bg-white/82 p-5 shadow-[0_12px_32px_rgba(24,38,72,0.08)]">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
          {copy.sections.trendingTags}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tagChips.map((tag) => (
            <span
              key={tag.label}
              className="rounded-full border border-campus-primary/10 bg-campus-primary/[0.04] px-3 py-1.5 text-sm text-campus-primary/80"
            >
              {tag.label}
            </span>
          ))}
        </div>
      </section>
    </aside>
  )
}
```

Create `src/app/(frontend)/components/discover/DiscoverExperience.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'

import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import type { DiscoverHomeData, DiscoverViewKey } from '@/app/(frontend)/lib/discoverPresentation'
import PostFeed from '@/components/PostFeed'
import SearchBar from '@/components/layout/SearchBar'

import DiscoverMetaRail from './DiscoverMetaRail'
import DiscoverTabs from './DiscoverTabs'

type DiscoverExperienceProps = {
  data: DiscoverHomeData
  locale: AppLocale
  searchPlaceholder: string
  copy: FrontendDictionary['discoverHome']
}

export default function DiscoverExperience({
  data,
  locale,
  searchPlaceholder,
  copy,
}: DiscoverExperienceProps) {
  const [activeKey, setActiveKey] = useState<DiscoverViewKey>('recommended')

  const activeView = useMemo(
    () => data.views.find((view) => view.key === activeKey) ?? data.views[0],
    [activeKey, data.views],
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <div className="sticky top-4 z-20">
          <SearchBar
            placeholder={searchPlaceholder}
            className="max-w-none"
            inputClassName="h-12 border-campus-primary/12 bg-white/88 shadow-[0_14px_36px_rgba(24,38,72,0.10)]"
          />
        </div>

        <DiscoverTabs activeKey={activeKey} views={data.views} onChange={setActiveKey} />

        <section className="space-y-2">
          <h2 className="font-headline text-3xl text-campus-primary">{activeView.title}</h2>
          <p className="text-sm leading-6 text-foreground/62">{activeView.hint}</p>
        </section>

        {activeView.posts.length > 0 ? (
          <PostFeed
            posts={activeView.posts}
            locale={locale}
            showSchoolName
            showChannelName
            variant="discover"
            featuredCount={2}
          />
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-campus-primary/16 bg-white/68 p-10 text-center shadow-sm">
            <h3 className="font-headline text-2xl text-campus-primary">
              {copy.empty.filteredTitle}
            </h3>
            <p className="mt-2 text-sm leading-7 text-foreground/62">
              {copy.empty.filteredHint}
            </p>
          </section>
        )}
      </div>

      <DiscoverMetaRail
        copy={copy}
        schoolLinks={data.schoolLinks}
        channelLinks={data.channelLinks}
        tagChips={data.tagChips}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverExperience.int.spec.tsx
```

Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/components/discover/DiscoverHero.tsx src/app/(frontend)/components/discover/DiscoverTabs.tsx src/app/(frontend)/components/discover/DiscoverMetaRail.tsx src/app/(frontend)/components/discover/DiscoverExperience.tsx tests/int/frontend/discoverExperience.int.spec.tsx
git commit -m "feat: add homepage discovery interaction components"
```

## Task 5: Compose the Homepage and Wire the Route Entry

**Files:**
- Create: `src/app/(frontend)/components/discover/DiscoverHomepage.tsx`
- Modify: `src/app/(frontend)/page.tsx`
- Test: `tests/int/frontend/discoverHomepage.int.spec.tsx`

- [ ] **Step 1: Write the failing homepage smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DiscoverHomepage from '@/components/discover/DiscoverHomepage'
import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { Post, School, SchoolSubChannel, Tag, User } from '@/payload-types'

const dictionary = getDictionary('en-US')

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

const post = {
  id: 1,
  title: 'Night Market',
  slug: 'night-market',
  status: 'published',
  school,
  subChannel: channel,
  author,
  tags: [tag],
  excerpt: 'Night Market excerpt',
  content: { type: 'doc', content: [] },
  publishedAt: '2026-03-27T10:00:00.000Z',
  createdAt: '2026-03-27T10:00:00.000Z',
  updatedAt: '2026-03-27T10:00:00.000Z',
} as Post

describe('DiscoverHomepage', () => {
  it('renders the hero, search, tabs, and metadata rail together', () => {
    render(
      <DiscoverHomepage posts={[post]} locale="en-US" t={dictionary} />
    )

    expect(screen.getByText(dictionary.discoverHome.heroTitle)).toBeDefined()
    expect(screen.getByPlaceholderText(dictionary.common.searchPlaceholder)).toBeDefined()
    expect(screen.getByRole('tab', { name: dictionary.discoverHome.tabs.recommended })).toBeDefined()
    expect(screen.getByText(dictionary.discoverHome.sections.schoolHighlights)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverHomepage.int.spec.tsx
```

Expected: FAIL because `DiscoverHomepage` does not exist yet.
- [ ] **Step 3: Compose the homepage wrapper and route entry**

Create `src/app/(frontend)/components/discover/DiscoverHomepage.tsx`:

```tsx
import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import { buildDiscoverHomeData } from '@/app/(frontend)/lib/discoverPresentation'
import type { Post } from '@/payload-types'

import DiscoverExperience from './DiscoverExperience'
import DiscoverHero from './DiscoverHero'

type DiscoverHomepageProps = {
  posts: Post[]
  locale: AppLocale
  t: FrontendDictionary
}

export default function DiscoverHomepage({
  posts,
  locale,
  t,
}: DiscoverHomepageProps) {
  const data = buildDiscoverHomeData({
    posts,
    copy: t.discoverHome,
  })

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <DiscoverHero copy={t.discoverHome} featuredPost={data.featuredPost} />
        <DiscoverExperience
          data={data}
          locale={locale}
          searchPlaceholder={t.common.searchPlaceholder}
          copy={t.discoverHome}
        />
      </div>
    </section>
  )
}
```

Replace `src/app/(frontend)/page.tsx` with:

```tsx
import { cookies as getCookies } from 'next/headers.js'
import { headers as getHeaders } from 'next/headers.js'

import DiscoverHomepage from '@/components/discover/DiscoverHomepage'
import { getPublishedPosts } from './lib/cmsData'
import { getDictionary } from './lib/i18n/dictionaries'
import { resolveRequestLocale } from './lib/i18n/locale'

export default async function DiscoverPage() {
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const posts = await getPublishedPosts()

  return <DiscoverHomepage posts={posts} locale={locale} t={t} />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverHomepage.int.spec.tsx
```

Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/components/discover/DiscoverHomepage.tsx src/app/(frontend)/page.tsx tests/int/frontend/discoverHomepage.int.spec.tsx
git commit -m "feat: compose homepage discovery redesign"
```

## Task 6: Verification, Import Map Refresh, and Manual QA

**Files:**
- Verify: `src/app/(frontend)/page.tsx`
- Verify: `src/app/(frontend)/components/discover/*.tsx`
- Verify: `src/app/(frontend)/components/layout/SearchBar.tsx`
- Verify: `src/app/(frontend)/components/PostFeed.tsx`
- Verify: `src/app/(frontend)/components/PostCard.tsx`
- Verify: `src/app/(frontend)/components/layout/SidebarNav.tsx`

- [ ] **Step 1: Run the focused homepage test suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend/discoverDictionary.int.spec.ts tests/int/frontend/discoverPresentation.int.spec.ts tests/int/frontend/postFeedDiscover.int.spec.tsx tests/int/frontend/discoverExperience.int.spec.tsx tests/int/frontend/discoverHomepage.int.spec.tsx
```

Expected: PASS with all five frontend homepage specs passing.

- [ ] **Step 2: Refresh Payload import maps after component creation**

Run:

```bash
pnpm run generate:importmap
```

Expected: PASS and regenerate `src/app/(payload)/admin/importMap.js` if needed without schema changes.

- [ ] **Step 3: Run TypeScript verification**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS with zero TypeScript errors.

- [ ] **Step 4: Run the existing integration suite**

Run:

```bash
pnpm run test:int
```

Expected: PASS, including the existing Payload API spec plus the new homepage frontend specs.

- [ ] **Step 5: Run local visual verification**

Run:

```bash
pnpm run dev
```

Expected: Next.js starts successfully and serves the app locally.

Then manually verify `/` at:

- 375px: compact hero, search, tabs, feed, then metadata blocks
- 768px: balanced stacked layout with no horizontal overflow
- 1024px+: sidebar visually secondary, homepage content visually primary

Check these behaviors:

- new homepage copy appears in both `zh-CN` and `en-US`
- search field still focuses correctly
- tab switching updates section heading and feed/empty state
- leading homepage cards render with the discover emphasis
- no fixed element obscures first-screen content

- [ ] **Step 6: Commit**

```bash
git add src/app/(payload)/admin/importMap.js
git commit -m "test: verify homepage discovery redesign"
```

## Self-Review

### Spec coverage

- Homepage structure is covered in Tasks 2, 4, and 5.
- Visual adaptation and reduced sidebar dominance are covered in Task 3.
- i18n hard requirements are covered in Task 1 and re-verified in Task 6.
- Responsive and interaction verification are covered in Task 6.
- Reuse of existing components is preserved by modifying `SearchBar`, `PostFeed`, `PostCard`, and `SidebarNav` instead of replacing them.

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation notes remain.
- Each code-changing task includes concrete file names, commands, and code blocks.

### Type consistency

- The plan uses one consistent naming set: `discoverHome`, `DiscoverHomeData`, `DiscoverExperience`, `DiscoverHomepage`, and `nearbySchools`.
- The same i18n keys and view keys are reused across tests, helper code, and component props.


