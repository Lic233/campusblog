'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { isProtectedFrontendPath } from '@/lib/authNavigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type LogoutButtonProps = {
  label: string
  pendingLabel: string
  className?: string
}

export default function LogoutButton({ label, pendingLabel, className }: LogoutButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogout() {
    setIsSubmitting(true)

    try {
      await fetch('/api/users/logout', {
        method: 'POST',
      })
    } finally {
      if (isProtectedFrontendPath(pathname)) {
        router.replace('/')
      }
      router.refresh()
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-10 flex-1 rounded-xl border-campus-primary/10 bg-white/70 text-campus-primary hover:bg-campus-primary/5',
        className,
      )}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      {isSubmitting ? pendingLabel : label}
    </Button>
  )
}
