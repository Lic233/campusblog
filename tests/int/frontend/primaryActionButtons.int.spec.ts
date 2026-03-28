import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Primary action buttons', () => {
  it('reuses the shared primary action button component for the editor publish CTA', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/editor/EditorForm.tsx'),
      'utf8',
    )

    expect(source).toContain("import { PrimaryActionButton } from '@/components/ui/primary-action-button'")
    expect(source).toContain('data-testid="editor-publish-button"')
    expect(source).toContain('<PrimaryActionButton')
  })

  it('keeps the save-draft button on the same rounded shape system', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/editor/EditorForm.tsx'),
      'utf8',
    )

    expect(source).toContain('data-testid="editor-save-draft-button"')
    expect(source).toContain('h-11 shrink-0 items-center justify-center gap-2 rounded-full')
  })

  it('reuses the shared primary action button component for the sidebar create-post CTA', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/layout/SidebarNav.tsx'),
      'utf8',
    )

    expect(source).toContain("import { PrimaryActionButton } from '@/components/ui/primary-action-button'")
    expect(source).toContain('data-testid="sidebar-create-post-button"')
    expect(source).toContain('<PrimaryActionButton')
  })

  it('reuses the shared primary action button component for the user-center write button', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/user/me/page.tsx'),
      'utf8',
    )

    expect(source).toContain("import { PrimaryActionButton } from '@/components/ui/primary-action-button'")
    expect(source).toContain('data-testid="write-article-button"')
    expect(source).toContain('<PrimaryActionButton')
  })
})
