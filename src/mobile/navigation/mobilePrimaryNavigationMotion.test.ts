import { describe, expect, it } from 'vitest'

import {
  getMobileRouteMotion,
  getPrimaryRouteDirection,
  getPrimaryRouteIndex,
} from './mobilePrimaryNavigationMotion'

describe('mobile primary navigation motion', () => {
  it('maps the four primary routes to stable indexes', () => {
    expect(getPrimaryRouteIndex('/')).toBe(0)
    expect(getPrimaryRouteIndex('/history')).toBe(1)
    expect(getPrimaryRouteIndex('/statistics')).toBe(2)
    expect(getPrimaryRouteIndex('/about')).toBe(3)
    expect(getPrimaryRouteIndex('/science')).toBeNull()
  })

  it('derives direction from primary route order', () => {
    expect(getPrimaryRouteDirection('/', '/statistics')).toBe(1)
    expect(getPrimaryRouteDirection('/about', '/history')).toBe(-1)
    expect(getPrimaryRouteDirection('/history', '/history')).toBe(0)
    expect(getPrimaryRouteDirection('/science', '/')).toBeNull()
  })

  it('uses a full-width 260ms scene for primary-to-primary navigation', () => {
    expect(getMobileRouteMotion('/', '/statistics', 'forward', false)).toMatchObject({
      kind: 'primary',
      enterX: '100%',
      exitX: '-100%',
      enterOpacity: 0.98,
      duration: 0.26,
    })
    expect(getMobileRouteMotion('/about', '/history', 'forward', false)).toMatchObject({
      kind: 'primary',
      enterX: '-100%',
      exitX: '100%',
    })
  })

  it('preserves subtle flow motion and removes displacement for reduced motion', () => {
    expect(getMobileRouteMotion('/', '/science', 'forward', false)).toMatchObject({
      kind: 'flow',
      enterX: 10,
      exitX: -10,
      duration: 0.22,
    })
    expect(getMobileRouteMotion('/science', '/', 'back', false)).toMatchObject({
      kind: 'flow',
      enterX: -10,
      exitX: 10,
    })
    expect(getMobileRouteMotion('/', '/statistics', 'forward', true)).toMatchObject({
      kind: 'primary',
      enterX: 0,
      exitX: 0,
      duration: 0.08,
    })
  })
})
