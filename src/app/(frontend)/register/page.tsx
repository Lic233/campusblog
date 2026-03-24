import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'
import { redirect } from 'next/navigation'

import AuthExperience from '@/components/auth/AuthExperience'
import { sanitizeNextPath } from '@/lib/authNavigation'
import { getCurrentFrontendUser } from '@/lib/frontendSession'
import { getDictionary } from '../lib/i18n/dictionaries'
import { resolveRequestLocale } from '../lib/i18n/locale'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const [headers, cookies, rawSearchParams] = await Promise.all([
    getHeaders(),
    getCookies(),
    searchParams,
  ])

  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)
  const nextPath = sanitizeNextPath(rawSearchParams.next, '/user/me')
  const currentUser = await getCurrentFrontendUser(headers)

  if (currentUser) {
    redirect(nextPath === '/login' || nextPath === '/register' ? '/user/me' : nextPath)
  }

  return <AuthExperience initialMode="register" nextPath={nextPath} t={t} />
}
