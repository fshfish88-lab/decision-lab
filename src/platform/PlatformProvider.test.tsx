import { describe, expect, it } from 'vitest'

import { resolvePlatform } from './PlatformContext'

describe('resolvePlatform', () => {
  it('uses the app interface on a native platform', () => {
    expect(resolvePlatform({ native: true, preview: null, isDev: false })).toBe('app')
  })

  it('uses the web interface in a normal browser', () => {
    expect(resolvePlatform({ native: false, preview: null, isDev: false })).toBe('web')
  })

  it('allows the app preview only during development', () => {
    expect(resolvePlatform({ native: false, preview: 'app', isDev: true })).toBe('app')
    expect(resolvePlatform({ native: false, preview: 'app', isDev: false })).toBe('web')
  })
})
