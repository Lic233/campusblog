import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'

import FrontendChrome from '@/components/layout/FrontendChrome'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getCurrentFrontendUser, toSidebarUser } from '@/lib/frontendSession'
import { getDictionary } from './lib/i18n/dictionaries'
import { resolveRequestLocale } from './lib/i18n/locale'
import { getActiveSchools } from './lib/cmsData'
import './styles.css'

export async function generateMetadata() {
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)

  return {
    title: t.common.appName,
    description: t.common.appDescription,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const githubUrl = process.env.GITHUB_URL
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)

  const [schools, currentUser] = await Promise.all([
    getActiveSchools(),
    getCurrentFrontendUser(headers),
  ])

  const schoolItems = schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }))

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&family=Noto+Sans+SC:wght@400;500&family=Manrope:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-campus-surface font-body text-campus-on-surface antialiased">
        <TooltipProvider delayDuration={300}>
          <FrontendChrome
            schools={schoolItems}
            locale={locale}
            t={t}
            currentUser={toSidebarUser(currentUser)}
            githubUrl={githubUrl}
          >
            {children}
          </FrontendChrome>
        </TooltipProvider>
      </body>
    </html>
  )
}
