'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconLoader2, IconTrash } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

type UserPostActionsProps = {
  actionHref?: string | null
  actionLabel?: string
  confirmLabel: string
  deleteErrorLabel: string
  deleteLabel: string
  deletingLabel: string
  postId: number | string
}

export default function UserPostActions({
  actionHref,
  actionLabel,
  confirmLabel,
  deleteErrorLabel,
  deleteLabel,
  deletingLabel,
  postId,
}: UserPostActionsProps) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(confirmLabel)) return

    setDeleteError('')
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/editor/posts/${encodeURIComponent(String(postId))}`, {
        method: 'DELETE',
      })
      const payload = (await response.json().catch((): null => null)) as { error?: string } | null

      if (!response.ok) {
        setDeleteError(payload?.error || deleteErrorLabel)
        return
      }

      router.refresh()
    } catch {
      setDeleteError(deleteErrorLabel)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      {actionHref && actionLabel ? (
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-campus-primary/10 bg-white/70 text-campus-primary hover:bg-campus-primary/5"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        className="rounded-xl"
        disabled={isDeleting}
        onClick={() => {
          void handleDelete()
        }}
      >
        {isDeleting ? <IconLoader2 size={16} className="animate-spin" /> : <IconTrash size={16} />}
        {isDeleting ? deletingLabel : deleteLabel}
      </Button>

      {deleteError ? <p className="max-w-[13rem] text-right text-xs text-destructive">{deleteError}</p> : null}
    </div>
  )
}
