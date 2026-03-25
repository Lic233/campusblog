// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'

const config = defineCloudflareConfig({})

export default {
  ...config,
  edgeExternals: [
    ...(config.edgeExternals ?? []),
    '@payloadcms/db-d1-sqlite',
    '@payloadcms/drizzle',
    'drizzle-kit',
    'drizzle-orm',
  ],
}
