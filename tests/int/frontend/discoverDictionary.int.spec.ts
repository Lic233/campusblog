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

  it('keeps the zh-CN discover copy as readable Chinese text', () => {
    const zh = getDictionary('zh-CN')

    expect(zh.discoverHome.heroEyebrow).toBe('\u6821\u56ed\u6b64\u523b')
    expect(zh.discoverHome.heroTitle).toBe('\u4eca\u5929\uff0c\u6821\u56ed\u91cc\u7684\u4eba\u90fd\u5728\u804a\u4ec0\u4e48\uff1f')
    expect(zh.discoverHome.tabs.recommended).toBe('\u4e3a\u4f60\u63a8\u8350')
    expect(zh.discoverHome.tabListLabel).toBe('\u9996\u9875\u53d1\u73b0\u89c6\u56fe')
  })
})
