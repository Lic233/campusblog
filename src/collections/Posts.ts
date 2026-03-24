import type { CollectionConfig } from 'payload'

import { adminOrAuthor, adminOrPublishedOrAuthor, authenticated } from '@/access/admin'
import { buildSlugField } from '@/fields/slug'
import { tiptapJsonAdminComponents } from '@/fields/tiptapJsonAdmin'
import { setCurrentAuthor } from '@/hooks/setCurrentAuthor'
import { setPublishedAt } from '@/hooks/setPublishedAt'
import { validatePostChannelRelation } from '@/hooks/validatePostChannelRelation'

type RelationValue = number | string | { id?: number | string | null } | null | undefined

const extractRelationID = (value: RelationValue): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && (typeof value.id === 'number' || typeof value.id === 'string')) return value.id
  return null
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'status', 'school', 'subChannel', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    read: adminOrPublishedOrAuthor,
    create: authenticated,
    update: adminOrAuthor,
    delete: adminOrAuthor,
  },
  hooks: {
    beforeValidate: [setCurrentAuthor, validatePostChannelRelation],
    beforeChange: [setPublishedAt],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Article title shown in listings and detail pages.',
      },
    },
    buildSlugField('title'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Hidden',
          value: 'hidden',
        },
      ],
      index: true,
      admin: {
        description: 'Publishing state. Hidden items stay inaccessible to public readers.',
        position: 'sidebar',
      },
    },
    {
      name: 'school',
      type: 'relationship',
      relationTo: 'schools',
      required: true,
      index: true,
      admin: {
        description: 'Primary school channel that owns this post.',
        position: 'sidebar',
      },
    },
    {
      name: 'subChannel',
      type: 'relationship',
      relationTo: 'school-sub-channels',
      index: true,
      filterOptions: ({ siblingData }) => {
        const schoolID = extractRelationID((siblingData as { school?: RelationValue }).school)

        if (!schoolID) {
          return {
            isActive: {
              equals: true,
            },
          }
        }

        return {
          and: [
            {
              school: {
                equals: schoolID,
              },
            },
            {
              isActive: {
                equals: true,
              },
            },
          ],
        }
      },
      admin: {
        description: 'Optional sub-channel. Must belong to the selected school.',
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'Author account from the Payload users collection.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: {
        isActive: {
          equals: true,
        },
      },
      admin: {
        description: 'Topic labels used for filtering and recommendations.',
        position: 'sidebar',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional thumbnail image used in cards and previews.',
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short summary shown in cards, feed items, and search results.',
      },
    },
    {
      name: 'content',
      type: 'json',
      required: true,
      admin: {
        description: 'Main article body stored as Tiptap JSON document.',
        components: tiptapJsonAdminComponents,
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'Auto-filled timestamp when status first changes to Published.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
    },
  ],
  timestamps: true,
}
