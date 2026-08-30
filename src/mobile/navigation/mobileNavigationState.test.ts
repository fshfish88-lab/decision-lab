import { describe, expect, it } from 'vitest'

import { initialMobileNavigationState, mobileNavigationReducer } from './mobileNavigationState'

describe('mobileNavigationReducer', () => {
  it('tracks PUSH, REPLACE, and POP without using browser history length', () => {
    const pushed = mobileNavigationReducer(initialMobileNavigationState, {
      type: 'route-committed',
      navigationType: 'PUSH',
      pathname: '/history',
    })
    expect(pushed.historyDepth).toBe(1)
    expect(pushed.direction).toBe('forward')

    const replaced = mobileNavigationReducer(pushed, {
      type: 'route-committed',
      navigationType: 'REPLACE',
      pathname: '/statistics',
    })
    expect(replaced.historyDepth).toBe(1)

    const popped = mobileNavigationReducer(replaced, {
      type: 'route-committed',
      navigationType: 'POP',
      pathname: '/',
    })
    expect(popped.historyDepth).toBe(0)
    expect(popped.direction).toBe('back')
  })

  it('never decrements history depth below zero', () => {
    const popped = mobileNavigationReducer(initialMobileNavigationState, {
      type: 'route-committed',
      navigationType: 'POP',
      pathname: '/',
    })
    expect(popped.historyDepth).toBe(0)
  })

  it('keeps overlays ordered and removes a requested overlay idempotently', () => {
    const first = mobileNavigationReducer(initialMobileNavigationState, { type: 'overlay-added', id: 'first' })
    const second = mobileNavigationReducer(first, { type: 'overlay-added', id: 'second' })
    expect(second.overlayIds).toEqual(['first', 'second'])

    const removed = mobileNavigationReducer(second, { type: 'overlay-removed', id: 'second' })
    expect(removed.overlayIds).toEqual(['first'])
    expect(mobileNavigationReducer(removed, { type: 'overlay-removed', id: 'second' })).toEqual(removed)
  })

  it('clears exit pending when leaving home and ignores an old timeout token', () => {
    const armed = mobileNavigationReducer(initialMobileNavigationState, { type: 'exit-armed', token: 3 })
    const rearmed = mobileNavigationReducer(armed, { type: 'exit-armed', token: 4 })
    const staleTimeout = mobileNavigationReducer(rearmed, { type: 'exit-cleared', token: 3 })
    expect(staleTimeout.exitPending).toBe(true)

    const leftHome = mobileNavigationReducer(staleTimeout, {
      type: 'route-committed',
      navigationType: 'PUSH',
      pathname: '/history',
    })
    expect(leftHome.exitPending).toBe(false)
  })
})
