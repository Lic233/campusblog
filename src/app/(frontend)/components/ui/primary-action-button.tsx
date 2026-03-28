'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PrimaryActionButtonProps = React.ComponentProps<typeof Button>

export function PrimaryActionButton({
  className,
  children,
  ...props
}: PrimaryActionButtonProps) {
  return (
    <Button
      className={cn(
        'h-11 rounded-full bg-campus-primary px-5 font-label text-base font-bold text-white shadow-[0_12px_24px_rgba(13,59,102,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-campus-primary hover:shadow-[0_16px_32px_rgba(13,59,102,0.18)]',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
