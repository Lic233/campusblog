// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'

const config = defineCloudflareConfig({})

const openNextConfig = {
  ...config,
  edgeExternals: [
    ...(config.edgeExternals ?? []),
    '@payloadcms/db-d1-sqlite',
    '@payloadcms/drizzle',
    'drizzle-kit',
    'drizzle-orm',
  ],
}

export default openNextConfig
