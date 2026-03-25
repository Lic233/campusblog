import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrSelf, hasAdminRole } from '@/access/admin'
import {
  cleanupDetachedUserMediaAfterChange,
  cleanupDetachedUserMediaAfterDelete,
} from '@/hooks/cleanupDetachedUserMedia'
import { preventAdminPasswordChange } from '@/hooks/preventAdminPasswordChange'

const canReadOwnOrAdmin = ({
  req: { user },
  doc,
}: {
  doc?: { id?: number | string | null } | null
  req: { user?: { id?: number | string | null; roles?: string[] | null } | null }
}) => {
  if (hasAdminRole(user ?? null)) return true
  if (!user?.id || !doc?.id) return false
  return String(user.id) === String(doc.id)
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/UserPasswordChangeNotice'],
      },
    },
    defaultColumns: ['displayName', 'email', 'roles', 'isActive', 'updatedAt'],
    useAsTitle: 'displayName',
  },
  auth: true,
  access: {
    read: adminOrSelf,
    create: () => true,
    update: adminOrSelf,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [preventAdminPasswordChange],
    afterChange: [cleanupDetachedUserMediaAfterChange],
    afterDelete: [cleanupDetachedUserMediaAfterDelete],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Public name shown in article bylines and profile cards.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short profile biography shown on user-facing profile sections.',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile image displayed for the user across the site.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: {
        create: ({ req: { user } }) => hasAdminRole(user),
        update: ({ req: { user } }) => hasAdminRole(user),
      },
      admin: {
        description: 'Controls whether this account can access author features.',
        position: 'sidebar',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['user'],
      saveToJWT: true,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      access: {
        create: ({ req: { user } }) => hasAdminRole(user),
        read: canReadOwnOrAdmin,
        update: ({ req: { user } }) => hasAdminRole(user),
      },
      admin: {
        description:
          'Admin role controls privileged operations in Payload collections/endpoints. Keep at least one admin role account.',
        position: 'sidebar',
      },
    },
    {
      name: 'quotaBytes',
      type: 'number',
      min: 0,
      defaultValue: 104857600,
      access: {
        create: ({ req: { user } }) => hasAdminRole(user),
        read: canReadOwnOrAdmin,
        update: ({ req: { user } }) => hasAdminRole(user),
      },
      admin: {
        description: 'Publishing quota in bytes. Default is 100MB.',
        position: 'sidebar',
      },
    },
    {
      name: 'usedBytes',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: {
        create: ({ req: { user } }) => hasAdminRole(user),
        read: canReadOwnOrAdmin,
        update: ({ req: { user } }) => hasAdminRole(user),
      },
      admin: {
        description: 'Current total published bytes (text + media).',
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
