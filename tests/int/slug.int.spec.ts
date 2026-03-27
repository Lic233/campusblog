import { describe, expect, it } from 'vitest'

import { ensureUniqueSlug, formatSlugValue } from '@/fields/slug'

describe('slug helpers', () => {
  it('formats plain text into a normalized slug', () => {
    expect(formatSlugValue('  Campus News  ')).toBe('campus-news')
  })

  it('transliterates non-latin input when direct slugify is empty', () => {
    expect(formatSlugValue(String.fromCodePoint(0x4E2D, 0x6587, 0x6807, 0x9898))).toBe('zhong-wen-biao-ti')
  })

  it('returns the original slug when no collision exists', async () => {
    const slug = await ensureUniqueSlug({
      slug: 'campus-news',
      lookup: async () => null,
    })

    expect(slug).toBe('campus-news')
  })

  it('adds a numeric suffix when the base slug is already occupied', async () => {
    const slug = await ensureUniqueSlug({
      slug: 'campus-news',
      lookup: async (candidate) => {
        if (candidate === 'campus-news') return 'existing-id'
        return null
      },
    })

    expect(slug).toBe('campus-news-2')
  })

  it('skips collisions until it finds the next open suffix', async () => {
    const occupied = new Map<string, string>([
      ['campus-news', 'post-1'],
      ['campus-news-2', 'post-2'],
      ['campus-news-3', 'post-3'],
    ])

    const slug = await ensureUniqueSlug({
      slug: 'campus-news',
      lookup: async (candidate) => occupied.get(candidate) ?? null,
    })

    expect(slug).toBe('campus-news-4')
  })

  it('does not rename a document when the occupied slug belongs to itself', async () => {
    const slug = await ensureUniqueSlug({
      slug: 'campus-news',
      currentDocumentID: 'post-1',
      lookup: async (candidate) => {
        if (candidate === 'campus-news') return 'post-1'
        return null
      },
    })

    expect(slug).toBe('campus-news')
  })
})

