import { describe, expect, it } from 'vitest'

import { getDictionary } from '@/app/(frontend)/lib/i18n/dictionaries'

describe('discover homepage dictionary', () => {
  it('exposes homepage discovery copy in both locales', () => {
    const en = getDictionary('en-US')
    const zh = getDictionary('zh-CN')

    expect(en.discoverHome.heroTitle).toBeTruthy()
    expect(en.discoverHome.tabs.nearbySchools).toBeTruthy()
    expect(en.discoverHome.empty.filteredHint).toBeTruthy()

    expect(zh.discoverHome.heroTitle).toBeTruthy()
    expect(zh.discoverHome.tabs.nearbySchools).toBeTruthy()
    expect(zh.discoverHome.empty.filteredHint).toBeTruthy()
  })
})
