import type { JSONField } from 'payload'

const TIPTAP_JSON_FIELD =
  '@/app/(frontend)/components/editor/TiptapPayloadJsonField#TiptapPayloadJsonField'
const TIPTAP_JSON_CELL =
  '@/app/(frontend)/components/editor/TiptapPayloadJsonCell#TiptapPayloadJsonCell'

export const tiptapJsonAdminComponents: NonNullable<JSONField['admin']>['components'] = {
  Field: TIPTAP_JSON_FIELD,
  Cell: TIPTAP_JSON_CELL,
}
