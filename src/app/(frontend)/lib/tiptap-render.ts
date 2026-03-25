import { extractTextFromTiptapJson } from './tiptap-text'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderTiptapHtml(content: unknown): string {
  // Keep this helper Cloudflare-safe by avoiding server-side Tiptap HTML rendering.
  // Rich rendering should happen through the client-side Tiptap read-only component.
  const text = extractTextFromTiptapJson(content, 24000)
  if (!text) return ''

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')
}
