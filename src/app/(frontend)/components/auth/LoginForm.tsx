'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { extractApiError } from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LoginDictionary = {
  auth: {
    backToHome: string
    emailLabel: string
    passwordLabel: string
    loginButton: string
    loginPending: string
    loginError: string
    missingEmail: string
    missingPassword: string
    noAccount: string
    goRegister: string
  }
}

type LoginFormProps = {
  nextPath: string
  registerHref: string
  t: LoginDictionary
  hideSwitchHint?: boolean
}

export default function LoginForm({
  nextPath,
  registerHref,
  t,
  hideSwitchHint = false,
}: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setError(t.auth.missingEmail)
      return
    }

    if (!password) {
      setError(t.auth.missingPassword)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const payload = await response.json().catch((): null => null)

      if (!response.ok) {
        setError(extractApiError(payload, t.auth.loginError))
        return
      }

      router.replace(nextPath)
      router.refresh()
    } catch {
      setError(t.auth.loginError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label className="font-label text-sm text-foreground/70">{t.auth.emailLabel}</Label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-11 rounded-xl border-campus-border-soft bg-campus-panel"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-label text-sm text-foreground/70">{t.auth.passwordLabel}</Label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="h-11 rounded-xl border-campus-border-soft bg-campus-panel"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-label text-red-700">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-gradient-to-r from-campus-primary to-campus-secondary text-white hover:opacity-95"
        disabled={isSubmitting}
      >
        {isSubmitting ? t.auth.loginPending : t.auth.loginButton}
      </Button>

      {hideSwitchHint ? null : (
        <p className="text-center text-sm font-label text-foreground/55">
          {t.auth.noAccount}{' '}
          <Link className="text-campus-primary no-underline hover:underline" href={registerHref}>
            {t.auth.goRegister}
          </Link>
        </p>
      )}
    </form>
  )
}
