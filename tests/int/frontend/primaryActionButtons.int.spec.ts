import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Primary action buttons', () => {
  it('uses the global campus-primary button palette for the editor publish CTA without shifting to the secondary color on hover', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/editor/EditorForm.tsx'),
      'utf8',
    )

    expect(source).toContain('data-testid="editor-publish-button"')
    expect(source).toContain('rounded-full bg-campus-primary')
    expect(source).toContain('hover:-translate-y-0.5')
    expect(source).toContain('hover:shadow-[0_16px_32px_rgba(13,59,102,0.18)]')
    expect(source).not.toContain('hover:bg-campus-secondary')
    expect(source).not.toContain('MovingBorderButton')
  })

  it('keeps the save-draft button on the same rounded shape system', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/editor/EditorForm.tsx'),
      'utf8',
    )

    expect(source).toContain('data-testid="editor-save-draft-button"')
    expect(source).toContain('h-11 shrink-0 items-center justify-center gap-2 rounded-full')
  })

  it('uses the global campus-primary button palette for the sidebar create-post CTA without shifting to the secondary color on hover', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/components/layout/SidebarNav.tsx'),
      'utf8',
    )

    expect(source).toContain('data-testid="sidebar-create-post-button"')
    expect(source).toContain('rounded-full bg-campus-primary')
    expect(source).toContain('hover:-translate-y-0.5')
    expect(source).toContain('hover:shadow-[0_16px_32px_rgba(13,59,102,0.18)]')
    expect(source).not.toContain('hover:bg-campus-secondary')
    expect(source).not.toContain('MovingBorderLink')
  })
})
