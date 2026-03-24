import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { adminOrAuthor, adminOrPublishedOrAuthor, authenticated } from '@/access/admin'
import { setCurrentAuthor } from '@/hooks/setCurrentAuthor'

type RelationValue = number | string | { id?: number | string | null } | null | undefined

type CommentRelationData = {
  parent?: RelationValue
  post?: RelationValue
}

const extractRelationID = (value: RelationValue): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && (typeof value.id === 'number' || typeof value.id === 'string')) return value.id
  return null
}

const validateCommentParentRelation: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const nextData = (data ?? {}) as CommentRelationData
  const previousData = (originalDoc ?? {}) as CommentRelationData

  const parentID = extractRelationID(nextData.parent) ?? extractRelationID(previousData.parent)
  if (!parentID) return data

  const postID = extractRelationID(nextData.post) ?? extractRelationID(previousData.post)
  if (!postID) {
    throw new Error('Please select a post before selecting a parent comment.')
  }

  const currentID = extractRelationID((originalDoc as { id?: RelationValue } | null)?.id)
  if (currentID && String(currentID) === String(parentID)) {
    throw new Error('A comment cannot be its own parent.')
  }

  const parent = await req.payload.findByID({
    collection: 'comments',
    id: parentID,
    depth: 0,
    req,
  })

  const parentPostID = extractRelationID((parent as { post?: RelationValue }).post)
  if (!parentPostID || String(parentPostID) !== String(postID)) {
    throw new Error('Parent comment does not belong to the selected post.')
  }

  return data
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    defaultColumns: ['post', 'author', 'status', 'updatedAt'],
    useAsTitle: 'id',
  },
  access: {
    read: adminOrPublishedOrAuthor,
    create: authenticated,
    update: adminOrAuthor,
    delete: adminOrAuthor,
  },
  hooks: {
    beforeValidate: [setCurrentAuthor, validateCommentParentRelation],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
      admin: {
        description: 'Post that this comment belongs to.',
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      index: true,
      admin: {
        description: 'Optional parent comment for threaded replies.',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
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
        description: 'Moderation status. Hidden comments are excluded from public view.',
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Plain-text comment body.',
      },
    },
  ],
  timestamps: true,
}
