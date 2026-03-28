import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('User center primary CTAs', () => {
  it('keeps the write-article button aligned with the main interface button palette', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/user/me/page.tsx'),
      'utf8',
    )

    expect(source).toContain('data-testid="write-article-button"')
    expect(source).toContain('h-11 min-w-[11rem] flex-1 rounded-full')
    expect(source).toContain('bg-campus-primary')
    expect(source).toContain('hover:bg-campus-secondary')
  })
})
