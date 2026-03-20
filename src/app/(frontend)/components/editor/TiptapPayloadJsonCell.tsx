'use client'

import type { DefaultCellComponentProps } from 'payload'
import type { JSONFieldClient } from 'payload'

import { tiptapJsonToPlainText } from '@/lib/tiptapSerialize'

/**
 * 列表视图中的 JSON 正文预览：纯文本摘要，避免每行挂载完整 Tiptap。
 */
export function TiptapPayloadJsonCell(props: DefaultCellComponentProps<JSONFieldClient>) {
  const raw = props.cellData
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      parsed = null
    }
  }
  const text = tiptapJsonToPlainText(parsed).replace(/\s+/g, ' ').trim()
  const preview = text.length > 120 ? `${text.slice(0, 120)}…` : text

  return (
    <span className="line-clamp-2 text-sm opacity-80" title={text || undefined}>
      {preview || '—'}
    </span>
  )
}
