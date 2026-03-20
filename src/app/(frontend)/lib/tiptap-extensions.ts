import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

/**
 * Shared extension list for both the editor and read-only renderer.
 * Add/remove extensions here to keep the schema in sync across all usage sites.
 */
export const tiptapExtensions: Extensions = [StarterKit]
