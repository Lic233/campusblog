'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { extractApiError } from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RegisterDictionary = {
  auth: {
    displayNameLabel: string
    emailLabel: string
    passwordLabel: string
    confirmPasswordLabel: string
    registerButton: string
    registerPending: string
    registerError: string
    missingDisplayName: string
    missingEmail: string
    missingPassword: string
    missingConfirmPassword: string
    passwordMismatch: string
    haveAccount: string
    goLogin: string
  }
}

type RegisterFormProps = {
  nextPath: string
  loginHref: string
  t: RegisterDictionary
  hideSwitchHint?: boolean
}

export default function RegisterForm({
  nextPath,
  loginHref,
  t,
  hideSwitchHint = false,
}: RegisterFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!displayName.trim()) {
      setError(t.auth.missingDisplayName)
      return
    }

    if (!email.trim()) {
      setError(t.auth.missingEmail)
      return
    }

    if (!password) {
      setError(t.auth.missingPassword)
      return
    }

    if (!confirmPassword) {
      setError(t.auth.missingConfirmPassword)
      return
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const registerResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
        }),
      })

      const registerPayload = await registerResponse.json().catch((): null => null)
      if (!registerResponse.ok) {
        setError(extractApiError(registerPayload, t.auth.registerError))
        return
      }

      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const loginPayload = await loginResponse.json().catch((): null => null)
      if (!loginResponse.ok) {
        setError(extractApiError(loginPayload, t.auth.registerError))
        return
      }

      router.replace(nextPath)
      router.refresh()
    } catch {
      setError(t.auth.registerError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label className="font-label text-sm text-foreground/70">
          {t.auth.displayNameLabel}
        </Label>
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="nickname"
          className="h-10 rounded-xl bg-white/75"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-label text-sm text-foreground/70">{t.auth.emailLabel}</Label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className="h-10 rounded-xl bg-white/75"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-label text-sm text-foreground/70">{t.auth.passwordLabel}</Label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="h-10 rounded-xl bg-white/75"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-label text-sm text-foreground/70">
          {t.auth.confirmPasswordLabel}
        </Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          className="h-10 rounded-xl bg-white/75"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-label text-red-700">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-campus-primary text-white hover:bg-campus-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? t.auth.registerPending : t.auth.registerButton}
      </Button>

      {hideSwitchHint ? null : (
        <p className="text-center text-sm font-label text-foreground/55">
          {t.auth.haveAccount}{' '}
          <Link className="text-campus-primary no-underline hover:underline" href={loginHref}>
            {t.auth.goLogin}
          </Link>
        </p>
      )}
    </form>
  )
}
