import { act, render, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PlatformContext } from '../../platform/PlatformContext'
import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'
import { useNativeBackNavigation } from './useNativeBackNavigation'

const nativeAppMock = vi.hoisted(() => {
  const listeners = new Map<string, (event: { isActive?: boolean }) => void | Promise<void>>()
  const remove = vi.fn(async () => undefined)
  return {
    listeners,
    remove,
    addListener: vi.fn(async (eventName: string, listener: (event: { isActive?: boolean }) => void | Promise<void>) => {
      listeners.set(eventName, listener)
      return { remove }
    }),
    exitApp: vi.fn(async () => undefined),
  }
})

vi.mock('@capacitor/app', () => ({ App: nativeAppMock }))
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@capacitor/core')>()
  return { ...actual, Capacitor: { ...actual.Capacitor, isNativePlatform: () => true } }
})

function HookHarness(): null {
  useNativeBackNavigation()
  return null
}

function Wrapper({
  children,
  navigation,
}: PropsWithChildren<{ navigation: MobileNavigationValue }>): React.JSX.Element {
  return (
    <PlatformContext.Provider value="app">
      <MobileNavigationContext.Provider value={navigation}>{children}</MobileNavigationContext.Provider>
    </PlatformContext.Provider>
  )
}

function navigationValue(overrides: Partial<MobileNavigationValue> = {}): MobileNavigationValue {
  return {
    direction: 'forward',
    historyDepth: 0,
    exitPending: false,
    isRoot: true,
    navigateForward: vi.fn(),
    navigateBack: vi.fn(),
    registerOverlay: vi.fn(() => vi.fn()),
    closeTopOverlay: vi.fn(() => false),
    armExit: vi.fn(),
    clearExitPending: vi.fn(),
    ...overrides,
  }
}

describe('useNativeBackNavigation', () => {
  beforeEach(() => {
    nativeAppMock.listeners.clear()
    nativeAppMock.addListener.mockClear()
    nativeAppMock.exitApp.mockClear()
    nativeAppMock.remove.mockClear()
  })

  afterEach(() => vi.restoreAllMocks())

  async function renderHook(navigation: MobileNavigationValue) {
    const result = render(<HookHarness />, { wrapper: ({ children }) => <Wrapper navigation={navigation}>{children}</Wrapper> })
    await waitFor(() => expect(nativeAppMock.addListener).toHaveBeenCalledTimes(2))
    return result
  }

  it('closes the top overlay before changing routes or exiting', async () => {
    const navigation = navigationValue({ closeTopOverlay: vi.fn(() => true), historyDepth: 2 })
    await renderHook(navigation)

    await act(async () => nativeAppMock.listeners.get('backButton')?.({}))

    expect(navigation.closeTopOverlay).toHaveBeenCalledOnce()
    expect(navigation.navigateBack).not.toHaveBeenCalled()
    expect(nativeAppMock.exitApp).not.toHaveBeenCalled()
  })

  it('navigates back for internal history and for a direct non-root entry', async () => {
    const navigation = navigationValue({ historyDepth: 1 })
    const rendered = await renderHook(navigation)
    await act(async () => nativeAppMock.listeners.get('backButton')?.({}))
    expect(navigation.navigateBack).toHaveBeenCalledOnce()
    rendered.unmount()

    nativeAppMock.listeners.clear()
    nativeAppMock.addListener.mockClear()
    const directEntry = navigationValue({ isRoot: false })
    await renderHook(directEntry)
    await act(async () => nativeAppMock.listeners.get('backButton')?.({}))
    expect(directEntry.navigateBack).toHaveBeenCalledOnce()
  })

  it('arms exit on the first root back and exits on the second armed back', async () => {
    const firstBack = navigationValue()
    const rendered = await renderHook(firstBack)
    await act(async () => nativeAppMock.listeners.get('backButton')?.({}))
    expect(firstBack.armExit).toHaveBeenCalledOnce()
    expect(nativeAppMock.exitApp).not.toHaveBeenCalled()
    rendered.unmount()

    nativeAppMock.listeners.clear()
    nativeAppMock.addListener.mockClear()
    const secondBack = navigationValue({ exitPending: true })
    await renderHook(secondBack)
    await act(async () => nativeAppMock.listeners.get('backButton')?.({}))
    expect(nativeAppMock.exitApp).toHaveBeenCalledOnce()
  })

  it('clears exit pending in the background and removes both listeners on unmount', async () => {
    const navigation = navigationValue({ exitPending: true })
    const rendered = await renderHook(navigation)

    await act(async () => nativeAppMock.listeners.get('appStateChange')?.({ isActive: false }))
    expect(navigation.clearExitPending).toHaveBeenCalledOnce()

    rendered.unmount()
    await waitFor(() => expect(nativeAppMock.remove).toHaveBeenCalledTimes(2))
  })
})
