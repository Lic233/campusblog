/**
 * 从 Tiptap / ProseMirror JSON 提取纯文本，供 Admin 列表等轻量展示。
 */
export function tiptapJsonToPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { type?: string; text?: string; content?: unknown[] }
  if (n.type === 'text' && typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) {
    return n.content.map(tiptapJsonToPlainText).filter(Boolean).join(' ')
  }
  return ''
}
