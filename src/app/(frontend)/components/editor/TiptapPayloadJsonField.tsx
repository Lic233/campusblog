'use client'

import type { JSONContent } from '@tiptap/core'
import { useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

import { TiptapEditor } from './TiptapEditor'
import { TiptapReadOnly } from './TiptapReadOnly'

/**
 * Custom field component for `type: 'json'` fields in the Payload admin.
 * Replaces the default JSON textarea with Tiptap. Not related to Lexical / richText.
 */
export const TiptapPayloadJsonField: JSONFieldClientComponent = (props) => {
  const { path, readOnly, field } = props
  const { value, setValue } = useField<JSONContent | null | undefined>({
    path,
    potentiallyStalePath: path,
  })

  if (readOnly || field?.admin?.readOnly) {
    return <TiptapReadOnly content={value ?? undefined} className="max-h-[24rem] overflow-y-auto" />
  }

  return (
    <TiptapEditor
      content={value ?? undefined}
      onChange={(json) => setValue(json)}
      className="max-h-[min(70vh,32rem)] overflow-y-auto"
    />
  )
}
