'use client'

import { useRouter } from 'next/navigation'

import { SUPPORTED_LOCALES, type AppLocale } from '@/app/(frontend)/lib/i18n/config'
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
}: LanguageSwitcherProps) {
  const router = useRouter()

  const handleSwitchLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return

    document.cookie = `locale=${nextLocale}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; SameSite=Lax`
    router.refresh()
  }

  const handleLocaleValueChange = (value: string) => {
    if (!isAppLocale(value)) return
    handleSwitchLocale(value)
  }

  return (
    <div className="languageSwitcher" aria-label={label}>
      <Select value={locale} onValueChange={handleLocaleValueChange}>
        <SelectTrigger className="languageSwitcherSelect" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="zh-CN">{zhLabel}</SelectItem>
            <SelectItem value="en-US">{enLabel}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
