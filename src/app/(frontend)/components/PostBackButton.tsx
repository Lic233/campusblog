'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'

type PostBackButtonProps = {
  fallbackHref: string
  label: string
}

export default function PostBackButton({ fallbackHref, label }: PostBackButtonProps) {
  const router = useRouter()

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault()
          router.back()
        }
      }}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-campus-primary/10 px-3 py-1.5 text-xs font-label font-semibold text-campus-primary transition-colors hover:border-campus-primary/18 hover:bg-campus-panel-soft hover:text-campus-secondary"
    >
      <IconArrowLeft size={14} />
      {label}
    </Link>
  )
}
