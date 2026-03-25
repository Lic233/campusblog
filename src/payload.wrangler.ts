import type { CloudflareContext } from '@opennextjs/cloudflare'

type PlatformProxyOptions = {
  environment?: string
  remoteBindings?: boolean
}

// Isolated so production bundling does not need to statically touch Wrangler internals.
export function getCloudflareContextFromWrangler(
  isProduction: boolean,
): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies PlatformProxyOptions),
  )
}
