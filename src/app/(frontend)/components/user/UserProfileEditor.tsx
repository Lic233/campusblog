'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconCamera, IconLoader2 } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadMediaFile } from '../../lib/mediaUpload'

type UserProfileEditorProps = {
  avatarUrl?: string
  bio?: string | null
  copy: {
    avatarHint: string
    avatarUpload: string
    bioLabel: string
    displayNameLabel: string
    emailLabel: string
    noBio: string
    profileError: string
    profileSaved: string
    saveProfile: string
    savingProfile: string
  }
  displayName: string
  email: string
  userId: number | string
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback

  if ('errors' in payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const firstError = payload.errors[0]
    if (firstError && typeof firstError === 'object' && 'message' in firstError) {
      const message = firstError.message
      if (typeof message === 'string' && message.trim()) return message
    }
  }

  if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  return fallback
}

export default function UserProfileEditor({
  avatarUrl,
  bio,
  copy,
  displayName,
  email,
  userId,
}: UserProfileEditorProps) {
  const router = useRouter()
  const [nextDisplayName, setNextDisplayName] = useState(displayName)
  const [nextBio, setNextBio] = useState(bio ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUrl = useMemo(() => {
    if (!selectedFile) return avatarUrl
    return URL.createObjectURL(selectedFile)
  }, [avatarUrl, selectedFile])

  useEffect(() => {
    if (!selectedFile || !previewUrl) return

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl, selectedFile])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedDisplayName = nextDisplayName.trim()
    if (!trimmedDisplayName) {
      setError(copy.profileError)
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      let avatarId: string | number | null = null

      if (selectedFile) {
        const media = await uploadMediaFile({
          fallbackError: copy.profileError,
          file: selectedFile,
          kind: 'avatar',
          seed: userId,
        })
        avatarId = media.id
      }

      const updateResponse = await fetch(`/api/users/${encodeURIComponent(String(userId))}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: trimmedDisplayName,
          bio: nextBio.trim(),
          ...(avatarId ? { avatar: avatarId } : {}),
        }),
      })
      const updatePayload = await updateResponse.json().catch((): null => null)

      if (!updateResponse.ok) {
        setError(extractMessage(updatePayload, copy.profileError))
        return
      }

      setSelectedFile(null)
      setSuccess(copy.profileSaved)
      router.refresh()
    } catch {
      setError(copy.profileError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-20 w-20 border border-campus-primary/10">
            {previewUrl ? <AvatarImage src={previewUrl} alt={nextDisplayName} /> : null}
            <AvatarFallback className="bg-campus-surface-container text-xl text-campus-primary">
              {nextDisplayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-campus-primary/10 bg-campus-primary/5 px-3 py-2 text-sm font-label text-campus-primary transition-colors hover:bg-campus-primary/10">
            <IconCamera size={16} />
            {copy.avatarUpload}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null)
                setError('')
                setSuccess('')
              }}
            />
          </label>
          <p className="max-w-[12rem] text-center text-xs font-label text-foreground/45">
            {copy.avatarHint}
          </p>
        </div>

        <div className="grid min-w-0 flex-1 gap-4">
          <div className="space-y-2">
            <Label className="font-label text-sm text-foreground/70">
              {copy.displayNameLabel}
            </Label>
            <Input
              value={nextDisplayName}
              onChange={(event) => {
                setNextDisplayName(event.target.value)
                setSuccess('')
              }}
              className="h-11 rounded-xl bg-white/75"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-label text-sm text-foreground/70">{copy.emailLabel}</Label>
            <Input value={email} disabled className="h-11 rounded-xl bg-white/55 text-foreground/55" />
          </div>

          <div className="space-y-2">
            <Label className="font-label text-sm text-foreground/70">{copy.bioLabel}</Label>
            <Textarea
              value={nextBio}
              onChange={(event) => {
                setNextBio(event.target.value)
                setSuccess('')
              }}
              className="min-h-28 rounded-xl bg-white/75 px-3 py-2.5"
              placeholder={copy.noBio}
              maxLength={280}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-label text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-label text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          className="h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? <IconLoader2 size={16} className="animate-spin" /> : null}
          {isSubmitting ? copy.savingProfile : copy.saveProfile}
        </Button>
      </div>
    </form>
  )
}
