'use client'

import type { JSONContent } from '@tiptap/core'
import { useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

import { TiptapEditor } from './TiptapEditor'
import { TiptapReadOnly } from './TiptapReadOnly'

/**
 * Payload Admin 中 `type: 'json'` 字段的自定义输入：用 Tiptap 替代默认 JSON 文本框。
 * 与全局 `richText` / Lexical 无关；正文类字段请使用本组件 + `json` 类型。
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
