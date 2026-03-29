import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { r2Storage } from '@payloadcms/storage-r2'
import { buildConfig } from 'payload'
import type { PayloadLogger } from 'payload'
import { en } from 'payload/i18n/en'
import { zh } from 'payload/i18n/zh'
import { fileURLToPath } from 'url'

import { Comments } from '@/collections/Comments'
import { Media } from '@/collections/Media'
import { Posts } from '@/collections/Posts'
import { SchoolSubChannels } from '@/collections/SchoolSubChannels'
import { Schools } from '@/collections/Schools'
import { Tags } from '@/collections/Tags'
import { Users } from '@/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const srcDir = path.resolve(dirname, '..')

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as unknown as PayloadLogger

export type PayloadCloudflareEnv = {
  D1: D1Database
  R2: R2Bucket
}

export function createPayloadConfig(env: PayloadCloudflareEnv) {
  return buildConfig({
    admin: {
      user: Users.slug,
      importMap: {
        baseDir: srcDir,
      },
    },
    collections: [Users, Media, Schools, SchoolSubChannels, Tags, Posts, Comments],
    i18n: {
      fallbackLanguage: 'zh',
      supportedLanguages: {
        en,
        zh,
      },
    },
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
      outputFile: path.resolve(srcDir, 'payload-types.ts'),
    },
    db: sqliteD1Adapter({ binding: env.D1 }),
    logger: process.env.NODE_ENV === 'production' ? cloudflareLogger : undefined,
    plugins: [
      r2Storage({
        bucket: env.R2,
        collections: { media: true },
      }),
    ],
  })
}
