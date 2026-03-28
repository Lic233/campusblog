'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconLoader2, IconTrash } from '@tabler/icons-react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'

type UserPostActionsProps = {
  actionHref?: string | null
  actionLabel?: string
  cancelLabel: string
  confirmActionLabel: string
  confirmLabel: string
  deleteErrorLabel: string
  deleteLabel: string
  deletingLabel: string
  postId: number | string
}

export default function UserPostActions({
  actionHref,
  actionLabel,
  cancelLabel,
  confirmActionLabel,
  confirmLabel,
  deleteErrorLabel,
  deleteLabel,
  deletingLabel,
  postId,
}: UserPostActionsProps) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
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

      setIsConfirmOpen(false)
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
          className="h-10 min-w-[9rem] justify-center rounded-full border-campus-border-soft bg-campus-panel text-campus-primary hover:bg-campus-panel-soft"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        className="h-10 min-w-[9rem] justify-center rounded-full border-2 border-destructive/70 bg-destructive/10 text-destructive shadow-[inset_0_0_0_1px_hsl(var(--destructive)/0.12)] transition-colors duration-200 hover:border-destructive hover:bg-destructive hover:text-white"
        disabled={isDeleting}
        onClick={() => {
          setDeleteError('')
          setIsConfirmOpen(true)
        }}
      >
        {isDeleting ? <IconLoader2 size={16} className="animate-spin" /> : <IconTrash size={16} />}
        {isDeleting ? deletingLabel : deleteLabel}
      </Button>

      {deleteError ? <p className="max-w-[13rem] text-right text-xs text-destructive">{deleteError}</p> : null}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={deleteLabel}
        description={confirmLabel}
        cancelLabel={cancelLabel}
        confirmLabel={isDeleting ? deletingLabel : confirmActionLabel}
        disabled={isDeleting}
        onConfirm={() => {
          void handleDelete()
        }}
      >
        {isDeleting ? <IconLoader2 size={20} className="animate-spin" /> : <IconTrash size={20} />}
      </ConfirmDialog>
    </div>
  )
}





