'use client'

import type { JSONContent } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect } from 'react'

import { tiptapExtensions } from '../../lib/tiptap-extensions'

export type TiptapReadOnlyProps = {
  content: JSONContent | null | undefined
  className?: string
  contentClassName?: string
  loadingClassName?: string
  bordered?: boolean
}

/**
 * Renders stored ProseMirror JSON as read-only output in the browser.
 * Uses the same extension set as TiptapEditor so the schema stays consistent.
 */
export function TiptapReadOnly({
  content,
  className = '',
  contentClassName = 'tiptap-readonly px-3 py-2',
  loadingClassName = '',
  bordered = true,
}: TiptapReadOnlyProps) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: content ?? { type: 'doc', content: [] },
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: contentClassName,
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    const nextContent = content ?? { type: 'doc', content: [] }
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(nextContent)

    if (current !== next) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className={`min-h-[4rem] ${className} ${loadingClassName}`.trim()}>
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div
      className={`tiptap-editor tiptap-readonly-wrap ${
        bordered ? 'rounded-md border border-border' : ''
      } ${className}`.trim()}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
