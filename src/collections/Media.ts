import type { CollectionConfig } from 'payload'

import { syncMediaQuotaAfterChange, syncMediaQuotaAfterDelete } from '@/hooks/syncMediaQuota'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [syncMediaQuotaAfterChange],
    afterDelete: [syncMediaQuotaAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
