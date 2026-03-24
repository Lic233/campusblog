'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { FrontendDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'
import { buildAuthHref } from '@/lib/authNavigation'
import { cn } from '@/lib/utils'

import AuthShell from './AuthShell'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

type AuthMode = 'login' | 'register'

type AuthExperienceProps = {
  initialMode: AuthMode
  nextPath: string
  t: FrontendDictionary
}

export default function AuthExperience({
  initialMode,
  nextPath,
  t,
}: AuthExperienceProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [displayMode, setDisplayMode] = useState<AuthMode>(initialMode)
  const loginRef = useRef<HTMLDivElement | null>(null)
  const registerRef = useRef<HTMLDivElement | null>(null)
  const switchTimerRef = useRef<number | null>(null)
  const [panelHeight, setPanelHeight] = useState<number | null>(null)

  useEffect(() => {
    setMode(initialMode)
    setDisplayMode(initialMode)
  }, [initialMode])

  const loginHref = useMemo(() => buildAuthHref('/login', nextPath), [nextPath])
  const registerHref = useMemo(() => buildAuthHref('/register', nextPath), [nextPath])

  function updateMode(nextMode: AuthMode) {
    if (nextMode === mode) return
    const nextNode = nextMode === 'login' ? loginRef.current : registerRef.current

    if (nextNode) {
      setPanelHeight(nextNode.offsetHeight)
    }

    setMode(nextMode)

    const href = nextMode === 'login' ? loginHref : registerHref
    window.history.replaceState(window.history.state, '', href)

    if (switchTimerRef.current) {
      window.clearTimeout(switchTimerRef.current)
    }

    switchTimerRef.current = window.setTimeout(() => {
      setDisplayMode(nextMode)
      switchTimerRef.current = null
    }, 110)
  }

  useLayoutEffect(() => {
    const activeNode = displayMode === 'login' ? loginRef.current : registerRef.current
    if (!activeNode) return

    const updateHeight = () => {
      setPanelHeight(activeNode.offsetHeight)
    }

    updateHeight()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(activeNode)

    return () => {
      observer.disconnect()
    }
  }, [displayMode])

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        window.clearTimeout(switchTimerRef.current)
      }
    }
  }, [])

  return (
    <AuthShell
      appName={t.common.appName}
      mode={mode}
      headerMode={displayMode}
      loginTitle={t.auth.loginTitle}
      registerTitle={t.auth.registerTitle}
      loginDescription={t.auth.loginSubtitle}
      registerDescription={t.auth.registerSubtitle}
      backLabel={t.auth.backToHome}
      loginLabel={t.common.login}
      registerLabel={t.common.register}
      loginHref={loginHref}
      registerHref={registerHref}
      onModeChange={updateMode}
    >
      <div
        className="relative overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={panelHeight ? { height: `${panelHeight}px` } : undefined}
      >
        <div
          ref={loginRef}
          aria-hidden={displayMode !== 'login'}
          className={cn(
            'transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
            displayMode === 'login'
              ? 'relative translate-x-0 opacity-100 delay-75'
              : 'absolute inset-0 -translate-x-6 opacity-0 pointer-events-none delay-0',
          )}
        >
          <LoginForm
            nextPath={nextPath}
            registerHref={registerHref}
            t={t}
            hideSwitchHint
          />
        </div>

        <div
          ref={registerRef}
          aria-hidden={displayMode !== 'register'}
          className={cn(
            'transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
            displayMode === 'register'
              ? 'relative translate-x-0 opacity-100 delay-75'
              : 'absolute inset-0 translate-x-6 opacity-0 pointer-events-none delay-0',
          )}
        >
          <RegisterForm
            nextPath={nextPath}
            loginHref={loginHref}
            t={t}
            hideSwitchHint
          />
        </div>
      </div>
    </AuthShell>
  )
}
