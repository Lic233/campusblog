'use client'

import { useState } from 'react'
import { IconSearch } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  placeholder: string
  className?: string
  inputClassName?: string
}

export default function SearchBar({
  placeholder,
  className,
  inputClassName,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className={cn(
        'relative w-full max-w-xl transition-all duration-300',
        focused && 'scale-[1.02]',
        className,
      )}
    >
      <div
        className={cn(
          'absolute -inset-0.5 rounded-full bg-gradient-to-r from-campus-primary/20 via-campus-teal/20 to-campus-accent/20 opacity-0 blur-sm transition-opacity duration-300',
          focused && 'opacity-100',
        )}
      />
      <div className="relative flex items-center">
        <IconSearch
          size={18}
          className={cn(
            'absolute left-4 z-10 transition-colors duration-200',
            focused ? 'text-campus-primary' : 'text-campus-outline',
          )}
        />
        <Input
          type="text"
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'h-11 w-full rounded-full border-campus-primary/10 bg-white/80 pl-12 pr-5 font-label text-base shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-foreground/40 focus-visible:border-campus-primary/30 focus-visible:ring-campus-primary/10',
            inputClassName,
          )}
        />
      </div>
    </div>
  )
}
