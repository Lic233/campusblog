import enUS from '../../locales/en-US.json'
import zhCN from '../../locales/zh-CN.json'
import { DEFAULT_LOCALE, type AppLocale } from './config'

type Dictionary = typeof enUS

const dictionaries: Record<AppLocale, Dictionary> = {
  'en-US': enUS,
  'zh-CN': zhCN,
}

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}
