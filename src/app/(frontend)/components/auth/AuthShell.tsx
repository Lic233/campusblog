import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconArrowLeft, IconLock, IconUserPlus } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

type AuthShellProps = {
  appName: string
  mode: 'login' | 'register'
  headerMode?: 'login' | 'register'
  loginTitle: string
  registerTitle: string
  loginDescription: string
  registerDescription: string
  backLabel: string
  loginLabel: string
  registerLabel: string
  loginHref: string
  registerHref: string
  onModeChange?: (mode: 'login' | 'register') => void
  children: ReactNode
}

export default function AuthShell({
  appName,
  mode,
  headerMode = mode,
  loginTitle,
  registerTitle,
  loginDescription,
  registerDescription,
  backLabel,
  loginLabel,
  registerLabel,
  loginHref,
  registerHref,
  onModeChange,
  children,
}: AuthShellProps) {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden px-5 py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,117,136,0.18),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(13,59,102,0.14),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f3f7fc_45%,#eef4fb_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(13,59,102,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(13,59,102,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_88%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-campus-teal/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-8 h-80 w-80 rounded-full bg-campus-primary/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-[1.75rem] border border-white/60 bg-white/72 p-5 shadow-[0_30px_120px_rgba(13,59,102,0.16)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-label text-xs uppercase tracking-[0.24em] text-campus-primary/45">
                {appName}
              </p>
              <div className="relative mt-1.5 min-h-[3.25rem] overflow-hidden sm:min-h-[3.75rem]">
                <h1
                  aria-hidden={headerMode !== 'login'}
                  className={cn(
                    'font-headline text-3xl font-bold text-campus-primary transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-4xl',
                    headerMode === 'login'
                      ? 'relative translate-y-0 opacity-100 delay-75'
                      : 'absolute inset-0 -translate-y-2 opacity-0',
                  )}
                >
                  {loginTitle}
                </h1>
                <h1
                  aria-hidden={headerMode !== 'register'}
                  className={cn(
                    'font-headline text-3xl font-bold text-campus-primary transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-4xl',
                    headerMode === 'register'
                      ? 'relative translate-y-0 opacity-100 delay-75'
                      : 'absolute inset-0 translate-y-2 opacity-0',
                  )}
                >
                  {registerTitle}
                </h1>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-campus-primary/10 bg-campus-primary/5 text-campus-primary shadow-sm">
              <div className="relative h-[22px] w-[22px] overflow-hidden">
                <IconLock
                  size={22}
                  aria-hidden={headerMode !== 'login'}
                  className={cn(
                    'absolute inset-0 transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                    headerMode === 'login'
                      ? 'translate-y-0 opacity-100 delay-75'
                      : '-translate-y-2 opacity-0',
                  )}
                />
                <IconUserPlus
                  size={22}
                  aria-hidden={headerMode !== 'register'}
                  className={cn(
                    'absolute inset-0 transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                    headerMode === 'register'
                      ? 'translate-y-0 opacity-100 delay-75'
                      : 'translate-y-2 opacity-0',
                  )}
                />
              </div>
            </div>
          </div>

          <div className="relative mt-3 min-h-[5rem] overflow-hidden sm:min-h-[4.5rem]">
            <p
              aria-hidden={headerMode !== 'login'}
              className={cn(
                'text-sm leading-7 text-foreground/62 transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[0.95rem]',
                headerMode === 'login'
                  ? 'relative translate-y-0 opacity-100 delay-75'
                  : 'absolute inset-0 -translate-y-2 opacity-0',
              )}
            >
              {loginDescription}
            </p>
            <p
              aria-hidden={headerMode !== 'register'}
              className={cn(
                'text-sm leading-7 text-foreground/62 transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[0.95rem]',
                headerMode === 'register'
                  ? 'relative translate-y-0 opacity-100 delay-75'
                  : 'absolute inset-0 translate-y-2 opacity-0',
              )}
            >
              {registerDescription}
            </p>
          </div>

          <div className="relative mt-3.5 grid grid-cols-2 rounded-[1.05rem] border border-campus-primary/10 bg-campus-primary/[0.04] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div
              className={cn(
                'pointer-events-none absolute bottom-1.5 top-1.5 z-0 w-[calc(50%-0.375rem)] rounded-[0.95rem] bg-white/95 shadow-[0_16px_36px_rgba(13,59,102,0.14)] ring-1 ring-white/70 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                mode === 'login' ? 'left-1.5' : 'left-[calc(50%+0.125rem)]',
              )}
            />
            <div
              className={cn(
                'pointer-events-none absolute bottom-2 z-0 h-8 w-[calc(50%-1rem)] rounded-full bg-campus-primary/10 blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                mode === 'login' ? 'left-3' : 'left-[calc(50%+0.25rem)]',
              )}
            />
            <Link
              href={loginHref}
              onClick={(event) => {
                if (!onModeChange || mode === 'login') return
                event.preventDefault()
                onModeChange('login')
              }}
              className={cn(
                'group relative z-10 inline-flex items-center justify-center rounded-[0.95rem] px-4 py-3 font-label text-sm font-semibold no-underline transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]',
                mode === 'login'
                  ? 'text-campus-primary'
                  : 'text-foreground/50 hover:text-campus-primary',
              )}
            >
              <span
                className={cn(
                  'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  mode === 'login'
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-px opacity-80 group-hover:opacity-100',
                )}
              >
                {loginLabel}
              </span>
            </Link>
            <Link
              href={registerHref}
              onClick={(event) => {
                if (!onModeChange || mode === 'register') return
                event.preventDefault()
                onModeChange('register')
              }}
              className={cn(
                'group relative z-10 inline-flex items-center justify-center rounded-[0.95rem] px-4 py-3 font-label text-sm font-semibold no-underline transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]',
                mode === 'register'
                  ? 'text-campus-primary'
                  : 'text-foreground/50 hover:text-campus-primary',
              )}
            >
              <span
                className={cn(
                  'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  mode === 'register'
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-px opacity-80 group-hover:opacity-100',
                )}
              >
                {registerLabel}
              </span>
            </Link>
          </div>

          <div className="mt-4 max-h-[min(50vh,28rem)] overflow-y-auto overscroll-contain rounded-[1.35rem] border border-campus-primary/10 bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:max-h-[min(52vh,29rem)] sm:p-5">
            {children}
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-label text-campus-primary/70 no-underline transition-colors hover:text-campus-primary"
            >
              <IconArrowLeft size={16} />
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
