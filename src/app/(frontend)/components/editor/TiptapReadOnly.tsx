'use client'

import type { JSONContent } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'

import { tiptapExtensions } from '../../lib/tiptap-extensions'

export type TiptapReadOnlyProps = {
  content: JSONContent | null | undefined
  className?: string
}

/**
 * Renders stored ProseMirror JSON as read-only output in the browser.
 * Uses the same extension set as TiptapEditor so the schema stays consistent.
 */
export function TiptapReadOnly({ content, className = '' }: TiptapReadOnlyProps) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: content ?? { type: 'doc', content: [] },
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-readonly px-3 py-2',
      },
    },
  })

  if (!editor) {
    return (
      <div className={`rounded-md border border-transparent min-h-[4rem] ${className}`}>
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <div className={`tiptap-editor tiptap-readonly-wrap rounded-md border border-border ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}
