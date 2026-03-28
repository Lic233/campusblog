import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { cookies as getCookies } from 'next/headers.js'
import { notFound } from 'next/navigation'

import SchoolTopBar from '@/components/layout/SchoolTopBar'
import { getDictionary } from '../../lib/i18n/dictionaries'
import { resolveRequestLocale } from '../../lib/i18n/locale'
import { getSchoolBySlug, getSubChannelsBySchool } from '../../lib/cmsData'

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const headers = await getHeaders()
  const cookies = await getCookies()
  const locale = resolveRequestLocale({
    cookieLocale: cookies.get('locale')?.value,
    acceptLanguage: headers.get('accept-language'),
  })
  const t = getDictionary(locale)

  const school = await getSchoolBySlug(slug)
  if (!school) {
    notFound()
  }

  const subChannels = await getSubChannelsBySchool(school.id)

  const channelItems = subChannels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
  }))

  return (
    <div>
      <SchoolTopBar
        schoolName={school.name}
        schoolSlug={school.slug}
        subChannels={channelItems}
        t={t}
      />
      {children}
    </div>
  )
}




