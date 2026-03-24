'use client'

import type { ReactNode } from 'react'
import { IconBrandGithub } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'

import type { AppLocale } from '@/app/(frontend)/lib/i18n/config'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import SidebarNav from '@/components/layout/SidebarNav'
import type { SidebarUser } from '@/lib/sessionTypes'
import { cn } from '@/lib/utils'

type SchoolItem = {
  id: string | number
  name: string
  slug: string
}

type FrontendChromeDictionary = {
  common: {
    appName: string
    appTagline: string
    createPost: string
    login: string
    register: string
    userCenter: string
    languageLabel: string
    languageZh: string
    languageEn: string
  }
  sidebar: {
    discover: string
    channels: string
    addChannel: string
  }
}

type FrontendChromeProps = {
  children: ReactNode
  currentUser: SidebarUser | null
  githubUrl?: string
  locale: AppLocale
  schools: SchoolItem[]
  t: FrontendChromeDictionary
}

const AUTH_ROUTES = new Set(['/login', '/register'])

export default function FrontendChrome({
  children,
  currentUser,
  githubUrl,
  locale,
  schools,
  t,
}: FrontendChromeProps) {
  const pathname = usePathname()
  const isEditorPage = pathname === '/editor'
  const isAuthPage = AUTH_ROUTES.has(pathname)
  const hideSidebar = isEditorPage || isAuthPage

  return (
    <>
      {hideSidebar ? null : (
        <SidebarNav schools={schools} locale={locale} t={t} currentUser={currentUser} />
      )}

      {isEditorPage ? null : (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <LanguageSwitcher
            locale={locale}
            label={t.common.languageLabel}
            zhLabel={t.common.languageZh}
            enLabel={t.common.languageEn}
            className="static"
          />
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-campus-primary/10 bg-white/70 text-campus-primary shadow-sm backdrop-blur-md transition-all hover:bg-white/90"
              aria-label="GitHub"
              title="GitHub"
            >
              <IconBrandGithub size={18} />
            </a>
          ) : null}
        </div>
      )}

      <main
        className={cn(
          'min-h-screen',
          !hideSidebar && 'lg:ml-72',
          isAuthPage && 'overflow-hidden',
        )}
      >
        {children}
      </main>
    </>
  )
}
