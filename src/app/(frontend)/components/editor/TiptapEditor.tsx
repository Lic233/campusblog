'use client'

import type { JSONContent } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect } from 'react'

import { tiptapExtensions } from '../../lib/tiptap-extensions'

export type TiptapEditorProps = {
  content?: JSONContent | null
  onChange?: (json: JSONContent) => void
  className?: string
}

/**
 * Tiptap rich-text editor. Must be used in a Client Component.
 * `immediatelyRender: false` prevents hydration mismatches in Next.js App Router.
 */
export function TiptapEditor({ content, onChange, className = '' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: content ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-focus min-h-[12rem] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
  })

  useEffect(() => {
    if (!editor || content === undefined) return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(content)
    if (current !== next) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div
        className={`tiptap-editor rounded-md border border-input bg-background text-muted-foreground text-sm ${className}`}
        aria-hidden
      >
        <div className="min-h-[12rem] px-3 py-2">Loading editor…</div>
      </div>
    )
  }

  return (
    <div className={`tiptap-editor rounded-md border border-input bg-background ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}
