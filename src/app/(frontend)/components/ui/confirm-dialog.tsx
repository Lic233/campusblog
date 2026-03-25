'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  cancelLabel: string
  children?: ReactNode
  confirmLabel: string
  description: string
  disabled?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export function ConfirmDialog({
  cancelLabel,
  children,
  confirmLabel,
  description,
  disabled = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disabled) {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [disabled, onOpenChange, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={cancelLabel}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onOpenChange(false)
        }}
      />
      <div className="relative w-full max-w-sm rounded-[1.75rem] border border-campus-primary/10 bg-white/95 p-6 shadow-[0_24px_80px_rgba(13,59,102,0.18)]">
        <div className="flex items-start gap-3">
          {children ? <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">{children}</div> : null}
          <div className="min-w-0">
            <h3 className="font-headline text-2xl text-campus-primary">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/65">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={disabled}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl border border-destructive/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-destructive/60 hover:shadow-[0_10px_24px_rgba(220,38,38,0.18)]"
            disabled={disabled}
            onClick={() => {
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
