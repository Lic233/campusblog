'use client'

import { useRouter } from 'next/navigation'
import { IconLanguage } from '@tabler/icons-react'

import { SUPPORTED_LOCALES, type AppLocale } from '@/app/(frontend)/lib/i18n/config'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type LanguageSwitcherProps = {
  locale: AppLocale
  label: string
  zhLabel: string
  enLabel: string
  className?: string
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export default function LanguageSwitcher({
  locale,
  label,
  zhLabel,
  enLabel,
  className,
}: LanguageSwitcherProps) {
  const router = useRouter()

  const handleLocaleValueChange = (value: string) => {
    if (!isAppLocale(value) || value === locale) return
    document.cookie = `locale=${value}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; SameSite=Lax`
    router.refresh()
  }

  return (
    <div className={cn('fixed top-4 right-16 z-50', className)} aria-label={label}>
      <Select value={locale} onValueChange={handleLocaleValueChange}>
        <SelectTrigger
          className="h-9 gap-1.5 rounded-full bg-white/70 backdrop-blur-md shadow-sm border-campus-primary/10 hover:bg-white/90 transition-all px-3"
          aria-label={label}
        >
          <IconLanguage size={16} className="text-campus-primary shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectItem value="zh-CN">{zhLabel}</SelectItem>
            <SelectItem value="en-US">{enLabel}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
