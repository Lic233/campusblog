import { cookies as getCookies } from 'next/headers.js'
import { headers as getHeaders } from 'next/headers.js'

import DiscoverHomepage from '@/components/discover/DiscoverHomepage'

import { getPublishedPosts } from './lib/cmsData'
import { getDictionary } from './lib/i18n/dictionaries'
import { resolveRequestLocale } from './lib/i18n/locale'

export default async function DiscoverPage() {
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const posts = await getPublishedPosts()

  return <DiscoverHomepage posts={posts} locale={locale} t={t} />
}
