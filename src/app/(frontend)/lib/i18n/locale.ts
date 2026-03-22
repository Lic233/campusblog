import { DEFAULT_LOCALE, type AppLocale } from './config'

const aliasToLocale: Record<string, AppLocale> = {
  en: 'en-US',
  'en-us': 'en-US',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
}

function tryResolveSupportedLocale(locale: string | null | undefined): AppLocale | null {
  const normalized = locale?.trim().toLowerCase()
  if (!normalized) return null

  if (aliasToLocale[normalized]) return aliasToLocale[normalized]

  if (normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('en')) return 'en-US'

  return null
}

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  return tryResolveSupportedLocale(locale) ?? DEFAULT_LOCALE
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const languages = acceptLanguage.split(',').map((entry) => entry.split(';')[0].trim())

  for (const language of languages) {
    const locale = tryResolveSupportedLocale(language)
    if (locale) return locale
  }

  return DEFAULT_LOCALE
}

export function resolveRequestLocale(params: {
  cookieLocale?: string | null
  acceptLanguage?: string | null
}): AppLocale {
  const localeFromCookie = tryResolveSupportedLocale(params.cookieLocale)
  if (localeFromCookie) {
    return localeFromCookie
  }

  return resolveLocaleFromAcceptLanguage(params.acceptLanguage)
}
